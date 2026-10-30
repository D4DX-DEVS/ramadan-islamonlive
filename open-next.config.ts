import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// All pages render per request from D1, so no incremental cache is needed.
export default defineCloudflareConfig({});
