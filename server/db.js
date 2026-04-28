import pg from "pg";

const { Pool } = pg;

let pool;

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  return url;
}

export function getPool() {
  if (pool) return pool;
  pool = new Pool({ connectionString: getDatabaseUrl() });
  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}
