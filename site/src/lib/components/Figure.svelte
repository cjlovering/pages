<!--
  Auto-numbered figure with caption.
  Usage: <Figure src="/figures/foo.png" alt="..." maxWidth="500px">Caption text</Figure>
-->
<script>
	let { src, alt = '', maxWidth = '800px', children } = $props();
</script>

<figure class="
	relative [counter-increment:figure-counter]
	overflow-visible block mt-10 mb-8
">
	<img
		{src}
		{alt}
		loading="lazy"
		class="block w-full h-auto mx-auto select-none"
		style="max-width: {maxWidth};"
		draggable="false"
	/>
	{#if children}
		<figcaption class="
			block w-full mt-2 mb-0
			text-[0.9rem] leading-snug
			font-serif text-left text-ink-3
			before:content-['Figure_'_counter(figure-counter)_':_']
			before:font-semibold
		">
			{@render children()}
		</figcaption>
	{/if}
</figure>
