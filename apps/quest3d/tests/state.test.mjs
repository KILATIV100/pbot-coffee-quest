import test from "node:test";
import assert from "node:assert/strict";
import {
  fresh,
  clean,
  command,
  reward,
  upgrade,
  load,
  persist,
  migratePreferences,
  SAVE_KEY,
  LEGACY_KEY,
} from "../src/state.js";
test("ordered missions, unique items, terminal gating and immutable 2D save", () => {
  const s = fresh();
  assert.equal(command(s, "activate"), false);
  command(s, "accept-coffee");
  assert.equal(command(s, "handin-coffee"), false);
  s.beans = [0, 1, 2, 3, 4, 5, 6, 7];
  command(s, "handin-coffee");
  assert.equal(s.tokens, 1);
  command(s, "handin-coffee");
  assert.equal(s.tokens, 1);
  command(s, "accept-news");
  for (const id of ["notice", "route", "signature", "notice"])
    command(s, "shard:" + id);
  assert.equal(s.q.shards.length, 3);
  command(s, "handin-news");
  command(s, "accept-shoes");
  assert.equal(command(s, "handin-shoes"), false);
  command(s, "parcel");
  command(s, "handin-shoes");
  command(s, "activate");
  assert.equal(s.q.phase, 7);
  assert.equal(s.tokens, 3);
  const old = JSON.stringify({ selected: "vitalii", tokens: 100 });
  const data = new Map([[LEGACY_KEY, old]]);
  const storage = {
    getItem: (k) => data.get(k),
    setItem: (k, v) => data.set(k, v),
  };
  migratePreferences(storage, s);
  persist(storage, s);
  assert.equal(data.get(LEGACY_KEY), old);
  assert.equal(load(storage).selected, "vitalii");
  assert.equal(load(storage).tokens, 3);
  assert.notEqual(SAVE_KEY, LEGACY_KEY);
});
test("sanitation, storage failure and earned upgrades", () => {
  const s = clean({
    version: 3,
    q: { phase: 7 },
    tokens: Infinity,
    beans: [0, 0, -1, 100, "1"],
    upgrades: { jump: 200 },
    checkpoint: 900,
    complete: true,
  });
  assert.equal(s.q.phase, 3);
  assert.equal(s.complete, false);
  assert.deepEqual(s.beans, [0]);
  assert.equal(s.tokens, 0);
  assert.equal(s.upgrades.jump, 5);
  assert.equal(s.checkpoint, 0);
  assert.equal(upgrade(s, "speed"), false);
  reward(s, "coffee", 2);
  assert.equal(upgrade(s, "speed"), true);
  assert.equal(s.tokens, 0);
  assert.equal(reward(s, "coffee", 2), false);
  assert.equal(
    persist(
      {
        setItem() {
          throw Error();
        },
      },
      s,
    ),
    false,
  );
  assert.deepEqual(
    load({
      getItem() {
        throw Error();
      },
    }),
    fresh(),
  );
});
