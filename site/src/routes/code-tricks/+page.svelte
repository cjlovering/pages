<script>
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// This page has been split into individual articles.
	// Redirect to the index.
	onMount(() => goto(`${base}/`, { replaceState: true }));
</script>

<p>Redirecting&hellip;</p>
