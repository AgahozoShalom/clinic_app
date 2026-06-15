require('dotenv').config();
const app = require('./src/app');
const db = require('./src/config/db');

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    const res = await db.query('SELECT NOW()');
    console.log('Database connected successfully:', res.rows[0].now);
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
  }
});
