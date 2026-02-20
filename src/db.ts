import dotenv from 'dotenv'
dotenv.config()
import { Pool } from 'pg';

const database = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});


 export default database;