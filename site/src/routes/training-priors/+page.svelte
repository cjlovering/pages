<script>
	import { base } from '$app/paths';
	import Toc from '$lib/components/Toc.svelte';
	import Sidenote from '$lib/components/Sidenote.svelte';
	import Figure from '$lib/components/Figure.svelte';
	import FigureGrid from '$lib/components/FigureGrid.svelte';
	import FigureGridItem from '$lib/components/FigureGridItem.svelte';
	import { ScatterPlot } from '$lib/charts/fenway';

	let { data } = $props();

	const tocItems = [
		{ label: 'Introduction', href: '#introduction' },
		{ label: 'Experimental design', href: '#experimental-design' },
		{ label: 'Dataset', href: '#dataset' },
		{ label: 'Forward effect', href: '#forward' },
		{ label: 'Backward effect', href: '#backward' },
		{ label: 'Interaction', href: '#interaction' },
		{ label: 'Takeaways', href: '#takeaways' },
		{ label: 'Citation', href: '#citation' },
	];
</script>

<svelte:head>
	<title>Training Priors Predict Text-To-Image Model Performance</title>
</svelte:head>

<!-- Post Heading -->
<div id="top" class="mx-auto max-w-[660px] text-left">
	<h1 class="font-serif font-semibold text-[30px] mt-6 leading-snug">
		Training Priors Predict Text-To-Image Model Performance
	</h1>
	<p class="text-[18px] leading-none tracking-wide font-sans mt-6 mb-5">
		<span class="text-ink-3">Charles Lovering, Ellie Pavlick &mdash;
			<a href="https://cs.brown.edu"
				class="text-inherit no-underline hover:underline hover:decoration-ink/20 hover:underline-offset-2"
			>Brown University</a>
		</span>
	</p>
	<div class="flex flex-wrap gap-2 mb-14">
		<a href="https://arxiv.org/abs/2306.01755" target="_blank" rel="noopener noreferrer"
			class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-sans text-ink-3 bg-surface border border-border-light no-underline hover:border-ink-4/40 hover:text-ink-2 transition-all">
			📄 Preprint
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

	<!-- ═══ Introduction ═══ -->
	<p id="introduction" class="mb-5 text-[17px] leading-relaxed">
		Text-to-image models can generate "astronaut riding a horse" but struggle with
		"horse riding an astronaut." Why? We tested whether this reflects <em>training priors</em>&mdash;the
		frequency of subject&ndash;verb&ndash;object (SVO) patterns in the model's training
		data&mdash;using Stable Diffusion 2.1.
	</p>

	<FigureGrid columns={2}>
		{#snippet images()}
			<FigureGridItem src="{base}/training-priors/astro-horse.png" alt="Astronaut riding a horse" label="&ldquo;astronaut riding a horse&rdquo;" />
			<FigureGridItem src="{base}/training-priors/horse-astro.png" alt="Horse riding an astronaut" label="&ldquo;horse riding an astronaut&rdquo;" />
		{/snippet}
		{#snippet caption()}
			<em>Left:</em> Stable Diffusion generates a faithful image for the common triad.
			<em>Right:</em> The flipped prompt still produces an astronaut on a horse&mdash;the model
			defaults to its training prior.
		{/snippet}
	</FigureGrid>

	<p class="mb-5 text-[17px] leading-relaxed">
		The core finding: the more often an SVO triad appears in training data, the better the
		model generates an aligned image&mdash;and the worse it handles the flipped
		ordering.<Sidenote id="sn-mechanism">This suggests a "mix-and-match" mechanism rather
		than true compositional generalization. The model stitches together familiar patterns
		rather than reasoning about abstract relations.</Sidenote>
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		Individual term frequencies matter too. How often a word appears as an <em>agent</em>
		versus a <em>patient</em> in training has a significant effect on generation quality.
		A "ball" is common as an object (patient) but rarely as a subject (agent)&mdash;so
		"ball chasing a dog" fails not just because the triad is rare, but because "ball" as
		agent is itself unusual.
	</p>

	<FigureGrid columns={2}>
		{#snippet images()}
			<FigureGridItem src="{base}/training-priors/dog-chasing-ball.png" alt="Dog chasing a ball" label="&ldquo;dog chasing a ball&rdquo;" />
			<FigureGridItem src="{base}/training-priors/ball-chasing-dog.png" alt="Ball chasing a dog" label="&ldquo;ball chasing a dog&rdquo;" />
		{/snippet}
		{#snippet caption()}
			<em>Left:</em> The common triad yields a correct image. <em>Right:</em> The flipped
			prompt produces two dogs&mdash;the model cannot depict "ball" as an agent.
		{/snippet}
	</FigureGrid>

	<!-- ═══ Experimental Design ═══ -->
	<h2 id="experimental-design" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Experimental design<a href="#experimental-design" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		Each prompt encodes a triad &langle;subject, verb, object&rangle;. For a given triad,
		the more frequent ordering is the <em>default</em> and the reverse is
		<em>flipped</em>. We estimate SVO counts from LAION captions and regress alignment
		ratings against these counts.
	</p>

	<div class="overflow-x-auto my-8">
		<table class="mx-auto border-collapse text-[0.95rem] leading-normal">
			<thead>
				<tr>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold">Term</th>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold">Definition</th>
				</tr>
			</thead>
			<tbody>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25 font-mono text-[0.88em]">SVO</td><td class="px-4 py-2 border border-ink-4/25">Estimated count of the relation &langle;s, v, o&rangle;</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25 font-mono text-[0.88em]">OVS</td><td class="px-4 py-2 border border-ink-4/25">Estimated count of the flipped relation &langle;o, v, s&rangle;</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25 font-mono text-[0.88em]">Sxx, xVx, xxO</td><td class="px-4 py-2 border border-ink-4/25">Frequency of each term in its given role</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25 font-mono text-[0.88em]">Oxx, xxS</td><td class="px-4 py-2 border border-ink-4/25">Frequency of each term in the opposite role</td></tr>
			</tbody>
		</table>
	</div>

	<p class="mb-5 text-[17px] leading-relaxed">
		All counts are log-transformed: log<sub>10</sub>(count + 1). We fit a linear model:
		Alignment ~ SVO + OVS + Sxx + xVx + xxO + Oxx + xxS, with N=5 crowdsourced ratings
		per image, disaggregated.<Sidenote id="sn-regression">Alignment is measured on a
		5-point Likert scale normalized to [0, 1]. "Success" is defined as alignment &ge; 0.75.
		</Sidenote>
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		Our hypotheses: <strong>Forward</strong>&mdash;increased SVO frequency improves alignment.
		<strong>Backward</strong>&mdash;increased OVS frequency <em>hurts</em> alignment (the model
		defaults to the more common ordering).
	</p>

	<!-- ═══ Dataset ═══ -->
	<h2 id="dataset" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Dataset<a href="#dataset" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		We use Stable Diffusion 2.1 trained on LAION (aesthetic score &ge; 4.5, ~1.37B image&ndash;text
		pairs). SpaCy parses ~10% of captions (~134M sentences) to extract ~50M unique SVO triads.
		We curate ~769 triads with counts, generated images, and crowdsourced alignment
		ratings.<Sidenote id="sn-prompt">Each prompt follows the template: &ldquo;A photograph
		of a &#123;subject&#125; &#123;verb&#125; a &#123;object&#125;.&rdquo; Ratings are collected
		via SurgeAI with 5 annotators per image.</Sidenote>
	</p>

	<div class="overflow-x-auto my-8">
		<table class="mx-auto border-collapse text-[0.95rem] leading-normal">
			<thead>
				<tr>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold">Partition</th>
					<th class="px-4 py-2 text-right border border-ink-4/25 bg-ink-4/5 font-semibold">N</th>
					<th class="px-4 py-2 text-right border border-ink-4/25 bg-ink-4/5 font-semibold">Mean</th>
					<th class="px-4 py-2 text-right border border-ink-4/25 bg-ink-4/5 font-semibold">Median</th>
				</tr>
			</thead>
			<tbody>
				<tr class="hover:bg-ink-4/[0.03]">
					<td class="px-4 py-2 border border-ink-4/25">SVO Isolated</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">755</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.56</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.75</td>
				</tr>
				<tr class="hover:bg-ink-4/[0.03]">
					<td class="px-4 py-2 border border-ink-4/25">OVS Isolated</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">835</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.44</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.25</td>
				</tr>
				<tr class="hover:bg-ink-4/[0.03]">
					<td class="px-4 py-2 border border-ink-4/25">Default</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">1635</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.50</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.50</td>
				</tr>
				<tr class="hover:bg-ink-4/[0.03]">
					<td class="px-4 py-2 border border-ink-4/25">Flipped</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">1635</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.46</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.25</td>
				</tr>
			</tbody>
		</table>
	</div>

	<!-- ═══ Forward Effect ═══ -->
	<h2 id="forward" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Forward: increased SVO increases alignment<a href="#forward" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		When OVS = 0 (isolated SVO triads), we see a strong positive effect: each order-of-magnitude
		increase in SVO count yields +0.31 alignment. After SVO &gt; 10<sup>2</sup>, 18 of 26 prompts
		succeed (alignment &ge; 0.75). The correlation is 0.421 (p &lt; 10<sup>&minus;7</sup>).
	</p>

	<div class="overflow-x-auto my-8">
		<table class="mx-auto border-collapse text-[0.95rem] leading-normal">
			<thead>
				<tr>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold">Term</th>
					<th class="px-4 py-2 text-right border border-ink-4/25 bg-ink-4/5 font-semibold">Effect</th>
					<th class="px-4 py-2 text-right border border-ink-4/25 bg-ink-4/5 font-semibold italic">p</th>
				</tr>
			</thead>
			<tbody>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25 font-semibold">SVO</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">+0.31</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.00</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25 font-semibold">xVx</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">+0.12</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.01</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25 font-semibold">Oxx</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">&minus;0.18</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.00</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25 font-semibold">xxS</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">&minus;0.23</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.00</td></tr>
			</tbody>
		</table>
	</div>

	<figure class="relative [counter-increment:figure-counter] overflow-visible block mb-8">
		<ScatterPlot
			data={data.exp1}
			xLabel="log₁₀(SVO count + 1)"
			yLabel="Alignment"
			title="SVO Frequency vs. Alignment"
			trendLine={true}
			grid={true}
			radius={3.5}
			opacity={0.5}
			yDomain={[0, 1]}
		/>
		<figcaption class="
			block w-full mt-2 mb-0
			text-[0.9rem] leading-snug
			font-serif text-left text-ink-3
			before:content-['Figure_'_counter(figure-counter)_':_']
			before:font-semibold
		">
			SVO frequency (log-scaled) versus alignment for isolated SVO triads (OVS = 0).
			The dashed trend line shows the positive relationship. At low frequencies, outcomes
			are scattered; above 10<sup>2</sup>, most prompts succeed.
		</figcaption>
	</figure>

	<!-- ═══ Backward Effect ═══ -->
	<h2 id="backward" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Backward: role typicality drives failure<a href="#backward" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		When SVO = 0 (isolated OVS triads), alignment is generally poor. Surprisingly, the OVS
		count itself is not significant (p = 0.38). Instead, the drop is better explained by
		<em>role typicality</em>: the term xxS (how often the object word appears as a subject
		elsewhere) has a strong negative effect (&minus;0.19, p &lt; 0.01).<Sidenote id="sn-roles">This
		means "ball" fails as an agent not because "ball chasing dog" competes with "dog chasing ball,"
		but because "ball" is almost never seen in the subject role <em>at all</em> in
		training.</Sidenote>
	</p>

	<div class="overflow-x-auto my-8">
		<table class="mx-auto border-collapse text-[0.95rem] leading-normal">
			<thead>
				<tr>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold">Term</th>
					<th class="px-4 py-2 text-right border border-ink-4/25 bg-ink-4/5 font-semibold">Effect</th>
					<th class="px-4 py-2 text-right border border-ink-4/25 bg-ink-4/5 font-semibold italic">p</th>
				</tr>
			</thead>
			<tbody>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25">OVS</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">&minus;0.06</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.38</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25 font-semibold">xxO</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">+0.19</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.00</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25 font-semibold">xxS</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">&minus;0.19</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.00</td></tr>
			</tbody>
		</table>
	</div>

	<figure class="relative [counter-increment:figure-counter] overflow-visible block mb-8">
		<ScatterPlot
			data={data.exp2}
			xLabel="log₁₀(OVS count + 1)"
			yLabel="Alignment"
			title="OVS Frequency vs. Alignment"
			trendLine={true}
			grid={true}
			radius={3.5}
			opacity={0.5}
			yDomain={[0, 1]}
		/>
		<figcaption class="
			block w-full mt-2 mb-0
			text-[0.9rem] leading-snug
			font-serif text-left text-ink-3
			before:content-['Figure_'_counter(figure-counter)_':_']
			before:font-semibold
		">
			OVS frequency versus alignment for isolated OVS triads (SVO = 0). The weak negative
			trend is not statistically significant&mdash;role typicality of individual terms is
			a stronger predictor than the flipped triad count.
		</figcaption>
	</figure>

	<!-- ═══ Interaction ═══ -->
	<h2 id="interaction" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Interaction: both frequencies nonzero<a href="#interaction" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		When both SVO and OVS are nonzero, we split into <em>default</em> (SVO &gt; OVS)
		and <em>flipped</em> (OVS &gt; SVO) partitions, each with 1,635 ratings.
	</p>

	<div class="overflow-x-auto my-8">
		<table class="mx-auto border-collapse text-[0.95rem] leading-normal">
			<thead>
				<tr>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold" rowspan="2">Term</th>
					<th class="px-4 py-2 text-center border border-ink-4/25 bg-ink-4/5 font-semibold" colspan="2">Default</th>
					<th class="px-4 py-2 text-center border border-ink-4/25 bg-ink-4/5 font-semibold" colspan="2">Flipped</th>
				</tr>
				<tr>
					<th class="px-4 py-2 text-right border border-ink-4/25 bg-ink-4/5 font-semibold">Effect</th>
					<th class="px-4 py-2 text-right border border-ink-4/25 bg-ink-4/5 font-semibold italic">p</th>
					<th class="px-4 py-2 text-right border border-ink-4/25 bg-ink-4/5 font-semibold">Effect</th>
					<th class="px-4 py-2 text-right border border-ink-4/25 bg-ink-4/5 font-semibold italic">p</th>
				</tr>
			</thead>
			<tbody>
				<tr class="hover:bg-ink-4/[0.03]">
					<td class="px-4 py-2 border border-ink-4/25 font-semibold">SVO</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">+0.25</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.00</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">+0.14</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.04</td>
				</tr>
				<tr class="hover:bg-ink-4/[0.03]">
					<td class="px-4 py-2 border border-ink-4/25 font-semibold">OVS</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">&minus;0.40</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.00</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">&minus;0.11</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.11</td>
				</tr>
				<tr class="hover:bg-ink-4/[0.03]">
					<td class="px-4 py-2 border border-ink-4/25 font-semibold">Oxx</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">&minus;0.13</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.00</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">&minus;0.06</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.01</td>
				</tr>
				<tr class="hover:bg-ink-4/[0.03]">
					<td class="px-4 py-2 border border-ink-4/25 font-semibold">xxS</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">&minus;0.18</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.00</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">+0.04</td>
					<td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.36</td>
				</tr>
			</tbody>
		</table>
	</div>

	<p class="mb-5 text-[17px] leading-relaxed">
		For default orderings, both SVO and OVS are large and significant&mdash;the model benefits
		from seeing the relation but is also hurt by familiarity with the reverse. For flipped orderings,
		the effects are weaker: SVO is still positive but OVS is only directionally correct and not
		significant.<Sidenote id="sn-asymmetry">This asymmetry suggests the model's generative
		process is more sensitive to default patterns. Flipped prompts may face a "floor effect"
		where alignment is already low regardless of counts.</Sidenote>
	</p>

	<!-- ═══ Takeaways ═══ -->
	<h2 id="takeaways" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Takeaways<a href="#takeaways" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		Training priors shape text-to-image outputs in multiple, measurable ways. Frequency
		effects are stronger for default (more common) orderings than for flipped ones. There is
		no strong evidence that &langle;horse, ride, astronaut&rangle; fails <em>because</em>
		&langle;astronaut, ride, horse&rangle; is common. Instead, multiple training
		statistics&mdash;triad counts <em>and</em> individual term role frequencies&mdash;jointly
		determine alignment.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		These findings mirror patterns in human language processing, where frequency and
		typicality modulate comprehension and
		production.<Sidenote id="sn-human">See <a href="https://arxiv.org/abs/2208.07998"
			class="underline decoration-ink-4/30">Mahowald et al. (2022)</a> for a
		discussion of how distributional statistics in language relate to
		cognitive processing.</Sidenote> The model's behavior is consistent with a mechanism
		that relies heavily on surface co-occurrence statistics rather than abstract compositional
		reasoning.
	</p>

	<!-- ═══ Citation ═══ -->
	<h2 id="citation" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Citation<a href="#citation" class="heading-anchor">#</a></span>
	</h2>

	<pre class="bg-surface-code text-[0.82rem] leading-relaxed rounded px-5 py-4 overflow-x-auto mb-8 border border-border-light"><code>@article&#123;lovering-pavlick-2023-training,
  title   = &#123;Training Data Priors Predict Text-To-Image Model Performance&#125;,
  author  = &#123;Lovering, Charles and Pavlick, Ellie&#125;,
  journal = &#123;arXiv preprint arXiv:2306.01755&#125;,
  year    = &#123;2023&#125;,
  url     = &#123;https://arxiv.org/abs/2306.01755&#125;
&#125;</code></pre>

</article>
