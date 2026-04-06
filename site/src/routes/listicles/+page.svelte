<script>
	import Sidenote from '$lib/components/Sidenote.svelte';
	import PostHeader from '$lib/components/PostHeader.svelte';
	import { posts } from '$lib/posts';

	const post = posts.find(p => p.slug === 'listicles');
</script>

<PostHeader {post} />

<article class="relative max-w-prose mx-auto">
	<section>
		<p>
			This is a dataset of ~341k items consisting of claims and reasons, collected from listicle-style web pages
			(pages presenting "N reasons why X"). It can be used for weakly-supervised natural language
			inference<Sidenote id="sn-nli">The labels would be "supports" and "neutral." Because the annotations
			come from a natural setting rather than crowdsourcing, the dataset avoids the annotation artifacts that
			plague other NLI datasets.</Sidenote>.
		</p>

		<h2 id="purpose" class="text-2xl font-serif font-normal mt-10 mb-4">Purpose</h2>

		<p>
			The labels are "supports" and "neutral," programmatically detected across matched sites. The evidence
			and other content are from entirely natural settings — this means the data does not contain the same
			artifacts that plague other such datasets. About 70% of the entries include supporting evidence alongside
			the claim and reason<Sidenote id="sn-contradict">Research fun fact: the original goal was to also include
			contradictory examples (and labels), but these were more difficult to find and confirm. Not being able to
			do so is a reason this research project was ultimately orphaned.</Sidenote>.
		</p>

		<h2 id="format" class="text-2xl font-serif font-normal mt-10 mb-4">Format</h2>

		<p>The dataset is a CSV with the following columns:</p>

		<div class="overflow-x-auto mb-6">
			<table class="w-full text-[0.9rem] border-collapse">
				<thead>
					<tr class="border-b-2 border-ink/15">
						<th class="text-left py-2 pr-4 font-sans font-semibold text-ink-2">Column</th>
						<th class="text-left py-2 font-sans font-semibold text-ink-2">Description</th>
					</tr>
				</thead>
				<tbody>
					<tr class="border-b border-border">
						<td class="py-2 pr-4 font-mono text-[0.85rem]">query</td>
						<td class="py-2 text-ink-2">The query originally issued to find the web page.</td>
					</tr>
					<tr class="border-b border-border">
						<td class="py-2 pr-4 font-mono text-[0.85rem]">claim</td>
						<td class="py-2 text-ink-2">The claim implicit in the title of the page.</td>
					</tr>
					<tr class="border-b border-border">
						<td class="py-2 pr-4 font-mono text-[0.85rem]">reason</td>
						<td class="py-2 text-ink-2">One of the enumerated reasons supporting the claim.</td>
					</tr>
					<tr class="border-b border-border">
						<td class="py-2 pr-4 font-mono text-[0.85rem]">evidence</td>
						<td class="py-2 text-ink-2">Optional. Information that supports the reason.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<h2 id="examples" class="text-2xl font-serif font-normal mt-10 mb-4">Examples</h2>

		<p class="mb-6">Below are representative entries from the dataset. Each card shows a claim–reason pair, with evidence when available.</p>

		<div class="space-y-4 mb-8">
			<div class="bg-surface rounded-lg px-5 py-4 border border-border">
				<p class="text-[0.8rem] font-sans font-medium text-ink-4 uppercase tracking-wide mb-2">Claim</p>
				<p class="text-ink font-serif mb-3">Girls should lift weights.</p>
				<p class="text-[0.8rem] font-sans font-medium text-ink-4 uppercase tracking-wide mb-2">Reason</p>
				<p class="text-ink font-serif mb-3">Lifting weights reduces your risk of osteoporosis.</p>
				<p class="text-[0.8rem] font-sans font-medium text-ink-4 uppercase tracking-wide mb-2">Evidence</p>
				<p class="text-ink-2 text-[0.9rem] font-serif leading-relaxed">
					One of the fears women have about aging is developing osteoporosis, a condition where your bones
					weaken and become brittle. One amazing benefit of strength training is that it can help lower the
					risk of and even prevent osteoporosis. When you consistently strength train, your bones increase
					in density, making them stronger than before.
				</p>
			</div>

			<div class="bg-surface rounded-lg px-5 py-4 border border-border">
				<p class="text-[0.8rem] font-sans font-medium text-ink-4 uppercase tracking-wide mb-2">Claim</p>
				<p class="text-ink font-serif mb-3">You should ditch refined oils.</p>
				<p class="text-[0.8rem] font-sans font-medium text-ink-4 uppercase tracking-wide mb-2">Reason</p>
				<p class="text-ink font-serif mb-3">Heating.</p>
				<p class="text-[0.8rem] font-sans font-medium text-ink-4 uppercase tracking-wide mb-2">Evidence</p>
				<p class="text-ink-2 text-[0.9rem] font-serif leading-relaxed">
					Refined oils are heated and reheated in the extraction process, losing most of its valuable nutrients.
					Often these high temperatures result in the oils oxidising and going rancid even before you buy them!
					Oxidation also creates free radicals that can damage the cells of our bodies so it is best to avoid them.
				</p>
			</div>

			<div class="bg-surface rounded-lg px-5 py-4 border border-border">
				<p class="text-[0.8rem] font-sans font-medium text-ink-4 uppercase tracking-wide mb-2">Claim</p>
				<p class="text-ink font-serif mb-3">Everyone should take a probiotic.</p>
				<p class="text-[0.8rem] font-sans font-medium text-ink-4 uppercase tracking-wide mb-2">Reason</p>
				<p class="text-ink font-serif">
					Probiotics are a newfound weapon that may assist in lowering elevated blood pressure and
					cholesterol levels that contribute to cardiovascular disease.
				</p>
				<p class="text-[0.75rem] font-sans text-ink-4 mt-2 italic">No evidence provided.</p>
			</div>

			<div class="bg-surface rounded-lg px-5 py-4 border border-border">
				<p class="text-[0.8rem] font-sans font-medium text-ink-4 uppercase tracking-wide mb-2">Claim</p>
				<p class="text-ink font-serif mb-3">You should opt for a bot.</p>
				<p class="text-[0.8rem] font-sans font-medium text-ink-4 uppercase tracking-wide mb-2">Reason</p>
				<p class="text-ink font-serif">They're easy to use.</p>
				<p class="text-[0.75rem] font-sans text-ink-4 mt-2 italic">No evidence provided.</p>
			</div>
		</div>

		<h2 id="collection" class="text-2xl font-serif font-normal mt-10 mb-4">Collection</h2>

		<p>
			The root idea is that listicles — websites that present "N reasons for X" — contain useful structured
			information. This information is not as direct as Mechanical Turk annotations, but is relatively cheap,
			generated without the framing of a crowdsourced task, and is scalable.
		</p>

		<p>
			First, links to such pages are found by recursively querying the Bing API: seed queries are issued
			(e.g. <span class="font-mono text-[0.85rem] bg-surface-code px-1.5 py-0.5 rounded">"* reasons * is good"</span>),
			and then results are used to find more similar and branching results. Pages are then parsed to extract the
			claim and the reasons. About 60% of the reasons include supporting evidence; sometimes this evidence is not
			distinct from the reason itself.
		</p>

		<h2 id="stats" class="text-2xl font-serif font-normal mt-10 mb-4">Dataset Statistics</h2>

		<div class="overflow-x-auto mb-6">
			<table class="w-full text-[0.9rem] border-collapse">
				<tbody>
					<tr class="border-b border-border">
						<td class="py-2 pr-4 font-sans font-medium text-ink-2">Total entries</td>
						<td class="py-2 font-mono text-[0.85rem]">341,155</td>
					</tr>
					<tr class="border-b border-border">
						<td class="py-2 pr-4 font-sans font-medium text-ink-2">With evidence</td>
						<td class="py-2 font-mono text-[0.85rem]">240,102 (70.4%)</td>
					</tr>
					<tr class="border-b border-border">
						<td class="py-2 pr-4 font-sans font-medium text-ink-2">Without evidence</td>
						<td class="py-2 font-mono text-[0.85rem]">101,053 (29.6%)</td>
					</tr>
				</tbody>
			</table>
		</div>

		<p>
			For more details and to download the dataset, visit the
			<a href="https://github.com/cjlovering/listicles" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">GitHub repository</a>.
		</p>
	</section>
</article>
