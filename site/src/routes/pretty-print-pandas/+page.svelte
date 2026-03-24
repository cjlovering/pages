<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const code = `def func(args):
    ...
    data  # pd.DataFrame
    display(data)
    ...`;
</script>

<svelte:head><title>Pretty-Print Pandas in Notebooks</title></svelte:head>

<article class="relative max-w-prose mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-serif font-normal mb-1 text-ink">Pretty-Print Pandas in Notebooks</h1>
		<p class="text-ink-3 text-[1.05rem] leading-relaxed">Use <code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">display()</code> to see a pandas table HTML-formatted anywhere in a cell, not just as the last expression.</p>
	</header>
	<section>
		<CodeBlock lang="python" {code} />
		<p class="text-ink-4 text-[0.8rem]">
			<a href="https://gist.github.com/cjlovering/0aec32562d7c8a8edaafc0f11026a837" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
