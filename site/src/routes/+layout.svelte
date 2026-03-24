<script>
	import './layout.css';
	import 'highlight.js/styles/base16/solarized-light.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { afterNavigate } from '$app/navigation';
	import hljs from 'highlight.js/lib/core';
	import python from 'highlight.js/lib/languages/python';
	import bash from 'highlight.js/lib/languages/bash';
	import latex from 'highlight.js/lib/languages/latex';

	hljs.registerLanguage('python', python);
	hljs.registerLanguage('bash', bash);
	hljs.registerLanguage('latex', latex);

	let { children } = $props();

	afterNavigate(() => {
		document.querySelectorAll('pre code[class*="language-"]:not(.hljs)').forEach((el) => {
			hljs.highlightElement(el);
		});
	});
</script>

<svelte:head>
	<title>Charles Lovering</title>
	<meta name="description" content="Research, exposition, and technical notes on machine learning, NLP, and software engineering." />
</svelte:head>

<div class="min-h-screen bg-page text-ink font-serif">
	<Header />
	<main class="mx-auto max-w-[950px] px-4 py-4 flex-1">
		{@render children()}
	</main>
	<Footer />
</div>
