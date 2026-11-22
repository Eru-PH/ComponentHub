require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

const ALLOWED_RETURN_QUALITIES = ['Good', 'Fair', 'Damaged'];

app.get('/', (req, res) => {
  res.send('ComponentHub Backend API is running!');
});

// Login route for Admin / Student test accounts
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('user_accounts')
    .select('id, email, full_name, role')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  res.json({ user });
});

app.get('/api/components', async (req, res) => {
  const { data, error } = await supabase.from('components').select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post('/api/components', async (req, res) => {
  const { name, category, quantity, status } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required.' });
  }

  const { data, error } = await supabase
    .from('components')
    .insert([
      {
        name: name.trim(),
        category: category.trim(),
        quantity: Number(quantity) || 0,
        status: status || 'Available',
      },
    ])
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data[0]);
});

// Add stock to a component (Admin Controls)
app.patch('/api/components/:id/stock', async (req, res) => {
  const { id } = req.params;
  const amountToAdd = Number(req.body?.amount);

  if (Number.isNaN(amountToAdd) || amountToAdd === 0) {
    return res.status(400).json({ error: 'A non-zero numeric stock adjustment is required.' });
  }

  const { data: comp, error: fetchError } = await supabase
    .from('components')
    .select('id, quantity, status')
    .eq('id', id)
    .single();

  if (fetchError || !comp) {
    return res.status(404).json({ error: 'Component not found.' });
  }

  const newQuantity = Math.max(0, (Number(comp.quantity) || 0) + amountToAdd);
  const nextStatus = newQuantity > 0 ? 'Available' : 'Borrowed Out';

  const { data: updated, error: updateError } = await supabase
    .from('components')
    .update({ quantity: newQuantity, status: nextStatus })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return res.status(400).json({ error: updateError.message });
  }

  res.json(updated);
});

// Delete component (Admin Controls)
app.delete('/api/components/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('components')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ message: 'Component deleted successfully.' });
});

// Borrow Item (Check-out)
app.post('/api/borrow', async (req, res) => {
  const { component_id, borrower_name, quantity_borrowed } = req.body;
  const qtyToBorrow = Number(quantity_borrowed) || 0;

  if (!component_id || !borrower_name || qtyToBorrow <= 0) {
    return res.status(400).json({
      error: 'component_id, borrower_name, and a positive quantity_borrowed are required.',
    });
  }

  const { data: comp, error: compError } = await supabase
    .from('components')
    .select('quantity, status')
    .eq('id', component_id)
    .single();

  if (compError || !comp) {
    return res.status(404).json({ error: 'Component not found' });
  }

  if (Number(comp.quantity) < qtyToBorrow) {
    return res.status(400).json({ error: 'Not enough stock available to borrow.' });
  }

  const { data: logData, error: logError } = await supabase
    .from('borrow_logs')
    .insert([
      {
        component_id,
        borrower_name: borrower_name.trim(),
        quantity_borrowed: qtyToBorrow,
        status: 'Borrowed',
      },
    ])
    .select();

  if (logError) {
    return res.status(400).json({ error: logError.message });
  }

  const newQty = Number(comp.quantity) - qtyToBorrow;
  const newStatus = newQty === 0 ? 'Borrowed Out' : 'Available';

  const { error: updateCompError } = await supabase
    .from('components')
    .update({ quantity: newQty, status: newStatus })
    .eq('id', component_id);

  if (updateCompError) {
    return res.status(400).json({ error: updateCompError.message });
  }

  res.status(201).json({
    message: 'Component successfully checked out!',
    log: logData[0],
  });
});

// Return Item (Check-in) with return_quality
app.patch('/api/return/:logId', async (req, res) => {
  const { logId } = req.params;
  const requestedQuality = req.body?.return_quality || 'Good';

  if (!ALLOWED_RETURN_QUALITIES.includes(requestedQuality)) {
    return res.status(400).json({
      error: 'Invalid return_quality. Must be Good, Fair, or Damaged.',
    });
  }

  const { data: log, error: logError } = await supabase
    .from('borrow_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (logError || !log) {
    return res.status(404).json({ error: 'Borrow log not found.' });
  }

  if (log.returned_at || log.status === 'Returned') {
    return res.status(400).json({ error: 'Item has already been returned.' });
  }

  const returnedAt = new Date().toISOString();

  const { error: updateLogError } = await supabase
    .from('borrow_logs')
    .update({
      status: 'Returned',
      returned_at: returnedAt,
      return_quality: requestedQuality,
    })
    .eq('id', logId);

  if (updateLogError) {
    return res.status(400).json({ error: updateLogError.message });
  }

  const { data: component, error: compError } = await supabase
    .from('components')
    .select('id, quantity, status')
    .eq('id', log.component_id)
    .single();

  if (compError || !component) {
    return res.status(404).json({ error: 'Component not found.' });
  }

  const isDamagedReturn = requestedQuality === 'Damaged';
  const currentQty = Number(component.quantity) || 0;
  const borrowedQty = Number(log.quantity_borrowed) || 0;

  const updatedQuantity = isDamagedReturn
    ? currentQty
    : currentQty + borrowedQty;

  const nextStatus =
    isDamagedReturn && updatedQuantity === 0
      ? 'Damaged'
      : updatedQuantity > 0
        ? 'Available'
        : 'Unavailable';

  const { data: updatedComponent, error: updateCompError } = await supabase
    .from('components')
    .update({
      quantity: updatedQuantity,
      status: nextStatus,
    })
    .eq('id', log.component_id)
    .select()
    .single();

  if (updateCompError) {
    return res.status(400).json({ error: updateCompError.message });
  }

  res.json({
    message: 'Item returned successfully.',
    returned_at: returnedAt,
    return_quality: requestedQuality,
    component: updatedComponent,
  });
});

// Get borrow logs with component info
app.get('/api/borrow-logs', async (req, res) => {
  const { data, error } = await supabase
    .from('borrow_logs')
    .select(`
      *,
      components (
        id,
        name,
        category
      )
    `)
    .order('borrowed_at', { ascending: false });

  if (error) {
    console.error('FULL SUPABASE ERROR:', JSON.stringify(error, null, 2));
    return res.status(400).json({
      error: error.message,
      details: error.details,
      hint: error.hint,
    });
  }

  res.json(data || []);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export to CSV (borrow logs)
app.get('/api/logs/export', async (req, res) => {
  const { data: logs, error } = await supabase
    .from('borrow_logs')
    .select(`
      id,
      borrower_name,
      quantity_borrowed,
      status,
      return_quality,
      borrowed_at,
      returned_at,
      components ( name, category )
    `)
    .order('borrowed_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  let csv =
    'Log ID, Component Name, Category, Borrower Name, Quantity, Status, Return Quality, Borrowed At, Returned At\n';

  logs.forEach((log) => {
    const compName = (log.components?.name || 'Unknown').replace(/"/g, '""');
    const compCat = (log.components?.category || 'Unknown').replace(/"/g, '""');
    const borrower = (log.borrower_name || '').replace(/"/g, '""');
    const quality = log.return_quality || 'N/A';

    csv += `"${log.id}", "${compName}", "${compCat}", "${borrower}", ${log.quantity_borrowed}, "${log.status}", "${quality}", "${log.borrowed_at}", "${log.returned_at || 'Not Returned'}"\n`;
  });

  res.header('Content-Type', 'text/csv');
  res.attachment('componenthub-activity-logs.csv');
  res.send(csv);
});