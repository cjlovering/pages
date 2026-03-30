<script>
	import Toc from '$lib/components/Toc.svelte';
	import Sidenote from '$lib/components/Sidenote.svelte';
	import Figure from '$lib/components/Figure.svelte';

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
</script>

<svelte:head>
	<title>Evaluation Beyond Task Performance</title>
</svelte:head>

<!-- Post Heading -->
<div id="top" class="mx-auto max-w-[660px] text-left">
	<h1 class="font-serif font-semibold text-[30px] mt-6 leading-snug">
		Evaluation Beyond Task Performance: Analyzing Concepts in AlphaZero in Hex
	</h1>
	<p class="text-[18px] leading-none tracking-wide font-sans mt-6 mb-5">
		<span class="text-ink-3">Charles Lovering*, Jessica Zosa Forde*, George Konidaris, Ellie Pavlick, Michael L. Littman &mdash;
			<a href="https://cs.brown.edu"
				class="text-inherit no-underline hover:underline hover:decoration-ink/20 hover:underline-offset-2"
			>Brown</a>
		</span>
	</p>
	<div class="flex flex-wrap gap-2 mb-14">
		<a href="https://proceedings.neurips.cc/paper_files/paper/2022/hash/79bf4400e1e4e6b209650e3c06e5e9e6-Abstract-Conference.html" target="_blank" rel="noopener noreferrer"
			class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-sans text-ink-3 bg-surface border border-border-light no-underline hover:border-ink-4/40 hover:text-ink-2 transition-all">
			📄 Paper
		</a>
		<a href="https://github.com/jzf2101/alphatology" target="_blank" rel="noopener noreferrer"
			class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-sans text-ink-3 bg-surface border border-border-light no-underline hover:border-ink-4/40 hover:text-ink-2 transition-all">
			💻 Code
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
		AlphaZero, an approach to reinforcement learning that couples neural networks
		and Monte Carlo tree search (MCTS), has produced state-of-the-art strategies for
		traditional board games like chess, Go, shogi, and Hex. While researchers and
		game commentators have suggested that AlphaZero uses concepts that humans
		consider important, it is unclear how these concepts are captured in the network.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		Good performance can mask flaws in deep learning systems
		generally.<Sidenote id="sn-mask">This observation applies across fields.
		In NLP, models achieve high task accuracy while failing on targeted challenge
		sets. In RL, agents can play at superhuman levels while demonstrating surprising
		conceptual gaps.</Sidenote>
		Evaluating systems in terms of task performance alone makes it impossible to know
		if systems are "right for the right reasons" and difficult to predict how they will
		generalize to new situations. Recently, the field of natural language processing (NLP)
		has begun to develop evaluation techniques that go beyond "just" task
		performance&mdash;for example, <em>probing classifiers</em> inspect the form of models'
		internal representations, and <em>behavioral tests</em> evaluate specific types of
		out-of-distribution generalization.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		We investigate AlphaZero's internal representations in the game of Hex using
		these two evaluation techniques from NLP. Our analyses reveal interesting patterns
		and generate testable hypotheses about how such models learn in general. For example,
		we find that MCTS discovers concepts before the neural network learns to encode them.
		We also find that concepts related to short-term end-game planning are best encoded in
		the final layers of the model, whereas concepts related to long-term planning are
		encoded in the middle layers.
	</p>

	<!-- ═══ Concepts in Hex ═══ -->
	<h2 id="concepts" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Concepts in Hex<a href="#concepts" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		Hex is a board game where two players take turns filling cells until one player
		builds a chain across the board. Unlike Go, there are no captures; once a cell
		is filled with a piece, the piece stays there for the remainder of the game.
		Hex cannot end in a tie, and given perfect play, the first player will
		win.<Sidenote id="sn-hex">Hex has well-studied rules, reasonable computational
		costs, and can be evaluated against perfect play, making it an ideal experimental
		vehicle for model probing.</Sidenote>
	</p>

	<Figure src="/alphatology/fig1-hex-intro.png" alt="Hex board basics: a winning board for black and short- vs long-term concept examples" maxWidth="600px">
		<em>Left:</em> An example winning board for black, which connects the black edges
		together. <em>Center and right:</em> Short- vs long-term concepts. If black plays A
		or B in the center board, black immediately wins; the <em>bridge</em> concept is
		relevant in the short-term. In the right board, A and B can help black win only in
		the long-term.
	</Figure>

	<p class="mb-5 text-[17px] leading-relaxed">
		In Hex, certain templates&mdash;patterns of cells&mdash;have been recognized as useful.
		A key part of learning how to play Hex is recognizing when it is possible to connect
		groups of pieces together. We consider these templates to be <em>concepts</em> within
		the game. We define a concept to be <strong>short-term</strong> if its use is sufficient
		to win the game (typically when connected to the player's board edges), and
		<strong>long-term</strong> otherwise.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		From Seymour and King, we identify nine concepts that fall into four categories.
		<strong>Internal concepts</strong> (bridge, crescent, trapezoid, span) are templates
		that appear within the interior of the board and provide several possibilities
		to connect a player's pieces.
		<strong>Edge concepts</strong> concern connecting a single cell to a given edge.
		<strong>Ladder concepts</strong> (bottleneck, escape) are analogous to ladders in
		Go&mdash;a bottleneck favors the defender because the attacker cannot break through,
		while an escape allows the attacker to break through.
		<strong>Negative concepts</strong> (dead cells, captured cells) identify which
		actions <em>not</em> to play rather than which to play. Dead cells cannot impact the
		outcome of the game regardless of the color with which they are
		filled.<Sidenote id="sn-neg">If a player can <em>make</em> a cell dead, that
		cell is captured. Both captured and dead cells should never be filled.</Sidenote>
	</p>

	<Figure src="/alphatology/fig2-concepts.png" alt="Hex concept taxonomy showing bridge, crescent, trapezoid, span, edge, bottleneck, escape, dead cells, and captured cells" maxWidth="660px">
		Hex templates exemplifying game concepts. Positive concepts provide the player
		with multiple ways to connect pieces despite possible attacks from the opponent.
		Negative concepts change the strategic value of specific open spots of the board.
		Arrows indicate that the piece is connected to the opposite side of the board; the
		lines show the bridge concept within the other concepts.
	</Figure>

	<!-- ═══ Evaluation Methods ═══ -->
	<h2 id="methods" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Evaluation methods<a href="#methods" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		To understand the concepts encoded within AlphaZero, we use two complementary
		evaluation techniques.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		<strong>Probing classifiers</strong> ask whether concepts are <em>represented</em>
		within the model. Each concept is defined by a set of boards with vs. without that
		concept. We train and evaluate linear probes over AlphaZero's internal activations
		to predict concept presence. To control for surface-level features, we measure
		<em>concept selectivity</em>&mdash;the delta between probing accuracy and a random
		control that shuffles cell positions so that the resulting boards are meaningless in
		Hex.<Sidenote id="sn-selectivity">We follow Hewitt and Liang's procedure to
		measure concept selectivity. The selectivity baseline randomly maps board pieces
		so that the new boards do not contain structures known to be relevant to
		Hex.</Sidenote>
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		<strong>Behavioral tests</strong> ask whether the model <em>uses</em> concepts in
		gameplay. For positive concepts, we construct forced situations: if AZ understands
		the concept and plays the expected moves, AZ will win and pass the test; otherwise,
		AZ will lose the game and fail the test. For negative concepts, we check that during
		a selfplay continuation of a board containing a dead (or captured) cell, the agent
		does not fill that cell.
	</p>

	<Figure src="/alphatology/fig3-behavioral-tests.png" alt="Creating behavioral tests from concept templates in four steps" maxWidth="550px">
		Creating behavioral tests from concept templates. The minimal template (a)
		is translated to a random position on the board (b). Then both players' pieces
		are connected to their respective edges (c). Finally, noise pieces are added to
		form a valid board (d). Cells A and B define the forced line: if white plays A,
		black must play B to win.
	</Figure>

	<!-- ═══ AZ Encodes Concepts ═══ -->
	<h2 id="probing" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>AlphaZero encodes concepts<a href="#probing" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		AZ successfully encodes both long-term and short-term concepts with high
		selectivity. The probing classifiers detect these concepts well above the selectivity
		baseline, confirming that concept-specific information is present in the network's
		internal representations&mdash;not just surface-level board features.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		Perhaps more interesting is <em>where</em> in the network these concepts live.
		Long-term concepts are best represented in the middle layers of the network, whereas
		short-term concepts are best represented in the final layers. This parallels findings
		in NLP, where different types of linguistic information are encoded at different
		depths.<Sidenote id="sn-layers">Concurrent work by McGrath et al. on chess found
		a consistent pattern: short-term concepts (their Fig. 2 [c,e,f]) are better
		represented in higher layers than long-term concepts (Fig. 2
		[a,g,h,i]).</Sidenote>
	</p>

	<Figure src="/alphatology/fig4-probing.png" alt="Probing performance showing concept selectivity and layer-wise distribution" maxWidth="660px">
		<em>Left:</em> Probing selectivity for long-term and short-term concepts.
		The colored bars show the accuracy of a probe trained to identify a concept,
		minus a selectivity baseline. <em>Right:</em> Long-term concepts are best
		represented in the middle layers; short-term concepts in the final layers.
		Each distribution shows which layer the probe achieved highest accuracy.
	</Figure>

	<!-- ═══ AZ Learns to Use Concepts ═══ -->
	<h2 id="behavioral" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>AlphaZero learns to use concepts<a href="#behavioral" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		AZ improves on the behavioral tests about 50% of the way through training. The
		MCTS passing rates increase before the policy network passing rates, though it need
		not have been the case&mdash;it is possible for the network body to start representing
		concepts before MCTS uses them, for instance via the value function signal.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		The relative magnitude of the correct action logits initially increases earlier.
		The Z-score line reports the proportion of cases where the correct action's logit
		is more than one standard deviation above the mean. This trend suggests
		"pre-conceptual" information is learned, and coalesces&mdash;for bridge, around
		60% of the way through training&mdash;into an actionable understanding of the
		concept.<Sidenote id="sn-preconceptual">In Section 4.4 of the paper, we
		investigate further and find that this "pre-conceptual" information is not
		board structure.</Sidenote>
	</p>

	<Figure src="/alphatology/fig5a-positive-curves.png" alt="Learning curves showing AlphaZero acquiring positive concepts over training" maxWidth="550px">
		AlphaZero learns to use positive concepts. At each checkpoint, we test AZ's
		ability to utilize each concept. MCTS and the policy network both select actions
		that pass our behavioral tests with increasing frequency throughout training.
		The blue line reports the rate at which the correct action's logit Z-score exceeds 1.
	</Figure>

	<p class="mb-5 text-[17px] leading-relaxed">
		AZ also improves on negative concepts, but does not reach a perfect passing rate.
		The probing performance for negative concepts is also lower than for other concepts.
		This aligns with evidence that AZ wastes moves at the end of the game. This
		highlights a weakness in AlphaZero and a risk: some concepts may be "provable" and
		useful to people, but "deemed" less important by AZ&mdash;an agent that plays
		remarkably well.
	</p>

	<Figure src="/alphatology/fig5b-negative-curves.png" alt="Negative concept learning curves showing incomplete mastery" maxWidth="280px">
		AZ does not fully use the negative concepts. <em>Passed</em> denotes the rate
		at which AZ avoids the negative concept throughout selfplay rollouts. At the end
		of training, AZ still plays moves in 25% of behavioral tests that will not impact
		the game.
	</Figure>

	<!-- ═══ Learning Dynamics ═══ -->
	<h2 id="dynamics" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Learning dynamics<a href="#dynamics" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		Where the network body processes board configurations, MCTS directly governs the
		decision-making process. In principle, either module could be the first to discover
		game concepts. We find that the first improvements in behavioral tests precede the
		first improvements in probing accuracy. MCTS seems to discover concepts,
		especially the internal concepts. Then, as the policy network is trained to match the
		MCTS logits, the concept representation is absorbed into the network.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		We also find evidence that the structure of the board is first learned at about the
		same time other concepts are learned. This suggests that AZ does not learn concepts
		according to an obvious order or curriculum, but rather, concepts of differing levels
		of complexity develop in parallel.<Sidenote id="sn-curriculum">While behavioral
		tests start to improve before probing, they both converge near the end of training.
		Exception: the ladder escape and bottleneck concepts are easy for the probes to
		detect, perhaps because they occur along the edges of the board and have fewer
		possible configurations.</Sidenote>
	</p>

	<Figure src="/alphatology/fig6-timeline.png" alt="Timeline showing behavioral tests improve before probing accuracy across all concepts" maxWidth="660px">
		Improvements in behavioral tests occur before improvements in probing accuracy.
		Each point marks the mean checkpoint in training that AZ started to learn (or
		converge upon) the behavioral (or probing) test. While behavioral tests start to
		improve before probing, they both converge near the end of training. The
		<em>structural</em> column evaluates how well AZ's cell embeddings capture Hex's
		neighborhood structure.
	</Figure>

	<!-- ═══ Board Structure ═══ -->
	<h2 id="structure" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Board structure<a href="#structure" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		Understanding Hex's concepts requires understanding the board's structure&mdash;which
		cells connect to which other cells. AlphaZero, with its feed-forward network
		architecture, does not <em>a priori</em> represent this structure. We hypothesized
		that the structure of Hex's board is implicitly learned by AZ's first layer.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		For each Hex cell, we extract a cell embedding from the first layer of AZ. We then
		compute the dot products between each cell embedding. The dot-product score between
		ground-truth neighbors increases throughout AZ's training. The nearest neighbors
		(according to the dot-product scores) nearly match the ground truth by the 15th of
		20 checkpoints, and eventually match the ground truth before deviating
		slightly.<Sidenote id="sn-ndcg">We evaluate how well the dot-product scores
		align with the ground-truth cell distances via Normalized Discounted Cumulative
		Gain (NDCG). The NDCG first improves about 50% of the way through
		training.</Sidenote>
	</p>

	<Figure src="/alphatology/fig7-board-structure.png" alt="Implicit board structure learned by AlphaZero showing nearest neighbor arrows" maxWidth="300px">
		Implicit board structure. Arrows mark the learned nearest neighbors of each
		cell, based on dot-product similarity of cell embeddings in the first layer.
		The learned structure closely matches the true hexagonal neighborhood by the
		end of training.
	</Figure>

	<p class="mb-5 text-[17px] leading-relaxed">
		However, we find no evidence that the neighborhood structure is learned in the
		initial stages of training. Rather, it appears to be learned only after the first
		improvements in behavioral tests. This rules out a simple "first learn the board,
		then learn concepts" narrative.
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
		<a href="https://proceedings.neurips.cc/paper_files/paper/2022/hash/79bf4400e1e4e6b209650e3c06e5e9e6-Abstract-Conference.html"
			class="underline decoration-ink-4/30 hover:text-ink-2 hover:decoration-ink-2/30 transition-all"
		>Evaluation Beyond Task Performance: Analyzing Concepts in AlphaZero in Hex</a>.
	</p>

	<pre class="bg-surface-code rounded text-[13px] leading-snug p-4 overflow-x-auto font-mono text-ink-3"><code>@inproceedings&#123;lovering2022evaluation,
    title = "Evaluation Beyond Task Performance:
             Analyzing Concepts in AlphaZero in Hex",
    author = "Lovering, Charles and
      Forde, Jessica Zosa and
      Konidaris, George and
      Pavlick, Ellie and
      Littman, Michael L.",
    booktitle = "Advances in Neural Information
                 Processing Systems",
    year = "2022",
    url = "https://proceedings.neurips.cc/paper_files/paper/2022/hash/79bf4400e1e4e6b209650e3c06e5e9e6-Abstract-Conference.html",
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
