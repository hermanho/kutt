const webpack = require("webpack");
const path = require("path");
const fs = require("fs");

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
    console.log(`Loading ${dotenvFile}`);
    require("dotenv-expand")(
      require("dotenv").config({
        path: dotenvFile
      })
    );
  }
});

module.exports = {
  webpack(config, { dev }) {
    config.plugins.push(new webpack.EnvironmentPlugin(process.env));

    return config;
  }
};
