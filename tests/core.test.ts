import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalize,
  DEFAULT,
  FIXTURES,
  History,
  serialize,
  parse,
  infer,
  descriptor,
  energy,
} from "../src/core.ts";

test("bounds and invalid values produce finite legal configurations", () => {
  for (let i = 0; i < 10000; i++) {
    const v = [NaN, Infinity, -Infinity, "x", null, undefined, i - 5000][i % 7];
    const s = normalize({
      aperture: v,
      phase: v,
      ratio: v,
      tick: v,
      yaw: v,
      pitch: v,
    });
    for (const n of Object.values(s)) assert.ok(Number.isFinite(n));
    assert.ok(s.aperture >= 0 && s.aperture <= 8);
    assert.ok(s.phase >= 0 && s.phase < 12);
    assert.ok(s.ratio >= 0 && s.ratio < 3);
    assert.ok(s.tick >= 0 && s.tick < 720);
  }
  assert.equal(normalize({ aperture: 99, phase: 13, tick: -1 }).aperture, 8);
  assert.equal(normalize({ aperture: 99, phase: 13, tick: -1 }).phase, 1);
  assert.equal(normalize({ tick: -1 }).tick, 719);
});
test("100 replay and edit/undo sequences restore exact state", () => {
  for (let trace = 0; trace < 100; trace++) {
    const history = new History(DEFAULT);
    for (let step = 0; step < 30; step++)
      history.commit({
        ...history.state,
        aperture: (step + trace) % 9,
        phase: step % 12,
        tick: step * 13,
      });
    const end = serialize(history.state);
    for (let step = 0; step < 30; step++) history.undo();
    assert.deepEqual(history.state, DEFAULT);
    for (let step = 0; step < 30; step++) history.redo();
    assert.equal(serialize(history.state), end);
    assert.deepEqual(parse(end), history.state);
  }
});
test("bounded inference recovers all 324 distinct fixture descriptors", () => {
  for (let aperture = 0; aperture < 9; aperture++)
    for (let phase = 0; phase < 12; phase++)
      for (let ratio = 0; ratio < 3; ratio++) {
        const expected = normalize({ aperture, phase, ratio });
        const result = infer(descriptor(expected));
        assert.equal(result.candidates, 324);
        assert.ok(result.error < 1e-10);
        assert.deepEqual(descriptor(result.state), descriptor(expected));
      }
  for (const fixture of FIXTURES)
    assert.ok(energy(fixture.state) >= 0 && energy(fixture.state) <= 1);
});
test("invalid and version-mismatched links fall back to canonical state", () => {
  assert.deepEqual(parse("nonsense"), DEFAULT);
  assert.deepEqual(parse('{"v":42,"aperture":1}'), DEFAULT);
});

test("inspection lenses are bounded and survive state sharing", () => {
  assert.equal((normalize({ lens: 99 }) as any).lens, 3);
  assert.equal((parse(serialize(normalize({ lens: 2 }))) as any).lens, 2);
});
