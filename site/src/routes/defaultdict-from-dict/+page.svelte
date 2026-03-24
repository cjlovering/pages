<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const code = `from collections import defaultdict
x = {"1": 1, "2": 2}
defaultdict(int, x)`;
</script>

<svelte:head><title>Build a DefaultDict from a Dict</title></svelte:head>

<article class="relative max-w-prose mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-serif font-normal mb-1 text-ink">Build a DefaultDict from a Dict</h1>
		<p class="text-ink-3 text-[1.05rem] leading-relaxed">Initialize a <code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">defaultdict</code> with existing data in one line.</p>
	</header>
	<section>
		<CodeBlock lang="python" {code} />
		<p class="text-ink-4 text-[0.8rem]">
			<a href="https://gist.github.com/cjlovering/dcbdf9850648d4c4e89ae7947ceed255" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
