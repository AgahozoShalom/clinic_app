const db = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');
const casesService = require('../services/cases.service');

const createCase = async (req, res, next) => {
  try {
    const { student_id, nurse_notes, complaint, temperature, blood_pressure, heart_rate, respiratory_rate, severity } = req.body;

    // Validate student exists
    const studentCheck = await db.query('SELECT id FROM students WHERE id = $1', [student_id]);
    if (studentCheck.rows.length === 0) {
      throw new AppError('Student not found', 404);
    }

    const result = await db.query(
      'INSERT INTO cases (student_id, created_by, nurse_notes, complaint, temperature, blood_pressure, heart_rate, respiratory_rate, severity, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, student_id, status, created_by, nurse_notes, created_at',
      [student_id, req.user.id, nurse_notes, complaint, temperature, blood_pressure, heart_rate, respiratory_rate, severity || 'low', 'open']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getCases = async (req, res, next) => {
  try {
    const { status, student_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let queryText = 'SELECT * FROM v_case_summary WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      queryText += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (student_id) {
      queryText += ` AND student_id = $${paramIndex++}`;
      params.push(student_id);
    }

    if (req.user.role === 'nurse') {
      queryText += ` AND opened_by = (SELECT name FROM users WHERE id = $${paramIndex++})`;
      params.push(req.user.id);
    }

    const countQuery = `SELECT COUNT(*) FROM (${queryText}) AS t`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await db.query(queryText, params);

    res.status(200).json({
      data: result.rows,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (err) {
    next(err);
  }
};

const getCaseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const caseDetails = await casesService.getCaseDetails(id);
    res.status(200).json(caseDetails);
  } catch (err) {
    next(err);
  }
};

const closeCase = async (req, res, next) => {
  try {
    const { id } = req.params;

    const caseCheck = await db.query('SELECT status FROM cases WHERE id = $1', [id]);
    if (caseCheck.rows.length === 0) {
      throw new AppError('Case not found', 404);
    }

    const currentStatus = caseCheck.rows[0].status;
    if (currentStatus !== 'open' && currentStatus !== 'pending_transfer') {
      throw new AppError('Conflict: Case is not open or pending transfer', 409);
    }

    const result = await db.query(
      'UPDATE cases SET status = $1, closed_by = $2, closed_at = NOW() WHERE id = $3 RETURNING id, status, closed_by, closed_at',
      ['closed', req.user.id, id]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getOpenQueue = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM v_open_cases WHERE opened_by = (SELECT name FROM users WHERE id = $1)',
      [req.user.id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};

const addFindings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const result = await db.query(
      'INSERT INTO case_findings (case_id, added_by, added_by_role, findings) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, req.user.id, req.user.role, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const addLabTest = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { test_name, test_names, notes } = req.body;
    
    const testsToRequest = test_names || (test_name ? [test_name] : []);
    
    if (testsToRequest.length === 0) {
      throw new AppError('No test names provided', 400);
    }

    await client.query('BEGIN');

    const createdRecords = [];
    for (const test of testsToRequest) {
      const result = await client.query(
        'INSERT INTO lab_tests (case_id, requested_by, test_name, status, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [id, req.user.id, test, 'requested', notes || null]
      );
      createdRecords.push(result.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json(createdRecords);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const addMedication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { drug_name, dosage, instructions } = req.body;
    const result = await db.query(
      'INSERT INTO medications (case_id, prescribed_by, prescribed_by_role, drug_name, dosage, instructions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, req.user.id, req.user.role, drug_name, dosage, instructions]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const escalateCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Flag the case
    await db.query('UPDATE cases SET needs_doctor = true WHERE id = $1', [id]);
    
    // Add finding if notes are provided
    if (req.body.notes) {
      await db.query(
        'INSERT INTO case_findings (case_id, added_by, added_by_role, findings) VALUES ($1, $2, $3, $4)',
        [id, req.user.id, 'doctor', `[ESCALATED TO DOCTOR] ${req.body.notes}`]
      );
    } else {
      await db.query(
        'INSERT INTO case_findings (case_id, added_by, added_by_role, findings) VALUES ($1, $2, $3, $4)',
        [id, req.user.id, 'doctor', `[ESCALATED TO DOCTOR] Case requires doctor attention.`]
      );
    }

    res.status(200).json({ status: 'success', message: 'Case escalated to doctor' });
  } catch (err) {
    next(err);
  }
};

const toggleFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const caseCheck = await db.query('SELECT status, needs_follow_up FROM cases WHERE id = $1', [id]);
    if (caseCheck.rows.length === 0) {
      throw new AppError('Case not found', 404);
    }

    if (caseCheck.rows[0].status !== 'closed') {
      throw new AppError('Conflict: Follow up can only be set on closed cases', 409);
    }

    const currentStatus = caseCheck.rows[0].needs_follow_up;
    const newStatus = !currentStatus;

    const result = await db.query(
      'UPDATE cases SET needs_follow_up = $1, updated_at = NOW() WHERE id = $2 RETURNING id, needs_follow_up',
      [newStatus, id]
    );

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCase,
  getCases,
  getCaseById,
  closeCase,
  getOpenQueue,
  addFindings,
  addLabTest,
  addMedication,
  escalateCase,
  toggleFollowUp,
};
