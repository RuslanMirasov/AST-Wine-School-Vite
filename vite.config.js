import { defineConfig } from 'vite';
import { glob } from 'glob';
import injectHTML from 'vite-plugin-html-inject';

export default defineConfig({
  root: 'src',
  base: '/',
  appType: 'mpa',
  plugins: [
    injectHTML(),
    {
      // A CSS-only entry (styles.scss) still produces an empty JS chunk;
      // drop it so dist doesn't ship an unused .js file next to styles.min.css.
      name: 'remove-empty-css-entry',
      generateBundle(_, bundle) {
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (chunk.type === 'chunk' && chunk.code.trim() === '') {
            delete bundle[fileName];
          }
        }
      },
    },
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: glob.sync('src/**/*.html', { ignore: 'src/partials/**' }),
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'styles.css') {
            return 'assets/css/styles.min.css';
          }

          return 'assets/[name][extname]';
        },
      },
    },
  },
});
