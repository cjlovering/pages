<!--
  Grid of sub-images within a single auto-numbered figure.
  Usage:
    <FigureGrid columns={3}>
      {#snippet images()}
        <FigureGridItem src="..." label="gpt-5.2" />
      {/snippet}
      {#snippet caption()}Caption text{/snippet}
    </FigureGrid>
-->
<script>
	let { columns = 3, images, caption } = $props();
</script>

<figure class="
	relative [counter-increment:figure-counter]
	overflow-visible block mb-8
">
	<div
		class="grid gap-3 mb-2 max-md:grid-cols-1 max-md:gap-6"
		style="grid-template-columns: repeat({columns}, 1fr);"
	>
		{@render images()}
	</div>
	{#if caption}
		<figcaption class="
			block w-full mt-2
			text-[0.9rem] leading-snug
			font-serif text-left text-ink-3
			before:content-['Figure_'_counter(figure-counter)_':_']
			before:font-semibold
		">
			{@render caption()}
		</figcaption>
	{/if}
</figure>
