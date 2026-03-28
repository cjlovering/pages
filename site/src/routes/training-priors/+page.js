import { base } from '$app/paths';

export async function load({ fetch }) {
	const [exp1, exp2] = await Promise.all([
		fetch(`${base}/data/training-priors/exp1scatter.json`).then((r) => r.json()),
		fetch(`${base}/data/training-priors/exp2scatter.json`).then((r) => r.json())
	]);

	return { exp1, exp2 };
}
