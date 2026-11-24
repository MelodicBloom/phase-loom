export interface LoomState {
  aperture: number;
  phase: number;
  ratio: number;
  tick: number;
  yaw: number;
  pitch: number;
  lens: number;
}
export const DEFAULT: Readonly<LoomState> = Object.freeze({
  aperture: 8,
  phase: 4,
  ratio: 1,
  tick: 0,
  yaw: 0,
  pitch: 0,
  lens: 0,
});
const finite = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const wrap = (n: number, max: number) => ((n % max) + max) % max;
export function normalize(input: unknown): LoomState {
  const v = (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;
  return {
    aperture: clamp(finite(v.aperture, DEFAULT.aperture), 0, 8),
    phase: wrap(finite(v.phase, DEFAULT.phase), 12),
    ratio: clamp(finite(v.ratio, DEFAULT.ratio), 0, 2),
    tick: wrap(finite(v.tick, 0), 720),
    yaw: clamp(finite(v.yaw, 0), -60, 60),
    pitch: clamp(finite(v.pitch, 0), -45, 45),
    lens: clamp(finite(v.lens, 0), 0, 3),
  };
}
export const FIXTURES = [
  {
    id: "F01",
    name: "Closed Weave",
    state: normalize({ aperture: 0, phase: 0, ratio: 0 }),
  },
  {
    id: "F02",
    name: "Counterphase",
    state: normalize({ aperture: 4, phase: 6, ratio: 2 }),
  },
  { id: "F03", name: "Open Fold", state: normalize(DEFAULT) },
];
export class History {
  state: LoomState;
  past: LoomState[] = [];
  future: LoomState[] = [];
  constructor(initial: unknown = DEFAULT) {
    this.state = normalize(initial);
  }
  commit(next: unknown) {
    const value = normalize(next);
    if (serialize(value) === serialize(this.state)) return;
    this.past.push({ ...this.state });
    if (this.past.length > 100) this.past.shift();
    this.future = [];
    this.state = value;
  }
  undo() {
    const previous = this.past.pop();
    if (previous) {
      this.future.push({ ...this.state });
      this.state = previous;
    }
  }
  redo() {
    const next = this.future.pop();
    if (next) {
      this.past.push({ ...this.state });
      this.state = next;
    }
  }
}
export function serialize(state: LoomState): string {
  return JSON.stringify({ v: 1, ...normalize(state) });
}
export function parse(raw: string): LoomState {
  try {
    const v = JSON.parse(raw);
    return v.v === 1 ? normalize(v) : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}
// A structural parameter descriptor, NOT an image encoder or a physical measurement.
export function descriptor(s: LoomState): number[] {
  const p = (s.phase * Math.PI) / 6;
  return [s.aperture / 8, Math.cos(p), Math.sin(p), s.ratio / 2];
}
export function infer(target: number[]) {
  let best = normalize(DEFAULT),
    error = Infinity;
  let candidates = 0;
  for (let aperture = 0; aperture < 9; aperture++)
    for (let phase = 0; phase < 12; phase++)
      for (let ratio = 0; ratio < 3; ratio++) {
        const state = normalize({ aperture, phase, ratio });
        const d = descriptor(state);
        const e = Math.sqrt(
          d.reduce((sum, x, i) => sum + (x - target[i]) ** 2, 0) / 4,
        );
        candidates++;
        if (e < error) {
          best = state;
          error = e;
        }
      }
  return { state: best, error, candidates };
}
// Dimensionless visual fold tension, not physical energy.
export function energy(s: LoomState) {
  return (
    0.45 * (1 - s.aperture / 8) +
    (0.35 * (1 + Math.sin((s.phase * Math.PI) / 6))) / 2 +
    (0.2 * s.ratio) / 2
  );
}
