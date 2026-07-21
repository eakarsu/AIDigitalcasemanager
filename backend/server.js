const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));

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
app.use('/api/ai', require('./routes/aiNew'));





app.use('/api/ai', require('./routes/earlyIntervene'));
app.use('/api/ai', require('./routes/goalPredict'));
app.use('/api/ai', require('./routes/workloadBalance'));
app.use('/api/ai', require('./routes/serviceMatch'));
app.use('/api/ai', require('./routes/riskEscalate'));
app.use('/api/services-directory', require('./routes/servicesDirectory'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Custom Views: caseload-per-manager, case-stage heatmap, case-file PDF, workflow rules
// Mounted BEFORE any 404 / catch-all handler.
app.use('/api/custom-views', require('./routes/customViews'));
app.use('/api/consent-benefits-renewal', require('./routes/consentBenefitsRenewal'));
app.use('/api/matters', require('./routes/matters'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const start = async () => {
  try {
    // Schema changes are explicit migrations. Generated gap routers remain quarantined.

    app.listen(PORT, () => {
      console.log(`✅ Backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
