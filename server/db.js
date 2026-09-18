/**
 * MandiX Backend - Database Connection Pool
 * Uses mysql2/promise with connection pooling and graceful error handling.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mandix',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

export const pool = mysql.createPool(dbConfig);

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 + 1 AS result, DATABASE() as db');
    connection.release();
    return {
      connected: true,
      database: rows[0].db,
      message: 'Successfully connected to MySQL database: ' + rows[0].db
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      code: error.code,
      message: `MySQL connection failed (${error.code || error.message}). Please check credentials in server/.env`
    };
  }
}

export default pool;
