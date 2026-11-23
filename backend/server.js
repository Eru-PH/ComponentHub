require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const componentRoutes = require('./routes/components');
const borrowLogRoutes = require('./routes/borrowLogs');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('ComponentHub Backend API is running!');
});

app.use('/api', authRoutes);
app.use('/api/components', componentRoutes);
app.use('/api', borrowLogRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));