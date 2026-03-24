<!--
  Syntax-highlighted code block.
  Usage: <CodeBlock lang="python" code={`print("hi")`} />
-->
<script>
	import { onMount } from 'svelte';
	import hljs from 'highlight.js/lib/core';
	import python from 'highlight.js/lib/languages/python';
	import bash from 'highlight.js/lib/languages/bash';
	import latex from 'highlight.js/lib/languages/latex';

	hljs.registerLanguage('python', python);
	hljs.registerLanguage('bash', bash);
	hljs.registerLanguage('latex', latex);

	let { code, lang = '' } = $props();
	let el = $state();

	onMount(() => {
		if (el) hljs.highlightElement(el);
	});
</script>

<pre class="rounded-lg overflow-x-auto bg-surface-code border border-border text-[0.85rem] leading-relaxed my-6"><code bind:this={el} class="language-{lang} !bg-transparent block p-4">{code.trim()}</code></pre>
