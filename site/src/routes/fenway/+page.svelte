<script>
	import Toc from '$lib/components/Toc.svelte';
	import Sidenote from '$lib/components/Sidenote.svelte';
	import Figure from '$lib/components/Figure.svelte';
	import FigureGrid from '$lib/components/FigureGrid.svelte';
	import FigureGridItem from '$lib/components/FigureGridItem.svelte';
	import { BarPlot, ScatterPlot, theme } from '$lib/charts/fenway';
	import CalibrationLegend from '$lib/charts/fenway/CalibrationLegend.svelte';
	import BehaviorHeatmap from '$lib/charts/fenway/BehaviorHeatmap.svelte';
	import SetupFigure from '$lib/charts/fenway/SetupFigure.svelte';
	import PaperHeatmap from '$lib/charts/fenway/PaperHeatmap.svelte';
	import { SvelteSet } from 'svelte/reactivity';

	// Figure 2 data: 11×11 dominant behavior rate matrix from the paper (GPT-4o Mini)
	// Values = rate of dominant behavior (pick-first above anti-diagonal, pick-higher below)
	// Rows = Second Option Listed, Cols = First Option Listed
	const fig2cols = ['purple','orange','yellow','pink','red','blue','gold','green','black','brown','white'];
	const fig2rows = ['white','brown','black','green','gold','blue','red','pink','yellow','orange','purple'];
	// Signed values encode category: positive = pick first (orange), negative = pick higher (blue)
	// Rows = Second Option Listed, Cols = First Option Listed
	const fig2matrix = [
		[ 1.00,  1.00,  1.00,  1.00,  1.00,  0.97,  1.00,  1.00,  0.98,  1.00, null],  // white
		[ 1.00,  1.00,  1.00,  1.00,  1.00,  0.98,  1.00,  0.99,  0.95, null,  0.81],  // brown  (brown×white → first)
		[ 1.00,  1.00,  1.00,  1.00,  0.99,  0.93,  1.00,  0.98, null, -0.87, -0.98],  // black
		[ 1.00,  0.96,  0.97,  1.00,  0.86, -0.90, -0.86, null, -1.00, -0.99, -0.97],  // green  (green×blue, green×gold → higher)
		[ 1.00,  1.00,  1.00,  1.00,  1.00,  1.00, null,  1.00,  0.87,  0.84,  0.91],  // gold   (all first)
		[ 1.00,  0.94,  0.99,  1.00,  0.94, null,  0.85, -0.92, -0.99, -0.98, -0.93],  // blue   (blue×gold → first)
		[ 1.00,  0.95,  0.97,  1.00, null, -0.91,  0.92, -0.79, -0.98, -0.97, -0.91],  // red    (red×gold → first)
		[ 1.00,  0.97,  0.91, null,  0.86, -0.98,  0.80, -0.90, -1.00, -0.98, -0.98],  // pink   (pink×red, pink×gold → first)
		[ 1.00, -0.85, null,  0.99, -0.87, -0.98,  0.96, -0.96, -1.00, -1.00, -1.00],  // yellow (yellow×orange → higher; yellow×pink, yellow×gold → first)
		[ 1.00, null,  0.99,  0.99, -0.88, -0.96,  0.99, -1.00, -1.00, -1.00, -0.99],  // orange (orange×yellow, orange×pink, orange×gold → first)
		[null,  0.95,  0.87,  1.00, -0.83, -0.96, -0.82, -0.95, -1.00, -1.00, -0.99],  // purple (purple×orange, purple×yellow, purple×pink → first)
	];

	let { data } = $props();

	const modelColors = theme.modelColors;
	const allModels = ['gpt-4o', 'gpt-5.1', 'gpt-5.2', 'gpt-4.1', 'gpt-4o-mini', 'gpt-4.1-mini'];

	// Shared model toggle: controls figures 3, 4, and 5
	let activeModels = new SvelteSet(['gpt-5.1', 'gpt-5.2', 'gpt-4.1', 'gpt-4.1-mini']);

	function toggleModel(model) {
		if (activeModels.has(model)) {
			if (activeModels.size > 1) activeModels.delete(model);
		} else {
			activeModels.add(model);
		}
	}

	let activeModelList = $derived(
		allModels.filter((m) => activeModels.has(m))
	);

	const tocItems = [
		{ label: 'The marble bag', href: '#the-marble-bag' },
		{ label: 'Patterns in model behavior', href: '#patterns' },
		{ label: 'Measuring calibration', href: '#measuring-calibration' },
		{ label: 'Testing newer models', href: '#newer-models' },
		{ label: 'So what?', href: '#so-what' },
		{ label: 'Open questions', href: '#open-questions' },
		{ label: 'Citation', href: '#citation' },
	];
</script>

<!-- Post Heading -->
<div id="top" class="mx-auto max-w-[660px] text-left">
	<h1 class="font-serif font-semibold text-[30px] mt-6 leading-snug">
		Language Models Struggle With Numeric Calibration
	</h1>
	<p class="text-[18px] leading-none tracking-wide font-sans mt-6 mb-5">
		<span class="text-ink-3">Research @
			<a href="https://kensho.com/research"
				class="text-inherit no-underline hover:underline hover:decoration-ink/20 hover:underline-offset-2"
			>Kensho</a>
		</span>
	</p>
	<div class="flex flex-wrap gap-2 mb-14">
		<a href="https://aclanthology.org/2025.acl-long.1417/" target="_blank" rel="noopener noreferrer"
			class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-sans text-ink-3 bg-surface border border-border-light no-underline hover:border-ink-4/40 hover:text-ink-2 transition-all">
			📄 Paper
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

	<!-- ═══ The marble bag ═══ -->
	<p id="the-marble-bag" class="mb-5 text-[17px] leading-relaxed">
		Imagine you reach into a bag of marbles containing
		<strong>98 <span class="text-marble-blue">blue</span></strong> marbles and
		<strong>99 <span class="text-marble-red">red</span></strong> marbles.
		If you grab one without looking, what are the chances it's red versus blue?
		Without pulling out a pen and paper, most people would say about an even chance.
		When we ask <code class="px-1 text-accent text-[0.88em] font-mono">gpt-4o</code>,
		it puts 99.7% of its probability mass on red.
	</p>

	<blockquote class="bg-surface-code rounded px-5 py-4 my-5 border-l-2 border-ink-5/30">
		<p class="text-[17px] leading-relaxed mb-0">
			From 98 <span class="text-marble-blue font-medium">blue</span> marbles and
			99 <span class="text-marble-red font-medium">red</span> marbles, Tommy reached
			blindly into a bag and grabbed a marble with the color [blue/red]
		</p>
	</blockquote>

	<figure class="relative [counter-increment:figure-counter] overflow-visible block mb-8">
		<SetupFigure />
		<figcaption class="
			block w-full mt-2 mb-0
			text-[0.9rem] leading-snug
			font-serif text-left text-ink-3
			before:content-['Figure_'_counter(figure-counter)_':_']
			before:font-semibold
		">
			<em>Left:</em> The problem setup. <em>Center:</em> A calibrated output
			would be roughly 50/50. <em>Right:</em> What
			<code class="px-1 text-accent text-[0.88em] font-mono">gpt-4o</code>
			actually produces.
		</figcaption>
	</figure>

	<p class="mb-5 text-[17px] leading-relaxed">
		This is not necessarily bad or surprising in isolation. It is possible that in aggregate
		the model would produce roughly balanced results over many prompt variations. But what we
		found is that a number of different models have stable <em>preferences</em> for specific
		colors and orderings. Word order and identity, which should be arbitrary factors, have
		a real and systematic impact on model outputs.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		In our recent <a href="https://aclanthology.org/2025.acl-long.1417.pdf"
			class="underline decoration-ink-4/30 hover:text-ink-2 hover:decoration-ink-2/30 transition-all"
		>paper</a>, we studied how language models answer and assign probabilities
		in basic scenarios like these. And we are not the only ones&mdash;since our work came out,
		a number of other groups have asked similar
		questions.<Sidenote id="sn1">See related work by
			<a href="https://arxiv.org/abs/2601.05414" class="underline decoration-ink-4/30">Balepur et al.</a>,
			<a href="https://arxiv.org/abs/2511.14630" class="underline decoration-ink-4/30">Gao et al.</a>,
			<a href="https://arxiv.org/pdf/2509.01136" class="underline decoration-ink-4/30">Chen et al.</a>, and
			<a href="https://arxiv.org/abs/2505.00047" class="underline decoration-ink-4/30">Zhao et al.</a>
		</Sidenote>
	</p>

	<!-- ═══ Patterns ═══ -->
	<h2 id="patterns" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Patterns in model behavior<a href="#patterns" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		The figure below is involved but reveals a great deal. Each cell corresponds to 100
		problems like the example above, with 50 cases where the first option has a higher
		value and 50 where the second does.
		<code class="px-1 text-accent text-[0.88em] font-mono">gpt-4o-mini</code>
		exhibits a stable pattern across the diagonal: the model's behavior depends strongly
		on the <em>order</em> of the keywords. For one ordering, say white/purple, the model
		behaves in one way and switches to an entirely different behavior profile for the
		reverse ordering.<Sidenote id="sn2">We see similar patterns for other models.
		See our <a href="https://aclanthology.org/2025.acl-long.1417.pdf" class="underline decoration-ink-4/30">paper</a>
		for more detail.</Sidenote>
	</p>

	<figure class="relative [counter-increment:figure-counter] overflow-visible block mb-8 max-w-[500px] mx-auto">
		<PaperHeatmap
			title="GPT 4o Mini"
			matrix={fig2matrix}
			rows={fig2rows}
			cols={fig2cols}
		/>
		<figcaption class="
			block w-full mt-2 mb-0
			text-[0.9rem] leading-snug
			font-serif text-left text-ink-3
			before:content-['Figure_'_counter(figure-counter)_':_']
			before:font-semibold
		">
			Each cell represents model performance over 100 balanced examples.
			The top-left cell reads: when purple is listed before white, purple receives
			nearly 100% of the probability mass in all cases. The bottom-right cell: when
			white is listed before purple, the option with the higher numeric value is
			correctly picked 99 out of 100 times. The strong diagonal pattern reveals
			systematic ordering bias.
		</figcaption>
	</figure>

	<!-- ═══ Measuring Calibration ═══ -->
	<h2 id="measuring-calibration" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Measuring calibration<a href="#measuring-calibration" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		We measure the distance between the calibrated ideal and the model outputs using
		Wasserstein Distance
		(WD).<Sidenote id="sn3">Wasserstein Distance captures how much "shifting" between
		two probability distributions is needed for them to match. A WD of 0 means the
		distributions are identical. See
		<a href="https://lilianweng.github.io/posts/2017-08-20-gan/#wasserstein-gan-wgan"
			class="underline decoration-ink-4/30">Lilian Weng's explainer</a>
		for a nice introduction.</Sidenote>
		To provide context, we compare against several baseline strategies:
		<em>Pick Higher</em> places all probability mass on the option with the higher value;
		<em>Pick Lower</em> does the opposite; <em>Pick First/Second</em> ignores values
		entirely; and <em>Pick Random</em> randomly assigns probability.
	</p>

	<!-- Baselines Table -->
	<div class="overflow-x-auto my-8">
		<table class="mx-auto border-collapse text-[0.95rem] leading-normal">
			<thead>
				<tr>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold">Baseline</th>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold">Calibration (WD) [&darr;]</th>
				</tr>
			</thead>
			<tbody>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25">Pick Higher</td><td class="px-4 py-2 border border-ink-4/25">0.47</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25">Pick Lower</td><td class="px-4 py-2 border border-ink-4/25">0.95</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25">Pick First / Second</td><td class="px-4 py-2 border border-ink-4/25">0.71</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25">Pick Random</td><td class="px-4 py-2 border border-ink-4/25"><em class="text-ink-1">0.27</em></td></tr>
			</tbody>
			<thead>
				<tr>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold">Model</th>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold">Calibration (WD) [&darr;]</th>
				</tr>
			</thead>
			<tbody>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25"><code class="text-accent text-[0.88em] font-mono">Mistral 7B v0.3</code></td><td class="px-4 py-2 border border-ink-4/25">0.48</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25"><code class="text-accent text-[0.88em] font-mono">Yi 1.5</code></td><td class="px-4 py-2 border border-ink-4/25">0.49</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25"><code class="text-accent text-[0.88em] font-mono">Llama 3.1 8B</code></td><td class="px-4 py-2 border border-ink-4/25"><em class="text-ink-1">0.40</em></td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25"><code class="text-accent text-[0.88em] font-mono">gemma 2 9b</code></td><td class="px-4 py-2 border border-ink-4/25">0.50</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25"><code class="text-accent text-[0.88em] font-mono">gpt-4o-mini</code></td><td class="px-4 py-2 border border-ink-4/25"><em class="text-ink-1">0.42</em></td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25"><code class="text-accent text-[0.88em] font-mono">gpt-4o</code></td><td class="px-4 py-2 border border-ink-4/25"><em class="text-ink-1">0.40</em></td></tr>
			</tbody>
		</table>
	</div>

	<p class="mb-5 text-[17px] leading-relaxed">
		The results are striking: all models are poorly calibrated. None is more calibrated
		than <em>randomly assigning</em> probability mass, and only half outperform the
		Pick Higher baseline. We also study relative entropy and find that models tend to
		produce outputs that are too confident&mdash;far too low in entropy. Much of this
		<strong>mode collapse</strong> occurs after instruction tuning, though instruction
		tuning does have the benefit of leading models to at least choose valid words
		(like red or blue).
	</p>

	<!-- ═══ Newer Models ═══ -->
	<h2 id="newer-models" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Testing newer models<a href="#newer-models" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		These results were established on models available in early 2024.
		Our paper was published at ACL 2025. We now check whether these results hold
		up on models released afterward&mdash;including
		<code class="px-1 text-accent text-[0.88em] font-mono">gpt-4.1</code> and the
		<code class="px-1 text-accent text-[0.88em] font-mono">gpt-5</code>
		series.<Sidenote id="sn4">Many of the latest models (most of the
		<code class="px-1 text-accent text-[0.88em] font-mono">gpt-5-*</code> and
		<code class="px-1 text-accent text-[0.88em] font-mono">o*</code> series)
		don't expose a logprobs endpoint, in part because they are reasoning models
		that hide thinking tokens. For
		<code class="px-1 text-accent text-[0.88em] font-mono">gpt-5.1</code> and
		<code class="px-1 text-accent text-[0.88em] font-mono">gpt-5.2</code>,
		logprobs are available when reasoning effort is set to
		<code class="px-1 text-accent text-[0.88em] font-mono">'none'</code>.</Sidenote>
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		Newer models are not obviously better. When we run 10,000 new examples per model,
		we see different but stable behavioral
		signatures.<Sidenote id="sn5">Even when we fix the seed, results tend to change
		across runs, though the overall patterns remain relatively stable.</Sidenote>
		<code class="px-1 text-accent text-[0.88em] font-mono">gpt-5.2</code>
		always picks the higher value;
		<code class="px-1 text-accent text-[0.88em] font-mono">gpt-4.1-mini</code>
		almost always picks the first item;
		<code class="px-1 text-accent text-[0.88em] font-mono">gpt-4o-mini</code>
		almost always picks the first item but also exhibits color-ordering effects.
	</p>

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
						style="background: {modelColors[model]}; opacity: {activeModels.has(model) ? 1 : 0.3}"
					></span>
					{model}
				</button>
			{/each}
		</div>
		<BarPlot
			data={data.comparison.filter((d) => activeModels.has(d.model)).map((d) => ({ label: d.model, value: d.avg_wasserstein }))}
			yLabel="Avg. Wasserstein Distance"
			title="Calibration Error by Model"
			grid={true}
			valueLabels={true}
			colorMap={modelColors}
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
			Average Wasserstein Distance (calibration error) by model across 10,000 examples.
			Lower is better. Even the best-performing model
			(<code class="px-1 text-accent text-[0.88em] font-mono">gpt-4o</code>)
			remains far from perfect calibration.
		</figcaption>
	</figure>

	<p class="mb-5 text-[17px] leading-relaxed">
		The aggregate calibration error tells part of the story, but the per-color-pair
		heatmaps below reveal the specific behavioral patterns behind each model's score.
	</p>

	<figure class="relative [counter-increment:figure-counter] overflow-visible block mb-8">
		<div class="flex items-stretch">
			<!-- Shared y-axis title -->
			<div class="flex items-center justify-center shrink-0 w-6">
				<span class="text-[11px] font-sans text-ink-3 -rotate-90 whitespace-nowrap">First Color Listed</span>
			</div>
			<div class="flex-1 min-w-0">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{#each activeModelList as model, i (model)}
						<div>
							<p class="text-center text-[0.85rem] font-sans text-ink-3 mb-1">
								<code class="text-accent text-[0.88em] font-mono">{model}</code>
							</p>
							<BehaviorHeatmap data={data.heatmaps[model]} showYLabels={i % 2 === 0} />
						</div>
					{/each}
				</div>
				<!-- Shared x-axis title -->
				<p class="text-center text-[11px] font-sans text-ink-3 mt-2">Second Color Listed</p>
			</div>
		</div>
		<!-- Shared behavior legend -->
		<div class="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4">
			{#each [
				['calibrated', '#e8f5e9', '#1b5e20'],
				['higher', '#e3f2fd', '#0d47a1'],
				['lower', '#ffebee', '#b71c1c'],
				['first', '#fff3e0', '#e65100'],
				['second', '#f3e5f5', '#4a148c'],
				['null', '#f5f5f5', '#424242']
			] as [label, light, dark]}
				<div class="flex items-center gap-1.5">
					<div class="w-10 h-3 rounded-sm border border-ink-5/20" style="background: linear-gradient(to right, {light}, {dark})"></div>
					<span class="text-[11px] font-sans text-ink-3">{label}</span>
				</div>
			{/each}
		</div>
		<figcaption class="
			block w-full mt-3 mb-0
			text-[0.9rem] leading-snug
			font-serif text-left text-ink-3
			before:content-['Figure_'_counter(figure-counter)_':_']
			before:font-semibold
		">
			Behavior heatmaps for six models across all color-pair orderings at scale.
			Each model develops its own distinct pattern of biases. Some are dominated
			by position (pick-first), others by numeric value (pick-higher), and some
			by complex color-ordering interactions.
		</figcaption>
	</figure>

	<p class="mb-5 text-[17px] leading-relaxed">
		We can also examine calibration at the individual example level. In the scatter
		plots below, the x-axis represents the ideal (true) probability and the y-axis
		represents the model's predicted probability. Points falling on the diagonal
		line are perfectly calibrated. The shaded band around the diagonal marks
		approximately calibrated predictions. The top-right and bottom-left quadrants
		(green) indicate the model gets the <em>direction</em> right&mdash;it assigns
		higher probability to the more likely option. The top-left and bottom-right
		quadrants (red) indicate the model gets it wrong.
	</p>

	<figure class="relative [counter-increment:figure-counter] overflow-visible block mb-8 max-w-[400px] mx-auto">
		<CalibrationLegend />
		<figcaption class="
			block w-full mt-2 mb-0
			text-[0.9rem] leading-snug
			font-serif text-left text-ink-3
			before:content-['Figure_'_counter(figure-counter)_':_']
			before:font-semibold
		">
			How to read the calibration scatter plots. Green quadrants indicate
			directionally calibrated predictions; red quadrants indicate the model
			assigns higher probability to the wrong option. The diagonal band
			marks approximately calibrated outputs.
		</figcaption>
	</figure>

	<p class="mb-5 text-[17px] leading-relaxed">
		None of the
		models exhibit truly calibrated behavior along the diagonal, but notably, there
		is a large difference in behavior between
		<code class="px-1 text-accent text-[0.88em] font-mono">gpt-5.1</code> and
		<code class="px-1 text-accent text-[0.88em] font-mono">gpt-5.2</code>&mdash;the
		latter of which is always directionally calibrated, or, in other words,
		exhibiting <strong>mode collapse</strong>. <code class="px-1 text-accent text-[0.88em] font-mono">gpt-4.1-mini</code> shows collapse to a different strategy: always picking the first option listed. (This was also discernable from the heatmaps above.) We take these results here to suggest that our work (for now) continues to replicate.
	</p>

	<figure class="relative [counter-increment:figure-counter] overflow-visible block mb-8">
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			{#each activeModelList as model (model)}
				<ScatterPlot
					data={data.scatter.filter((d) => d.model === model).map((d) => ({ x: d.ideal, y: d.actual, group: d.model }))}
					xLabel="Ideal"
					yLabel="Model"
					title={model}
					diagonal={true}
					radius={2}
					opacity={0.45}
					colorMap={modelColors}
					legend={false}
					height={280}
					xDomain={[0, 1]}
					yDomain={[0, 1]}
	
				/>
			{/each}
		</div>
		<figcaption class="
			block w-full mt-2 mb-0
			text-[0.9rem] leading-snug
			font-serif text-left text-ink-3
			before:content-['Figure_'_counter(figure-counter)_':_']
			before:font-semibold
		">
			Calibration scatter plots showing ideal probability versus model probability
			for each option. Points along the diagonal represent perfect calibration. The
			heavy clustering at the extremes (0 and 1) reflects model
			overconfidence&mdash;models tend to commit almost entirely to one option rather
			than expressing graded uncertainty.
		</figcaption>
	</figure>

	<!-- ═══ So What ═══ -->
	<h2 id="so-what" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>So what?<a href="#so-what" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		Language models exhibit strong biases and systematic patterns&mdash;even
		over basic heuristics&mdash;when faced with probabilistic choices.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		Becoming more helpful for day-to-day tasks does not appear to solve these
		more fundamental problems. Models that are excellent at coding and reasoning
		still fail at proportional probability assignment.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		We recommend caution when using models to make decisions in such environments. Both benchmarks
		and user testimony point to strong reasoning and coding abilities, but there
		appear to be gaps when it comes to calibrated uncertainty.
	</p>

	<!-- ═══ Open Questions ═══ -->
	<h2 id="open-questions" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Open questions and related work<a href="#open-questions" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		Several directions are worth watching.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		<strong>Complex scenarios.</strong> How much does this extend beyond
		simple two-option settings? There is some evidence that point-wise bias like
		we observe here does not necessarily transfer to longer generation scenarios.
		See <a href="https://aclanthology.org/2025.acl-long.7.pdf"
			class="underline decoration-ink-4/30 hover:text-ink-2 hover:decoration-ink-2/30 transition-all"
		>Ruted Evaluation</a>.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		<strong>Verbalized Sampling.</strong>
		<a href="https://arxiv.org/pdf/2510.01171"
			class="underline decoration-ink-4/30 hover:text-ink-2 hover:decoration-ink-2/30 transition-all"
		>Verbalized Sampling</a> is a recently proposed method that has models generate
		multiple outputs along with verbalized probabilities, and demonstrates strong results.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		<strong>Debiasing approaches.</strong>
		<a href="https://aclanthology.org/2025.acl-long.808.pdf"
			class="underline decoration-ink-4/30 hover:text-ink-2 hover:decoration-ink-2/30 transition-all"
		>Li (2025)</a> takes a different approach using a Non-parametric Order-Preserving
		Algorithm (NOA) to improve debiasing over selection settings.
	</p>

	<!-- ═══ Citation ═══ -->
	<h2 id="citation" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Citation<a href="#citation" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		Report prepared by Charles Lovering.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		See more details in our paper,
		<a href="https://aclanthology.org/2025.acl-long.1417/"
			class="underline decoration-ink-4/30 hover:text-ink-2 hover:decoration-ink-2/30 transition-all"
		>Language Model Probabilities are Not Calibrated in Numeric Contexts</a>.
	</p>

	<pre class="bg-surface-code rounded text-[13px] leading-snug p-4 overflow-x-auto font-mono text-ink-3"><code>@inproceedings&#123;lovering-etal-2025-language,
    title = "Language Model Probabilities are
             $Not$ Calibrated in Numeric Contexts",
    author = "Lovering, Charles and
      Krumdick, Michael and
      Lai, Viet Dac and
      Reddy, Varshini and
      Ebner, Seth and
      Kumar, Nilesh and
      Koncel-Kedziorski, Rik and
      Tanner, Chris",
    month = jul,
    year = "2025",
    address = "Vienna, Austria",
    publisher = "Association for Computational Linguistics",
    url = "https://aclanthology.org/2025.acl-long.1417/",
    doi = "10.18653/v1/2025.acl-long.1417",
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
	/* Heading anchor links */
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
