// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  client: 'oracledb',
  connection: {
    user: 'manvir',
    password: '123',
    connectString: 'localhost/XE'
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations'
  }
};
