require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'supabase', 'migrations', '20240101000000_new-migration.sql'), 'utf-8');
  
  // Quick fix for malformed SQL if it exists
  const cleanSql = sql.replace(/^[ \t]*id[ \t]+UUID.*/gm, '').replace(/^[ \t]*patient_id[ \t]+UUID.*/gm, '');

  try {
    await pool.query(sql);
    console.log("SQL Migration Executed Successfully");
  } catch(e) {
    if (e.message.includes('syntax error')) {
        console.error("Syntax Error in SQL! Attempting manual creation of products...");
        await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name                 TEXT NOT NULL,
          brand                TEXT DEFAULT '',
          category             TEXT NOT NULL CHECK (category IN ('medicines','personal-care','health-devices','supplements','vitamins')),
          sub_category         TEXT DEFAULT '',
          description          TEXT DEFAULT '',
          usage                TEXT DEFAULT '',
          ingredients          TEXT DEFAULT '',
          warnings             TEXT DEFAULT '',
          side_effects         TEXT DEFAULT '',
          price                NUMERIC NOT NULL,
          discount_percent     NUMERIC DEFAULT 0,
          stock                INT DEFAULT 0,
          images               JSONB DEFAULT '[]',
          requires_prescription BOOLEAN DEFAULT FALSE,
          rating               NUMERIC DEFAULT 0,
          review_count         INT DEFAULT 0,
          tags                 JSONB DEFAULT '[]',
          is_active            BOOLEAN DEFAULT TRUE,
          created_at           TIMESTAMPTZ DEFAULT NOW(),
          updated_at           TIMESTAMPTZ DEFAULT NOW()
        );
        `);
        console.log("Products table created manually.");
    } else {
        console.error("Migration Error:", e);
    }
  } finally {
    pool.end();
  }
}

run();
