import pg from 'pg';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();
try {
  await client.query(`
    ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS reply_to_message_id TEXT,
      ADD COLUMN IF NOT EXISTS forwarded_from_message_id TEXT,
      ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS deleted_for_all BOOLEAN NOT NULL DEFAULT false;

    ALTER TABLE conversation_members
      ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;
  `);
  console.log('NEXA database migration complete');
} finally {
  await client.end();
}
