<script lang="ts">
 import '../element';
 import type { PhaseLoomElement } from '../element';
 import type { LoomState } from '../core';
 let {state:config}:{state:LoomState}=$props();
 let element:PhaseLoomElement|undefined=$state();
 $effect(()=>element?.configure(config));
</script>
<phase-loom bind:this={element} style="display:block;width:100%;height:100%"></phase-loom>
