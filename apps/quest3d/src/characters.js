import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
const mats = new Map();
function mat(color, roughness = 0.65, metalness = 0, emissive = false) {
  const key = [color, roughness, metalness, emissive].join();
  if (!mats.has(key))
    mats.set(
      key,
      new T.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        ...(emissive ? { emissive: color, emissiveIntensity: 0.8 } : {}),
      }),
    );
  return mats.get(key);
}
function part(
  parent,
  geo,
  color,
  x,
  y,
  z,
  rough = 0.65,
  metal = 0,
  glow = false,
) {
  const m = new T.Mesh(geo, mat(color, rough, metal, glow));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
const round = (p, c, x, y, z, w, h, d, r = 0.06) =>
  part(p, new RoundedBoxGeometry(w, h, d, 3, r), c, x, y, z);
const orb = (p, c, x, y, z, sx, sy = sx, sz = sx, rough = 0.65, metal = 0) => {
  const m = part(p, new T.SphereGeometry(1, 20, 12), c, x, y, z, rough, metal);
  m.scale.set(sx, sy, sz);
  return m;
};
const tube = (p, c, x, y, z, r, h) =>
  part(p, new T.CylinderGeometry(r, r, h, 16), c, x, y, z);
const joint = (p, x, y, z) => {
  const g = new T.Group();
  g.position.set(x, y, z);
  p.add(g);
  return g;
};
export function createActor(type = "pbot", npc = false) {
  const root = new T.Group(),
    rig = joint(root, 0, 0.64, 0),
    torso = joint(rig, 0, 0, 0),
    robot = type === "pbot";
  const coat = npc
    ? "#39716c"
    : robot
      ? "#263642"
      : type === "vitalii"
        ? "#384c67"
        : "#343c45";
  orb(torso, coat, 0, 0.3, 0, 0.34, 0.37, 0.23);
  round(torso, "#192b35", 0, 0.04, 0, 0.5, 0.16, 0.31);
  round(torso, "#cea34f", 0, 0.02, 0.04, 0.5, 0.055, 0.32, 0.02);
  const head = joint(torso, 0, 0.78, 0),
    eyes = [];
  if (robot) {
    orb(head, "#33434d", 0, 0, 0, 0.46, 0.43, 0.39, 0.3, 0.22);
    orb(head, "#112737", 0, 0, 0.315, 0.345, 0.326, 0.105, 0.18, 0.3);
    const ring = part(
      head,
      new T.TorusGeometry(0.339, 0.025, 8, 40),
      "#f0bd5c",
      0,
      0,
      0.357,
      0.24,
      0.6,
    );
    ring.scale.y = 0.97;
    // Expressive cyan eyes and smile sit on curved dark glass.
    for (const x of [-0.123, 0.123]) {
      const eye = joint(head, x, 0.027, 0.42);
      const arc = part(
        eye,
        new T.TorusGeometry(0.062, 0.016, 6, 18, Math.PI),
        "#74ffea",
        0,
        0,
        0,
        0.3,
        0,
        true,
      );
      eyes.push(eye);
    }
    const mouth = part(
      head,
      new T.TorusGeometry(0.052, 0.011, 6, 18, Math.PI),
      "#74ffea",
      0,
      -0.086,
      0.423,
      0.3,
      0,
      true,
    );
    mouth.rotation.z = Math.PI;
    for (const side of [-1, 1]) {
      const ear = tube(head, "#e7ae42", side * 0.458, 0, 0, 0.17, 0.105);
      ear.rotation.z = Math.PI / 2;
      const pad = tube(head, "#ffe09c", side * 0.517, 0, 0, 0.115, 0.032);
      pad.rotation.z = Math.PI / 2;
      const center = tube(head, "#b87b29", side * 0.537, 0, 0, 0.068, 0.014);
      center.rotation.z = Math.PI / 2;
    }
    const band = part(
      head,
      new T.TorusGeometry(0.449, 0.028, 8, 32, Math.PI),
      "#eeb94e",
      0,
      0.025,
      0,
      0.3,
      0.45,
    );
    band.rotation.y = Math.PI / 2;
    const tuft = joint(head, 0, 0.38, 0);
    for (const [x, r, h, a] of [
      [-0.06, 0.057, 0.19, 0.35],
      [0, 0.07, 0.28, -0.12],
      [0.066, 0.045, 0.17, -0.4],
    ]) {
      const m = part(
        tuft,
        new T.ConeGeometry(r, h, 12),
        "#5ae0cd",
        x,
        h * 0.35,
        0,
        0.45,
      );
      m.rotation.z = a;
    }
    round(torso, "#dcb661", 0, 0.32, 0.234, 0.035, 0.44, 0.025, 0.01);
    for (const x of [-0.08, 0.08])
      round(torso, "#e8c788", x, 0.48, 0.228, 0.015, 0.16, 0.024, 0.005);
    // Rear energy capsule gives a readable third-person identity.
    round(torso, "#172b37", 0, 0.29, -0.265, 0.39, 0.39, 0.17, 0.09);
    const backRing = part(
      torso,
      new T.TorusGeometry(0.115, 0.028, 8, 28),
      "#e5b660",
      0,
      0.31,
      -0.362,
      0.4,
      0.4,
    );
    backRing.rotation.y = Math.PI;
    part(
      torso,
      new T.CircleGeometry(0.085, 24),
      "#62ebd4",
      0,
      0.31,
      -0.364,
      0.4,
      0,
      true,
    ).rotation.y = Math.PI;
    for (const x of [-0.21, 0.21])
      round(torso, "#e2b35b", x, 0.29, -0.287, 0.035, 0.28, 0.08, 0.014);
    rig.userData.tuft = tuft;
  } else {
    orb(head, "#d9a484", 0, -0.025, 0, 0.247, 0.29, 0.235);
    orb(
      head,
      type === "vitalii" ? "#534331" : "#2c292b",
      0,
      0.15,
      -0.045,
      0.26,
      0.17,
      0.23,
    );
    for (const x of [-0.09, 0.09])
      orb(head, "#26343d", x, 0.015, 0.219, 0.037, 0.029, 0.019);
    orb(head, "#c58a70", 0, -0.04, 0.23, 0.036, 0.044, 0.046);
    if (npc) {
      round(torso, "#d8bf93", 0, 0.2, 0.225, 0.42, 0.49, 0.055);
      round(head, "#f0dcb8", 0, 0.22, 0, 0.51, 0.11, 0.43);
    } else if (type === "hero") {
      round(torso, "#d69f50", -0.18, 0.36, 0.19, 0.13, 0.15, 0.035);
    } else {
      round(torso, "#78a7b0", 0, 0.28, 0.24, 0.08, 0.38, 0.02);
    }
  }
  const legs = [],
    arms = [];
  for (const side of [-1, 1]) {
    const hip = joint(rig, side * 0.185, -0.02, 0),
      knee = joint(hip, 0, -0.29, 0),
      ankle = joint(knee, 0, -0.29, 0);
    orb(hip, coat, 0, -0.14, 0, 0.135, 0.19, 0.14);
    orb(knee, "#263844", 0, -0.12, 0, 0.12, 0.16, 0.12);
    round(ankle, "#243a43", 0, 0.015, 0.055, 0.28, 0.17, 0.43, 0.065);
    round(
      ankle,
      robot ? "#e6b557" : "#a5b8b4",
      0,
      -0.051,
      0.068,
      0.285,
      0.06,
      0.435,
      0.02,
    );
    round(ankle, "#80dfcb", 0, -0.076, 0.072, 0.25, 0.018, 0.35, 0.005);
    const shoulder = joint(torso, side * 0.335, 0.51, 0),
      elbow = joint(shoulder, 0, -0.24, 0),
      hand = joint(elbow, 0, -0.22, 0);
    orb(shoulder, coat, 0, -0.09, 0, 0.14, 0.18, 0.145);
    orb(elbow, coat, 0, -0.09, 0, 0.11, 0.145, 0.115);
    tube(elbow, "#d4ad60", 0, -0.175, 0, 0.116, 0.047);
    orb(hand, npc ? "#d7a17c" : "#263e47", 0, -0.03, 0, 0.13, 0.13, 0.13);
    legs.push({ hip, knee, ankle, side });
    arms.push({ shoulder, elbow, side });
  }
  root.userData.rig = {
    rig,
    torso,
    head,
    eyes,
    legs,
    arms,
    phase: 0,
    landing: 0,
    wasGrounded: true,
    previousSpeed: 0,
    jumpFlash: 0,
  };
  return root;
}
export function animateActor(
  root,
  {
    dt,
    time,
    speed = 0,
    grounded = true,
    vy = 0,
    crouch = false,
    jumpEvent = false,
    jumpCount = 0,
  },
) {
  const r = root.userData.rig;
  if (!r) return;
  const moving = Math.min(1, speed / 5);
  r.phase += speed * dt * 2.65;
  if (grounded && !r.wasGrounded) r.landing = 0.19;
  if (jumpEvent) r.jumpFlash = 0.15;
  r.wasGrounded = grounded;
  r.landing = Math.max(0, r.landing - dt);
  r.jumpFlash = Math.max(0, r.jumpFlash - dt);
  const impact = Math.sin((Math.PI * r.landing) / 0.19) * 0.1,
    breath = Math.sin(time * 2) * 0.012;
  const bob = grounded ? Math.abs(Math.cos(r.phase)) * 0.023 * moving : 0;
  r.rig.position.y =
    0.64 +
    bob +
    breath -
    impact -
    Math.sin((Math.PI * r.jumpFlash) / 0.15) * 0.06 -
    (crouch ? 0.12 : 0);
  r.torso.rotation.z = Math.sin(r.phase) * 0.045 * moving * (grounded ? 1 : 0);
  r.torso.rotation.y = Math.sin(r.phase) * 0.055 * moving;
  const accel = (speed - r.previousSpeed) / Math.max(dt, 0.001);
  r.previousSpeed = speed;
  r.torso.rotation.x = T.MathUtils.damp(
    r.torso.rotation.x,
    grounded
      ? 0.09 * moving + Math.max(-0.08, Math.min(0.09, accel * 0.006))
      : vy > 0
        ? -0.08
        : 0.1,
    12,
    dt,
  );
  r.head.rotation.x = T.MathUtils.damp(
    r.head.rotation.x,
    impact * 1.5 + (grounded ? -0.025 * Math.sin(time * 1.8) : -0.08),
    10,
    dt,
  );
  r.head.rotation.y = Math.sin(time * 0.8) * 0.045 * (1 - moving);
  const blink = Math.sin(time * 1.65) > 0.995 ? 0.12 : 1;
  for (const e of r.eyes)
    e.scale.y = T.MathUtils.damp(e.scale.y, blink, 35, dt);
  if (r.rig.userData.tuft)
    r.rig.userData.tuft.rotation.x = Math.sin(time * 3) * 0.065 + moving * 0.1;
  for (const leg of r.legs) {
    const ph = r.phase + (leg.side === 1 ? Math.PI : 0),
      swing = Math.max(0, Math.cos(ph));
    let z = Math.sin(ph) * 0.24 * moving,
      y =
        -0.56 -
        bob -
        breath +
        impact +
        (crouch ? 0.12 : 0) +
        Math.pow(swing, 1.5) * 0.13 * moving;
    if (!grounded) {
      z = leg.side * (vy > 0 ? (jumpCount > 1 ? 0.15 : 0.09) : 0.035);
      y = vy > 0 ? -0.39 : -0.51;
    }
    const l = 0.29,
      d = Math.min(0.579, Math.max(0.25, Math.hypot(y, z))),
      knee = Math.acos(
        T.MathUtils.clamp((d * d - 2 * l * l) / (2 * l * l), -1, 1),
      ),
      hip = -Math.atan2(z, -y) - knee / 2;
    leg.hip.rotation.x = T.MathUtils.damp(leg.hip.rotation.x, hip, 30, dt);
    leg.knee.rotation.x = T.MathUtils.damp(leg.knee.rotation.x, knee, 30, dt);
    leg.ankle.rotation.x =
      -leg.hip.rotation.x -
      leg.knee.rotation.x +
      (swing > 0.3 ? -0.12 * moving : 0);
  }
  for (const arm of r.arms) {
    const ph = r.phase + (arm.side === 1 ? Math.PI : 0);
    arm.shoulder.rotation.x = grounded
      ? Math.sin(ph) * 0.55 * moving
      : vy > 0
        ? -0.85
        : 0.4;
    arm.shoulder.rotation.z = arm.side * (0.08 + (grounded ? 0.02 : 0.24));
    arm.elbow.rotation.x = grounded
      ? -0.18 - Math.max(0, -Math.sin(ph)) * 0.4 * moving
      : -0.65;
  }
}
