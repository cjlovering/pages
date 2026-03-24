<!--
  Tufte-style sidenote with checkbox toggle for mobile.
  Usage: <Sidenote id="sn1">Content here</Sidenote>
-->
<script>
	let { id, children } = $props();
</script>

<!-- Inline superscript number (increments the counter) -->
<label for={id} class="sidenote-label"></label>
<input type="checkbox" id={id} class="hidden peer" />
<!-- Margin note (reads the counter without incrementing) -->
<span class="sidenote-body peer-checked:max-lg:block">
	{@render children()}
</span>

<style>
	.sidenote-label {
		display: inline-block;
		max-height: 2rem;
		cursor: pointer;
		counter-increment: sidenote-counter;
		pointer-events: none;
	}
	@media (max-width: 1023px) {
		.sidenote-label { pointer-events: auto; }
	}
	.sidenote-label::after {
		content: counter(sidenote-counter);
		font-size: 0.8rem;
		color: var(--color-ink-4);
		position: relative;
		top: -0.5rem;
		left: -0.05rem;
	}

	.sidenote-body {
		float: right;
		clear: right;
		width: var(--sidenote-w, 200px);
		margin-right: calc(-1 * var(--sidenote-w, 200px) - var(--sidenote-gap, 35px));
		margin-left: var(--sidenote-gap, 35px);
		margin-top: 0.3rem;
		margin-bottom: 1.25rem;
		font-size: 0.9rem;
		line-height: 1.4;
		position: relative;
	}
	.sidenote-body::before {
		content: counter(sidenote-counter);
		font-size: 0.8rem;
		color: var(--color-ink-4);
		position: relative;
		top: -0.4rem;
		left: -0.1rem;
		padding-right: 0.2rem;
	}

	/* Mobile: hide by default, show when checked */
	@media (max-width: 1023px) {
		.sidenote-body {
			display: none;
			position: static;
			float: none;
			width: 95%;
			margin: 1rem 2.5%;
			clear: both;
			background-color: var(--color-surface);
			border-radius: 0.25rem;
			padding: 0.75rem;
		}
	}
</style>
