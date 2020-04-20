import * as Knex from "knex";

export async function createUserSSOTable(knex: Knex) {
  const hasTable = await knex.schema.hasTable("user_ssos");
  if (!hasTable) {
    await knex.schema.createTable("user_ssos", (table) => {
      table.increments("id").primary();
      table.string("provider").notNullable();
      table.string("object_id").notNullable();
      table.string("access_token");
      table.string("refresh_token");
      table
        .integer("user_id")
        .references("id")
        .inTable("users")
        .onDelete("CASCADE")
        .unique();
      table.timestamps(false, true);
    });
  }
}
