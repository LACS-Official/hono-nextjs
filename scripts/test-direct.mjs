import pkg from 'pg';
const { Client } = pkg;
import { config } from 'dotenv';
config({ path: '.env.local' });

async function test() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected!');
    const res = await client.query('SELECT NOW()');
    console.log(res.rows[0]);
    await client.end();
  } catch (e) {
    console.error('Failed:', e);
  }
}

test();
