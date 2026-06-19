const db = require('./src/config/db');
db.query(`CREATE OR REPLACE VIEW v_case_summary AS
SELECT
    c.id AS case_id, c.status, c.nurse_notes, c.complaint, c.severity, c.temperature, c.blood_pressure, c.heart_rate, c.respiratory_rate, c.created_at, c.closed_at,
    s.id AS student_id, s.admission_code,
    s.first_name || ' ' || COALESCE(s.middle_name || ' ', '') || s.last_name || ' (' || s.family_name || ')' AS student_full_name,
    s.grade, s.class, s.mother_name, s.mother_phone,
    u_open.name AS opened_by, u_close.name AS closed_by
FROM cases c
JOIN students s      ON s.id = c.student_id
JOIN users    u_open ON u_open.id = c.created_by
LEFT JOIN users u_close ON u_close.id = c.closed_by;`)
.then(() => console.log('View updated'))
.catch(console.error)
.finally(() => process.exit(0));
