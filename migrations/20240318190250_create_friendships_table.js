exports.up = function(knex) {
    return knex.schema.createTable('friendships', function(table) {
        table.string('profile_req').notNullable();
        table.string('profile_accept').notNullable();
        table.primary(['profile_req', 'profile_accept']);
        // Add any other columns as needed
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('friendships');
};
