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

// Borrow Item (Check-out)
app.post('/api/borrow', async (req, res) => {
  const { component_id, borrower_name, quantity_borrowed } = req.body;

  const { data: comp, error: compError } = await supabase
    .from('components')
    .select('quantity, status')
    .eq('id', component_id)
    .single();

  if (compError || !comp) return res.status(404).json({ error: 'Component not found' });
  if (comp.quantity < quantity_borrowed) {
    return res.status(400).json({ error: 'Not enough stock available to borrow.' });
  }

  const { data: logData, error: logError } = await supabase
    .from('borrow_logs')
    .insert([{ component_id, borrower_name, quantity_borrowed, status: 'Borrowed' }])
    .select();

  if (logError) return res.status(400).json({ error: logError.message });

  const newQty = comp.quantity - quantity_borrowed;
  const newStatus = newQty === 0 ? 'Borrowed Out' : 'Available';

  await supabase
    .from('components')
    .update({ quantity: newQty, status: newStatus })
    .eq('id', component_id);

  res.status(201).json({ message: 'Component successfully checked out!', log: logData[0] });
});

// Return Item (Check-in)
app.patch('/api/return/:logId', async (req, res) => {
  const { logId } = req.params;

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
    .update({ status: 'Returned', returned_at: returnedAt })
    .eq('id', logId);

  if (updateLogError) {
    return res.status(400).json({ error: updateLogError.message });
  }

  const { data: component, error: compError } = await supabase
    .from('components')
    .select('id, quantity')
    .eq('id', log.component_id)
    .single();

  if (compError || !component) {
    return res.status(404).json({ error: 'Component not found.' });
  }

  const updatedQuantity = Number(component.quantity) + Number(log.quantity_borrowed);

  const { data: updatedComponent, error: updateCompError } = await supabase
    .from('components')
    .update({
      quantity: updatedQuantity,
      status: updatedQuantity > 0 ? 'Available' : 'Unavailable',
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
    component: updatedComponent,
  });
});

// Export to CSV (borrow logs)
app.get('/api/logs/export', async (req, res) => {
  const { data: logs, error } = await supabase
    .from('borrow_logs')
    .select(`
      id,
      borrower_name,
      quantity_borrowed,
      status,
      borrowed_at,
      returned_at,
      components ( name, category )
    `)
    .order('borrowed_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  let csv = 'Log ID,Component Name,Category,Borrower Name,Quantity,Status,Borrowed At,Returned At\n';

  logs.forEach((log) => {
    const compName = log.components?.name || 'Unknown';
    const compCat = log.components?.category || 'Unknown';
    csv += `"${log.id}","${compName}","${compCat}","${log.borrower_name}",${log.quantity_borrowed},"${log.status}","${log.borrowed_at}","${log.returned_at || 'Not Returned'}"\n`;
  });

  res.header('Content-Type', 'text/csv');
  res.attachment('componenthub-activity-logs.csv');
  res.send(csv);
});

// Get borrow logs with component info (with fallback if foreign key join isn't present)
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
    return res.status(400).json({ error: error.message, details: error.details, hint: error.hint });
  }

  res.json(data || []);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));