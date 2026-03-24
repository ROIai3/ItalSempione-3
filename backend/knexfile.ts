import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const config: Record<string, Knex.Config> = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './migrations',
      extension: 'sql',
    },
    seeds: {
      directory: './seeds',
    },
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      directory: './migrations',
      extension: 'sql',
    },
    seeds: {
      directory: './seeds',
    },
  },
};

export default config;
