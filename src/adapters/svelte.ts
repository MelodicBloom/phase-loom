import { mount, unmount } from "svelte";
import Loom from "./Loom.svelte";
import type { LoomState } from "../core";
export function mountSvelte(container: HTMLElement, state: LoomState) {
  const component = mount(Loom, { target: container, props: { state } });
  return () => {
    void unmount(component);
  };
}
