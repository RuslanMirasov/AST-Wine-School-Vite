import { InlineErrorRenderer } from './inlineErrorRenderer.js';
import { SummaryErrorRenderer } from './summaryErrorRenderer.js';

const renderers = new WeakMap();

export const getRenderer = form => {
  if (renderers.has(form)) return renderers.get(form);

  const summaryContainer = form.querySelector('[data-form-errors]');
  const renderer = summaryContainer ? new SummaryErrorRenderer(summaryContainer) : new InlineErrorRenderer();

  renderers.set(form, renderer);
  return renderer;
};
