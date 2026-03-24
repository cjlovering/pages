<script>
	import { base } from '$app/paths';
	import Sidenote from '$lib/components/Sidenote.svelte';
	import Figure from '$lib/components/Figure.svelte';
</script>

<svelte:head>
	<title>Neural Turing Machines</title>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
</svelte:head>

<article class="relative max-w-prose mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-serif font-normal mb-1 text-ink">Neural Turing Machines</h1>
		<p class="text-ink-3 text-[1.05rem] leading-relaxed">Memory-augmented neural networks.</p>
		<p class="text-ink-4 text-[0.85rem] font-sans mt-2">Alex Graves, Greg Wayne, Ivo Danihelka &mdash; Google DeepMind</p>
	</header>

	<section>
		<p>
			Neural Turing Machines<Sidenote id="sn-ntm">Graves, A., Wayne, G., & Danihelka, I. (2014). Neural Turing Machines. <em>arXiv:1410.5401</em>.</Sidenote>
			are able to learn simple algorithms that generalize "far beyond" the training data. Since publication there have been
			follow-up works, but this paper introduces some important mechanisms.
		</p>

		<h2 id="overview" class="text-2xl font-serif font-normal mt-10 mb-4">Overview</h2>
		<p>The paper focused on the experiments and the results — this notebook provides an overview of some of the implementation details.</p>

		<h2 id="architecture" class="text-2xl font-serif font-normal mt-10 mb-4">Architecture</h2>
		<p>
			The authors used the proposed Neural Turing Machine (NTM) to solve a range of basic data manipulation tasks.
			An external controller network utilizes NTM's API of blurry read and write operations to tackle the task.
		</p>

		<Figure src="{base}/images/neural-turing/simple-architecture.svg" alt="Simplified NTM architecture" maxWidth="340px">
			Simplified architecture.
		</Figure>

		<p>
			The controller has a number of heads which each either read or write from the memory. The number and purpose
			of the heads is static (part of the network configuration). The generic API for the controller as a whole is
			only a sequence of vectors (describing a problem) and then the controller will output an answer for the given
			problem once a termination symbol is reached. There is no intermittent guidance on how the controller uses the
			NTM to organize information. The authors hypothesized, and at least to some degree demonstrated, that the
			controller and the NTM in concert learn to construct generalizable programs.
		</p>

		<p>
			The read operation is a weighted sum of the stateful memory
			<span class="katex-inline">M &isin; &real;<sup>N&times;M</sup></span>
			as determined by a mask
			<span class="katex-inline">w &isin; &real;<sup>N</sup></span>.
		</p>

		<div class="my-6 pl-4 border-l-2 border-border">
			<p class="text-[0.95rem]">
				<span class="katex-inline">&sum;<sub>i</sub> M<sub>i</sub> w<sub>i</sub> &isin; &real;<sup>M</sup></span>
			</p>
			<p class="text-ink-3 text-[0.85rem] mt-1">Get representation using attention across the memory.</p>
		</div>

		<p>
			The write is more complicated; it uses something akin to the gating mechanism in an LSTM to update memory
			positions. The update is applied across all of its memory, but again, the update is controlled using the
			same mask as above.
		</p>

		<p>The NTM uses a novel mechanism for addressing content inside its memory.</p>

		<Figure src="{base}/images/neural-turing/addressing.svg" alt="NTM addressing mechanism" maxWidth="500px">
			Addressing mechanism to create a mask used for reading and writing.
		</Figure>
	</section>
</article>
