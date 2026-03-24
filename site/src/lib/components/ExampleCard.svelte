<!--
  Example inconsistency card — mirrors the 3-panel Figure 1 style.
  Props: title, model, evidence (raw text), description (raw text), note (optional)
-->
<script>
	let { title, model, evidence, description, note } = $props();

	let evidenceSnippets = $derived(evidence.split('\n...\n'));
</script>

<div class="example-card">
	<!-- Title bar -->
	<div class="card-header">
		<span class="card-title">{title}</span>
		<span class="card-model">{model}</span>
	</div>

	<!-- Panels -->
	<div class="card-panels">
		<!-- Evidence panel -->
		<div class="panel panel-evidence">
			<div class="panel-label">Evidence</div>
			<div class="snippets">
				{#each evidenceSnippets as snippet, i (i)}
					<pre class="snippet"><code>{snippet}</code></pre>
					{#if i < evidenceSnippets.length - 1}
						<div class="snippet-gap"></div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Description panel -->
		<div class="panel panel-description">
			<div class="panel-label">Description</div>
			<p class="panel-text-desc">{description}</p>
		</div>
	</div>

	<!-- Note -->
	{#if note}
		<p class="card-note">{note}</p>
	{/if}
</div>

<style>
	.example-card {
		margin-bottom: 2rem;
	}

	.card-header {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.card-title {
		font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		font-size: 0.95rem;
		font-weight: 600;
		color: #282828;
	}

	.card-model {
		font-family: SFMono-Regular, 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, monospace;
		font-size: 0.78rem;
		color: #969696;
	}

	.card-panels {
		display: grid;
		grid-template-columns: 1fr 1fr;
		align-items: stretch;
		gap: 0;
	}

	.panel {
		border: 1px solid #e8e5e0;
		border-radius: 4px;
		padding: 0.75rem 0.85rem;
		min-height: 80px;
		display: flex;
		flex-direction: column;
	}

	.panel-evidence {
		background: #fafaf9;
	}

	.panel-description {
		background: #fafaf9;
	}

	.panel-label {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #969696;
		margin-bottom: 0.5rem;
	}

	.panel-evidence .panel-label {
		color: #7B5EA7;
	}

	.panel-description .panel-label {
		color: #E8890C;
	}

	.snippets {
		display: flex;
		flex-direction: column;
		gap: 0;
		flex: 1;
	}

	.snippet {
		font-family: SFMono-Regular, 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, monospace;
		font-size: 0.75rem;
		line-height: 1.5;
		color: #504945;
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
		overflow-x: auto;
		background: #f3f3f2;
		border-radius: 3px;
		padding: 0.5rem 0.6rem;
	}

	.snippet-gap {
		height: 0.5rem;
	}

	.panel-text-desc {
		font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		font-size: 0.85rem;
		line-height: 1.55;
		color: #504945;
		margin: 0;
		flex: 1;
	}

	.card-note {
		font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		font-size: 0.82rem;
		font-style: italic;
		color: #676767;
		margin-top: 0.4rem;
		margin-bottom: 0;
	}

	/* Stack on small screens */
	@media (max-width: 640px) {
		.card-panels {
			grid-template-columns: 1fr;
			gap: 0;
		}

	}
</style>
