// P-BOT Brovary Universe — landscape-first runtime lock.
(() => {
  const BASE_W = 960;
  const BASE_H = 540;
  const TARGET_GROUND_Y = 500;

  canvas.width = BASE_W;
  canvas.height = BASE_H;

  function shiftY(obj, dy) {
    if (!obj) return;
    if (typeof obj.y === 'number') obj.y += dy;
    if (obj.roof && typeof obj.roof.y === 'number') obj.roof.y += dy;
  }

  function adaptLevelToLandscape() {
    if (!level || level.__landscapeAdjusted) return;
    const sourceGround = typeof level.groundY === 'number' ? level.groundY : TARGET_GROUND_Y;
    const dy = TARGET_GROUND_Y - sourceGround;
    const seenArrays = new Set();

    for (const key of ['platforms','solids','terrain','props','beans','specials','enemies','hazards','checks']) {
      const arr = level[key];
      if (!Array.isArray(arr) || seenArrays.has(arr)) continue;
      seenArrays.add(arr);
      for (const item of arr) shiftY(item, dy);
    }

    shiftY(level.finish, dy);
    shiftY(level.spawn, dy);
    level.groundY = TARGET_GROUND_Y;
    level.height = BASE_H;
    level.__landscapeAdjusted = true;

    if (player) {
      player.y += dy;
      if (player.spawn) player.spawn.y += dy;
    }
  }

  const originalResetLevel = resetLevel;
  resetLevel = function() {
    originalResetLevel();
    adaptLevelToLandscape();
  };

  // Mobile web cannot always force orientation, so show an explicit rotate gate in portrait.
  const gate = document.createElement('div');
  gate.className = 'rotate-lock';
  gate.innerHTML = `
    <div class="rotate-lock__card">
      <div class="rotate-lock__icon">↻</div>
      <div class="rotate-lock__title">Поверніть телефон горизонтально</div>
      <div class="rotate-lock__text">P-BOT: Brovary Universe спроєктована як горизонтальна 16:9 гра. Так видно більше міста, маршрутів, ворогів і секретних зон.</div>
    </div>`;
  document.body.appendChild(gate);

  // Best-effort landscape lock for installed/fullscreen-capable browsers.
  const tryLandscapeLock = async () => {
    try {
      if (screen.orientation?.lock) await screen.orientation.lock('landscape');
    } catch (_) {}
  };
  document.addEventListener('pointerdown', tryLandscapeLock, { once: true });
})();
