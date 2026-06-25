const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function updateViews() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'update_views.sql'), 'utf-8');
    await db.query(sql);
    console.log('Views updated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating views:', error);
    process.exit(1);
  }
}

updateViews();
