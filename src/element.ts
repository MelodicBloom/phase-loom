import { DEFAULT, normalize, type LoomState } from "./core";
import { mountLoom, type Engine } from "./engine";

export class PhaseLoomElement extends HTMLElement {
  canvas = document.createElement("canvas");
  engine?: Engine;
  state: LoomState = { ...DEFAULT };
  ready = false;
  private observer?: ResizeObserver;
  private dirty = true;
  private frame = 0;
  private reduced = matchMedia("(prefers-reduced-motion: reduce)");
  connectedCallback() {
    this.style.display ||= "block";
    this.style.width ||= "100%";
    this.style.height ||= "100%";
    this.setAttribute("role", "img");
    this.setAttribute(
      "aria-label",
      "Ribbed optical aperture. Use the labelled controls to change its geometry.",
    );
    this.canvas.style.cssText = "width:100%;height:100%;display:block;";
    this.replaceChildren(this.canvas);
    this.canvas.addEventListener("webglcontextlost", this.lost);
    this.canvas.addEventListener("webglcontextrestored", this.restored);
    this.setup();
    this.observer = new ResizeObserver(() => {
      this.engine?.resize();
      this.invalidate();
    });
    this.observer.observe(this);
    this.reduced.addEventListener("change", this.preference);
  }
  private preference = () =>
    this.dispatchEvent(
      new CustomEvent("motionpreference", { detail: this.reduced.matches }),
    );
  private lost = (event: Event) => {
    event.preventDefault();
    this.ready = false;
    this.dataset.status = "context-lost";
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.dispatchEvent(
      new CustomEvent("renderstatus", { detail: "context-lost" }),
    );
  };
  private restored = () => {
    this.ready = true;
    this.dataset.status = "ready";
    this.engine?.update(this.state);
    this.engine?.resize();
    this.invalidate();
    this.dispatchEvent(new CustomEvent("renderstatus", { detail: "ready" }));
  };
  private setup() {
    try {
      if (new URLSearchParams(location.search).has("fallback"))
        throw Error("Fallback requested");
      this.engine = mountLoom(this.canvas, this.state);
      this.ready = true;
      this.dataset.status = "ready";
      this.dispatchEvent(new CustomEvent("renderstatus", { detail: "ready" }));
      this.invalidate();
    } catch (error) {
      this.ready = false;
      this.dataset.status = "unsupported";
      this.innerHTML = `<div class="fallback"><svg viewBox="0 0 400 400" aria-hidden="true"><defs><linearGradient id="copper"><stop stop-color="#e1ab7c"/><stop offset=".6" stop-color="#703d2c"/><stop offset="1" stop-color="#4267a8"/></linearGradient></defs><g fill="none" stroke="url(#copper)" stroke-width="1.2">${Array.from({ length: 44 }, (_, i) => `<ellipse cx="200" cy="200" rx="${105 + i * 0.8}" ry="${42 + i * 1.3}" transform="rotate(${i * 4.1} 200 200)"/>`).join("")}</g></svg><p>Static study · WebGL2 unavailable</p><small>Parameter controls and JSON export remain available. This illustration is not a shader render.</small></div>`;
      this.dispatchEvent(
        new CustomEvent("renderstatus", { detail: "unsupported" }),
      );
      console.warn(String(error));
    }
  }
  configure(value: unknown) {
    this.state = normalize(value);
    this.engine?.update(this.state);
    this.invalidate();
  }
  invalidate() {
    this.dirty = true;
    if (!this.frame)
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        if (this.dirty && this.ready) {
          this.engine?.render();
          this.dirty = false;
        }
      });
  }
  capture() {
    return this.ready ? this.engine?.capture() : undefined;
  }
  diagnostics() {
    return this.engine?.info() ?? { renderer: "static fallback" };
  }
  disconnectedCallback() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.observer?.disconnect();
    this.reduced.removeEventListener("change", this.preference);
    this.canvas.removeEventListener("webglcontextlost", this.lost);
    this.canvas.removeEventListener("webglcontextrestored", this.restored);
    this.engine?.dispose();
    this.engine = undefined;
    this.ready = false;
  }
}
if (!customElements.get("phase-loom"))
  customElements.define("phase-loom", PhaseLoomElement);
declare global {
  interface HTMLElementTagNameMap {
    "phase-loom": PhaseLoomElement;
  }
}
