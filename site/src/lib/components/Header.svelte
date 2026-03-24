<script>
	import { page } from '$app/state';
	import { base } from '$app/paths';

	const isRoot = $derived(page.url.pathname === '/' || page.url.pathname === `${base}/`);
</script>

<header class="w-full">
	<div class="flex items-center h-14 px-1 max-w-[950px] mx-auto">
		{#if !isRoot}
			<a
				href="{base}/"
				class="font-sans text-[15px] text-ink-3 no-underline hover:text-ink-1 hover:underline hover:decoration-ink/20 hover:underline-offset-2 transition-all"
			>
				&larr; Home
			</a>
		{/if}
	</div>
</header>
