import { Knex } from 'knex';
import fs from 'fs';
import path from 'path';

export async function up(knex: Knex): Promise<void> {
  const sqlPath = path.join(__dirname, '001_initial_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await knex.raw(sql);
}

export async function down(knex: Knex): Promise<void> {
  // Not implemented for initial schema
}
