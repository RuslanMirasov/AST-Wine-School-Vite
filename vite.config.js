import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { glob } from 'glob';
import injectHTML from 'vite-plugin-html-inject';
import * as sass from 'sass';

const scssEntry = resolve(__dirname, 'src/_public/assets/scss/styles.scss');
const scssDir = dirname(scssEntry);

function compileStyles(style) {
  return sass.compile(scssEntry, { style }).css;
}

// styles.scss lives under src/_public/assets, so Vite treats it as a plain
// static file and won't compile it. These two plugins take over that job:
// in dev, compile on request and hot-swap the <link> on scss changes (no
// full reload); at build time, write both a minified (linked) and an
// expanded (unlinked, kept for reference) output.
function scssDevPlugin() {
  return {
    name: 'compile-scss-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];

        if (url === '/assets/css/styles.min.css' || url === '/assets/css/styles.css') {
          res.setHeader('Content-Type', 'text/css');
          res.end(compileStyles(url.endsWith('.min.css') ? 'compressed' : 'expanded'));
          return;
        }

        next();
      });

      server.watcher.add(scssDir);
      server.watcher.on('change', file => {
        if (file.startsWith(scssDir)) {
          server.ws.send({ type: 'custom', event: 'scss-update' });
        }
      });
    },
    transformIndexHtml(html) {
      return html.replace('</body>', '<script type="module" src="/_dev-scss-hmr-client.js"></script>\n</body>');
    },
  };
}

function scssBuildPlugin() {
  return {
    name: 'compile-scss-build',
    apply: 'build',
    writeBundle() {
      const outDir = resolve(__dirname, 'dist/assets/css');
      mkdirSync(outDir, { recursive: true });
      writeFileSync(resolve(outDir, 'styles.min.css'), compileStyles('compressed'));
      writeFileSync(resolve(outDir, 'styles.css'), compileStyles('expanded'));
    },
  };
}

export default defineConfig({
  root: 'src',
  base: '/',
  appType: 'mpa',
  publicDir: '_public',
  plugins: [injectHTML(), scssDevPlugin(), scssBuildPlugin()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: glob.sync('src/**/*.html', { ignore: 'src/_partials/**' }),
    },
  },
});
