exports.up = function(knex) {
    return knex.schema.createTable('post_likes', function(table) {
        table.increments('post_like_id').primary();
        table.timestamp('timestamp').defaultTo(knex.fn.now());
        table.integer('post_id').unsigned().notNullable();
        table.string('username').notNullable();
        table.foreign('post_id').references('post_id').inTable('user_posts').onDelete('CASCADE').onUpdate('CASCADE');
        table.foreign('username').references('username').inTable('user_profiles');
        // Add any other columns as needed
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('post_likes');
};
