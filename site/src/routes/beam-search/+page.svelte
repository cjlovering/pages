<script>
	import { base } from '$app/paths';
	import Sidenote from '$lib/components/Sidenote.svelte';
	import Figure from '$lib/components/Figure.svelte';
	import PostHeader from '$lib/components/PostHeader.svelte';
	import { posts } from '$lib/posts';

	const post = posts.find(p => p.slug === 'beam-search');
</script>

<PostHeader {post} />

<article class="relative max-w-prose mx-auto">
	<section>
		<p class="mb-8">
			Beam search is a method for decoding a sequence given an auto-regressive function that outputs a probability
			distribution over the next possible symbols. Ideally, a search algorithm would traverse all paths and select
			the most probable sequence. However, this is prohibitively expensive.
		</p>

		<p>
			This search algorithm is often used in translation. Beam search is most often used at test time, not during
			training. For a full implementation see
			<a href="https://github.com/OpenNMT/OpenNMT-py/blob/master/onmt/translate/beam.py" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">OpenNMT</a>.
		</p>

		<p>
			Beam search works iteratively. The details depend on the decoding function: a hidden Markov model with a
			memory of 1 consumes the previous symbol; recurrent neural networks are
			stateful<Sidenote id="sn-cho">Cho, K. et al. (2014). Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation.</Sidenote>;
			and transformer networks consume the entire
			prefix<Sidenote id="sn-vaswani">Vaswani, A. et al. (2017). Attention is All You Need.</Sidenote>.
		</p>

		<h3 id="walkthrough" class="text-xl font-serif font-normal mt-10 mb-4">Walkthrough</h3>

		<p class="mb-8">
			Given a function which takes a prefix of a sequence and outputs a probability distribution of output symbols
			for the next item in the sequence, beam search is an approximate algorithm which searches for the path that
			results in the most probable sequence. The path with the highest probability to start with may not end up
			being the most likely sequence. Log probability is used so that we can sum together the probabilities and
			avoid floating point errors.
		</p>

		<p>
			In this example, we will compute symbols until we reach the maximum length of 4, and maintain 2 beams
			(or hypotheses). There are three output symbols (A, B, C). The log probabilities from the start symbol are
			-0.39, -0.60, and -0.45.
		</p>

		<Figure src="{base}/images/beam-search/beam-search-table-01.svg" alt="Beam search step 1" maxWidth="600px">
			Step 1.
		</Figure>

		<p>
			The selected options are those with the highest log probabilities. Now, we will generate the next step's
			probabilities given these two prefixes (S-A and S-C). Here the search will now continue in different branches.
			The outputs that are highlighted green indicate that they are the paths with the current highest log probabilities.
		</p>

		<Figure src="{base}/images/beam-search/beam-search-table-02.svg" alt="Beam search step 2" maxWidth="600px">
			Step 2.
		</Figure>

		<p>
			Note that in this time step one branch will fade completely, as the other branch contains all the options
			with the lowest probabilities.
		</p>

		<Figure src="{base}/images/beam-search/beam-search-table-03.svg" alt="Beam search step 3" maxWidth="600px">
			Step 3.
		</Figure>

		<p>Finally, beam search will select the path with the total lowest log probability.</p>

		<Figure src="{base}/images/beam-search/beam-search-table-04.svg" alt="Beam search step 4" maxWidth="600px">
			Step 4.
		</Figure>

	</section>
</article>
