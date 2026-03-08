import knex, { Knex } from 'knex';
import { env } from './env';

const knexConfig: Knex.Config = {
  client: 'pg',
  connection: env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: '../migrations',
    extension: 'sql',
  },
  seeds: {
    directory: '../seeds',
  },
};

export const db = knex(knexConfig);
export default knexConfig;
