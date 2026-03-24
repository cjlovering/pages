<script>
	import Sidenote from '$lib/components/Sidenote.svelte';
</script>

<svelte:head>
	<title>Byte-Encoding Representation</title>
</svelte:head>

<article class="relative max-w-prose mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-serif font-normal mb-1 text-ink">Byte-Encoding Representation</h1>
		<p class="text-ink-3 text-[1.05rem] leading-relaxed">Neural machine translation of rare words with subword units</p>
		<p class="text-ink-4 text-[0.85rem] font-sans mt-2">Rico Sennrich, Barry Haddow, Alexandra Birch</p>
	</header>

	<section>
		<p>
			This is a subword tokenization of a vocabulary. An example of how this would work and be useful at test time
			from Sennrich et al.<Sidenote id="sn-sennrich">Sennrich, R., Haddow, B., & Birch, A. (2016). Neural Machine Translation of Rare Words with Subword Units. <em>ACL</em>.</Sidenote>
			is as follows:
		</p>

		<pre class="bg-surface-code rounded px-4 py-3 text-[0.85rem] font-mono leading-relaxed overflow-x-auto mb-6"><code>V = {"{"}  "low", "lowest", "newer", "wider" {"}"}
BCE("lower")
&gt; "low", "er"</code></pre>

		<p>
			This is much more valuable than a symbol for an unknown word (UNK). Using the two subword segments,
			it would not be surprising if a model would be able to interpret "lower" correctly.
		</p>

		<p>
			To build this representation, an iterative algorithm can be used to link together the most common segments,
			starting with character pairs. Below is the pseudo code provided by the original authors with a few changes.
			The author provides an optimized implementation that batches and avoids recomputation. It starts bottom up,
			getting the bigram counts for every pair of symbols. These symbols will start out as characters but in later
			steps be common strings.
		</p>

		<pre class="bg-surface-code rounded px-4 py-3 text-[0.85rem] font-mono leading-relaxed overflow-x-auto mb-6"><code class="language-python">import re
import collections

def get_stats(vocab):
    """For the given merge step, get the bigram counts,
    for every pair of symbols (strings).

    For each word and its freq in the corpus, add
    the number of instances for each of its subword parts.
    """
    pairs = collections.defaultdict(int)
    for word, freq in vocab.items():
        symbols = word.split()
        for i in range(len(symbols)-1):
            pairs[symbols[i],symbols[i+1]] += freq
    return pairs

def merge_vocab(pair, v_in):
    """Merge the vocab, adding in the new pair."""
    v_out = {"{}"}
    bigram_pattern = re.escape(' '.join(pair))
    p = re.compile(bigram_pattern)
    for word in v_in:
        w_out = p.sub(''.join(pair), word)
        v_out[w_out] = v_in[word]
    return v_out</code></pre>

		<p>Next, given the bi-counts of a vocabulary, merge the vocabulary to remove repetitions of this bigram.</p>

		<pre class="bg-surface-code rounded px-4 py-3 text-[0.85rem] font-mono leading-relaxed overflow-x-auto mb-6"><code class="language-python">def byte_pair_encoding(vocab, num_merges=5):
    """For the given number of merges,
    find the most common pairs of symbols.
    """
    for _ in range(num_merges):
        pairs = get_stats(vocab)
        best = max(pairs, key=pairs.get)
        if pairs[best] &lt; 2:
            print('no pair has frequency &gt; 1. Stopping\n')
            break
        vocab = merge_vocab(best, vocab)
    print(vocab)</code></pre>

		<pre class="bg-surface-code rounded px-4 py-3 text-[0.85rem] font-mono leading-relaxed overflow-x-auto mb-6"><code>&gt;&gt;&gt; vocab = {"{}"}
    'l o w &lt;/w&gt;' : 5,
    'f a r t h e s t &lt;/w&gt;' : 5,
    'n e w e r &lt;/w&gt;': 5,
    'w i d e r &lt;/w&gt;': 5 {"}"}

&gt;&gt;&gt; byte_pair_encoding(vocab)
{"{"}  'l o w &lt;/w&gt;': 5, 'f a r t h e s t &lt;/w&gt;': 5, 'n e w er &lt;/w&gt;': 5, 'w i d er &lt;/w&gt;': 5  {"}"}
{"{"}  'l o w &lt;/w&gt;': 5, 'f a r t h e s t &lt;/w&gt;': 5, 'n e w er&lt;/w&gt;': 5, 'w i d er&lt;/w&gt;': 5  {"}"}
{"{"}  'lo w &lt;/w&gt;': 5, 'f a r t h e s t &lt;/w&gt;': 5, 'n e w er&lt;/w&gt;': 5, 'w i d er&lt;/w&gt;': 5  {"}"}
{"{"}  'low &lt;/w&gt;': 5, 'f a r t h e s t &lt;/w&gt;': 5, 'n e w er&lt;/w&gt;': 5, 'w i d er&lt;/w&gt;': 5  {"}"}
{"{"}  'low&lt;/w&gt;': 5, 'f a r t h e s t &lt;/w&gt;': 5, 'n e w er&lt;/w&gt;': 5, 'w i d er&lt;/w&gt;': 5  {"}"}</code></pre>
	</section>
</article>
