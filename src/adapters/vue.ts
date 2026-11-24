import {
  createApp,
  defineComponent,
  h,
  onMounted,
  ref,
  watch,
  type PropType,
} from "vue";
import "../element";
import type { PhaseLoomElement } from "../element";
import type { LoomState } from "../core";
export const Loom = defineComponent({
  props: { state: { type: Object as PropType<LoomState>, required: true } },
  setup(props) {
    const element = ref<PhaseLoomElement>();
    onMounted(() => element.value?.configure(props.state));
    watch(
      () => props.state,
      (s) => element.value?.configure(s),
      { deep: true },
    );
    return () =>
      h("phase-loom", {
        ref: element,
        style: { display: "block", width: "100%", height: "100%" },
      });
  },
});
export function mountVue(container: HTMLElement, state: LoomState) {
  const app = createApp(Loom, { state });
  app.mount(container);
  return () => app.unmount();
}
