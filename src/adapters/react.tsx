import { useEffect, useRef, createElement } from "react";
import { createRoot } from "react-dom/client";
import "../element";
import type { PhaseLoomElement } from "../element";
import type { LoomState } from "../core";

export function Loom({ state }: { state: LoomState }) {
  const ref = useRef<PhaseLoomElement>(null);
  useEffect(() => {
    ref.current?.configure(state);
  }, [state]);
  return createElement("phase-loom", {
    ref,
    style: { display: "block", width: "100%", height: "100%" },
  });
}
export function mountReact(container: HTMLElement, state: LoomState) {
  const root = createRoot(container);
  root.render(<Loom state={state} />);
  return () => root.unmount();
}
