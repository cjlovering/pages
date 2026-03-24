<script>
	let { src, alt = '', label = '' } = $props();
</script>

<div class="text-center">
	<img
		{src}
		{alt}
		loading="lazy"
		class="w-full h-auto rounded-sm select-none max-md:max-w-[400px] max-md:mx-auto"
		draggable="false"
	/>
	{#if label}
		<div class="font-sans text-[13px] text-ink-3 mt-1">
			{label}
		</div>
	{/if}
</div>
