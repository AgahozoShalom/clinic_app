--
-- PostgreSQL database dump
--

\restrict IOGWQh7HLUARGqGBcAl72D4qPN59hMS1TMhuYert2QiuX0e2USvJKTCPkb1eUze

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-07-09 09:57:10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16387)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5216 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 909 (class 1247 OID 16426)
-- Name: case_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.case_status AS ENUM (
    'open',
    'closed',
    'pending_transfer'
);


ALTER TYPE public.case_status OWNER TO postgres;

--
-- TOC entry 912 (class 1247 OID 16434)
-- Name: finding_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.finding_role AS ENUM (
    'doctor',
    'lab_technician',
    'nurse'
);


ALTER TYPE public.finding_role OWNER TO postgres;

--
-- TOC entry 915 (class 1247 OID 16442)
-- Name: gender_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.gender_type AS ENUM (
    'male',
    'female'
);


ALTER TYPE public.gender_type OWNER TO postgres;

--
-- TOC entry 918 (class 1247 OID 16448)
-- Name: lab_test_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lab_test_status AS ENUM (
    'requested',
    'in_progress',
    'completed'
);


ALTER TYPE public.lab_test_status OWNER TO postgres;

--
-- TOC entry 921 (class 1247 OID 16456)
-- Name: medication_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.medication_role AS ENUM (
    'nurse',
    'doctor'
);


ALTER TYPE public.medication_role OWNER TO postgres;

--
-- TOC entry 924 (class 1247 OID 16462)
-- Name: transfer_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.transfer_status AS ENUM (
    'initiated',
    'confirmed',
    'cancelled'
);


ALTER TYPE public.transfer_status OWNER TO postgres;

--
-- TOC entry 927 (class 1247 OID 16470)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'nurse',
    'doctor',
    'lab_technician',
    'admin'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 276 (class 1255 OID 16479)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16480)
-- Name: case_findings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.case_findings (
    id integer NOT NULL,
    case_id integer NOT NULL,
    added_by integer NOT NULL,
    added_by_role public.finding_role NOT NULL,
    findings text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.case_findings OWNER TO postgres;

--
-- TOC entry 5217 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE case_findings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.case_findings IS 'Clinical notes added by a doctor or lab technician to a case.';


--
-- TOC entry 5218 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN case_findings.added_by_role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.case_findings.added_by_role IS 'Snapshot of role at time of entry — stays accurate even if user role changes later.';


--
-- TOC entry 221 (class 1259 OID 16492)
-- Name: case_findings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.case_findings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.case_findings_id_seq OWNER TO postgres;

--
-- TOC entry 5219 (class 0 OID 0)
-- Dependencies: 221
-- Name: case_findings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.case_findings_id_seq OWNED BY public.case_findings.id;


--
-- TOC entry 222 (class 1259 OID 16493)
-- Name: cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cases (
    id integer NOT NULL,
    student_id integer NOT NULL,
    created_by integer NOT NULL,
    closed_by integer,
    status public.case_status DEFAULT 'open'::public.case_status NOT NULL,
    nurse_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    complaint text,
    temperature numeric(4,1),
    blood_pressure character varying(20),
    heart_rate integer,
    respiratory_rate integer,
    severity character varying(20) DEFAULT 'low'::character varying,
    needs_doctor boolean DEFAULT false,
    needs_follow_up boolean DEFAULT false,
    CONSTRAINT chk_closed_at CHECK ((((status = 'closed'::public.case_status) AND (closed_at IS NOT NULL)) OR (status <> 'closed'::public.case_status)))
);


ALTER TABLE public.cases OWNER TO postgres;

--
-- TOC entry 5220 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE cases; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cases IS 'Central consultation record — every other table links here.';


--
-- TOC entry 5221 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN cases.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cases.status IS 'open → active visit; closed → resolved; pending_transfer → awaiting outside hospital.';


--
-- TOC entry 5222 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN cases.nurse_notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cases.nurse_notes IS 'Initial triage observations recorded by the nurse.';


--
-- TOC entry 223 (class 1259 OID 16510)
-- Name: cases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cases_id_seq OWNER TO postgres;

--
-- TOC entry 5223 (class 0 OID 0)
-- Dependencies: 223
-- Name: cases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cases_id_seq OWNED BY public.cases.id;


--
-- TOC entry 224 (class 1259 OID 16511)
-- Name: lab_tests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lab_tests (
    id integer NOT NULL,
    case_id integer NOT NULL,
    requested_by integer NOT NULL,
    fulfilled_by integer,
    test_name character varying(150) NOT NULL,
    results text,
    status public.lab_test_status DEFAULT 'requested'::public.lab_test_status NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    fulfilled_at timestamp with time zone,
    notes text,
    CONSTRAINT chk_fulfilled CHECK ((((status = 'completed'::public.lab_test_status) AND (fulfilled_at IS NOT NULL) AND (results IS NOT NULL)) OR (status <> 'completed'::public.lab_test_status)))
);


ALTER TABLE public.lab_tests OWNER TO postgres;

--
-- TOC entry 5224 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE lab_tests; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.lab_tests IS 'Lab investigations requested and fulfilled within a case.';


--
-- TOC entry 5225 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN lab_tests.fulfilled_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lab_tests.fulfilled_by IS 'Set to the lab technician who uploaded the results.';


--
-- TOC entry 225 (class 1259 OID 16525)
-- Name: lab_tests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lab_tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lab_tests_id_seq OWNER TO postgres;

--
-- TOC entry 5226 (class 0 OID 0)
-- Dependencies: 225
-- Name: lab_tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lab_tests_id_seq OWNED BY public.lab_tests.id;


--
-- TOC entry 226 (class 1259 OID 16526)
-- Name: medications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medications (
    id integer NOT NULL,
    case_id integer NOT NULL,
    prescribed_by integer NOT NULL,
    prescribed_by_role public.medication_role NOT NULL,
    drug_name character varying(150) NOT NULL,
    dosage character varying(100),
    instructions text,
    prescribed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.medications OWNER TO postgres;

--
-- TOC entry 5227 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE medications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.medications IS 'Drugs given or prescribed within a case.';


--
-- TOC entry 5228 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN medications.prescribed_by_role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.medications.prescribed_by_role IS 'nurse = direct dispensing; doctor = written prescription.';


--
-- TOC entry 227 (class 1259 OID 16538)
-- Name: medications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medications_id_seq OWNER TO postgres;

--
-- TOC entry 5229 (class 0 OID 0)
-- Dependencies: 227
-- Name: medications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medications_id_seq OWNED BY public.medications.id;


--
-- TOC entry 228 (class 1259 OID 16539)
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id integer NOT NULL,
    admission_code character varying(30) NOT NULL,
    first_name character varying(100) NOT NULL,
    middle_name character varying(100),
    last_name character varying(100) NOT NULL,
    family_name character varying(100) NOT NULL,
    dob date NOT NULL,
    gender public.gender_type NOT NULL,
    nationality character varying(100) NOT NULL,
    profile_pic text,
    grade character varying(20) NOT NULL,
    class character varying(50) NOT NULL,
    mother_name character varying(150) NOT NULL,
    mother_email character varying(150),
    mother_phone character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.students OWNER TO postgres;

--
-- TOC entry 5230 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE students; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.students IS 'Students who visit the clinic.';


--
-- TOC entry 5231 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN students.admission_code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.students.admission_code IS 'Unique institutional code used for search and lookup.';


--
-- TOC entry 5232 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN students.last_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.students.last_name IS 'Individual surname, e.g. Uwimana.';


--
-- TOC entry 5233 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN students.family_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.students.family_name IS 'Family or clan name — distinct from last name, e.g. Inzoga.';


--
-- TOC entry 5234 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN students.profile_pic; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.students.profile_pic IS 'URL or file-storage path to the student profile photo.';


--
-- TOC entry 5235 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN students.grade; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.students.grade IS 'Academic grade level, e.g. S1, S2, P5, P6.';


--
-- TOC entry 5236 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN students.class; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.students.class IS 'Specific class within the grade, e.g. S1 Maple.';


--
-- TOC entry 5237 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN students.mother_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.students.mother_name IS 'Primary guardian full name.';


--
-- TOC entry 5238 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN students.mother_phone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.students.mother_phone IS 'Primary emergency contact number.';


--
-- TOC entry 229 (class 1259 OID 16560)
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO postgres;

--
-- TOC entry 5239 (class 0 OID 0)
-- Dependencies: 229
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- TOC entry 230 (class 1259 OID 16561)
-- Name: transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transfers (
    id integer NOT NULL,
    case_id integer NOT NULL,
    initiated_by integer NOT NULL,
    hospital_name character varying(200) NOT NULL,
    reason text,
    status public.transfer_status DEFAULT 'initiated'::public.transfer_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.transfers OWNER TO postgres;

--
-- TOC entry 5240 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE transfers; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.transfers IS 'External hospital transfer; one record per case.';


--
-- TOC entry 5241 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN transfers.case_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.transfers.case_id IS 'UNIQUE constraint enforces one transfer per case.';


--
-- TOC entry 231 (class 1259 OID 16576)
-- Name: transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transfers_id_seq OWNER TO postgres;

--
-- TOC entry 5242 (class 0 OID 0)
-- Dependencies: 231
-- Name: transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transfers_id_seq OWNED BY public.transfers.id;


--
-- TOC entry 232 (class 1259 OID 16577)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    role public.user_role NOT NULL,
    phone character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    password character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5243 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'System users: nurses, doctors, lab technicians, admins.';


--
-- TOC entry 5244 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN users.role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.role IS 'Determines which actions the user can perform in the flow.';


--
-- TOC entry 5245 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN users.is_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.is_active IS 'Soft-delete flag; deactivate instead of deleting.';


--
-- TOC entry 233 (class 1259 OID 16592)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5246 (class 0 OID 0)
-- Dependencies: 233
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 236 (class 1259 OID 16787)
-- Name: v_case_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_case_summary AS
 SELECT c.id AS case_id,
    c.status,
    c.nurse_notes,
    c.created_at,
    c.closed_at,
    c.needs_doctor,
    c.needs_follow_up,
    s.id AS student_id,
    s.admission_code,
    s.family_name,
    ((((s.first_name)::text || ' '::text) || COALESCE(((s.middle_name)::text || ' '::text), ''::text)) || (s.last_name)::text) AS student_full_name,
    s.grade,
    s.class,
    s.mother_name,
    s.mother_phone,
    u_open.name AS opened_by,
    u_close.name AS closed_by,
        CASE
            WHEN ((c.status = 'closed'::public.case_status) AND (u_close.role = 'doctor'::public.user_role)) THEN 'Reviewed'::text
            WHEN (EXISTS ( SELECT 1
               FROM public.transfers t
              WHERE ((t.case_id = c.id) AND (t.status = ANY (ARRAY['initiated'::public.transfer_status, 'confirmed'::public.transfer_status]))))) THEN 'Transferred'::text
            WHEN (c.needs_doctor = true) THEN 'Not Reviewed'::text
            ELSE 'N/A'::text
        END AS doctor_status,
        CASE
            WHEN (NOT (EXISTS ( SELECT 1
               FROM public.lab_tests lt
              WHERE (lt.case_id = c.id)))) THEN 'N/A'::text
            WHEN (EXISTS ( SELECT 1
               FROM public.lab_tests lt
              WHERE ((lt.case_id = c.id) AND (lt.status <> 'completed'::public.lab_test_status)))) THEN 'Pending'::text
            ELSE 'Ready'::text
        END AS lab_status
   FROM (((public.cases c
     JOIN public.students s ON ((s.id = c.student_id)))
     JOIN public.users u_open ON ((u_open.id = c.created_by)))
     LEFT JOIN public.users u_close ON ((u_close.id = c.closed_by)));


ALTER VIEW public.v_case_summary OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16598)
-- Name: v_completed_lab_tests; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_completed_lab_tests AS
 SELECT lt.id AS test_id,
    lt.test_name,
    lt.status AS test_status,
    lt.results,
    lt.requested_at,
    lt.fulfilled_at,
    c.id AS case_id,
    c.severity,
    s.admission_code,
    ((((s.first_name)::text || ' '::text) || COALESCE(((s.middle_name)::text || ' '::text), ''::text)) || (s.last_name)::text) AS student_name
   FROM ((public.lab_tests lt
     JOIN public.cases c ON ((c.id = lt.case_id)))
     JOIN public.students s ON ((s.id = c.student_id)))
  WHERE (lt.status = 'completed'::public.lab_test_status)
  ORDER BY lt.fulfilled_at DESC;


ALTER VIEW public.v_completed_lab_tests OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16792)
-- Name: v_open_cases; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_open_cases AS
 SELECT case_id,
    status,
    nurse_notes,
    created_at,
    closed_at,
    needs_doctor,
    needs_follow_up,
    student_id,
    admission_code,
    family_name,
    student_full_name,
    grade,
    class,
    mother_name,
    mother_phone,
    opened_by,
    closed_by,
    doctor_status,
    lab_status
   FROM public.v_case_summary
  WHERE (status = 'open'::public.case_status)
  ORDER BY created_at DESC;


ALTER VIEW public.v_open_cases OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16608)
-- Name: v_pending_lab_tests; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_pending_lab_tests AS
 SELECT lt.id AS test_id,
    lt.test_name,
    lt.status AS test_status,
    lt.requested_at,
    c.id AS case_id,
    c.severity,
    s.admission_code,
    ((((s.first_name)::text || ' '::text) || COALESCE(((s.middle_name)::text || ' '::text), ''::text)) || (s.last_name)::text) AS student_name
   FROM ((public.lab_tests lt
     JOIN public.cases c ON ((c.id = lt.case_id)))
     JOIN public.students s ON ((s.id = c.student_id)))
  WHERE (lt.status = 'requested'::public.lab_test_status)
  ORDER BY lt.requested_at;


ALTER VIEW public.v_pending_lab_tests OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16797)
-- Name: v_pending_transfers; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_pending_transfers AS
 SELECT t.id AS transfer_id,
    t.hospital_name,
    t.reason,
    t.status AS transfer_status,
    t.created_at AS transfer_initiated_at,
    cs.case_id,
    cs.student_full_name,
    cs.family_name,
    cs.admission_code,
    cs.grade,
    cs.class,
    cs.mother_name,
    cs.mother_phone
   FROM (public.transfers t
     JOIN public.v_case_summary cs ON ((cs.case_id = t.case_id)))
  WHERE (t.status = 'initiated'::public.transfer_status)
  ORDER BY t.created_at;


ALTER VIEW public.v_pending_transfers OWNER TO postgres;

--
-- TOC entry 4966 (class 2604 OID 16618)
-- Name: case_findings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_findings ALTER COLUMN id SET DEFAULT nextval('public.case_findings_id_seq'::regclass);


--
-- TOC entry 4968 (class 2604 OID 16619)
-- Name: cases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases ALTER COLUMN id SET DEFAULT nextval('public.cases_id_seq'::regclass);


--
-- TOC entry 4975 (class 2604 OID 16620)
-- Name: lab_tests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_tests ALTER COLUMN id SET DEFAULT nextval('public.lab_tests_id_seq'::regclass);


--
-- TOC entry 4978 (class 2604 OID 16621)
-- Name: medications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medications ALTER COLUMN id SET DEFAULT nextval('public.medications_id_seq'::regclass);


--
-- TOC entry 4980 (class 2604 OID 16622)
-- Name: students id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- TOC entry 4983 (class 2604 OID 16623)
-- Name: transfers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfers ALTER COLUMN id SET DEFAULT nextval('public.transfers_id_seq'::regclass);


--
-- TOC entry 4987 (class 2604 OID 16624)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5197 (class 0 OID 16480)
-- Dependencies: 220
-- Data for Name: case_findings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.case_findings (id, case_id, added_by, added_by_role, findings, created_at) FROM stdin;
\.


--
-- TOC entry 5199 (class 0 OID 16493)
-- Dependencies: 222
-- Data for Name: cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cases (id, student_id, created_by, closed_by, status, nurse_notes, created_at, closed_at, updated_at, complaint, temperature, blood_pressure, heart_rate, respiratory_rate, severity, needs_doctor, needs_follow_up) FROM stdin;
\.


--
-- TOC entry 5201 (class 0 OID 16511)
-- Dependencies: 224
-- Data for Name: lab_tests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lab_tests (id, case_id, requested_by, fulfilled_by, test_name, results, status, requested_at, fulfilled_at, notes) FROM stdin;
\.


--
-- TOC entry 5203 (class 0 OID 16526)
-- Dependencies: 226
-- Data for Name: medications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medications (id, case_id, prescribed_by, prescribed_by_role, drug_name, dosage, instructions, prescribed_at) FROM stdin;
\.


--
-- TOC entry 5205 (class 0 OID 16539)
-- Dependencies: 228
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, admission_code, first_name, middle_name, last_name, family_name, dob, gender, nationality, profile_pic, grade, class, mother_name, mother_email, mother_phone, created_at, updated_at) FROM stdin;
4131	2029176128	Uwase 	\N	Gloire	Queen Ana Njinga	2009-02-16	female	Congolaise	\N	Ingabe	EY-Falcon	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.178214+02	2026-07-08 17:25:04.178214+02
4132	2029176127	RUTIKANGA 	KARABO	Gladys	Queen Ana Njinga	2009-07-10	female	Rwandan	\N	Ingabe	EY-Falcon	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.204752+02	2026-07-08 17:25:04.204752+02
4133	2029176126	Blandine	\N	NIWEMWIZA	Queen Ana Njinga	2009-01-17	female	Rwandan	\N	Ingabe	EY-Sparrow	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.205576+02	2026-07-08 17:25:04.205576+02
4134	2029176125	Lisa	Mucyo	Murangwayire	Queen Ana Njinga	2010-09-16	female	Rwandan	\N	Ingabe	EY-Eagle	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.206311+02	2026-07-08 17:25:04.206311+02
4135	2029176124	Munanira 	Celine	Doicha	Queen Ana Njinga	2009-02-13	female	Rwandan	\N	Ingabe	EY-Falcon	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.206904+02	2026-07-08 17:25:04.206904+02
4136	2029176123	MUHORAKEYE 	IRIZA	Prisca	Queen Ana Njinga	2008-07-04	female	Rwandan	\N	Ingabe	EY-Falcon	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.207435+02	2026-07-08 17:25:04.207435+02
4137	2029176122	Keza	Munezero	Hanniyah	Queen Ana Njinga	2010-12-17	female	Rwandan	\N	Ingabe	EY-Falcon	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.209449+02	2026-07-08 17:25:04.209449+02
4138	2029176121	KEZA	\N	Deborah	Queen Ana Njinga	2010-03-03	female	Rwandan	\N	Ingabe	EY-Eagle	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.210776+02	2026-07-08 17:25:04.210776+02
4139	2029176120	Keza	\N	Annick	Queen Ana Njinga	2010-03-26	female	Rwandan	\N	Ingabe	EY-Dove	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.212363+02	2026-07-08 17:25:04.212363+02
4140	2029176119	Karigirwa	\N	Mellon	Queen Ana Njinga	2009-03-05	female	Rwandan	\N	Ingabe	EY-Eagle	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.213124+02	2026-07-08 17:25:04.213124+02
4141	2029176118	Kaliza	\N	Shallon	Queen Ana Njinga	2010-07-15	female	Rwandan	\N	Ingabe	EY-Eagle	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.213788+02	2026-07-08 17:25:04.213788+02
4142	2029176117	KALIZA	\N	Delice	Queen Ana Njinga	2009-09-08	female	Rwandan	\N	Ingabe	EY-Sparrow	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.214439+02	2026-07-08 17:25:04.214439+02
4143	2029176116	Iriza	Bigirimana	oren	Queen Ana Njinga	2010-04-25	female	Rwandan	\N	Ingabe	EY-Eagle	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.215061+02	2026-07-08 17:25:04.215061+02
4144	2029176115	IRADUKUNDA	NSINGA	 Edna	Queen Ana Njinga	2009-04-02	female	Rwandan	\N	Ingabe	EY-Eagle	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.215959+02	2026-07-08 17:25:04.215959+02
4145	2029176114	IRADUKUNDA	NDAYISHIMIYE ANGE	KESSIA	Queen Ana Njinga	2009-01-31	female	Rwandan	\N	Ingabe	EY-Dove	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.216814+02	2026-07-08 17:25:04.216814+02
4146	2029176113	Ikirezi	Iradukunda	Faustine	Queen Ana Njinga	2009-08-01	female	Rwandan	\N	Ingabe	EY-Dove	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.217415+02	2026-07-08 17:25:04.217415+02
4147	2029176112	HUNDO	SAKINDI	Kenza	Queen Ana Njinga	2010-07-27	female	Rwandan	\N	Ingabe	EY-Eagle	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.218125+02	2026-07-08 17:25:04.218125+02
4148	2029176111	Gasaro 	Rugamba	Bella	Queen Ana Njinga	2010-08-09	female	Rwandan	\N	Ingabe	EY-Dove	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.220315+02	2026-07-08 17:25:04.220315+02
4149	2029176110	BAGAMBIKI	ISIMBI	Marie Merveille	Queen Ana Njinga	2010-10-06	female	Rwandan	\N	Ingabe	EY-Dove	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.221495+02	2026-07-08 17:25:04.221495+02
4150	2029176109	Uwase	\N	Darilla	Queen Ana Njinga	2008-05-31	female	Rwandan	\N	Ingabe	EY-Falcon	Nyambuga Marie Claire	familyMothers@asyv.org	788570113	2026-07-08 17:25:04.222328+02	2026-07-08 17:25:04.222328+02
4151	2029175108	UMUTONI	\N	Anathalie	Mary Jackson	2009-05-31	female	Rwandan	\N	Ingabe	EY-Dove	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.222895+02	2026-07-08 17:25:04.222895+02
4152	2029175107	UMUTESI	Marie Louange	Stephanie	Mary Jackson	2009-01-17	female	Rwandan	\N	Ingabe	EY-Eagle	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.223506+02	2026-07-08 17:25:04.223506+02
4153	2029175106	UMUHOZA	\N	Genisse	Mary Jackson	2009-12-01	female	Congolaise	\N	Ingabe	EY-Sparrow	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.224707+02	2026-07-08 17:25:04.224707+02
4154	2029175105	TETA	NDAYISABA	Alaine	Mary Jackson	2010-07-11	female	Rwandan	\N	Ingabe	EY-Dove	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.2259+02	2026-07-08 17:25:04.2259+02
4155	2029175104	MUCYO	\N	Hope	Mary Jackson	2009-11-28	female	Rwandan	\N	Ingabe	EY-Eagle	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.227119+02	2026-07-08 17:25:04.227119+02
4156	2029175103	Mwanawe	Megan	Sacha	Mary Jackson	2008-08-11	female	Rwandan	\N	Ingabe	EY-Eagle	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.227778+02	2026-07-08 17:25:04.227778+02
4157	2029175102	MAHOROYACU	\N	Isabelle	Mary Jackson	2009-10-05	female	Rwandan	\N	Ingabe	EY-Falcon	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.228434+02	2026-07-08 17:25:04.228434+02
4158	2029175101	keza	Rugamba 	Benitha	Mary Jackson	2009-02-12	female	Rwandan	\N	Ingabe	EY-Eagle	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.229301+02	2026-07-08 17:25:04.229301+02
4159	2029175100	KABARUNGI	\N	Betty	Mary Jackson	2009-02-04	female	Rwandan	\N	Ingabe	EY-Falcon	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.229968+02	2026-07-08 17:25:04.229968+02
4160	2029175099	ISANO 	UWAYEZU	Sabrina	Mary Jackson	2009-07-01	female	Rwandan	\N	Ingabe	EY-Dove	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.230818+02	2026-07-08 17:25:04.230818+02
4161	2029175098	Irakoze 	 sage 	Shekinah	Mary Jackson	2010-05-21	female	Rwandan	\N	Ingabe	EY-Sparrow	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.231535+02	2026-07-08 17:25:04.231535+02
4162	2029175097	IKIREZI	RUDASINGWA	ANAELLA	Mary Jackson	2009-02-03	female	Rwandan	\N	Ingabe	EY-Falcon	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.232041+02	2026-07-08 17:25:04.232041+02
4163	2029175096	IHOGOZA	\N	Ndayisaba	Mary Jackson	2009-09-29	female	Congolaise	\N	Ingabe	EY-Sparrow	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.232525+02	2026-07-08 17:25:04.232525+02
4164	2029175095	GIHOZO	KAMIKAZI	Sabrine	Mary Jackson	2010-09-18	female	Rwandan	\N	Ingabe	EY-Sparrow	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.233099+02	2026-07-08 17:25:04.233099+02
4165	2029175094	agasaro	mupenzi	kethia	Mary Jackson	2009-04-23	female	Rwandan	\N	Ingabe	EY-Dove	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.23382+02	2026-07-08 17:25:04.23382+02
4166	2029175093	Butera	Batete	Lisa	Mary Jackson	2009-09-12	female	Rwandan	\N	Ingabe	EY-Eagle	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.234631+02	2026-07-08 17:25:04.234631+02
4167	2029175092	Benitha	\N	BAZIRA	Mary Jackson	2009-12-03	female	Rwandan	\N	Ingabe	EY-Eagle	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.235353+02	2026-07-08 17:25:04.235353+02
4168	2029175091	Batamuriza	\N	Vanessa	Mary Jackson	2009-12-30	female	Rwandan	\N	Ingabe	EY-Sparrow	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.236126+02	2026-07-08 17:25:04.236126+02
4169	2029175090	Agahozo	Rebe	Maeva	Mary Jackson	2009-06-16	female	Rwandan	\N	Ingabe	EY-Dove	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.23681+02	2026-07-08 17:25:04.23681+02
4170	2029175089	ABATESI	\N	Afisa	Mary Jackson	2009-12-01	female	Rwandan	\N	Ingabe	EY-Falcon	Ntakirutimana Diane	familyMothers@asyv.org	788771148	2026-07-08 17:25:04.238867+02	2026-07-08 17:25:04.238867+02
4171	2029175088	Uwijuru	\N	Bertrand	Andrew Rwigamba	2010-02-11	male	Rwandan	\N	Ingabe	EY-Sparrow	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.239602+02	2026-07-08 17:25:04.239602+02
4172	2029174087	UMUHIRE	\N	Pacifique	Andrew Rwigamba	2008-08-04	male	Rwandan	\N	Ingabe	EY-Sparrow	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.240515+02	2026-07-08 17:25:04.240515+02
4173	2029174084	NSHUTI 	\N	Irene	Andrew Rwigamba	2008-03-22	male	Rwandan	\N	Ingabe	EY-Sparrow	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.241696+02	2026-07-08 17:25:04.241696+02
4174	2029174083	NKURUNZIZA	MUGISHA	Salomon	Andrew Rwigamba	2009-07-14	male	Rwandan	\N	Ingabe	EY-Falcon	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.243249+02	2026-07-08 17:25:04.243249+02
4175	2029174082	NKUNDABAGENZI 	CYUSA	Adolphe	Andrew Rwigamba	2009-09-13	male	Rwandan	\N	Ingabe	EY-Sparrow	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.244118+02	2026-07-08 17:25:04.244118+02
4176	2029174081	Nizeyimana	\N	Celestin	Andrew Rwigamba	2029-02-24	male	Rwandan	\N	Ingabe	EY-Sparrow	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.244585+02	2026-07-08 17:25:04.244585+02
4177	2029174080	NIZEYIMANA	\N	Gilbert	Andrew Rwigamba	2006-08-11	male	Rwandan	\N	Ingabe	EY-Sparrow	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.245014+02	2026-07-08 17:25:04.245014+02
4178	2029174079	ERIC	\N	NIYOMUGISHA	Andrew Rwigamba	2010-02-01	male	Rwandan	\N	Ingabe	EY-Falcon	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.245447+02	2026-07-08 17:25:04.245447+02
4179	2029174078	NIYOMUGENGA	\N	Ernest	Andrew Rwigamba	2008-10-06	male	Rwandan	\N	Ingabe	EY-Sparrow	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.2459+02	2026-07-08 17:25:04.2459+02
4180	2029174077	NGIRIMANA	\N	Jean Paul	Andrew Rwigamba	2009-04-11	male	Rwandan	\N	Ingabe	EY-Sparrow	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.246386+02	2026-07-08 17:25:04.246386+02
4181	2029174076	Nganzo	Niyongabo	Landry	Andrew Rwigamba	2009-02-09	male	Rwandan	\N	Ingabe	EY-Dove	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.246885+02	2026-07-08 17:25:04.246885+02
4182	2029174075	NDIZEYE	\N	Emmanuel	Andrew Rwigamba	2008-10-19	male	Rwandan	\N	Ingabe	EY-Sparrow	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.247408+02	2026-07-08 17:25:04.247408+02
4183	2029174074	Mwiseneza	\N	Faustin	Andrew Rwigamba	2008-10-08	male	Congolaise	\N	Ingabe	EY-Falcon	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.247838+02	2026-07-08 17:25:04.247838+02
4184	2029174073	Munyaneza 	\N	Alexis	Andrew Rwigamba	2007-12-12	male	Rwandan	\N	Ingabe	EY-Falcon	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.248275+02	2026-07-08 17:25:04.248275+02
4185	2029174072	MUCYO	\N	EMMY	Andrew Rwigamba	2008-08-08	male	Rwandan	\N	Ingabe	EY-Falcon	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.248806+02	2026-07-08 17:25:04.248806+02
4186	2029174071	kizima 	shema	yvan	Andrew Rwigamba	2010-01-20	male	Rwandan	\N	Ingabe	EY-Dove	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.249363+02	2026-07-08 17:25:04.249363+02
4187	2029174070	KAMUGISHA	\N	Frank	Andrew Rwigamba	2008-11-26	male	Rwandan	\N	Ingabe	EY-Falcon	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.249817+02	2026-07-08 17:25:04.249817+02
4188	2029174069	ISHIMWE	\N	Christian	Andrew Rwigamba	2008-12-14	male	Rwandan	\N	Ingabe	EY-Sparrow	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.250276+02	2026-07-08 17:25:04.250276+02
4189	2029174068	IRAKOZE	GAKWERERE	Jonathan	Andrew Rwigamba	2009-04-02	male	Rwandan	\N	Ingabe	EY-Eagle	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.250709+02	2026-07-08 17:25:04.250709+02
4190	2029174067	IRADUKUNDA 	DORIAN	Klebert	Andrew Rwigamba	2009-03-16	male	Burundian	\N	Ingabe	EY-Sparrow	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.251151+02	2026-07-08 17:25:04.251151+02
4191	2029174066	Igiraneza	\N	Elissa	Andrew Rwigamba	2009-07-22	male	Rwandan	\N	Ingabe	EY-Falcon	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.252307+02	2026-07-08 17:25:04.252307+02
4192	2029174065	HIRWA	Davy	Criace	Andrew Rwigamba	2010-05-16	male	Rwandan	\N	Ingabe	EY-Dove	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.25271+02	2026-07-08 17:25:04.25271+02
4193	2029173064	UDAHEMUKA	\N	Kelly	Archimedes	2009-11-02	male	Rwandan	\N	Ingabe	EY-Eagle	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.253117+02	2026-07-08 17:25:04.253117+02
4194	2029173063	Shema	\N	Hubert	Andrew Rwigamba	2007-05-06	male	Rwandan	\N	Ingabe	EY-Eagle	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.253595+02	2026-07-08 17:25:04.253595+02
4196	2029173062	SANO	\N	Benjamin	Archimedes	2009-07-22	male	Rwandan	\N	Ingabe	EY-Falcon	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.256263+02	2026-07-08 17:25:04.256263+02
4197	2029173061	SANGANIRO	\N	Dorithe	Archimedes	2008-11-13	male	Rwandan	\N	Ingabe	EY-Falcon	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.268963+02	2026-07-08 17:25:04.268963+02
4198	2029173060	Rutembesa 	Mihigo	Noah	Archimedes	2009-02-26	male	Rwandan	\N	Ingabe	EY-Dove	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.269586+02	2026-07-08 17:25:04.269586+02
4199	2029173059	NTWARI	\N	Gidion	Andrew Rwigamba	2008-09-19	male	Rwandan	\N	Ingabe	EY-Eagle	Mukansanga Margarithe(Devotha)	familyMothers@asyv.org	788822166	2026-07-08 17:25:04.270144+02	2026-07-08 17:25:04.270144+02
4201	2029173058	Nkurunziza	\N	Phocas	Archimedes	2009-05-26	male	Rwandan	\N	Ingabe	EY-Sparrow	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.272106+02	2026-07-08 17:25:04.272106+02
4202	2029173057	Nkurunziza	Ntwari	Chrispin	Archimedes	2009-11-01	male	Rwandan	\N	Ingabe	EY-Dove	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.27558+02	2026-07-08 17:25:04.27558+02
4203	2029173056	NKURUNZIZA 	\N	Danny	Archimedes	2008-08-31	male	Congolaise	\N	Ingabe	EY-Sparrow	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.276773+02	2026-07-08 17:25:04.276773+02
4204	2029173055	NIYONKURU	\N	Musharafu	Archimedes	2009-06-07	male	Rwandan	\N	Ingabe	EY-Dove	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.278223+02	2026-07-08 17:25:04.278223+02
4205	2029173054	Nisingizwe	Rwagasore	Eloi	Archimedes	2010-09-23	male	Rwandan	\N	Ingabe	EY-Falcon	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.279542+02	2026-07-08 17:25:04.279542+02
4206	2029173053	Murenzi	Bahizi	Tonny	Archimedes	2009-10-22	male	Rwandan	\N	Ingabe	EY-Eagle	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.28087+02	2026-07-08 17:25:04.28087+02
4207	2029173052	MURENGEZI	\N	Fidele	Archimedes	2011-03-09	male	Rwandan	\N	Ingabe	EY-Falcon	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.281708+02	2026-07-08 17:25:04.281708+02
4208	2029173051	Munyeshyaka	\N	Emmanuel	Archimedes	2008-09-16	male	Rwandan	\N	Ingabe	EY-Sparrow	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.282226+02	2026-07-08 17:25:04.282226+02
4209	2029173050	MUGISHA 	\N	Tracy	Archimedes	2009-09-17	male	Rwandan	\N	Ingabe	EY-Falcon	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.282833+02	2026-07-08 17:25:04.282833+02
4210	2029173049	Mugisha 	\N	Fred	Archimedes	2011-11-26	male	Other	\N	Ingabe	EY-Falcon	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.283497+02	2026-07-08 17:25:04.283497+02
4211	2029173048	MUGISHA	\N	DIEUVIN	Archimedes	2006-08-19	male	Congolaise	\N	Ingabe	EY-Sparrow	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.284036+02	2026-07-08 17:25:04.284036+02
4212	2029173047	MUGISHA	Chris	Mervin	Archimedes	2009-09-12	male	Rwandan	\N	Ingabe	EY-Dove	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.284511+02	2026-07-08 17:25:04.284511+02
4213	2029173046	JABO	HERITIER	MUTANGANA	Archimedes	2009-02-26	male	Rwandan	\N	Ingabe	EY-Sparrow	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.284997+02	2026-07-08 17:25:04.284997+02
4214	2029173045	IRAMBONA	\N	Fabrice	Archimedes	2008-09-03	male	Rwandan	\N	Ingabe	EY-Eagle	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.286369+02	2026-07-08 17:25:04.286369+02
4215	2029173044	IRAKOZE	\N	Prince	Archimedes	2009-06-21	male	Rwandan	\N	Ingabe	EY-Dove	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.287327+02	2026-07-08 17:25:04.287327+02
4216	2029173043	Hakizimana	Ngabe	Benat	Archimedes	2009-08-17	male	Rwandan	\N	Ingabe	EY-Eagle	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.287813+02	2026-07-08 17:25:04.287813+02
4217	2029173042	Byiringiro	\N	Prince	Archimedes	2009-12-09	male	Rwandan	\N	Ingabe	EY-Falcon	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.288253+02	2026-07-08 17:25:04.288253+02
4218	2029173041	Baraka	Sam	Bonheur	Archimedes	2010-01-07	male	Rwandan	\N	Ingabe	EY-Eagle	Mukansanga Anne Marie	familyMothers@asyv.org	788518322	2026-07-08 17:25:04.288743+02	2026-07-08 17:25:04.288743+02
4219	2029172040	Uwimana	\N	Alice	Rwagasana Michel	2008-12-31	female	Rwandan	\N	Ingabe	EY-Sparrow	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.289235+02	2026-07-08 17:25:04.289235+02
4220	2029172039	Uwase	Keza	Rabia	Rwagasana Michel	2008-09-11	female	Rwandan	\N	Ingabe	EY-Dove	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.289857+02	2026-07-08 17:25:04.289857+02
4221	2029172038	UMWIZA	\N	Deborah	Rwagasana Michel	2009-07-01	female	Rwandan	\N	Ingabe	EY-Eagle	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.290415+02	2026-07-08 17:25:04.290415+02
4222	2029172037	Teta 	\N	Ella	Rwagasana Michel	2009-11-18	female	Rwandan	\N	Ingabe	EY-Sparrow	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.291378+02	2026-07-08 17:25:04.291378+02
4223	2029172036	Rwibutso	Peace	Amata	Rwagasana Michel	2010-04-19	female	Rwandan	\N	Ingabe	EY-Dove	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.292856+02	2026-07-08 17:25:04.292856+02
4224	2029172035	MUTONIWASE	GWIZA	Kessia	Rwagasana Michel	2009-05-12	female	Rwandan	\N	Ingabe	EY-Dove	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.29376+02	2026-07-08 17:25:04.29376+02
4225	2029172034	Walquemanne 	\N	Mireille	Rwagasana Michel	2006-07-07	female	Rwandan	\N	Ingabe	EY-Dove	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.294933+02	2026-07-08 17:25:04.294933+02
4226	2029172033	atete	masengo	nikita	Rwagasana Michel	2009-05-29	female	Rwandan	\N	Ingabe	EY-Sparrow	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.295864+02	2026-07-08 17:25:04.295864+02
4227	2029172032	Keza	Sangwa	Ariella	Rwagasana Michel	2009-10-15	female	Rwandan	\N	Ingabe	EY-Falcon	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.296507+02	2026-07-08 17:25:04.296507+02
4228	2029172031	KEZA	AUDREY	SHELLA	Rwagasana Michel	2009-11-24	female	Rwandan	\N	Ingabe	EY-Dove	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.297031+02	2026-07-08 17:25:04.297031+02
4229	2029172030	Kabatesi	\N	Honnette	Rwagasana Michel	2006-09-04	female	Congolaise	\N	Ingabe	EY-Falcon	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.297707+02	2026-07-08 17:25:04.297707+02
4230	2029172029	Irakoze	Peace	Jessy	Rwagasana Michel	2011-04-11	female	Rwandan	\N	Ingabe	EY-Eagle	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.29832+02	2026-07-08 17:25:04.29832+02
4231	2029172028	Ingabire	Yvette	Chance	Rwagasana Michel	2008-06-05	female	Rwandan	\N	Ingabe	EY-Eagle	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.29887+02	2026-07-08 17:25:04.29887+02
4232	2029172027	Ineza 	Rudi 	Esther	Rwagasana Michel	2009-12-17	female	Rwandan	\N	Ingabe	EY-Eagle	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.29954+02	2026-07-08 17:25:04.29954+02
4233	2029172026	Ineza	Gihozo Mudahizi	Lynn	Rwagasana Michel	2010-08-02	female	Rwandan	\N	Ingabe	EY-Dove	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.300086+02	2026-07-08 17:25:04.300086+02
4234	2029172025	Gaju 	Kirezi	Meora	Rwagasana Michel	2009-12-04	female	Rwandan	\N	Ingabe	EY-Sparrow	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.300865+02	2026-07-08 17:25:04.300865+02
4235	2029172024	Bayingana	Marie	Louange	Rwagasana Michel	2010-02-28	female	Rwandan	\N	Ingabe	EY-Eagle	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.301485+02	2026-07-08 17:25:04.301485+02
4236	2029172023	Liora	\N	Arankunda	Rwagasana Michel	2010-04-16	female	Rwandan	\N	Ingabe	EY-Sparrow	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.302014+02	2026-07-08 17:25:04.302014+02
4237	2029172022	Akeza	\N	Ornella	Rwagasana Michel	2009-12-11	female	Congolaise	\N	Ingabe	EY-Sparrow	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.302543+02	2026-07-08 17:25:04.302543+02
4238	2029172021	Aduhire	Karekezi	Lesly	Rwagasana Michel	2009-12-09	female	Rwandan	\N	Ingabe	EY-Dove	Umutesi Emmerance	familyMothers@asyv.org	788754437	2026-07-08 17:25:04.303012+02	2026-07-08 17:25:04.303012+02
4239	2029171020	Umwiza	Fionah	Queen	Miep Gies	2009-12-10	female	Rwandan	\N	Ingabe	EY-Dove	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.303623+02	2026-07-08 17:25:04.303623+02
4240	2029171019	Nyiranduhura 	\N	Deborah	Miep Gies	2010-12-08	female	Rwandan	\N	Ingabe	EY-Falcon	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.304312+02	2026-07-08 17:25:04.304312+02
4241	2029171018	Ngabirano	Annie	Bernisse	Miep Gies	2010-03-09	female	Burundian	\N	Ingabe	EY-Eagle	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.304922+02	2026-07-08 17:25:04.304922+02
4242	2029171017	NDAYISABA	Peace	Naomie	Miep Gies	2008-04-28	female	Rwandan	\N	Ingabe	EY-Dove	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.305601+02	2026-07-08 17:25:04.305601+02
4243	2029171016	Mutoni	\N	Phionah	Miep Gies	2006-03-08	female	Rwandan	\N	Ingabe	EY-Sparrow	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.306175+02	2026-07-08 17:25:04.306175+02
4244	2029171015	MUGISHA	GASANA	Shekinah	Miep Gies	2009-11-09	female	Rwandan	\N	Ingabe	EY-Eagle	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.30672+02	2026-07-08 17:25:04.30672+02
4245	2029171014	Mirindi	Keza	prinah	Miep Gies	2009-08-20	female	Rwandan	\N	Ingabe	EY-Eagle	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.307365+02	2026-07-08 17:25:04.307365+02
4246	2029171013	Kirabo	Teta	Divine	Miep Gies	2009-05-31	female	Rwandan	\N	Ingabe	EY-Dove	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.308397+02	2026-07-08 17:25:04.308397+02
4247	2029171012	Kamanda	Isheja	Belinda	Miep Gies	2010-06-02	female	Rwandan	\N	Ingabe	EY-Dove	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.309453+02	2026-07-08 17:25:04.309453+02
4248	2029171011	Iradukunda	\N	Blandine	Miep Gies	2008-02-05	female	Rwandan	\N	Ingabe	EY-Falcon	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.311241+02	2026-07-08 17:25:04.311241+02
4249	2029171010	INGABIRE	\N	Uwamahoro	Miep Gies	2008-12-31	female	Congolaise	\N	Ingabe	EY-Sparrow	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.312279+02	2026-07-08 17:25:04.312279+02
4250	2029171009	Gemima	\N	Ineza	Miep Gies	2010-01-29	female	Rwandan	\N	Ingabe	EY-Eagle	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.313414+02	2026-07-08 17:25:04.313414+02
4251	2029171008	IHIMBAZWE	\N	Aimee	Miep Gies	2008-06-24	female	Rwandan	\N	Ingabe	EY-Falcon	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.314642+02	2026-07-08 17:25:04.314642+02
4252	2029171007	BEZA	SANGWA	ORNELLA	Miep Gies	2009-10-15	female	Rwandan	\N	Ingabe	EY-Falcon	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.315507+02	2026-07-08 17:25:04.315507+02
4253	2029171006	BERWA	\N	Vanina	Miep Gies	2010-04-03	female	Rwandan	\N	Ingabe	EY-Eagle	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.316259+02	2026-07-08 17:25:04.316259+02
4254	2029171005	Akaliza 	\N	Tasha	Miep Gies	2009-09-29	female	Rwandan	\N	Ingabe	EY-Dove	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.316897+02	2026-07-08 17:25:04.316897+02
4255	2029171004	AGATESI	\N	Angel	Miep Gies	2009-01-02	female	Rwandan	\N	Ingabe	EY-Eagle	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.317794+02	2026-07-08 17:25:04.317794+02
4256	2029171003	Agasaro 	Uwase	sharon	Miep Gies	2009-10-05	female	Rwandan	\N	Ingabe	EY-Falcon	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.318495+02	2026-07-08 17:25:04.318495+02
4257	2029171002	AGASARO	\N	Hope	Miep Gies	2009-09-29	female	Rwandan	\N	Ingabe	EY-Sparrow	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.3193+02	2026-07-08 17:25:04.3193+02
4258	2029171001	Agasaro 	\N	Danica	Miep Gies	2009-01-01	female	Rwandan	\N	Ingabe	EY-Dove	Mukarwema Agness	familyMothers@asyv.org	788783094	2026-07-08 17:25:04.320007+02	2026-07-08 17:25:04.320007+02
4259	2028166128	SIMBI NZIZA	\N	Prince	Thomas Edison	2008-12-10	male	Rwandan	\N	Ingabo	S4_MPEG_A	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.320658+02	2026-07-08 17:25:04.320658+02
4260	2028166127	SIBOMANA	\N	Pacifique	Thomas Edison	2008-08-26	male	Rwandan	\N	Ingabo	S4_MPCB	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.321241+02	2026-07-08 17:25:04.321241+02
4261	2028166126	Shema 	\N	Chrispin	Thomas Edison	2008-09-03	male	Rwandan	\N	Ingabo	S4_HGLPsy_B	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.322134+02	2026-07-08 17:25:04.322134+02
4262	2028166125	Ntwari	\N	Kevin	Thomas Edison	2004-06-05	male	Rwandan	\N	Ingabo	S4_MPEG_B	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.322721+02	2026-07-08 17:25:04.322721+02
4263	2028166124	NKURUNZIZA 	\N	Prince	Thomas Edison	2005-07-24	male	Rwandan	\N	Ingabo	S4_MPEG_A	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.323301+02	2026-07-08 17:25:04.323301+02
4264	2028166123	Ngaboyisonga	\N	Bertin	Thomas Edison	2005-04-27	male	Rwandan	\N	Ingabo	S4_HGLPsy_A	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.323886+02	2026-07-08 17:25:04.323886+02
4265	2028166122	Mushimire 	\N	Fulgence	Thomas Edison	2005-12-31	male	Rwandan	\N	Ingabo	S4_HGLPsy_B	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.32484+02	2026-07-08 17:25:04.32484+02
4266	2028166121	Murangira	\N	Kalleb	Thomas Edison	2008-02-21	male	Rwandan	\N	Ingabo	S4_MPEG_A	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.326071+02	2026-07-08 17:25:04.326071+02
4267	2028166120	Mugisha	\N	Djibril	Thomas Edison	2008-05-25	male	Rwandan	\N	Ingabo	S4_MPCB	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.327066+02	2026-07-08 17:25:04.327066+02
4268	2028166118	King 	Innocent	Mihigo	Thomas Edison	2008-05-02	male	Rwandan	\N	Ingabo	S4_MPEG_A	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.329324+02	2026-07-08 17:25:04.329324+02
4269	2028166117	Manzi	\N	Christian	Thomas Edison	2009-04-08	male	Rwandan	\N	Ingabo	S4_MPEG_A	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.330057+02	2026-07-08 17:25:04.330057+02
4270	2028166116	Ishimwe	\N	Yvan	Thomas Edison	2006-10-10	male	Burundian	\N	Ingabo	S4_HGLPsy_A	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.330755+02	2026-07-08 17:25:04.330755+02
4271	2028166115	MWENEDATA	Ishimwe	Alain	Thomas Edison	2006-02-28	male	Rwandan	\N	Ingabo	S4_HGLPsy_A	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.331318+02	2026-07-08 17:25:04.331318+02
4272	2028166114	Ishimwe 	\N	Fabrice	Thomas Edison	2006-11-23	male	Rwandan	\N	Ingabo	S4_MPCB	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.331799+02	2026-07-08 17:25:04.331799+02
4273	2028166113	Ishimwe	\N	Beckham 	Thomas Edison	2008-06-09	male	Rwandan	\N	Ingabo	S4_HGLPsy_B	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.332448+02	2026-07-08 17:25:04.332448+02
4274	2028166112	Indamutsa	Gahigana	Lewis	Thomas Edison	2009-11-23	male	Rwandan	\N	Ingabo	S4_MPEG_B	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.333108+02	2026-07-08 17:25:04.333108+02
4275	2028166111	HAGENIMANA 	\N	DANNY	Thomas Edison	2008-02-25	male	Rwandan	\N	Ingabo	S4_HGLPsy_A	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.333622+02	2026-07-08 17:25:04.333622+02
4276	2028166110	Gitego	\N	Prince	Thomas Edison	2009-08-20	male	Rwandan	\N	Ingabo	S4_HGLPsy_B	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.334124+02	2026-07-08 17:25:04.334124+02
4277	2028166109	Frank	\N	Gentil	Thomas Edison	2006-09-30	male	Congolaise	\N	Ingabo	S4_MPCB	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.334587+02	2026-07-08 17:25:04.334587+02
4278	2028166108	Cyusa	Blessing	Elton	Thomas Edison	2009-01-24	male	Rwandan	\N	Ingabo	S4_HGLPsy_B	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.335091+02	2026-07-08 17:25:04.335091+02
4279	2028166107	cyubahiro 	   	chance	Thomas Edison	2007-05-18	male	Rwandan	\N	Ingabo	S4_HGLPsy_A	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.335539+02	2026-07-08 17:25:04.335539+02
4280	2028166106	BUTOTO.	RUVUBIKA.	FIDELE.	Thomas Edison	2005-12-05	male	Rwandan	\N	Ingabo	S4_MPCB	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.336122+02	2026-07-08 17:25:04.336122+02
4281	2028166105	BIZUMUREMYI 	\N	Augustin	Thomas Edison	2007-05-24	male	Rwandan	\N	Ingabo	S4_HGLPsy_A	Nyinawumuntu Emmilienne	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.336817+02	2026-07-08 17:25:04.336817+02
4282	2028165104	Yezakuzwe  	Marie	Odda	Irena Sendler	2008-03-15	female	Rwandan	\N	Ingabo	S4_MPCB	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.337334+02	2026-07-08 17:25:04.337334+02
4283	2028165103	Uwase	\N	Alice	Irena Sendler	2010-03-01	female	Rwandan	\N	Ingabo	S4_MPCB	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.337818+02	2026-07-08 17:25:04.337818+02
4284	2028165102	UTETIWABO	\N	Prayer	Irena Sendler	2009-08-07	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.338226+02	2026-07-08 17:25:04.338226+02
4285	2028165101	Umutoniwase	\N	Kevine	Irena Sendler	2008-11-07	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.338997+02	2026-07-08 17:25:04.338997+02
4286	2028165100	UMURERWA	Gakuba	Gaella	Irena Sendler	2008-09-03	female	Rwandan	\N	Ingabo	S4_MPEG_A	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.339586+02	2026-07-08 17:25:04.339586+02
4287	2028165099	Mirembe	\N	Peace	Irena Sendler	2008-04-03	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.340547+02	2026-07-08 17:25:04.340547+02
4288	2028165098	Nyiramana 	\N	Aline	Irena Sendler	2008-05-07	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.342329+02	2026-07-08 17:25:04.342329+02
4289	2028165097	NIYONSENGA	\N	Carine	Irena Sendler	2007-06-30	female	Rwandan	\N	Ingabo	S4_MPCB	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.343688+02	2026-07-08 17:25:04.343688+02
4290	2028165096	NISHIMWE	\N	DORINE	Niyitegeka Felestin	2007-12-31	female	Burundian	\N	Ingabo	S4_HGLPsy_B	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.34503+02	2026-07-08 17:25:04.34503+02
4291	2028165095	Mwitisaro	\N	Guelda	Irena Sendler	2009-08-06	female	Rwandan	\N	Ingabo	S4_MPEG_B	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.346045+02	2026-07-08 17:25:04.346045+02
4292	2028165094	Mulisa	\N	Gentille	Irena Sendler	2008-12-07	female	Congolaise	\N	Ingabo	S4_HGLPsy_B	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.346846+02	2026-07-08 17:25:04.346846+02
4293	2028165093	MBABAZI	\N	ESTHER	Irena Sendler	2007-08-07	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.347748+02	2026-07-08 17:25:04.347748+02
4294	2028165092	KEZA	\N	Nadia	Irena Sendler	2009-03-08	female	Rwandan	\N	Ingabo	S4_MPEG_A	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.348522+02	2026-07-08 17:25:04.348522+02
4295	2028165091	Iyiziremubeza	\N	Isabelle	Irena Sendler	2007-05-03	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.349417+02	2026-07-08 17:25:04.349417+02
4296	2028165090	IRAFASHA	\N	ZAINA	Irena Sendler	2007-08-31	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.350452+02	2026-07-08 17:25:04.350452+02
4297	2028165089	IRADUKUNDA 	\N	Quessia	Irena Sendler	2009-03-12	female	Rwandan	\N	Ingabo	S4_MPEG_A	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.3515+02	2026-07-08 17:25:04.3515+02
4298	2028165088	Imanirumva 	Josepha	Brunella	Irena Sendler	2008-12-02	female	Burundian	\N	Ingabo	S4_HGLPsy_A	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.352426+02	2026-07-08 17:25:04.352426+02
4299	2028165087	Igihozo	Umurerwa 	Aline	Irena Sendler	2009-07-03	female	Rwandan	\N	Ingabo	S4_MPEG_A	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.353098+02	2026-07-08 17:25:04.353098+02
4300	2028165086	DUSHIMIMANA	\N	Aimeline	Irena Sendler	2008-04-22	female	Rwandan	\N	Ingabo	S4_MPEG_B	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.35409+02	2026-07-08 17:25:04.35409+02
4301	2028165085	DUSHIME  	Teta	Ella	Irena Sendler	2010-05-26	female	Rwandan	\N	Ingabo	S4_MPEG_A	Uwangege Lea	familyMothers@asyv.org	785344668	2026-07-08 17:25:04.354668+02	2026-07-08 17:25:04.354668+02
4302	2028164084	UWASE 	\N	PEACE	Rosalie Gicanda	2009-03-19	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.355473+02	2026-07-08 17:25:04.355473+02
4303	2028164083	UWASE	\N	KELLIA	Rosalie Gicanda	2008-01-06	female	Rwandan	\N	Ingabo	S4_MPEG_B	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.356291+02	2026-07-08 17:25:04.356291+02
4304	2028164082	Umuhoza 	\N	Belyse	Rosalie Gicanda	2007-06-01	female	Rwandan	\N	Ingabo	S4_MPEG_B	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.356931+02	2026-07-08 17:25:04.356931+02
4305	2028164081	UMUGIRANEZA	IYIZIRE	GENEREUSE	Rosalie Gicanda	2006-12-31	female	Rwandan	\N	Ingabo	S4_MPCB	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.357913+02	2026-07-08 17:25:04.357913+02
4306	2028164080	Tuyishime 	-	Esther	Rosalie Gicanda	2008-04-03	female	Rwandan	\N	Ingabo	S4_MPEG_B	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.359291+02	2026-07-08 17:25:04.359291+02
4307	2028164079	Nzamukosha	\N	Batamuriza	Rosalie Gicanda	2006-12-31	female	Congolaise	\N	Ingabo	S4_MPCB	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.360404+02	2026-07-08 17:25:04.360404+02
4308	2028164078	NIYIGENA 	Carine	Joyeuse	Rosalie Gicanda	2008-04-26	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.36177+02	2026-07-08 17:25:04.36177+02
4309	2028164077	NISHIMWE	\N	AMINA	Rosalie Gicanda	2007-08-19	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.36248+02	2026-07-08 17:25:04.36248+02
4310	2028164076	NDAYISHIMIYE	UWERA TETA	KEILLA	Rosalie Gicanda	2008-05-08	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.363114+02	2026-07-08 17:25:04.363114+02
4311	2028164075	MUTABAZI	Queen 	Peace	Rosalie Gicanda	2008-06-29	female	Rwandan	\N	Ingabo	S4_MPEG_A	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.363716+02	2026-07-08 17:25:04.363716+02
4312	2028164074	Muhawenayo	\N	Divine	Rosalie Gicanda	2007-06-05	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.364262+02	2026-07-08 17:25:04.364262+02
4313	2028164073	Ishoborabyose	Marie 	Aimee	Rosalie Gicanda	2006-10-06	female	Rwandan	\N	Ingabo	S4_MPCB	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.3648+02	2026-07-08 17:25:04.3648+02
4314	2028164072	Iriza	\N	Owen	Rosalie Gicanda	2009-02-23	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.365472+02	2026-07-08 17:25:04.365472+02
4315	2028164071	IKIREZI 	\N	Laissa	Rosalie Gicanda	2007-03-27	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.366137+02	2026-07-08 17:25:04.366137+02
4316	2028164070	HAKIZIMANA 	\N	Marquise	Rosalie Gicanda	2008-04-10	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.366903+02	2026-07-08 17:25:04.366903+02
4317	2028164069	GISUBIZO 	Anitha	Anitha	Rosalie Gicanda	2008-05-28	female	Rwandan	\N	Ingabo	S4_MPCB	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.367828+02	2026-07-08 17:25:04.367828+02
4318	2028164068	GAHOZO	\N	Blanche	Rosalie Gicanda	2008-01-20	female	Rwandan	\N	Ingabo	S4_MPCB	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.368632+02	2026-07-08 17:25:04.368632+02
4319	2028164067	Cyuzuzo 	Mary 	Jesca	Rosalie Gicanda	2009-02-24	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.369344+02	2026-07-08 17:25:04.369344+02
4320	2028164066	AKIMANA	\N	Fabiola	Rosalie Gicanda	2007-08-06	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.370099+02	2026-07-08 17:25:04.370099+02
4321	2028163065	Uwase	\N	Dinah	ADA loveloce	2009-02-16	female	Rwandan	\N	Ingabo	S4_MPEG_B	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.370829+02	2026-07-08 17:25:04.370829+02
4322	2028163064	UMURUNGI 	\N	Delice	ADA loveloce	2008-02-06	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.371358+02	2026-07-08 17:25:04.371358+02
4323	2028163063	SHIMWAWARAKOZE	\N	Julie 	ADA loveloce	2008-10-24	female	Rwandan	\N	Ingabo	S4_MPCB	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.371844+02	2026-07-08 17:25:04.371844+02
4324	2028163062	NYIRAMUGISHA	\N	Esperence	ADA loveloce	2009-05-12	female	Congolaise	\N	Ingabo	S4_MPCB	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.372398+02	2026-07-08 17:25:04.372398+02
4325	2028163061	NIYIREBA	INGENZI	Hyguette	ADA loveloce	2008-04-10	female	Rwandan	\N	Ingabo	S4_MPCB	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.372947+02	2026-07-08 17:25:04.372947+02
4326	2028163060	NISHIMWE	\N	Regine	ADA loveloce	2008-06-27	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.373379+02	2026-07-08 17:25:04.373379+02
4327	2028163059	NIRAGIRE	\N	Anisia	ADA loveloce	2009-10-11	female	Rwandan	\N	Ingabo	S4_MPCB	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.37397+02	2026-07-08 17:25:04.37397+02
4328	2028163058	TUYISHIMIRE 	\N	Stephanie	ADA loveloce	2008-12-31	female	Rwandan	\N	Ingabo	S4_MPEG_B	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.375204+02	2026-07-08 17:25:04.375204+02
4329	2028163057	IMPANO	Nancy	Brunella	ADA loveloce	2008-09-09	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.376393+02	2026-07-08 17:25:04.376393+02
4330	2028163056	MWAMIKAZI 	\N	Deborah	ADA loveloce	2009-01-09	female	Rwandan	\N	Ingabo	S4_MPEG_A	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.37764+02	2026-07-08 17:25:04.37764+02
4331	2028163055	MUNINI	\N	Alice	Rosalie Gicanda	2009-02-05	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Nyirarutaza Jeannette	familyMothers@asyv.org	788476109	2026-07-08 17:25:04.378582+02	2026-07-08 17:25:04.378582+02
4332	2028163054	Mukamisha	\N	Agnes	ADA loveloce	2008-05-04	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.379187+02	2026-07-08 17:25:04.379187+02
4333	2028163053	MUHAWENIMANA	\N	Nadia	ADA loveloce	2008-09-21	female	Rwandan	\N	Ingabo	S4_MPEG_B	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.380924+02	2026-07-08 17:25:04.380924+02
4334	2028163052	Mugwaneza 	\N	Claudine	ADA loveloce	2009-03-13	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.381472+02	2026-07-08 17:25:04.381472+02
4335	2028163051	MUGABEKAZI 	\N	Ritha	ADA loveloce	2008-06-06	female	Rwandan	\N	Ingabo	S4_MPEG_B	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.382048+02	2026-07-08 17:25:04.382048+02
4336	2028163050	Kamugisha	Keza	Irine	ADA loveloce	2008-04-21	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.382612+02	2026-07-08 17:25:04.382612+02
4337	2028163049	Irakoze	Sarah	Divine	ADA loveloce	2010-02-07	female	Rwandan	\N	Ingabo	S4_MPCB	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.383018+02	2026-07-08 17:25:04.383018+02
4338	2028163048	Dushimeyesu	\N	Bow	ADA loveloce	2007-06-22	female	Burundian	\N	Ingabo	S4_MPEG_B	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.3834+02	2026-07-08 17:25:04.3834+02
4339	2028163047	Ingabire 	Teta	Charite	ADA loveloce	2008-12-03	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.384044+02	2026-07-08 17:25:04.384044+02
4340	2028163046	Batamuriza	\N	Anick	ADA loveloce	2008-12-11	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.384766+02	2026-07-08 17:25:04.384766+02
4341	2028163045	Akaliza	\N	Anissa	ADA loveloce	2008-05-25	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Bazazana Goreth	familyMothers@asyv.org	788287293	2026-07-08 17:25:04.385546+02	2026-07-08 17:25:04.385546+02
4342	2028162044	Shyaka	\N	Jules	Lance Solomon Reddick	2009-06-30	male	Rwandan	\N	Ingabo	S4_MPCB	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.386093+02	2026-07-08 17:25:04.386093+02
4343	2028162043	RUTAGARAMA	\N	Patience	Lance Solomon Reddick	2008-04-21	male	Rwandan	\N	Ingabo	S4_HGLPsy_A	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.386602+02	2026-07-08 17:25:04.386602+02
4344	2028162042	Rusanganwa 	Asante	Lucky	Lance Solomon Reddick	2008-03-04	male	Rwandan	\N	Ingabo	S4_HGLPsy_B	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.387047+02	2026-07-08 17:25:04.387047+02
4345	2028162041	RUKUNDO 	\N	PROMESSE	Lance Solomon Reddick	2008-03-18	male	Rwandan	\N	Ingabo	S4_HGLPsy_A	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.387697+02	2026-07-08 17:25:04.387697+02
4346	2028162040	NTWARI	\N	Josue'	Lance Solomon Reddick	2010-01-31	male	Rwandan	\N	Ingabo	S4_MPCB	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.388237+02	2026-07-08 17:25:04.388237+02
4347	2028162039	NTWALI	\N	Kevin	Lance Solomon Reddick	2008-01-06	male	Rwandan	\N	Ingabo	S4_HGLPsy_A	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.388685+02	2026-07-08 17:25:04.388685+02
4348	2028162038	Niyibizi	Louis 	Maxime	Lance Solomon Reddick	2008-12-10	male	Rwandan	\N	Ingabo	S4_MPCB	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.389137+02	2026-07-08 17:25:04.389137+02
4349	2028162037	NDUWAYEZU	\N	Bonaventure	Lance Solomon Reddick	2006-01-10	male	Rwandan	\N	Ingabo	S4_HGLPsy_B	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.389547+02	2026-07-08 17:25:04.389547+02
4350	2028162036	MUTABAZI	\N	Reponse	Lance Solomon Reddick	2004-03-10	male	Congolaise	\N	Ingabo	S4_MPEG_B	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.389967+02	2026-07-08 17:25:04.389967+02
4351	2028162035	Musabyimana 	\N	Didas	Lance Solomon Reddick	2008-10-01	male	Rwandan	\N	Ingabo	S4_HGLPsy_A	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.390444+02	2026-07-08 17:25:04.390444+02
4352	2028162034	Mukunzi 	\N	Joseph	Lance Solomon Reddick	2008-07-19	male	Rwandan	\N	Ingabo	S4_MPCB	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.390963+02	2026-07-08 17:25:04.390963+02
4353	2028162033	MUHIZI	\N	Herve	Lance Solomon Reddick	2008-02-02	male	Burundian	\N	Ingabo	S4_MPCB	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.391737+02	2026-07-08 17:25:04.391737+02
4354	2028162032	MUHIRWA 	\N	Germain	Lance Solomon Reddick	2007-08-18	male	Rwandan	\N	Ingabo	S4_MPCB	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.39273+02	2026-07-08 17:25:04.39273+02
4355	2028162031	Mugisha 	\N	Aime	Lance Solomon Reddick	2007-12-06	male	Rwandan	\N	Ingabo	S4_HGLPsy_B	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.393606+02	2026-07-08 17:25:04.393606+02
4357	2028162030	MUGABE	\N	BLAISE	Lance Solomon Reddick	2008-08-25	male	Rwandan	\N	Ingabo	S4_MPCB	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.396028+02	2026-07-08 17:25:04.396028+02
4358	2028162029	Mpano	Gashumba	Satisfait	Lance Solomon Reddick	2008-09-29	male	Rwandan	\N	Ingabo	S4_HGLPsy_B	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.397967+02	2026-07-08 17:25:04.397967+02
4359	2028162028	KAGAME	Alex	Kevin	Lance Solomon Reddick	2006-06-12	male	Rwandan	\N	Ingabo	S4_HGLPsy_B	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.398821+02	2026-07-08 17:25:04.398821+02
4360	2028162027	Itangishaka 	\N	Erneste	Lance Solomon Reddick	2007-09-23	male	Rwandan	\N	Ingabo	S4_MPEG_A	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.399859+02	2026-07-08 17:25:04.399859+02
4361	2028162026	IGIRANEZA 	\N	Valens	Lance Solomon Reddick	2007-12-31	male	Rwandan	\N	Ingabo	S4_HGLPsy_A	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.400802+02	2026-07-08 17:25:04.400802+02
4362	2028162025	Gasana	\N	Steven	Lance Solomon Reddick	2007-10-26	male	Rwandan	\N	Ingabo	S4_HGLPsy_A	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.40145+02	2026-07-08 17:25:04.40145+02
4363	2028162024	BUKURU	\N	ESPOIR	Lance Solomon Reddick	2005-12-04	male	Rwandan	\N	Ingabo	S4_HGLPsy_A	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.402174+02	2026-07-08 17:25:04.402174+02
4364	2028162023	Dushime	\N	Benjamin	Lance Solomon Reddick	2006-10-27	male	Rwandan	\N	Ingabo	S4_MPEG_A	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.402845+02	2026-07-08 17:25:04.402845+02
4365	2028162022	SHYAKA 	\N	Adore	Lance Solomon Reddick	2008-03-08	male	Rwandan	\N	Ingabo	S4_HGLPsy_B	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.40339+02	2026-07-08 17:25:04.40339+02
4366	2028162021	Abarezi 	\N	Cedrick	Lance Solomon Reddick	2006-12-31	male	Rwandan	\N	Ingabo	S4_HGLPsy_A	Ruzibiza Emmaculee	familyMothers@asyv.org	788674758	2026-07-08 17:25:04.403988+02	2026-07-08 17:25:04.403988+02
4367	2028161020	UWIHIRWE  	\N	Philomene	Niyitegeka Felestin	2008-09-02	female	Rwandan	\N	Ingabo	S4_MPEG_B	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.40443+02	2026-07-08 17:25:04.40443+02
4368	2028161019	Uwamahoro	\N	Gloria	Niyitegeka Felestin	2007-12-09	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.404875+02	2026-07-08 17:25:04.404875+02
4369	2028161018	Uwamahoro	\N	Ange	Niyitegeka Felestin	2009-04-06	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.40535+02	2026-07-08 17:25:04.40535+02
4370	2028161017	Umumararungu	Sandrine	Joana	Niyitegeka Felestin	2010-10-04	female	Rwandan	\N	Ingabo	S4_MPEG_B	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.405779+02	2026-07-08 17:25:04.405779+02
4371	2028161016	Umuhoza	Therese	De jesus	Niyitegeka Felestin	2007-10-09	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.406327+02	2026-07-08 17:25:04.406327+02
4372	2028161015	UMUHIRE	\N	Sandra	Niyitegeka Felestin	2008-12-31	female	Rwandan	\N	Ingabo	S4_MPEG_A	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.406787+02	2026-07-08 17:25:04.406787+02
4373	2028161014	Syombua	\N	Josephine	Niyitegeka Felestin	2007-08-17	female	Rwandan	\N	Ingabo	S4_MPCB	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.407362+02	2026-07-08 17:25:04.407362+02
4374	2028161013	Nankunda 	\N	Jenipher	Niyitegeka Felestin	2009-08-01	female	Rwandan	\N	Ingabo	S4_MPCB	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.408424+02	2026-07-08 17:25:04.408424+02
4375	2028161012	MUTONI	\N	Gloria	Niyitegeka Felestin	2008-08-07	female	Rwandan	\N	Ingabo	S4_MPEG_B	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.409403+02	2026-07-08 17:25:04.409403+02
4376	2028161011	Mutesi	\N	Sarah	Thomas Edison	2007-12-23	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Uwiringiyimana Betty	familyMothers@asyv.org	788876148	2026-07-08 17:25:04.410796+02	2026-07-08 17:25:04.410796+02
4377	2028161010	Muhongerwa	\N	Evodia 	Niyitegeka Felestin	2007-07-12	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.411713+02	2026-07-08 17:25:04.411713+02
4378	2028161009	Kanywabahizi	Faida 	Elizabeth	Niyitegeka Felestin	2005-04-03	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.412293+02	2026-07-08 17:25:04.412293+02
4379	2028161008	Hogoza	\N	Jesca	Niyitegeka Felestin	2006-12-31	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.412821+02	2026-07-08 17:25:04.412821+02
4380	2028161007	ISHIMWE 	\N	Gyslaine	Niyitegeka Felestin	2007-10-09	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.413268+02	2026-07-08 17:25:04.413268+02
4381	2028161006	GATAKO	UMUHOZA	Giselle	Niyitegeka Felestin	2008-12-09	female	Rwandan	\N	Ingabo	S4_HGLPsy_A	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.413894+02	2026-07-08 17:25:04.413894+02
4382	2028161005	GASARO 	\N	Milker 	Niyitegeka Felestin	2007-02-13	female	Rwandan	\N	Ingabo	S4_HGLPsy_B	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.41431+02	2026-07-08 17:25:04.41431+02
4383	2028161004	Uwase 	\N	Emelyne	Niyitegeka Felestin	2009-07-13	female	Congolaise	\N	Ingabo	S4_HGLPsy_B	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.41487+02	2026-07-08 17:25:04.41487+02
4384	2028161003	NIYONAGIRA 	\N	Delphine	Niyitegeka Felestin	2008-04-09	female	Rwandan	\N	Ingabo	S4_MPEG_A	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.415289+02	2026-07-08 17:25:04.415289+02
4385	2028161002	Niringiyimana	\N	Clemence	Niyitegeka Felestin	2008-02-06	female	Rwandan	\N	Ingabo	S4_MPCB	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.415656+02	2026-07-08 17:25:04.415656+02
4386	2028161001	AGASARO 	KEZA	Divine	Niyitegeka Felestin	2009-03-24	female	Rwandan	\N	Ingabo	S4_MPEG_A	Uwiringiyimana Betty	familyMothers@asyv.org	788287442	2026-07-08 17:25:04.416309+02	2026-07-08 17:25:04.416309+02
4387	2027156117	ISEZERANO 	\N	Esther	Ruth Bader Ginsberg	2006-09-09	female	Rwandan	\N	Ijabo	S5_MEG	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.416774+02	2026-07-08 17:25:04.416774+02
4388	2027155088	Shingiro 	\N	Gad	Alfred Nobel	2006-04-24	male	Rwandan	\N	Ijabo	S5_MCE	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.41721+02	2026-07-08 17:25:04.41721+02
4389	2027155087	BYIRINGIRO	\N	Frank	Alfred Nobel	2007-07-17	male	Rwandan	\N	Ijabo	S5_MPC	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.41791+02	2026-07-08 17:25:04.41791+02
4390	2027154077	UMUTONIWASE Yvette	\N	Yvette	Ubald Rugirangoga	2006-06-06	female	Rwandan	\N	Ijabo	S5_MEG	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.418367+02	2026-07-08 17:25:04.418367+02
4391	2027154072	IRADUKUNDA	MAHORO	Sandra 	Ubald Rugirangoga	2006-01-14	female	Rwandan	\N	Ijabo	S5_MCE	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.418814+02	2026-07-08 17:25:04.418814+02
4392	2027154069	Ingabire	\N	Divine	Toni Morrison	2005-03-04	female	Rwandan	\N	Ijabo	S5_MEG	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.419263+02	2026-07-08 17:25:04.419263+02
4393	2027153062	NIKUZE	\N	Clarisse	Charles Babbage	2006-09-30	female	Rwandan	\N	Ijabo	S5_MPC	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.419727+02	2026-07-08 17:25:04.419727+02
4394	2027153047	Uwase	\N	Alice	Charles Babbage	2006-04-13	female	Rwandan	\N	Ijabo	S5_PCB	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.420188+02	2026-07-08 17:25:04.420188+02
4395	2026146127	MUTUYIMANA 	\N	Alice	KATHERINE JOHNSON	2007-02-11	female	Rwandan	\N	Ishami	S6_PCB	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.420577+02	2026-07-08 17:25:04.420577+02
4396	2026146125	KUBWIMANA	\N	Josiane	KATHERINE JOHNSON	2005-08-29	female	Rwandan	\N	Ishami	S6_PCB	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.421035+02	2026-07-08 17:25:04.421035+02
4397	2026146123	Pili 	Djasmine	MUKARWEGO	KATHERINE JOHNSON	2006-10-29	female	Rwandan	\N	Ishami	S6_MCE	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.421453+02	2026-07-08 17:25:04.421453+02
4398	2026146119	Claudine	\N	ITERITEKA 	KATHERINE JOHNSON	2005-02-26	female	Burundian	\N	Ishami	S6_PCB	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.42311+02	2026-07-08 17:25:04.42311+02
4399	2026146117	Tumusime 	 Aniella	 Vanessa	KATHERINE JOHNSON	2006-06-04	female	Rwandan	\N	Ishami	S6_HGL	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.423487+02	2026-07-08 17:25:04.423487+02
4400	2026146114	MURERWA 	\N	BLESSED	KATHERINE JOHNSON	2006-09-20	female	Rwandan	\N	Ishami	S6_MCE	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.423961+02	2026-07-08 17:25:04.423961+02
4401	2026146113	UWIMANA	\N	Alexie	KATHERINE JOHNSON	2006-03-27	female	Rwandan	\N	Ishami	S6_PCB	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.424549+02	2026-07-08 17:25:04.424549+02
4402	2026146108	Valentine	\N	MUKASHYAKA	KATHERINE JOHNSON	2005-12-01	female	Rwandan	\N	Ishami	S6_HGL	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.42542+02	2026-07-08 17:25:04.42542+02
4403	2026145128	Olive	\N	Muteteri	YVAN BURAVAN	2006-10-31	female	Rwandan	\N	Ishami	S6_MPC	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.426003+02	2026-07-08 17:25:04.426003+02
4404	2026145107	Bienveillance	\N	Mutoniwase	YVAN BURAVAN	2007-03-26	female	Rwandan	\N	Ishami	S6_HGL	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.427131+02	2026-07-08 17:25:04.427131+02
4405	2026145105	ISHIMWE	\N	Lysette	YVAN BURAVAN	2005-10-22	female	Rwandan	\N	Ishami	S6_HGL	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.427953+02	2026-07-08 17:25:04.427953+02
4406	2026145101	IRERE	Queenter	Benthy	YVAN BURAVAN	2007-09-12	female	Rwandan	\N	Ishami	S6_HGL	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.428607+02	2026-07-08 17:25:04.428607+02
4407	2026145097	Nikita	\N	Kamikazi	YVAN BURAVAN	2005-12-07	female	Rwandan	\N	Ishami	S6_MEG	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.429328+02	2026-07-08 17:25:04.429328+02
4408	2026145095	Nadia	\N	Muhongerwa	YVAN BURAVAN	2006-11-04	female	Rwandan	\N	Ishami	S6_HGL	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.429947+02	2026-07-08 17:25:04.429947+02
4409	2026145093	UWIDUHAYE	Marie	Magnifique	YVAN BURAVAN	2007-08-03	female	Rwandan	\N	Ishami	S6_MEG	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.4308+02	2026-07-08 17:25:04.4308+02
4410	2026145091	Adeline 	\N	Ishimwe	YVAN BURAVAN	2006-06-25	female	Rwandan	\N	Ishami	S6_MCE	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.431318+02	2026-07-08 17:25:04.431318+02
4411	2026145089	Christella	\N	Umutoni	YVAN BURAVAN	2006-08-27	female	Rwandan	\N	Ishami	S6_MPC	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.431797+02	2026-07-08 17:25:04.431797+02
4412	2026144088	Brunella	AKE	UMUGISHA	Fannie Lou Hamer	2007-05-29	female	Rwandan	\N	Ishami	S6_MCE	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.432223+02	2026-07-08 17:25:04.432223+02
4413	2026144086	MUZIRANENGE 	\N	Josephine	Fannie Lou Hamer	2006-09-11	female	Rwandan	\N	Ishami	S6_PCB	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.433099+02	2026-07-08 17:25:04.433099+02
4414	2026144085	MUKESHIMANA	\N	Diane	Fannie Lou Hamer	2005-10-19	female	Rwandan	\N	Ishami	S6_MEG	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.43361+02	2026-07-08 17:25:04.43361+02
4415	2026144084	AKALIZA 	NIYONGABO	FIDELA	Fannie Lou Hamer	2006-03-22	female	Rwandan	\N	Ishami	S6_HGL	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.434281+02	2026-07-08 17:25:04.434281+02
4416	2026144082	Joselyne	\N	HATANGIMANA	Fannie Lou Hamer	2005-10-09	female	Rwandan	\N	Ishami	S6_PCB	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.43503+02	2026-07-08 17:25:04.43503+02
4417	2026144081	 Liliane	\N	ABIMANA	Fannie Lou Hamer	2004-09-29	female	Rwandan	\N	Ishami	S6_MCE	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.435491+02	2026-07-08 17:25:04.435491+02
4418	2026144079	Abayisenga	\N	carine	Fannie Lou Hamer	2005-08-07	female	Rwandan	\N	Ishami	S6_HGL	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.436045+02	2026-07-08 17:25:04.436045+02
4419	2026144077	UMUHOZA	Rutaganda	INESS	Fannie Lou Hamer	2006-07-01	female	Rwandan	\N	Ishami	S6_MPC	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.437052+02	2026-07-08 17:25:04.437052+02
4420	2026144075	Esther	\N	IRADUKUNDA	Fannie Lou Hamer	2007-05-03	female	Rwandan	\N	Ishami	S6_PCB	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.43762+02	2026-07-08 17:25:04.43762+02
4421	2026144074	UWASE 	\N	Yvette 	Fannie Lou Hamer	2005-03-23	female	Rwandan	\N	Ishami	S6_HGL	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.438222+02	2026-07-08 17:25:04.438222+02
4422	2026144073	 Petite	Nicole	UMUHIRE	Fannie Lou Hamer	2006-03-26	female	Rwandan	\N	Ishami	S6_HGL	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.438964+02	2026-07-08 17:25:04.438964+02
4423	2026144072	Izere	Kayiranga	Macrine	Fannie Lou Hamer	2006-06-27	female	Rwandan	\N	Ishami	S6_MCE	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.43964+02	2026-07-08 17:25:04.43964+02
4424	2026144071	Scolastique 	\N	NAKURE	Fannie Lou Hamer	2005-02-28	female	Rwandan	\N	Ishami	S6_MPC	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.440437+02	2026-07-08 17:25:04.440437+02
4425	2026144070	IGIHOZO	\N	Fiona	Fannie Lou Hamer	2005-09-08	female	Rwandan	\N	Ishami	S6_HGL	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.442074+02	2026-07-08 17:25:04.442074+02
4426	2026144069	AKALIZA 	Precious 	Melissa	Fannie Lou Hamer	2006-06-01	female	Rwandan	\N	Ishami	S6_HGL	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.445617+02	2026-07-08 17:25:04.445617+02
4427	2026143068	Jeanette	\N	UWERA	AOUA KEITA	2004-05-11	female	Rwandan	\N	Ishami	S6_MCE	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.447017+02	2026-07-08 17:25:04.447017+02
4428	2026143067	DUKUNDANE   	\N	Germaine	AOUA KEITA	2005-02-27	female	Rwandan	\N	Ishami	S6_PCB	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.448314+02	2026-07-08 17:25:04.448314+02
4429	2026143066	Gentille	Uwayo	Nsengimana	AOUA KEITA	2005-09-26	female	Rwandan	\N	Ishami	S6_MCE	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.449228+02	2026-07-08 17:25:04.449228+02
4430	2026143064	SOLANGE	\N	UWIKUNDA	AOUA KEITA	2005-08-04	female	Rwandan	\N	Ishami	S6_PCB	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.450022+02	2026-07-08 17:25:04.450022+02
4431	2026143063	Chalon	UWASE	NIYOGISUBIZO	AOUA KEITA	2007-04-04	female	Rwandan	\N	Ishami	S6_MPC	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.450952+02	2026-07-08 17:25:04.450952+02
4432	2026143059	MICHELINE	\N	UWASE	AOUA KEITA	2006-05-19	female	Rwandan	\N	Ishami	S6_MEG	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.451652+02	2026-07-08 17:25:04.451652+02
4433	2026143058	UWERA	Marie	Gorette	AOUA KEITA	2005-02-06	female	Rwandan	\N	Ishami	S6_MEG	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.452255+02	2026-07-08 17:25:04.452255+02
4434	2026143053	IRANZI	\N	Providence	AOUA KEITA	2005-10-04	female	Rwandan	\N	Ishami	S6_MCE	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.452874+02	2026-07-08 17:25:04.452874+02
4435	2026143051	RUTIKANGA 	AKALIZA	Sandra	AOUA KEITA	2006-10-07	female	Rwandan	\N	Ishami	S6_HGL	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.453427+02	2026-07-08 17:25:04.453427+02
4436	2026143050	Charity	\N	BATAMURIZA	AOUA KEITA	2006-04-16	female	Rwandan	\N	Ishami	S6_MCE	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.453994+02	2026-07-08 17:25:04.453994+02
4437	2026143049	GISUBIZO 	Ricky	Nicole	AOUA KEITA	2006-10-08	female	Rwandan	\N	Ishami	S6_MPC	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.454762+02	2026-07-08 17:25:04.454762+02
4438	2026142045	d'Amour	Jean	Turahirwa	Chinua Achebe	2006-06-21	male	Rwandan	\N	Ishami	S6_MPC	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.456576+02	2026-07-08 17:25:04.456576+02
4439	2026142044	IRANZI 	\N	Bonheur	Chinua Achebe	2007-08-15	male	Rwandan	\N	Ishami	S6_MPC	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.457606+02	2026-07-08 17:25:04.457606+02
4440	2026142043	NIRINGIYMANA 	\N	Vedaste	Chinua Achebe	2008-02-26	male	Rwandan	\N	Ishami	S6_MPC	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.459104+02	2026-07-08 17:25:04.459104+02
4441	2026142042	Ngoga	\N	Denys	Chinua Achebe	2007-02-08	male	Rwandan	\N	Ishami	S6_MCE	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.460606+02	2026-07-08 17:25:04.460606+02
4442	2026142041	Eddy	\N	Niyomukiza	Chinua Achebe	2005-08-06	male	Burundian	\N	Ishami	S6_PCB	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.461777+02	2026-07-08 17:25:04.461777+02
4443	2026142040	Pascal	\N	Niyomukiza	Chinua Achebe	2006-08-22	male	Rwandan	\N	Ishami	S6_PCB	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.462658+02	2026-07-08 17:25:04.462658+02
4444	2026142038	Isaie	\N	RWAGASANA	Chinua Achebe	2005-05-24	male	Rwandan	\N	Ishami	S6_HGL	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.463621+02	2026-07-08 17:25:04.463621+02
4445	2026142037	Mbaraga	Bonheur	Bertin	Chinua Achebe	2006-12-10	male	Rwandan	\N	Ishami	S6_MPC	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.464593+02	2026-07-08 17:25:04.464593+02
4446	2026142036	Muneza	\N	Didier	Chinua Achebe	2004-07-06	male	Rwandan	\N	Ishami	S6_PCB	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.465932+02	2026-07-08 17:25:04.465932+02
4447	2026142033	Samuel	\N	Mugisha	Chinua Achebe	2005-04-20	male	Rwandan	\N	Ishami	S6_MPC	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.466683+02	2026-07-08 17:25:04.466683+02
4448	2026141022	Prince	\N	NSHUTI	RUGANZU NDOLI 2	2006-11-14	male	Rwandan	\N	Ishami	S6_PCB	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.467282+02	2026-07-08 17:25:04.467282+02
4449	2026141021	Joseph	\N	Musabyimana	RUGANZU NDOLI 2	2007-11-06	male	Rwandan	\N	Ishami	S6_MPC	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.468222+02	2026-07-08 17:25:04.468222+02
4450	2026141020	ISHIMWE	\N	William	RUGANZU NDOLI 2	2007-02-24	male	Rwandan	\N	Ishami	S6_MPC	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.468838+02	2026-07-08 17:25:04.468838+02
4451	2026141019	Emmanuel	\N	Niyonzima	RUGANZU NDOLI 2	2005-02-04	male	Rwandan	\N	Ishami	S6_HGL	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.469378+02	2026-07-08 17:25:04.469378+02
4452	2026141018	Pascal	\N	Niyonsenga	RUGANZU NDOLI 2	2003-12-05	male	Burundian	\N	Ishami	S6_MPC	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.470015+02	2026-07-08 17:25:04.470015+02
4453	2026141012	MUTESA	\N	Willy	RUGANZU NDOLI 2	2007-09-15	male	Rwandan	\N	Ishami	S6_MPC	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.470919+02	2026-07-08 17:25:04.470919+02
4454	2026141011	Frank	MUHINDA	MUSORE	RUGANZU NDOLI 2	2005-11-14	male	Rwandan	\N	Ishami	S6_MCE	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.471697+02	2026-07-08 17:25:04.471697+02
4455	2026141010	Mugisha	\N	Eric	RUGANZU NDOLI 2	2009-03-19	male	Rwandan	\N	Ishami	S6_MEG	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.472254+02	2026-07-08 17:25:04.472254+02
4456	2026141009	Denny	\N	MUGABO	RUGANZU NDOLI 2	2006-08-23	male	Rwandan	\N	Ishami	S6_HGL	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.473855+02	2026-07-08 17:25:04.473855+02
4457	2026141006	Rudasingwa 	Rugero	Leon	RUGANZU NDOLI 2	2007-04-13	male	Rwandan	\N	Ishami	S6_MPC	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.475134+02	2026-07-08 17:25:04.475134+02
4458	2026141004	Sisino	Mucyo	Tuyishime	RUGANZU NDOLI 2	2006-06-11	male	Rwandan	\N	Ishami	S6_MCE	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.47656+02	2026-07-08 17:25:04.47656+02
4459	2026141002	NSHUTI 	\N	Manase	RUGANZU NDOLI 2	2006-05-22	male	Rwandan	\N	Ishami	S6_PCB	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.477735+02	2026-07-08 17:25:04.477735+02
4460	2023126517	Uwase	\N	Zawadi	Ruth Bader Ginsberg	2006-09-21	female	Rwandan	\N	Ijabo	S5_HGL	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.478377+02	2026-07-08 17:25:04.478377+02
4461	2023126516	UWASE	\N	Patience	Ruth Bader Ginsberg	2006-01-31	female	Rwandan	\N	Ijabo	S5_MCE	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.479118+02	2026-07-08 17:25:04.479118+02
4462	2023126515	Natukunda 	Challon	Rolanda	Ruth Bader Ginsberg	2006-04-30	female	Rwandan	\N	Ijabo	S5_HGL	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.479894+02	2026-07-08 17:25:04.479894+02
4463	2023126514	Mutoni	\N	Janviere	Ruth Bader Ginsberg	2006-12-09	female	Rwandan	\N	Ijabo	S5_MCE	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.480502+02	2026-07-08 17:25:04.480502+02
4464	2023126513	MUKANDAKEBUKA 	\N	Assumpta	Ruth Bader Ginsberg	2007-03-26	female	Rwandan	\N	Ijabo	S5_MCE	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.481211+02	2026-07-08 17:25:04.481211+02
4465	2023126512	Uwase	\N	Magnifique	Ruth Bader Ginsberg	2007-03-31	female	Rwandan	\N	Ijabo	S5_HGL	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.481939+02	2026-07-08 17:25:04.481939+02
4466	2023126511	Umutoni 	-	Latifa	Ruth Bader Ginsberg	2007-09-28	female	Rwandan	\N	Ijabo	S5_HGL	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.482535+02	2026-07-08 17:25:04.482535+02
4467	2023126510	Iradukunda	\N	Kevine	Ruth Bader Ginsberg	2007-07-16	female	Rwandan	\N	Ijabo	S5_MPC	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.483224+02	2026-07-08 17:25:04.483224+02
4468	2023126509	Jeniffer	\N	Niyomukiza	Ruth Bader Ginsberg	2006-04-06	female	Rwandan	\N	Ijabo	S5_MCE	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.483742+02	2026-07-08 17:25:04.483742+02
4469	2023126508	Akankunda	\N	Jacky	Ruth Bader Ginsberg	2007-12-20	female	Rwandan	\N	Ijabo	S5_MPC	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.484556+02	2026-07-08 17:25:04.484556+02
4470	2023126507	Iradukunda	\N	Khadidja	Ruth Bader Ginsberg	2007-12-11	female	Rwandan	\N	Ijabo	S5_MCE	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.485369+02	2026-07-08 17:25:04.485369+02
4471	2023126506	TUMUKUNDE 	\N	Gisele	Ruth Bader Ginsberg	2005-03-19	female	Rwandan	\N	Ijabo	S5_HGL	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.48595+02	2026-07-08 17:25:04.48595+02
4472	2023126505	NIYOGISUBIZO	\N	Fille	Ruth Bader Ginsberg	2006-02-15	female	Rwandan	\N	Ijabo	S5_PCB	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.487982+02	2026-07-08 17:25:04.487982+02
4473	2023126503	UBWIZABWIMANA	\N	Darlene	Ruth Bader Ginsberg	2007-10-05	female	Rwandan	\N	Ijabo	S5_MCE	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.488717+02	2026-07-08 17:25:04.488717+02
4474	2023126502	NIYOMUGENGA	\N	Charlotte	Ruth Bader Ginsberg	2005-10-09	female	Rwandan	\N	Ijabo	S5_MEG	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.48929+02	2026-07-08 17:25:04.48929+02
4475	2023126501	Abayisenga	\N	Belyse	Ruth Bader Ginsberg	2007-08-14	female	Rwandan	\N	Ijabo	S5_MPC	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.489743+02	2026-07-08 17:25:04.489743+02
4476	2023126500	UWINEZA 	\N	Antoinette	Ruth Bader Ginsberg	2007-05-04	female	Congolaise	\N	Ijabo	S5_MCE	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.490385+02	2026-07-08 17:25:04.490385+02
4477	2023126499	Nishemezwe  	Ange Daniella	Erlande	Ruth Bader Ginsberg	2006-02-05	female	Burundian	\N	Ijabo	S5_MCE	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.491583+02	2026-07-08 17:25:04.491583+02
4478	2023126498	Umutesi	\N	Alphonsine	Ruth Bader Ginsberg	2008-08-31	female	Rwandan	\N	Ijabo	S5_PCB	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.492817+02	2026-07-08 17:25:04.492817+02
4479	2023126497	UWIRAGIYE 	\N	Alice	Ruth Bader Ginsberg	2002-12-31	female	Rwandan	\N	Ijabo	S5_PCB	Kamagaju Ernestine	familyMothers@asyv.org	788444397	2026-07-08 17:25:04.493758+02	2026-07-08 17:25:04.493758+02
4480	2023126496	Yves	\N	Turayishimye	Alfred Nobel	2008-05-10	male	Rwandan	\N	Ijabo	S5_MPC	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.494386+02	2026-07-08 17:25:04.494386+02
4481	2023126495	Mugisha	\N	Tito	Alfred Nobel	2006-03-06	male	Rwandan	\N	Ijabo	S5_MEG	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.495063+02	2026-07-08 17:25:04.495063+02
4482	2023126494	Niyonteze	\N	Potien	Alfred Nobel	2005-04-14	male	Rwandan	\N	Ijabo	S5_PCB	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.495873+02	2026-07-08 17:25:04.495873+02
4483	2023126493	Pesha 	.	Geofrey	Alfred Nobel	2006-12-15	male	Rwandan	\N	Ijabo	S5_MPC	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.496473+02	2026-07-08 17:25:04.496473+02
4484	2023126492	niyongira	\N	Ismael	Alfred Nobel	2005-12-31	male	Rwandan	\N	Ijabo	S5_HGL	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.497027+02	2026-07-08 17:25:04.497027+02
4485	2023126491	NTIHEBUWAYO Nehemie	\N	Nehemie	Alfred Nobel	2004-07-15	male	Rwandan	\N	Ijabo	S5_MPC	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.49765+02	2026-07-08 17:25:04.49765+02
4486	2023126490	NDASHIMYE	\N	EVODE	Alfred Nobel	2007-05-16	male	Rwandan	\N	Ijabo	S5_MCE	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.498205+02	2026-07-08 17:25:04.498205+02
4487	2023126489	Muvunyi	\N	Arnold	Alfred Nobel	2006-07-22	male	Rwandan	\N	Ijabo	S5_MPC	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.498773+02	2026-07-08 17:25:04.498773+02
4488	2023126488	Mutea	Julius	Junior	Alfred Nobel	2007-07-15	male	Rwandan	\N	Ijabo	S5_HGL	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.499309+02	2026-07-08 17:25:04.499309+02
4489	2023126487	KUMBUSHO	 RUTAREKA	Moses	Alfred Nobel	2005-10-02	male	Rwandan	\N	Ijabo	S5_MCE	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.499917+02	2026-07-08 17:25:04.499917+02
4490	2023126486	Mbabazi 	Shyaka 	Bertin	Alfred Nobel	2007-06-28	male	Rwandan	\N	Ijabo	S5_PCB	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.500834+02	2026-07-08 17:25:04.500834+02
4491	2023126485	Habineza	\N	Kevin	Alfred Nobel	2007-09-06	male	Rwandan	\N	Ijabo	S5_HGL	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.50134+02	2026-07-08 17:25:04.50134+02
4492	2023126484	BYIRINGIRO	\N	Justin	Alfred Nobel	2007-12-31	male	Congolaise	\N	Ijabo	S5_PCB	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.502019+02	2026-07-08 17:25:04.502019+02
4493	2023126483	Irakoze	\N	Joseph	Alfred Nobel	2007-12-09	male	Rwandan	\N	Ijabo	S5_PCB	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.502538+02	2026-07-08 17:25:04.502538+02
4494	2023126482	Tuyishimire 	Ingabire	Jean Bernard	Alfred Nobel	2008-08-15	male	Rwandan	\N	Ijabo	S5_MCE	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.503005+02	2026-07-08 17:25:04.503005+02
4495	2023126481	GABIRO	JABO	Junior	Alfred Nobel	2007-10-07	male	Rwandan	\N	Ijabo	S5_MPC	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.503485+02	2026-07-08 17:25:04.503485+02
4496	2023126480	Iteriteka	\N	Dongrey	Alfred Nobel	2006-02-03	male	Burundian	\N	Ijabo	S5_MCE	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.50414+02	2026-07-08 17:25:04.50414+02
4497	2023126479	Imanishimwe  	Dominique	Savio	Alfred Nobel	2006-10-06	male	Rwandan	\N	Ijabo	S5_MPC	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.504758+02	2026-07-08 17:25:04.504758+02
4498	2023126478	Byiringiro	\N	Heritier	Alfred Nobel	2006-01-31	male	Rwandan	\N	Ijabo	S5_MCE	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.505282+02	2026-07-08 17:25:04.505282+02
4499	2023126477	Muhwezi	\N	George	Alfred Nobel	2004-06-19	male	Rwandan	\N	Ijabo	S5_PCB	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.505979+02	2026-07-08 17:25:04.505979+02
4500	2023126476	Gasana 	Ineza 	Shukuru Gabriel	Alfred Nobel	2007-08-22	male	Rwandan	\N	Ijabo	S5_MCE	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.506698+02	2026-07-08 17:25:04.506698+02
4501	2023126473	Ishimwe	\N	David	Alfred Nobel	2006-12-04	male	Rwandan	\N	Ijabo	S5_MCE	Mukabalisa Dorothe	familyMothers@asyv.org	784493095	2026-07-08 17:25:04.507852+02	2026-07-08 17:25:04.507852+02
4502	2023126472	Uwase	\N	Pamela	Ubald Rugirangoga	2008-10-02	female	Rwandan	\N	Ijabo	S5_HGL	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.509628+02	2026-07-08 17:25:04.509628+02
4503	2023126471	UMUTONIWASE	\N	Annick	Ubald Rugirangoga	2006-12-07	female	Rwandan	\N	Ijabo	S5_HGL	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.511798+02	2026-07-08 17:25:04.511798+02
4504	2023126470	Ihimbazwe	\N	Sonia	Ubald Rugirangoga	2006-12-31	female	Rwandan	\N	Ijabo	S5_HGL	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.513061+02	2026-07-08 17:25:04.513061+02
4505	2023126468	Umutesiwase	\N	Sandrine	Ubald Rugirangoga	2008-08-26	female	Rwandan	\N	Ijabo	S5_PCB	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.514327+02	2026-07-08 17:25:04.514327+02
4506	2023126467	Nasabato	\N	Sandra	Ubald Rugirangoga	2006-03-06	female	Burundian	\N	Ijabo	S5_MPC	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.515664+02	2026-07-08 17:25:04.515664+02
4507	2023126466	Placidia	\N	Mukeshimana	Ubald Rugirangoga	2004-12-31	female	Rwandan	\N	Ijabo	S5_MCE	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.516907+02	2026-07-08 17:25:04.516907+02
4508	2023126465	MUTONI	\N	Peninah	Ubald Rugirangoga	2006-02-22	female	Rwandan	\N	Ijabo	S5_HGL	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.518261+02	2026-07-08 17:25:04.518261+02
4509	2023126462	Bisengimana 	\N	Kevine	Ubald Rugirangoga	2008-03-02	female	Rwandan	\N	Ijabo	S5_PCB	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.519701+02	2026-07-08 17:25:04.519701+02
4510	2023126461	BIHOYIKI 	\N	JUDITH	Ubald Rugirangoga	2005-01-03	female	Rwandan	\N	Ijabo	S5_PCB	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.520662+02	2026-07-08 17:25:04.520662+02
4511	2023126460	Nirere 	\N	Joy	Ubald Rugirangoga	2007-06-11	female	Rwandan	\N	Ijabo	S5_MCE	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.521902+02	2026-07-08 17:25:04.521902+02
4512	2023126458	Izabayo 	\N	phiona	Ubald Rugirangoga	2007-02-27	female	Rwandan	\N	Ijabo	S5_MCE	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.522804+02	2026-07-08 17:25:04.522804+02
4513	2023126457	Uwimanimpaye	\N	Elisabeth	Ubald Rugirangoga	2005-04-09	female	Rwandan	\N	Ijabo	S5_PCB	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.524217+02	2026-07-08 17:25:04.524217+02
4514	2023126455	UMUBYEYI	\N	Denyse	Ubald Rugirangoga	2007-05-27	female	Rwandan	\N	Ijabo	S5_PCB	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.525953+02	2026-07-08 17:25:04.525953+02
4515	2023126454	CYURINYANA	\N	Anysie	Ubald Rugirangoga	2006-01-07	female	Rwandan	\N	Ijabo	S5_MEG	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.528012+02	2026-07-08 17:25:04.528012+02
4516	2023126453	UWIRINGIYIMANA 	\N	Aimee	Ubald Rugirangoga	2007-04-05	female	Rwandan	\N	Ijabo	S5_PCB	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.529199+02	2026-07-08 17:25:04.529199+02
4517	2023126452	UWASE	\N	Sandrine	Charles Babbage	2006-06-28	female	Rwandan	\N	Ijabo	S5_MEG	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.530499+02	2026-07-08 17:25:04.530499+02
4518	2023126451	Umutesi	\N	Shallon	Charles Babbage	2007-05-14	female	Rwandan	\N	Ijabo	S5_PCB	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.531893+02	2026-07-08 17:25:04.531893+02
4519	2023126450	RUTH	\N	Mutesi	Charles Babbage	2005-06-19	female	Rwandan	\N	Ijabo	S5_MCE	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.532967+02	2026-07-08 17:25:04.532967+02
4520	2023126448	Muhoza	\N	Pacifique	Charles Babbage	2008-06-21	female	Rwandan	\N	Ijabo	S5_MPC	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.534185+02	2026-07-08 17:25:04.534185+02
4521	2023126447	Media	\N	UWINEZA	Charles Babbage	2006-11-14	female	Rwandan	\N	Ijabo	S5_MEG	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.535339+02	2026-07-08 17:25:04.535339+02
4522	2023126446	NSHUTI 	\N	Kevine	Charles Babbage	2006-04-06	female	Rwandan	\N	Ijabo	S5_MCE	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.536549+02	2026-07-08 17:25:04.536549+02
4523	2023126445	Niquita	Umutoni	Kanyana	Charles Babbage	2008-10-08	female	Rwandan	\N	Ijabo	S5_PCB	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.537748+02	2026-07-08 17:25:04.537748+02
4524	2023126444	KAMIKAZI 	\N	Deborah	Charles Babbage	2006-12-23	female	Rwandan	\N	Ijabo	S5_MPC	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.538746+02	2026-07-08 17:25:04.538746+02
4525	2023126443	Ineza 	Teta	Ornella	Charles Babbage	2007-09-12	female	Rwandan	\N	Ijabo	S5_MPC	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.540059+02	2026-07-08 17:25:04.540059+02
4526	2023126442	Cyuzuzo 	\N	Hope	Charles Babbage	2006-02-09	female	Rwandan	\N	Ijabo	S5_PCB	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.541618+02	2026-07-08 17:25:04.541618+02
4527	2023126441	UWIMANA	\N	Fanny	Charles Babbage	2007-04-24	female	Rwandan	\N	Ijabo	S5_HGL	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.543216+02	2026-07-08 17:25:04.543216+02
4528	2023126440	IRANEZEREZA 	\N	Evelyne	Charles Babbage	2006-04-03	female	Burundian	\N	Ijabo	S5_MEG	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.544699+02	2026-07-08 17:25:04.544699+02
4529	2023126439	NTAKIRWANYIMANA	\N	Emerance	Charles Babbage	2006-07-09	female	Rwandan	\N	Ijabo	S5_MEG	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.5458+02	2026-07-08 17:25:04.5458+02
4530	2023126438	Adelphine	Teta	Akingeneye	Charles Babbage	2007-10-31	female	Rwandan	\N	Ijabo	S5_PCB	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.547324+02	2026-07-08 17:25:04.547324+02
4531	2023126437	Umurangwa 	Deborah	kayumba	Charles Babbage	2007-07-15	female	Rwandan	\N	Ijabo	S5_HGL	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.548043+02	2026-07-08 17:25:04.548043+02
4532	2023126436	MBABAZI	\N	CLEMENCE	Charles Babbage	2006-01-27	female	Rwandan	\N	Ijabo	S5_MCE	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.548767+02	2026-07-08 17:25:04.548767+02
4533	2023126435	MUMARARUNGU 	\N	Angel	Charles Babbage	2007-06-04	female	Rwandan	\N	Ijabo	S5_MCE	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.549649+02	2026-07-08 17:25:04.549649+02
4534	2023126433	MUKESHIMANA	\N	Adeline	Charles Babbage	2008-05-13	female	Rwandan	\N	Ijabo	S5_MCE	Mukantaganira Beatha	familyMothers@asyv.org	783093760	2026-07-08 17:25:04.552586+02	2026-07-08 17:25:04.552586+02
4535	2023126432	Yezakuzwe	\N	Lucie	Toni Morrison	2006-07-26	female	Rwandan	\N	Ijabo	S5_PCB	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.554337+02	2026-07-08 17:25:04.554337+02
4536	2023126431	NIYONSHUTI 	KEZA	Vanessa	Toni Morrison	2006-02-07	female	Rwandan	\N	Ijabo	S5_MPC	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.555638+02	2026-07-08 17:25:04.555638+02
4537	2023126430	UWIMANA	\N	Adrienne	Toni Morrison	2007-02-04	female	Rwandan	\N	Ijabo	S5_PCB	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.557763+02	2026-07-08 17:25:04.557763+02
4538	2023126429	Ingabire	\N	Solaya	Toni Morrison	2007-03-04	female	Burundian	\N	Ijabo	S5_PCB	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.560327+02	2026-07-08 17:25:04.560327+02
4539	2023126428	Ibyikora	\N	Sifa	Toni Morrison	2006-12-23	female	Rwandan	\N	Ijabo	S5_HGL	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.562134+02	2026-07-08 17:25:04.562134+02
4540	2023126427	MUKESHIMANA 	\N	HONORINE	Toni Morrison	2005-09-28	female	Rwandan	\N	Ijabo	S5_PCB	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.563776+02	2026-07-08 17:25:04.563776+02
4541	2023126426	Mugeni	\N	Belyse	Toni Morrison	2008-08-05	female	Rwandan	\N	Ijabo	S5_MPC	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.566527+02	2026-07-08 17:25:04.566527+02
4542	2023126425	Esther	\N	Mahoro	Toni Morrison	2006-04-27	female	Rwandan	\N	Ijabo	S5_HGL	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.568881+02	2026-07-08 17:25:04.568881+02
4543	2023126424	Lucky 	\N	Ishimwe	Toni Morrison	2007-02-23	female	Rwandan	\N	Ijabo	S5_MPC	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.570283+02	2026-07-08 17:25:04.570283+02
4544	2023126423	tumukunde	\N	kevine	Toni Morrison	2006-03-14	female	Rwandan	\N	Ijabo	S5_HGL	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.571172+02	2026-07-08 17:25:04.571172+02
4545	2023126422	Umukundwa	\N	Josine	Toni Morrison	2005-05-04	female	Rwandan	\N	Ijabo	S5_MCE	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.572542+02	2026-07-08 17:25:04.572542+02
4546	2023126421	Uwamuruta	\N	Evas	Toni Morrison	2007-02-08	female	Rwandan	\N	Ijabo	S5_MCE	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.57372+02	2026-07-08 17:25:04.57372+02
4547	2023126420	Phedine	\N	DUSENAYO	Toni Morrison	2008-06-04	female	Rwandan	\N	Ijabo	S5_PCB	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.575385+02	2026-07-08 17:25:04.575385+02
4548	2023126419	Ingabire	\N	Divine	Ubald Rugirangoga	2006-10-10	female	Rwandan	\N	Ijabo	S5_MEG	Mukagasana Godelive	familyMothers@asyv.org	784106735	2026-07-08 17:25:04.577114+02	2026-07-08 17:25:04.577114+02
4549	2023126418	Devothe	\N	Uwineza	Toni Morrison	2008-03-07	female	Rwandan	\N	Ijabo	S5_MPC	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.57844+02	2026-07-08 17:25:04.57844+02
4550	2023126417	IGIRANEZA	\N	Aminah	Toni Morrison	2009-05-19	female	Rwandan	\N	Ijabo	S5_PCB	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.579929+02	2026-07-08 17:25:04.579929+02
4551	2023126416	IRAFASHA	Keza	Alliah	Toni Morrison	2007-11-22	female	Rwandan	\N	Ijabo	S5_MPC	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.58115+02	2026-07-08 17:25:04.58115+02
4552	2023126415	UFITINEMA	\N	Agnes	Toni Morrison	2006-12-06	female	Rwandan	\N	Ijabo	S5_MCE	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.582094+02	2026-07-08 17:25:04.582094+02
4553	2023126414	Agatesi 	Fillette 	Sonia	Toni Morrison	2008-11-02	female	Rwandan	\N	Ijabo	S5_HGL	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.582857+02	2026-07-08 17:25:04.582857+02
4554	2023126413	MUJAWUWERA 	\N	 Adeline	Toni Morrison	2005-01-22	female	Rwandan	\N	Ijabo	S5_MEG	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.583499+02	2026-07-08 17:25:04.583499+02
4555	2023126412	ABAYISENGAkez	\N	Asterie	Toni Morrison	2007-02-08	female	Rwandan	\N	Ijabo	S5_HGL	Mukashyaka Viviane	familyMothers@asyv.org	788769299	2026-07-08 17:25:04.584137+02	2026-07-08 17:25:04.584137+02
4556	2023126411	Umuhumuza	\N	Boaz	Pelé (Edson Arantes Do Nascimento)	2006-06-26	male	Rwandan	\N	Ijabo	S5_MEG	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.58484+02	2026-07-08 17:25:04.58484+02
4557	2023126410	Nkurunziza	\N	Samuel	Pelé (Edson Arantes Do Nascimento)	2007-07-14	male	Rwandan	\N	Ijabo	S5_MEG	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.585877+02	2026-07-08 17:25:04.585877+02
4558	2023126409	RURANGWA	\N	ALLAN	Pelé (Edson Arantes Do Nascimento)	2007-12-09	male	Rwandan	\N	Ijabo	S5_MEG	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.586537+02	2026-07-08 17:25:04.586537+02
4559	2023126408	MUGISHA 	\N	Prince	Pelé (Edson Arantes Do Nascimento)	2005-10-19	male	Rwandan	\N	Ijabo	S5_HGL	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.587244+02	2026-07-08 17:25:04.587244+02
4560	2023126407	MUSONI	\N	Patrick	Pelé (Edson Arantes Do Nascimento)	2008-04-30	male	Rwandan	\N	Ijabo	S5_HGL	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.587976+02	2026-07-08 17:25:04.587976+02
4561	2023126406	NIYONKURU	CELSE	KENNY	Pelé (Edson Arantes Do Nascimento)	2008-10-29	male	Rwandan	\N	Ijabo	S5_HGL	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.588877+02	2026-07-08 17:25:04.588877+02
4562	2023126405	NDICUNGUYE 	DIEU MERCI 	Jesus	Pelé (Edson Arantes Do Nascimento)	2007-06-25	male	Rwandan	\N	Ijabo	S5_MEG	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.589466+02	2026-07-08 17:25:04.589466+02
4563	2023126404	NTAGANZWA	\N	Prince	Pelé (Edson Arantes Do Nascimento)	2008-02-02	male	Rwandan	\N	Ijabo	S5_MPC	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.590995+02	2026-07-08 17:25:04.590995+02
4564	2023126403	Mutaganzwa	\N	Bright	Pelé (Edson Arantes Do Nascimento)	2007-05-28	male	Rwandan	\N	Ijabo	S5_MCE	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.593405+02	2026-07-08 17:25:04.593405+02
4565	2023126402	Rongine	\N	MURAGIJIMANA	Pelé (Edson Arantes Do Nascimento)	2008-04-26	male	Rwandan	\N	Ijabo	S5_MPC	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.594723+02	2026-07-08 17:25:04.594723+02
4566	2023126401	Muberwa	\N	Achille	Pelé (Edson Arantes Do Nascimento)	2008-08-06	male	Rwandan	\N	Ijabo	S5_MCE	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.595823+02	2026-07-08 17:25:04.595823+02
4567	2023126400	KAGAME	Junior	Junior	Pelé (Edson Arantes Do Nascimento)	2005-05-06	male	Rwandan	\N	Ijabo	S5_MCE	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.59642+02	2026-07-08 17:25:04.59642+02
4568	2023126399	NIYOGISUBIZO	\N	Joseph	Pelé (Edson Arantes Do Nascimento)	2005-05-15	male	Rwandan	\N	Ijabo	S5_MCE	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.597215+02	2026-07-08 17:25:04.597215+02
4569	2023126398	Eric	\N	Shema	Pelé (Edson Arantes Do Nascimento)	2005-09-09	male	Rwandan	\N	Ijabo	S5_HGL	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.597962+02	2026-07-08 17:25:04.597962+02
4570	2023126397	Manzi 	Butera	Eloi	Pelé (Edson Arantes Do Nascimento)	2008-12-01	male	Rwandan	\N	Ijabo	S5_HGL	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.598707+02	2026-07-08 17:25:04.598707+02
4571	2023126396	Eliya 	Francis	Celestin	Pelé (Edson Arantes Do Nascimento)	2007-12-31	male	Rwandan	\N	Ijabo	S5_HGL	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.599289+02	2026-07-08 17:25:04.599289+02
4572	2023126395	Dushimimana 	Louis	Victor	Pelé (Edson Arantes Do Nascimento)	2006-11-22	male	Rwandan	\N	Ijabo	S5_MEG	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.599891+02	2026-07-08 17:25:04.599891+02
4573	2023126394	Eric 	\N	Dufitimana	Pelé (Edson Arantes Do Nascimento)	2007-06-29	male	Rwandan	\N	Ijabo	S5_MPC	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.600497+02	2026-07-08 17:25:04.600497+02
4574	2023126393	MUGISHA	\N	Divin	Pelé (Edson Arantes Do Nascimento)	2009-11-29	male	Rwandan	\N	Ijabo	S5_MEG	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.601058+02	2026-07-08 17:25:04.601058+02
4575	2023126392	claude	\N	ndizeye	Pelé (Edson Arantes Do Nascimento)	2005-05-11	male	Rwandan	\N	Ijabo	S5_HGL	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.601633+02	2026-07-08 17:25:04.601633+02
4576	2023126391	IRANZI	Fiacre 	Bonheur	Pelé (Edson Arantes Do Nascimento)	2006-10-19	male	Rwandan	\N	Ijabo	S5_HGL	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.60232+02	2026-07-08 17:25:04.60232+02
4577	2023126390	MANZI 	Deco 	Arsene	Pelé (Edson Arantes Do Nascimento)	2009-05-19	male	Rwandan	\N	Ijabo	S5_MCE	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.603026+02	2026-07-08 17:25:04.603026+02
4578	2023126389	NGABONZIZA 	\N	Aime'	Pelé (Edson Arantes Do Nascimento)	2005-05-19	male	Rwandan	\N	Ijabo	S5_HGL	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.603837+02	2026-07-08 17:25:04.603837+02
4579	2023126388	NDAYISHIMIYE 	Aime 	Bruce 	Pelé (Edson Arantes Do Nascimento)	2007-03-10	male	Burundian	\N	Ijabo	S5_MCE	Gahongayire Agnes	familyMothers@asyv.org	785293792	2026-07-08 17:25:04.604871+02	2026-07-08 17:25:04.604871+02
4580	2023126387	David	\N	Shema	RUGANZU NDOLI 2	2005-02-07	male	Rwandan	\N	Ishami	S6_PCB	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.60578+02	2026-07-08 17:25:04.60578+02
4581	2023126386	UWAYO	\N	Samuel	RUGANZU NDOLI 2	2007-06-08	male	Rwandan	\N	Ishami	S6_MCE	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.606474+02	2026-07-08 17:25:04.606474+02
4582	2023126384	NKIKO	Jean 	Claude	RUGANZU NDOLI 2	2004-09-23	male	Rwandan	\N	Ishami	S6_HGL	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.607674+02	2026-07-08 17:25:04.607674+02
4583	2023126383	HATANGIMANA	Jean	Claude	RUGANZU NDOLI 2	2006-05-21	male	Rwandan	\N	Ishami	S6_MCE	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.60911+02	2026-07-08 17:25:04.60911+02
4584	2023126381	KAYIRANGA 	\N	Theogene	RUGANZU NDOLI 2	2006-09-24	male	Rwandan	\N	Ishami	S6_PCB	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.610487+02	2026-07-08 17:25:04.610487+02
4585	2023126379	KIMENYI	\N	Regis	RUGANZU NDOLI 2	2005-10-02	male	Rwandan	\N	Ishami	S6_MCE	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.611381+02	2026-07-08 17:25:04.611381+02
4586	2023126377	Yvan	\N	Mugisha	RUGANZU NDOLI 2	2006-07-13	male	Rwandan	\N	Ishami	S6_HGL	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.61211+02	2026-07-08 17:25:04.61211+02
4587	2023126376	Valentin	\N	MUCYO	RUGANZU NDOLI 2	2005-05-05	male	Rwandan	\N	Ishami	S6_HGL	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.614663+02	2026-07-08 17:25:04.614663+02
4588	2023126375	Kelly	\N	SHEMA 	Chinua Achebe	2006-07-18	male	Rwandan	\N	Ishami	S6_HGL	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.615729+02	2026-07-08 17:25:04.615729+02
4589	2023126374	NIYOMUGABO 	\N	Noel	Chinua Achebe	2004-12-24	male	Rwandan	\N	Ishami	S6_MPC	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.616337+02	2026-07-08 17:25:04.616337+02
4590	2023126370	Jean Baptiste	\N	HABINEZA	Chinua Achebe	2006-04-09	male	Rwandan	\N	Ishami	S6_MCE	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.617129+02	2026-07-08 17:25:04.617129+02
4591	2023126368	christian	Ntwali 	Mugabo 	RUGANZU NDOLI 2	2006-11-06	male	Rwandan	\N	Ishami	S6_MCE	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.617662+02	2026-07-08 17:25:04.617662+02
4592	2023126366	Naomie	\N	Uwitonze	AOUA KEITA	2005-05-25	female	Congolaise	\N	Ishami	S6_MCE	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.618275+02	2026-07-08 17:25:04.618275+02
4593	2023126365	KEVINE	\N	INGABIRE	AOUA KEITA	2006-06-25	female	Rwandan	\N	Ishami	S6_PCB	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.618845+02	2026-07-08 17:25:04.618845+02
4594	2023126364	NIYOMUKIZA	\N	Naome	AOUA KEITA	2005-01-19	female	Rwandan	\N	Ishami	S6_MCE	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.61978+02	2026-07-08 17:25:04.61978+02
4595	2023126362	MANIRAKIZA 	\N	Olivier	Chinua Achebe	2006-05-24	male	Rwandan	\N	Ishami	S6_PCB	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.620458+02	2026-07-08 17:25:04.620458+02
4596	2023126360	PRINCE	\N	NIYOGUSHIMWA	RUGANZU NDOLI 2	2004-02-03	male	Rwandan	\N	Ishami	S6_HGL	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.621054+02	2026-07-08 17:25:04.621054+02
4597	2023126359	ZARIZO 	FIKIRI	Nicolas	Chinua Achebe	2007-01-27	male	Rwandan	\N	Ishami	S6_MCE	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.621773+02	2026-07-08 17:25:04.621773+02
4598	2023126357	BUGINGO	\N	gilbert	Chinua Achebe	2007-03-23	male	Rwandan	\N	Ishami	S6_MEG	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.622564+02	2026-07-08 17:25:04.622564+02
4599	2023126356	Yvan	\N	NTWARI	Chinua Achebe	2005-12-10	male	Rwandan	\N	Ishami	S6_HGL	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.623364+02	2026-07-08 17:25:04.623364+02
4600	2023126354	Ndayisabye	\N	Aristide	Chinua Achebe	2005-12-04	male	Rwandan	\N	Ishami	S6_MEG	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.62468+02	2026-07-08 17:25:04.62468+02
4601	2023126352	Josue	\N	MBANZA 	Chinua Achebe	2006-03-12	male	Rwandan	\N	Ishami	S6_HGL	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.62629+02	2026-07-08 17:25:04.62629+02
4602	2023126349	MWUNGERI 	\N	Dieudonne	Chinua Achebe	2005-07-09	male	Rwandan	\N	Ishami	S6_MCE	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.628294+02	2026-07-08 17:25:04.628294+02
4603	2023126337	INEZA	UMUHOZA	Emeline	AOUA KEITA	2006-01-10	female	Rwandan	\N	Ishami	S6_PCB	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.629315+02	2026-07-08 17:25:04.629315+02
4604	2023126335	Kessy	\N	GISUBIZO	RUGANZU NDOLI 2	2006-11-07	male	Rwandan	\N	Ishami	S6_MCE	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.630112+02	2026-07-08 17:25:04.630112+02
4605	2023126334	Bianca	Gasana 	UWASE	AOUA KEITA	2005-09-04	female	Rwandan	\N	Ishami	S6_HGL	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.631144+02	2026-07-08 17:25:04.631144+02
4606	2023126333	Shimirwa	\N	Querine	YVAN BURAVAN	2006-05-03	female	Rwandan	\N	Ishami	S6_MPC	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.631938+02	2026-07-08 17:25:04.631938+02
4607	2023126332	Prince	Umuhire	Innocent	Chinua Achebe	2005-11-29	male	Rwandan	\N	Ishami	S6_MCE	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.632594+02	2026-07-08 17:25:04.632594+02
4608	2023126330	ISHEMA 	\N	MUVUNYI	Chinua Achebe	2004-04-09	male	Rwandan	\N	Ishami	S6_MCE	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.633376+02	2026-07-08 17:25:04.633376+02
4609	2023126328	Francoise	\N	UWERA	YVAN BURAVAN	2006-11-30	female	Rwandan	\N	Ishami	S6_MCE	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.63433+02	2026-07-08 17:25:04.63433+02
4610	2023126327	UMUBYEYI	\N	Elegance	YVAN BURAVAN	2005-11-17	female	Rwandan	\N	Ishami	S6_HGL	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.635058+02	2026-07-08 17:25:04.635058+02
4611	2023126325	Nysse Gandhi	\N	NSANGA GAHIGANA	AOUA KEITA	2007-11-30	female	Rwandan	\N	Ishami	S6_PCB	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.635635+02	2026-07-08 17:25:04.635635+02
4612	2023126321	Solange	\N	UWIMBABAZI	Fannie Lou Hamer	2006-12-06	female	Rwandan	\N	Ishami	S6_MEG	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.636271+02	2026-07-08 17:25:04.636271+02
4613	2023126320	UWIREBEYE	\N	Joselyne	KATHERINE JOHNSON	2004-02-03	female	Rwandan	\N	Ishami	S6_HGL	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.636825+02	2026-07-08 17:25:04.636825+02
4614	2023126318	MUHONGAYIRE	\N	Leoncie	KATHERINE JOHNSON	2006-05-10	female	Rwandan	\N	Ishami	S6_MCE	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.637389+02	2026-07-08 17:25:04.637389+02
4615	2023126316	URIHO	\N	Moreen	KATHERINE JOHNSON	2007-04-16	female	Rwandan	\N	Ishami	S6_HGL	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.637979+02	2026-07-08 17:25:04.637979+02
4616	2023126313	Sangwa	Eric	MUNYAZOGEYE	Chinua Achebe	2002-07-10	male	Rwandan	\N	Ishami	S6_MEG	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.638659+02	2026-07-08 17:25:04.638659+02
4617	2023126312	UWAMAHORO	\N	Rebecca	KATHERINE JOHNSON	2005-09-04	female	Rwandan	\N	Ishami	S6_HGL	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.639297+02	2026-07-08 17:25:04.639297+02
4618	2023126311	Mukwaya	Aldrine	Jeremiah	Chinua Achebe	2005-09-02	male	Rwandan	\N	Ishami	S6_MPC	Dusingizemariya Bernadette	familyMothers@asyv.org	788691364	2026-07-08 17:25:04.640417+02	2026-07-08 17:25:04.640417+02
4619	2023126310	KARENZI	\N	Gisele	KATHERINE JOHNSON	2006-01-07	female	Rwandan	\N	Ishami	S6_HGL	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.641886+02	2026-07-08 17:25:04.641886+02
4620	2023126309	Chanella	\N	UMWALI	Fannie Lou Hamer	2007-01-26	female	Rwandan	\N	Ishami	S6_MPC	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.643354+02	2026-07-08 17:25:04.643354+02
4621	2023126308	Celine	\N	IRADUKUNDA 	KATHERINE JOHNSON	2006-11-13	female	Rwandan	\N	Ishami	S6_HGL	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.644888+02	2026-07-08 17:25:04.644888+02
4622	2023126305	IRAGABA 	\N	Josee	YVAN BURAVAN	2007-11-11	female	Rwandan	\N	Ishami	S6_PCB	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.646026+02	2026-07-08 17:25:04.646026+02
4623	2023126303	Xavella	\N	INGABIRE	YVAN BURAVAN	2006-09-02	female	Rwandan	\N	Ishami	S6_PCB	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.646947+02	2026-07-08 17:25:04.646947+02
4624	2023126301	Denyse	\N	UWINEZA	KATHERINE JOHNSON	2005-11-07	female	Rwandan	\N	Ishami	S6_MCE	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.647958+02	2026-07-08 17:25:04.647958+02
4625	2023126299	MBABAZI 	\N	Honorine	AOUA KEITA	2009-06-04	female	Rwandan	\N	Ishami	S6_MPC	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.648638+02	2026-07-08 17:25:04.648638+02
4626	2023126297	BUTOYI	\N	Aline	Fannie Lou Hamer	2003-12-31	female	Burundian	\N	Ishami	S6_PCB	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.649241+02	2026-07-08 17:25:04.649241+02
4627	2023126291	INGABIRE	\N	Gisele	Fannie Lou Hamer	2005-05-16	female	Rwandan	\N	Ishami	S6_HGL	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.650133+02	2026-07-08 17:25:04.650133+02
4628	2023126290	Umutoniwase	\N	Pascaline	YVAN BURAVAN	2006-05-05	female	Rwandan	\N	Ishami	S6_HGL	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.651336+02	2026-07-08 17:25:04.651336+02
4629	2023126289	Alodie 	\N	MBABAZI	YVAN BURAVAN	2004-03-07	female	Rwandan	\N	Ishami	S6_HGL	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.652377+02	2026-07-08 17:25:04.652377+02
4630	2023126287	NYIRAKANEZA	\N	Princess	YVAN BURAVAN	2006-12-31	female	Congolaise	\N	Ishami	S6_PCB	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.653319+02	2026-07-08 17:25:04.653319+02
4631	2023126285	UWABABYEYI	\N	Gisele	KATHERINE JOHNSON	2008-07-10	female	Rwandan	\N	Ishami	S6_MCE	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.654568+02	2026-07-08 17:25:04.654568+02
4632	2023126284	Jeannette	\N	UWIMANA	Fannie Lou Hamer	2004-12-13	female	Rwandan	\N	Ishami	S6_MEG	Ulinganiye Speciose	familyMothers@asyv.org	788740324	2026-07-08 17:25:04.655973+02	2026-07-08 17:25:04.655973+02
4633	2023126283	Sharangabo 	Agahire	Ketia	YVAN BURAVAN	2007-05-10	female	Rwandan	\N	Ishami	S6_MPC	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.657768+02	2026-07-08 17:25:04.657768+02
4634	2023126282	KALIZA	UMUTONI	Alice	KATHERINE JOHNSON	2007-04-02	female	Rwandan	\N	Ishami	S6_MPC	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.660373+02	2026-07-08 17:25:04.660373+02
4635	2023126280	Vestine	\N	NYIRABIZIMANA	YVAN BURAVAN	2004-03-04	female	Rwandan	\N	Ishami	S6_PCB	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.661871+02	2026-07-08 17:25:04.661871+02
4636	2023126276	Henriette	\N	 Imanizabayo	YVAN BURAVAN	2006-01-24	female	Rwandan	\N	Ishami	S6_PCB	Nyirabahinzi Egidia	familyMothers@asyv.org	785645836	2026-07-08 17:25:04.663233+02	2026-07-08 17:25:04.663233+02
4637	2023126273	Divine	\N	UMURERWA	KATHERINE JOHNSON	2006-03-30	female	Rwandan	\N	Ishami	S6_MCE	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.664317+02	2026-07-08 17:25:04.664317+02
4638	2023126272	Ikuze Keza	Brise 	Nina	AOUA KEITA	2007-01-01	female	Rwandan	\N	Ishami	S6_PCB	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.665606+02	2026-07-08 17:25:04.665606+02
4639	2023126269	Dorcas 	\N	IBYISHAKA	KATHERINE JOHNSON	2006-07-07	female	Rwandan	\N	Ishami	S6_PCB	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.666958+02	2026-07-08 17:25:04.666958+02
4640	2023126267	GIRAMATA	\N	Rachel	KATHERINE JOHNSON	2006-05-04	female	Rwandan	\N	Ishami	S6_MPC	Mukangango Jacqueline	familyMothers@asyv.org	788863585	2026-07-08 17:25:04.668063+02	2026-07-08 17:25:04.668063+02
4641	2023126265	Pamela	Laura	Ashimwe	AOUA KEITA	2007-07-16	female	Rwandan	\N	Ishami	S6_MCE	Nduwumwe Marie Grace	familyMothers@asyv.org	783285804	2026-07-08 17:25:04.669197+02	2026-07-08 17:25:04.669197+02
4642	2023126264	Noel	\N	MUNYABUGINGO	RUGANZU NDOLI 2	2006-12-24	male	Rwandan	\N	Ishami	S6_HGL	Mukaselekeli Thacienne	familyMothers@asyv.org	788625056	2026-07-08 17:25:04.670298+02	2026-07-08 17:25:04.670298+02
\.


--
-- TOC entry 5207 (class 0 OID 16561)
-- Dependencies: 230
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transfers (id, case_id, initiated_by, hospital_name, reason, status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5209 (class 0 OID 16577)
-- Dependencies: 232
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, role, phone, is_active, created_at, updated_at, password) FROM stdin;
2	Head Nurse	nurse@clinic.local	nurse	\N	t	2026-06-10 15:29:59.418042+02	2026-06-15 16:45:46.659571+02	$2b$12$MkqkKA53/xhl7s3gTqMJm.hoGZqPN6KbL1QU11x.1HwPqLaS.b8r.
3	Dr. Mugisha	doctor@clinic.local	doctor	\N	t	2026-06-10 15:29:59.418042+02	2026-06-15 16:45:46.669498+02	$2b$12$bybTGWCcM8VWLtA4wLoCce4DRaQU899FcAAjmMf2KBMLxEWqn9ErG
4	Lab Tech	lab@clinic.local	lab_technician	\N	t	2026-06-10 15:29:59.418042+02	2026-06-15 16:45:46.676229+02	$2b$12$TQq3dHMahhzv/vLUcDUylubemXCSD3W3COl5nbhkmcOdNMothBDPO
1	Admin	admin@clinic.local	admin	+250784459580	t	2026-06-10 15:29:59.418042+02	2026-07-08 10:56:50.975435+02	$2b$12$03o77LZWbOa4CFKFkNO30uYdVgPtQ7.rUAjW1vVdA.hS5FpddLf.i
5	Deo Kabirigi	deo@asyv.org	admin	+250788840651	t	2026-07-08 10:58:17.770553+02	2026-07-08 10:58:17.770553+02	$2b$12$PYOY1WyHae7q9N2ixUjBfuJezSPuL21kPuZpZ2uG8VwSrhXFwJU3u
\.


--
-- TOC entry 5247 (class 0 OID 0)
-- Dependencies: 221
-- Name: case_findings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.case_findings_id_seq', 16, true);


--
-- TOC entry 5248 (class 0 OID 0)
-- Dependencies: 223
-- Name: cases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cases_id_seq', 12, true);


--
-- TOC entry 5249 (class 0 OID 0)
-- Dependencies: 225
-- Name: lab_tests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lab_tests_id_seq', 17, true);


--
-- TOC entry 5250 (class 0 OID 0)
-- Dependencies: 227
-- Name: medications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medications_id_seq', 7, true);


--
-- TOC entry 5251 (class 0 OID 0)
-- Dependencies: 229
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_id_seq', 4642, true);


--
-- TOC entry 5252 (class 0 OID 0)
-- Dependencies: 231
-- Name: transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transfers_id_seq', 5, true);


--
-- TOC entry 5253 (class 0 OID 0)
-- Dependencies: 233
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- TOC entry 4994 (class 2606 OID 16626)
-- Name: case_findings case_findings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_findings
    ADD CONSTRAINT case_findings_pkey PRIMARY KEY (id);


--
-- TOC entry 4997 (class 2606 OID 16628)
-- Name: cases cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_pkey PRIMARY KEY (id);


--
-- TOC entry 5007 (class 2606 OID 16630)
-- Name: lab_tests lab_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_tests
    ADD CONSTRAINT lab_tests_pkey PRIMARY KEY (id);


--
-- TOC entry 5010 (class 2606 OID 16632)
-- Name: medications medications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_pkey PRIMARY KEY (id);


--
-- TOC entry 5017 (class 2606 OID 16634)
-- Name: students students_admission_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_admission_code_key UNIQUE (admission_code);


--
-- TOC entry 5019 (class 2606 OID 16636)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- TOC entry 5022 (class 2606 OID 16638)
-- Name: transfers transfers_case_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_case_id_key UNIQUE (case_id);


--
-- TOC entry 5024 (class 2606 OID 16640)
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- TOC entry 5026 (class 2606 OID 16642)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5028 (class 2606 OID 16644)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4998 (class 1259 OID 16645)
-- Name: idx_cases_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cases_created_at ON public.cases USING btree (created_at DESC);


--
-- TOC entry 4999 (class 1259 OID 16646)
-- Name: idx_cases_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cases_created_by ON public.cases USING btree (created_by);


--
-- TOC entry 5000 (class 1259 OID 16647)
-- Name: idx_cases_nurse_open; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cases_nurse_open ON public.cases USING btree (created_by, status) WHERE (status = 'open'::public.case_status);


--
-- TOC entry 5001 (class 1259 OID 16648)
-- Name: idx_cases_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cases_status ON public.cases USING btree (status);


--
-- TOC entry 5002 (class 1259 OID 16649)
-- Name: idx_cases_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cases_student_id ON public.cases USING btree (student_id);


--
-- TOC entry 4995 (class 1259 OID 16650)
-- Name: idx_findings_case_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_findings_case_id ON public.case_findings USING btree (case_id);


--
-- TOC entry 5003 (class 1259 OID 16651)
-- Name: idx_lab_case_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lab_case_id ON public.lab_tests USING btree (case_id);


--
-- TOC entry 5004 (class 1259 OID 16652)
-- Name: idx_lab_pending; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lab_pending ON public.lab_tests USING btree (status) WHERE (status <> 'completed'::public.lab_test_status);


--
-- TOC entry 5005 (class 1259 OID 16653)
-- Name: idx_lab_requested_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lab_requested_by ON public.lab_tests USING btree (requested_by);


--
-- TOC entry 5008 (class 1259 OID 16654)
-- Name: idx_meds_case_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_meds_case_id ON public.medications USING btree (case_id);


--
-- TOC entry 5011 (class 1259 OID 16655)
-- Name: idx_students_admission_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_admission_code ON public.students USING btree (admission_code);


--
-- TOC entry 5012 (class 1259 OID 16656)
-- Name: idx_students_family_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_family_name ON public.students USING btree (family_name varchar_pattern_ops);


--
-- TOC entry 5013 (class 1259 OID 16657)
-- Name: idx_students_first_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_first_name ON public.students USING btree (first_name varchar_pattern_ops);


--
-- TOC entry 5014 (class 1259 OID 16658)
-- Name: idx_students_grade_class; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_grade_class ON public.students USING btree (grade, class);


--
-- TOC entry 5015 (class 1259 OID 16659)
-- Name: idx_students_last_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_last_name ON public.students USING btree (last_name varchar_pattern_ops);


--
-- TOC entry 5020 (class 1259 OID 16660)
-- Name: idx_transfers_case_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transfers_case_id ON public.transfers USING btree (case_id);


--
-- TOC entry 5041 (class 2620 OID 16661)
-- Name: cases trg_cases_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5042 (class 2620 OID 16662)
-- Name: students trg_students_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5043 (class 2620 OID 16663)
-- Name: transfers trg_transfers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_transfers_updated_at BEFORE UPDATE ON public.transfers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5044 (class 2620 OID 16664)
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5029 (class 2606 OID 16665)
-- Name: case_findings case_findings_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_findings
    ADD CONSTRAINT case_findings_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.users(id);


--
-- TOC entry 5030 (class 2606 OID 16670)
-- Name: case_findings case_findings_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_findings
    ADD CONSTRAINT case_findings_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id);


--
-- TOC entry 5031 (class 2606 OID 16675)
-- Name: cases cases_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.users(id);


--
-- TOC entry 5032 (class 2606 OID 16680)
-- Name: cases cases_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 5033 (class 2606 OID 16685)
-- Name: cases cases_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- TOC entry 5034 (class 2606 OID 16690)
-- Name: lab_tests lab_tests_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_tests
    ADD CONSTRAINT lab_tests_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id);


--
-- TOC entry 5035 (class 2606 OID 16695)
-- Name: lab_tests lab_tests_fulfilled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_tests
    ADD CONSTRAINT lab_tests_fulfilled_by_fkey FOREIGN KEY (fulfilled_by) REFERENCES public.users(id);


--
-- TOC entry 5036 (class 2606 OID 16700)
-- Name: lab_tests lab_tests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_tests
    ADD CONSTRAINT lab_tests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id);


--
-- TOC entry 5037 (class 2606 OID 16705)
-- Name: medications medications_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id);


--
-- TOC entry 5038 (class 2606 OID 16710)
-- Name: medications medications_prescribed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_prescribed_by_fkey FOREIGN KEY (prescribed_by) REFERENCES public.users(id);


--
-- TOC entry 5039 (class 2606 OID 16715)
-- Name: transfers transfers_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id);


--
-- TOC entry 5040 (class 2606 OID 16720)
-- Name: transfers transfers_initiated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES public.users(id);


-- Completed on 2026-07-09 09:57:10

--
-- PostgreSQL database dump complete
--

\unrestrict IOGWQh7HLUARGqGBcAl72D4qPN59hMS1TMhuYert2QiuX0e2USvJKTCPkb1eUze

