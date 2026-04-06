<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import PostHeader from '$lib/components/PostHeader.svelte';
	import { posts } from '$lib/posts';

	const post = posts.find(p => p.slug === 'git-on-a-server');
</script>

<PostHeader {post} />

<article class="relative max-w-prose mx-auto">
	<section>
		<h2 class="text-2xl font-serif font-normal mt-10 mb-4">git diff</h2>
		<p>If you don't see color or see a lot of ESC characters in diffs:</p>
		<CodeBlock lang="bash" code={`export LESS=eFRX`} />

		<h2 class="text-2xl font-serif font-normal mt-10 mb-4">git commit</h2>
		<p>If it fails to let you enter a full commit message, set the editor to vim:</p>
		<CodeBlock lang="bash" code={`git config --global core.editor "vim"`} />
		<p class="text-ink-4 text-[0.8rem]">
			<a href="https://gist.github.com/cjlovering/c4789c4fd172ba0097de89fd6c41122a" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
