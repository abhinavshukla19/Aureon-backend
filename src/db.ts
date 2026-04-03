import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL must be set in environment variables");
}

const database = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

database.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err.message);
});

database.connect()
  .then(client => {
    console.log('✅ Database connected successfully');
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

export default database;