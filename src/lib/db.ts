import mysql, { Pool, PoolOptions } from "mysql2/promise";

declare global {
    // eslint-disable-next-line no-var
    var mysqlPool: Pool | undefined;
}

const poolConfig: PoolOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 1,
    maxIdle: 1,
    idleTimeout: 60_000,
    queueLimit: 0,
    connectTimeout: 20_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
};

function createPool(): Pool {
    return mysql.createPool(poolConfig);
}

const pool = globalThis.mysqlPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
    globalThis.mysqlPool = pool;
}

export default pool;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T>(sql: string, params?: any[]): Promise<T[]> {
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
}
