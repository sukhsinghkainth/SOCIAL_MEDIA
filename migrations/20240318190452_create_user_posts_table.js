exports.up = function(knex) {
    return knex.schema.createTable('user_posts', function(table) {
        table.increments('post_id').primary();
        table.timestamp('timestamp').defaultTo(knex.fn.now());
        table.string('content_description').notNullable();
        table.string('username').notNullable().references('username').inTable('user_profiles');
        // Add any other columns as needed
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('user_posts');
};
