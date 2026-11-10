import { debounce } from './helpers.js';

const CONTAINER_SELECTOR = '.history';
const STOP_SELECTOR = '.line-stop';
const INDICATOR_SELECTOR = '.indicator';
const SVG_NS = 'http://www.w3.org/2000/svg';
const CORNER_RADIUS = 50;
const ALIGN_TOLERANCE = 1;
const READING_LINE = 0.5;
const RESIZE_DELAY = 150;

const getStopCenter = (stop, containerRect) => {
  const rect = stop.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2 - containerRect.left,
    y: rect.top + rect.height / 2 - containerRect.top,
    isSide: !stop.classList[1]?.startsWith('bottom'),
  };
};

const createLine = (from, to) => ({
  type: 'line',
  from,
  to,
  length: Math.hypot(to.x - from.x, to.y - from.y),
});

const createElbow = (from, corner, to) => {
  const dx1 = Math.sign(corner.x - from.x);
  const dy1 = Math.sign(corner.y - from.y);
  const dx2 = Math.sign(to.x - corner.x);
  const dy2 = Math.sign(to.y - corner.y);

  const r = Math.min(CORNER_RADIUS, Math.abs(corner.x - from.x) + Math.abs(corner.y - from.y), Math.abs(to.x - corner.x) + Math.abs(to.y - corner.y));
  const clockwise = dx1 * dy2 - dy1 * dx2 > 0;

  const arcStart = { x: corner.x - dx1 * r, y: corner.y - dy1 * r };
  const arcEnd = { x: corner.x + dx2 * r, y: corner.y + dy2 * r };
  const center = { x: corner.x - dx1 * r + dx2 * r, y: corner.y - dy1 * r + dy2 * r };

  return [
    createLine(from, arcStart),
    {
      type: 'arc',
      from: arcStart,
      to: arcEnd,
      center,
      r,
      clockwise,
      startAngle: Math.atan2(arcStart.y - center.y, arcStart.x - center.x),
      angle: clockwise ? Math.PI / 2 : -Math.PI / 2,
      length: (Math.PI / 2) * r,
    },
    createLine(arcEnd, to),
  ];
};

const buildGeometry = points => {
  const segments = [];

  points.slice(1).reduce((from, to) => {
    const isStraight = Math.abs(from.x - to.x) < ALIGN_TOLERANCE || Math.abs(from.y - to.y) < ALIGN_TOLERANCE;

    if (isStraight) {
      segments.push(createLine(from, to));
    } else {
      const corner = from.isSide ? { x: from.x, y: to.y } : { x: to.x, y: from.y };
      segments.push(...createElbow(from, corner, to));
    }

    return to;
  }, points[0]);

  const d = [`M ${points[0].x} ${points[0].y}`]
    .concat(
      segments.map(segment =>
        segment.type === 'arc'
          ? `A ${segment.r} ${segment.r} 0 0 ${segment.clockwise ? 1 : 0} ${segment.to.x} ${segment.to.y}`
          : `L ${segment.to.x} ${segment.to.y}`
      )
    )
    .join(' ');

  return { d, segments, totalLength: segments.reduce((sum, segment) => sum + segment.length, 0) };
};

const getPointAtLength = (segments, length) => {
  let rest = length;

  for (const segment of segments) {
    if (rest <= segment.length || segment === segments[segments.length - 1]) {
      const t = segment.length ? Math.min(rest / segment.length, 1) : 0;

      if (segment.type === 'arc') {
        const angle = segment.startAngle + segment.angle * t;
        return { x: segment.center.x + segment.r * Math.cos(angle), y: segment.center.y + segment.r * Math.sin(angle) };
      }

      return { x: segment.from.x + (segment.to.x - segment.from.x) * t, y: segment.from.y + (segment.to.y - segment.from.y) * t };
    }

    rest -= segment.length;
  }

  return { x: 0, y: 0 };
};

const createSvg = container => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const path = document.createElementNS(SVG_NS, 'path');
  const progressPath = document.createElementNS(SVG_NS, 'path');

  svg.classList.add('history__line');
  svg.setAttribute('aria-hidden', 'true');
  progressPath.classList.add('history__line-progress');
  svg.append(path, progressPath);

  container.prepend(svg);

  return { svg, path, progressPath };
};

const initHistoryLine = container => {
  const stops = Array.from(container.querySelectorAll(STOP_SELECTOR));
  if (stops.length < 2) return;

  const indicator = container.querySelector(INDICATOR_SELECTOR);
  const { svg, path, progressPath } = createSvg(container);

  let segments = [];
  let totalLength = 0;
  let startScroll = 0;
  let endScroll = 1;
  let indicatorHalf = { x: 0, y: 0 };
  let viewportWidth = 0;
  let scrollFrame = null;

  const update = () => {
    scrollFrame = null;
    if (!totalLength) return;

    const progress = Math.min(Math.max((window.scrollY - startScroll) / (endScroll - startScroll), 0), 1);
    const length = progress * totalLength;

    progressPath.style.strokeDashoffset = totalLength - length;

    if (indicator) {
      const point = getPointAtLength(segments, length);
      indicator.style.transform = `translate(${point.x - indicatorHalf.x}px, ${point.y - indicatorHalf.y}px)`;
    }
  };

  const measure = () => {
    const containerRect = container.getBoundingClientRect();
    const points = stops.map(stop => getStopCenter(stop, containerRect));
    const geometry = buildGeometry(points);

    segments = geometry.segments;
    totalLength = geometry.totalLength;
    const readingLine = window.innerHeight * READING_LINE;
    const containerTop = containerRect.top + window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    startScroll = Math.max(containerTop + points[0].y - readingLine, 0);
    endScroll = Math.max(Math.min(containerTop + points[points.length - 1].y - readingLine, maxScroll), startScroll + 1);
    viewportWidth = window.innerWidth;
    if (indicator) indicatorHalf = { x: indicator.offsetWidth / 2, y: indicator.offsetHeight / 2 };

    svg.setAttribute('width', containerRect.width);
    svg.setAttribute('height', containerRect.height);
    svg.setAttribute('viewBox', `0 0 ${containerRect.width} ${containerRect.height}`);
    path.setAttribute('d', geometry.d);
    progressPath.setAttribute('d', geometry.d);
    progressPath.style.strokeDasharray = totalLength;

    update();
  };

  const remeasure = debounce(measure, RESIZE_DELAY);
  const observer = new ResizeObserver(remeasure);
  observer.observe(container);
  observer.observe(document.body);
  window.addEventListener('resize', () => {
    if (window.innerWidth !== viewportWidth) remeasure();
  });

  window.addEventListener(
    'scroll',
    () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(update);
    },
    { passive: true }
  );

  measure();
};

export const initHistoryLines = () => {
  document.querySelectorAll(CONTAINER_SELECTOR).forEach(initHistoryLine);
};
