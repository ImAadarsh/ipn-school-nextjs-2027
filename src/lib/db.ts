import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 20000,
});

export default pool;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T>(sql: string, params?: any[]): Promise<T[]> {
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
}
