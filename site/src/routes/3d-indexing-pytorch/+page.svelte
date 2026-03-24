<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const code = `batch_size, seq_len, embed_dim = output.size()
selected = output[
    torch.arange(batch_size),
    indices,
    ...,
]`;
</script>

<svelte:head><title>3-D Indexing with PyTorch</title></svelte:head>

<article class="relative max-w-prose mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-serif font-normal mb-1 text-ink">3-D Indexing with PyTorch</h1>
		<p class="text-ink-3 text-[1.05rem] leading-relaxed">Select a subset of vectors from a 3-D tensor&mdash;useful for picking the final output from packed sequences of different lengths.</p>
	</header>
	<section>
		<p>Set the indices to be the lengths of each sequence in the batch. (Normally you can use pack/unpack in PyTorch, but this does not yet work with transformers.)</p>
		<CodeBlock lang="python" {code} />
		<p class="text-ink-4 text-[0.8rem]">
			<a href="https://gist.github.com/cjlovering/6d25425d92ec2d1109d80566be4e46b8" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
