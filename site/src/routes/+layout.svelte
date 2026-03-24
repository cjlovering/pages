<script>
	import './layout.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
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
