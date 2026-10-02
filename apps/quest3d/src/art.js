import * as T from "three";
import { NPCS, BEANS, SHARDS, PARCEL, PLATFORMS, ENEMIES } from "./state.js";
const mats = new Map();
const material = (c) => {
  if (!mats.has(c))
    mats.set(c, new T.MeshStandardMaterial({ color: c, roughness: 0.88 }));
  return mats.get(c);
};
export function mesh(g, c, x = 0, y = 0, z = 0, parent) {
  const m = new T.Mesh(g, material(c));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent?.add(m);
  return m;
}
export const box = (p, c, x, y, z, w, h, d) =>
  mesh(new T.BoxGeometry(w, h, d), c, x, y, z, p);
const cyl = (p, c, x, y, z, r, h, n = 12) =>
  mesh(new T.CylinderGeometry(r, r, h, n), c, x, y, z, p);
const ball = (p, c, x, y, z, r) =>
  mesh(new T.IcosahedronGeometry(r, 1), c, x, y, z, p);
export function label(p, text, x, y, z, color = "#fff3d2", width = 4) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#193c46";
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 500, 116);
  ctx.font = "bold 52px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 66, 480);
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(
    new T.PlaneGeometry(width, width / 4),
    new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide }),
  );
  m.position.set(x, y, z);
  m.rotation.y = Math.PI;
  p.add(m);
  return m;
}
export function actor(type = "pbot", npc = false) {
  const g = new T.Group(),
    robot = type === "pbot";
  const shirt = npc ? "#ba8061" : "#202b31";
  cyl(g, shirt, 0, 0.87, 0, 0.32, 0.65);
  if (robot) {
    const head = ball(g, "#1b2d33", 0, 1.43, 0, 0.43);
    head.scale.z = 0.85;
    const trim = mesh(
      new T.TorusGeometry(0.33, 0.026, 8, 32),
      "#eeb548",
      0,
      1.44,
      0.28,
      g,
    );
    const face = mesh(
      new T.CircleGeometry(0.31, 32),
      "#082d36",
      0,
      1.44,
      0.3,
      g,
    );
    for (const x of [-0.12, 0.12]) {
      const eye = mesh(
        new T.TorusGeometry(0.065, 0.018, 5, 12, Math.PI),
        "#4af3ea",
        x,
        1.46,
        0.32,
        g,
      );
    }
    const smile = mesh(
      new T.TorusGeometry(0.062, 0.014, 5, 12, Math.PI),
      "#4af3ea",
      0,
      1.35,
      0.325,
      g,
    );
    smile.rotation.z = Math.PI;
    for (const side of [-1, 1]) {
      const ear = cyl(g, "#dfa73b", side * 0.43, 1.44, 0, 0.16, 0.12);
      ear.rotation.z = Math.PI / 2;
      const pad = cyl(g, "#f8d475", side * 0.5, 1.44, 0, 0.11, 0.035);
      pad.rotation.z = Math.PI / 2;
    }
    const tuft = mesh(
      new T.ConeGeometry(0.095, 0.27, 7),
      "#40e3e2",
      0,
      1.94,
      0,
      g,
    );
    tuft.rotation.z = -0.2;
    box(g, "#edb441", 0, 0.9, 0.32, 0.024, 0.45, 0.025);
    for (const x of [-0.07, 0.07])
      box(g, "#e6c275", x, 1.05, 0.31, 0.018, 0.18, 0.025);
  } else {
    ball(g, "#d6a078", 0, 1.43, 0, 0.25);
    const hair = ball(g, "#3a2f30", 0, 1.6, -0.03, 0.24);
    hair.scale.y = 0.65;
    box(g, "#192930", 0, 1.45, 0.23, 0.38, 0.08, 0.05);
  }
  const limbs = [];
  for (const side of [-1, 1]) {
    const leg = new T.Group();
    leg.position.set(side * 0.18, 0.6, 0);
    g.add(leg);
    cyl(leg, shirt, 0, -0.23, 0, 0.105, 0.42, 8);
    box(leg, "#e7b654", 0, -0.47, 0.06, 0.25, 0.16, 0.36);
    box(leg, "#73e2cd", 0, -0.54, 0.08, 0.25, 0.025, 0.35);
    limbs.push(leg);
    const arm = new T.Group();
    arm.position.set(side * 0.35, 1.1, 0);
    g.add(arm);
    cyl(arm, shirt, 0, -0.18, 0, 0.105, 0.4, 8);
    cyl(arm, "#e5b652", 0, -0.32, 0, 0.11, 0.045, 8);
    ball(arm, npc ? "#e8bf8a" : "#263b3f", 0, -0.4, 0, 0.12);
    limbs.push(arm);
  }
  g.userData.limbs = limbs;
  return g;
}
export function buildWorld(scene) {
  const solid = [];
  function building(x, z, w, d, h, c, name) {
    box(scene, c, x, h / 2, z, w, h, d).userData.cameraSolid = true;
    solid.push({ x, z, w, d, h, y: h / 2 });
    box(scene, "#efe0bd", x, h + 0.12, z, w + 0.35, 0.24, d + 0.35);
    box(scene, "#354f55", x, h + 0.3, z, w + 0.15, 0.12, d + 0.15);
    const front = z - d / 2;
    for (let y = 2.6; y < h - 1; y += 2.1)
      for (let xx = x - w / 2 + 1; xx < x + w / 2 - 0.4; xx += 1.8) {
        box(scene, "#32616b", xx, y, front - 0.05, 1.05, 1.3, 0.13);
        box(scene, "#e1d1ab", xx, y - 0.73, front - 0.2, 1.3, 0.13, 0.3);
        box(scene, "#d6c7a6", xx, y, front - 0.15, 0.07, 1.3, 0.1);
      }
    if (name) {
      label(scene, name, x, 2.3, front - 0.15, "#ffe3a5", w * 0.85);
      box(scene, "#224f56", x, 1, front - 0.07, w * 0.7, 1.7, 0.15);
      const awning = box(
        scene,
        "#dd9272",
        x,
        1.9,
        front - 0.75,
        w + 0.15,
        0.16,
        1.4,
      );
      awning.rotation.x = 0.16;
      for (let i = 0; i < 6; i++)
        box(
          scene,
          i % 2 ? "#f6dca7" : "#db795d",
          x - w / 2 + ((i + 0.5) * w) / 6,
          1.8,
          front - 1.4,
          w / 6,
          0.28,
          0.12,
        );
    }
  }
  box(scene, "#92a99a", 0, -0.6, 43, 100, 1, 140);
  box(scene, "#b6b7a3", 0, -0.08, 44, 15, 0.16, 104);
  box(scene, "#718e86", 0, 0.005, 44, 7.5, 0.05, 104);
  for (let z = -5; z < 95; z += 3) {
    box(scene, "#d9d4b6", -4, 0.04, z, 0.16, 0.08, 2.3);
    box(scene, "#d9d4b6", 4, 0.04, z, 0.16, 0.08, 2.3);
  }
  for (let z = 0; z < 92; z += 8) {
    for (const s of [-1, 1]) {
      box(scene, "#c9c7ac", s * 6, 0.04, z, 3.5, 0.08, 7.8);
      if (z % 16 === 0) {
        cyl(scene, "#254b51", s * 6.5, 1.8, z, 0.065, 3.6, 8);
        box(scene, "#29494e", s * 6.5, 3.7, z, 0.9, 0.15, 0.5);
        ball(scene, "#ffe3a0", s * 6.5, 3.5, z, 0.2);
      }
    }
  }
  building(-10, 8, 7, 8, 8, "#cf9a7a", "PerkUp");
  building(10, 27, 6, 6, 5, "#91aeb0", "NEWS");
  building(-10, 50, 7, 7, 9, "#afada7", "CHARME");
  for (let i = 0; i < 8; i++) {
    const x = i % 2 ? -17 : 17,
      z = i * 13 - 6;
    building(
      x,
      z,
      7,
      8,
      8 + (i % 3) * 3,
      ["#c2b093", "#8ca3a5", "#af8e82"][i % 3],
    );
  }
  for (let i = 0; i < 14; i++) {
    const x = i % 2 ? -8 : 8,
      z = i * 7 - 5;
    if ([8, 27, 50].some((v) => Math.abs(v - z) < 5)) continue;
    cyl(scene, "#736554", x, 1.1, z, 0.15, 2.2, 7);
    for (const [dx, dy, dz, r] of [
      [0, 3, 0, 1.35],
      [-0.65, 2.5, 0.1, 0.9],
      [0.7, 2.6, 0.2, 1],
    ])
      ball(
        scene,
        ["#497c64", "#759563", "#9ba56b"][i % 3],
        x + dx,
        dy,
        z + dz,
        r,
      );
    cyl(scene, "#acaa8b", x, 0.2, z, 0.75, 0.4);
  }
  // Bridge: a shallow blue canal, arched rails, and a legible broad deck.
  box(scene, "#528b91", 0, -0.05, 35, 40, 0.05, 9);
  box(scene, "#c6b895", 0, 0.09, 35, 7.6, 0.18, 10);
  for (const x of [-3.5, 3.5]) {
    for (let z = 30; z <= 40; z += 1.25)
      cyl(scene, "#42696b", x, 0.7, z, 0.055, 1.4, 6);
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(x, 1.1, 30),
      new T.Vector3(x, 1.65, 35),
      new T.Vector3(x, 1.1, 40),
    ]);
    mesh(
      new T.TubeGeometry(curve, 16, 0.07, 5, false),
      "#42696b",
      0,
      0,
      0,
      scene,
    );
  }
  for (const p of PLATFORMS) {
    box(scene, "#a68660", p.x, p.y, p.z, p.w, p.h, p.d).userData.cameraSolid =
      true;
    solid.push(p);
    box(
      scene,
      "#d5ba83",
      p.x,
      p.y + p.h / 2 + 0.02,
      p.z,
      p.w + 0.1,
      0.08,
      p.d + 0.1,
    );
  }
  for (const x of [2.6, 6.4])
    for (const z of [54.2, 56.8])
      cyl(scene, "#526c6e", x, 1.4, z, 0.06, 2.8, 6);
  for (const z of [15, 58, 77]) {
    box(scene, "#946d53", -5.8, 0.52, z, 1.5, 0.13, 0.6);
    box(scene, "#af805a", -6, 0.95, z, 0.14, 0.7, 1.8);
    for (const zz of [z - 0.5, z + 0.5])
      box(scene, "#375452", -5.8, 0.25, zz, 1.2, 0.5, 0.08);
  }
  const npcs = {};
  for (const [id, n] of Object.entries(NPCS)) {
    if (id === "exit" || id === "terminal") continue;
    const g = actor("hero", true);
    g.position.set(n.x, 0, n.z);
    scene.add(g);
    npcs[id] = g;
    label(
      scene,
      id === "coffee" ? "PerkUp" : id === "news" ? "NEWS" : "CHARME",
      n.x,
      2.2,
      n.z,
      undefined,
      2,
    );
  }
  box(scene, "#284b56", 0, 0.8, 68, 1, 1.6, 0.65);
  box(scene, "#80d3bd", 0, 1.2, 67.65, 0.7, 0.45, 0.06);
  for (const z of [25, 68]) {
    const ring = mesh(
      new T.TorusGeometry(1.5, 0.06, 6, 32),
      "#b8e5cb",
      0,
      0.06,
      z,
      scene,
    );
    ring.rotation.x = Math.PI / 2;
  }
  const portal = new T.Group();
  portal.position.set(0, 0, 86);
  scene.add(portal);
  for (const x of [-2.2, 2.2]) {
    cyl(portal, "#d5c7a1", x, 1.4, 0, 0.3, 2.8);
    ball(portal, "#ddbe79", x, 2.9, 0, 0.43);
  }
  const arch = mesh(
    new T.TorusGeometry(2.2, 0.22, 8, 32, Math.PI),
    "#d5c7a1",
    0,
    2.7,
    0,
    portal,
  );
  label(scene, "ПАРКОВІ СТЕЖКИ", 0, 5.4, 86, "#ffe3a5", 5);
  const gate = mesh(
    new T.CircleGeometry(1.8, 48),
    "#77c8bd",
    0,
    2.4,
    86,
    scene,
  );
  gate.material = new T.MeshBasicMaterial({
    color: "#6bd8ca",
    transparent: true,
    opacity: 0.25,
    side: T.DoubleSide,
  });
  const perky = actor();
  perky.scale.setScalar(0.5);
  perky.position.set(-2.7, 1.8, 84);
  scene.add(perky);
  const beans = BEANS.map((b) => {
    const m = ball(scene, "#f2b755", b.x, b.y, b.z, 0.18);
    m.scale.set(0.75, 1.3, 0.8);
    return m;
  });
  const shards = SHARDS.map((s) =>
    box(scene, "#9de7e7", s.x, s.y, s.z, 0.4, 0.5, 0.12),
  );
  const parcel = box(
    scene,
    "#dda969",
    PARCEL.x,
    PARCEL.y,
    PARCEL.z,
    0.7,
    0.6,
    0.65,
  );
  box(parcel, "#fff0ca", 0, 0, 0, 0.12, 0.62, 0.67);
  const enemies = ENEMIES.map((e) => {
    const g = new T.Group();
    scene.add(g);
    g.position.set(e.x, 0.7, e.z);
    ball(g, "#78536c", 0, 0, 0, 0.5);
    box(g, "#e6a79b", 0, 0, 0.45, 0.6, 0.15, 0.12);
    for (const x of [-0.7, 0.7]) {
      box(g, "#394e59", x, 0.1, 0, 0.55, 0.08, 0.12);
      mesh(
        new T.TorusGeometry(0.25, 0.025, 4, 12),
        "#d19aaa",
        x,
        0.15,
        0,
        g,
      ).rotation.x = Math.PI / 2;
    }
    return g;
  });
  const token = mesh(
    new T.TorusGeometry(0.3, 0.1, 6, 16),
    "#f8d079",
    -2,
    0.9,
    60,
    scene,
  );
  const cameraSolids = [];
  scene.traverse((o) => {
    if (o.userData.cameraSolid) cameraSolids.push(o);
  });
  return {
    cameraSolids,
    solid,
    beans,
    shards,
    parcel,
    enemies,
    portal: gate,
    perky,
    token,
  };
}
