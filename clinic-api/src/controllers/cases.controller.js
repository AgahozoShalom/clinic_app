const db = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');
const casesService = require('../services/cases.service');

const createCase = async (req, res, next) => {
  try {
    const { student_id, nurse_notes } = req.body;

    // Validate student exists
    const studentCheck = await db.query('SELECT id FROM students WHERE id = $1', [student_id]);
    if (studentCheck.rows.length === 0) {
      throw new AppError('Student not found', 404);
    }

    const result = await db.query(
      'INSERT INTO cases (student_id, created_by, nurse_notes, status) VALUES ($1, $2, $3, $4) RETURNING id, student_id, status, created_by, nurse_notes, created_at',
      [student_id, req.user.id, nurse_notes, 'open']
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
    if (currentStatus !== 'open' || currentStatus !== 'pending_transfer') {
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

module.exports = {
  createCase,
  getCases,
  getCaseById,
  closeCase,
  getOpenQueue,
};
