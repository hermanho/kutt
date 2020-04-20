import env from "./env";

import asyncHandler from "express-async-handler";
import cookieParser from "cookie-parser";
import passport from "passport";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import nextApp from "next";
import Raven from "raven";

import * as helpers from "./handlers/helpers";
import * as links from "./handlers/links";
import * as auth from "./handlers/auth";
import __v1Routes from "./__v1";
import routes from "./routes";
import * as utils from "./utils";

import "./cron";
import "./passport";

if (env.RAVEN_DSN) {
  Raven.config(env.RAVEN_DSN).install();
}

const port = env.PORT;
const app = nextApp({
  dir: "./client",
  dev: process.env.NODE_ENV === "development"
});
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = express();
  server.set("trust proxy", true);

  if (process.env.NODE_ENV === "development") {
    server.use(morgan("dev"));
  }

  server.use(helmet());
  server.use(cookieParser());
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));
  server.use(passport.initialize());
  server.use(express.static("static"));
  server.use(helpers.ip);

  server.use(asyncHandler(links.redirectCustomDomain));

  server.use("/api/v2", routes);
  server.use("/api", __v1Routes);

  server.get(
    "/reset-password/:resetPasswordToken?",
    asyncHandler(auth.resetPassword),
    (req, res) => app.render(req, res, "/reset-password", { token: req.token })
  );

  server.get(
    "/verify/:verificationToken?",
    asyncHandler(auth.verify),
    (req, res) => app.render(req, res, "/verify", { token: req.token })
  );

  server.get("/:id", asyncHandler(links.redirect(app)));

  // Error handler
  server.use(helpers.error);

  // Handler everything else by Next.js
  server.get("*", (req, res) => handle(req, res));

  const httpServer = server.listen(port);

  httpServer.on("error", function onError(error: NodeJS.ErrnoException) {
    if (error.syscall !== "listen") {
      throw error;
    }
    const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
      // default:
      //   throw error;
    }
  });
  httpServer.on("listening", function onListening() {
    const addr = httpServer.address();
    const bind =
      typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    console.log("> Listening on " + bind);
    console.log(`> Ready on http://localhost:${port}`);
  });
});
