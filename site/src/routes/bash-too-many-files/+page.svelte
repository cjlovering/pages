<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import PostHeader from '$lib/components/PostHeader.svelte';
	import { posts } from '$lib/posts';

	const post = posts.find(p => p.slug === 'bash-too-many-files');
</script>

<PostHeader {post} />

<article class="relative max-w-prose mx-auto">
	<section>
		<CodeBlock lang="bash" code={`find DIR_PATH -name "*.ext" -exec COMMAND {} \\;`} />
		<p>For example:</p>
		<CodeBlock lang="bash" code={`find /home/ftpuser/public_html/ftparea/ -name "*.jpg" -exec cp -uf "{}" /your/destination \\;`} />
		<p class="text-ink-4 text-[0.8rem]">
			<a href="https://gist.github.com/cjlovering/da89c7c75efc6dcb3cf24655570607c0" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
