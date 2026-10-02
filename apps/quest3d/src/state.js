import "../../web/public/story-core.js";
export const Q = globalThis.PBOT_QUESTS;
export const SAVE_KEY = "pbot-brovary-3d-v3";
export const LEGACY_KEY = "pbot-brovary-final-v1";
export const NPCS = {
  coffee: { x: -4, z: 5, name: "Бариста PerkUp" },
  news: { x: 4, z: 25, name: "Редактор NEWS" },
  shoes: { x: -4, z: 48, name: "Майстер CHARME" },
  terminal: { x: 0, z: 68, name: "Термінал маршруту" },
  exit: { x: 0, z: 86, name: "Perky · Портал до парку" },
};
export const BEANS = Array.from({ length: 24 }, (_, i) => ({
  x: ((i % 3) - 1) * 1.9,
  y: 0.9,
  z: 9 + Math.floor(i / 3) * 1.8,
}));
export const SHARDS = [
  { id: "notice", x: -2, y: 1, z: 31 },
  { id: "route", x: 2, y: 1, z: 35 },
  { id: "signature", x: 0, y: 1, z: 39 },
];
export const PARCEL = { x: 4.5, y: 3.8, z: 55 };
export const PLATFORMS = [
  { x: 1.7, z: 50, y: 0.35, w: 2, d: 2, h: 0.7 },
  { x: 3.8, z: 51.7, y: 0.8, w: 2, d: 2, h: 1.6 },
  { x: 5, z: 54, y: 1.3, w: 2, d: 2, h: 2.6 },
  { x: 4.5, z: 55.5, y: 2.8, w: 4, d: 3, h: 0.3 },
];
export const ENEMIES = [
  { x: 0, z: 29 },
  { x: -2, z: 42 },
  { x: 2, z: 62 },
];
export function fresh() {
  return {
    version: 3,
    selected: "pbot",
    q: Q.clean(),
    beans: [],
    tokens: 0,
    receipts: [],
    upgrades: { speed: 0, jump: 0, pulse: 0 },
    dead: [],
    checkpoint: 0,
    hp: 3,
    damage: 0,
    time: 0,
    complete: false,
    stars: 0,
    best: null,
  };
}
const integer = (n, max) =>
  Number.isInteger(n) ? Math.max(0, Math.min(max, n)) : 0;
export function clean(raw) {
  const s = fresh();
  if (!raw || raw.version !== 3) return s;
  s.selected = ["pbot", "hero", "vitalii"].includes(raw.selected)
    ? raw.selected
    : "pbot";
  s.q = Q.clean(raw.q);
  s.beans = [
    ...new Set(
      Array.isArray(raw.beans)
        ? raw.beans.filter(
            (n) => Number.isInteger(n) && n >= 0 && n < BEANS.length,
          )
        : [],
    ),
  ];
  s.tokens = integer(raw.tokens, 100);
  s.receipts = [
    ...new Set(
      Array.isArray(raw.receipts)
        ? raw.receipts.filter((n) =>
            ["coffee", "news", "shoes", "finish", "route"].includes(n),
          )
        : [],
    ),
  ];
  for (const k of Object.keys(s.upgrades))
    s.upgrades[k] = integer(raw.upgrades?.[k], 5);
  s.dead = [
    ...new Set(
      Array.isArray(raw.dead)
        ? raw.dead.filter(
            (n) => Number.isInteger(n) && n >= 0 && n < ENEMIES.length,
          )
        : [],
    ),
  ];
  s.checkpoint = [0, 25, 68].includes(raw.checkpoint) ? raw.checkpoint : 0;
  s.hp = Number.isInteger(raw.hp) ? Math.max(1, Math.min(3, raw.hp)) : 3;
  s.damage = integer(raw.damage, 9999);
  s.time =
    typeof raw.time === "number" && Number.isFinite(raw.time)
      ? Math.max(0, raw.time)
      : 0;
  s.complete = raw.complete === true && s.q.phase === 7;
  s.stars = integer(raw.stars, 3);
  s.best =
    typeof raw.best === "number" && Number.isFinite(raw.best) && raw.best > 0
      ? raw.best
      : null;
  return s;
}
export function load(storage) {
  try {
    return clean(JSON.parse(storage.getItem(SAVE_KEY)));
  } catch {
    return fresh();
  }
}
export function persist(storage, s) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
export function migratePreferences(storage, s) {
  try {
    const old = JSON.parse(storage.getItem(LEGACY_KEY));
    if (["pbot", "hero", "vitalii"].includes(old?.selected))
      s.selected = old.selected;
    return true;
  } catch {
    return false;
  }
}
export function command(s, cmd) {
  const r = Q.transition(s.q, cmd, { beans: s.beans.length });
  s.q = r.q;
  if (r.reward) reward(s, r.reward, 1);
  return r.changed;
}
export function reward(s, id, n) {
  if (s.receipts.includes(id)) return false;
  s.receipts.push(id);
  s.tokens += n;
  return true;
}
export function upgrade(s, k) {
  if (!Object.hasOwn(s.upgrades, k) || s.upgrades[k] >= 5) return false;
  const cost = 2 + s.upgrades[k] * 2;
  if (s.tokens < cost) return false;
  s.tokens -= cost;
  s.upgrades[k]++;
  return true;
}
