<script>
	let { post } = $props();
</script>

<svelte:head>
	<title>{post.title}</title>
</svelte:head>

<div id="top" class="mx-auto max-w-[660px] text-left">
	<h1 class="font-serif font-semibold text-[30px] mt-6 leading-snug">
		{post.title}
	</h1>

	{#if post.subtitle}
		<p class="text-ink-3 text-[1.05rem] leading-relaxed mt-2">{post.subtitle}</p>
	{/if}

	{#if post.authors || post.affiliations?.length}
		<p class="text-[18px] leading-none tracking-wide font-sans mt-6">
			<span class="text-ink-3">
				{#if post.authors}
					{post.authors}
					{#if post.affiliations?.length}
						{' '}&mdash;{' '}
					{/if}
				{:else if post.affiliations?.length}
					Research @{' '}
				{/if}
				{#each post.affiliations ?? [] as aff, i}
					{#if i > 0}{' '}&amp;{' '}{/if}
					{#if aff.url}
						<a href={aff.url}
							class="text-inherit no-underline hover:underline hover:decoration-ink/20 hover:underline-offset-2"
						>{aff.name}</a>
					{:else}
						{aff.name}
					{/if}
				{/each}
			</span>
		</p>
	{/if}

	<p class="text-[13px] text-ink-4 font-sans tracking-wide mt-3 mb-5">{post.date}</p>

	{#if post.links?.length}
		<div class="flex flex-wrap gap-2 mb-14">
			{#each post.links as link}
				<a href={link.href} target="_blank" rel="noopener noreferrer"
					class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-sans text-ink-3 bg-surface border border-border-light no-underline hover:border-ink-4/40 hover:text-ink-2 transition-all">
					{link.label}
				</a>
			{/each}
		</div>
	{:else}
		<div class="mb-14"></div>
	{/if}
</div>
