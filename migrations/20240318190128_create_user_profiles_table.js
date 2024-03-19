exports.up = function(knex) {
    return knex.schema.createTable('user_profiles', function(table) {
        table.string('username').primary();
        table.string('firstname').notNullable();
        table.string('lastname').notNullable();
        table.date('dob').notNullable();
        table.string('email').notNullable().unique();
        table.string('password').notNullable();
        // Add any other columns as needed
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('user_profiles');
};
