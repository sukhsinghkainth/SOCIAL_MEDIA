exports.up = function(knex) {
    return knex.schema.createTable('user_post_images', function(table) {
        table.integer('post_id').unsigned().notNullable().references('post_id').inTable('user_posts');
        table.string('image_url').notNullable();
        // Add any other columns as needed
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('user_post_images');
};
