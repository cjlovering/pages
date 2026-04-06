<script>
	import PostHeader from '$lib/components/PostHeader.svelte';
	import CopyPre from '$lib/components/CopyPre.svelte';
	import { posts } from '$lib/posts';

	const post = posts.find(p => p.slug === 'interpretable-rl');
</script>

<PostHeader {post} />

<article class="relative max-w-prose mx-auto">
	<section>
		<p>
			Our aim here was to reimplement <a href="https://proceedings.neurips.cc/paper_files/paper/2019/file/e9510081ac30ffa83f10b68cde1cac07-Paper.pdf" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">Mott et al. (2019)</a> for the NeurIPS reproducibility challenge. The authors used attention to demonstrate (and constrict) the agents' focus as they learn and play a range of games. This effort was mostly an exercise in torch indexing! It seems that others found the repository useful but I certainly would recommend looking toward other sources for a modern implementation (and option).
		</p>

		<h2 class="text-2xl font-serif font-normal mt-10 mb-4">Architecture</h2>

		<p>
			The core idea is to split CNN+ConvLSTM vision features into keys <strong>K</strong> and values <strong>V</strong> at each spatial location, then compute dot-product attention using learned queries generated from the policy LSTM's hidden state. This produces per-query attention maps over the image grid &mdash; you can visualize <em>where</em> the agent is looking at each timestep, which is the interpretability payoff.
		</p>

		<CopyPre><pre class="bg-surface-code rounded p-4 my-6 overflow-x-auto text-[0.85rem] leading-relaxed"><code class="language-python"># Queries derived from previous policy hidden state
Q_t = self.query(prev_output)  # [B, num_queries, num_keys]

# Dot-product attention: keys at each spatial location scored against each query
A = torch.matmul(K_t, Q_t.transpose(2, 1).unsqueeze(1))  # [B, h, w, num_queries]
A = spatial_softmax(A)  # normalize over h×w per query

# Weighted readout of values
answers = apply_attention(A, V_t)  # [B, num_queries, num_values]</code></pre></CopyPre>

		<p>
			The spatial softmax normalizes over the <em>h &times; w</em> grid independently per query (not over channels), so each query's attention map sums to 1 across spatial positions &mdash; a proper "where to look" distribution.
		</p>

		<p>
			Rather than learned positional embeddings, a fixed cosine basis is concatenated to both keys and values. It is constructed as an outer product of cosine functions over height and width coordinates, giving the attention mechanism access to absolute position without any extra learned parameters.
		</p>

		<CopyPre><pre class="bg-surface-code rounded p-4 my-6 overflow-x-auto text-[0.85rem] leading-relaxed"><code class="language-python"># Cosine basis: outer product of cos(position * frequency) over h and w
a = torch.mul(p_h.unsqueeze(2), u_basis)   # height × frequency
b = torch.mul(p_w.unsqueeze(2), v_basis)   # width × frequency
out = torch.einsum("hwu,hwv->hwuv", torch.cos(a), torch.cos(b)).reshape(h, w, d)</code></pre></CopyPre>

		<p>
			This spatial basis is concatenated to both K and V so that queries can attend to specific spatial regions and readouts carry positional signal.
		</p>

		<p>
			The vision network uses a ConvLSTM (not a standard LSTM) so temporal state retains spatial structure &mdash; the hidden and cell states are feature maps, not flat vectors. The policy side is a separate standard LSTM that ingests the attention readouts, previous reward, and previous action. Both recurrent states are reset (zeroed via <em>notdone</em> masking) at episode boundaries.
		</p>

		<p class="mt-8">
			View the code
			<a href="https://github.com/cjlovering/torchbeast" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">here</a>.
		</p>
	</section>
</article>
