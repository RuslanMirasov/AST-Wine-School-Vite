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

const hmrClientId = 'virtual:scss-hmr-client';
const resolvedHmrClientId = '\0' + hmrClientId;
const hmrClientUrl = '/@id/__x00__' + hmrClientId;

function scssDevPlugin() {
  return {
    name: 'compile-scss-dev',
    apply: 'serve',
    resolveId(id) {
      if (id === hmrClientId) return resolvedHmrClientId;
    },
    load(id) {
      if (id !== resolvedHmrClientId) return;

      return `
        if (import.meta.hot) {
          import.meta.hot.on('scss-update', () => {
            document.querySelectorAll('#app-styles').forEach(link => {
              const next = link.cloneNode();
              next.href = link.href.split('?')[0] + '?t=' + Date.now();
              next.onload = () => link.remove();
              link.parentNode.insertBefore(next, link.nextSibling);
            });
          });
        }
      `;
    },
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
      return html.replace('</body>', `<script type="module" src="${hmrClientUrl}"></script>\n</body>`);
    },
  };
}

function rootPrefix(path) {
  const depth = path.split('/').filter(Boolean).length - 1;
  return depth <= 0 ? './' : '../'.repeat(depth);
}

function rootTokenPlugin() {
  return {
    name: 'expand-root-token',
    transformIndexHtml(html, ctx) {
      return html.replaceAll('%ROOT%', rootPrefix(ctx.path));
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
  base: '',
  appType: 'mpa',
  publicDir: '_public',
  plugins: [injectHTML(), rootTokenPlugin(), scssDevPlugin(), scssBuildPlugin()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: glob.sync('src/**/*.html', { ignore: 'src/_partials/**' }),
    },
  },
});
