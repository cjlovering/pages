<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const code = `filled_markers = ('o', 'v', '^', '<', '>', '8', 's', 'p', '*', 'h', 'H', 'D', 'd', 'P', 'X')
sns.lineplot(data=df, markers=filled_markers, dashes=False)`;
</script>

<svelte:head><title>Fix "Too Many Values" for Seaborn</title></svelte:head>

<article class="relative max-w-prose mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-serif font-normal mb-1 text-ink">Fix "Too Many Values" for Seaborn</h1>
		<p class="text-ink-3 text-[1.05rem] leading-relaxed">When you have more than 6 style values, add <code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">dashes=False</code> and set the markers explicitly.</p>
	</header>
	<section>
		<CodeBlock lang="python" {code} />
		<p class="text-ink-4 text-[0.8rem]">
			<a href="https://gist.github.com/cjlovering/af6294a02c996eda450056a427b62625" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
