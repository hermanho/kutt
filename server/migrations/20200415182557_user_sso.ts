import * as Knex from "knex";
import * as models from "../models";

export async function up(knex: Knex): Promise<any> {
  await models.createUserSSOTable(knex);
}

export async function down(knex: Knex): Promise<any> {
  // do nothing
}
