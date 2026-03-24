<script>
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const code = `import haiku as hk

def merge_pretrained_params(new_params: hk.Params, pre_params: hk.Params) -> hk.Params:
    """Merges pre-trained \`pre_params\` parameters into new_parameters \`new_params\`.

    The names of the pre_params and new_params are (a) selected intentionally
    or otherwise (b) the reused modules are called before new modules
    s.t. that they end up with the same names.
    """
    # Filter out the parameters from the pre-trained model that aren't used
    # because the optimizer expects the structure of the new_params given:
    # adding new values to the flatmap will cause errors during sgd.
    new_param_keys = set(new_params.keys())
    used_only = lambda module_name, name, value: module_name in new_param_keys
    used_pre_params = hk.data_structures.filter(used_only, pre_params)
    # replaced (untrained) parameters in new params with the pretrained ones.
    return hk.data_structures.merge(new_params, used_pre_params)`;
</script>

<svelte:head><title>Haiku Merge Params</title></svelte:head>

<article class="relative max-w-prose mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-serif font-normal mb-1 text-ink">Haiku Merge Params</h1>
		<p class="text-ink-3 text-[1.05rem] leading-relaxed">Merge pre-trained parameters into a new Haiku model, keeping only the keys the new model expects.</p>
	</header>
	<section>
		<CodeBlock lang="python" {code} />
		<p class="text-ink-4 text-[0.8rem]">
			<a href="https://gist.github.com/cjlovering/25b72af90db47aaa1a72caed45a17c62" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 transition-colors">View gist</a>
		</p>
	</section>
</article>
