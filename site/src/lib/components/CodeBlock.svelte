<!--
  Syntax-highlighted code block with copy button.
  Usage: <CodeBlock lang="python" code={`print("hi")`} />
-->
<script>
	import { onMount } from 'svelte';
	import hljs from 'highlight.js/lib/core';
	import CopyButton from './CopyButton.svelte';

	let { code, lang = '' } = $props();
	let el = $state();

	onMount(() => {
		if (el) hljs.highlightElement(el);
	});
</script>

<div class="relative group my-6">
	<CopyButton text={code.trim()} />
	<pre class="rounded-lg overflow-x-auto bg-surface-code border border-border text-[0.85rem] leading-relaxed"><code bind:this={el} class="language-{lang} !bg-transparent block p-4">{code.trim()}</code></pre>
</div>
