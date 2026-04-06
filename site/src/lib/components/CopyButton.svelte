<!--
  Copy-to-clipboard button. Place inside a `relative group` wrapper.
  Usage:
    <CopyButton text={codeString} />          — copies the given text
    <CopyButton container={el} />             — copies textContent from the element
-->
<script>
	let { text = '', container = null } = $props();
	let copied = $state(false);

	async function copy() {
		const content = text || container?.textContent || '';
		await navigator.clipboard.writeText(content.trim());
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<button
	onclick={copy}
	class="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[11px] font-mono
		bg-page/80 border border-border-light text-ink-4
		opacity-0 group-hover:opacity-100 hover:text-ink-1 hover:border-ink-4/40
		transition-all cursor-pointer z-10"
>
	{copied ? 'copied' : 'copy'}
</button>
