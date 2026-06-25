DROP VIEW IF EXISTS v_pending_transfers CASCADE;
DROP VIEW IF EXISTS v_open_cases CASCADE;
DROP VIEW IF EXISTS v_case_summary CASCADE;

CREATE OR REPLACE VIEW v_case_summary AS
SELECT
    c.id AS case_id, c.status, c.nurse_notes, c.created_at, c.closed_at, c.needs_doctor, c.needs_follow_up,
    s.id AS student_id, s.admission_code, s.family_name,
    s.first_name || ' ' || COALESCE(s.middle_name || ' ', '') || s.last_name AS student_full_name,
    s.grade, s.class, s.mother_name, s.mother_phone,
    u_open.name AS opened_by, u_close.name AS closed_by,
    CASE 
      WHEN c.status = 'closed' AND u_close.role = 'doctor' THEN 'Reviewed'
      WHEN EXISTS (SELECT 1 FROM transfers t WHERE t.case_id = c.id AND t.status IN ('initiated', 'confirmed')) THEN 'Transferred'
      WHEN c.needs_doctor = TRUE THEN 'Not Reviewed'
      ELSE 'N/A'
    END AS doctor_status,
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM lab_tests lt WHERE lt.case_id = c.id) THEN 'N/A'
      WHEN EXISTS (SELECT 1 FROM lab_tests lt WHERE lt.case_id = c.id AND lt.status <> 'completed') THEN 'Pending'
      ELSE 'Ready'
    END AS lab_status
FROM cases c
JOIN students s      ON s.id = c.student_id
JOIN users    u_open ON u_open.id = c.created_by
LEFT JOIN users u_close ON u_close.id = c.closed_by;

CREATE OR REPLACE VIEW v_open_cases AS
SELECT * FROM v_case_summary WHERE status = 'open' ORDER BY created_at DESC;

CREATE OR REPLACE VIEW v_pending_transfers AS
SELECT t.id AS transfer_id, t.hospital_name, t.reason, t.status AS transfer_status,
       t.created_at AS transfer_initiated_at,
       cs.case_id, cs.student_full_name, cs.family_name, cs.admission_code, cs.grade, cs.class,
       cs.mother_name, cs.mother_phone
FROM transfers t
JOIN v_case_summary cs ON cs.case_id = t.case_id
WHERE t.status = 'initiated' ORDER BY t.created_at;
