import { createPool } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

console.log(process.env.DB_HOST)
export const database = createPool({
  host: process.env.DB_HOST!,
  user: process.env.DB_USERNAME!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_DATABASE!,
  port: Number(process.env.DB_PORT!),
  waitForConnections: true,
  connectionLimit: 10,
});

