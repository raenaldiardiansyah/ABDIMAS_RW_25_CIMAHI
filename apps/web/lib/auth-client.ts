import { createAuthClient } from "better-auth/client";
import { inferAdditionalFields, usernameClient } from "better-auth/client/plugins";

function getAuthBaseUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth`;
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000";

  return `${appUrl.replace(/\/$/, "")}/api/auth`;
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  plugins: [
    usernameClient(),
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: false,
          returned: true,
        },
      },
    }),
  ],
});
