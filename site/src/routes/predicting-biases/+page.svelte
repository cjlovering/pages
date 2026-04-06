<script>
	import { base } from '$app/paths';
	import Toc from '$lib/components/Toc.svelte';
	import Sidenote from '$lib/components/Sidenote.svelte';
	import Figure from '$lib/components/Figure.svelte';
	import PostHeader from '$lib/components/PostHeader.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { posts } from '$lib/posts';

	const post = posts.find(p => p.slug === 'predicting-biases');

	const tocItems = [
		{ label: 'Introduction', href: '#introduction' },
		{ label: 'Setup', href: '#setup' },
		{ label: 'Synthetic experiments', href: '#synthetic' },
		{ label: 'Naturalistic experiments', href: '#naturalistic' },
		{ label: 'Takeaways', href: '#takeaways' },
		{ label: 'Citation', href: '#citation' },
	];
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
		Pre-trained language models encode rich linguistic features&mdash;probing classifiers
		can decode syntax, semantics, and more with high accuracy. Yet when these same models
		are fine-tuned for downstream tasks, they often rely on spurious heuristics instead.
		Why would a model prefer a weak feature over a stronger one, if both are extractable
		from its representations?
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		We test a simple hypothesis: a model's use of a feature can be predicted from two
		factors&mdash;the feature's <strong>extractability</strong> after pre-training (how
		easily it can be decoded from the representation) and the <strong>evidence</strong>
		available during fine-tuning (how often the feature co-occurs with the
		label).<Sidenote id="sn-mccoy">Our motivation comes from
		<a href="https://arxiv.org/abs/1902.01007" class="underline decoration-ink-4/30">McCoy et al. (2019)</a>,
		which showed that BERT fine-tuned on NLI relies on lexical overlap heuristics despite
		having access to richer syntactic features.</Sidenote>
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		The core finding: the more extractable a target feature is <em>relative</em> to a
		competing spurious feature, the less statistical evidence the model needs during
		fine-tuning to prefer the right feature. Probing classifiers can thus be viewed as
		measures of a representation's <em>inductive biases</em>.
	</p>

	<!-- ═══ Setup ═══ -->
	<h2 id="setup" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Setup and terminology<a href="#setup" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		Consider a binary classification task with a <strong>target feature</strong> <em>t</em>
		that perfectly predicts the label, and a <strong>spurious feature</strong> <em>s</em>
		that is correlated with the label but not infallible. We partition examples into four
		regions based on which features hold:
	</p>

	<Figure src="{base}/predicting-biases/fig1-partitions.png" alt="Four partitions of the data" maxWidth="360px">
		We partition the data by which features (target and/or spurious) hold for each example.
		Training samples <em>D</em> provide varying amounts of <em>s</em>-only examples as evidence
		against the spurious feature.
	</Figure>

	<p class="mb-5 text-[17px] leading-relaxed">
		The <strong>s-only rate</strong> is the proportion of training examples where the spurious
		feature occurs without the target&mdash;this is the model's evidence that <em>s</em> alone
		should not be trusted. The <strong>s-only error</strong> measures how much the model still
		relies on the spurious feature at test time.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		To quantify extractability, we use <strong>Minimum Description Length</strong>
		(MDL),<Sidenote id="sn-mdl">MDL, first applied to probing by
		<a href="https://arxiv.org/abs/2003.12298" class="underline decoration-ink-4/30">Voita &amp; Titov (2020)</a>,
		measures the number of bits required to communicate feature labels given the representations.
		Lower MDL means the feature is easier to extract.</Sidenote> an information-theoretic
		metric that captures both how <em>accurately</em> a feature can be decoded and how much
		<em>effort</em> is required. The key quantity is the <strong>relative extractability</strong>:
		MDL(<em>s</em>)/MDL(<em>t</em>). When this ratio is high, the target is easier to extract
		than the spurious feature.
	</p>

	<blockquote class="bg-surface-code rounded px-5 py-4 my-8 border-l-2 border-ink-5/30">
		<p class="text-[17px] leading-relaxed mb-0">
			<strong>Hypothesis:</strong> A model's use of the target feature is modulated by the
			relative extractability of <em>t</em> vs. <em>s</em> and the evidence from s-only
			examples. Higher relative extractability of <em>t</em> &rarr; the model needs less
			evidence to prefer <em>t</em> over <em>s</em>.
		</p>
	</blockquote>

	<!-- ═══ Synthetic Experiments ═══ -->
	<h2 id="synthetic" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Synthetic experiments<a href="#synthetic" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		We first test the hypothesis in a clean setting using synthetic data: sequences of 10
		numbers classified by a 1-layer LSTM. The spurious feature <em>s</em> is always the
		presence of the symbol 2. We vary the target feature <em>t</em> to achieve different
		levels of extractability:
	</p>

	<div class="overflow-x-auto my-8">
		<table class="mx-auto border-collapse text-[0.95rem] leading-normal">
			<thead>
				<tr>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold">Target Feature</th>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold">Description</th>
					<th class="px-4 py-2 text-right border border-ink-4/25 bg-ink-4/5 font-semibold">Rel. MDL</th>
				</tr>
			</thead>
			<tbody>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25 font-mono text-[0.88em]">contains-1</td><td class="px-4 py-2 border border-ink-4/25">1 occurs in the sequence</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">1.259</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25 font-mono text-[0.88em]">prefix-dupl</td><td class="px-4 py-2 border border-ink-4/25">Begins with a duplicate</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.002</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25 font-mono text-[0.88em]">adj-dupl</td><td class="px-4 py-2 border border-ink-4/25">Adjacent duplicate in sequence</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.001</td></tr>
				<tr class="hover:bg-ink-4/[0.03]"><td class="px-4 py-2 border border-ink-4/25 font-mono text-[0.88em]">first-last</td><td class="px-4 py-2 border border-ink-4/25">First number equals last</td><td class="px-4 py-2 border border-ink-4/25 text-right font-mono text-[0.88em]">0.001</td></tr>
			</tbody>
		</table>
	</div>

	<Figure src="{base}/predicting-biases/fig2-synthetic.png" alt="Synthetic experiment results">
		Error on each test partition as a function of s-only rate. When <em>t</em> is as easy to
		extract as <em>s</em> (<code class="px-1 text-accent text-[0.88em] font-mono">contains-1</code>,
		rel. MDL &asymp; 1), the model achieves zero error with almost no evidence. When <em>t</em>
		is harder to extract (<code class="px-1 text-accent text-[0.88em] font-mono">first-last</code>),
		the model fails even with strong evidence against the spurious feature.
	</Figure>

	<!-- ═══ Naturalistic Experiments ═══ -->
	<h2 id="naturalistic" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Naturalistic experiments<a href="#naturalistic" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		We test whether the same trend holds for real language models fine-tuned on naturalistic
		data. We evaluate BERT, RoBERTa, T5, GPT-2, and a GloVe-LSTM on linguistic acceptability
		tasks across three syntactic phenomena: <strong>Subject-Verb Agreement</strong>,
		<strong>Negative Polarity Items</strong>, and <strong>Filler-Gap
		Dependencies</strong>.<Sidenote id="sn-phenomena">For each phenomenon, we introduce
		four types of spurious features (lexical, length, plural, tense), yielding 20 distinct
		(s, t) pairs across which we measure relative extractability.</Sidenote>
	</p>

	<div class="overflow-x-auto my-8">
		<table class="mx-auto border-collapse text-[0.95rem] leading-normal">
			<thead>
				<tr>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold">Target</th>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold">Spurious</th>
					<th class="px-4 py-2 text-left border border-ink-4/25 bg-ink-4/5 font-semibold">Example</th>
				</tr>
			</thead>
			<tbody>
				<tr class="hover:bg-ink-4/[0.03]">
					<td class="px-4 py-2 border border-ink-4/25">Subject agrees with verb</td>
					<td class="px-4 py-2 border border-ink-4/25">Preceding noun is singular</td>
					<td class="px-4 py-2 border border-ink-4/25 text-[0.88em] italic">&ldquo;The piano teachers of the lawyer wound&hellip;&rdquo;</td>
				</tr>
				<tr class="hover:bg-ink-4/[0.03]">
					<td class="px-4 py-2 border border-ink-4/25">NPI in licensing context</td>
					<td class="px-4 py-2 border border-ink-4/25">Contains negation word</td>
					<td class="px-4 py-2 border border-ink-4/25 text-[0.88em] italic">&ldquo;No student who was wrong ever resigned.&rdquo;</td>
				</tr>
				<tr class="hover:bg-ink-4/[0.03]">
					<td class="px-4 py-2 border border-ink-4/25">Correct filler-gap</td>
					<td class="px-4 py-2 border border-ink-4/25">Main verb is past tense</td>
					<td class="px-4 py-2 border border-ink-4/25 text-[0.88em] italic">&ldquo;I knew what he recognized __ yesterday.&rdquo;</td>
				</tr>
			</tbody>
		</table>
	</div>

	<p class="mb-5 text-[17px] leading-relaxed">
		We compute Spearman's &rho; between relative extractability and average test F-score
		across all (s, t) pairs. The correlations are strong for the pre-trained models:
		BERT (&rho; = 0.79), RoBERTa (0.83), T5 (0.57), GPT-2 (0.73). For the GloVe-LSTM
		baseline, the correlation is weak (0.14)&mdash;most tasks require an s-only rate of
		0.5 regardless of extractability.
	</p>

	<Figure src="{base}/predicting-biases/fig3-correlations.png" alt="Correlation between MDL and F-score">
		<strong>(a)</strong> Spearman's &rho; between extractability measures and average test
		F-score. Relative extractability (ratio or difference) explains behavior better than
		absolute extractability of either feature alone. <strong>(b)</strong> Logistic regression
		fits showing the relationship for each model; * indicates significance.
	</Figure>

	<p class="mb-5 text-[17px] leading-relaxed">
		The learning curves below show this most clearly. Each line represents one (s, t) pair.
		For pairs where <em>t</em> is easier to extract than <em>s</em> (blue, high MDL ratio),
		the model solves the task correctly even when the training data provides no incentive to
		do so. For pairs where <em>t</em> is harder (red, low ratio), the model requires much
		more statistical evidence before it stops relying on the spurious
		feature.<Sidenote id="sn-t5">T5 generally requires more evidence than BERT. This may be
		because we fine-tuned T5 with a linear classification head rather than the text-only
		output on which it was pre-trained.</Sidenote>
	</p>

	<Figure src="{base}/predicting-biases/fig4-curves.png" alt="Learning curves for BERT and T5">
		Learning curves for BERT and T5. Curves show use of the spurious feature (s-only error)
		as a function of training evidence (s-only rate). When the target is much harder to extract
		than the spurious feature (red, low MDL ratios), the model requires much more evidence to
		achieve low error. Similar patterns hold for GPT-2 and RoBERTa.
	</Figure>

	<!-- ═══ Takeaways ═══ -->
	<h2 id="takeaways" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Takeaways<a href="#takeaways" class="heading-anchor">#</a></span>
	</h2>

	<p class="mb-5 text-[17px] leading-relaxed">
		<strong>Relative extractability predicts feature use.</strong> The more extractable the
		target feature is relative to the spurious one, the less evidence the model needs to
		prefer it. This holds across architectures and both synthetic and naturalistic settings.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		<strong>Fine-tuning may not uncover new features.</strong> If one feature is highly
		extractable and another is not, the easier feature can hide the harder one&mdash;fine-tuning
		may not surface the needed feature even when it is technically decodable from the
		representation. This is a non-trivial finding: it means that if the needed feature is
		not already extractable-enough after pre-training, fine-tuning may not have the desired
		effect.
	</p>

	<p class="mb-5 text-[17px] leading-relaxed">
		<strong>Probing classifiers as measures of inductive bias.</strong> A feature is
		&ldquo;sufficiently&rdquo; encoded if it is as available to the model as surface features
		of the text. If a fine-tuned model can access semantic role features as easily as lexical
		identity, it may need little or no explicit signal to prefer a decision rule based on the
		structural feature.<Sidenote id="sn-causal">We note that this work has not established
		that the relationship is causal. Intermediate task training could be used to influence
		extractability prior to fine-tuning; e.g.,
		<a href="https://arxiv.org/abs/2005.00628" class="underline decoration-ink-4/30">Merchant et al. (2020)</a>
		suggests fine-tuning on parsing might improve the extractability of syntactic
		features.</Sidenote>
	</p>

	<!-- ═══ Citation ═══ -->
	<h2 id="citation" class="text-[1.45rem] font-semibold mt-12 mb-4 leading-snug relative">
		<span>Citation<a href="#citation" class="heading-anchor">#</a></span>
	</h2>

	<div class="relative group">
		<CopyButton text={`@inproceedings{lovering2021predictinginductive,
  title     = {Predicting Inductive Biases of Fine-tuned Models},
  author    = {Lovering, Charles and Jha, Rohan and Linzen, Tal and Pavlick, Ellie},
  booktitle = {International Conference on Learning Representations},
  year      = {2021},
  url       = {https://openreview.net/forum?id=mNtmhaDkAr}
}`} />
		<pre class="bg-surface-code text-[0.82rem] leading-relaxed rounded px-5 py-4 overflow-x-auto mb-8 border border-border-light"><code>@inproceedings&#123;lovering2021predictinginductive,
  title     = &#123;Predicting Inductive Biases of Fine-tuned Models&#125;,
  author    = &#123;Lovering, Charles and Jha, Rohan and Linzen, Tal and Pavlick, Ellie&#125;,
  booktitle = &#123;International Conference on Learning Representations&#125;,
  year      = &#123;2021&#125;,
  url       = &#123;https://openreview.net/forum?id=mNtmhaDkAr&#125;
&#125;</code></pre>
	</div>

</article>

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
