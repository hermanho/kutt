import { Strategy as LocalAPIKeyStrategy } from "passport-localapikey-update";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as LocalStratergy } from "passport-local";
import {
  OIDCStrategy,
  IProfile,
  IBearerStrategyOptionWithRequest,
  BearerStrategy,
  ITokenPayload,
  VerifyCallback
} from "passport-azure-ad";
import passport from "passport";
import bcrypt from "bcryptjs";

import query from "./queries";
import env from "./env";

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader("authorization"),
  secretOrKey: env.JWT_SECRET
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await query.user.find({ email: payload.sub });
      if (!user) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

const localOptions = {
  usernameField: "email"
};

passport.use(
  new LocalStratergy(localOptions, async (email, password, done) => {
    try {
      const user = await query.user.find({ email });
      if (!user) {
        return done(null, false);
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false);
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

const localAPIKeyOptions = {
  apiKeyField: "apikey",
  apiKeyHeader: "x-api-key"
};

passport.use(
  new LocalAPIKeyStrategy(localAPIKeyOptions, async (apikey, done) => {
    try {
      const user = await query.user.find({ apikey });
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

if (env.AZUREAD_CLIENTID && env.AZUREAD_CLIENTSECRET) {
  passport.use(
    new OIDCStrategy(
      {
        identityMetadata:
          "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
        clientID: env.AZUREAD_CLIENTID,
        responseType: "id_token",
        responseMode: "form_post",
        redirectUrl: `http://${env.DEFAULT_DOMAIN}/auth/openid/return-azuread`,
        allowHttpForRedirectUrl: true,
        clientSecret: env.AZUREAD_CLIENTSECRET,
        scope: ["email", "profile"],
        useCookieInsteadOfSession: true,
        cookieSameSite: process.env.NODE_ENV === "production",
        cookieEncryptionKeys: [
          { key: env.AZUREAD_COOKIE_EN_KEY, iv: env.AZUREAD_COOKIE_EN_IV }
        ],
        passReqToCallback: false
      },
      function (
        iss: string,
        sub: string,
        profile: IProfile,
        access_token: string,
        refresh_token: string,
        done: VerifyCallback
      ) {
        if (!profile.oid) {
          return done(new Error("No oid found"), null);
        }
        // asynchronous verification, for effect...
        process.nextTick(function () {
          Promise.resolve()
            .then(async () => {
              const user_sso = await query.user_sso.find({
                provider: "azuread-openidconnect",
                object_id: profile.oid
              });
              let user = await query.user.find({ email: profile._json.email });
              if (user && user_sso) {
                return done(null, user);
              }
              if (!user) {
                user = await query.user.add({
                  email: profile._json.email,
                  password: "-"
                });
                [user] = await query.user.update(
                  {
                    email: profile._json.email
                  },
                  { verified: true }
                );
              }
              if (!user_sso) {
                await query.user_sso.add({
                  provider: "azuread-openidconnect",
                  object_id: profile.oid,
                  access_token,
                  refresh_token
                });
              }
              return done(null, user);
            })
            .catch((err) => {
              return done(err);
            });
        });
      }
    )
  );
  // passport.use(
  //   new BearerStrategy(
  //     {
  //       identityMetadata: `https://login.microsoftonline.com/${env.AZUREAD_TENANTID}/v2.0/.well-known/openid-configuration`,
  //       clientID: env.AZUREAD_CLIENTID,
  //       loggingLevel: env.NODE_ENV === "production" ? "error" : "info",
  //       passReqToCallback: true
  //     },
  //     function (req, token: ITokenPayload, done: VerifyCallback) {
  //       if (!token.oid) {
  //         return done(new Error("No oid found"), null);
  //       }
  //       // asynchronous verification, for effect...
  //       process.nextTick(function () {
  //         Promise.resolve()
  //           .then(async () => {
  //             const user_sso = await query.user_sso.find({
  //               provider: "azuread-openidconnect",
  //               object_id: token.oid
  //             });
  //             let user = await query.user.find({ email: token.upn });
  //             if (user && user_sso) {
  //               return done(null, user);
  //             }
  //             if (!user) {
  //               user = await query.user.add({
  //                 email: token.upn,
  //                 password: "-"
  //               });
  //               [user] = await query.user.update(
  //                 {
  //                   email: token.upn
  //                 },
  //                 { verified: true }
  //               );
  //             }
  //             if (!user_sso) {
  //               await query.user_sso.add({
  //                 provider: "azuread-openidconnect",
  //                 object_id: token.oid,
  //                 access_token: req.query.access_token.toString(),
  //                 refresh_token: null
  //               });
  //             }
  //             return done(null, user);
  //           })
  //           .catch((err) => {
  //             return done(err);
  //           });
  //       });
  //     }
  //   )
  // );
}
