-- Run this once in your Supabase SQL editor to create all tables

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS doctors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id      TEXT UNIQUE NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  title         TEXT DEFAULT '',
  designation   TEXT DEFAULT '',
  specialty     TEXT DEFAULT '',
  experience    INT DEFAULT 0,
  location      TEXT DEFAULT '',
  phone         TEXT DEFAULT '',
  bio           TEXT DEFAULT '',
  profile_image TEXT DEFAULT '',
  availability  JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id        TEXT UNIQUE NOT NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT DEFAULT '',
  dob             DATE,
  gender          TEXT DEFAULT 'Other' CHECK (gender IN ('Male','Female','Other')),
  profile_image   TEXT DEFAULT '',
  medical_history JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id           UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  time                TEXT NOT NULL,
  reason              TEXT DEFAULT '',
  status              TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Confirmed','Cancelled','Completed')),
  consultation_notes  TEXT DEFAULT '',
  diagnosis           TEXT DEFAULT '',
  prescription        JSONB DEFAULT '[]',
  consultation_fee    NUMERIC DEFAULT 0,
  fee_paid            BOOLEAN DEFAULT FALSE,
  consultation_type   TEXT DEFAULT 'video' CHECK (consultation_type IN ('video','audio','in-person')),
  consultation_ended  BOOLEAN DEFAULT FALSE,
  patient_age         INT,
  patient_gender      TEXT DEFAULT '',
  symptoms            TEXT DEFAULT '',
  medical_history     TEXT DEFAULT '',
  uploaded_reports    JSONB DEFAULT '[]',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medicine_cart (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id     UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  medicine       TEXT NOT NULL,
  dosage         TEXT DEFAULT '',
  duration       TEXT DEFAULT '',
  notes          TEXT DEFAULT '',
  quantity       INT DEFAULT 1,
  in_stock       BOOLEAN DEFAULT TRUE,
  alternative    TEXT DEFAULT '',
  ordered        BOOLEAN DEFAULT FALSE,
  doctor_name    TEXT DEFAULT '',
  diagnosis      TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
