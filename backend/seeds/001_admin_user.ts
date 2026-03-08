import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function seed(knex: Knex): Promise<void> {
  // Check if admin already exists
  const existing = await knex('users').where({ username: 'admin' }).first();

  if (existing) {
    console.log('Admin user already exists, skipping seed.');
    return;
  }

  const password = process.env.ADMIN_PASSWORD || 'changeme';
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await knex('users').insert({
    username: 'admin',
    password_hash: passwordHash,
    role: 'admin',
  });

  console.log('Admin user created successfully.');
  if (password === 'changeme') {
    console.warn(
      'WARNING: Using default password "changeme". Set ADMIN_PASSWORD env var for production.'
    );
  }
}
