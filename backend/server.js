const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' });
const { initDB } = require('./db');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

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

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const start = async () => {
  try {
    await initDB();
// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-beneficiaries-goals-referrals-lack-ai-endpoints-for-risk-pre', require('./routes/gap_beneficiaries_goals_referrals_lack_ai_endpoints_for_risk_pre'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-communications-lacks-generate-communication-plan', require('./routes/gap_communications_lacks_generate_communication_plan'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-servicesdirectory-lacks-ai-matching-eligibility-scoring', require('./routes/gap_servicesdirectory_lacks_ai_matching_eligibility_scoring'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-limited-integration-with-social-service-databases-only-stub', require('./routes/gap_limited_integration_with_social_service_databases_only_stub'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-automated-eligibility-determination-engine', require('./routes/gap_no_automated_eligibility_determination_engine'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-ferpa-hipaa-compliance-tracking-module', require('./routes/gap_no_ferpa_hipaa_compliance_tracking_module'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-limited-mobile-app-for-field-case-managers', require('./routes/gap_limited_mobile_app_for_field_case_managers'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-webhooks', require('./routes/gap_no_webhooks'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-calendar-integration-despite-appointments', require('./routes/gap_no_calendar_integration_despite_appointments'));

    app.listen(PORT, () => {
      console.log(`✅ Backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
