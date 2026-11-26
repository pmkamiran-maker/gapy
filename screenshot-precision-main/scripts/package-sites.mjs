import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const output = "dist";
const server = join(output, "server");
const mime = {
  ".css": "text/css; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

await rm(output, { recursive: true, force: true });
await mkdir(join(output, ".openai"), { recursive: true });
await cp(".openai/hosting.json", join(output, ".openai", "hosting.json"));
await cp(".output/server", server, { recursive: true });

const publicRoot = ".output/public";
const assets = {};
for (const file of await readdir(publicRoot, {
  recursive: true,
  withFileTypes: true,
})) {
  if (!file.isFile()) continue;
  const type = mime[extname(file.name)];
  if (!type) continue;
  const path = join(file.parentPath, file.name);
  assets["/" + path.slice(publicRoot.length + 1)] = [
    type,
    (await readFile(path)).toString("base64"),
  ];
}
await writeFile(
  join(server, "site-assets.mjs"),
  `export default ${JSON.stringify(assets)};\n`,
);
await writeFile(
  join(server, "index.js"),
  `import worker from "./index.mjs";
import files from "./site-assets.mjs";

export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    if ((request.method === "GET" || request.method === "HEAD") && Object.hasOwn(files, url.pathname)) {
      const [type, data] = files[url.pathname];
      const headers = { "Content-Type": type };
      if (url.pathname.startsWith("/assets/")) headers["Cache-Control"] = "public, max-age=31536000, immutable";
      return new Response(request.method === "HEAD" ? null : Uint8Array.from(atob(data), (char) => char.charCodeAt(0)), { headers });
    }
    return worker.fetch(request, env, ctx);
  },
};
`,
);
const wranglerPath = join(server, "wrangler.json");
const wrangler = JSON.parse(await readFile(wranglerPath, "utf8"));
delete wrangler.assets;
wrangler.main = "index.js";
await writeFile(wranglerPath, JSON.stringify(wrangler, null, 2) + "\n");
