const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('components').select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
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
router.patch('/:id/stock', async (req, res) => {
  const { id } = req.params;
  const amountToAdd = Number(req.body?.amount);

  if (Number.isNaN(amountToAdd) || amountToAdd === 0) {
    return res
      .status(400)
      .json({ error: 'A non-zero numeric stock adjustment is required.' });
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
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from('components').delete().eq('id', id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ message: 'Component deleted successfully.' });
});

module.exports = router;