import { cleanEnv, num, str, bool } from "envalid";
import * as path from "path";
import * as fs from "fs";
const appDirectory = fs.realpathSync(process.cwd());
const path_dotenv = path.resolve(appDirectory, ".env");
const NODE_ENV = process.env.NODE_ENV;
const dotenvFiles = [
  `${path_dotenv}.${NODE_ENV}.local`,
  `${path_dotenv}.${NODE_ENV}`,
  // Don't include `.env.local` for `test` environment
  // since normally you expect tests to produce the same
  // results for everyone
  NODE_ENV !== "test" && `${path_dotenv}.local`,
  path_dotenv
].filter(Boolean);

// Load environment variables from .env* files. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.  Variable expansion is supported in .env files.
// https://github.com/motdotla/dotenv
// https://github.com/motdotla/dotenv-expand
dotenvFiles.forEach((dotenvFile) => {
  if (fs.existsSync(dotenvFile)) {
    require("dotenv-expand")(
      require("dotenv").config({
        path: dotenvFile
      })
    );
  }
});

const env = cleanEnv(process.env, {
  PORT: num({ default: 3000 }),
  SITE_NAME: str({ example: "Kutt" }),
  DEFAULT_DOMAIN: str({ example: "kutt.it" }),
  LINK_LENGTH: num({ default: 6 }),
  DB_HOST: str({ default: "localhost" }),
  DB_PORT: num({ default: 5432 }),
  DB_NAME: str({ default: "postgres" }),
  DB_USER: str(),
  DB_PASSWORD: str(),
  DB_SSL: bool({ default: false }),
  DB_POOL_MIN: num({ default: 2 }),
  DB_POOL_MAX: num({ default: 10 }),
  NEO4J_DB_URI: str({ default: "" }),
  NEO4J_DB_USERNAME: str({ default: "" }),
  NEO4J_DB_PASSWORD: str({ default: "" }),
  REDIS_HOST: str({ default: "127.0.0.1" }),
  REDIS_PORT: num({ default: 6379 }),
  REDIS_PASSWORD: str({ default: "" }),
  USER_LIMIT_PER_DAY: num({ default: 50 }),
  NON_USER_COOLDOWN: num({ default: 10 }),
  DEFAULT_MAX_STATS_PER_LINK: num({ default: 5000 }),
  CUSTOM_DOMAIN_USE_HTTPS: bool({ default: false }),
  JWT_SECRET: str(),
  ADMIN_EMAILS: str({ default: "" }),
  RECAPTCHA_SITE_KEY: str(),
  RECAPTCHA_SECRET_KEY: str(),
  GOOGLE_SAFE_BROWSING_KEY: str({ default: "" }),
  GOOGLE_ANALYTICS: str({ default: "" }),
  GOOGLE_ANALYTICS_UNIVERSAL: str({ default: "" }),
  MAIL_HOST: str(),
  MAIL_PORT: num(),
  MAIL_SECURE: bool({ default: false }),
  MAIL_USER: str(),
  MAIL_FROM: str({ default: "", example: "Kutt <support@kutt.it>" }),
  MAIL_PASSWORD: str(),
  REPORT_EMAIL: str({ default: "" }),
  CONTACT_EMAIL: str({ default: "" }),
  RAVEN_DSN: str({ default: "" }),
  AZUREAD_CLIENTID: str(),
  AZUREAD_CLIENTSECRET: str(),
  AZUREAD_COOKIE_EN_KEY: str(),
  AZUREAD_COOKIE_EN_IV: str(),
  AZUREAD_TENANTID: str()
});

export default env;
