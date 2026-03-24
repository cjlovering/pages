<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';
</script>

<svelte:head><title>Fix "Too Many Files" for Bash</title></svelte:head>

<article class="relative max-w-prose mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-serif font-normal mb-1 text-ink">Fix "Too Many Files" for Bash</h1>
		<p class="text-ink-3 text-[1.05rem] leading-relaxed">When <code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">cp</code>, <code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">mv</code>, or <code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">rename</code> fails because there are too many files, use <code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">find</code> instead.</p>
	</header>
	<section>
		<CodeBlock lang="bash" code={`find DIR_PATH -name "*.ext" -exec COMMAND {} \\;`} />
		<p>For example:</p>
		<CodeBlock lang="bash" code={`find /home/ftpuser/public_html/ftparea/ -name "*.jpg" -exec cp -uf "{}" /your/destination \\;`} />
		<p class="text-ink-4 text-[0.8rem]">
			<a href="https://gist.github.com/cjlovering/da89c7c75efc6dcb3cf24655570607c0" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
