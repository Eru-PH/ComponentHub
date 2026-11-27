const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

// Login route for existing accounts
router.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: 'Email and password are required.' });
  }

  const { data: user, error } = await supabase
    .from('user_accounts')
    .select('id, email, full_name, role, borrower_key')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  res.json({ user });
});

// Student registration route
router.post('/register', async (req, res) => {
  const fullName = String(req.body?.full_name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const borrowerKey = String(req.body?.borrower_key || '').trim() || null;

  if (!fullName || !email || !password) {
    return res
      .status(400)
      .json({ error: 'Full name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: 'Password must be at least 6 characters long.' });
  }

  const { data: existingUser, error: lookupError } = await supabase
    .from('user_accounts')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (lookupError) {
    return res
      .status(500)
      .json({ error: 'Failed to verify existing account.' });
  }

  if (existingUser) {
    return res
      .status(409)
      .json({ error: 'An account with this email already exists.' });
  }

  const { data: createdUser, error: insertError } = await supabase
    .from('user_accounts')
    .insert([
      {
        full_name: fullName,
        email,
        password,
        borrower_key: borrowerKey,
        role: 'student',
      },
    ])
    .select('id, email, full_name, role, borrower_key')
    .single();

  if (insertError) {
    return res
      .status(500)
      .json({ error: insertError.message || 'Failed to register account.' });
  }

  res.status(201).json({ user: createdUser });
});

module.exports = router;