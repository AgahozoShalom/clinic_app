const db = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');

const createMedication = async (req, res, next) => {
  try {
    const { id: case_id } = req.params;
    const { drug_name, dosage, instructions } = req.body;

    const caseCheck = await db.query('SELECT status FROM cases WHERE id = $1', [case_id]);
    if (caseCheck.rows.length === 0) {
      throw new AppError('Case not found', 404);
    }
    if (caseCheck.rows[0].status !== 'open') {
      throw new AppError('Conflict: Case is not open', 409);
    }

    const result = await db.query(
      'INSERT INTO medications (case_id, prescribed_by, prescribed_by_role, drug_name, dosage, instructions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, case_id, drug_name, dosage, instructions, prescribed_by_role, prescribed_at',
      [case_id, req.user.id, req.user.role, drug_name, dosage, instructions]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getMedications = async (req, res, next) => {
  try {
    const { id: case_id } = req.params;
    const result = await db.query(
      `SELECT m.id, m.case_id, m.drug_name, m.dosage, m.instructions, m.prescribed_by_role, m.prescribed_at, u.name AS prescribed_by_name
       FROM medications m
       JOIN users u ON u.id = m.prescribed_by
       WHERE m.case_id = $1
       ORDER BY m.prescribed_at DESC`,
      [case_id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createMedication,
  getMedications,
};
