const router = require('express').Router();
const fetch = require('node-fetch');
const { query } = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
require('dotenv').config({ path: '../../.env' });

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const callAI = async (messages) => {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Case Manager'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages,
      max_tokens: 2000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${err}`);
  }

  return response.json();
};

// Generate Action Plan from case notes
router.post('/generate-action-plan', auth, aiRateLimiter, async (req, res) => {
  try {
    const { beneficiary_id, case_note_id } = req.body;

    // Get beneficiary info
    const benResult = await query('SELECT * FROM beneficiaries WHERE id = $1', [beneficiary_id]);
    if (benResult.rows.length === 0) return res.status(404).json({ error: 'Beneficiary not found' });
    const beneficiary = benResult.rows[0];

    // Get case history
    const historyResult = await query('SELECT * FROM case_notes WHERE beneficiary_id = $1 ORDER BY meeting_date DESC', [beneficiary_id]);
    const caseHistory = historyResult.rows;

    // Get current note if specified
    let currentNote = null;
    if (case_note_id) {
      const noteResult = await query('SELECT * FROM case_notes WHERE id = $1', [case_note_id]);
      currentNote = noteResult.rows[0];
    }

    // Get existing goals
    const goalsResult = await query('SELECT * FROM goals WHERE beneficiary_id = $1', [beneficiary_id]);

    const prompt = `You are an experienced social work case manager. Based on the following beneficiary information and case history, create a detailed 30-day action plan.

BENEFICIARY PROFILE:
- Name: ${beneficiary.first_name} ${beneficiary.last_name}
- Program: ${beneficiary.program}
- Risk Level: ${beneficiary.risk_level}
- Status: ${beneficiary.status}
- Notes: ${beneficiary.notes || 'None'}

${currentNote ? `TODAY'S MEETING NOTES:
- Date: ${currentNote.meeting_date}
- Type: ${currentNote.meeting_type}
- Summary: ${currentNote.summary}
- Details: ${currentNote.detailed_notes}
- Mood: ${currentNote.mood}
- Follow-up Needed: ${currentNote.follow_up_needed}` : ''}

CASE HISTORY (Recent meetings):
${caseHistory.slice(0, 5).map(n => `- ${n.meeting_date}: ${n.summary}`).join('\n')}

CURRENT GOALS:
${goalsResult.rows.map(g => `- ${g.title} (${g.progress}% complete)`).join('\n') || 'No goals set'}

Please create a structured 30-day action plan with:
1. A clear title for the plan
2. Week-by-week breakdown (Week 1, Week 2, Week 3, Week 4)
3. Specific, actionable items for each week
4. Any ongoing activities
5. Success metrics

Format the plan in a professional, easy-to-read format. Be specific with actions, organizations, and timelines.`;

    const aiResponse = await callAI([
      { role: 'system', content: 'You are a professional social work case management AI assistant. Create detailed, actionable plans.' },
      { role: 'user', content: prompt }
    ]);

    const planContent = aiResponse.choices[0].message.content;
    const title = `AI-Generated 30-Day Action Plan for ${beneficiary.first_name} ${beneficiary.last_name}`;

    // Save to database
    const savedPlan = await query(`
      INSERT INTO action_plans (beneficiary_id, caseworker_id, case_note_id, title, plan_content, ai_generated, status, start_date, end_date)
      VALUES ($1, (SELECT id FROM caseworkers WHERE user_id = $2 LIMIT 1), $3, $4, $5, true, 'draft', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')
      RETURNING *
    `, [beneficiary_id, req.user.id, case_note_id, title, planContent]);

    // Save AI summary
    await query(`
      INSERT INTO ai_summaries (beneficiary_id, caseworker_id, summary_type, content, ai_model, prompt_used)
      VALUES ($1, (SELECT id FROM caseworkers WHERE user_id = $2 LIMIT 1), 'action_plan', $3, $4, $5)
    `, [beneficiary_id, req.user.id, planContent, process.env.OPENROUTER_MODEL, 'Action plan generation']);

    res.json({
      plan: savedPlan.rows[0],
      ai_response: {
        content: planContent,
        model: aiResponse.model,
        usage: aiResponse.usage
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate Case Summary
router.post('/generate-summary', auth, aiRateLimiter, async (req, res) => {
  try {
    const { beneficiary_id } = req.body;

    const benResult = await query('SELECT * FROM beneficiaries WHERE id = $1', [beneficiary_id]);
    if (benResult.rows.length === 0) return res.status(404).json({ error: 'Beneficiary not found' });
    const beneficiary = benResult.rows[0];

    const notesResult = await query('SELECT * FROM case_notes WHERE beneficiary_id = $1 ORDER BY meeting_date DESC LIMIT 10', [beneficiary_id]);
    const goalsResult = await query('SELECT * FROM goals WHERE beneficiary_id = $1', [beneficiary_id]);
    const assessResult = await query('SELECT * FROM assessments WHERE beneficiary_id = $1 ORDER BY created_at DESC LIMIT 5', [beneficiary_id]);
    const referralsResult = await query('SELECT * FROM referrals WHERE beneficiary_id = $1', [beneficiary_id]);

    const prompt = `Create a comprehensive case summary for the following beneficiary:

BENEFICIARY: ${beneficiary.first_name} ${beneficiary.last_name}
Program: ${beneficiary.program} | Risk Level: ${beneficiary.risk_level} | Status: ${beneficiary.status}
Intake Date: ${beneficiary.intake_date} | Notes: ${beneficiary.notes || 'None'}

RECENT CASE NOTES:
${notesResult.rows.map(n => `- [${n.meeting_date}] ${n.meeting_type}: ${n.summary} (Mood: ${n.mood})`).join('\n')}

GOALS:
${goalsResult.rows.map(g => `- ${g.title}: ${g.progress}% (${g.status})`).join('\n') || 'None'}

ASSESSMENTS:
${assessResult.rows.map(a => `- ${a.title}: Score ${a.score}/${a.max_score} - Risk: ${a.risk_level}`).join('\n') || 'None'}

REFERRALS:
${referralsResult.rows.map(r => `- ${r.referred_to} (${r.referral_type}): ${r.status}`).join('\n') || 'None'}

Please provide:
1. Executive Summary (2-3 sentences)
2. Current Status & Progress
3. Key Strengths & Protective Factors
4. Areas of Concern
5. Recommendations for Next Steps
6. Risk Assessment Summary`;

    const aiResponse = await callAI([
      { role: 'system', content: 'You are a professional social work case management AI. Create clear, concise, and actionable case summaries.' },
      { role: 'user', content: prompt }
    ]);

    const summaryContent = aiResponse.choices[0].message.content;

    await query(`
      INSERT INTO ai_summaries (beneficiary_id, caseworker_id, summary_type, content, ai_model, prompt_used)
      VALUES ($1, (SELECT id FROM caseworkers WHERE user_id = $2 LIMIT 1), 'case_summary', $3, $4, $5)
    `, [beneficiary_id, req.user.id, summaryContent, process.env.OPENROUTER_MODEL, 'Case summary generation']);

    res.json({
      summary: summaryContent,
      ai_response: {
        content: summaryContent,
        model: aiResponse.model,
        usage: aiResponse.usage
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate Risk Assessment
router.post('/generate-risk-assessment', auth, aiRateLimiter, async (req, res) => {
  try {
    const { beneficiary_id } = req.body;

    const benResult = await query('SELECT * FROM beneficiaries WHERE id = $1', [beneficiary_id]);
    const beneficiary = benResult.rows[0];
    const notesResult = await query('SELECT * FROM case_notes WHERE beneficiary_id = $1 ORDER BY meeting_date DESC LIMIT 10', [beneficiary_id]);
    const assessResult = await query('SELECT * FROM assessments WHERE beneficiary_id = $1 ORDER BY created_at DESC', [beneficiary_id]);

    const prompt = `Perform a comprehensive risk assessment for:

BENEFICIARY: ${beneficiary.first_name} ${beneficiary.last_name}
Program: ${beneficiary.program} | Current Risk: ${beneficiary.risk_level}

RECENT INTERACTIONS:
${notesResult.rows.map(n => `- [${n.meeting_date}] ${n.summary} (Mood: ${n.mood}, Follow-up: ${n.follow_up_needed})`).join('\n')}

PREVIOUS ASSESSMENTS:
${assessResult.rows.map(a => `- ${a.title}: ${a.score}/${a.max_score} (${a.risk_level}) - ${a.findings}`).join('\n') || 'None'}

Provide:
1. Overall Risk Level (Low/Medium/High/Critical) with justification
2. Risk Factors Identified
3. Protective Factors
4. Immediate Safety Concerns (if any)
5. Recommended Interventions
6. Monitoring Frequency Recommendation
7. Escalation Triggers to Watch For`;

    const aiResponse = await callAI([
      { role: 'system', content: 'You are a clinical social work AI assistant specializing in risk assessment. Be thorough but clear.' },
      { role: 'user', content: prompt }
    ]);

    const content = aiResponse.choices[0].message.content;

    await query(`
      INSERT INTO ai_summaries (beneficiary_id, caseworker_id, summary_type, content, ai_model, prompt_used)
      VALUES ($1, (SELECT id FROM caseworkers WHERE user_id = $2 LIMIT 1), 'risk_assessment', $3, $4, $5)
    `, [beneficiary_id, req.user.id, content, process.env.OPENROUTER_MODEL, 'Risk assessment generation']);

    // Parse risk level from AI response and write back to beneficiary
    const riskMatch = content.match(/\bOverall Risk Level[:\s]+\*{0,2}(Critical|High|Medium|Low)\b/i)
      || content.match(/\b(Critical|High|Medium|Low)\s+Risk\b/i)
      || content.match(/Risk Level[:\s]+\*{0,2}(Critical|High|Medium|Low)\b/i);
    const parsedRiskLevel = riskMatch ? riskMatch[1].toLowerCase() : null;

    if (parsedRiskLevel) {
      await query(
        'UPDATE beneficiaries SET risk_level = $1, updated_at = NOW() WHERE id = $2',
        [parsedRiskLevel, beneficiary_id]
      );

      // Create notification for caseworker if risk is Critical or High
      if (parsedRiskLevel === 'critical' || parsedRiskLevel === 'high') {
        const caseworkerResult = await query(
          'SELECT id FROM caseworkers WHERE user_id = $1 LIMIT 1',
          [req.user.id]
        );
        if (caseworkerResult.rows.length > 0) {
          await query(`
            INSERT INTO notifications (user_id, title, message, notification_type, related_id, related_entity)
            VALUES ($1, $2, $3, 'alert', $4, 'beneficiary')
          `, [
            req.user.id,
            `${parsedRiskLevel.charAt(0).toUpperCase() + parsedRiskLevel.slice(1)} Risk Alert`,
            `AI risk assessment has classified beneficiary #${beneficiary_id} as ${parsedRiskLevel} risk. Immediate review recommended.`,
            beneficiary_id
          ]);
        }
      }
    }

    res.json({
      assessment: content,
      risk_level_applied: parsedRiskLevel,
      ai_response: {
        content,
        model: aiResponse.model,
        usage: aiResponse.usage
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate meeting notes summary
router.post('/summarize-notes', auth, aiRateLimiter, async (req, res) => {
  try {
    const { notes_text, beneficiary_id } = req.body;

    let context = '';
    if (beneficiary_id) {
      const benResult = await query('SELECT * FROM beneficiaries WHERE id = $1', [beneficiary_id]);
      if (benResult.rows[0]) {
        const b = benResult.rows[0];
        context = `\nBeneficiary: ${b.first_name} ${b.last_name} | Program: ${b.program} | Risk: ${b.risk_level}`;
      }
    }

    const prompt = `Summarize the following meeting notes into a professional case note format:${context}

RAW NOTES:
${notes_text}

Provide:
1. Meeting Summary (2-3 sentences)
2. Key Discussion Points
3. Beneficiary Status/Mood
4. Action Items Identified
5. Follow-up Requirements
6. Any Concerns Noted`;

    const aiResponse = await callAI([
      { role: 'system', content: 'You are a case management assistant. Summarize meeting notes professionally and concisely.' },
      { role: 'user', content: prompt }
    ]);

    res.json({
      summary: aiResponse.choices[0].message.content,
      ai_response: {
        content: aiResponse.choices[0].message.content,
        model: aiResponse.model,
        usage: aiResponse.usage
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get AI summaries for a beneficiary
router.get('/summaries/:beneficiary_id', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT s.*, u.full_name as caseworker_name
      FROM ai_summaries s
      LEFT JOIN caseworkers cw ON s.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
      WHERE s.beneficiary_id = $1
      ORDER BY s.created_at DESC
    `, [req.params.beneficiary_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
