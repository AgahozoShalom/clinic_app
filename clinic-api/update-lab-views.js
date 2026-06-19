const db = require('./src/config/db');

async function updateLabViews() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // Drop existing view if we are changing columns
    await client.query('DROP VIEW IF EXISTS v_pending_lab_tests CASCADE');
    await client.query('DROP VIEW IF EXISTS v_completed_lab_tests CASCADE');

    await client.query(`
      CREATE OR REPLACE VIEW v_pending_lab_tests AS
      SELECT lt.id AS test_id, lt.test_name, lt.status AS test_status, lt.requested_at,
             c.id AS case_id, c.severity, s.admission_code,
             s.first_name || ' ' || COALESCE(s.middle_name || ' ', '') || s.last_name AS student_name
      FROM lab_tests lt
      JOIN cases c ON c.id = lt.case_id
      JOIN students s ON s.id = c.student_id
      WHERE lt.status = 'requested' ORDER BY lt.requested_at ASC;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW v_completed_lab_tests AS
      SELECT lt.id AS test_id, lt.test_name, lt.status AS test_status, lt.results, lt.requested_at, lt.fulfilled_at,
             c.id AS case_id, c.severity, s.admission_code,
             s.first_name || ' ' || COALESCE(s.middle_name || ' ', '') || s.last_name AS student_name
      FROM lab_tests lt
      JOIN cases c ON c.id = lt.case_id
      JOIN students s ON s.id = c.student_id
      WHERE lt.status = 'completed' ORDER BY lt.fulfilled_at DESC;
    `);

    await client.query('COMMIT');
    console.log('Lab views created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}

updateLabViews();
