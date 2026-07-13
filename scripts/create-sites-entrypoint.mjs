import { readFileSync, rmSync, writeFileSync } from "node:fs";

let html = readFileSync("dist/index.html", "utf8");

html = html.replace(
  /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/,
  (_match, href) => {
    const css = readFileSync(`dist${href}`, "utf8");
    return `<style>${css}</style>`;
  }
);

html = html.replace(
  /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/,
  (_match, src) => {
    const js = readFileSync(`dist${src}`, "utf8");
    return `<script type="module">${js}</script>`;
  }
);

writeFileSync(
  "dist/index.js",
  `const html = ${JSON.stringify(html)};

export default {
  async fetch() {
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  },
};
`
);

rmSync("dist/assets", { recursive: true, force: true });
rmSync("dist/index.html", { force: true });
