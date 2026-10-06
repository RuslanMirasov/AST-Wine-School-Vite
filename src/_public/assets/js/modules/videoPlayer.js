const formatTime = seconds => {
  if (!Number.isFinite(seconds)) return '00:00';

  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = n => String(n).padStart(2, '0');

  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export const initVideoPlayer = () => {
  const popupContent = document.querySelector('#video-player');
  const player = popupContent?.querySelector('[data-player]');
  const video = player?.querySelector('[data-player-video]');

  if (!video) return;

  const backdrop = popupContent.closest('[data-backdrop]');
  const toggleButtons = player.querySelectorAll('[data-player-toggle]');
  const muteButton = player.querySelector('[data-player-mute]');
  const fullscreenButton = player.querySelector('[data-player-fullscreen]');
  const progress = player.querySelector('[data-player-progress]');
  const volume = player.querySelector('[data-player-volume]');
  const currentEl = player.querySelector('[data-player-current]');
  const durationEl = player.querySelector('[data-player-duration]');

  const controls = player.querySelector('.video-player-controls');

  const IDLE_DELAY = 3000;

  let isSeeking = false;
  let idleTimer = null;
  let skipVideoClick = false;
  let lastPointer = '';

  const setRange = (input, value) => {
    const percent = ((value - input.min) / (input.max - input.min)) * 100;
    input.value = value;
    input.style.setProperty('--value', `${percent}%`);
  };

  const isPopupOpen = () => popupContent.style.display === 'flex' && (!backdrop || backdrop.classList.contains('active'));

  const isFullscreen = () => (document.fullscreenElement || document.webkitFullscreenElement) === player;

  const togglePlay = () => {
    if (!video.getAttribute('src')) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const updatePlayState = () => {
    const isPaused = video.paused;
    player.classList.toggle('is-paused', isPaused);
    toggleButtons.forEach(button => {
      button.setAttribute('aria-label', isPaused ? 'Воспроизвести' : 'Пауза');
    });
  };

  const updateTime = () => {
    const { currentTime, duration } = video;

    currentEl.textContent = formatTime(currentTime);
    durationEl.textContent = formatTime(duration);

    if (!isSeeking) {
      setRange(progress, duration ? (currentTime / duration) * 100 : 0);
    }
  };

  const updateVolume = () => {
    const isMuted = video.muted || video.volume === 0;
    player.classList.toggle('is-muted', isMuted);
    muteButton.setAttribute('aria-label', isMuted ? 'Включить звук' : 'Выключить звук');
    setRange(volume, isMuted ? 0 : video.volume);
  };

  const toggleFullscreen = () => {
    if (isFullscreen()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else if (player.requestFullscreen) {
      player.requestFullscreen();
    } else if (player.webkitRequestFullscreen) {
      player.webkitRequestFullscreen();
    } else if (video.webkitEnterFullscreen) {
      // iPhone: полноэкранный режим доступен только для самого video
      video.webkitEnterFullscreen();
    }
  };

  // В полноэкранном режиме прячем контролы при бездействии
  const showControls = () => {
    clearTimeout(idleTimer);
    player.classList.remove('is-idle');

    if (!isFullscreen() || video.paused) return;

    idleTimer = setTimeout(() => {
      if (isSeeking || controls.matches(':hover')) {
        showControls();
        return;
      }
      player.classList.add('is-idle');
    }, IDLE_DELAY);
  };

  const load = url => {
    video.src = url;
    video.play().catch(() => {});
  };

  const stop = () => {
    if (!video.getAttribute('src')) return;

    if (isFullscreen()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    }

    video.pause();
    video.removeAttribute('src');
    video.load();
    updatePlayState();
    updateTime();
  };

  // Открытием попапа занимается popup.js, здесь только подставляем видео
  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-popup-open="video-player"]');
    const url = opener?.dataset.videoUrl;

    if (!url || url === '#' || !isPopupOpen()) return;

    load(url);
  });

  const observer = new MutationObserver(() => {
    if (!isPopupOpen()) stop();
  });
  observer.observe(popupContent, { attributes: true, attributeFilter: ['style'] });
  if (backdrop) observer.observe(backdrop, { attributes: true, attributeFilter: ['class'] });

  toggleButtons.forEach(button => button.addEventListener('click', togglePlay));
  video.addEventListener('click', () => {
    // Тап по видео со скрытыми контролами только показывает их
    if (skipVideoClick) {
      skipVideoClick = false;
      return;
    }
    togglePlay();
  });

  player.addEventListener('pointerdown', e => {
    skipVideoClick = e.pointerType !== 'mouse' && player.classList.contains('is-idle');
    showControls();
  });
  player.addEventListener('mousemove', e => {
    // Браузер шлёт mousemove и без движения, когда под курсором меняется вёрстка
    const pointer = `${e.clientX}:${e.clientY}`;
    if (pointer === lastPointer) return;
    lastPointer = pointer;
    showControls();
  });
  player.addEventListener('keydown', showControls);
  document.addEventListener('fullscreenchange', showControls);
  document.addEventListener('webkitfullscreenchange', showControls);

  video.addEventListener('play', updatePlayState);
  video.addEventListener('pause', updatePlayState);
  video.addEventListener('play', showControls);
  video.addEventListener('pause', showControls);
  video.addEventListener('timeupdate', updateTime);
  video.addEventListener('durationchange', updateTime);
  video.addEventListener('volumechange', updateVolume);

  progress.addEventListener('input', () => {
    isSeeking = true;
    progress.style.setProperty('--value', `${progress.value}%`);

    if (video.duration) {
      video.currentTime = (progress.value / 100) * video.duration;
      currentEl.textContent = formatTime(video.currentTime);
    }
  });
  progress.addEventListener('change', () => {
    isSeeking = false;
  });

  volume.addEventListener('input', () => {
    video.volume = Number(volume.value);
    video.muted = video.volume === 0;
  });

  muteButton.addEventListener('click', () => {
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 0.5;
  });

  fullscreenButton.addEventListener('click', toggleFullscreen);
  video.addEventListener('dblclick', toggleFullscreen);

  updateVolume();
  updateTime();
};
