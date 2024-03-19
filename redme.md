first install oracle@4.2.0 if you have oracle 11g then install express and ejs 

make folder structure 
config
controller
models
public
routes
views

## 2 initializ knex 
```
npx knex init
```

update knexfile.js
```js
// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  client: 'oracledb',
  connection: {
    user: 'manvir',
    password: 'manvir',
    connectString: 'localhost/XE'
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations'
  }
};

```



then npx migrate:make create_user_table

## create all your tables just by adding all your tables names here 


here you can se a migration file 

edit the migration file 

```js
exports.up = function(knex) {
    return knex.schema.createTable('users', function(table) {
        table.increments('id').primary();
        table.string('username').notNullable().unique();
        table.string('email').notNullable().unique();
        table.string('password').notNullable();
        table.timestamps(true, true);
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('users');
};

```

### run the migration

npx knex migrate : latest