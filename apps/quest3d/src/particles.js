import * as T from "three";
export function createParticles(scene) {
  const capacity = 100,
    geometry = new T.IcosahedronGeometry(1, 0),
    material = new T.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
  const mesh = new T.InstancedMesh(geometry, material, capacity);
  mesh.frustumCulled = false;
  scene.add(mesh);
  const items = Array.from({ length: capacity }, () => ({ life: 0 })),
    dummy = new T.Object3D(),
    color = new T.Color();
  let cursor = 0,
    seed = 37;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return {
    burst(x, y, z, kind = "gold", count = 10) {
      for (let n = 0; n < count; n++) {
        const a = items[cursor++ % capacity];
        Object.assign(a, {
          x,
          y,
          z,
          vx: (rand() - 0.5) * 2,
          vz: (rand() - 0.5) * 2,
          vy: kind === "dust" ? 0.3 + rand() * 0.4 : 1 + rand() * 1.6,
          life: 0.45 + rand() * 0.25,
          max: 0.7,
          size: kind === "dust" ? 0.09 : 0.065,
          color:
            kind === "gold"
              ? "#ffdc84"
              : kind === "energy"
                ? "#7af5df"
                : "#d4c5a8",
        });
      }
    },
    update(dt) {
      items.forEach((a, i) => {
        if (a.life > 0) {
          a.life -= dt;
          a.x += a.vx * dt;
          a.y += a.vy * dt;
          a.z += a.vz * dt;
          a.vy -= 2.5 * dt;
          dummy.position.set(a.x, a.y, a.z);
          dummy.rotation.set(a.life * 3, a.life * 5, 0);
          dummy.scale.setScalar(a.size * Math.max(0, a.life / a.max));
          color.set(a.color);
        } else dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, color);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
    },
  };
}
