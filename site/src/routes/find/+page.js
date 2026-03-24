import { base } from '$app/paths';

export async function load({ fetch }) {
	const [modelResults, lengthPerf, datasetStats, precision, inconsistencyTypes] = await Promise.all([
		fetch(`${base}/data/find/model_results.json`).then((r) => r.json()),
		fetch(`${base}/data/find/length_performance.json`).then((r) => r.json()),
		fetch(`${base}/data/find/dataset_stats.json`).then((r) => r.json()),
		fetch(`${base}/data/find/precision.json`).then((r) => r.json()),
		fetch(`${base}/data/find/inconsistency_types.json`).then((r) => r.json())
	]);

	return { modelResults, lengthPerf, datasetStats, precision, inconsistencyTypes };
}
