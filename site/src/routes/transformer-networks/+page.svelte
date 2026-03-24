<script>
	import { base } from '$app/paths';
	import Sidenote from '$lib/components/Sidenote.svelte';
	import Figure from '$lib/components/Figure.svelte';
	import Toc from '$lib/components/Toc.svelte';

	const tocItems = [
		{ label: 'Introduction', href: '#introduction' },
		{ label: 'Overview', href: '#overview' },
		{ label: 'Encoder-Decoder', href: '#encoder-decoder' },
		{ label: 'Scaled Dot-Product Attention', href: '#scaled-dot-product-attention',
			children: [
				{ label: 'Self Attention', href: '#self-attention' },
				{ label: 'Multi-Head Attention', href: '#multi-head-attention' }
			]
		},
		{ label: 'Other Features', href: '#other-features' },
		{ label: 'Architecture', href: '#architecture',
			children: [
				{ label: 'Encoder', href: '#encoder' },
				{ label: 'Decoder', href: '#decoder' },
				{ label: 'Decoding', href: '#decoding' }
			]
		}
	];
</script>

<svelte:head>
	<title>Transformer Networks</title>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
</svelte:head>

<article class="relative max-w-prose mx-auto">
	<Toc items={tocItems} />

	<header class="mb-8">
		<h1 class="text-3xl font-serif font-normal mb-1 text-ink">Transformer Networks</h1>
		<p class="text-ink-3 text-[1.05rem] leading-relaxed">Attention is all you need.</p>
		<p class="text-ink-4 text-[0.85rem] font-sans mt-2">
			Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin
		</p>
	</header>

	<section>
		<p class="bg-surface rounded px-4 py-3 text-[0.9rem] mb-6">
			Since the release of BERT and GPT-2, I created a set of slides that are more clear than these notes with
			better examples. See them
			<a href="{base}/images/transformer-networks/transformer-tutorial.pdf" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">here</a>.
		</p>

		<h2 id="introduction" class="text-2xl font-serif font-normal mt-10 mb-4">Introduction</h2>

		<p>
			Attention is all you need<Sidenote id="sn-vaswani">Vaswani, A. et al. (2017). Attention is All You Need. <em>NeurIPS</em>.</Sidenote>
			introduces the Transformer Network. This network is a shift from recurrent networks; economy inspires design.
			It does not use stateful or recurrent functions, and instead it is parallelized across all symbols in an input
			sequence. However, it is difficult at first to see how this works with sequences of different length. The
			primary goal of this post is demonstrating how the Transformer Network fits together.
		</p>

		<h2 id="overview" class="text-2xl font-serif font-normal mt-10 mb-4">Overview</h2>

		<p>
			This work focuses on the task of natural language translation (e.g. translating English to German or vice versa.)
			This notebook focuses on the unique modules the authors present, and how the system fits together. The Transformer
			Network (TN) is composed of attention modules, linear mappings, regularization features and uses an Encoder-Decoder
			structure. Since this publication, Transformer Networks Encoders have been used to great success in a wide range of
			applications<Sidenote id="sn-bert">Devlin, J. et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding.</Sidenote>.
		</p>

		<p>
			I modify and present implementations from the
			<a href="https://github.com/tensorflow/tensor2tensor" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">tensor2tensor</a>
			library and
			<a href="http://nlp.seas.harvard.edu/2018/04/03/attention.html" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">The Annotated Transformer</a>.
			For a complete view and implementation of this system, please visit these sources. Diagrams are recreations,
			and all blocked quotes are from the original paper.
		</p>

		<h2 id="encoder-decoder" class="text-2xl font-serif font-normal mt-10 mb-4">Encoder-Decoder Structure</h2>

		<p>
			The transformer uses an encoder-decoder<Sidenote id="sn-bahdanau">Bahdanau, D. et al. (2014). Neural Machine Translation by Jointly Learning to Align and Translate.</Sidenote>
			structure: an input sequence of symbols, <em>x = {"{"} x<sub>1</sub>, x<sub>2</sub>, ..., x<sub>n</sub> {"}"}</em>,
			is encoded into a sequence of continuous variables, <strong>z</strong> = {"{"} z<sub>1</sub>, z<sub>2</sub>, ..., z<sub>n</sub> {"}"}.
			This is then decoded into a sequence of symbols, <em>y = {"{"} y<sub>1</sub>, y<sub>2</sub>, ..., y<sub>n</sub> {"}"}</em>.
			In some cases, <strong>z</strong> is a single continuous variable rather than a sequence. This generation of symbols
			occurs one at a time — it is auto-regressive, consuming previously generated symbols as additional input when
			generating the next. Encoder-decoders often use recurrent architectures.
		</p>

		<p>
			According to Cho et al., the encoding function <em>e</em> can be any non-linear function, but it is often
			implemented as an RNN.
		</p>

		<div class="my-6 pl-4 border-l-2 border-border">
			<p class="font-mono text-[0.9rem]">h<sub>t</sub> = e(h<sub>t-1</sub>, x<sub>t</sub>)</p>
			<p class="text-ink-3 text-[0.85rem] mt-1">Encoding the input into a hidden state.</p>
		</div>

		<p>
			The input sentence <em>x</em> is encoded into the vector <strong>z</strong>. Depending on the implementation,
			we consider the final hidden states as the encoding, or some operation on all the hidden states.
		</p>

		<div class="my-6 pl-4 border-l-2 border-border">
			<p class="font-mono text-[0.9rem]"><strong>z</strong> = &sum;<sub>t</sub> h<sub>t</sub></p>
			<p class="text-ink-3 text-[0.85rem] mt-1">Summarize the hidden states. Attention could be used here.</p>
		</div>

		<p>
			Next, we decode <strong>z</strong> into the output predictions <em>y</em>. This typically uses a recurrent
			function (RNN).
		</p>

		<div class="my-6 pl-4 border-l-2 border-border grid grid-cols-2 gap-4">
			<div>
				<p class="font-mono text-[0.9rem]">h<sub>t</sub> = d(h<sub>t-1</sub>, y<sub>t-1</sub>, <strong>z</strong>)</p>
				<p class="text-ink-3 text-[0.85rem] mt-1">Process the outputs, given the previous generated symbol along with the summarized vector <strong>z</strong>.</p>
			</div>
			<div>
				<p class="font-mono text-[0.9rem]">y<sub>t</sub> = g(h<sub>t</sub>, y<sub>t-1</sub>, <strong>z</strong>)</p>
				<p class="text-ink-3 text-[0.85rem] mt-1">Decode into output symbols.</p>
			</div>
		</div>

		<ol class="list-decimal pl-6 space-y-1 mb-6">
			<li>It is sequential and cannot be easily parallelized.</li>
			<li>Often <strong>z</strong> is input into each instance of the decoding function. Because from <strong>z</strong> there is O(n) distance to each input symbol, it becomes difficult to learn long range dependencies.</li>
			<li>The path between an output symbol and its corresponding source symbol depends on the length of <em>x</em>.</li>
		</ol>

		<p>
			TN's stateless auto-regressive strategy decodes encoded (but not summarized) source words and the current
			output words, outputting probability distributions for new symbols. This allows the model to be parallelized.
		</p>

		<h2 id="scaled-dot-product-attention" class="text-2xl font-serif font-normal mt-10 mb-4">Scaled Dot-Product Attention</h2>

		<p>The authors describe attention as follows:</p>

		<blockquote class="border-l-2 border-ink-4 pl-4 my-6 text-ink-2 italic">
			An attention function can be described as mapping a query and a set of key-value pairs to an output,
			where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of
			the values, where the weight assigned to each value is computed by a compatibility function of the query
			with the corresponding key.
		</blockquote>

		<p>
			As noted by the authors, attention maps a query to a combination of given outputs, as determined by the
			query's corresponding compatibility with the input keys. As the autological "Scaled Dot-Product Attention"
			method implies, the authors use dot product for their compatibility function. One could use any metric,
			learned or otherwise, for example cosine distance or a feedforward neural network layer.
		</p>

		<p>
			For their formulation of attention to work, there are a few requirements for the inputs. There must be a
			mapping between the keys and values, and the compatibility function must be valid for the queries and the
			keys. In the paper, there is a 1:1 mapping between the keys and values (by index), and the dot-product
			compatibility function requires that the queries and the keys have the same dimensionality.
		</p>

		<Figure src="{base}/images/transformer-networks/attention-explained.svg" alt="Attention intuition" maxWidth="600px">
			Attention intuition.
		</Figure>

		<ol class="list-decimal pl-6 space-y-1 mb-6">
			<li>Each key K<sub>i</sub> maps to a value V<sub>i</sub>.</li>
			<li>Each query Q<sub>j</sub> will operate on all the keys with a compatibility function (dot product). The closer the vectors are in high-dimensional space, the more compatible. These scores will be transformed into a probability distribution by a softmax.</li>
			<li>Then, each query will be mapped to a linear combination of the values as determined by the probability distribution.</li>
		</ol>

		<p>
			As shown in the example above, the query q<sub>1</sub> is most similar to k<sub>1</sub>, thus it is
			predominantly mapped to the corresponding value v<sub>1</sub>.
		</p>

		<div class="my-6 pl-4 border-l-2 border-border">
			<p class="font-mono text-[0.9rem]">A: Q &times; K &times; V &rarr; O</p>
			<p class="font-mono text-[0.9rem] mt-2">A = softmax(QK<sup>T</sup> / &radic;d) V</p>
			<p class="text-ink-3 text-[0.85rem] mt-2">
				Q &isin; &real;<sup>q&times;d</sup>,
				K &isin; &real;<sup>n&times;d</sup>,
				V &isin; &real;<sup>n&times;v</sup>,
				O &isin; &real;<sup>q&times;v</sup>
			</p>
		</div>

		<p>
			The authors note that the variance of a dot product scales with the size of the input vectors. Increased
			variance will result in increased magnitude, "pushing the softmax function into regions where it has extremely
			small gradients." This motivates the scaling of the dot-product based on the dimensionality of the input vectors.
		</p>

		<Figure src="{base}/images/transformer-networks/scaled-dot-product.svg" alt="Scaled dot product attention" maxWidth="350px">
			Scaled dot product attention.
		</Figure>

		<p>Below is an implementation for scaled dot product attention. Each line corresponds to a box in the figure above.</p>

		<pre class="bg-surface-code rounded px-4 py-3 text-[0.85rem] font-mono leading-relaxed overflow-x-auto mb-6"><code class="language-python">def attention(query, key, value, mask=None):
    "Compute 'Scaled Dot Product Attention'"
    # Compatibility function (dot product) between the query and keys.
    scores = torch.matmul(query, key.transpose(-2, -1))
    # Scale the scores depending on the size of the inputs.
    scores = scores / math.sqrt(query.size(-1))
    # Optional mask.
    if mask is not None:
        scores = scores.masked_fill(mask == 0, -1e9)
    # Compute probability distribution across the final dimension.
    p_attn = F.softmax(scores, dim = -1)
    # Output linear combinations of values.
    return torch.matmul(p_attn, value), p_attn</code></pre>

		<h3 id="self-attention" class="text-xl font-serif font-normal mt-10 mb-4">Self Attention</h3>

		<p>
			With a single query, self attention will have no effect. This is because the attention mechanism will be a
			linear combination of the values, and it can only reproduce itself so it serves as an identity function.
		</p>

		<pre class="bg-surface-code rounded px-4 py-3 text-[0.85rem] font-mono leading-relaxed overflow-x-auto mb-6"><code class="language-python">def SelfAttention(X):
    Q, K, V = X, X, X
    return attention(Q, K, V)

&gt;&gt;&gt; out, alpha = SelfAttention(torch.FloatTensor([[0.1,0.1,0.8]]))
&gt;&gt;&gt; print(out)
tensor([[0.1000, 0.1000, 0.8000]])
&gt;&gt;&gt; print(alpha)
tensor([[1.]])</code></pre>

		<p>
			When there are multiple queries, the vectors that are most <em>compatible</em> will become more similar because
			they are mapped to combinations consisting mostly of the already-compatible vectors.
		</p>

		<pre class="bg-surface-code rounded px-4 py-3 text-[0.85rem] font-mono leading-relaxed overflow-x-auto mb-6"><code class="language-python">&gt;&gt;&gt; X = torch.FloatTensor(
    [
        [0,0,1],
        [0,0,2],
        [1,0,0]
    ]
)
&gt;&gt;&gt; out, alpha = SelfAttention(X)
&gt;&gt;&gt; print(alpha)
tensor(
    [
        [0.2992, 0.5329, 0.1679],
        [0.2228, 0.7070, 0.0702],
        [0.2645, 0.2645, 0.4711]
    ]
)</code></pre>

		<p>
			Note that, especially with values greater than 1, a vector can have a greater dot product with other vectors
			rather than itself. Thus, the first vector is mapped to a construction consisting mostly of itself and the second
			vector follows the same trend but more extreme. Lastly, the third vector, less compatible than the others,
			becomes pseudo-normalized.
		</p>

		<h3 id="multi-head-attention" class="text-xl font-serif font-normal mt-10 mb-4">Multi-Head Attention</h3>

		<p>
			The transformer uses "Multi-Head Attention" as its primary module for representational power. It is built up
			using scaled dot product attention. But, rather than attend raw queries a single time, this method attends
			<em>h</em> linear projections of the input. For each of the <em>h</em> heads, the inputs (K, Q, V) are
			linearly projected with a learned mapping.
		</p>

		<div class="my-6 pl-4 border-l-2 border-border space-y-2">
			<p class="font-mono text-[0.9rem]">
				Q &isin; &real;<sup>q&times;m</sup>,
				K &isin; &real;<sup>n&times;m</sup>,
				V &isin; &real;<sup>n&times;m</sup>
			</p>
			<p class="font-mono text-[0.9rem]">W<sub>j</sub><sup>Q</sup>, W<sub>j</sub><sup>K</sup>, W<sub>j</sub><sup>V</sup> &isin; &real;<sup>m&times;d</sup>, &ensp; W<sup>O</sup> &isin; &real;<sup>(h&middot;v)&times;m</sup></p>
			<p class="font-mono text-[0.9rem]">head<sub>i</sub> = Attention(QW<sub>i</sub><sup>Q</sup>, KW<sub>i</sub><sup>K</sup>, VW<sub>i</sub><sup>V</sup>)</p>
			<p class="font-mono text-[0.9rem]">out = Concat(head<sub>0</sub>, ..., head<sub>h</sub>) W<sup>O</sup></p>
		</div>

		<blockquote class="border-l-2 border-ink-4 pl-4 my-6 text-ink-2 italic">
			The compatibility function and the projections are linear. Does including a non-linearity affect the
			performance of this method? How well would the transformer perform using a feed forward layer?
		</blockquote>

		<pre class="bg-surface-code rounded px-4 py-3 text-[0.85rem] font-mono leading-relaxed overflow-x-auto mb-6"><code class="language-python">class MultiHeadedAttention(nn.Module):
    def __init__(self, h, d_model, dropout=0.1):
        """Take in model size and number of heads."""
        super(MultiHeadedAttention, self).__init__()
        assert d_model % h == 0
        self.d_k = d_model // h
        self.h = h
        self.linears = clones(nn.Linear(d_model, d_model), 4)
        self.attn = None
        self.dropout = nn.Dropout(p=dropout)

    def forward(self, query, key, value, mask=None):
        if mask is not None:
            mask = mask.unsqueeze(1)
        nbatches = query.size(0)

        # 1) Do all the linear projections in batch
        query, key, value = \
            [l(x).view(nbatches, -1, self.h, self.d_k).transpose(1, 2)
            for l, x in zip(self.linears, (query, key, value))]

        # 2) Apply attention on all the projected vectors in batch
        x, self.attn = attention(query, key, value, mask=mask,
                                dropout=self.dropout)

        # 3) "Concat" using a view and apply a final linear
        x = x.transpose(1, 2).contiguous() \
            .view(nbatches, -1, self.h * self.d_k)
        return self.linears[-1](x)</code></pre>

		<p>
			Thus, the multi-headed attention is a function from &real;<sup>q&times;d</sup> &rarr; &real;<sup>q&times;v</sup>.
			Like the scaled-dot-product attention, it is able to concurrently operate on all the queries in parallel
			regardless of the size of the sentence. Lastly, this module is able to support <em>h</em> different heads,
			and still output a fixed-size vector for each query by concatenation followed by a linear mapping of the output.
		</p>

		<Figure src="{base}/images/transformer-networks/multi-head.svg" alt="Multi-Headed Attention" maxWidth="400px">
			Multi-Headed Attention.
		</Figure>

		<h2 id="other-features" class="text-2xl font-serif font-normal mt-10 mb-4">Other Features</h2>
		<h3 class="text-xl font-serif font-normal mt-6 mb-4">Position-wise Feed-Forward Networks</h3>

		<p>
			This is two linear transforms with a nonlinear (ReLU) operation. The denotation of position-wise remarks on
			the fact that it is not a convolution, nor does it have any directly spatial functionality.
		</p>

		<div class="my-6 pl-4 border-l-2 border-border">
			<p class="font-mono text-[0.9rem]">FFN(x) = max(0, xW<sub>1</sub> + b<sub>1</sub>)W<sub>2</sub> + b<sub>2</sub></p>
		</div>

		<pre class="bg-surface-code rounded px-4 py-3 text-[0.85rem] font-mono leading-relaxed overflow-x-auto mb-6"><code class="language-python">class PositionwiseFeedForward(nn.Module):
    """Implements FFN equation."""
    def __init__(self, d_model=512, d_ff=2048, dropout=0.1):
        super(PositionwiseFeedForward, self).__init__()
        self.w_1 = nn.Linear(d_model, d_ff)
        self.w_2 = nn.Linear(d_ff, d_model)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        return self.w_2(self.dropout(F.relu(self.w_1(x))))</code></pre>

		<p>
			The remaining features used by the network are residual layers, layer normalization, and positional encoding.
			The structure and features of the model all work to make short paths between inputs and outputs, while also
			being highly regularized.
		</p>

		<p>
			The positional encoding is used to represent the position of the queries in their embeddings. This is important
			because the attention mechanisms have no notion of order among the queries, and order determines the semantics
			of a sentence. The authors use a positional encoding that uses:
		</p>

		<div class="my-6 pl-4 border-l-2 border-border space-y-2">
			<p class="font-mono text-[0.9rem]">PE<sub>(p,2i)</sub> = sin(p / 10000<sup>2i/d<sub>model</sub></sup>)</p>
			<p class="font-mono text-[0.9rem]">PE<sub>(p,2i+1)</sub> = cos(p / 10000<sup>2i/d<sub>model</sub></sup>)</p>
			<p class="text-ink-3 text-[0.85rem] mt-1">where <em>p</em> is the position and <em>i</em> is the dimension.</p>
		</div>

		<blockquote class="border-l-2 border-ink-4 pl-4 my-6 text-ink-2 italic">
			That is, each dimension of the positional encoding corresponds to a sinusoid. The wavelengths form a
			geometric progression from 2&pi; to 10000 &middot; 2&pi;. We chose this function because we hypothesized
			it would allow the model to easily learn to attend by relative positions, since for any fixed offset
			<em>k</em>, PE<sub>pos+k</sub> can be represented as a linear function of PE<sub>pos</sub>.
		</blockquote>

		<Figure src="{base}/images/transformer-networks/pe.svg" alt="Positional encoding" maxWidth="600px">
			Each dimension corresponds to its location; each line in the vertical slice of the graph would be added
			to the corresponding dimension in the word embeddings.
		</Figure>

		<Figure src="{base}/images/transformer-networks/pe-dropout.svg" alt="Positional encoding with dropout" maxWidth="600px">
			The authors use dropout to reduce the strength of the signal.
		</Figure>

		<h2 id="architecture" class="text-2xl font-serif font-normal mt-10 mb-4">Architecture</h2>

		<p>
			Each instance of the transformer will output a probability for the next symbol. The encoder and decoder stacks
			are repeated N times each. In the paper the default was N = 6. The input and output of each stack is of the
			same dimensionality. In addition to attention modules, they use a few techniques to regularize their network:
			layer normalization, residual connections, and dropout.
		</p>

		<Figure src="{base}/images/transformer-networks/architecture.svg" alt="Transformer architecture" maxWidth="500px">
			Architecture.
		</Figure>

		<h3 id="encoder" class="text-xl font-serif font-normal mt-10 mb-4">Encoder</h3>

		<p>The encoder consists of a stack of identical modules.</p>

		<Figure src="{base}/images/transformer-networks/encoder-architecture.svg" alt="Encoder details" maxWidth="500px">
			Transformer Network Encoder Details.
		</Figure>

		<p>
			First, an input embedding for each word is retrieved. TN uses
			<a href="{base}/byte-encoding" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">Byte-Encoding Representation</a>
			with a shared embedding matrix — this itself improves performance. It is a subword tokenization of your
			vocabulary. Next a positional encoding is added pointwise to each dimension of the input vector. The identical
			encoder modules will operate on this representation.
		</p>

		<p>
			The two sublayers are Multi-Head Attention (self-attending) and a feed forward layer. This process manipulates
			the inputs and captures their interactions, outputting a sequence of the same dimensionality.
		</p>

		<p>
			The residual connections maintain a direct path to the inputs, and the normalization stabilizes the embeddings.
			This encoder architecture mirrors Highway Networks<Sidenote id="sn-highway">Srivastava, R. K. et al. (2015). Highway Networks.</Sidenote>
			because additive connections allow for a clear path through the architecture, supporting many layers.
		</p>

		<h3 id="decoder" class="text-xl font-serif font-normal mt-10 mb-4">Decoder</h3>

		<p>
			The decoder resembles the encoder. All symbols already generated (beginning with a start symbol) are embedded
			and combined with the positional encoding.
		</p>

		<Figure src="{base}/images/transformer-networks/decoder-architecture.svg" alt="Decoder details" maxWidth="500px">
			Transformer Network Decoder Details.
		</Figure>

		<p>
			Next, masked self-attention is computed. A mask is applied so that only the right-most output can see previous
			outputs, preventing any contamination. After this, multi-headed attention is applied, where the output sequences
			are the queries, and the encoded symbols are the keys and the values. This maps the dimensionality of the vectors
			to be the same as those outputted by the encoder.
		</p>

		<p>
			After the first "execution" of the decoder, the inputs to the module are derived from the encoded symbols rather
			than the previous output symbols. Note that while the encoder and decoder modules are repeated, they do not share
			weights. They are separate instances. Finally, after decoding the encoded inputs, a linear map is applied to the
			vectors and a softmax generates an output probability distribution.
		</p>

		<h3 id="decoding" class="text-xl font-serif font-normal mt-10 mb-4">Decoding</h3>

		<p>
			The linear layer takes an input of <em>k</em> inputs &real;<sup>d<sub>model</sub></sup> and has a weight shape of
			&real;<sup>d<sub>model</sub> &times; vocab</sup>, outputting &real;<sup>q &times; vocab</sup>. During training,
			the decoding is set so that all subsequent positions are masked out during attention, so that a symbol could never
			see "into the future".
		</p>

		<Figure src="{base}/images/transformer-networks/simple-architecture.svg" alt="Simplified architecture" maxWidth="500px">
			Simplified Transformer Network Architecture.
		</Figure>

		<p>
			When decoding an output sequence, the network is run repeatedly. During the first run <em>q</em> = 1.
			For each run afterwards, <em>q</em> increases, and the right-most dimension is selected as the generated symbol.
		</p>

		<p>A greedy approach looks something like this:</p>

		<pre class="bg-surface-code rounded px-4 py-3 text-[0.85rem] font-mono leading-relaxed overflow-x-auto mb-6"><code class="language-python">def greedy_decode(model, src, src_mask, max_len, start_symbol):
    memory = model.encode(src, src_mask)
    ys = torch.ones(1, 1).fill_(start_symbol).type_as(src.data)
    for i in range(max_len-1):
        out = model.decode(
            memory,
            src_mask,
            Variable(ys),
            Variable(subsequent_mask(ys.size(1)).type_as(src.data)))
        prob = model.generator(out[:, -1])
        _, next_word = torch.max(prob, dim = 1)
        next_word = next_word.data[0]
        ys = torch.cat([ys,
            torch.ones(1, 1).type_as(src.data).fill_(next_word)], dim=1)
    return ys</code></pre>

		<p>
			Using
			<a href="{base}/beam-search" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">beam search</a>
			(as the authors did), a path is selected by maintaining <em>k</em> beams — i.e. the best-so-far <em>k</em> options.
		</p>
	</section>
</article>
