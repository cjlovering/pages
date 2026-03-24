import { base } from '$app/paths';

const MODELS = ['gpt-4o', 'gpt-4.1', 'gpt-5.1', 'gpt-5.2', 'gpt-4o-mini', 'gpt-4.1-mini'];

export async function load({ fetch }) {
	const [comparison, scatter, ...heatmaps] = await Promise.all([
		fetch(`${base}/data/fenway/model_comparison.json`).then((r) => r.json()),
		fetch(`${base}/data/fenway/scatter.json`).then((r) => r.json()),
		...MODELS.map((m) => fetch(`${base}/data/fenway/heatmap_${m}.json`).then((r) => r.json()))
	]);

	return {
		comparison,
		scatter,
		heatmaps: Object.fromEntries(MODELS.map((m, i) => [m, heatmaps[i]]))
	};
}
