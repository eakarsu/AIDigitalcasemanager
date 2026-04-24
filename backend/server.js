const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });
const { initDB } = require('./db');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/beneficiaries', require('./routes/beneficiaries'));
app.use('/api/caseworkers', require('./routes/caseworkers'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/action-plans', require('./routes/actionPlans'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const start = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`✅ Backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
