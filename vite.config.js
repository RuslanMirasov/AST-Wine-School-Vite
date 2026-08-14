import { defineConfig } from 'vite';
import { relative, resolve } from 'node:path';

const srcDir = resolve(__dirname, 'src');

function normalizePath(path) {
    return path.replace(/\\/g, '/');
}

function getOriginalAssetPath(assetInfo) {
    const originalFileName = assetInfo.originalFileNames?.[0];

    if (!originalFileName) {
        return null;
    }

    return normalizePath(relative(srcDir, originalFileName));
}

export default defineConfig({
    base: './',
    plugins: [
        {
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
        outDir: 'dist',
        emptyOutDir: false,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/scss/main.scss'),
            },
            output: {
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === 'main.css') {
                        return 'css/main.min.css';
                    }

                    const originalPath = getOriginalAssetPath(assetInfo);

                    if (originalPath?.startsWith('img/')) {
                        return originalPath;
                    }

                    if (originalPath?.startsWith('fonts/')) {
                        return originalPath;
                    }

                    return originalPath ?? '[name][extname]';
                },
            },
        },
    },
});
