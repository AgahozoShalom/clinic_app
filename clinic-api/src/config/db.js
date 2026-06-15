const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

/**
 * Executes a parameterized SQL query on the database.
 * @param {string} text - The SQL query text.
 * @param {Array} params - The parameterized values.
 * @returns {Promise<Object>} The query result.
 */
const query = (text, params) => pool.query(text, params);

module.exports = {
  query,
  pool,
};
