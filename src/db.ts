import dotenv from "dotenv";
import { Pool } from 'pg';

dotenv.config(); 

const database = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});



 export default database;