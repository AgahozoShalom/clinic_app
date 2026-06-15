const db = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');

const createFinding = async (req, res, next) => {
  try {
    const { id: case_id } = req.params;
    const { findings } = req.body;

    const caseCheck = await db.query('SELECT status FROM cases WHERE id = $1', [case_id]);
    if (caseCheck.rows.length === 0) {
      throw new AppError('Case not found', 404);
    }
    if (caseCheck.rows[0].status === 'closed') {
      throw new AppError('Conflict: Case is closed', 409);
    }

    const result = await db.query(
      'INSERT INTO case_findings (case_id, added_by, added_by_role, findings) VALUES ($1, $2, $3, $4) RETURNING id, case_id, added_by, added_by_role, findings, created_at',
      [case_id, req.user.id, req.user.role, findings]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getFindings = async (req, res, next) => {
  try {
    const { id: case_id } = req.params;
    const result = await db.query(
      `SELECT cf.id, cf.case_id, cf.added_by, cf.added_by_role, cf.findings, cf.created_at, u.name AS added_by_name
       FROM case_findings cf
       JOIN users u ON u.id = cf.added_by
       WHERE cf.case_id = $1
       ORDER BY cf.created_at DESC`,
      [case_id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createFinding,
  getFindings,
};
