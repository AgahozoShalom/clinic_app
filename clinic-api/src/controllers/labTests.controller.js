const db = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');

const createLabTest = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { id: case_id } = req.params;
    const { test_names, notes } = req.body;

    const caseCheck = await client.query('SELECT status FROM cases WHERE id = $1', [case_id]);
    if (caseCheck.rows.length === 0) {
      throw new AppError('Case not found', 404);
    }
    if (caseCheck.rows[0].status !== 'open') {
      throw new AppError('Conflict: Case is not open', 409);
    }

    await client.query('BEGIN');

    const createdRecords = [];
    for (const test_name of test_names) {
      const result = await client.query(
        'INSERT INTO lab_tests (case_id, requested_by, test_name, status, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id, case_id, test_name, status, notes, requested_by, requested_at',
        [case_id, req.user.id, test_name, 'requested', notes || null]
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

const getLabTestsForCase = async (req, res, next) => {
  try {
    const { id: case_id } = req.params;
    const result = await db.query(
      'SELECT id, test_name, status, results, requested_by, fulfilled_by, requested_at, fulfilled_at FROM lab_tests WHERE case_id = $1 ORDER BY requested_at DESC',
      [case_id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};

const updateLabTestResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { results } = req.body;

    const testCheck = await db.query('SELECT status FROM lab_tests WHERE id = $1', [id]);
    if (testCheck.rows.length === 0) {
      throw new AppError('Lab test not found', 404);
    }
    if (testCheck.rows[0].status === 'completed') {
      throw new AppError('Conflict: Lab test already completed', 409);
    }

    const result = await db.query(
      'UPDATE lab_tests SET status = $1, results = $2, fulfilled_by = $3, fulfilled_at = NOW() WHERE id = $4 RETURNING id, status, results, fulfilled_by, fulfilled_at',
      ['completed', results, req.user.id, id]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getPendingLabTests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const countResult = await db.query('SELECT COUNT(*) FROM v_pending_lab_tests');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await db.query('SELECT * FROM v_pending_lab_tests ORDER BY requested_at LIMIT $1 OFFSET $2', [limit, offset]);

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

const getCompletedLabTests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const countResult = await db.query('SELECT COUNT(*) FROM v_completed_lab_tests');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await db.query('SELECT * FROM v_completed_lab_tests ORDER BY fulfilled_at DESC LIMIT $1 OFFSET $2', [limit, offset]);

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

module.exports = {
  createLabTest,
  getLabTestsForCase,
  updateLabTestResults,
  getPendingLabTests,
  getCompletedLabTests,
};
