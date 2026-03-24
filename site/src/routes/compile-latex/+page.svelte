<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const code = `latexmk -c main.tex; pdflatex main.tex; bibtex main; pdflatex main.tex;`;
</script>

<svelte:head><title>Compile a LaTeX File with a Bibliography</title></svelte:head>

<article class="relative max-w-prose mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-serif font-normal mb-1 text-ink">Compile a LaTeX File with a Bibliography</h1>
		<p class="text-ink-3 text-[1.05rem] leading-relaxed">The correct sequence of commands to get a PDF with resolved references.</p>
	</header>
	<section>
		<CodeBlock lang="bash" {code} />
		<ol class="list-decimal list-inside space-y-1 text-ink-2">
			<li><code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">latexmk -c main.tex</code> cleans the directory.</li>
			<li><code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">pdflatex main.tex</code> generates auxiliary files and figures out what bib entries it needs.</li>
			<li><code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">bibtex main</code> compiles the bibliography.</li>
			<li><code class="text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">pdflatex main.tex</code> generates the final PDF.</li>
		</ol>
		<p class="text-ink-4 text-[0.8rem] mt-4">
			<a href="https://gist.github.com/cjlovering/b7ccabb6f30fd6089b60e7a165ff0542" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
