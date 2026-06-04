import "./load-env.js";
import { serve } from "@hono/node-server";

import { backendConfig } from "./config.js";
import { createApp } from "./routes.js";

const app = createApp();

serve(
  {
    fetch: app.fetch,
    port: backendConfig.port,
  },
  () => {
    console.log(`abdimas-backend listening on ${backendConfig.appUrl}`);
  },
);
