<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import PostHeader from '$lib/components/PostHeader.svelte';
	import { posts } from '$lib/posts';

	const post = posts.find(p => p.slug === 'pretty-print-pandas');

	const code = `def func(args):
    ...
    data  # pd.DataFrame
    display(data)
    ...`;
</script>

<PostHeader {post} />

<article class="relative max-w-prose mx-auto">
	<section>
		<CodeBlock lang="python" {code} />
		<p class="text-ink-4 text-[0.8rem]">
			<a href="https://gist.github.com/cjlovering/0aec32562d7c8a8edaafc0f11026a837" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
