<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import PostHeader from '$lib/components/PostHeader.svelte';
	import { posts } from '$lib/posts';

	const post = posts.find(p => p.slug === 'compile-latex');

	const code = `latexmk -c main.tex; pdflatex main.tex; bibtex main; pdflatex main.tex;`;
</script>

<PostHeader {post} />

<article class="relative max-w-prose mx-auto">
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
