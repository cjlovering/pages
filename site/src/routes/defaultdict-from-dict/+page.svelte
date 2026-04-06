<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import PostHeader from '$lib/components/PostHeader.svelte';
	import { posts } from '$lib/posts';

	const post = posts.find(p => p.slug === 'defaultdict-from-dict');

	const code = `from collections import defaultdict
x = {"1": 1, "2": 2}
defaultdict(int, x)`;
</script>

<PostHeader {post} />

<article class="relative max-w-prose mx-auto">
	<section>
		<CodeBlock lang="python" {code} />
		<p class="text-ink-4 text-[0.8rem]">
			<a href="https://gist.github.com/cjlovering/dcbdf9850648d4c4e89ae7947ceed255" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
