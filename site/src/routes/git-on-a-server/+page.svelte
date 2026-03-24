<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';
</script>

<svelte:head><title>Git on a Server</title></svelte:head>

<article class="relative max-w-prose mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-serif font-normal mb-1 text-ink">Git on a Server</h1>
		<p class="text-ink-3 text-[1.05rem] leading-relaxed">Fixes for common git annoyances on remote machines.</p>
	</header>
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
