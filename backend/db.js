const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const query = (text, params) => pool.query(text, params);

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'caseworker',
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS caseworkers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        employee_id VARCHAR(50) UNIQUE,
        department VARCHAR(100),
        specialization VARCHAR(200),
        phone VARCHAR(20),
        max_caseload INTEGER DEFAULT 25,
        active_cases INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        hire_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS beneficiaries (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        date_of_birth DATE,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        emergency_contact VARCHAR(255),
        emergency_phone VARCHAR(20),
        status VARCHAR(30) DEFAULT 'active',
        risk_level VARCHAR(20) DEFAULT 'low',
        assigned_caseworker_id INTEGER REFERENCES caseworkers(id),
        intake_date DATE DEFAULT CURRENT_DATE,
        program VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS case_notes (
        id SERIAL PRIMARY KEY,
        beneficiary_id INTEGER REFERENCES beneficiaries(id) ON DELETE CASCADE,
        caseworker_id INTEGER REFERENCES caseworkers(id),
        meeting_date TIMESTAMP DEFAULT NOW(),
        meeting_type VARCHAR(50),
        location VARCHAR(200),
        summary TEXT NOT NULL,
        detailed_notes TEXT,
        mood VARCHAR(30),
        follow_up_needed BOOLEAN DEFAULT false,
        follow_up_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS action_plans (
        id SERIAL PRIMARY KEY,
        beneficiary_id INTEGER REFERENCES beneficiaries(id) ON DELETE CASCADE,
        caseworker_id INTEGER REFERENCES caseworkers(id),
        case_note_id INTEGER REFERENCES case_notes(id),
        title VARCHAR(255) NOT NULL,
        plan_content TEXT NOT NULL,
        ai_generated BOOLEAN DEFAULT false,
        status VARCHAR(30) DEFAULT 'draft',
        start_date DATE DEFAULT CURRENT_DATE,
        end_date DATE,
        approved_at TIMESTAMP,
        approved_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        beneficiary_id INTEGER REFERENCES beneficiaries(id) ON DELETE CASCADE,
        caseworker_id INTEGER REFERENCES caseworkers(id),
        action_plan_id INTEGER REFERENCES action_plans(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(30) DEFAULT 'pending',
        due_date DATE,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        beneficiary_id INTEGER REFERENCES beneficiaries(id) ON DELETE CASCADE,
        caseworker_id INTEGER REFERENCES caseworkers(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        appointment_date TIMESTAMP NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        location VARCHAR(200),
        appointment_type VARCHAR(50),
        status VARCHAR(30) DEFAULT 'scheduled',
        reminder_sent BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        beneficiary_id INTEGER REFERENCES beneficiaries(id) ON DELETE CASCADE,
        uploaded_by INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        document_type VARCHAR(50),
        file_name VARCHAR(255),
        file_size INTEGER,
        file_url VARCHAR(500),
        status VARCHAR(30) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        beneficiary_id INTEGER REFERENCES beneficiaries(id) ON DELETE CASCADE,
        caseworker_id INTEGER REFERENCES caseworkers(id),
        referred_to VARCHAR(255) NOT NULL,
        organization VARCHAR(255),
        referral_type VARCHAR(100),
        reason TEXT,
        status VARCHAR(30) DEFAULT 'pending',
        contact_name VARCHAR(200),
        contact_phone VARCHAR(20),
        contact_email VARCHAR(255),
        follow_up_date DATE,
        outcome TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        beneficiary_id INTEGER REFERENCES beneficiaries(id) ON DELETE CASCADE,
        caseworker_id INTEGER REFERENCES caseworkers(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        target_date DATE,
        progress INTEGER DEFAULT 0,
        status VARCHAR(30) DEFAULT 'in_progress',
        milestones JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        beneficiary_id INTEGER REFERENCES beneficiaries(id) ON DELETE CASCADE,
        caseworker_id INTEGER REFERENCES caseworkers(id),
        assessment_type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        score INTEGER,
        max_score INTEGER DEFAULT 100,
        risk_level VARCHAR(20),
        findings TEXT,
        recommendations TEXT,
        next_assessment_date DATE,
        status VARCHAR(30) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS communications (
        id SERIAL PRIMARY KEY,
        beneficiary_id INTEGER REFERENCES beneficiaries(id) ON DELETE CASCADE,
        caseworker_id INTEGER REFERENCES caseworkers(id),
        comm_type VARCHAR(30) NOT NULL,
        direction VARCHAR(20) NOT NULL,
        subject VARCHAR(255),
        content TEXT NOT NULL,
        contact_method VARCHAR(50),
        status VARCHAR(30) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        notification_type VARCHAR(50),
        related_entity VARCHAR(50),
        related_id INTEGER,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_summaries (
        id SERIAL PRIMARY KEY,
        beneficiary_id INTEGER REFERENCES beneficiaries(id) ON DELETE CASCADE,
        caseworker_id INTEGER REFERENCES caseworkers(id),
        summary_type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        ai_model VARCHAR(100),
        prompt_used TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, initDB };
