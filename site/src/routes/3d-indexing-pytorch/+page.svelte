<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import PostHeader from '$lib/components/PostHeader.svelte';
	import { posts } from '$lib/posts';

	const post = posts.find(p => p.slug === '3d-indexing-pytorch');

	const code = `batch_size, seq_len, embed_dim = output.size()
selected = output[
    torch.arange(batch_size),
    indices,
    ...,
]`;
</script>

<PostHeader {post} />

<article class="relative max-w-prose mx-auto">
	<section>
		<p>Set the indices to be the lengths of each sequence in the batch. (Normally you can use pack/unpack in PyTorch, but this does not yet work with transformers.)</p>
		<CodeBlock lang="python" {code} />
		<p class="text-ink-4 text-[0.8rem]">
			<a href="https://gist.github.com/cjlovering/6d25425d92ec2d1109d80566be4e46b8" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
