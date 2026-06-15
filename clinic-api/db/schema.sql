-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role         AS ENUM ('nurse', 'doctor', 'lab_technician', 'admin');
CREATE TYPE case_status       AS ENUM ('open', 'closed', 'pending_transfer');
CREATE TYPE finding_role      AS ENUM ('doctor', 'lab_technician');
CREATE TYPE lab_test_status   AS ENUM ('requested', 'in_progress', 'completed');
CREATE TYPE medication_role   AS ENUM ('nurse', 'doctor');
CREATE TYPE transfer_status   AS ENUM ('initiated', 'confirmed', 'cancelled');
CREATE TYPE gender_type       AS ENUM ('male', 'female');

-- 1. users
CREATE TABLE users (
    id           SERIAL       PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    email        VARCHAR(150) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    role         user_role    NOT NULL,
    phone        VARCHAR(20),
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. students
CREATE TABLE students (
    id              SERIAL        PRIMARY KEY,
    admission_code  VARCHAR(30)   NOT NULL UNIQUE,
    first_name      VARCHAR(100)  NOT NULL,
    middle_name     VARCHAR(100),
    last_name       VARCHAR(100)  NOT NULL,
    family_name     VARCHAR(100)  NOT NULL,
    dob             DATE          NOT NULL,
    gender          gender_type   NOT NULL,
    nationality     VARCHAR(100)  NOT NULL,
    profile_pic     TEXT,
    grade           VARCHAR(20)   NOT NULL,
    class           VARCHAR(50)   NOT NULL,
    mother_name     VARCHAR(150)  NOT NULL,
    mother_email    VARCHAR(150),
    mother_phone    VARCHAR(20)   NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 3. cases
CREATE TABLE cases (
    id           SERIAL       PRIMARY KEY,
    student_id   INT          NOT NULL REFERENCES students(id),
    created_by   INT          NOT NULL REFERENCES users(id),
    closed_by    INT                   REFERENCES users(id),
    status       case_status  NOT NULL DEFAULT 'open',
    nurse_notes  TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    closed_at    TIMESTAMPTZ,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_closed_at CHECK (
        (status = 'closed' AND closed_at IS NOT NULL) OR (status <> 'closed')
    )
);

-- 4. case_findings
CREATE TABLE case_findings (
    id            SERIAL       PRIMARY KEY,
    case_id       INT          NOT NULL REFERENCES cases(id),
    added_by      INT          NOT NULL REFERENCES users(id),
    added_by_role finding_role NOT NULL,
    findings      TEXT         NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 5. lab_tests
CREATE TABLE lab_tests (
    id            SERIAL          PRIMARY KEY,
    case_id       INT             NOT NULL REFERENCES cases(id),
    requested_by  INT             NOT NULL REFERENCES users(id),
    fulfilled_by  INT                      REFERENCES users(id),
    test_name     VARCHAR(150)    NOT NULL,
    results       TEXT,
    status        lab_test_status NOT NULL DEFAULT 'requested',
    requested_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    fulfilled_at  TIMESTAMPTZ,
    CONSTRAINT chk_fulfilled CHECK (
        (status = 'completed' AND fulfilled_at IS NOT NULL AND results IS NOT NULL) OR
        (status <> 'completed')
    )
);

-- 6. medications
CREATE TABLE medications (
    id                 SERIAL          PRIMARY KEY,
    case_id            INT             NOT NULL REFERENCES cases(id),
    prescribed_by      INT             NOT NULL REFERENCES users(id),
    prescribed_by_role medication_role NOT NULL,
    drug_name          VARCHAR(150)    NOT NULL,
    dosage             VARCHAR(100),
    instructions       TEXT,
    prescribed_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 7. transfers
CREATE TABLE transfers (
    id            SERIAL          PRIMARY KEY,
    case_id       INT             NOT NULL UNIQUE REFERENCES cases(id),
    initiated_by  INT             NOT NULL REFERENCES users(id),
    hospital_name VARCHAR(200)    NOT NULL,
    reason        TEXT,
    status        transfer_status NOT NULL DEFAULT 'initiated',
    created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes (apply all)
CREATE INDEX idx_students_admission_code ON students(admission_code);
CREATE INDEX idx_students_last_name      ON students(last_name varchar_pattern_ops);
CREATE INDEX idx_students_family_name    ON students(family_name varchar_pattern_ops);
CREATE INDEX idx_students_first_name     ON students(first_name varchar_pattern_ops);
CREATE INDEX idx_students_grade_class    ON students(grade, class);
CREATE INDEX idx_cases_student_id        ON cases(student_id);
CREATE INDEX idx_cases_status            ON cases(status);
CREATE INDEX idx_cases_created_by        ON cases(created_by);
CREATE INDEX idx_cases_created_at        ON cases(created_at DESC);
CREATE INDEX idx_cases_nurse_open        ON cases(created_by, status) WHERE status = 'open';
CREATE INDEX idx_findings_case_id        ON case_findings(case_id);
CREATE INDEX idx_lab_case_id             ON lab_tests(case_id);
CREATE INDEX idx_lab_pending             ON lab_tests(status) WHERE status <> 'completed';
CREATE INDEX idx_lab_requested_by        ON lab_tests(requested_by);
CREATE INDEX idx_meds_case_id            ON medications(case_id);
CREATE INDEX idx_transfers_case_id       ON transfers(case_id);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_users_updated_at     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_students_updated_at  BEFORE UPDATE ON students  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cases_updated_at     BEFORE UPDATE ON cases     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_transfers_updated_at BEFORE UPDATE ON transfers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Views
CREATE OR REPLACE VIEW v_case_summary AS
SELECT
    c.id AS case_id, c.status, c.nurse_notes, c.created_at, c.closed_at,
    s.id AS student_id, s.admission_code,
    s.first_name || ' ' || COALESCE(s.middle_name || ' ', '') || s.last_name || ' (' || s.family_name || ')' AS student_full_name,
    s.grade, s.class, s.mother_name, s.mother_phone,
    u_open.name AS opened_by, u_close.name AS closed_by
FROM cases c
JOIN students s      ON s.id = c.student_id
JOIN users    u_open ON u_open.id = c.created_by
LEFT JOIN users u_close ON u_close.id = c.closed_by;

CREATE OR REPLACE VIEW v_open_cases AS
SELECT * FROM v_case_summary WHERE status = 'open' ORDER BY created_at DESC;

CREATE OR REPLACE VIEW v_pending_lab_tests AS
SELECT lt.id AS test_id, lt.test_name, lt.status AS test_status, lt.requested_at,
       c.id AS case_id, s.admission_code,
       s.first_name || ' ' || s.last_name AS student_name,
       s.grade, s.class, u_req.name AS requested_by
FROM lab_tests lt
JOIN cases c ON c.id = lt.case_id
JOIN students s ON s.id = c.student_id
JOIN users u_req ON u_req.id = lt.requested_by
WHERE lt.status <> 'completed' ORDER BY lt.requested_at;

CREATE OR REPLACE VIEW v_pending_transfers AS
SELECT t.id AS transfer_id, t.hospital_name, t.reason, t.status AS transfer_status,
       t.created_at AS transfer_initiated_at,
       cs.case_id, cs.student_full_name, cs.admission_code, cs.grade, cs.class,
       cs.mother_name, cs.mother_phone
FROM transfers t
JOIN v_case_summary cs ON cs.case_id = t.case_id
WHERE t.status = 'initiated' ORDER BY t.created_at;

-- Seed users
INSERT INTO users (name, email, password, role) VALUES
    ('Admin',        'admin@clinic.local',  '<bcrypt_hash_of_admin1234>',   'admin'),
    ('Head Nurse',   'nurse@clinic.local',  '<bcrypt_hash_of_nurse1234>',   'nurse'),
    ('Dr. Mugisha',  'doctor@clinic.local', '<bcrypt_hash_of_doctor1234>',  'doctor'),
    ('Lab Tech',     'lab@clinic.local',    '<bcrypt_hash_of_lab1234>',     'lab_technician');