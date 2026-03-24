<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';
</script>

<svelte:head><title>Auto-Format Python Code on Save</title></svelte:head>

<article class="relative max-w-prose mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-serif font-normal mb-1 text-ink">Auto-Format Python Code on Save</h1>
		<p class="text-ink-3 text-[1.05rem] leading-relaxed">Consistently formatted code with no additional effort.</p>
	</header>
	<section>
		<ol class="list-decimal list-inside space-y-2 text-ink-2">
			<li>Install <code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">black</code> in your Python interpreter: <code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">pip install black</code></li>
			<li>In VS Code, navigate: Preferences &rarr; Settings.</li>
			<li>Set: Format provider &rarr; <code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">black</code>.</li>
			<li>Open <code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">settings.json</code> from the settings pane.</li>
			<li>Add the following line:</li>
		</ol>
		<CodeBlock lang="python" code={`"editor.formatOnSave": true`} />
		<p class="text-ink-4 text-[0.8rem]">
			<a href="https://gist.github.com/cjlovering/acde6e3f01b152ba11d309a25601c913" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
