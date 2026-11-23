const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

// Login route for Admin / Student test accounts
router.post('/login', async (req, res) => {
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

module.exports = router;