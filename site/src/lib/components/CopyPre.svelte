<!--
  Wraps a <pre> block with a copy button that reads textContent at click time.
  Usage:
    <CopyPre>
      <pre ...><code>...</code></pre>
    </CopyPre>
-->
<script>
	import CopyButton from './CopyButton.svelte';

	let { children } = $props();
	let wrapper = $state();
</script>

<div class="relative group" bind:this={wrapper}>
	<CopyButton container={wrapper} />
	{@render children()}
</div>
