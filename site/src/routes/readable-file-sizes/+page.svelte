<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import PostHeader from '$lib/components/PostHeader.svelte';
	import { posts } from '$lib/posts';

	const post = posts.find(p => p.slug === 'readable-file-sizes');
</script>

<PostHeader {post} />

<article class="relative max-w-prose mx-auto">
	<section>
		<CodeBlock lang="bash" code={`du -h`} />
		<p class="text-ink-4 text-[0.8rem]">
			<a href="https://gist.github.com/cjlovering/edc090f2fc8d533f7189c59c9ebd4f4d" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
