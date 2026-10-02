import * as T from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import {
  Q,
  SAVE_KEY,
  fresh,
  load,
  persist,
  migratePreferences,
  command,
  reward,
  upgrade,
  NPCS,
  BEANS,
  SHARDS,
  PARCEL,
  ENEMIES,
} from "./state.js";
import { actor, buildWorld, mesh } from "./art.js";
import "./style.css";
const $ = (s) => document.querySelector(s),
  canvas = $("#world"),
  dialog = $("#dialog");
let storage;
try {
  storage = localStorage;
} catch {
  storage = {
    getItem: () => null,
    setItem: () => {
      throw Error("unavailable");
    },
  };
}
const s = load(storage),
  keys = new Set();
let jump = false,
  pulse = false,
  near = null,
  paused = true,
  toastTime = 0,
  saveTimer = 0,
  angle = Math.PI,
  drag = null,
  vy = 0,
  jumps = 0,
  grounded = false,
  inv = 0,
  cooldown = 0,
  velocity = new T.Vector3(),
  player,
  renderer,
  world,
  body,
  collider,
  controller,
  view,
  scene,
  camera,
  fx;
let crouched = false;
let lost = false;
const metrics = {
  frames: 0,
  ms: 0,
  maxMs: 0,
  readyMs: 0,
  drawCalls: 0,
  triangles: 0,
};
const boot = performance.now();
function toast(t) {
  $("#toast").textContent = t;
  toastTime = 4;
}
function save() {
  if (!persist(storage, s))
    toast("Сховище недоступне. Прогрес є лише в цій сесії.");
}
function clear() {
  keys.clear();
  jump = pulse = false;
  velocity.set(0, 0, 0);
  drag = null;
}
function close() {
  dialog.close();
  paused = false;
  clear();
  canvas.focus();
  save();
}
function show(title, text, choices = []) {
  if (lost) return;
  clear();
  paused = true;
  $("#title").textContent = title;
  $("#body").textContent = text;
  $("#choices").replaceChildren();
  for (const [name, fn] of [...choices, ["Повернутися", close]]) {
    const b = document.createElement("button");
    b.textContent = name;
    b.onclick = fn;
    $("#choices").append(b);
  }
  if (!dialog.open) dialog.showModal();
}
function apply(cmd) {
  if (command(s, cmd)) {
    save();
    toast("Прогрес збережено");
  }
  close();
}
function journal() {
  show(
    "Журнал · 01—01",
    `${Q.objective(s.q, s.beans.length)[1]}\n\n${s.q.phase >= 2 ? "✓" : "○"} PerkUp: прийняти → 8 зерен → повернутися.\n${s.q.phase >= 4 ? "✓" : "○"} NEWS: три фрагменти біля мосту → редактор.\n${s.q.phase >= 6 ? "✓" : "○"} CHARME: клумба → ящики → настил → майстер.\n${s.q.phase === 7 ? "✓" : "○"} Термінал → Perky біля порталу.\n\nWASD / стрілки — рух. Space двічі — подвійний стрибок. E — Perky Pulse. F — розмова. C / Ctrl — присісти. Drag — камера, R — камера за спину. Escape — меню.\nТри жетони за місії, один на вулиці та два за завершення. Це лише ігрова валюта.`,
  );
}
function menu() {
  if (lost) return;
  show(
    "P-BOT / Coffee Quest",
    `Ранок без сигналу · окрема 3D-глава\nЖетони: ${s.tokens}. ${"★".repeat(s.stars)}${"☆".repeat(3 - s.stars)}${s.best ? " · рекорд " + s.best.toFixed(1) + "с" : ""}\nПокращення коштує 2 + 2 × рівень.\n${s.complete ? "Главу завершено. Наступна «Паркові стежки» ще не перенесена." : "Perky: термінали мовчать. Почнімо з баристи PerkUp."}`,
    [
      ["Грати", close],
      ...Object.entries({
        pbot: "P-BOT",
        hero: "Brovary Hero",
        vitalii: "Vitalii",
      }).map(([id, name]) => [
        `${s.selected === id ? "✓ " : ""}${name}`,
        () => {
          s.selected = id;
          replaceActor();
          save();
          menu();
        },
      ]),
      ...Object.entries({
        speed: "Швидкість",
        jump: "Стрибок",
        pulse: "Імпульс",
      }).map(([id, name]) => [
        `${name} ${s.upgrades[id]}/5 · ${2 + s.upgrades[id] * 2} ◇`,
        () => {
          toast(
            upgrade(s, id)
              ? "Покращення активовано"
              : "Недостатньо жетонів або максимальний рівень",
          );
          save();
          menu();
        },
      ]),
      [
        "Почати главу знову",
        () =>
          show(
            "Почати знову?",
            "Завдання та зібрані предмети цієї спроби буде скинуто. Жетони, покращення й отримані нагороди залишаться.",
            [
              [
                "Почати",
                () => {
                  const keep = {
                    selected: s.selected,
                    tokens: s.tokens,
                    upgrades: s.upgrades,
                    receipts: s.receipts,
                    stars: s.stars,
                    best: s.best,
                  };
                  Object.assign(s, fresh(), keep);
                  respawn();
                  close();
                },
              ],
            ],
          ),
      ],
      ["Журнал / керування", journal],
      [
        "Імпортувати персонажа з 2D",
        () => {
          migratePreferences(storage, s);
          replaceActor();
          save();
          menu();
        },
      ],
      [
        "Чинна 2D-гра",
        () => {
          location.href = "https://web-production-f3e45.up.railway.app/";
        },
      ],
    ],
  );
}
function talk() {
  if (!near || s.complete) return;
  const id = near,
    n = NPCS[id],
    st = Q.status(s.q, id, s.beans.length);
  const stages = {
    coffee: [
      "Під час збою зерна розсипались уздовж вулиці. Принеси вісім — зварю заряд для міського термінала.",
      "Допоможу",
      "accept-coffee",
      "Усі вісім на місці. Заряд готовий! Знайди редактора NEWS: нам потрібен код маршруту.",
      "Передати зерна",
      "handin-coffee",
    ],
    news: [
      "SPAM розірвав повідомлення на три фрагменти біля мосту. Знайди їх і поверни мені.",
      "Знайду фрагменти",
      "accept-news",
      "«Наказ №0. Жодного руху без погодження». Підпис: THE OFFICIAL. Код врятовано. Тепер завітай до майстра CHARME.",
      "Передати фрагменти",
      "handin-news",
    ],
    shoes: [
      "Кур’єр залишив посилку на верхньому настилі. Клумба → ящик → настил. Принеси її: усередині модуль зчеплення.",
      "Заберу посилку",
      "accept-shoes",
      "Модуль зчеплення встановлено: гальмування стало точнішим. Заряд і код є. Увімкни термінал біля другого чекпойнта.",
      "Передати посилку",
      "handin-shoes",
    ],
  };
  if (st === "locked")
    return show(
      n.name,
      "Спочатку виконай попередні завдання. " +
        Q.objective(s.q, s.beans.length)[1],
    );
  if (st === "done")
    return show(n.name, "Дякую! " + Q.objective(s.q, s.beans.length)[1]);
  if (id === "terminal")
    return show(n.name, "Заряд під’єднано. Код прийнято. Відновити сигнал?", [
      ["Відновити сигнал", () => apply("activate")],
    ]);
  if (id === "exit")
    return show(
      "Perky",
      "Ми допомогли сусідам і знайшли слід THE OFFICIAL. Далі — «Паркові стежки». Це кінець готової 3D-глави.",
      [
        [
          "Завершити розділ",
          () => {
            s.complete = true;
            s.stars = Math.max(
              s.stars,
              1 +
                (s.beans.length === BEANS.length ? 1 : 0) +
                (s.damage === 0 ? 1 : 0),
            );
            s.best = Math.min(s.best ?? Infinity, s.time);
            reward(s, "finish", 2);
            save();
            menu();
          },
        ],
      ],
    );
  const a = stages[id];
  if (st === "available")
    return show(n.name, a[0], [[a[1], () => apply(a[2])]]);
  if (st === "ready") return show(n.name, a[3], [[a[4], () => apply(a[5])]]);
  show(
    n.name,
    Q.objective(s.q, s.beans.length)[1] +
      (id === "news"
        ? "\nІмпульс Perky (E) прибирає SPAM."
        : id === "shoes"
          ? "\nПосилка нагорі. Натисни стрибок удруге в повітрі."
          : ""),
  );
}
function replaceActor() {
  if (player) {
    scene.remove(player);
    player.traverse((o) => o.geometry?.dispose());
  }
  player = actor(s.selected);
  scene.add(player);
}
function fallback() {
  if (dialog.open) dialog.close();
  lost = true;
  paused = true;
  clear();
  $("#fallback").hidden = false;
}
function respawn() {
  body.setTranslation({ x: 0, y: 1, z: s.checkpoint || 1 }, true);
  vy = 0;
  jumps = 0;
  velocity.set(0, 0, 0);
  inv = 2;
  s.hp = 3;
  save();
  toast("Повернення до чекпойнта");
}
function input(code, down) {
  if (paused) return;
  if (down) {
    if (!keys.has(code)) {
      if (code === "Space") jump = true;
      if (code === "KeyE") pulse = true;
      if (code === "KeyF") talk();
      if (code === "KeyR") angle = Math.PI;
    }
    keys.add(code);
  } else keys.delete(code);
}
document.addEventListener("keydown", (e) => {
  if (
    ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
      e.code,
    ) &&
    !dialog.open
  )
    e.preventDefault();
  if (!e.repeat && e.code === "Escape") {
    e.preventDefault();
    dialog.open ? close() : menu();
    return;
  }
  if (!e.repeat && e.code === "KeyJ" && !dialog.open) {
    journal();
    return;
  }
  input(e.code, true);
});
document.addEventListener("keyup", (e) => input(e.code, false));
dialog.addEventListener("cancel", (e) => {
  e.preventDefault();
  close();
});
window.addEventListener("blur", () => {
  clear();
  if (!paused) menu();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clear();
    save();
    if (!paused) menu();
  }
});
for (const b of document.querySelectorAll("[data-key]")) {
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    input(b.dataset.key, true);
  });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"])
    b.addEventListener(ev, (e) => {
      e.preventDefault();
      input(b.dataset.key, false);
    });
}
canvas.tabIndex = 0;
canvas.addEventListener("pointerdown", (e) => {
  if (paused) return;
  drag = { id: e.pointerId, x: e.clientX };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (drag?.id === e.pointerId) {
    angle -= (e.clientX - drag.x) * 0.008;
    drag.x = e.clientX;
  }
});
canvas.addEventListener("pointerup", () => (drag = null));
canvas.addEventListener("pointercancel", () => (drag = null));
canvas.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  save();
  fallback();
});
canvas.addEventListener("webglcontextrestored", () => location.reload());
$("#objective").onclick = journal;
$("#menu").onclick = menu;
$("#interact").onclick = talk;
window.addEventListener("pagehide", save);
function enemyPosition(i) {
  return {
    x: ENEMIES[i].x + Math.sin(s.time * 1.3 + i) * 1.5,
    y: 0.85 + Math.sin(s.time * 3 + i) * 0.15,
    z: ENEMIES[i].z,
  };
}
function update(dt) {
  s.time += dt;
  inv = Math.max(0, inv - dt);
  cooldown = Math.max(0, cooldown - dt);
  let p = body.translation();
  const side =
      (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
      (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0),
    forward =
      (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
      (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
  let crouch = keys.has("KeyC") || keys.has("ControlLeft");
  if (crouched && !crouch)
    crouch = view.solid.some(
      (b) =>
        Math.abs(p.x - b.x) < b.w / 2 + 0.37 &&
        Math.abs(p.z - b.z) < b.d / 2 + 0.37 &&
        b.y - b.h / 2 > p.y + 0.3 &&
        b.y - b.h / 2 < p.y + 1.1,
    );
  const move = new T.Vector3(
    Math.cos(angle) * side - Math.sin(angle) * forward,
    0,
    -Math.sin(angle) * side - Math.cos(angle) * forward,
  ).normalize();
  if (crouch !== crouched) {
    const half = crouch ? 0.26 : 0.5;
    collider.setHalfHeight(half);
    body.setTranslation(
      { x: p.x, y: p.y + (crouch ? -0.24 : 0.24), z: p.z },
      true,
    );
    crouched = crouch;
    p = body.translation();
  }
  const speed = (5 + s.upgrades.speed * 0.55) * (crouch ? 0.5 : 1);
  const friction = move.lengthSq() ? 14 : s.q.phase >= 6 ? 23 : 8;
  velocity.lerp(move.multiplyScalar(speed), 1 - Math.exp(-friction * dt));
  if (jump) {
    if (grounded || jumps < 2) {
      vy = 6.2 + s.upgrades.jump * 0.35;
      jumps++;
      grounded = false;
    }
    jump = false;
  }
  vy -= 18 * dt;
  controller.computeColliderMovement(collider, {
    x: velocity.x * dt,
    y: vy * dt,
    z: velocity.z * dt,
  });
  const m = controller.computedMovement();
  body.setNextKinematicTranslation({
    x: Math.max(-7, Math.min(7, p.x + m.x)),
    y: p.y + m.y,
    z: Math.max(-3, Math.min(90, p.z + m.z)),
  });
  grounded = controller.computedGrounded();
  if (grounded) {
    vy = 0;
    jumps = 0;
  }
  world.step();
  const pos = body.translation();
  if (pos.y < -5) respawn();
  const dist = (x, y, z) => Math.hypot(pos.x - x, pos.y - y, pos.z - z);
  let dirty = false;
  BEANS.forEach((b, i) => {
    if (!s.beans.includes(i) && dist(b.x, b.y, b.z) < 0.8) {
      s.beans.push(i);
      dirty = true;
    }
  });
  SHARDS.forEach((b) => {
    if (s.q.phase === 3 && dist(b.x, b.y, b.z) < 0.85)
      dirty = command(s, "shard:" + b.id) || dirty;
  });
  if (s.q.phase === 5 && dist(PARCEL.x, PARCEL.y, PARCEL.z) < 0.9)
    dirty = command(s, "parcel") || dirty;
  if (dist(-2, 0.9, 60) < 0.85 && reward(s, "route", 1)) {
    toast("Brovary Token +1");
    dirty = true;
  }
  if (pulse && cooldown <= 0) {
    cooldown = 5 - Math.min(2.4, s.upgrades.pulse * 0.45);
    fx.userData.life = 0.5;
    fx.position.set(pos.x, 0.4, pos.z);
    ENEMIES.forEach((e, i) => {
      const ep = enemyPosition(i);
      if (Math.hypot(pos.x - ep.x, pos.z - ep.z) < 4 && !s.dead.includes(i)) {
        s.dead.push(i);
        dirty = true;
        toast("SPAM прибрано");
      }
    });
  }
  pulse = false;
  ENEMIES.forEach((e, i) => {
    if (s.dead.includes(i)) return;
    const ep = enemyPosition(i);
    if (dist(ep.x, ep.y, ep.z) < 0.85 && inv === 0) {
      if (vy < -1 && pos.y > ep.y + 0.4) {
        s.dead.push(i);
        vy = 5;
        toast("SPAM прибрано стрибком");
      } else {
        s.hp--;
        s.damage++;
        inv = 1.8;
        toast("SPAM! E — захисний імпульс");
        if (s.hp <= 0) respawn();
      }
      dirty = true;
    }
  });
  for (const cp of [25, 68])
    if (
      Math.abs(pos.z - cp) < 1.2 &&
      Math.abs(pos.x) < 2 &&
      cp > s.checkpoint
    ) {
      s.checkpoint = cp;
      s.hp = 3;
      toast("Чекпойнт збережено");
      dirty = true;
    }
  near =
    Object.keys(NPCS).find(
      (id) =>
        Math.hypot(pos.x - NPCS[id].x, pos.z - NPCS[id].z) < 2.3 && pos.y < 2.2,
    ) || null;
  $("#interact").hidden = !near || s.complete;
  $("#interact").textContent = near ? "F · " + NPCS[near].name : "";
  player.position.set(pos.x, pos.y - (crouched ? 0.62 : 0.86), pos.z);
  player.scale.y = crouch ? 0.72 : 1;
  if (velocity.length() > 0.2)
    player.rotation.y = Math.atan2(velocity.x, velocity.z);
  player.userData.limbs.forEach(
    (l, i) =>
      (l.rotation.x = grounded
        ? Math.sin(s.time * 12 + (i % 2) * Math.PI) *
          Math.min(0.55, velocity.length() * 0.12)
        : 0.25),
  );
  player.visible = inv <= 0 || Math.floor(inv * 12) % 2 === 0;
  saveTimer += dt;
  if (dirty || saveTimer > 3) {
    saveTimer = 0;
    save();
  }
}
function render(dt) {
  const pos = body.translation(),
    target = new T.Vector3(pos.x, pos.y + 1, pos.z);
  let desired = target
    .clone()
    .add(new T.Vector3(Math.sin(angle) * 8, 5, Math.cos(angle) * 8));
  const ray = new T.Raycaster(
    target,
    desired.clone().sub(target).normalize(),
    0,
    desired.distanceTo(target),
  );
  const hits = ray.intersectObjects(view.cameraSolids, false);
  if (hits.length)
    desired = target
      .clone()
      .add(
        ray.ray.direction
          .clone()
          .multiplyScalar(Math.max(2, hits[0].distance - 0.3)),
      );
  camera.position.lerp(desired, 1 - Math.exp(-8 * dt));
  camera.lookAt(target);
  BEANS.forEach((b, i) => {
    view.beans[i].visible = !s.beans.includes(i);
    view.beans[i].rotation.y = s.time * 1.4;
  });
  SHARDS.forEach((b, i) => {
    view.shards[i].visible = s.q.phase === 3 && !s.q.shards.includes(b.id);
    view.shards[i].rotation.y = s.time;
  });
  view.parcel.visible = s.q.phase === 5 && !s.q.parcel;
  view.enemies.forEach((e, i) => {
    e.visible = !s.dead.includes(i);
    const ep = enemyPosition(i);
    e.position.set(ep.x, ep.y, ep.z);
  });
  view.token.visible = !s.receipts.includes("route");
  view.token.rotation.y = s.time;
  view.portal.material.opacity = s.q.phase >= 7 ? 0.55 : 0.08;
  view.perky.position.y = 1.8 + Math.sin(s.time * 2) * 0.15;
  fx.userData.life = Math.max(0, (fx.userData.life || 0) - dt);
  fx.visible = fx.userData.life > 0;
  fx.scale.setScalar((0.5 - fx.userData.life) * 8);
  $("#objective").textContent = s.complete
    ? "✓ Ранок без сигналу — завершено"
    : Q.objective(s.q, s.beans.length)[1];
  $("#stats").textContent =
    `${"♥".repeat(s.hp)} · ${s.beans.length}/${BEANS.length} зерен · ◇ ${s.tokens} · ${cooldown > 0 ? "Pulse " + cooldown.toFixed(1) + "с" : "Pulse готовий"}`;
  if (toastTime > 0) {
    toastTime -= dt;
    if (toastTime <= 0) $("#toast").textContent = "";
  }
  renderer.render(scene, camera);
  metrics.drawCalls = renderer.info.render.calls;
  metrics.triangles = renderer.info.render.triangles;
}
async function bootGame() {
  try {
    renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    scene = new T.Scene();
    scene.background = new T.Color("#acc6c0");
    scene.fog = new T.Fog("#acc6c0", 25, 85);
    camera = new T.PerspectiveCamera(55, 1, 0.1, 160);
    camera.position.set(0, 6, -7);
    scene.add(new T.HemisphereLight("#fff1d2", "#5d8887", 2.4));
    const sun = new T.DirectionalLight("#ffe0ae", 3);
    sun.position.set(-15, 25, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -25,
      right: 25,
      top: 30,
      bottom: -30,
      near: 1,
      far: 100,
    });
    sun.shadow.bias = -0.001;
    scene.add(sun);
    scene.add(sun.target);
    view = buildWorld(scene);
    replaceActor();
    await RAPIER.init();
    world = new RAPIER.World({ x: 0, y: -18, z: 0 });
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(50, 0.5, 100).setTranslation(0, -0.5, 40),
    );
    for (const p of view.solid)
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(p.w / 2, p.h / 2, p.d / 2).setTranslation(
          p.x,
          p.y,
          p.z,
        ),
      );
    body = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        0,
        1,
        s.checkpoint || 1,
      ),
    );
    collider = world.createCollider(
      RAPIER.ColliderDesc.capsule(0.5, 0.35),
      body,
    );
    controller = world.createCharacterController(0.02);
    controller.enableAutostep(0.3, 0.2, true);
    controller.enableSnapToGround(0.18);
    controller.setSlideEnabled(true);
    fx = mesh(new T.TorusGeometry(1, 0.04, 6, 32), "#b0ffe0", 0, 0.1, 0, scene);
    fx.rotation.x = Math.PI / 2;
    fx.visible = false;
    function resize() {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize);
    resize();
    menu();
    metrics.readyMs = performance.now() - boot;
    let previous = performance.now(),
      accumulator = 0;
    renderer.setAnimationLoop((now) => {
      const dt = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      if (lost) return;
      const start = performance.now();
      if (!paused) {
        accumulator += dt;
        while (accumulator >= 1 / 60) {
          update(1 / 60);
          accumulator -= 1 / 60;
        }
      } else accumulator = 0;
      render(dt);
      metrics.frames++;
      metrics.ms += performance.now() - start;
      metrics.maxMs = Math.max(metrics.maxMs, performance.now() - start);
      sun.position.set(
        body.translation().x - 15,
        25,
        body.translation().z + 12,
      );
      sun.target.position.set(body.translation().x, 0, body.translation().z);
    });
    if (import.meta.env.DEV)
      globalThis.__PBOT3D__ = {
        state: s,
        position: () => ({ ...body.translation() }),
        metrics,
        input,
        save,
        keys,
        advance: (n = 1) => {
          for (let i = 0; i < Math.min(600, n) && !paused; i++) {
            update(1 / 60);
          }
        },
        renderFrame: () => render(1),
        paused: () => paused,
      };
  } catch (e) {
    console.error(e);
    fallback();
  }
}
bootGame();
