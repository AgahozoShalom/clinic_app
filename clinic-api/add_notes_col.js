const db = require('./src/config/db');

async function addNotesColumn() {
  try {
    console.log('Adding notes column to lab_tests...');
    await db.query('ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS notes TEXT;');
    console.log('notes column added successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating DB:', error);
    process.exit(1);
  }
}

addNotesColumn();
