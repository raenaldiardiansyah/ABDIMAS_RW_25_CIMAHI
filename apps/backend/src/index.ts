import { serve } from "@hono/node-server";

import { backendConfig } from "./config";
import { createApp } from "./routes";

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
