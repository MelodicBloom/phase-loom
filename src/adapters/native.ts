import "../element";
import type { LoomState } from "../core";
export function mountNative(container: HTMLElement, state: LoomState) {
  const element = document.createElement("phase-loom");
  element.configure(state);
  container.append(element);
  return () => element.remove();
}
