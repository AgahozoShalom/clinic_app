const bcrypt = require('bcrypt');
const db = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');

const getUsers = async (req, res, next) => {
  try {
    const { role, is_active, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let queryText = 'SELECT id, name, email, role, phone, is_active, created_at, updated_at FROM users WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (role) {
      queryText += ` AND role = $${paramIndex++}`;
      params.push(role);
    }

    if (is_active !== undefined) {
      queryText += ` AND is_active = $${paramIndex++}`;
      params.push(is_active === 'true');
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

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      throw new AppError('Conflict: email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, phone, is_active, created_at, updated_at',
      [name, email, hashedPassword, role, phone]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ status: 'error', code: 400, message: 'No fields to update' });
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      setClauses.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
    values.push(id);

    const queryText = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email, role, phone, is_active, created_at, updated_at`;

    const result = await db.query(queryText, values);

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (parseInt(id, 10) === parseInt(req.user.id, 10)) {
      throw new AppError('Forbidden: Cannot deactivate your own account', 403);
    }

    const result = await db.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id, is_active',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (parseInt(id, 10) === parseInt(req.user.id, 10)) {
      throw new AppError('Forbidden: Cannot delete your own account', 403);
    }

    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
};
