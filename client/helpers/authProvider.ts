import {
  MsalAuthProvider,
  LoginType,
  IMsalAuthProviderConfig
} from "react-aad-msal";
import { Configuration, AuthenticationParameters } from "msal";

const config: Configuration = {
  auth: {
    authority: `https://login.microsoftonline.com/${process.env.AZUREAD_TENANTID}`,
    clientId: process.env.AZUREAD_CLIENTID
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true
  }
};

// Authentication Parameters
const authenticationParameters: AuthenticationParameters = {
  scopes: ["email", "profile"]
};

let authProvider: MsalAuthProvider;
if (process.browser) {
  // Options
  const options: IMsalAuthProviderConfig = {
    loginType: LoginType.Redirect,
    tokenRefreshUri: window.location.origin + "/auth.html"
  };
  authProvider = new MsalAuthProvider(
    config,
    authenticationParameters,
    options
  );
} else {
  authProvider = null;
}

export { authProvider };
