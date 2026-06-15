const bcrypt = require('bcrypt');
const db = require('./src/config/db');

async function run() {
  try {
    // Add password column if it doesn't exist
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)`);

    const adminHash = await bcrypt.hash('admin1234', 12);
    const nurseHash = await bcrypt.hash('nurse1234', 12);
    const doctorHash = await bcrypt.hash('doctor1234', 12);
    const labHash = await bcrypt.hash('lab1234', 12);

    await db.query(`UPDATE users SET password = $1 WHERE email = 'admin@clinic.local'`, [adminHash]);
    await db.query(`UPDATE users SET password = $1 WHERE email = 'nurse@clinic.local'`, [nurseHash]);
    await db.query(`UPDATE users SET password = $1 WHERE email = 'doctor@clinic.local'`, [doctorHash]);
    await db.query(`UPDATE users SET password = $1 WHERE email = 'lab@clinic.local'`, [labHash]);

    // Ensure all passwords are set before enforcing NOT NULL (if you want to, though not strictly necessary to alter column)
    console.log('Successfully updated seed user passwords with valid bcrypt hashes!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

run();
