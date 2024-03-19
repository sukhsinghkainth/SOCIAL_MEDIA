exports.up = function(knex) {
    return knex.schema.createTable('post_comments', function(table) {
        table.increments('post_comment_id').primary();
        table.string('text_content').notNullable();
        table.timestamp('timestamp').defaultTo(knex.fn.now());
        table.string('username').notNullable();
        table.foreign('username').references('username').inTable('user_profiles');
        // Add any other columns as needed
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('post_comments');
};
