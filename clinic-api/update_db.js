const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

async function updateDb() {
  try {
    console.log('Adding needs_follow_up column...');
    await db.query('ALTER TABLE cases ADD COLUMN IF NOT EXISTS needs_follow_up BOOLEAN DEFAULT FALSE;');
    console.log('needs_follow_up column added/verified.');

    console.log('Updating views...');
    const viewsSql = fs.readFileSync(path.join(__dirname, 'update_views.sql'), 'utf8');
    await db.query(viewsSql);
    console.log('Views updated successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Error updating DB:', error);
    process.exit(1);
  }
}

updateDb();
