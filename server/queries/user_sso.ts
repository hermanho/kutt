import * as redis from "../redis";
import knex from "../knex";

export const find = async (match: Partial<UserSSO>) => {
  if (match.object_id) {
    const key = redis.key.user_sso(match.object_id);
    const cachedUserSSO = await redis.get(key);
    if (cachedUserSSO) return JSON.parse(cachedUserSSO) as User;
  }

  const user_sso = await knex<UserSSO>("user_ssos").where(match).first();

  if (user_sso) {
    const userSSOKey = redis.key.user_sso(user_sso.object_id);
    redis.set(userSSOKey, JSON.stringify(user_sso), "EX", 60 * 60 * 1);
  }

  return user_sso;
};

interface Add {
  provider: string;
  object_id: string;
  access_token: string;
  refresh_token: string;
}

export const add = async (params: Add, user_sso?: UserSSO) => {
  const data = {
    provider: params.provider,
    object_id: params.object_id,
    access_token: params.access_token,
    refresh_token: params.refresh_token
  };

  if (user_sso) {
    await knex<UserSSO>("user_ssos")
      .where("id", user_sso.id)
      .update({ ...data, updated_at: new Date().toISOString() });
  } else {
    await knex<UserSSO>("user_ssos").insert(data);
  }

  redis.remove.user_sso(user_sso);

  return {
    ...user_sso,
    ...data
  };
};

export const update = async (
  match: Match<UserSSO>,
  update: Partial<UserSSO>
) => {
  const query = knex<UserSSO>("user_ssos");

  Object.entries(match).forEach(([key, value]) => {
    query.andWhere(key, ...(Array.isArray(value) ? value : [value]));
  });

  const users = await query.update(
    { ...update, updated_at: new Date().toISOString() },
    "*"
  );

  users.forEach(redis.remove.user_sso);

  return users;
};

export const remove = async (user_sso: UserSSO) => {
  const deletedUser = await knex<UserSSO>("user_ssos")
    .where("id", user_sso.id)
    .delete();

  redis.remove.user_sso(user_sso);

  return !!deletedUser;
};
