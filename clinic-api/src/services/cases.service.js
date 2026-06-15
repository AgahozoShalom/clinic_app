const db = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');

const getCaseDetails = async (caseId) => {
  const caseResult = await db.query(`
    SELECT
      c.id AS case_id, c.status, c.nurse_notes,
      s.id AS "student.id", s.admission_code AS "student.admission_code", s.first_name AS "student.first_name",
      s.last_name AS "student.last_name", s.grade AS "student.grade", s.class AS "student.class",
      s.mother_name AS "student.mother_name", s.mother_phone AS "student.mother_phone",
      (SELECT COALESCE(JSON_AGG(f ORDER BY f.created_at DESC), '[]') FROM (
        SELECT cf.id, cf.added_by_role, cf.findings, u.name AS added_by_name, cf.created_at
        FROM case_findings cf
        JOIN users u ON u.id = cf.added_by
        WHERE cf.case_id = c.id
      ) f) AS findings,
      (SELECT COALESCE(JSON_AGG(lt ORDER BY lt.requested_at DESC), '[]') FROM (
        SELECT lt.id, lt.test_name, lt.status, lt.results, lt.requested_at, lt.fulfilled_at
        FROM lab_tests lt
        WHERE lt.case_id = c.id
      ) lt) AS lab_tests,
      (SELECT COALESCE(JSON_AGG(m ORDER BY m.prescribed_at DESC), '[]') FROM (
        SELECT m.id, m.drug_name, m.dosage, m.instructions, m.prescribed_by_role, m.prescribed_at
        FROM medications m
        WHERE m.case_id = c.id
      ) m) AS medications,
      (SELECT ROW_TO_JSON(tr) FROM (
        SELECT t.id, t.hospital_name, t.reason, t.status, t.created_at
        FROM transfers t
        WHERE t.case_id = c.id
      ) tr) AS transfer
    FROM cases c
    JOIN students s ON s.id = c.student_id
    WHERE c.id = $1
  `, [caseId]);

  if (caseResult.rows.length === 0) {
    throw new AppError('Case not found', 404);
  }

  const row = caseResult.rows[0];
  
  return {
    case_id: row.case_id,
    status: row.status,
    nurse_notes: row.nurse_notes,
    student: {
      id: row['student.id'],
      admission_code: row['student.admission_code'],
      first_name: row['student.first_name'],
      last_name: row['student.last_name'],
      grade: row['student.grade'],
      class: row['student.class'],
      mother_name: row['student.mother_name'],
      mother_phone: row['student.mother_phone'],
    },
    findings: row.findings,
    lab_tests: row.lab_tests,
    medications: row.medications,
    transfer: row.transfer || null
  };
};

module.exports = {
  getCaseDetails,
};
