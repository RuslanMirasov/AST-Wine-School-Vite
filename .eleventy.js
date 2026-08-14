const fs = require('node:fs');
const path = require('node:path');

const rootTemplateExtensions = new Set(['.html', '.njk']);
const rootSourceFiles = fs
    .readdirSync('src', { withFileTypes: true })
    .filter(item => item.isFile())
    .filter(item => !rootTemplateExtensions.has(path.extname(item.name)))
    .map(item => item.name);

module.exports = function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy({ 'src/img': 'img' });
    eleventyConfig.addPassthroughCopy({ 'src/fonts': 'fonts' });
    eleventyConfig.addPassthroughCopy({ 'src/libs': 'libs' });
    eleventyConfig.addPassthroughCopy({ 'src/js': 'js' });
    eleventyConfig.addWatchTarget('./src/scss/');
    eleventyConfig.addWatchTarget('./dist/css/main.min.css');

    for (const fileName of rootSourceFiles) {
        eleventyConfig.addPassthroughCopy({ [`src/${fileName}`]: fileName });
    }

    eleventyConfig.addGlobalData('permalink', '{{ page.filePathStem }}.html');

    return {
        dir: {
            input: 'src',
            output: 'dist',
            includes: '_includes',
            layouts: '_layouts',
        },
        templateFormats: ['html', 'njk'],
        htmlTemplateEngine: 'njk',
        markdownTemplateEngine: 'njk',
    };
};
