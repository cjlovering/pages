<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';
</script>

<svelte:head><title>Readable File/Folder Sizes</title></svelte:head>

<article class="relative max-w-prose mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-serif font-normal mb-1 text-ink">Readable File/Folder Sizes</h1>
		<p class="text-ink-3 text-[1.05rem] leading-relaxed">Human-readable sizes for files in the current directory.</p>
	</header>
	<section>
		<CodeBlock lang="bash" code={`du -h`} />
		<p class="text-ink-4 text-[0.8rem]">
			<a href="https://gist.github.com/cjlovering/edc090f2fc8d533f7189c59c9ebd4f4d" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
