<script>
	import { base } from '$app/paths';
	import Toc from '$lib/components/Toc.svelte';
	import Sidenote from '$lib/components/Sidenote.svelte';
	import Figure from '$lib/components/Figure.svelte';
	import PostHeader from '$lib/components/PostHeader.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { posts } from '$lib/posts';
	import {
		ProbingChart,
		SelectivityChart,
		LayerwiseChart,
		LearningCurves,
		NegativeCurves,
		ConvergenceChart,
		BoardAnimation,
		HexBoard
	} from '$lib/charts/alphatology';

	const post = posts.find(p => p.slug === 'alphatology');

	const tocItems = [
		{ label: 'Introduction', href: '#introduction' },
		{ label: 'Concepts in Hex', href: '#concepts' },
		{ label: 'Evaluation methods', href: '#methods' },
		{ label: 'AZ encodes concepts', href: '#probing' },
		{ label: 'AZ learns to use concepts', href: '#behavioral' },
		{ label: 'Learning dynamics', href: '#dynamics' },
		{ label: 'Board structure', href: '#structure' },
		{ label: 'Citation', href: '#citation' },
	];

	// ── Chart data (loaded as static JSON) ──
	let probingData = $state(null);
	let selectivityData = $state(null);
	let layerwiseData = $state(null);
	let positiveCurves = $state(null);
	let negativeCurves = $state(null);
	let convergenceData = $state(null);
	let structureData = $state(null);
	let boardCellData = $state(null);

	async function loadJson(path) {
		const res = await fetch(`${base}${path}`);
		return res.json();
	}

	$effect(() => {
		loadJson('/alphatology/data-probing.json').then(d => probingData = d);
		loadJson('/alphatology/data-selectivity.json').then(d => selectivityData = d);
		loadJson('/alphatology/data-layerwise.json').then(d => layerwiseData = d);
		loadJson('/alphatology/data-positive-curves.json').then(d => positiveCurves = d);
		loadJson('/alphatology/data-negative-curves.json').then(d => negativeCurves = d);
		loadJson('/alphatology/data-convergence.json').then(d => convergenceData = d);
		loadJson('/alphatology/data-structure.json').then(d => structureData = d);
		loadJson('/alphatology/data-board-cells.json').then(d => boardCellData = d);
	});

	const boardFrames = [
		{ src: `${base}/alphatology/board-grubby-0.png`, checkpoint: 0 },
		{ src: `${base}/alphatology/board-grubby-10.png`, checkpoint: 10 },
		{ src: `${base}/alphatology/board-grubby-15.png`, checkpoint: 15 },
		{ src: `${base}/alphatology/board-grubby-20.png`, checkpoint: 20 },
	];

	const positiveConcepts = ['bridge', 'crescent', 'trapezoid', 'span', 'edge', 'bottleneck', 'escape'];
</script>

<PostHeader {post} />

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
		Good performance can mask flaws in deep learning systems. Evaluating systems
		in terms of task performance alone makes it impossible to know if they are "right
		for the right reasons" and difficult to predict how they will generalize.
		The NLP community has developed tools for this&mdash;probing classifiers that
		inspect internal representations, and behavioral tests that evaluate
		out-of-distribution generalization. We adapt both techniques to reinforcement
		learning, studying AlphaZero (AZ) trained to play
		Hex.<Sidenote id="sn-nlp">Probing classifiers were developed for NLP by
		<a href="https://aclanthology.org/P18-1198/" class="underline decoration-ink-4/30">Conneau et al.</a>
		and others;
		behavioral tests by
		<a href="https://doi.org/10.1162/tacl_a_00298" class="underline decoration-ink-4/30">Ettinger (2020)</a>.
		We apply both to a deep RL agent for the first time.</Sidenote>
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		The main findings: (1) AZ's neural network encodes game concepts that humans
		consider important, and uses them to win games. (2) Short-term concepts
		are best encoded in the final layers; long-term concepts in the middle layers.
		(3) MCTS discovers concepts before the neural network learns to represent
		them. (4) AZ does not fully master negative concepts&mdash;it will
		waste moves on cells that cannot impact the game.
	</p>

	<!-- ═══ Concepts in Hex ═══ -->
	<h2 id="concepts" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Concepts in Hex<a href="#concepts" class="heading-anchor">#</a></span>
	</h2>

	<Figure src="{base}/alphatology/fig1a-win-for-black.png" alt="A completed Hex board showing a win for black" maxWidth="240px">
		A winning board for black, connecting the black edges.
	</Figure>

	<p class="mb-5 text-[17px] leading-relaxed">
		Hex is a board game where two players take turns filling cells until one
		builds a connecting chain across the board. Unlike Go, there are no captures.
		Hex cannot end in a tie, and given perfect play, the first player
		wins.<Sidenote id="sn-hex">We evaluate the top-performing agent trained by
		<a href="https://arxiv.org/abs/2104.03113" class="underline decoration-ink-4/30">Jones (2021)</a>
		on a 9&times;9 board: an 8-layer, 512-neuron network with 64 MCTS nodes, achieving
		a 92% win rate as black against
		<a href="https://webdocs.cs.ualberta.ca/~hayward/hex/" class="underline decoration-ink-4/30">MoHex</a>.</Sidenote>
	</p>

	<Figure src="{base}/alphatology/fig1b-concept-examples.png" alt="Short-term vs long-term concept examples on Hex boards" maxWidth="435px">
		Short- vs long-term concepts. If black plays A or B in the left
		board, black immediately wins (short-term). In the right board, A and B can
		help black win only in the long-term.
	</Figure>

	<p class="mb-5 text-[17px] leading-relaxed">
		We define a concept to be <strong>short-term</strong> if its use is sufficient
		to win the game (typically when connected to the player's board edges), and
		<strong>long-term</strong> otherwise. From <a href="https://www.hexwiki.net/index.php/Strategy" class="underline decoration-ink-4/30">Seymour and King</a>, we identify nine
		concepts in four categories:
	</p>

	<ul class="mb-5 text-[17px] leading-relaxed list-none pl-0 space-y-2">
		<li><strong>Internal concepts</strong> (bridge, crescent, trapezoid, span) &mdash;
			templates within the board's interior providing multiple ways to connect a
			player's pieces.</li>
		<li><strong>Edge concepts</strong> &mdash; guarantee a connection from a single cell
			to a given board edge.</li>
		<li><strong>Ladder concepts</strong> (bottleneck, escape) &mdash; analogous to
			ladders in Go. A bottleneck favors the defender; an escape allows the
			attacker to break through.</li>
		<li><strong>Negative concepts</strong> (dead cells, captured cells) &mdash;
			identify which actions <em>not</em> to play. Dead cells cannot impact the
			game's outcome regardless of how they are
			filled.<Sidenote id="sn-neg">If a player can <em>make</em> a cell dead,
			that cell is captured. Both should never be filled.</Sidenote></li>
	</ul>

	<Figure src="{base}/alphatology/fig2-concepts.png" alt="Hex concept taxonomy: bridge, crescent, trapezoid, span, edge, bottleneck, escape, dead cells, captured cells" maxWidth="660px">
		Hex templates exemplifying game concepts. Positive concepts provide the player
		with multiple ways to connect pieces despite possible attacks. Negative concepts
		change the strategic value of open spots. Arrows indicate connection to the
		opposite board edge; lines show the bridge concept within larger concepts.
	</Figure>

	<!-- ═══ Evaluation Methods ═══ -->
	<h2 id="methods" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Evaluation methods<a href="#methods" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		<strong>Probing classifiers</strong> ask whether concepts are <em>represented</em>
		within the model. For each concept, we generate boards with vs. without that concept
		and train linear probes over AZ's internal activations to predict concept presence.
		We measure <em>concept selectivity</em>&mdash;the delta between probing accuracy and
		a control that shuffles cell positions so the resulting boards are meaningless in
		Hex.<Sidenote id="sn-selectivity">Following
		<a href="https://aclanthology.org/D19-1275/" class="underline decoration-ink-4/30">Hewitt and Liang (2019)</a>,
		we form the control by consistently remapping each cell to a random cell, preserving
		the information content while destroying spatial structure.</Sidenote>
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		<strong>Behavioral tests</strong> ask whether the model <em>uses</em> concepts in
		gameplay. For positive concepts, we construct forced situations: if AZ plays the
		expected moves, AZ wins; otherwise, AZ loses. For negative concepts, we check
		that during a selfplay continuation, the agent does not fill dead or captured cells.
	</p>

	<Figure src="{base}/alphatology/fig3-behavioral-tests.png" alt="Creating behavioral tests from concept templates in four steps" maxWidth="520px">
		Creating behavioral tests. The minimal template (a) is translated to a random
		board position (b). Both players' pieces are connected to their edges (c).
		Noise pieces form a valid board (d). If white plays A, black must play B to win.
	</Figure>

	<!-- ═══ AZ Encodes Concepts ═══ -->
	<h2 id="probing" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>AlphaZero encodes concepts<a href="#probing" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		AZ encodes both long-term and short-term concepts with high selectivity&mdash;well
		above the shuffled baseline, confirming that concept-specific information is present
		in the network's representations, not just surface-level board features.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		More interesting is <em>where</em> in the network these concepts live. Long-term
		concepts are best represented in the middle layers; short-term concepts in the final
		layers. This parallels findings in NLP, where syntactic information tends to peak
		in middle layers while task-specific features concentrate in upper
		layers.<Sidenote id="sn-layers">Concurrent work by
		<a href="https://arxiv.org/abs/2111.09259" class="underline decoration-ink-4/30">McGrath et al.</a>
		on chess found a consistent pattern: short-term concepts are better represented in
		higher layers than long-term concepts.</Sidenote>
	</p>

	{#if selectivityData}
		<figure class="my-8 [counter-increment:figure-counter]">
			<SelectivityChart data={selectivityData} height={300} />
			<figcaption class="
				block w-full mt-2 mb-0
				text-[0.9rem] leading-snug
				font-serif text-left text-ink-3
				before:content-['Figure_'_counter(figure-counter)_':_']
				before:font-semibold
			">
				AlphaZero successfully encodes long-term and short-term concepts. The colored
				bars show the accuracy of a probe trained to identify a concept from network
				activations; grey bars show the selectivity baseline (boards with randomly
				remapped pieces). We report selectivity from the layer with highest test accuracy.
			</figcaption>
		</figure>
	{/if}

	{#if layerwiseData}
		<figure class="my-8 [counter-increment:figure-counter]">
			<LayerwiseChart data={layerwiseData} height={260} />
			<figcaption class="
				block w-full mt-2 mb-0
				text-[0.9rem] leading-snug
				font-serif text-left text-ink-3
				before:content-['Figure_'_counter(figure-counter)_':_']
				before:font-semibold
			">
				Long-term concepts are best represented in the middle layers of the network
				whereas short-term concepts are best represented in the final layers. Each
				distribution shows the layer in which probes had the highest accuracies.
			</figcaption>
		</figure>
	{/if}

	<!-- ═══ AZ Learns to Use Concepts ═══ -->
	<h2 id="behavioral" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>AlphaZero learns to use concepts<a href="#behavioral" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		AZ improves on the behavioral tests about 50% of the way through training. MCTS
		passing rates increase before the policy network rates&mdash;the solid line,
		which reports the proportion of cases where the correct action's logit is more than
		one standard deviation above the mean, rises earliest. This suggests
		"pre-conceptual" information is learned and coalesces into actionable understanding
		around 60% of the way through training.
	</p>

	{#if positiveCurves}
		<figure class="my-8 [counter-increment:figure-counter]">
			<LearningCurves data={positiveCurves} concepts={positiveConcepts} height={440} />
			<figcaption class="
				block w-full mt-2 mb-0
				text-[0.9rem] leading-snug
				font-serif text-left text-ink-3
				before:content-['Figure_'_counter(figure-counter)_':_']
				before:font-semibold
			">
				Learning curves for positive concepts. At each training checkpoint, we test
				whether AZ plays the concept-expected move. Blue: MCTS action has Z &gt; 1;
				yellow: MCTS selects the correct action; pink (dashed): policy network selects
				the correct action. All rise sharply around checkpoint 10–14.
			</figcaption>
		</figure>
	{/if}

	<p class="mb-5 text-[17px] leading-relaxed">
		AZ also improves on negative concepts, but does not reach a perfect passing rate.
		At the end of training, AZ still plays moves in ~25% of behavioral tests that will
		not impact the game. This is likely because AZ's loss function has no term to
		encourage winning <em>quickly</em>&mdash;only winning. When all value estimates are
		high, AZ sees little distinction between efficient and inefficient paths to
		victory.<Sidenote id="sn-wasted">In one hand-analyzed example from selfplay, AZ
		placed higher probability on a move that extended the game rather than the move that
		would win immediately, because both had action values above 0.98. MoHex, by contrast,
		is hard-coded to connect pieces as quickly as possible.</Sidenote>
	</p>

	{#if negativeCurves}
		<figure class="my-8 [counter-increment:figure-counter]">
			<NegativeCurves data={negativeCurves} height={240} />
			<figcaption class="
				block w-full mt-2 mb-0
				text-[0.9rem] leading-snug
				font-serif text-left text-ink-3
				before:content-['Figure_'_counter(figure-counter)_':_']
				before:font-semibold
			">
				Negative concept pass rates. <em>Passed</em> = AZ avoids dead/captured cells
				throughout selfplay. Even fully trained, ~25% of moves are wasted.
			</figcaption>
		</figure>
	{/if}

	<!-- ═══ Learning Dynamics ═══ -->
	<h2 id="dynamics" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Learning dynamics<a href="#dynamics" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		MCTS directly governs decision-making; the network body processes board
		configurations. In principle, either could discover game concepts first. We find that
		improvements in behavioral tests (driven by MCTS) precede improvements in probing
		accuracy (driven by the network). MCTS discovers concepts first; then, as the policy
		network is trained to match the MCTS logits, the concept representation is absorbed
		into the network.<Sidenote id="sn-curriculum">While behavioral tests start to
		improve before probing, both converge near the end of training. Exception: the
		ladder escape and bottleneck concepts are easy for probes to detect&mdash;perhaps
		because they occur along board edges and have fewer possible
		configurations.</Sidenote>
	</p>

	{#if convergenceData}
		<figure class="my-8 [counter-increment:figure-counter]">
			<ConvergenceChart data={convergenceData} height={320} />
			<figcaption class="
				block w-full mt-2 mb-0
				text-[0.9rem] leading-snug
				font-serif text-left text-ink-3
				before:content-['Figure_'_counter(figure-counter)_':_']
				before:font-semibold
			">
				Improvements in behavioral tests occur before improvements in probing accuracy.
				Circles mark when each metric first improves; crosses mark convergence.
				For most concepts, behavioral tests (blue) improve before probing accuracy (pink),
				confirming that MCTS discovers concepts before the network internalizes them.
				Board structure (gold) converges on a similar timeline to probing.
			</figcaption>
		</figure>
	{/if}

	<!-- ═══ Board Structure ═══ -->
	<h2 id="structure" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Board structure<a href="#structure" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		Understanding Hex's concepts requires understanding the board's
		structure&mdash;which cells connect to which. AZ's feed-forward architecture does
		not <em>a priori</em> represent this. We extract cell embeddings from AZ's first
		layer and compute dot-product similarities. The nearest neighbors according to
		these scores nearly match the ground-truth hexagonal neighborhood by the
		15th of 20 training checkpoints.<Sidenote id="sn-ndcg">We evaluate alignment
		via Normalized Discounted Cumulative Gain (NDCG). The NDCG first improves
		about 50% of the way through training&mdash;notably, only <em>after</em> the first
		improvements in behavioral tests, ruling out a simple "first learn the board,
		then learn concepts" narrative.</Sidenote>
	</p>

	{#if boardCellData}
		<figure class="my-8 [counter-increment:figure-counter]">
			<HexBoard cellData={boardCellData} size={420} />
			<figcaption class="
				block w-full mt-2 mb-0
				text-[0.9rem] leading-snug
				font-serif text-left text-ink-3
				before:content-['Figure_'_counter(figure-counter)_':_']
				before:font-semibold
			">
				Reconstructed board structure from per-cell overlap scores (D3). Arrows
				to true hex neighbors fade in as overlap increases; noise arrows to
				random cells fade out. Cells color from grey to red with overlap.
				All 20 checkpoints are available via the slider.
			</figcaption>
		</figure>
	{/if}

	<!-- ═══ Citation ═══ -->
	<h2 id="citation" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Citation<a href="#citation" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		See more details in our paper,
		<a href="https://proceedings.neurips.cc/paper_files/paper/2022/hash/79bf4400e1e4e6b209650e3c06e5e9e6-Abstract-Conference.html"
			class="underline decoration-ink-4/30 hover:text-ink-2 hover:decoration-ink-2/30 transition-all"
		>Evaluation Beyond Task Performance: Analyzing Concepts in AlphaZero in Hex</a>.
	</p>

	<div class="relative group">
		<CopyButton text={`@inproceedings{lovering2022evaluation,
    title     = "Evaluation Beyond Task Performance:
                 Analyzing Concepts in {A}lpha{Z}ero
                 in {H}ex",
    author    = "Lovering, Charles and
                 Forde, Jessica Zosa and
                 Konidaris, George and
                 Pavlick, Ellie and
                 Littman, Michael L.",
    booktitle = "Advances in Neural Information
                 Processing Systems",
    year      = "2022",
}`} />
		<pre class="bg-surface-code rounded text-[13px] leading-snug p-4 overflow-x-auto font-mono text-ink-3"><code>@inproceedings&#123;lovering2022evaluation,
    title     = "Evaluation Beyond Task Performance:
                 Analyzing Concepts in &#123;A&#125;lpha&#123;Z&#125;ero
                 in &#123;H&#125;ex",
    author    = "Lovering, Charles and
                 Forde, Jessica Zosa and
                 Konidaris, George and
                 Pavlick, Ellie and
                 Littman, Michael L.",
    booktitle = "Advances in Neural Information
                 Processing Systems",
    year      = "2022",
&#125;</code></pre>
	</div>

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
