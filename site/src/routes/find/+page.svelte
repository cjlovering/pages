<script>
	import Toc from '$lib/components/Toc.svelte';
	import Sidenote from '$lib/components/Sidenote.svelte';
	import { BarPlot, Heatmap, LinePlot, theme } from '$lib/charts/find';
	import TaskSetupFigure from '$lib/charts/find/TaskSetupFigure.svelte';
	import ExampleCard from '$lib/components/ExampleCard.svelte';
	import { SvelteSet } from 'svelte/reactivity';

	let { data } = $props();

	const modelColors = theme.modelColors;
	const barColors = {
		'gpt-5':            '#1a3a5c',
		'gemini-2.5-pro':   '#1e4d7b',
		'o3':               '#24619b',
		'gpt-5-mini':       '#2d78b8',
		'gemini-2.5-flash': '#3d8ec9',
		'sonnet-v4':        '#55a3d6',
		'o3-mini':          '#78bbe2',
	};
	const closedModels = ['gpt-5', 'gemini-2.5-pro', 'o3', 'gpt-5-mini', 'gemini-2.5-flash', 'sonnet-v4', 'o3-mini'];
	const allModels = closedModels;
	const defaultOn = ['gpt-5', 'gemini-2.5-pro', 'o3', 'sonnet-v4'];

	let activeModels = new SvelteSet(defaultOn);

	function toggleModel(model) {
		if (activeModels.has(model)) {
			if (activeModels.size > 1) activeModels.delete(model);
		} else {
			activeModels.add(model);
		}
	}

	let barData = $derived(
		data.modelResults
			.filter((d) => activeModels.has(d.model))
			.sort((a, b) => b.task_score.AVG - a.task_score.AVG)
			.map((d) => ({ label: d.model, value: d.task_score.AVG, error: d.task_score_se.AVG }))
	);

	const datasets = ['BLS', 'PRE', 'SEC', 'EMM', 'PG'];
	let heatmapData = $derived(
		data.modelResults
			.filter((d) => activeModels.has(d.model))
			.sort((a, b) => b.task_score.AVG - a.task_score.AVG)
			.flatMap((d) => datasets.map((ds) => ({ row: d.model, col: ds, value: d.task_score[ds] })))
	);
	let heatmapRows = $derived(
		data.modelResults
			.filter((d) => activeModels.has(d.model))
			.sort((a, b) => b.task_score.AVG - a.task_score.AVG)
			.map((d) => d.model)
	);

	let lengthLineData = $derived(
		data.lengthPerf
			.filter((d) => activeModels.has(d.model))
			.map((d) => ({ name: d.model, values: d.points.map((p) => ({ x: p.x, y: p.y })) }))
	);

	const precisionColors = { 'Precision': '#7B5EA7', 'Usefulness': '#E8890C' };

	let precisionBarData = $derived(
		data.precision.results
			.filter((d) => d.dataset !== 'AVG')
			.flatMap((d) => [
				{ label: d.dataset, value: d.precision, group: 'Precision' },
				{ label: d.dataset, value: d.usefulness, group: 'Usefulness' }
			])
	);

	const tocItems = [
		{ label: 'Our findings', href: '#our-findings' },
		{ label: 'Our results', href: '#our-results' },
		{ label: 'Are models useful?', href: '#are-models-useful' },
		{ label: 'Takeaways & case study', href: '#takeaways' },
		{ label: 'Examples', href: '#examples' },
		{ label: 'Citation', href: '#citation' },
	];
</script>

<!-- Post Heading -->
<div id="top" class="mx-auto max-w-[660px] text-left">
	<h1 class="font-serif font-semibold text-[30px] mt-6 leading-snug">
		Language Models Are (Surprisingly?) Good at Finding Inconsistencies in Documents
	</h1>
	<p class="text-[18px] leading-none tracking-wide font-sans mt-6 mb-5">
		<span class="text-ink-3">Research @
			<a href="https://kensho.com/research"
				class="text-inherit no-underline hover:underline hover:decoration-ink/20 hover:underline-offset-2"
			>Kensho</a>
		</span>
	</p>
	<div class="flex flex-wrap gap-2 mb-14">
		<a href="https://arxiv.org/abs/2512.18601" target="_blank" rel="noopener noreferrer"
			class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-sans text-ink-3 bg-surface border border-border-light no-underline hover:border-ink-4/40 hover:text-ink-2 transition-all">
			📄 Paper
		</a>
		<a href="https://huggingface.co/datasets/kensho/FIND" target="_blank" rel="noopener noreferrer"
			class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-sans text-ink-3 bg-surface border border-border-light no-underline hover:border-ink-4/40 hover:text-ink-2 transition-all">
			🗂️ Dataset
		</a>
	</div>
</div>

<!-- Article -->
<article
	class="
		mx-auto max-w-[660px] relative overflow-visible pt-2
		[counter-reset:sidenote-counter_figure-counter]
		[--sidenote-w:200px] [--sidenote-gap:35px]
		[--toc-w:200px] [--toc-gap:34px]
		lg:[--sidenote-w:210px]
		xl:[--sidenote-w:220px]
		2xl:[--sidenote-w:250px]
	"
>
	<Toc items={tocItems} />

	<p class="mb-5 text-[17px] leading-relaxed">
		In our paper,
		<a href="https://arxiv.org/abs/2512.18601"
			class="underline decoration-ink-4/30 hover:text-ink-2 hover:decoration-ink-2/30 transition-all"
		>On Finding Inconsistencies in Documents</a>, we were interested in benchmarking
		how well current language models find inconsistencies within documents. This is
		a big problem space, so we focused on financial documents, along with some case
		studies on computer science papers. With the help of financial experts, we created
		and released a <a href="https://huggingface.co/datasets/kensho/FIND"
			class="underline decoration-ink-4/30 hover:text-ink-2 hover:decoration-ink-2/30 transition-all"
		>dataset</a> with 500 (test and validation) examples. Each example
		consists of a technical document and an identified inconsistency. The model's task
		is to find the inconsistency.
	</p>

	<figure class="relative [counter-increment:figure-counter] overflow-visible block mb-8">
		<TaskSetupFigure />
		<figcaption class="
			block w-full mt-2 mb-0
			text-[0.9rem] leading-snug
			font-serif text-left text-ink-3
			before:content-['Figure_'_counter(figure-counter)_':_']
			before:font-semibold
		">
			The FIND task. A document with an inconsistency is passed to a language model,
			which must identify the evidence and describe the issue.
		</figcaption>
	</figure>

	<!-- ═══ Our Findings ═══ -->
	<h2 id="our-findings" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Our findings<a href="#our-findings" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		Despite the documents being long, technical, and complex, the best-performing model
		(<code class="px-1 text-accent text-[0.88em] font-mono">gpt-5</code>) recovered 64%
		of the inserted inconsistencies. Surprisingly,
		<code class="px-1 text-accent text-[0.88em] font-mono">gpt-5</code> also found
		undiscovered inconsistencies present in the original documents. For example, on 50
		arXiv papers, we judged <strong>136 out of 196</strong> of the model's suggestions
		to be legitimate inconsistencies missed by the original authors. However, despite
		these findings, even the best models miss almost half of the inconsistencies in FIND,
		which shows that inconsistency detection is still a challenging
		task.<Sidenote id="sn1">These results rely on using language models as judges&mdash;but
		our testing suggested that the judges were quite good at the verification task, getting
		a Cohen's kappa above 0.9 with a human judge.</Sidenote>
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		And this task generally&mdash;inconsistency detection&mdash;appears to be a rare case
		where even far-from-perfect performance can significantly help users, depending on the
		importance of the document. Most of the time the found inconsistencies are easy to
		verify&mdash;but just difficult or onerous for people to have found themselves.
	</p>

	<!-- ═══ Our Results ═══ -->
	<h2 id="our-results" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Our results<a href="#our-results" class="heading-anchor">#</a></span>
	</h2>

	<figure class="relative [counter-increment:figure-counter] overflow-visible block mb-8">
		<div class="flex flex-wrap gap-x-3 gap-y-1.5 mb-3">
			{#each allModels as model (model)}
				<button
					onclick={() => toggleModel(model)}
					class="flex items-center gap-1.5 px-2 py-0.5 rounded text-[12px] font-mono border transition-all cursor-pointer
						{activeModels.has(model)
							? 'border-ink-4/40 text-ink bg-surface'
							: 'border-border-light text-ink-5 bg-page opacity-50'}"
				>
					<span
						class="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
						style="background: {barColors[model]}; opacity: {activeModels.has(model) ? 1 : 0.3}"
					></span>
					{model}
				</button>
			{/each}
		</div>
		<BarPlot
			data={barData}
			yLabel="Task Score (Recall, %)"
			title="Inconsistency Detection by Model"
			grid={true}
			colorMap={barColors}
			patterns={true}
			height={340}
		/>
		<figcaption class="
			block w-full mt-2 mb-0
			text-[0.9rem] leading-snug
			font-serif text-left text-ink-3
			before:content-['Figure_'_counter(figure-counter)_':_']
			before:font-semibold
		">
			Average task score (recall) across all datasets. Scores represent the rate the
			model found the target inconsistency within the document.
			<code class="px-1 text-accent text-[0.88em] font-mono">gpt-5</code> and
			<code class="px-1 text-accent text-[0.88em] font-mono">gemini-2.5-pro</code>
			do best overall.
		</figcaption>
	</figure>

	<p class="mb-5 text-[17px] leading-relaxed">
		Scores are presented as percents (out of 100), representing the rate the model found
		the target inconsistency within the document. The top models perform at a rate of
		about 60%, and scores drop for the document sources that tend to be longer or more
		complicated.<Sidenote id="sn2">BLS contains reports from the Bureau of Labor Statistics,
		PRE contains presale reports on bonds, SEC contains 10-Qs, EMM contains reporting on
		US municipality securities, and PG contains nonfiction books. The last column averages
		across all datasets.</Sidenote>
	</p>

	<!-- ═══ Are Models Useful? ═══ -->
	<h2 id="are-models-useful" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Are models useful?<a href="#are-models-useful" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		High recall is only part of the story. If a model finds the inconsistency
		but also flags dozens of false positives, it's not useful in practice. We
		manually evaluated
		<code class="px-1 text-accent text-[0.88em] font-mono">gpt-5</code>'s
		predictions on a subset of 25 documents per
		source.<Sidenote id="sn-precision"><strong>Precision</strong> counts only exact matches
		to the inserted inconsistency. <strong>Usefulness</strong> is broader: it counts
		any suggestion that a domain expert judged to be a real or helpful finding,
		including issues present in the original document.</Sidenote>
	</p>

	<figure class="relative [counter-increment:figure-counter] overflow-visible block mb-8">
		<BarPlot
			data={precisionBarData}
			yLabel="%"
			title="gpt-5: Precision & Usefulness by Dataset"
			grid={true}
			height={300}
			colorMap={precisionColors}
			patterns={true}
		/>
		<figcaption class="
			block w-full mt-2 mb-0
			text-[0.9rem] leading-snug
			font-serif text-left text-ink-3
			before:content-['Figure_'_counter(figure-counter)_':_']
			before:font-semibold
		">
			Precision and usefulness of
			<code class="px-1 text-accent text-[0.88em] font-mono">gpt-5</code>
			predictions across datasets. Overall, 53% of predictions exactly match the
			inserted inconsistency (precision), and 67% are judged useful by domain
			experts (usefulness). The model averages 2.6 findings per document.
		</figcaption>
	</figure>

	<p class="mb-5 text-[17px] leading-relaxed">
		The gap between precision and usefulness is telling: models frequently identify
		<em>real</em> issues in the original documents that were not part of the
		benchmark. This suggests that language models can serve as a genuine auditing
		tool, not just a benchmark solver.
	</p>

	<!-- ═══ Takeaways & Case Study ═══ -->
	<h2 id="takeaways" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Takeaways &amp; case study on our own paper<a href="#takeaways" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		We found the results (surprisingly) compelling, and so the next step was to see how
		well models work on a real world use case: our own write-up on these results was
		readily available! And <strong>models found five inconsistencies in late drafts of
		our paper.</strong> We document these directly below and we think they're telling on
		how effective these models are, how they can be useful, and perhaps the limits of our
		findings.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		Notably, even after multiple runs and multiple models, we manually found one additional
		inconsistency the models missed. (In the appendix of our work a table had mis-ordered
		columns that clashed with the aggregated results in the main body.) This speaks to the
		two-sided nature of our results. These models are effective tools, and probably worth
		trying on your documents of choice, but as both the results on our benchmark and our
		direct experience shows, models still make mistakes.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		Lastly, most of the errors found so far are <em>not</em> game-changing. Both in our own
		work and most of the inconsistencies we found in others' work, the issues were typically
		small. Most authors would likely be happy to find such an error, but they did not
		significantly change the conclusions of the works.
	</p>

	<!-- ═══ Examples ═══ -->
	<h2 id="examples" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Examples of inconsistencies in late drafts of our work<a href="#examples" class="heading-anchor">#</a></span>
	</h2>

	<ExampleCard
		title="Compute time math error"
		model="gemini-2.5-pro"
		evidence={"gemini-2.5-flash & 6h & 2.1m\n...\nThe times above are reported for the 420 items"}
		description={'In Table A.1, the total compute time for gemini-2.5-flash is listed as "6h" and the per-document time is "2.1m". These two figures are contradictory for the stated 420 documents. 6 hours is 360 minutes, which averages to 0.86 minutes per document, not 2.1. Conversely, 2.1 minutes per document totals 882 minutes (14.7 hours), not 6 hours.'}
	/>

	<ExampleCard
		title="Test set size mismatch"
		model="gpt-5"
		evidence={"containing 375 test and 125 development problems.\n...\nIn the test set 83 out of 420 documents (at most,\ndepending on the model and tokenizer) had their\ntext truncated."}
		description={'The document defines the test set as 375 items, but later refers to the "test set" as having 420 documents when discussing truncation, creating a contradiction about test set size.'}
		note="The 420 value includes the WLD data."
	/>

	<ExampleCard
		title="Model name inconsistency"
		model="gpt-5"
		evidence={"gpt-5-mini\n...\n\\model{gpt-5-nano}"}
		description={'The Methods list "gpt-5-nano" as a tested model, whereas results tables and later sections report "gpt-5-mini", creating an inconsistency in the model variant named as evaluated.'}
		note="A real oversight in the paper draft."
	/>

	<ExampleCard
		title="URL typo"
		model="gpt-5"
		evidence={"\\footnote{\\url{https://emma.msrb.org/}}\n...\n\\url{EMMA.msrp.org}"}
		description="The EMM source is given as https://emma.msrb.org/ in the text, but later the figure caption uses EMMA.msrp.org, changing msrb to msrp. This mismatch in the domain name is an inconsistency in the referenced source."
		note="Found after the first round of fixes."
	/>

	<ExampleCard
		title="Recall range mismatch"
		model="gemini-2.5-pro"
		evidence={"the highest recall scores range from 7 to 11 percent,\n...\nsonnet-v4        | 12 | 33 | 2\ngpt-5-mini       | 10 | 35 | 2\ngpt-5            | 12 | 36 | 7\no3-mini          |  0 | 24 | 9\no3               |  9 | 33 | 9\ngemini-2.5-flash | 12 | 34 | 9\ngemini-2.5-pro   | 16 | 38 | 9"}
		description={'Section 7.2 states that for the MFR dataset, "the highest recall scores range from 7 to 11 percent". However, the data in Table A.7 shows that the highest recall score achieved by any model is 9%, making the stated range incorrect.'}
		note="Issue arose due to an out-of-date table in the appendix."
	/>

	<ExampleCard
		title="Undefined abbreviation"
		model="gemini-2.5-pro"
		evidence={"PG  & 75 & 109±106.6 & 4±2.6 & 8±6.0 & 22±24.1\nPGS & 25 & 146±111.8 & 5±3.7 & 7±4.8 & 22±17.9"}
		description={`The paper uses the abbreviation 'PG' for "Project Gutenberg" documents in the test set tables. However, in the development set tables, it uses 'PGS' for what appears to be the same source. The dataset statistics for 'PG' (avg. 109k tokens) and 'PGS' (avg. 146k tokens) are different, but the 'PGS' abbreviation is never defined, creating ambiguity.`}
		note={'PGS stands for "Project Gutenberg Seen", as the PG development data may be leaked to models.'}
	/>

	<!-- ═══ Citation ═══ -->
	<h2 id="citation" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Citation<a href="#citation" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		Report prepared by Charles Lovering.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		If you found this useful please see and (perhaps cite!) our
		<a href="https://arxiv.org/abs/2512.18601"
			class="underline decoration-ink-4/30 hover:text-ink-2 hover:decoration-ink-2/30 transition-all"
		>paper</a>.
	</p>

	<pre class="bg-surface-code rounded text-[13px] leading-snug p-4 overflow-x-auto font-mono text-ink-3"><code>@misc&#123;lovering2025findinginconsistenciesdocuments,
      title=&#123;On Finding Inconsistencies in Documents&#125;,
      author=&#123;Charles J. Lovering and Seth Ebner and Brandon Smock
              and Michael Krumdick and Saad Rabbani and Ahmed Muhammad
              and Varshini Reddy and Chris Tanner&#125;,
      year=&#123;2025&#125;,
      eprint=&#123;2512.18601&#125;,
      archivePrefix=&#123;arXiv&#125;,
      primaryClass=&#123;cs.CL&#125;,
      url=&#123;https://arxiv.org/abs/2512.18601&#125;,
&#125;</code></pre>

</article>

<!-- Back to top -->
<div class="max-w-[660px] mx-auto mt-14 flex justify-center">
	<a href="#top"
		class="font-sans text-[15px] text-ink-4 no-underline
			hover:text-ink-1 hover:underline hover:decoration-ink-1/20 hover:underline-offset-2 transition-all"
	>back to top</a>
</div>

<style>
	.heading-anchor {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		left: -1.2rem;
		opacity: 0;
		color: color-mix(in srgb, #676767 65%, transparent);
		text-decoration: none;
		font-family: 'Iowan Old Style', Georgia, serif;
		font-weight: 400;
		font-size: 1em;
		transition: opacity 150ms ease-in-out;
	}
	h2:hover .heading-anchor {
		opacity: 1;
	}
</style>
