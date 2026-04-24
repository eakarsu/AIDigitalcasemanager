const bcrypt = require('bcryptjs');
const { pool, initDB } = require('./db');
require('dotenv').config({ path: '../.env' });

const seed = async () => {
  const client = await pool.connect();
  try {
    // Drop all tables and recreate
    await client.query(`
      DROP TABLE IF EXISTS ai_summaries CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS communications CASCADE;
      DROP TABLE IF EXISTS assessments CASCADE;
      DROP TABLE IF EXISTS goals CASCADE;
      DROP TABLE IF EXISTS referrals CASCADE;
      DROP TABLE IF EXISTS documents CASCADE;
      DROP TABLE IF EXISTS appointments CASCADE;
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS action_plans CASCADE;
      DROP TABLE IF EXISTS case_notes CASCADE;
      DROP TABLE IF EXISTS beneficiaries CASCADE;
      DROP TABLE IF EXISTS caseworkers CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    await initDB();

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Seed Users (15+)
    const usersResult = await client.query(`
      INSERT INTO users (email, password, full_name, role, avatar_url) VALUES
      ('admin@casemanager.org', '${hashedPassword}', 'Sarah Johnson', 'admin', NULL),
      ('maria.garcia@casemanager.org', '${hashedPassword}', 'Maria Garcia', 'caseworker', NULL),
      ('james.wilson@casemanager.org', '${hashedPassword}', 'James Wilson', 'caseworker', NULL),
      ('emily.chen@casemanager.org', '${hashedPassword}', 'Emily Chen', 'caseworker', NULL),
      ('david.brown@casemanager.org', '${hashedPassword}', 'David Brown', 'caseworker', NULL),
      ('lisa.martinez@casemanager.org', '${hashedPassword}', 'Lisa Martinez', 'caseworker', NULL),
      ('michael.taylor@casemanager.org', '${hashedPassword}', 'Michael Taylor', 'caseworker', NULL),
      ('jennifer.lee@casemanager.org', '${hashedPassword}', 'Jennifer Lee', 'supervisor', NULL),
      ('robert.anderson@casemanager.org', '${hashedPassword}', 'Robert Anderson', 'caseworker', NULL),
      ('amanda.thomas@casemanager.org', '${hashedPassword}', 'Amanda Thomas', 'caseworker', NULL),
      ('kevin.jackson@casemanager.org', '${hashedPassword}', 'Kevin Jackson', 'caseworker', NULL),
      ('stephanie.white@casemanager.org', '${hashedPassword}', 'Stephanie White', 'caseworker', NULL),
      ('daniel.harris@casemanager.org', '${hashedPassword}', 'Daniel Harris', 'supervisor', NULL),
      ('rachel.clark@casemanager.org', '${hashedPassword}', 'Rachel Clark', 'caseworker', NULL),
      ('christopher.lewis@casemanager.org', '${hashedPassword}', 'Christopher Lewis', 'caseworker', NULL),
      ('nicole.robinson@casemanager.org', '${hashedPassword}', 'Nicole Robinson', 'caseworker', NULL)
      RETURNING id;
    `);
    const userIds = usersResult.rows.map(r => r.id);
    console.log('Seeded 16 users');

    // Seed Caseworkers (15+)
    const cwResult = await client.query(`
      INSERT INTO caseworkers (user_id, employee_id, department, specialization, phone, max_caseload, active_cases, status, hire_date) VALUES
      (${userIds[1]}, 'CW-001', 'Family Services', 'Child Welfare', '555-0101', 25, 18, 'active', '2020-03-15'),
      (${userIds[2]}, 'CW-002', 'Housing', 'Homeless Prevention', '555-0102', 20, 15, 'active', '2019-07-22'),
      (${userIds[3]}, 'CW-003', 'Mental Health', 'Crisis Intervention', '555-0103', 15, 12, 'active', '2021-01-10'),
      (${userIds[4]}, 'CW-004', 'Substance Abuse', 'Recovery Support', '555-0104', 20, 19, 'active', '2018-11-05'),
      (${userIds[5]}, 'CW-005', 'Youth Services', 'Education Support', '555-0105', 25, 22, 'active', '2020-08-18'),
      (${userIds[6]}, 'CW-006', 'Elder Care', 'Senior Services', '555-0106', 20, 14, 'active', '2019-04-30'),
      (${userIds[8]}, 'CW-007', 'Veterans Services', 'Transition Support', '555-0107', 20, 16, 'active', '2021-06-14'),
      (${userIds[9]}, 'CW-008', 'Family Services', 'Domestic Violence', '555-0108', 15, 13, 'active', '2022-02-01'),
      (${userIds[10]}, 'CW-009', 'Housing', 'Rapid Rehousing', '555-0109', 25, 20, 'active', '2020-10-12'),
      (${userIds[11]}, 'CW-010', 'Mental Health', 'Therapy Coordination', '555-0110', 18, 15, 'active', '2019-09-25'),
      (${userIds[12]}, 'CW-011', 'Substance Abuse', 'Prevention Programs', '555-0111', 20, 11, 'active', '2021-03-08'),
      (${userIds[13]}, 'CW-012', 'Youth Services', 'Job Training', '555-0112', 22, 17, 'active', '2020-05-19'),
      (${userIds[14]}, 'CW-013', 'Elder Care', 'Healthcare Navigation', '555-0113', 20, 18, 'active', '2018-07-14'),
      (${userIds[15]}, 'CW-014', 'Family Services', 'Financial Assistance', '555-0114', 25, 21, 'active', '2019-12-03'),
      (${userIds[0]}, 'CW-015', 'Administration', 'Program Management', '555-0100', 10, 5, 'active', '2017-01-15')
      RETURNING id;
    `);
    const cwIds = cwResult.rows.map(r => r.id);
    console.log('Seeded 15 caseworkers');

    // Seed Beneficiaries (20+)
    const benResult = await client.query(`
      INSERT INTO beneficiaries (first_name, last_name, email, phone, date_of_birth, address, city, state, zip_code, emergency_contact, emergency_phone, status, risk_level, assigned_caseworker_id, intake_date, program, notes) VALUES
      ('John', 'Smith', 'john.smith@email.com', '555-1001', '1985-06-15', '123 Oak Street', 'Springfield', 'IL', '62701', 'Jane Smith', '555-1002', 'active', 'medium', ${cwIds[0]}, '2024-01-15', 'Family Support', 'Single father with two children'),
      ('Maria', 'Rodriguez', 'maria.r@email.com', '555-1003', '1990-03-22', '456 Elm Avenue', 'Springfield', 'IL', '62702', 'Carlos Rodriguez', '555-1004', 'active', 'high', ${cwIds[0]}, '2024-02-10', 'Housing Assistance', 'Facing eviction, needs immediate housing support'),
      ('Robert', 'Williams', 'r.williams@email.com', '555-1005', '1978-11-30', '789 Pine Road', 'Springfield', 'IL', '62703', 'Susan Williams', '555-1006', 'active', 'low', ${cwIds[1]}, '2024-01-22', 'Homeless Prevention', 'Recently employed, needs transitional support'),
      ('Angela', 'Davis', 'a.davis@email.com', '555-1007', '1995-08-14', '321 Maple Lane', 'Springfield', 'IL', '62704', 'Thomas Davis', '555-1008', 'active', 'high', ${cwIds[2]}, '2024-03-01', 'Mental Health', 'History of anxiety and depression'),
      ('James', 'Thompson', 'j.thompson@email.com', '555-1009', '1982-01-25', '654 Birch Court', 'Springfield', 'IL', '62705', 'Carol Thompson', '555-1010', 'active', 'medium', ${cwIds[3]}, '2024-02-15', 'Recovery Support', 'Six months sober, needs continued support'),
      ('Linda', 'Martinez', 'l.martinez@email.com', '555-1011', '2005-04-18', '987 Cedar Drive', 'Springfield', 'IL', '62706', 'Rosa Martinez', '555-1012', 'active', 'low', ${cwIds[4]}, '2024-01-30', 'Youth Education', 'High school student needing tutoring'),
      ('William', 'Anderson', 'w.anderson@email.com', '555-1013', '1945-09-08', '147 Walnut Street', 'Springfield', 'IL', '62707', 'Betty Anderson', '555-1014', 'active', 'medium', ${cwIds[5]}, '2024-02-20', 'Senior Services', 'Needs assistance with daily living activities'),
      ('Patricia', 'Taylor', 'p.taylor@email.com', '555-1015', '1988-12-03', '258 Spruce Ave', 'Springfield', 'IL', '62708', 'Mark Taylor', '555-1016', 'active', 'high', ${cwIds[6]}, '2024-03-05', 'Veterans Services', 'Recently discharged, PTSD symptoms'),
      ('Michael', 'Brown', 'm.brown@email.com', '555-1017', '1992-07-19', '369 Ash Boulevard', 'Springfield', 'IL', '62709', 'Sarah Brown', '555-1018', 'active', 'medium', ${cwIds[7]}, '2024-01-10', 'Family Support', 'Domestic violence survivor'),
      ('Jennifer', 'Jones', 'j.jones@email.com', '555-1019', '1987-05-27', '480 Poplar Way', 'Springfield', 'IL', '62710', 'Richard Jones', '555-1020', 'active', 'low', ${cwIds[8]}, '2024-02-28', 'Rapid Rehousing', 'Successfully rehoused, follow-up phase'),
      ('Christopher', 'Garcia', 'c.garcia@email.com', '555-1021', '1975-10-11', '591 Hickory Lane', 'Springfield', 'IL', '62711', 'Diana Garcia', '555-1022', 'active', 'high', ${cwIds[9]}, '2024-03-10', 'Mental Health', 'Bipolar disorder, medication management'),
      ('Susan', 'Miller', 's.miller@email.com', '555-1023', '1998-02-14', '602 Chestnut Ave', 'Springfield', 'IL', '62712', 'Tom Miller', '555-1024', 'active', 'medium', ${cwIds[10]}, '2024-01-25', 'Substance Abuse', 'Opioid recovery program participant'),
      ('David', 'Wilson', 'd.wilson@email.com', '555-1025', '2004-06-30', '713 Sycamore Rd', 'Springfield', 'IL', '62713', 'Nancy Wilson', '555-1026', 'active', 'low', ${cwIds[11]}, '2024-02-05', 'Job Training', 'Enrolled in IT certification program'),
      ('Margaret', 'Moore', 'm.moore@email.com', '555-1027', '1940-04-22', '824 Redwood Circle', 'Springfield', 'IL', '62714', 'George Moore', '555-1028', 'active', 'high', ${cwIds[12]}, '2024-03-15', 'Senior Healthcare', 'Multiple chronic conditions'),
      ('Richard', 'Jackson', 'r.jackson@email.com', '555-1029', '1983-08-09', '935 Magnolia St', 'Springfield', 'IL', '62715', 'Laura Jackson', '555-1030', 'active', 'medium', ${cwIds[13]}, '2024-01-18', 'Financial Aid', 'Debt management and budgeting support'),
      ('Dorothy', 'White', 'd.white@email.com', '555-1031', '1970-12-25', '104 Willow Lane', 'Springfield', 'IL', '62716', 'Frank White', '555-1032', 'inactive', 'low', ${cwIds[0]}, '2023-06-10', 'Family Support', 'Case closed - goals met'),
      ('Charles', 'Harris', 'c.harris@email.com', '555-1033', '1993-03-17', '215 Ivy Court', 'Springfield', 'IL', '62717', 'Amy Harris', '555-1034', 'active', 'medium', ${cwIds[1]}, '2024-03-01', 'Housing', 'Section 8 voucher holder'),
      ('Elizabeth', 'Clark', 'e.clark@email.com', '555-1035', '1989-09-05', '326 Olive Drive', 'Springfield', 'IL', '62718', 'Paul Clark', '555-1036', 'active', 'high', ${cwIds[2]}, '2024-02-12', 'Crisis Services', 'Suicidal ideation history, safety plan in place'),
      ('Thomas', 'Lewis', 't.lewis@email.com', '555-1037', '2001-01-28', '437 Palm Avenue', 'Springfield', 'IL', '62719', 'Karen Lewis', '555-1038', 'active', 'low', ${cwIds[3]}, '2024-03-08', 'Youth Recovery', 'Marijuana cessation program'),
      ('Sandra', 'Robinson', 's.robinson@email.com', '555-1039', '1968-07-14', '548 Cypress Way', 'Springfield', 'IL', '62720', 'Bill Robinson', '555-1040', 'active', 'medium', ${cwIds[4]}, '2024-01-05', 'Adult Education', 'GED preparation support')
      RETURNING id;
    `);
    const benIds = benResult.rows.map(r => r.id);
    console.log('Seeded 20 beneficiaries');

    // Seed Case Notes (20+)
    const notesResult = await client.query(`
      INSERT INTO case_notes (beneficiary_id, caseworker_id, meeting_date, meeting_type, location, summary, detailed_notes, mood, follow_up_needed, follow_up_date) VALUES
      (${benIds[0]}, ${cwIds[0]}, '2024-03-10 10:00', 'In-Person', 'Office', 'Discussed childcare arrangements and work schedule', 'John shared he found part-time employment at the warehouse. Discussed how to balance work with childcare for his two children ages 4 and 7. Explored after-school program options. He seems motivated but stressed about finances.', 'anxious', true, '2024-03-24'),
      (${benIds[0]}, ${cwIds[0]}, '2024-03-01 14:00', 'In-Person', 'Office', 'Initial follow-up on housing stability', 'John reported his rent was paid on time this month. Children are enrolled in school. Discussed food assistance programs and provided referral to local food bank.', 'hopeful', true, '2024-03-15'),
      (${benIds[1]}, ${cwIds[0]}, '2024-03-08 09:00', 'In-Person', 'Home Visit', 'Emergency housing assessment', 'Maria received a 30-day eviction notice. Explored emergency housing options. Connected with legal aid for eviction defense. She has two children and is pregnant. Immediate intervention needed.', 'distressed', true, '2024-03-12'),
      (${benIds[2]}, ${cwIds[1]}, '2024-03-07 11:00', 'Phone', 'Remote', 'Employment follow-up call', 'Robert started his new job at the distribution center. Reports feeling stable. Discussed budgeting for first paycheck. Will continue transitional housing for 3 more months.', 'positive', false, NULL),
      (${benIds[3]}, ${cwIds[2]}, '2024-03-09 13:00', 'In-Person', 'Office', 'Mental health check-in', 'Angela reports increased anxiety related to upcoming court date for custody hearing. Discussed coping strategies. Medication is helping with sleep. Referred to pro bono attorney.', 'anxious', true, '2024-03-16'),
      (${benIds[4]}, ${cwIds[3]}, '2024-03-06 15:00', 'In-Person', 'Office', 'Recovery milestone meeting', 'James celebrated 6 months of sobriety. Discussed continued participation in AA meetings. Employment search is going well. Applied to three jobs this week.', 'positive', true, '2024-03-20'),
      (${benIds[5]}, ${cwIds[4]}, '2024-03-11 16:00', 'In-Person', 'School', 'Academic progress review', 'Linda grades improved from C average to B+. Tutoring sessions are effective. Discussed college preparation and scholarship opportunities. She expressed interest in nursing.', 'happy', true, '2024-04-01'),
      (${benIds[6]}, ${cwIds[5]}, '2024-03-05 10:00', 'Home Visit', 'Home', 'Daily living assessment', 'William needs assistance with meal preparation and medication management. Home is clean but cluttered. Discussed home health aide options. Falls risk identified.', 'neutral', true, '2024-03-12'),
      (${benIds[7]}, ${cwIds[6]}, '2024-03-04 09:30', 'In-Person', 'VA Center', 'PTSD treatment follow-up', 'Patricia attended her third PTSD therapy session. Reports nightmares decreased from nightly to 2-3 times per week. Discussed VA benefits enrollment status.', 'improving', true, '2024-03-18'),
      (${benIds[8]}, ${cwIds[7]}, '2024-03-08 14:00', 'In-Person', 'Safe House', 'Safety planning session', 'Michael completed safety plan. Restraining order is in place. Children are adjusting to new living situation. Discussed trauma-informed counseling for children.', 'guarded', true, '2024-03-15'),
      (${benIds[9]}, ${cwIds[8]}, '2024-03-07 11:30', 'Phone', 'Remote', 'Housing stability check', 'Jennifer settled well into new apartment. Utilities connected. Furniture donated by community partners. Employment stable. Moving to quarterly check-ins.', 'positive', false, NULL),
      (${benIds[10]}, ${cwIds[9]}, '2024-03-10 13:00', 'In-Person', 'Clinic', 'Medication review meeting', 'Christopher met with psychiatrist. Medication adjusted - lithium dosage increased. Discussed importance of consistent sleep schedule. Mood tracking app recommended.', 'stable', true, '2024-03-17'),
      (${benIds[11]}, ${cwIds[10]}, '2024-03-06 10:00', 'In-Person', 'Office', 'Recovery program check-in', 'Susan completed 30 days in outpatient program. Drug screens negative. Discussed MAT (Medication-Assisted Treatment) continuation. Family therapy session scheduled.', 'hopeful', true, '2024-03-20'),
      (${benIds[12]}, ${cwIds[11]}, '2024-03-09 15:00', 'In-Person', 'Training Center', 'Job training progress review', 'David completed CompTIA A+ certification module 1. Instructor reports excellent progress. Discussed internship opportunities at local IT companies.', 'enthusiastic', true, '2024-04-01'),
      (${benIds[13]}, ${cwIds[12]}, '2024-03-11 09:00', 'Home Visit', 'Home', 'Health monitoring visit', 'Margaret blood pressure elevated. Medication compliance discussed. Arranged for home health nurse weekly visits. Meals on Wheels enrollment confirmed.', 'tired', true, '2024-03-14'),
      (${benIds[14]}, ${cwIds[13]}, '2024-03-05 14:00', 'In-Person', 'Office', 'Financial counseling session', 'Richard reviewed budget worksheet. Total debt reduced by $2,400 in two months. Set up automatic payments for utilities. Discussed building emergency fund.', 'motivated', true, '2024-04-05'),
      (${benIds[16]}, ${cwIds[1]}, '2024-03-10 11:00', 'In-Person', 'Office', 'Housing voucher follow-up', 'Charles received Section 8 approval. Searching for qualifying apartments. Provided list of participating landlords. Discussed tenant rights.', 'relieved', true, '2024-03-24'),
      (${benIds[17]}, ${cwIds[2]}, '2024-03-07 09:00', 'In-Person', 'Office', 'Crisis intervention follow-up', 'Elizabeth reports safety plan is working. No suicidal ideation in past two weeks. Continuing weekly therapy. Support group attendance consistent.', 'improving', true, '2024-03-14'),
      (${benIds[18]}, ${cwIds[3]}, '2024-03-08 16:00', 'In-Person', 'Office', 'Youth substance counseling', 'Thomas reports 45 days marijuana-free. Peer pressure at school discussed. Introduced to sober youth activities group. Academic performance improving.', 'positive', true, '2024-03-22'),
      (${benIds[19]}, ${cwIds[4]}, '2024-03-06 10:00', 'In-Person', 'Library', 'GED study session review', 'Sandra passed practice math test with 78%. Scheduled official GED math section for April 10. Discussed study strategies for science section.', 'confident', true, '2024-03-20')
      RETURNING id;
    `);
    const noteIds = notesResult.rows.map(r => r.id);
    console.log('Seeded 20 case notes');

    // Seed Action Plans (15+)
    await client.query(`
      INSERT INTO action_plans (beneficiary_id, caseworker_id, case_note_id, title, plan_content, ai_generated, status, start_date, end_date) VALUES
      (${benIds[0]}, ${cwIds[0]}, ${noteIds[0]}, '30-Day Family Stability Plan', 'Week 1-2: Enroll children in after-school program at Springfield Community Center. Submit application for childcare subsidy.\nWeek 2-3: Meet with employer to discuss schedule flexibility. Explore additional part-time work options.\nWeek 3-4: Follow up on food bank referral. Apply for SNAP benefits. Schedule next check-in.\nOngoing: Monitor rent payments and financial stability.', true, 'approved', '2024-03-10', '2024-04-10'),
      (${benIds[1]}, ${cwIds[0]}, ${noteIds[2]}, 'Emergency Housing Intervention Plan', 'Immediate: Contact Legal Aid Society for eviction defense representation.\nWeek 1: Apply to Emergency Housing Assistance Fund. Contact 3 emergency shelters as backup.\nWeek 2: Follow up on legal case. Explore Section 8 emergency priority status due to pregnancy.\nWeek 3-4: Secure permanent housing arrangement. Connect with prenatal care services.\nOngoing: Weekly check-ins until housing is stabilized.', true, 'active', '2024-03-08', '2024-04-08'),
      (${benIds[2]}, ${cwIds[1]}, ${noteIds[3]}, 'Employment Transition Support Plan', 'Month 1: Support through first full month of employment. Assist with budgeting first paychecks.\nMonth 2: Begin savings plan. Research permanent housing options.\nMonth 3: Transition from transitional housing. Reduce check-in frequency.\nOngoing: Quarterly follow-ups for 12 months post-transition.', false, 'active', '2024-03-07', '2024-06-07'),
      (${benIds[3]}, ${cwIds[2]}, ${noteIds[4]}, 'Mental Health & Legal Support Plan', 'Week 1: Connect with pro bono family law attorney. Continue medication management.\nWeek 2: Prepare for custody hearing. Attend anxiety management workshop.\nWeek 3: Court appearance preparation. Safety planning for court day.\nWeek 4: Post-hearing assessment and plan adjustment.\nOngoing: Weekly therapy sessions, monthly medication reviews.', true, 'active', '2024-03-09', '2024-04-09'),
      (${benIds[4]}, ${cwIds[3]}, ${noteIds[5]}, 'Recovery & Employment Action Plan', 'Week 1-2: Continue daily AA meetings. Follow up on 3 job applications.\nWeek 3: Attend job interview preparation workshop. Update resume.\nWeek 4: Assess employment progress. Celebrate 7-month sobriety milestone.\nOngoing: Weekly sponsor meetings, bi-weekly case management.', true, 'approved', '2024-03-06', '2024-04-06'),
      (${benIds[5]}, ${cwIds[4]}, ${noteIds[6]}, 'Academic & College Prep Plan', 'Month 1: Maintain B+ average. Research nursing program requirements.\nMonth 2: Begin SAT/ACT preparation. Visit local community college nursing program.\nMonth 3: Submit scholarship applications. Complete college essays.\nOngoing: Weekly tutoring, monthly progress reviews.', false, 'active', '2024-03-11', '2024-06-11'),
      (${benIds[6]}, ${cwIds[5]}, ${noteIds[7]}, 'Senior Safety & Support Plan', 'Week 1: Arrange home health aide 3x/week. Install grab bars in bathroom.\nWeek 2: Set up medication management system (pill organizer + reminders).\nWeek 3: Declutter home to reduce fall risks. Meals on Wheels enrollment.\nWeek 4: Reassess daily living needs. Consider adult day program.\nOngoing: Monthly home safety checks.', true, 'active', '2024-03-05', '2024-04-05'),
      (${benIds[7]}, ${cwIds[6]}, ${noteIds[8]}, 'PTSD Recovery & Benefits Plan', 'Week 1-2: Continue PTSD therapy (CPT model). Complete VA benefits paperwork.\nWeek 3: Follow up on VA disability claim. Join veterans peer support group.\nWeek 4: Assess treatment progress. Explore vocational rehabilitation.\nOngoing: Weekly therapy, monthly VA liaison meetings.', true, 'approved', '2024-03-04', '2024-04-04'),
      (${benIds[8]}, ${cwIds[7]}, ${noteIds[9]}, 'Domestic Violence Recovery Plan', 'Week 1: Secure all legal protections. Enroll children in school near safe house.\nWeek 2: Begin trauma-informed counseling for family. Apply for crime victim assistance.\nWeek 3: Explore permanent housing options. Job search assistance.\nWeek 4: Financial independence planning. Support group enrollment.\nOngoing: Weekly safety assessments.', true, 'active', '2024-03-08', '2024-04-08'),
      (${benIds[10]}, ${cwIds[9]}, ${noteIds[11]}, 'Bipolar Management Plan', 'Week 1: Monitor new medication dosage effects. Daily mood tracking.\nWeek 2: Follow-up with psychiatrist for medication assessment.\nWeek 3: Establish consistent sleep hygiene routine. Begin CBT sessions.\nWeek 4: Evaluate overall stability. Adjust plan as needed.\nOngoing: Monthly psychiatric reviews, weekly therapy.', true, 'active', '2024-03-10', '2024-04-10'),
      (${benIds[11]}, ${cwIds[10]}, ${noteIds[12]}, 'Opioid Recovery Continuation Plan', 'Week 1-2: Continue MAT program. Attend 3 NA meetings per week.\nWeek 3: Family therapy session. Vocational assessment.\nWeek 4: Apply for supported employment program. 60-day sobriety celebration.\nOngoing: Weekly drug screens, bi-weekly counseling.', true, 'approved', '2024-03-06', '2024-04-06'),
      (${benIds[12]}, ${cwIds[11]}, ${noteIds[13]}, 'IT Career Development Plan', 'Month 1: Complete CompTIA A+ certification. Begin networking module.\nMonth 2: CompTIA Network+ preparation. Apply for IT internships.\nMonth 3: Internship placement. Begin CompTIA Security+ study.\nOngoing: Monthly mentor meetings, career counseling.', false, 'active', '2024-03-09', '2024-06-09'),
      (${benIds[13]}, ${cwIds[12]}, ${noteIds[14]}, 'Senior Health Management Plan', 'Week 1: Home health nurse assessment. Medication reconciliation.\nWeek 2: Specialist appointments scheduled. Transportation arranged.\nWeek 3: Dietary plan with nutritionist. Fall prevention program.\nWeek 4: Reassess care needs. Family meeting for care coordination.\nOngoing: Weekly nurse visits, monthly physician reviews.', true, 'active', '2024-03-11', '2024-04-11'),
      (${benIds[14]}, ${cwIds[13]}, ${noteIds[15]}, 'Financial Recovery Plan', 'Month 1: Set up debt repayment schedule. Build $500 emergency fund.\nMonth 2: Negotiate lower interest rates on credit cards. Increase income.\nMonth 3: Review progress. Adjust budget. Explore asset building programs.\nOngoing: Monthly financial check-ins, quarterly credit reviews.', false, 'active', '2024-03-05', '2024-06-05'),
      (${benIds[17]}, ${cwIds[2]}, ${noteIds[17]}, 'Crisis Recovery & Stability Plan', 'Week 1: Daily safety check-ins. Continue weekly therapy.\nWeek 2: Expand support network. Add second support group.\nWeek 3: Assess medication effectiveness. Gradually increase activities.\nWeek 4: Develop long-term wellness plan. Reduce check-in frequency if stable.\nOngoing: Weekly therapy, monthly psychiatric evaluations.', true, 'active', '2024-03-07', '2024-04-07'),
      (${benIds[18]}, ${cwIds[3]}, ${noteIds[18]}, 'Youth Sobriety & Academic Plan', 'Week 1-2: Continue sobriety streak. Join after-school sober activities.\nWeek 3: Peer pressure resistance workshop. Family communication session.\nWeek 4: 60-day milestone celebration. Academic progress review.\nOngoing: Weekly counseling, monthly family sessions.', true, 'approved', '2024-03-08', '2024-04-08')
      ;
    `);
    console.log('Seeded 16 action plans');

    // Seed Tasks (20+)
    await client.query(`
      INSERT INTO tasks (beneficiary_id, caseworker_id, action_plan_id, title, description, priority, status, due_date) VALUES
      (${benIds[0]}, ${cwIds[0]}, 1, 'Enroll children in after-school program', 'Contact Springfield Community Center for enrollment forms', 'high', 'in_progress', '2024-03-17'),
      (${benIds[0]}, ${cwIds[0]}, 1, 'Submit childcare subsidy application', 'Complete and submit DHS childcare assistance application', 'high', 'pending', '2024-03-20'),
      (${benIds[0]}, ${cwIds[0]}, 1, 'Apply for SNAP benefits', 'Help John complete SNAP application online', 'medium', 'pending', '2024-03-25'),
      (${benIds[1]}, ${cwIds[0]}, 2, 'Contact Legal Aid Society', 'Request emergency eviction defense representation', 'urgent', 'completed', '2024-03-09'),
      (${benIds[1]}, ${cwIds[0]}, 2, 'Apply to Emergency Housing Fund', 'Submit application with supporting documentation', 'urgent', 'in_progress', '2024-03-12'),
      (${benIds[1]}, ${cwIds[0]}, 2, 'Connect with prenatal care', 'Schedule first prenatal appointment at community health center', 'high', 'pending', '2024-03-15'),
      (${benIds[3]}, ${cwIds[2]}, 4, 'Connect with pro bono attorney', 'Contact Legal Services for custody case representation', 'high', 'completed', '2024-03-11'),
      (${benIds[3]}, ${cwIds[2]}, 4, 'Register for anxiety workshop', 'Sign up for 4-week anxiety management course at mental health center', 'medium', 'in_progress', '2024-03-16'),
      (${benIds[4]}, ${cwIds[3]}, 5, 'Follow up on job applications', 'Check status of 3 submitted applications', 'medium', 'pending', '2024-03-13'),
      (${benIds[4]}, ${cwIds[3]}, 5, 'Attend interview prep workshop', 'Workforce center workshop on March 20', 'medium', 'pending', '2024-03-20'),
      (${benIds[6]}, ${cwIds[5]}, 7, 'Install bathroom grab bars', 'Coordinate with volunteer maintenance team', 'high', 'completed', '2024-03-08'),
      (${benIds[6]}, ${cwIds[5]}, 7, 'Set up medication organizer', 'Purchase weekly pill organizer and label medications', 'high', 'completed', '2024-03-10'),
      (${benIds[6]}, ${cwIds[5]}, 7, 'Enroll in Meals on Wheels', 'Complete application for daily meal delivery service', 'medium', 'in_progress', '2024-03-15'),
      (${benIds[7]}, ${cwIds[6]}, 8, 'Submit VA disability claim', 'Complete and file VA Form 21-526EZ', 'high', 'in_progress', '2024-03-18'),
      (${benIds[7]}, ${cwIds[6]}, 8, 'Join veterans support group', 'Attend first meeting at VA center Thursday evenings', 'medium', 'pending', '2024-03-21'),
      (${benIds[8]}, ${cwIds[7]}, 9, 'Enroll children in new school', 'Transfer records and register at school near safe house', 'high', 'completed', '2024-03-11'),
      (${benIds[8]}, ${cwIds[7]}, 9, 'Apply for crime victim assistance', 'Submit VOCA application for financial assistance', 'high', 'in_progress', '2024-03-15'),
      (${benIds[11]}, ${cwIds[10]}, 11, 'Schedule family therapy session', 'Coordinate with counselor and family members', 'medium', 'pending', '2024-03-20'),
      (${benIds[12]}, ${cwIds[11]}, 12, 'Complete CompTIA A+ Module 2', 'Finish all practice labs and quizzes', 'medium', 'in_progress', '2024-03-25'),
      (${benIds[12]}, ${cwIds[11]}, 12, 'Apply for IT internships', 'Submit applications to 5 local IT companies', 'medium', 'pending', '2024-04-01'),
      (${benIds[14]}, ${cwIds[13]}, 14, 'Set up automatic bill payments', 'Configure autopay for utilities and recurring bills', 'medium', 'completed', '2024-03-08'),
      (${benIds[14]}, ${cwIds[13]}, 14, 'Open savings account', 'Help Richard open a no-fee savings account for emergency fund', 'medium', 'in_progress', '2024-03-15')
      ;
    `);
    console.log('Seeded 22 tasks');

    // Seed Appointments (15+)
    await client.query(`
      INSERT INTO appointments (beneficiary_id, caseworker_id, title, description, appointment_date, duration_minutes, location, appointment_type, status, notes) VALUES
      (${benIds[0]}, ${cwIds[0]}, 'Childcare subsidy follow-up', 'Review application status and next steps', '2024-03-24 10:00', 45, 'Office - Room 201', 'Follow-up', 'scheduled', NULL),
      (${benIds[1]}, ${cwIds[0]}, 'Emergency housing update', 'Review legal aid response and housing options', '2024-03-14 09:00', 60, 'Office - Room 201', 'Emergency', 'scheduled', 'High priority'),
      (${benIds[2]}, ${cwIds[1]}, 'Quarterly check-in', 'Housing stability and employment progress', '2024-04-07 11:00', 30, 'Phone', 'Check-in', 'scheduled', NULL),
      (${benIds[3]}, ${cwIds[2]}, 'Pre-court preparation', 'Review custody hearing preparation', '2024-03-16 13:00', 90, 'Office - Room 105', 'Legal Prep', 'scheduled', 'Bring all documentation'),
      (${benIds[4]}, ${cwIds[3]}, 'Sobriety milestone meeting', 'Celebrate 7 months and review plan', '2024-03-20 15:00', 45, 'Office - Room 201', 'Milestone', 'scheduled', NULL),
      (${benIds[5]}, ${cwIds[4]}, 'College prep session', 'SAT prep and college application review', '2024-04-01 16:00', 60, 'Springfield High School', 'Education', 'scheduled', NULL),
      (${benIds[6]}, ${cwIds[5]}, 'Home safety reassessment', 'Check home modifications and fall prevention', '2024-03-19 10:00', 60, 'Home Visit', 'Assessment', 'scheduled', 'Bring safety checklist'),
      (${benIds[7]}, ${cwIds[6]}, 'VA benefits review', 'Check disability claim status', '2024-03-25 09:30', 45, 'VA Center', 'Benefits', 'scheduled', NULL),
      (${benIds[8]}, ${cwIds[7]}, 'Family counseling intake', 'Initial family trauma counseling session', '2024-03-18 14:00', 90, 'Safe House Counseling Room', 'Counseling', 'scheduled', NULL),
      (${benIds[10]}, ${cwIds[9]}, 'Psychiatrist follow-up', 'Medication adjustment review', '2024-03-17 13:00', 30, 'Mental Health Clinic', 'Medical', 'scheduled', NULL),
      (${benIds[11]}, ${cwIds[10]}, 'Recovery group session', 'Weekly NA group facilitation', '2024-03-20 18:00', 90, 'Community Center', 'Group', 'scheduled', NULL),
      (${benIds[12]}, ${cwIds[11]}, 'IT internship interview prep', 'Practice interview questions and review resume', '2024-03-28 15:00', 60, 'Training Center', 'Career', 'scheduled', NULL),
      (${benIds[13]}, ${cwIds[12]}, 'Family care conference', 'Discuss care coordination with family members', '2024-03-22 10:00', 60, 'Office - Conference Room A', 'Family Meeting', 'scheduled', NULL),
      (${benIds[14]}, ${cwIds[13]}, 'Financial review session', 'Monthly budget review and debt progress', '2024-04-05 14:00', 45, 'Office - Room 302', 'Financial', 'scheduled', NULL),
      (${benIds[17]}, ${cwIds[2]}, 'Safety plan review', 'Bi-weekly safety assessment', '2024-03-21 09:00', 45, 'Office - Room 105', 'Safety', 'scheduled', 'Review crisis contacts'),
      (${benIds[18]}, ${cwIds[3]}, 'Youth group orientation', 'Introduction to sober youth activities', '2024-03-22 16:00', 60, 'Youth Center', 'Group', 'scheduled', NULL),
      (${benIds[19]}, ${cwIds[4]}, 'GED math test prep', 'Final review before official test', '2024-04-05 10:00', 120, 'Library - Study Room 3', 'Education', 'scheduled', 'Bring practice materials')
      ;
    `);
    console.log('Seeded 17 appointments');

    // Seed Documents (15+)
    await client.query(`
      INSERT INTO documents (beneficiary_id, uploaded_by, title, description, document_type, file_name, file_size, file_url, status) VALUES
      (${benIds[0]}, ${userIds[1]}, 'Intake Assessment Form', 'Initial intake assessment for John Smith', 'Assessment', 'intake_john_smith.pdf', 245000, '/documents/intake_john_smith.pdf', 'active'),
      (${benIds[0]}, ${userIds[1]}, 'Childcare Subsidy Application', 'DHS childcare assistance application', 'Application', 'childcare_app_smith.pdf', 180000, '/documents/childcare_app_smith.pdf', 'active'),
      (${benIds[1]}, ${userIds[1]}, 'Eviction Notice', '30-day eviction notice from landlord', 'Legal', 'eviction_rodriguez.pdf', 95000, '/documents/eviction_rodriguez.pdf', 'active'),
      (${benIds[1]}, ${userIds[1]}, 'Emergency Housing Application', 'Emergency housing fund application', 'Application', 'emergency_housing_rodriguez.pdf', 210000, '/documents/emergency_housing_rodriguez.pdf', 'active'),
      (${benIds[3]}, ${userIds[3]}, 'Psychiatric Evaluation', 'Initial psychiatric evaluation report', 'Medical', 'psych_eval_davis.pdf', 320000, '/documents/psych_eval_davis.pdf', 'active'),
      (${benIds[3]}, ${userIds[3]}, 'Custody Hearing Documents', 'Family court filing documents', 'Legal', 'custody_docs_davis.pdf', 450000, '/documents/custody_docs_davis.pdf', 'active'),
      (${benIds[4]}, ${userIds[4]}, 'Sobriety Certificate', '6-month sobriety achievement certificate', 'Certificate', 'sobriety_cert_thompson.pdf', 65000, '/documents/sobriety_cert_thompson.pdf', 'active'),
      (${benIds[6]}, ${userIds[6]}, 'Home Safety Assessment', 'Home environment safety evaluation', 'Assessment', 'home_safety_anderson.pdf', 280000, '/documents/home_safety_anderson.pdf', 'active'),
      (${benIds[7]}, ${userIds[8]}, 'DD-214 Military Discharge', 'Honorable discharge documentation', 'Military', 'dd214_taylor.pdf', 150000, '/documents/dd214_taylor.pdf', 'active'),
      (${benIds[7]}, ${userIds[8]}, 'VA Disability Claim Form', 'VA Form 21-526EZ', 'Government', 'va_claim_taylor.pdf', 380000, '/documents/va_claim_taylor.pdf', 'active'),
      (${benIds[8]}, ${userIds[9]}, 'Restraining Order', 'Court-issued protective order', 'Legal', 'restraining_order_brown.pdf', 120000, '/documents/restraining_order_brown.pdf', 'active'),
      (${benIds[11]}, ${userIds[10]}, 'MAT Treatment Plan', 'Medication-Assisted Treatment protocol', 'Medical', 'mat_plan_miller.pdf', 195000, '/documents/mat_plan_miller.pdf', 'active'),
      (${benIds[12]}, ${userIds[14]}, 'CompTIA A+ Certificate', 'Module 1 completion certificate', 'Certificate', 'comptia_wilson.pdf', 75000, '/documents/comptia_wilson.pdf', 'active'),
      (${benIds[13]}, ${userIds[12]}, 'Medical Records Summary', 'Compiled medical history and current conditions', 'Medical', 'medical_records_moore.pdf', 520000, '/documents/medical_records_moore.pdf', 'active'),
      (${benIds[14]}, ${userIds[15]}, 'Budget Worksheet', 'Monthly budget and debt repayment plan', 'Financial', 'budget_jackson.pdf', 85000, '/documents/budget_jackson.pdf', 'active'),
      (${benIds[17]}, ${userIds[3]}, 'Safety Plan Document', 'Crisis safety plan with emergency contacts', 'Safety', 'safety_plan_clark.pdf', 110000, '/documents/safety_plan_clark.pdf', 'active')
      ;
    `);
    console.log('Seeded 16 documents');

    // Seed Referrals (15+)
    await client.query(`
      INSERT INTO referrals (beneficiary_id, caseworker_id, referred_to, organization, referral_type, reason, status, contact_name, contact_phone, contact_email, follow_up_date, outcome) VALUES
      (${benIds[0]}, ${cwIds[0]}, 'Springfield Food Bank', 'Community Food Alliance', 'Food Assistance', 'Family needs supplemental food assistance', 'completed', 'Mary Thompson', '555-2001', 'mthompson@foodalliance.org', '2024-03-20', 'Family enrolled in weekly food distribution'),
      (${benIds[1]}, ${cwIds[0]}, 'Legal Aid Society', 'Springfield Legal Aid', 'Legal Services', 'Emergency eviction defense needed', 'active', 'Attorney Sarah Kim', '555-2002', 'skim@legalaid.org', '2024-03-12', NULL),
      (${benIds[1]}, ${cwIds[0]}, 'Community Health Center', 'Springfield CHC', 'Prenatal Care', 'Pregnant beneficiary needs prenatal services', 'pending', 'Dr. Patricia Wells', '555-2003', 'pwells@springfieldchc.org', '2024-03-15', NULL),
      (${benIds[3]}, ${cwIds[2]}, 'Family Law Clinic', 'Pro Bono Legal Network', 'Legal Services', 'Custody hearing representation needed', 'completed', 'Attorney John Park', '555-2004', 'jpark@probonolaw.org', '2024-03-13', 'Attorney assigned to case'),
      (${benIds[4]}, ${cwIds[3]}, 'Workforce Development Center', 'Springfield WDC', 'Employment', 'Job search assistance and interview prep', 'active', 'Carlos Mendez', '555-2005', 'cmendez@springfieldwdc.org', '2024-03-20', NULL),
      (${benIds[5]}, ${cwIds[4]}, 'College Prep Program', 'Future Leaders Initiative', 'Education', 'College preparation and scholarship assistance', 'active', 'Dr. Lisa Wang', '555-2006', 'lwang@futureleaders.org', '2024-04-01', NULL),
      (${benIds[6]}, ${cwIds[5]}, 'Home Health Agency', 'CareFirst Home Health', 'Home Care', 'In-home assistance with daily living activities', 'completed', 'Nurse Janet Adams', '555-2007', 'jadams@carefirst.org', '2024-03-12', 'Aide scheduled 3x/week'),
      (${benIds[6]}, ${cwIds[5]}, 'Meals on Wheels', 'Senior Nutrition Program', 'Food Assistance', 'Daily meal delivery for homebound senior', 'active', 'Bill Foster', '555-2008', 'bfoster@mealsonwheels.org', '2024-03-15', NULL),
      (${benIds[7]}, ${cwIds[6]}, 'VA Medical Center', 'Veterans Health Administration', 'Medical', 'PTSD treatment and disability evaluation', 'active', 'Dr. Robert Chen', '555-2009', 'rchen@va.gov', '2024-03-18', NULL),
      (${benIds[8]}, ${cwIds[7]}, 'Family Trauma Center', 'Hope & Healing Institute', 'Counseling', 'Family trauma-informed therapy', 'active', 'Dr. Michelle Torres', '555-2010', 'mtorres@hopehealing.org', '2024-03-18', NULL),
      (${benIds[10]}, ${cwIds[9]}, 'Psychiatric Services', 'Behavioral Health Associates', 'Mental Health', 'Ongoing psychiatric care and medication management', 'completed', 'Dr. Amy Foster', '555-2011', 'afoster@bhassociates.org', '2024-03-17', 'Under regular psychiatric care'),
      (${benIds[11]}, ${cwIds[10]}, 'MAT Clinic', 'Recovery Solutions Center', 'Substance Treatment', 'Medication-Assisted Treatment program', 'active', 'Dr. Kevin Wright', '555-2012', 'kwright@recoverysolutions.org', '2024-03-20', NULL),
      (${benIds[12]}, ${cwIds[11]}, 'IT Apprenticeship Program', 'TechBridge Foundation', 'Employment', 'IT internship and mentorship program', 'pending', 'Sarah Martinez', '555-2013', 'smartinez@techbridge.org', '2024-04-01', NULL),
      (${benIds[13]}, ${cwIds[12]}, 'Senior Day Program', 'Golden Years Center', 'Social Services', 'Social activities and health monitoring', 'pending', 'Director Tom Blake', '555-2014', 'tblake@goldenyears.org', '2024-03-22', NULL),
      (${benIds[14]}, ${cwIds[13]}, 'Financial Counseling', 'Money Management International', 'Financial', 'Debt management and financial literacy', 'completed', 'Counselor Diana Ross', '555-2015', 'dross@moneymanagement.org', '2024-04-05', 'Enrolled in debt management program'),
      (${benIds[19]}, ${cwIds[4]}, 'Adult Education Center', 'Springfield Adult Learning', 'Education', 'GED preparation and testing services', 'active', 'Instructor Mike Johnson', '555-2016', 'mjohnson@adultlearning.org', '2024-03-20', NULL)
      ;
    `);
    console.log('Seeded 16 referrals');

    // Seed Goals (15+)
    await client.query(`
      INSERT INTO goals (beneficiary_id, caseworker_id, title, description, category, target_date, progress, status, milestones) VALUES
      (${benIds[0]}, ${cwIds[0]}, 'Achieve stable employment', 'Secure full-time employment with benefits', 'Employment', '2024-06-30', 40, 'in_progress', '[{"title":"Find part-time work","completed":true},{"title":"Enroll in job training","completed":false},{"title":"Apply for full-time positions","completed":false}]'),
      (${benIds[0]}, ${cwIds[0]}, 'Secure childcare for both children', 'Enroll in subsidized after-school and summer programs', 'Family', '2024-04-30', 25, 'in_progress', '[{"title":"Research programs","completed":true},{"title":"Submit applications","completed":false},{"title":"Confirm enrollment","completed":false}]'),
      (${benIds[1]}, ${cwIds[0]}, 'Prevent eviction and secure housing', 'Maintain current housing or find alternative stable housing', 'Housing', '2024-04-15', 30, 'in_progress', '[{"title":"Legal representation secured","completed":true},{"title":"Emergency fund applied","completed":true},{"title":"Housing secured","completed":false}]'),
      (${benIds[2]}, ${cwIds[1]}, 'Transition to permanent housing', 'Move from transitional to permanent independent housing', 'Housing', '2024-07-01', 60, 'in_progress', '[{"title":"Stable employment","completed":true},{"title":"Save for deposit","completed":false},{"title":"Sign lease","completed":false}]'),
      (${benIds[3]}, ${cwIds[2]}, 'Win custody of children', 'Obtain favorable custody arrangement through family court', 'Legal', '2024-05-30', 35, 'in_progress', '[{"title":"Attorney secured","completed":true},{"title":"Documentation gathered","completed":true},{"title":"Court hearing","completed":false}]'),
      (${benIds[4]}, ${cwIds[3]}, 'Maintain 1 year of sobriety', 'Continue recovery journey to 12-month milestone', 'Recovery', '2024-09-06', 50, 'in_progress', '[{"title":"6 months sober","completed":true},{"title":"9 months sober","completed":false},{"title":"12 months sober","completed":false}]'),
      (${benIds[5]}, ${cwIds[4]}, 'Graduate high school with honors', 'Maintain B+ average and graduate on time', 'Education', '2024-06-15', 70, 'in_progress', '[{"title":"Improve to B+ average","completed":true},{"title":"Complete SAT prep","completed":false},{"title":"Graduate","completed":false}]'),
      (${benIds[6]}, ${cwIds[5]}, 'Age safely at home', 'Establish support systems for independent living', 'Health', '2024-06-30', 55, 'in_progress', '[{"title":"Home safety modifications","completed":true},{"title":"Home health aide","completed":true},{"title":"Nutrition program","completed":false}]'),
      (${benIds[7]}, ${cwIds[6]}, 'Reduce PTSD symptoms', 'Decrease nightmares and anxiety through therapy', 'Mental Health', '2024-09-01', 25, 'in_progress', '[{"title":"Start CPT therapy","completed":true},{"title":"50% symptom reduction","completed":false},{"title":"Return to daily activities","completed":false}]'),
      (${benIds[8]}, ${cwIds[7]}, 'Achieve independence from abuser', 'Build safe, independent life for family', 'Safety', '2024-06-30', 35, 'in_progress', '[{"title":"Safety plan complete","completed":true},{"title":"Secure housing","completed":false},{"title":"Financial independence","completed":false}]'),
      (${benIds[10]}, ${cwIds[9]}, 'Stabilize bipolar symptoms', 'Achieve consistent mood stability through treatment', 'Mental Health', '2024-06-30', 20, 'in_progress', '[{"title":"Medication optimized","completed":false},{"title":"Mood stable 30 days","completed":false},{"title":"Return to work","completed":false}]'),
      (${benIds[11]}, ${cwIds[10]}, 'Complete recovery program', 'Successfully finish outpatient program and maintain sobriety', 'Recovery', '2024-06-30', 40, 'in_progress', '[{"title":"30-day milestone","completed":true},{"title":"60-day milestone","completed":false},{"title":"Program graduation","completed":false}]'),
      (${benIds[12]}, ${cwIds[11]}, 'Obtain IT certification', 'Earn CompTIA A+ and Network+ certifications', 'Career', '2024-08-30', 30, 'in_progress', '[{"title":"A+ Module 1","completed":true},{"title":"A+ Certification","completed":false},{"title":"Network+ Certification","completed":false}]'),
      (${benIds[13]}, ${cwIds[12]}, 'Manage chronic conditions', 'Improve health outcomes through coordinated care', 'Health', '2024-12-31', 20, 'in_progress', '[{"title":"Care team assembled","completed":true},{"title":"BP under control","completed":false},{"title":"Weight management","completed":false}]'),
      (${benIds[14]}, ${cwIds[13]}, 'Eliminate consumer debt', 'Pay off $15,000 in credit card debt', 'Financial', '2025-03-31', 16, 'in_progress', '[{"title":"Budget created","completed":true},{"title":"$5,000 paid off","completed":false},{"title":"Debt free","completed":false}]'),
      (${benIds[19]}, ${cwIds[4]}, 'Earn GED diploma', 'Pass all four GED test sections', 'Education', '2024-06-30', 45, 'in_progress', '[{"title":"Math section ready","completed":true},{"title":"Science section ready","completed":false},{"title":"All sections passed","completed":false}]')
      ;
    `);
    console.log('Seeded 16 goals');

    // Seed Assessments (15+)
    await client.query(`
      INSERT INTO assessments (beneficiary_id, caseworker_id, assessment_type, title, score, max_score, risk_level, findings, recommendations, next_assessment_date, status) VALUES
      (${benIds[0]}, ${cwIds[0]}, 'Needs Assessment', 'Initial Family Needs Assessment', 68, 100, 'medium', 'Single father with employment and childcare challenges. Housing stable but financially vulnerable. Children enrolled in school.', 'Priority: childcare support and employment stability. Consider financial literacy program.', '2024-06-15', 'completed'),
      (${benIds[1]}, ${cwIds[0]}, 'Housing Risk', 'Emergency Housing Assessment', 92, 100, 'high', 'Imminent eviction risk. Pregnant with two children. No alternative housing identified. Income insufficient for current rent.', 'Immediate: legal intervention and emergency housing fund. Medium-term: Section 8 application.', '2024-03-22', 'completed'),
      (${benIds[2]}, ${cwIds[1]}, 'Self-Sufficiency', 'Self-Sufficiency Matrix Assessment', 55, 100, 'low', 'Newly employed. Transitional housing stable. Basic needs met. Building financial foundation.', 'Continue current support plan. Begin transition planning for independent housing.', '2024-06-07', 'completed'),
      (${benIds[3]}, ${cwIds[2]}, 'Mental Health', 'PHQ-9 Depression Screening', 18, 27, 'high', 'Moderately severe depression. Anxiety elevated due to custody proceedings. Sleep disrupted. Medication partially effective.', 'Increase therapy frequency. Consider medication adjustment. Add stress management techniques.', '2024-04-09', 'completed'),
      (${benIds[3]}, ${cwIds[2]}, 'Safety', 'Safety Risk Assessment', 72, 100, 'high', 'Elevated safety concerns related to custody dispute. No immediate danger but ongoing stress affects functioning.', 'Develop detailed safety plan. Ensure support network is aware. Regular check-ins.', '2024-04-09', 'completed'),
      (${benIds[4]}, ${cwIds[3]}, 'Substance Abuse', 'AUDIT Alcohol Assessment', 8, 40, 'medium', 'Previous alcohol dependence. Currently in active recovery (6 months). Regular AA attendance. Strong motivation.', 'Continue current recovery program. Add employment support to reduce relapse risk.', '2024-06-06', 'completed'),
      (${benIds[5]}, ${cwIds[4]}, 'Education', 'Academic Progress Assessment', 78, 100, 'low', 'Significant academic improvement. Strong motivation. College-bound trajectory. Good family support.', 'Focus on SAT prep and scholarship applications. Consider honors program enrollment.', '2024-06-01', 'completed'),
      (${benIds[6]}, ${cwIds[5]}, 'Functional', 'Activities of Daily Living Assessment', 45, 100, 'medium', 'Difficulty with meal preparation, medication management, and mobility. Cognitive function adequate. Social isolation noted.', 'Home health aide essential. Medication management system needed. Social engagement programs recommended.', '2024-04-05', 'completed'),
      (${benIds[7]}, ${cwIds[6]}, 'Mental Health', 'PCL-5 PTSD Assessment', 58, 80, 'high', 'Severe PTSD symptoms including nightmares, hypervigilance, and avoidance behaviors. Recent military discharge.', 'Intensive CPT therapy. Consider EMDR. VA disability claim for service-connected PTSD.', '2024-04-04', 'completed'),
      (${benIds[8]}, ${cwIds[7]}, 'Safety', 'Domestic Violence Lethality Assessment', 85, 100, 'high', 'High danger assessment. Physical and emotional abuse history. Children exposed to violence. Restraining order in place.', 'Maintain safe house placement. Trauma therapy for entire family. Legal advocacy for permanent protection.', '2024-04-08', 'completed'),
      (${benIds[10]}, ${cwIds[9]}, 'Mental Health', 'MDQ Bipolar Screening', 11, 13, 'high', 'Confirmed bipolar I diagnosis. Recent manic episode followed by depressive phase. Medication adjustment in progress.', 'Close psychiatric monitoring. Weekly therapy. Psychoeducation for patient and family.', '2024-04-10', 'completed'),
      (${benIds[11]}, ${cwIds[10]}, 'Substance Abuse', 'DAST-10 Drug Assessment', 6, 10, 'medium', 'Opioid use disorder in early recovery. 30 days clean. Engaged in MAT program. Motivation high.', 'Continue MAT and counseling. Random drug screens. Peer support group recommended.', '2024-04-06', 'completed'),
      (${benIds[13]}, ${cwIds[12]}, 'Health', 'Geriatric Health Assessment', 38, 100, 'high', 'Multiple chronic conditions: hypertension, diabetes, arthritis. Mobility limited. Polypharmacy concerns (8 medications).', 'Coordinated care team essential. Medication reconciliation. Home health nursing weekly.', '2024-04-11', 'completed'),
      (${benIds[14]}, ${cwIds[13]}, 'Financial', 'Financial Wellness Assessment', 32, 100, 'medium', 'Total debt $15,000 (credit cards). Income covers basic expenses. No savings. Financial literacy gaps identified.', 'Structured debt repayment plan. Financial literacy workshop. Emergency fund goal: $1,000.', '2024-06-05', 'completed'),
      (${benIds[17]}, ${cwIds[2]}, 'Safety', 'Columbia Suicide Severity Rating', 3, 5, 'high', 'History of suicidal ideation with plan. Currently stable with safety plan in place. Consistent therapy engagement.', 'Continue safety monitoring. Weekly check-ins. Ensure crisis hotline access. Family notification plan.', '2024-03-21', 'completed'),
      (${benIds[19]}, ${cwIds[4]}, 'Education', 'TABE Educational Assessment', 65, 100, 'low', 'Math skills at 10th grade level. Reading at 11th grade. Science needs improvement. Ready for GED math section.', 'Schedule GED math test. Intensify science tutoring. Practice tests for remaining sections.', '2024-04-20', 'completed')
      ;
    `);
    console.log('Seeded 16 assessments');

    // Seed Communications (15+)
    await client.query(`
      INSERT INTO communications (beneficiary_id, caseworker_id, comm_type, direction, subject, content, contact_method, status) VALUES
      (${benIds[0]}, ${cwIds[0]}, 'call', 'outbound', 'Childcare program availability', 'Called Springfield Community Center. After-school spots available starting next week. Enrollment forms to be picked up Monday.', 'phone', 'completed'),
      (${benIds[0]}, ${cwIds[0]}, 'email', 'outbound', 'SNAP Application Follow-up', 'Sent email to DHS caseworker regarding status of SNAP application submitted 3/5.', 'email', 'completed'),
      (${benIds[1]}, ${cwIds[0]}, 'call', 'outbound', 'Legal Aid urgent referral', 'Called Legal Aid Society for emergency eviction defense. Attorney Sarah Kim assigned to case. Initial consultation scheduled for 3/11.', 'phone', 'completed'),
      (${benIds[1]}, ${cwIds[0]}, 'call', 'inbound', 'Housing fund application update', 'Received call from Emergency Housing Fund. Application under review. Decision expected within 5 business days.', 'phone', 'completed'),
      (${benIds[3]}, ${cwIds[2]}, 'email', 'outbound', 'Custody hearing preparation docs', 'Sent compiled documentation package to pro bono attorney John Park for custody case preparation.', 'email', 'completed'),
      (${benIds[4]}, ${cwIds[3]}, 'text', 'outbound', 'AA meeting reminder', 'Sent text reminder for Thursday evening AA meeting at Community Church. Confirmed attendance.', 'sms', 'completed'),
      (${benIds[5]}, ${cwIds[4]}, 'email', 'outbound', 'SAT prep course enrollment', 'Emailed Future Leaders Initiative regarding SAT prep scholarship availability for Linda.', 'email', 'completed'),
      (${benIds[6]}, ${cwIds[5]}, 'call', 'outbound', 'Home health aide coordination', 'Called CareFirst Home Health to schedule initial aide visit. Aide assigned: Janet Adams. Starting 3/12.', 'phone', 'completed'),
      (${benIds[7]}, ${cwIds[6]}, 'email', 'outbound', 'VA disability claim documentation', 'Submitted additional medical documentation to VA for disability claim. Tracking number provided.', 'email', 'completed'),
      (${benIds[8]}, ${cwIds[7]}, 'call', 'outbound', 'School transfer coordination', 'Called Springfield Elementary to arrange emergency transfer for Brown children. Records transfer initiated.', 'phone', 'completed'),
      (${benIds[10]}, ${cwIds[9]}, 'call', 'inbound', 'Psychiatrist medication update', 'Dr. Foster called to discuss lithium dosage increase for Christopher. New prescription sent to pharmacy.', 'phone', 'completed'),
      (${benIds[11]}, ${cwIds[10]}, 'email', 'outbound', 'MAT program progress report request', 'Requested monthly progress report from Recovery Solutions Center for Susan case file.', 'email', 'completed'),
      (${benIds[12]}, ${cwIds[11]}, 'call', 'outbound', 'IT internship inquiry', 'Called TechBridge Foundation about internship placement for David. Application packet to be sent.', 'phone', 'completed'),
      (${benIds[13]}, ${cwIds[12]}, 'call', 'inbound', 'Nurse visit report', 'Home health nurse reported elevated blood pressure during visit. Physician notified. Follow-up scheduled.', 'phone', 'completed'),
      (${benIds[14]}, ${cwIds[13]}, 'email', 'outbound', 'Debt management enrollment confirmation', 'Received confirmation from Money Management International for Richard enrollment in debt management program.', 'email', 'completed'),
      (${benIds[17]}, ${cwIds[2]}, 'call', 'outbound', 'Daily safety check-in', 'Completed daily check-in call with Elizabeth. Reports no suicidal ideation. Attended therapy today. Mood described as stable.', 'phone', 'completed')
      ;
    `);
    console.log('Seeded 16 communications');

    // Seed Notifications (15+)
    await client.query(`
      INSERT INTO notifications (user_id, title, message, notification_type, related_entity, related_id, is_read) VALUES
      (${userIds[1]}, 'New Action Plan Generated', 'AI has generated a 30-day action plan for John Smith. Please review and approve.', 'action_plan', 'action_plans', 1, false),
      (${userIds[1]}, 'Urgent: Eviction Risk', 'Maria Rodriguez received a 30-day eviction notice. Immediate intervention required.', 'alert', 'beneficiaries', ${benIds[1]}, false),
      (${userIds[1]}, 'Task Due Today', 'Submit childcare subsidy application for John Smith is due today.', 'task_due', 'tasks', 2, false),
      (${userIds[1]}, 'Appointment Reminder', 'Emergency housing update with Maria Rodriguez tomorrow at 9:00 AM.', 'appointment', 'appointments', 2, false),
      (${userIds[3]}, 'New Action Plan Generated', 'AI has generated a mental health & legal support plan for Angela Davis.', 'action_plan', 'action_plans', 4, false),
      (${userIds[3]}, 'Assessment Due', 'Follow-up PHQ-9 screening for Angela Davis due in 3 days.', 'assessment_due', 'assessments', 4, true),
      (${userIds[4]}, 'Milestone Achievement', 'James Thompson reached 6 months of sobriety! Review updated recovery plan.', 'milestone', 'beneficiaries', ${benIds[4]}, true),
      (${userIds[6]}, 'Home Safety Follow-up', 'Home safety modifications completed for William Anderson. Schedule reassessment.', 'follow_up', 'beneficiaries', ${benIds[6]}, false),
      (${userIds[8]}, 'VA Claim Update', 'Patricia Taylor VA disability claim acknowledgment received. Tracking number assigned.', 'update', 'beneficiaries', ${benIds[7]}, false),
      (${userIds[9]}, 'Safety Alert', 'Michael Brown restraining order renewal due in 30 days. Begin renewal process.', 'alert', 'beneficiaries', ${benIds[8]}, false),
      (${userIds[10]}, 'Medication Change', 'Christopher Garcia lithium dosage adjusted. Monitor for side effects over next 2 weeks.', 'medical', 'beneficiaries', ${benIds[10]}, false),
      (${userIds[12]}, 'Care Conference Scheduled', 'Family care conference for Margaret Moore scheduled for March 22 at 10:00 AM.', 'appointment', 'appointments', 13, false),
      (${userIds[3]}, 'Daily Safety Check', 'Elizabeth Clark daily safety check-in completed successfully.', 'safety', 'beneficiaries', ${benIds[17]}, true),
      (${userIds[0]}, 'Monthly Report Due', 'Monthly case management statistics report due by end of week.', 'admin', NULL, NULL, false),
      (${userIds[0]}, 'New AI Feature Available', 'AI-powered case summary generation is now available. Try it from any beneficiary profile.', 'system', NULL, NULL, false),
      (${userIds[1]}, 'Referral Update', 'Legal Aid Society accepted referral for Maria Rodriguez. Attorney assigned.', 'referral', 'referrals', 2, true)
      ;
    `);
    console.log('Seeded 16 notifications');

    // Seed AI Summaries (15+)
    await client.query(`
      INSERT INTO ai_summaries (beneficiary_id, caseworker_id, summary_type, content, ai_model) VALUES
      (${benIds[0]}, ${cwIds[0]}, 'case_summary', 'John Smith is a single father of two children (ages 4 and 7) enrolled in the Family Support program since January 2024. He has recently secured part-time employment and is working toward full-time stable employment. Primary needs include childcare support, food assistance, and financial stability. Current risk level is medium due to financial vulnerability despite housing stability. Progress has been positive with employment secured and children enrolled in school.', 'anthropic/claude-haiku-4.5'),
      (${benIds[1]}, ${cwIds[0]}, 'case_summary', 'Maria Rodriguez is a pregnant mother of two facing imminent eviction. Case is classified as high-risk requiring immediate intervention. Legal aid has been secured for eviction defense, and emergency housing fund application is pending. Key priorities include housing stability, prenatal care access, and family safety. The case requires intensive case management with weekly check-ins.', 'anthropic/claude-haiku-4.5'),
      (${benIds[3]}, ${cwIds[2]}, 'case_summary', 'Angela Davis is a 28-year-old woman dealing with anxiety and depression while navigating custody proceedings. High-risk classification due to mental health challenges compounded by legal stress. Treatment includes medication management and regular therapy. Pro bono legal representation has been secured for custody hearing. Safety plan and support network are in place.', 'anthropic/claude-haiku-4.5'),
      (${benIds[4]}, ${cwIds[3]}, 'case_summary', 'James Thompson has achieved a significant milestone of 6 months sobriety in his recovery journey. He is actively engaged in AA meetings and pursuing employment. Medium risk level with positive trajectory. Focus areas include continued sobriety support and employment placement to build long-term stability.', 'anthropic/claude-haiku-4.5'),
      (${benIds[6]}, ${cwIds[5]}, 'case_summary', 'William Anderson is an elderly beneficiary requiring assistance with daily living activities. Home safety modifications have been completed including grab bar installation. Home health aide services initiated 3 times per week. Medication management system established. Ongoing monitoring for fall prevention and nutritional support through Meals on Wheels enrollment.', 'anthropic/claude-haiku-4.5'),
      (${benIds[7]}, ${cwIds[6]}, 'case_summary', 'Patricia Taylor is a recently discharged veteran experiencing severe PTSD symptoms. Currently enrolled in CPT therapy at the VA Center with positive early response - nightmares reduced from nightly to 2-3 per week. VA disability claim filed and pending. Key needs include continued mental health treatment, benefits navigation, and eventual vocational rehabilitation.', 'anthropic/claude-haiku-4.5'),
      (${benIds[8]}, ${cwIds[7]}, 'case_summary', 'Michael Brown is a domestic violence survivor currently residing in a safe house with his children. High-risk case with active restraining order. Safety plan completed and children enrolled in new school. Immediate priorities include family trauma counseling, permanent housing search, and building financial independence. Case requires sensitive, trauma-informed approach.', 'anthropic/claude-haiku-4.5'),
      (${benIds[0]}, ${cwIds[0]}, 'meeting_summary', 'March 10, 2024 meeting focused on childcare and employment balance. Key developments: John secured part-time warehouse employment. Explored after-school programs at Springfield Community Center. Financial stress remains primary concern. Action items: enroll children in after-school program, submit childcare subsidy application, apply for SNAP benefits.', 'anthropic/claude-haiku-4.5'),
      (${benIds[1]}, ${cwIds[0]}, 'meeting_summary', 'March 8, 2024 emergency meeting following eviction notice receipt. Maria faces 30-day eviction deadline while pregnant with two children. Connected with Legal Aid Society for defense. Emergency housing options identified. Immediate actions: legal representation, emergency housing fund application, prenatal care referral.', 'anthropic/claude-haiku-4.5'),
      (${benIds[3]}, ${cwIds[2]}, 'risk_assessment', 'Angela Davis presents elevated risk profile due to concurrent mental health challenges and legal proceedings. PHQ-9 score of 18/27 indicates moderately severe depression. Custody-related anxiety is primary stressor. Protective factors include medication compliance, regular therapy attendance, and supportive family network. Risk mitigation: increased therapy frequency, attorney support, and ongoing safety monitoring.', 'anthropic/claude-haiku-4.5'),
      (${benIds[7]}, ${cwIds[6]}, 'risk_assessment', 'Patricia Taylor PCL-5 score of 58/80 indicates severe PTSD requiring intensive treatment. Risk factors: recent military discharge, social isolation, nightmare frequency. Protective factors: engaged in therapy, motivated for recovery, VA support system. Treatment trajectory is positive with early symptom reduction noted after 3 sessions.', 'anthropic/claude-haiku-4.5'),
      (${benIds[8]}, ${cwIds[7]}, 'risk_assessment', 'Michael Brown domestic violence lethality assessment score of 85/100 indicates high danger level. Active safety measures include restraining order and safe house placement. Children are secondary trauma victims requiring intervention. Risk is mitigated by current protections but remains elevated due to abuser behavioral patterns. Ongoing vigilance required.', 'anthropic/claude-haiku-4.5'),
      (${benIds[10]}, ${cwIds[9]}, 'case_summary', 'Christopher Garcia is diagnosed with bipolar I disorder with recent manic episode. Medication adjustment in progress with lithium dosage increase. MDQ screening score of 11/13 confirms diagnosis. Treatment plan includes close psychiatric monitoring, weekly therapy, and psychoeducation. Currently classified as high-risk during medication stabilization period.', 'anthropic/claude-haiku-4.5'),
      (${benIds[13]}, ${cwIds[12]}, 'case_summary', 'Margaret Moore is a high-risk senior beneficiary with multiple chronic conditions including hypertension, diabetes, and arthritis. Currently on 8 medications requiring careful management. Geriatric health assessment score of 38/100 reflects significant care needs. Coordinated care team has been assembled. Home health nursing visits scheduled weekly. Meals on Wheels and senior day program referrals in progress.', 'anthropic/claude-haiku-4.5'),
      (${benIds[14]}, ${cwIds[13]}, 'case_summary', 'Richard Jackson is enrolled in the Financial Aid program for debt management support. Total consumer debt of $15,000. Financial wellness assessment indicates medium risk with financial literacy gaps. Budget worksheet created with automatic bill payments established. Emergency fund goal set at $1,000. Debt reduction of $2,400 achieved in first two months shows strong commitment.', 'anthropic/claude-haiku-4.5'),
      (${benIds[17]}, ${cwIds[2]}, 'risk_assessment', 'Elizabeth Clark presents elevated suicide risk with Columbia-SSRS score of 3/5. History of suicidal ideation with previous plan. Currently stable: safety plan active, weekly therapy consistent, support group engaged. No current ideation reported for past 14 days. Daily check-ins maintaining safety. Crisis contacts verified and accessible. Medication appears effective but ongoing monitoring essential.', 'anthropic/claude-haiku-4.5')
      ;
    `);
    console.log('Seeded 16 AI summaries');

    console.log('\n✅ Database seeded successfully with all data!');
    console.log('📊 Summary:');
    console.log('   - 16 Users');
    console.log('   - 15 Caseworkers');
    console.log('   - 20 Beneficiaries');
    console.log('   - 20 Case Notes');
    console.log('   - 16 Action Plans');
    console.log('   - 22 Tasks');
    console.log('   - 17 Appointments');
    console.log('   - 16 Documents');
    console.log('   - 16 Referrals');
    console.log('   - 16 Goals');
    console.log('   - 16 Assessments');
    console.log('   - 16 Communications');
    console.log('   - 16 Notifications');
    console.log('   - 16 AI Summaries');

  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
