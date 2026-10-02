import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
const materials = new Map();
function material(c, r = 0.8, m = 0) {
  const k = [c, r, m].join();
  if (!materials.has(k))
    materials.set(
      k,
      new T.MeshStandardMaterial({ color: c, roughness: r, metalness: m }),
    );
  return materials.get(k);
}
function mesh(p, g, c, x, y, z, r = 0.8, m = 0) {
  const a = new T.Mesh(g, material(c, r, m));
  a.position.set(x, y, z);
  a.castShadow = true;
  a.receiveShadow = true;
  p.add(a);
  return a;
}
const box = (p, c, x, y, z, w, h, d, r = 0.05) =>
  mesh(p, new RoundedBoxGeometry(w, h, d, 2, r), c, x, y, z);
const cyl = (p, c, x, y, z, rt, rb, h, n = 16) =>
  mesh(p, new T.CylinderGeometry(rt, rb, h, n), c, x, y, z);
function sphere(p, c, x, y, z, r) {
  const m = mesh(p, new T.SphereGeometry(r, 12, 8), c, x, y, z);
  return m;
}
function sign(
  p,
  text,
  x,
  y,
  z,
  w,
  h,
  bg = "#254f53",
  fg = "#fff1c7",
  sub = "",
) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 384;
  const g = c.getContext("2d");
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = fg;
  g.lineWidth = 6;
  g.strokeRect(18, 18, 988, 348);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = fg;
  g.font = "800 170px Georgia";
  g.fillText(text, 512, sub ? 150 : 200, 930);
  if (sub) {
    g.font = "500 38px sans-serif";
    g.fillText(sub, 512, 286, 890);
  }
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshStandardMaterial({ map: t, roughness: 0.7 }),
  );
  m.position.set(x, y, z);
  p.add(m);
  return m;
}
function archShape(w, h) {
  const s = new T.Shape(),
    r = w / 2;
  s.moveTo(-r, 0);
  s.lineTo(r, 0);
  s.lineTo(r, h - r);
  s.absarc(0, h - r, r, 0, Math.PI, false);
  s.lineTo(-r, 0);
  return s;
}
function windowArch(p, x, y, z, w, h) {
  mesh(
    p,
    new T.ExtrudeGeometry(archShape(w + 0.2, h + 0.13), {
      depth: 0.16,
      bevelEnabled: true,
      bevelSize: 0.045,
      bevelThickness: 0.03,
      bevelSegments: 2,
      steps: 1,
      curveSegments: 16,
    }),
    "#efddbb",
    x,
    y - 0.04,
    z,
  );
  mesh(
    p,
    new T.ShapeGeometry(archShape(w, h), 16),
    "#366871",
    x,
    y + 0.02,
    z + 0.2,
    0.25,
    0.25,
  );
  box(p, "#b99361", x, y + h * 0.46, z + 0.245, 0.07, h * 0.8, 0.08, 0.01);
  box(p, "#b99361", x, y + 0.83, z + 0.24, w, 0.065, 0.08, 0.01);
  box(p, "#f4e0b5", x, y - 0.05, z + 0.27, w + 0.33, 0.17, 0.35);
}
function planter(p, x, z, scale = 1) {
  const g = new T.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  p.add(g);
  cyl(g, "#c28660", 0, 0.28, 0, 0.43, 0.34, 0.56);
  cyl(g, "#e2aa78", 0, 0.52, 0, 0.46, 0.46, 0.1);
  cyl(g, "#615143", 0, 0.56, 0, 0.37, 0.37, 0.03);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4,
      r = 0.1 + (i % 3) * 0.06;
    const leaf = sphere(
      g,
      ["#3a796b", "#55977c", "#82ad81"][i % 3],
      Math.cos(a) * r,
      0.7 + (i % 2) * 0.12,
      Math.sin(a) * r,
      0.2,
    );
    leaf.scale.set(0.6, 1.4, 0.7);
    leaf.rotation.z = Math.sin(a) * 0.5;
  }
  for (let i = 0; i < 4; i++)
    sphere(
      g,
      ["#f1ca76", "#e39377"][i % 2],
      Math.sin(i * 3) * 0.23,
      0.94 + (i % 2) * 0.07,
      Math.cos(i * 3) * 0.2,
      0.075,
    );
}
function lamp(p, x, z) {
  cyl(p, "#31565b", x, 1.5, z, 0.055, 0.075, 3);
  cyl(p, "#4e6f6e", x, 0.15, z, 0.16, 0.19, 0.3);
  box(p, "#2e5358", x, 3.06, z, 0.38, 0.12, 0.38);
  cyl(p, "#f2cc85", x, 2.83, z, 0.16, 0.12, 0.38, 6);
  cyl(p, "#294f54", x, 3.22, z, 0.05, 0.33, 0.28, 6);
  for (const dx of [-0.14, 0.14])
    box(p, "#2e5358", x + dx, 2.83, z, 0.025, 0.4, 0.23, 0.005);
}
function tree(p, x, z, size = 1) {
  const g = new T.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(size);
  p.add(g);
  cyl(g, "#85735a", 0, 1, 0, 0.13, 0.2, 2.0, 9);
  for (const [a, y, r] of [
    [0, 2.5, 1],
    [2, 2.7, 0.85],
    [4.5, 2.9, 0.9],
    [1.2, 3.35, 0.75],
  ]) {
    const crown = sphere(
      g,
      ["#608d72", "#83a679", "#a8ba82"][Math.floor(y * 10) % 3],
      Math.cos(a) * 0.45,
      y,
      Math.sin(a) * 0.4,
      r,
    );
    crown.scale.y = 0.85;
  }
  box(g, "#c5b58f", 0, 0.12, 0, 1.8, 0.24, 1.8, 0.15);
}
function cafe(p, x, z, variant = 0) {
  const g = new T.Group();
  g.position.set(x, 0, z);
  g.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
  p.add(g);
  const walls = box(
    g,
    variant ? "#d4ba9c" : "#d79876",
    0,
    2.6,
    0,
    6.6,
    5.2,
    5.1,
    0.14,
  );
  walls.userData.cameraSolid = true;
  box(g, "#bc795b", 0, 0.36, 0, 6.75, 0.72, 5.22, 0.1);
  box(g, "#f5dfb7", 0, 3.22, 0, 6.82, 0.22, 5.32);
  box(g, "#f5dfb7", 0, 5.1, 0, 6.9, 0.26, 5.4);
  for (const xx of [-3.19, 3.19])
    box(g, "#efd9af", xx, 2.5, 2.65, 0.2, 4.85, 0.25);
  const roofShape = new T.Shape();
  roofShape.moveTo(-3.7, 0);
  roofShape.lineTo(3.7, 0);
  roofShape.lineTo(0, 1.4);
  roofShape.closePath();
  mesh(
    g,
    new T.ExtrudeGeometry(roofShape, { depth: 5.7, bevelEnabled: false }),
    "#426f73",
    0,
    5.18,
    -2.85,
  );
  for (let j = 0; j < 15; j++)
    box(
      g,
      "#568086",
      -3.45 + j * 0.49,
      5.23 + 1.4 * (1 - Math.abs(-3.45 + j * 0.49) / 3.7),
      0,
      0.065,
      0.07,
      5.75,
      0.018,
    );
  windowArch(g, -2.1, 0.67, 2.59, 1.2, 2.03);
  windowArch(g, 2.1, 0.67, 2.59, 1.2, 2.03);
  windowArch(g, -1.65, 3.55, 2.59, 1.05, 1.15);
  windowArch(g, 1.65, 3.55, 2.59, 1.05, 1.15);
  box(g, "#31585d", 0, 1.38, 2.68, 1.65, 2.55, 0.2, 0.06);
  box(g, "#86afb1", 0, 1.5, 2.81, 1.31, 1.94, 0.06, 0.02);
  box(g, "#deb879", 0, 1.47, 2.87, 0.075, 1.99, 0.08, 0.01);
  for (const xx of [-0.55, 0.55]) sphere(g, "#f6cf78", xx, 1.2, 2.92, 0.065);
  sign(
    g,
    variant ? "B R O V A R Y" : "PerkUp",
    0,
    3.04,
    3.06,
    3.05,
    0.79,
    "#284e53",
    "#ffe8bc",
    variant ? "МІСТО СВОЇХ ЛЮДЕЙ" : "COFFEE • NEIGHBOURS • EVERY DAY",
  );
  // Rounded cloth canopy with individual scalloped valance.
  for (let i = 0; i < 12; i++) {
    const xx = -2.82 + i * 0.515;
    const awning = box(
      g,
      i % 2 ? "#f4dda8" : "#c46f55",
      xx,
      2.64,
      3.25,
      0.53,
      0.115,
      1.27,
      0.025,
    );
    awning.rotation.x = 0.16;
    const val = cyl(
      g,
      i % 2 ? "#f4dda8" : "#c46f55",
      xx,
      2.42,
      3.88,
      0.265,
      0.265,
      0.055,
      16,
    );
    val.rotation.x = Math.PI / 2;
    val.scale.x = 1;
    val.scale.z = 0.55;
  }
  for (const xx of [-2.87, 2.87]) {
    box(g, "#37565b", xx, 1.24, 3.75, 0.07, 2.4, 0.07, 0.015);
  }
  // Cup sign has actual volume, handle, saucer, and coffee surface.
  const cup = new T.Group();
  cup.position.set(2.2, 4.08, 3.2);
  cup.rotation.z = -0.1;
  g.add(cup);
  cyl(cup, "#f8e5b6", 0, 0, 0, 0.32, 0.24, 0.5);
  cyl(cup, "#6a4639", 0, 0.253, 0, 0.27, 0.27, 0.015);
  const handle = mesh(
    cup,
    new T.TorusGeometry(0.18, 0.053, 8, 20),
    "#f8e5b6",
    0.32,
    0,
    0,
  );
  handle.rotation.y = Math.PI / 2;
  cyl(cup, "#e8bd73", 0, -0.29, 0, 0.45, 0.45, 0.05);
  // Café patio grouping keeps the movement route open.
  for (const xx of [-2.5]) {
    const table = cyl(g, "#ad7954", xx, 0.71, 4.55, 0.52, 0.52, 0.1);
    cyl(g, "#385457", xx, 0.34, 4.55, 0.06, 0.09, 0.65);
    for (const zz of [4.0, 5.1]) {
      box(g, "#b98558", xx, 0.4, zz, 0.6, 0.08, 0.53);
      box(
        g,
        "#b98558",
        xx,
        0.7,
        zz + (zz > 4.5 ? 0.21 : -0.21),
        0.6,
        0.49,
        0.06,
      );
      for (const dx of [-0.22, 0.22])
        box(g, "#355456", xx + dx, 0.2, zz, 0.045, 0.4, 0.38, 0.01);
    }
    cyl(g, "#f0ddb3", xx, 0.83, 4.55, 0.085, 0.07, 0.16);
  }
  planter(g, -3.12, 3.3, 0.8);
  planter(g, 3.12, 3.3, 0.8);
  const menu = new T.Group();
  menu.position.set(-1.45, 0, 4);
  menu.rotation.y = 0.15;
  g.add(menu);
  box(menu, "#bb895a", 0, 0.56, 0, 0.68, 1.13, 0.09);
  sign(menu, "КАВА", 0, 0.67, 0.053, 0.58, 0.43, "#254d4b", "#f3dfaf");
  sign(menu, "ЗАВЖДИ ПОРУЧ", 0, 0.32, 0.055, 0.58, 0.2, "#254d4b", "#f3dfaf");
  return walls;
}
export function buildPlaza(scene) {
  const g = new T.Group();
  scene.add(g);
  const walls = [];
  // Instanced tactile paving: geometry relief and coherent restrained color variation.
  const geo = new RoundedBoxGeometry(0.64, 0.08, 0.42, 1, 0.025),
    count = 15 * 72;
  const paving = new T.InstancedMesh(geo, material("#b9b0a3"), count);
  const dummy = new T.Object3D(),
    color = new T.Color();
  let idx = 0;
  for (let z = 0; z < 72; z++)
    for (let x = 0; x < 15; x++) {
      dummy.position.set(
        (x - 7) * 0.665 + (z % 2) * 0.18,
        -0.04,
        -5 + z * 0.438,
      );
      dummy.rotation.y = Math.sin(x * 7 + z * 11) * 0.009;
      dummy.updateMatrix();
      paving.setMatrixAt(idx, dummy.matrix);
      color.set(
        ["#b1aaa0", "#c2b7a6", "#bdb3a4", "#aca79b"][(x * 17 + z * 7) % 4],
      );
      paving.setColorAt(idx++, color);
    }
  paving.receiveShadow = true;
  g.add(paving);
  for (const side of [-1, 1]) {
    box(g, "#d8c5a2", side * 5.12, 0.04, 10, 0.25, 0.2, 31, 0.05);
    box(g, "#b8b59d", side * 6.2, -0.01, 10, 1.9, 0.18, 31, 0.05);
  }
  walls.push(cafe(g, -8.2, 7));
  walls.push(cafe(g, 9.1, 16, true));
  for (const [x, z, s] of [
    [6.3, -1, 1.15],
    [-6.4, -3, 1.2],
    [6.4, 8, 1],
    [-6.2, 21, 1.15],
    [6.4, 24, 1.1],
  ])
    tree(g, x, z, s);
  for (const [x, z] of [
    [5.3, 3],
    [-5.3, 16],
    [5.3, 23],
  ])
    lamp(g, x, z);
  for (const [x, z] of [
    [5.8, 4.5],
    [5.8, 5.8],
    [-5.8, 18.6],
  ])
    planter(g, x, z, 0.8);
  // A rear courtyard wall and planted arch close the otherwise empty horizon.
  box(g, "#9ead95", 0, 0.72, -6.6, 18, 1.45, 0.5, 0.15);
  for (const x of [-7, -3, 3, 7]) {
    box(g, "#d4c5a0", x, 1.02, -6.5, 0.55, 2.04, 0.75, 0.08);
    sphere(g, "#d9c599", x, 2.17, -6.5, 0.31);
  }
  for (let i = 0; i < 8; i++)
    sphere(g, "#86a180", -7 + i * 2, 1.3, -6.75, 0.95);
  // Strings of lanterns frame the scene above the playable clearance.
  for (const z of [1, 18]) {
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(-7, 5, z),
      new T.Vector3(0, 4.2, z),
      new T.Vector3(7, 5, z),
    ]);
    mesh(g, new T.TubeGeometry(curve, 24, 0.018, 4, false), "#4e6460", 0, 0, 0);
    for (let i = 1; i < 10; i++) {
      const v = curve.getPoint(i / 10);
      sphere(g, "#f8d9a3", v.x, v.y - 0.12, v.z, 0.095);
    }
  }
  // Batch immutable decorative geometry by material; retain solids and textured signage.
  g.updateMatrixWorld(true);
  const batches = new Map(),
    remove = [];
  g.traverse((o) => {
    if (
      !o.isMesh ||
      o.isInstancedMesh ||
      o.userData.cameraSolid ||
      o.material.map
    )
      return;
    const k = o.material.uuid;
    if (!batches.has(k))
      batches.set(k, { material: o.material, geometries: [] });
    const geom = o.geometry.index
      ? o.geometry.toNonIndexed()
      : o.geometry.clone();
    geom.applyMatrix4(o.matrixWorld);
    batches.get(k).geometries.push(geom);
    remove.push(o);
  });
  for (const o of remove) o.parent.remove(o);
  for (const b of batches.values()) {
    const merged = mergeGeometries(b.geometries, false);
    const m = new T.Mesh(merged, b.material);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    for (const geom of b.geometries) geom.dispose();
  }
  return {
    walls,
    solid: [
      { x: -8.2, y: 2.6, z: 7, w: 5.1, h: 5.2, d: 6.6 },
      { x: 9.1, y: 2.6, z: 16, w: 5.1, h: 5.2, d: 6.6 },
    ],
  };
}
