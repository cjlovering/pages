<script>
	import { base } from '$app/paths';
	import './layout.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { afterNavigate } from '$app/navigation';

	let { children } = $props();

	afterNavigate(async () => {
		const blocks = document.querySelectorAll('pre code[class*="language-"]:not(.hljs)');
		if (!blocks.length) return;
		const { default: hljs } = await import('$lib/highlight.js');
		blocks.forEach((el) => hljs.highlightElement(el));
	});
</script>

<svelte:head>
	<title>Charles Lovering</title>
	<link rel="icon" type="image/png" sizes="32x32" href="{base}/favicon-32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="{base}/favicon-16.png" />
</svelte:head>

<div class="min-h-screen bg-page text-ink font-serif">
	<Header />
	<main class="mx-auto max-w-[950px] px-4 py-4 flex-1">
		{@render children()}
	</main>
	<Footer />
</div>
