# Alpen Gold Website

Статический сайт на связке Eleventy + Vite.

Eleventy собирает HTML-страницы и копирует статические файлы. Vite собирает SCSS в CSS.

## Основные команды

Установка зависимостей:

```bash
npm install
```

Запуск разработки с локальным сервером и автообновлением:

```bash
npm run dev
```

Финальная сборка с очисткой `dist`:

```bash
npm run build
```

## Как работает dev

Команда `npm run dev` запускает два процесса параллельно:

```bash
npm run dev:html
npm run dev:css
```

`dev:html` запускает Eleventy dev server:

```bash
eleventy --serve
```

`dev:css` запускает Vite в режиме наблюдения:

```bash
vite build --watch
```

При сохранении HTML, SCSS, JS или файлов из статических папок сборка обновляется.

## Как работает build

Команда `npm run build` выполняет шаги последовательно:

```bash
npm run clean
npm run build:html
npm run build:css
```

`clean` удаляет старую папку `dist`.

`build:html` собирает HTML через Eleventy и копирует статические файлы.

`build:css` собирает SCSS через Vite.

## Структура проекта

```text
src/
  index.html
  scss/
    main.scss
  js/
  img/
  fonts/
  libs/
  _includes/
  _layouts/

dist/
```

HTML-страницы лежат в `src` и после сборки попадают в корень `dist` с теми же именами:

```text
src/index.html -> dist/index.html
src/product-alpengold-1.html -> dist/product-alpengold-1.html
```

Статические папки копируются так:

```text
src/img -> dist/img
src/fonts -> dist/fonts
src/libs -> dist/libs
src/js -> dist/js
```

SCSS собирается так:

```text
src/scss/main.scss -> dist/css/main.min.css
```

## Как добавлять страницы

Новые страницы добавляются прямо в `src`:

```text
src/picnic.html
src/product-alpengold-1.html
src/product-alpengold-2.html
```

После сборки они появятся в корне `dist`:

```text
dist/picnic.html
dist/product-alpengold-1.html
dist/product-alpengold-2.html
```

## Подключения в HTML

Текущие пути в HTML рассчитаны на такую структуру билда:

```html
<link rel="stylesheet" href="css/main.min.css" />
<script src="js/geolocation.js"></script>
<script src="libs/jquery-3.5.1.min.js"></script>
<script src="libs/owl/owl.carousel.min.js"></script>
<script src="js/common.js"></script>
```

Картинки подключаются из `img`:

```html
<img src="img/main/logo.webp" alt="" />
```

## Важные файлы

`.eleventy.js` - настройка Eleventy: вход `src`, выход `dist`, сохранение HTML-страниц в корне и копирование статических папок.

`vite.config.js` - настройка Vite: сборка `src/scss/main.scss` в `dist/css/main.min.css`.

`src/scss/main.scss` - главная точка входа для стилей.
