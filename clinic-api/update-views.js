const db = require('./src/config/db');

async function updateViews() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DROP VIEW IF EXISTS v_pending_transfers CASCADE');
    await client.query('DROP VIEW IF EXISTS v_open_cases CASCADE');
    await client.query('DROP VIEW IF EXISTS v_case_summary CASCADE');

    await client.query(`
      CREATE OR REPLACE VIEW v_case_summary AS
      SELECT
          c.id AS case_id, c.status, c.nurse_notes, c.created_at, c.closed_at,
          s.id AS student_id, s.admission_code,
          s.first_name || ' ' || COALESCE(s.middle_name || ' ', '') || s.last_name || ' (' || s.family_name || ')' AS student_full_name,
          s.grade, s.class, s.mother_name, s.mother_phone,
          u_open.name AS opened_by, u_close.name AS closed_by_name,
          c.complaint, c.severity, c.temperature, c.blood_pressure, c.heart_rate, c.respiratory_rate
      FROM cases c
      JOIN students s      ON s.id = c.student_id
      JOIN users    u_open ON u_open.id = c.created_by
      LEFT JOIN users u_close ON u_close.id = c.closed_by;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW v_open_cases AS
      SELECT * FROM v_case_summary WHERE status = 'open' ORDER BY created_at DESC;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW v_pending_transfers AS
      SELECT t.id AS transfer_id, t.hospital_name, t.reason, t.status AS transfer_status,
             t.created_at AS transfer_initiated_at,
             cs.case_id, cs.student_full_name, cs.admission_code, cs.grade, cs.class,
             cs.mother_name, cs.mother_phone
      FROM transfers t
      JOIN v_case_summary cs ON cs.case_id = t.case_id
      WHERE t.status = 'initiated' ORDER BY t.created_at;
    `);

    await client.query('COMMIT');
    console.log('Views recreated successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}

updateViews();
