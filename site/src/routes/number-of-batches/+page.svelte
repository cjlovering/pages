<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const code = `for batch in range(num_data // batch_size + (num_data % batch_size > 0)):
    ...`;
</script>

<svelte:head><title>Number of Batches</title></svelte:head>

<article class="relative max-w-prose mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-serif font-normal mb-1 text-ink">Number of Batches</h1>
		<p class="text-ink-3 text-[1.05rem] leading-relaxed">Get the correct iteration count, including the remainder batch.</p>
	</header>
	<section>
		<CodeBlock lang="python" {code} />
		<p>First get the number of full batches (<code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">num_data // batch_size</code>), then add 1 if there are remaining data points (<code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">num_data % batch_size > 0</code>).</p>
		<p class="text-ink-4 text-[0.8rem] mt-4">
			<a href="https://gist.github.com/cjlovering/b2c1b389dea999be6dea4e6f6f48be06" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
