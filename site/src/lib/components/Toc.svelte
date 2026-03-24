<!--
  Left-margin table of contents. Hidden on screens < lg.
-->
<script>
	/**
	 * @typedef {{ label: string, href: string, children?: TocItem[] }} TocItem
	 */

	/** @type {{ items: TocItem[] }} */
	let { items } = $props();
</script>

<nav
	aria-label="Table of contents"
	class="
		absolute top-[10px]
		left-[calc(-1*var(--toc-w,200px)-var(--toc-gap,34px))]
		w-[var(--toc-w,200px)]
		font-serif text-[0.9rem] leading-snug text-ink-2
		hidden lg:block
	"
>
	<ul class="list-none p-0 m-0">
		{#each items as item}
			<li class="mb-1.5">
				<a
					href={item.href}
					class="text-ink-4 no-underline transition-colors duration-200
						hover:text-ink-1 hover:underline hover:decoration-ink-1/20 hover:underline-offset-2"
				>
					{item.label}
				</a>
				{#if item.children}
					<ul class="list-none pl-3 mt-1.5">
						{#each item.children as child}
							<li class="mb-1.5">
								<a
									href={child.href}
									class="text-ink-4 no-underline transition-colors duration-200
										hover:text-ink-1 hover:underline hover:decoration-ink-1/20 hover:underline-offset-2"
								>
									{child.label}
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</li>
		{/each}
	</ul>
</nav>
