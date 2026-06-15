const db = require('../config/db');

/**
 * Get all students (with pagination and search)
 */
const getStudents = async (req, res, next) => {
  try {
    const { q, grade, class: className, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let queryText = 'SELECT id, admission_code, first_name, middle_name, last_name, family_name, dob, gender, nationality, profile_pic, grade, class, mother_name, mother_email, mother_phone FROM students WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (q) {
      // Check if q looks like an admission code (alphanumeric without spaces)
      if (/^[a-zA-Z0-9]+$/.test(q)) {
        queryText += ` AND admission_code = $${paramIndex++}`;
        params.push(q);
      } else {
        queryText += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR family_name ILIKE $${paramIndex})`;
        params.push(`%${q}%`);
        paramIndex++;
      }
    }

    if (grade) {
      queryText += ` AND grade = $${paramIndex++}`;
      params.push(grade);
    }
    
    if (className) {
      queryText += ` AND class = $${paramIndex++}`;
      params.push(className);
    }

    // Count total query
    const countQuery = `SELECT COUNT(*) FROM (${queryText}) AS t`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    queryText += ` ORDER BY last_name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
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

/**
 * Get student by ID
 */
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT id, admission_code, first_name, middle_name, last_name, family_name, dob, gender, nationality, profile_pic, grade, class, mother_name, mother_email, mother_phone FROM students WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Student not found',
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new student
 */
const createStudent = async (req, res, next) => {
  try {
    const data = req.body;
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const columns = fields.join(', ');

    const queryText = `INSERT INTO students (${columns}) VALUES (${placeholders}) RETURNING id, admission_code, first_name, middle_name, last_name, family_name, dob, gender, nationality, profile_pic, grade, class, mother_name, mother_email, mother_phone`;
    
    const result = await db.query(queryText, values);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * Update a student
 */
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'No fields to update',
      });
    }

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      setClauses.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
    values.push(id);

    const queryText = `UPDATE students SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING id, admission_code, first_name, middle_name, last_name, family_name, dob, gender, nationality, profile_pic, grade, class, mother_name, mother_email, mother_phone`;
    
    const result = await db.query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Student not found',
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
};
