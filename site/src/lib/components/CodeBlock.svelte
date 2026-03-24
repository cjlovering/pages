<!--
  Syntax-highlighted code block.
  Usage: <CodeBlock lang="python" code={`print("hi")`} />
-->
<script>
	import { onMount } from 'svelte';
	import hljs from 'highlight.js/lib/core';

	let { code, lang = '' } = $props();
	let el = $state();

	onMount(() => {
		if (el) hljs.highlightElement(el);
	});
</script>

<pre class="rounded-lg overflow-x-auto bg-surface-code border border-border text-[0.85rem] leading-relaxed my-6"><code bind:this={el} class="language-{lang} !bg-transparent block p-4">{code.trim()}</code></pre>
