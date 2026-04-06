<script>
	import { base } from '$app/paths';
	import { posts, sections } from '$lib/posts/index.js';
	import { onMount } from 'svelte';

	function postsBySection(key) {
		return posts
			.filter((p) => p.section === key)
			.sort((a, b) => b.date.localeCompare(a.date));
	}

	let findCanvas = $state();
	let fenwayCanvas = $state();
	let listiclesCanvas = $state();
	let rlCanvas = $state();
	let transformerCanvas = $state();
	let beamCanvas = $state();
	let ntmCanvas = $state();
	let bpeCanvas = $state();
	let trainingPriorsCanvas = $state();
	let predictingBiasesCanvas = $state();
	let alphatologyCanvas = $state();
	let lindenmayerCanvas = $state();
	let playgroundCanvas = $state();

	const artifacts = [
		{
			title: 'Lindenmayer Systems',
			subtitle: 'Generative drawings from L-system grammars.',
			url: 'https://observablehq.com/collection/@xenocidist/lindenmayer-systems'
		},
		{
			title: 'Interactive Visualizations',
			subtitle: 'A small playground of interactive sketches.',
			url: 'https://cjlovering.github.io/playground/'
		}
	];

	const PALETTES = {
		research: [
			['#faf0e4', '#eddcc4'],
			['#e8f2ee', '#cce4d8']
		],
		exposition: [
			['#e8eef8', '#ccdcf0'],
			['#f0e8f4', '#dccce8'],
			['#e8f4ee', '#ccecdc'],
			['#f4eee8', '#ecdccc']
		],
		notes: [['#f7f6f4', '#edebe8']]
	};

	function paneGradient(sectionKey, index) {
		const palette = PALETTES[sectionKey] || PALETTES.notes;
		const [a, b] = palette[index % palette.length];
		return `background: linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
	}

	/* ── Canvas utilities ── */

	function rng(seed) {
		return function () {
			seed |= 0;
			seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	function hexToRgba(hex, a) {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r},${g},${b},${a})`;
	}

	function lerpHex(h1, h2, t) {
		const r1 = parseInt(h1.slice(1, 3), 16),
			g1 = parseInt(h1.slice(3, 5), 16),
			b1 = parseInt(h1.slice(5, 7), 16);
		const r2 = parseInt(h2.slice(1, 3), 16),
			g2 = parseInt(h2.slice(3, 5), 16),
			b2 = parseInt(h2.slice(5, 7), 16);
		const r = Math.round(r1 + (r2 - r1) * t);
		const g = Math.round(g1 + (g2 - g1) * t);
		const b = Math.round(b1 + (b2 - b1) * t);
		return (
			'#' +
			[r, g, b]
				.map((v) => v.toString(16).padStart(2, '0'))
				.join('')
		);
	}

	function circumcircle(ax, ay, bx, by, cx, cy) {
		const dx = bx - ax,
			dy = by - ay,
			ex = cx - ax,
			ey = cy - ay;
		const bl = dx * dx + dy * dy,
			cl = ex * ex + ey * ey;
		const d = 2 * (dx * ey - dy * ex);
		if (Math.abs(d) < 1e-12) return { x: ax, y: ay, r: Infinity };
		const ux = (ey * bl - dy * cl) / d;
		const uy = (dx * cl - ex * bl) / d;
		return { x: ax + ux, y: ay + uy, r: Math.sqrt(ux * ux + uy * uy) };
	}

	function bowyerWatson(points) {
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;
		for (const p of points) {
			if (p.x < minX) minX = p.x;
			if (p.y < minY) minY = p.y;
			if (p.x > maxX) maxX = p.x;
			if (p.y > maxY) maxY = p.y;
		}
		const dx = maxX - minX,
			dy = maxY - minY,
			dmax = Math.max(dx, dy) * 10;
		const p1 = { x: minX - dmax, y: minY - dmax };
		const p2 = { x: minX + dmax * 3, y: minY - dmax };
		const p3 = { x: minX - dmax, y: minY + dmax * 3 };
		const superIdx = points.length;
		const allPts = [...points, p1, p2, p3];
		let triangles = [{ a: superIdx, b: superIdx + 1, c: superIdx + 2 }];
		let circles = [circumcircle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)];

		for (let i = 0; i < points.length; i++) {
			const px = points[i].x,
				py = points[i].y;
			const edges = [],
				keep = [];
			for (let j = 0; j < triangles.length; j++) {
				const cc = circles[j];
				const ddx = px - cc.x,
					ddy = py - cc.y;
				if (ddx * ddx + ddy * ddy <= cc.r * cc.r) {
					const t = triangles[j];
					edges.push([t.a, t.b], [t.b, t.c], [t.c, t.a]);
				} else {
					keep.push(j);
				}
			}
			const newTri = [],
				newCirc = [];
			for (const k of keep) {
				newTri.push(triangles[k]);
				newCirc.push(circles[k]);
			}
			const boundary = [];
			for (let j = 0; j < edges.length; j++) {
				let shared = false;
				for (let k = 0; k < edges.length; k++) {
					if (j !== k && edges[j][0] === edges[k][1] && edges[j][1] === edges[k][0]) {
						shared = true;
						break;
					}
				}
				if (!shared) boundary.push(edges[j]);
			}
			for (const [a, b] of boundary) {
				newTri.push({ a, b, c: i });
				newCirc.push(
					circumcircle(allPts[a].x, allPts[a].y, allPts[b].x, allPts[b].y, px, py)
				);
			}
			triangles = newTri;
			circles = newCirc;
		}
		const result = [],
			resultCircles = [];
		for (let i = 0; i < triangles.length; i++) {
			const t = triangles[i];
			if (t.a < superIdx && t.b < superIdx && t.c < superIdx) {
				result.push(t);
				resultCircles.push(circles[i]);
			}
		}
		return { triangles: result, circumcircles: resultCircles, points: allPts };
	}

	function noisy(rand, val, pct, lo, hi) {
		let v = val * (1 + (rand() - 0.5) * 2 * pct);
		if (lo !== undefined && v < lo) v = lo;
		if (hi !== undefined && v > hi) v = hi;
		return v;
	}

	function setupCanvas(canvas) {
		const ctx = canvas.getContext('2d');
		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.parentElement.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		return { ctx, W: rect.width, H: rect.height };
	}

	function drawDelaunay(ctx, W, H, points, opts = {}) {
		const d = bowyerWatson(points);
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, W, H);
		const maxR = W * (opts.maxCircR || 0.45);
		const circs = [];
		for (let i = 0; i < d.circumcircles.length; i++) {
			const cc = d.circumcircles[i];
			if (cc.r < Infinity && cc.r < W * 0.8) {
				const tri = d.triangles[i];
				const pa = points[tri.a], pb = points[tri.b], pc = points[tri.c];
				circs.push({
					x: cc.x, y: cc.y, r: cc.r,
					color: pa.fill,
					alpha: ((pa.alpha ?? 0.9) + (pb.alpha ?? 0.9) + (pc.alpha ?? 0.9)) / 3 * 0.1
				});
			}
		}
		circs.sort((a, b) => b.r - a.r);
		for (const c of circs) {
			ctx.beginPath();
			ctx.arc(c.x, c.y, Math.min(c.r, maxR), 0, Math.PI * 2);
			ctx.fillStyle = hexToRgba(c.color, c.alpha);
			ctx.fill();
		}
		ctx.lineWidth = 0.3;
		for (const c of circs) {
			ctx.beginPath();
			ctx.arc(c.x, c.y, Math.min(c.r, maxR), 0, Math.PI * 2);
			ctx.strokeStyle = hexToRgba(c.color, c.alpha * 1.5);
			ctx.stroke();
		}
		ctx.strokeStyle = opts.edgeColor || 'rgba(0,0,0,0.1)';
		ctx.lineWidth = opts.edgeWidth || 0.4;
		for (const t of d.triangles) {
			ctx.beginPath();
			ctx.moveTo(points[t.a].x, points[t.a].y);
			ctx.lineTo(points[t.b].x, points[t.b].y);
			ctx.lineTo(points[t.c].x, points[t.c].y);
			ctx.closePath();
			ctx.stroke();
		}
		for (const p of points) {
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
			ctx.fillStyle = hexToRgba(p.fill, p.alpha ?? 0.9);
			ctx.fill();
		}
		const cc2 = opts.centerColor || '#666';
		for (const c of circs) {
			if (c.x > 0 && c.x < W && c.y > 0 && c.y < H) {
				ctx.beginPath();
				ctx.arc(c.x, c.y, 0.5, 0, Math.PI * 2);
				ctx.fillStyle = hexToRgba(cc2, 0.3);
				ctx.fill();
			}
		}
	}

	/* ── FIND data ── */
	const FIND_DATASETS = ['BLS', 'PRE', 'SEC', 'EMM', 'PG'];
	const FIND_KTOK = { BLS: 10, PRE: 12, SEC: 63, EMM: 123, PG: 109 };
	const FIND_TYPES = {
		BLS: { Numeric: 48, NonNumeric: 13, Structural: 14 },
		PRE: { Numeric: 48, NonNumeric: 14, Structural: 13 },
		SEC: { Numeric: 40, NonNumeric: 12, Structural: 23 },
		EMM: { Numeric: 40, NonNumeric: 10, Structural: 25 },
		PG: { Numeric: 28, NonNumeric: 14, Structural: 33 }
	};
	const FIND_MODELS = [
		{
			name: 'sonnet-v4',
			scores: { BLS: 83, PRE: 49, SEC: 20, EMM: 21, PG: 23 },
			se: { BLS: 4.4, PRE: 5.8, SEC: 4.6, EMM: 4.7, PG: 4.8 }
		},
		{
			name: 'gpt-5-mini',
			scores: { BLS: 80, PRE: 53, SEC: 47, EMM: 37, PG: 39 },
			se: { BLS: 4.6, PRE: 5.8, SEC: 5.8, EMM: 5.6, PG: 5.6 }
		},
		{
			name: 'gpt-5',
			scores: { BLS: 87, PRE: 67, SEC: 73, EMM: 43, PG: 52 },
			se: { BLS: 3.9, PRE: 5.4, SEC: 5.1, EMM: 5.7, PG: 5.8 }
		},
		{
			name: 'o3-mini',
			scores: { BLS: 56, PRE: 17, SEC: 8, EMM: 3, PG: 12 },
			se: { BLS: 5.7, PRE: 4.4, SEC: 3.1, EMM: 1.9, PG: 3.8 }
		},
		{
			name: 'o3',
			scores: { BLS: 85, PRE: 49, SEC: 57, EMM: 31, PG: 40 },
			se: { BLS: 4.1, PRE: 5.8, SEC: 5.7, EMM: 5.3, PG: 5.7 }
		},
		{
			name: 'gemini-2.5-flash',
			scores: { BLS: 75, PRE: 48, SEC: 36, EMM: 25, PG: 31 },
			se: { BLS: 5.0, PRE: 5.8, SEC: 5.5, EMM: 5.0, PG: 5.3 }
		},
		{
			name: 'gemini-2.5-pro',
			scores: { BLS: 88, PRE: 71, SEC: 61, EMM: 40, PG: 45 },
			se: { BLS: 3.8, PRE: 5.3, SEC: 5.6, EMM: 5.7, PG: 5.7 }
		},
		{
			name: 'gpt-oss-120b',
			scores: { BLS: 72, PRE: 44, SEC: 33, EMM: 19, PG: 27 },
			se: { BLS: 5.2, PRE: 5.7, SEC: 5.4, EMM: 4.5, PG: 5.1 }
		},
		{
			name: 'gemma-3-27b',
			scores: { BLS: 65, PRE: 38, SEC: 25, EMM: 14, PG: 20 },
			se: { BLS: 5.5, PRE: 5.6, SEC: 5.0, EMM: 4.0, PG: 4.6 }
		},
		{
			name: 'llama-4-scout',
			scores: { BLS: 60, PRE: 31, SEC: 18, EMM: 10, PG: 15 },
			se: { BLS: 5.6, PRE: 5.3, SEC: 4.4, EMM: 3.5, PG: 4.1 }
		},
		{
			name: 'qwen-2.5-72b',
			scores: { BLS: 68, PRE: 41, SEC: 29, EMM: 16, PG: 22 },
			se: { BLS: 5.4, PRE: 5.7, SEC: 5.2, EMM: 4.2, PG: 4.8 }
		}
	];

	/* ── Fenway data ── */
	const FENWAY_MODELS = [
		{ model: 'gpt-4o', wd: 0.4495, n: 8750 },
		{ model: 'gpt-5.1', wd: 0.4677, n: 6950 },
		{ model: 'gpt-5.2', wd: 0.4754, n: 7900 },
		{ model: 'gpt-4.1', wd: 0.5298, n: 9100 },
		{ model: 'gpt-4o-mini', wd: 0.5677, n: 9500 },
		{ model: 'gpt-4.1-mini', wd: 0.5932, n: 9400 }
	];
	const FENWAY_MATRIX = [
		[1.0, 1.0, 1.0, 1.0, 1.0, 0.97, 1.0, 1.0, 0.98, 1.0, 0],
		[1.0, 1.0, 1.0, 1.0, 1.0, 0.98, 1.0, 0.99, 0.95, 0, 0.81],
		[1.0, 1.0, 1.0, 1.0, 0.99, 0.93, 1.0, 0.98, 0, -0.87, -0.98],
		[1.0, 0.96, 0.97, 1.0, 0.86, -0.9, -0.86, 0, -1.0, -0.99, -0.97],
		[1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0, 1.0, 0.87, 0.84, 0.91],
		[1.0, 0.94, 0.99, 1.0, 0.94, 0, 0.85, -0.92, -0.99, -0.98, -0.93],
		[1.0, 0.95, 0.97, 1.0, 0, -0.91, 0.92, -0.79, -0.98, -0.97, -0.91],
		[1.0, 0.97, 0.91, 0, 0.86, -0.98, 0.8, -0.9, -1.0, -0.98, -0.98],
		[1.0, -0.85, 0, 0.99, -0.87, -0.98, 0.96, -0.96, -1.0, -1.0, -1.0],
		[1.0, 0, 0.99, 0.99, -0.88, -0.96, 0.99, -1.0, -1.0, -1.0, -0.99],
		[0, 0.95, 0.87, 1.0, -0.83, -0.96, -0.82, -0.95, -1.0, -1.0, -0.99]
	];

	/* ── FIND card renderer ── */
	function renderFindCard(canvas) {
		const { ctx, W, H } = setupCanvas(canvas);
		const rand = rng(42);
		const pad = 14;
		const modelColors = [
			'#0f2440', '#152e50', '#1a3a5c', '#1e4d7b', '#24619b', '#2d78b8', '#3d8ec9', '#55a3d6',
			'#6db5de', '#88c6e6', '#a8d8f0'
		];
		const kToks = FIND_DATASETS.map((d) => FIND_KTOK[d]);
		const minK = Math.min(...kToks),
			maxK = Math.max(...kToks);

		const points = [];
		for (let mi = 0; mi < FIND_MODELS.length; mi++) {
			const m = FIND_MODELS[mi];
			for (let di = 0; di < FIND_DATASETS.length; di++) {
				const ds = FIND_DATASETS[di];
				const kNorm = (FIND_KTOK[ds] - minK) / (maxK - minK);
				const scoreNorm = noisy(rand, m.scores[ds], 0.12, 1, 99) / 100;
				const x = pad + kNorm * (W - 2 * pad) + (rand() - 0.5) * 16;
				const y = pad + (1 - scoreNorm) * (H - 2 * pad) + (rand() - 0.5) * 10;
				const types = FIND_TYPES[ds];
				const total = types.Numeric + types.NonNumeric + types.Structural;
				const nR = noisy(rand, types.Numeric / total, 0.2, 0, 1);
				const sR = noisy(rand, types.Structural / total, 0.2, 0, 1);
				const circColor =
					nR > 0.5
						? lerpHex('#2d78b8', '#7B5EA7', sR * 2)
						: lerpHex('#E8890C', '#7B5EA7', nR);
				const se = noisy(rand, m.se[ds], 0.15, 1.0, 7.0);
				const seNorm = (se - 1.5) / (6.5 - 1.5);
				points.push({
					x,
					y,
					r: noisy(rand, 1.0 + scoreNorm * 1.8, 0.2, 0.5, 3.5),
					fill: modelColors[mi],
					circColor,
					circAlpha: noisy(rand, 0.06 + seNorm * 0.14, 0.2, 0.03, 0.25)
				});
			}
		}

		const d = bowyerWatson(points);
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, W, H);

		const circs = [];
		for (let i = 0; i < d.circumcircles.length; i++) {
			const cc = d.circumcircles[i];
			if (cc.r < Infinity && cc.r < W * 0.8) {
				const tri = d.triangles[i];
				const pa = points[tri.a],
					pb = points[tri.b],
					pc = points[tri.c];
				circs.push({
					x: cc.x,
					y: cc.y,
					r: cc.r,
					color: pa.circColor,
					alpha: (pa.circAlpha + pb.circAlpha + pc.circAlpha) / 3
				});
			}
		}
		circs.sort((a, b) => b.r - a.r);
		for (const c of circs) {
			const drawR = Math.min(c.r, W * 0.45);
			ctx.beginPath();
			ctx.arc(c.x, c.y, drawR, 0, Math.PI * 2);
			ctx.fillStyle = hexToRgba(c.color, c.alpha);
			ctx.fill();
		}
		ctx.lineWidth = 0.3;
		for (const c of circs) {
			const drawR = Math.min(c.r, W * 0.45);
			ctx.beginPath();
			ctx.arc(c.x, c.y, drawR, 0, Math.PI * 2);
			ctx.strokeStyle = hexToRgba(c.color, c.alpha * 1.5);
			ctx.stroke();
		}
		ctx.strokeStyle = 'rgba(15,36,64,0.14)';
		ctx.lineWidth = 0.4;
		for (const t of d.triangles) {
			const pa = points[t.a],
				pb = points[t.b],
				pc = points[t.c];
			ctx.beginPath();
			ctx.moveTo(pa.x, pa.y);
			ctx.lineTo(pb.x, pb.y);
			ctx.lineTo(pc.x, pc.y);
			ctx.closePath();
			ctx.stroke();
		}
		for (const p of points) {
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
			ctx.fillStyle = hexToRgba(p.fill, 0.9);
			ctx.fill();
		}
		for (const c of circs) {
			if (c.x > 0 && c.x < W && c.y > 0 && c.y < H) {
				ctx.beginPath();
				ctx.arc(c.x, c.y, 0.6, 0, Math.PI * 2);
				ctx.fillStyle = 'rgba(123,94,167,0.35)';
				ctx.fill();
			}
		}
	}

	/* ── Fenway card renderer ── */
	function renderFenwayCard(canvas) {
		const { ctx, W, H } = setupCanvas(canvas);
		const rand = rng(137);
		const pad = 14;
		const wds = FENWAY_MODELS.map((m) => m.wd);
		const ns = FENWAY_MODELS.map((m) => m.n);
		const minWd = Math.min(...wds),
			maxWd = Math.max(...wds);
		const minN = Math.min(...ns),
			maxN = Math.max(...ns);
		const anchorColors = ['#7a1610', '#AD2111', '#c43a2a', '#d45544', '#ef4444', '#ff6b6b'];

		const points = [];
		for (let i = 0; i < FENWAY_MODELS.length; i++) {
			const m = FENWAY_MODELS[i];
			const wdN = noisy(rand, m.wd, 0.08, minWd, maxWd);
			const nN = noisy(rand, m.n, 0.08, minN, maxN);
			const xNorm = (wdN - minWd) / (maxWd - minWd);
			const yNorm = (nN - minN) / (maxN - minN);
			points.push({
				x: pad + xNorm * (W - 2 * pad) + (rand() - 0.5) * 6,
				y: pad + (1 - yNorm) * (H - 2 * pad) + (rand() - 0.5) * 6,
				r: noisy(rand, 2.8, 0.15, 2.0, 3.8),
				fill: anchorColors[i],
				isAnchor: true,
				value: 0
			});
		}
		const anchorCount = FENWAY_MODELS.length;

		for (let row = 0; row < 11; row++) {
			for (let col = 0; col < 11; col++) {
				const v = FENWAY_MATRIX[row][col];
				if (v === 0) continue;
				const vn = noisy(rand, v, 0.1, -1, 1);
				points.push({
					x: pad + (col / 10) * (W - 2 * pad) + (rand() - 0.5) * 7,
					y: pad + (row / 10) * (H - 2 * pad) + (rand() - 0.5) * 7,
					r: noisy(rand, 0.8 + Math.abs(vn) * 0.6, 0.25, 0.4, 1.8),
					fill: vn > 0 ? '#E8890C' : '#0E9EE4',
					isAnchor: false,
					value: vn
				});
			}
		}

		const d = bowyerWatson(points);
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, W, H);

		const circs = [];
		for (let i = 0; i < d.circumcircles.length; i++) {
			const cc = d.circumcircles[i];
			if (cc.r < Infinity && cc.r < W * 0.8) {
				const tri = d.triangles[i];
				const pa = points[tri.a],
					pb = points[tri.b],
					pc = points[tri.c];
				const avgVal = (pa.value + pb.value + pc.value) / 3;
				const absVal = Math.abs(avgVal);
				let circColor;
				if (avgVal < -0.1) circColor = lerpHex('#a8d8f0', '#0E9EE4', Math.min(1, absVal));
				else if (avgVal > 0.1)
					circColor = lerpHex('#ffb3b0', '#AD2111', Math.min(1, absVal));
				else circColor = '#e8e0d8';
				circs.push({
					x: cc.x,
					y: cc.y,
					r: cc.r,
					color: circColor,
					alpha: 0.04 + absVal * 0.12
				});
			}
		}
		circs.sort((a, b) => b.r - a.r);
		for (const c of circs) {
			const drawR = Math.min(c.r, W * 0.4);
			ctx.beginPath();
			ctx.arc(c.x, c.y, drawR, 0, Math.PI * 2);
			ctx.fillStyle = hexToRgba(c.color, c.alpha);
			ctx.fill();
		}
		ctx.lineWidth = 0.3;
		for (const c of circs) {
			const drawR = Math.min(c.r, W * 0.4);
			ctx.beginPath();
			ctx.arc(c.x, c.y, drawR, 0, Math.PI * 2);
			ctx.strokeStyle = hexToRgba(c.color, c.alpha * 1.5);
			ctx.stroke();
		}
		ctx.strokeStyle = 'rgba(173,33,17,0.10)';
		ctx.lineWidth = 0.3;
		for (const t of d.triangles) {
			const pa = points[t.a],
				pb = points[t.b],
				pc = points[t.c];
			ctx.beginPath();
			ctx.moveTo(pa.x, pa.y);
			ctx.lineTo(pb.x, pb.y);
			ctx.lineTo(pc.x, pc.y);
			ctx.closePath();
			ctx.stroke();
		}
		for (let i = anchorCount; i < points.length; i++) {
			const p = points[i];
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
			ctx.fillStyle = hexToRgba(p.fill, 0.8);
			ctx.fill();
		}
		for (let i = 0; i < anchorCount; i++) {
			const p = points[i];
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
			ctx.fillStyle = hexToRgba(p.fill, 0.95);
			ctx.fill();
		}
		for (const c of circs) {
			if (c.x > 0 && c.x < W && c.y > 0 && c.y < H) {
				ctx.beginPath();
				ctx.arc(c.x, c.y, 0.5, 0, Math.PI * 2);
				ctx.fillStyle = 'rgba(173,33,17,0.25)';
				ctx.fill();
			}
		}
	}

	/* ── Listicles card renderer ── */
	function renderListiclesCard(canvas) {
		const { ctx, W, H } = setupCanvas(canvas);
		const rand = rng(314);
		const pad = 14;
		const clusters = [
			{ cx: 0.22, cy: 0.28, n: 12, color: '#C48520' },
			{ cx: 0.72, cy: 0.22, n: 10, color: '#D4982A' },
			{ cx: 0.30, cy: 0.72, n: 11, color: '#B87A1A' },
			{ cx: 0.78, cy: 0.68, n: 9, color: '#E0A832' },
			{ cx: 0.50, cy: 0.48, n: 14, color: '#A86E15' },
			{ cx: 0.15, cy: 0.55, n: 8, color: '#C89030' }
		];
		const points = [];
		for (const cl of clusters) {
			for (let i = 0; i < cl.n; i++) {
				const a = rand() * Math.PI * 2;
				const dist = rand() * 0.14 + rand() * 0.04;
				points.push({
					x: Math.max(pad, Math.min(W - pad, pad + (cl.cx + Math.cos(a) * dist) * (W - 2 * pad))),
					y: Math.max(pad, Math.min(H - pad, pad + (cl.cy + Math.sin(a) * dist) * (H - 2 * pad))),
					r: noisy(rand, rand() > 0.3 ? 1.8 : 1.0, 0.3, 0.5, 3.0),
					fill: cl.color,
					alpha: rand() > 0.3 ? 0.85 : 0.5
				});
			}
		}
		drawDelaunay(ctx, W, H, points, { edgeColor: 'rgba(168,110,21,0.10)', centerColor: '#a86e15' });
	}

	/* ── Interpretable RL card renderer ── */
	function renderRlCard(canvas) {
		const { ctx, W, H } = setupCanvas(canvas);
		const rand = rng(271);
		const pad = 14;
		const gridN = 8;
		const hotspots = [
			{ gx: 2, gy: 3, s: 1.0 }, { gx: 5, gy: 2, s: 0.8 },
			{ gx: 6, gy: 5, s: 0.6 }, { gx: 3, gy: 6, s: 0.5 }
		];
		const points = [];
		for (let gx = 0; gx < gridN; gx++) {
			for (let gy = 0; gy < gridN; gy++) {
				let attn = 0.05;
				for (const h of hotspots) {
					const dx = gx - h.gx, dy = gy - h.gy;
					attn += h.s * Math.exp(-(dx * dx + dy * dy) / 2.5);
				}
				attn = Math.min(attn, 1);
				points.push({
					x: pad + ((gx + 0.5) / gridN) * (W - 2 * pad) + (rand() - 0.5) * 6,
					y: pad + ((gy + 0.5) / gridN) * (H - 2 * pad) + (rand() - 0.5) * 6,
					r: noisy(rand, 0.8 + attn * 2.2, 0.15, 0.5, 3.5),
					fill: lerpHex('#b8e0c8', '#1a6b3a', attn),
					alpha: 0.5 + attn * 0.45
				});
			}
		}
		drawDelaunay(ctx, W, H, points, { edgeColor: 'rgba(26,107,58,0.08)', centerColor: '#1a6b3a' });
	}

	/* ── Transformer Networks card renderer ── */
	function renderTransformerCard(canvas) {
		const { ctx, W, H } = setupCanvas(canvas);
		const rand = rng(173);
		const pad = 14;
		const nPos = 8;
		const points = [];
		for (let i = 0; i < nPos; i++) {
			points.push({
				x: pad + ((i + 0.5) / nPos) * (W - 2 * pad) + (rand() - 0.5) * 4,
				y: pad + 0.15 * (H - 2 * pad) + (rand() - 0.5) * 8,
				r: noisy(rand, 2.2, 0.2, 1.2, 3.2), fill: '#1a3a6b', alpha: 0.9
			});
		}
		for (let i = 0; i < nPos; i++) {
			points.push({
				x: pad + ((i + 0.5) / nPos) * (W - 2 * pad) + (rand() - 0.5) * 4,
				y: pad + 0.85 * (H - 2 * pad) + (rand() - 0.5) * 8,
				r: noisy(rand, 2.2, 0.2, 1.2, 3.2), fill: '#2d5a9b', alpha: 0.9
			});
		}
		for (let i = 0; i < 35; i++) {
			const ei = Math.floor(rand() * nPos), di = Math.floor(rand() * nPos);
			const t = rand();
			const ex = pad + ((ei + 0.5) / nPos) * (W - 2 * pad);
			const dx = pad + ((di + 0.5) / nPos) * (W - 2 * pad);
			points.push({
				x: ex + (dx - ex) * t + (rand() - 0.5) * 14,
				y: pad + (0.15 + 0.7 * t) * (H - 2 * pad) + (rand() - 0.5) * 10,
				r: noisy(rand, 0.7, 0.3, 0.3, 1.4),
				fill: lerpHex('#4a6ea8', '#1a3a6b', rand()), alpha: 0.35 + rand() * 0.3
			});
		}
		drawDelaunay(ctx, W, H, points, { edgeColor: 'rgba(26,58,107,0.12)', centerColor: '#4a6ea8' });
	}

	/* ── Beam Search card renderer ── */
	function renderBeamCard(canvas) {
		const { ctx, W, H } = setupCanvas(canvas);
		const rand = rng(628);
		const pad = 14;
		const points = [];
		const levels = 6, bw = 3, vocab = 4;
		points.push({
			x: W / 2 + (rand() - 0.5) * 4, y: pad + 0.03 * (H - 2 * pad),
			r: 2.5, fill: '#3a1560', alpha: 0.95
		});
		for (let lev = 1; lev < levels; lev++) {
			const yBase = pad + (lev / (levels - 0.5)) * (H - 2 * pad);
			const n = lev === 1 ? vocab : bw * vocab;
			const spread = 0.08 + lev * 0.15;
			for (let i = 0; i < n; i++) {
				const sel = i < bw;
				const xN = 0.5 + (n > 1 ? (i / (n - 1) - 0.5) : 0) * spread * 2;
				points.push({
					x: pad + xN * (W - 2 * pad) + (rand() - 0.5) * 10,
					y: yBase + (rand() - 0.5) * 8,
					r: noisy(rand, sel ? 1.8 : 0.9, 0.2, 0.4, 2.8),
					fill: sel ? lerpHex('#5a2d7a', '#7b4fa0', rand()) : '#c0a8d8',
					alpha: sel ? 0.85 : 0.3
				});
			}
		}
		for (let i = 0; i < 15; i++) {
			points.push({
				x: pad + rand() * (W - 2 * pad), y: pad + rand() * (H - 2 * pad),
				r: noisy(rand, 0.4, 0.3, 0.2, 0.8), fill: '#c0a0e0', alpha: 0.15
			});
		}
		drawDelaunay(ctx, W, H, points, { edgeColor: 'rgba(90,45,122,0.10)', centerColor: '#5a2d7a' });
	}

	/* ── Neural Turing Machines card renderer ── */
	function renderNtmCard(canvas) {
		const { ctx, W, H } = setupCanvas(canvas);
		const rand = rng(987);
		const pad = 14;
		const rows = 8, cols = 10;
		const rHead = { r: 3, c: 5 }, wHead = { r: 6, c: 2 };
		const points = [];
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const mv = rand();
				const rd = Math.sqrt((r - rHead.r) ** 2 + (c - rHead.c) ** 2);
				const wd = Math.sqrt((r - wHead.r) ** 2 + (c - wHead.c) ** 2);
				const ra = Math.exp(-rd * rd / 3), wa = Math.exp(-wd * wd / 3);
				let fill, alpha;
				if (ra > 0.3) { fill = lerpHex('#a8d8f0', '#0E9EE4', ra); alpha = 0.6 + ra * 0.35; }
				else if (wa > 0.3) { fill = lerpHex('#ffcca0', '#E8890C', wa); alpha = 0.6 + wa * 0.35; }
				else { fill = lerpHex('#d0d0d0', '#808080', mv); alpha = 0.4 + mv * 0.3; }
				points.push({
					x: pad + ((c + 0.5) / cols) * (W - 2 * pad) + (rand() - 0.5) * 4,
					y: pad + ((r + 0.5) / rows) * (H - 2 * pad) + (rand() - 0.5) * 4,
					r: noisy(rand, 0.8 + (ra + wa) * 1.5 + mv * 0.5, 0.15, 0.4, 3.5),
					fill, alpha
				});
			}
		}
		drawDelaunay(ctx, W, H, points, { edgeColor: 'rgba(14,158,228,0.08)', centerColor: '#0E9EE4' });
	}

	/* ── Byte-Pair Encoding card renderer ── */
	function renderBpeCard(canvas) {
		const { ctx, W, H } = setupCanvas(canvas);
		const rand = rng(555);
		const pad = 14;
		const layers = [
			{ y: 0.88, n: 16, color: '#a86830', size: 0.8 },
			{ y: 0.68, n: 12, color: '#9a5e28', size: 1.2 },
			{ y: 0.48, n: 8, color: '#8a5020', size: 1.6 },
			{ y: 0.30, n: 5, color: '#7a4518', size: 2.0 },
			{ y: 0.12, n: 3, color: '#6a3a10', size: 2.5 }
		];
		const points = [];
		for (const lay of layers) {
			for (let i = 0; i < lay.n; i++) {
				points.push({
					x: pad + ((i + 0.5) / lay.n) * (W - 2 * pad) + (rand() - 0.5) * 10,
					y: pad + lay.y * (H - 2 * pad) + (rand() - 0.5) * 8,
					r: noisy(rand, lay.size, 0.2, 0.4, 3.5),
					fill: lerpHex(lay.color, '#d4a870', rand() * 0.3),
					alpha: 0.7 + rand() * 0.25
				});
			}
		}
		for (let l = 0; l < layers.length - 1; l++) {
			for (let i = 0; i < 4; i++) {
				const t = rand();
				points.push({
					x: pad + rand() * (W - 2 * pad),
					y: pad + (layers[l].y + (layers[l + 1].y - layers[l].y) * t) * (H - 2 * pad),
					r: noisy(rand, 0.5, 0.3, 0.2, 1.0),
					fill: lerpHex(layers[l].color, layers[l + 1].color, t),
					alpha: 0.3 + rand() * 0.2
				});
			}
		}
		drawDelaunay(ctx, W, H, points, { edgeColor: 'rgba(106,58,16,0.10)', centerColor: '#8a5020' });
	}

	/* ── Training Priors card renderer ── */
	function renderTrainingPriorsCard(canvas) {
		const { ctx, W, H } = setupCanvas(canvas);
		const rand = rng(306);
		const pad = 14;
		const points = [];

		// Scatter: x = log SVO frequency, y = alignment — mimics the paper's Figure 3
		const scatterData = [
			[0,0.15],[0,0.2],[0,0.2],[0,0.25],[0,0.3],[0,0.35],[0,0.45],[0,0.5],[0,0.65],[0,0.75],
			[0.3,0.1],[0.3,0.2],[0.3,0.35],[0.3,0.5],[0.6,0.15],[0.6,0.3],[0.6,0.45],[0.6,0.5],
			[0.9,0.2],[0.9,0.4],[0.9,0.55],[0.9,0.6],[0.9,0.75],[1.1,0.25],[1.1,0.5],[1.1,0.65],
			[1.1,0.8],[1.4,0.35],[1.4,0.55],[1.4,0.7],[1.4,0.8],[1.7,0.4],[1.7,0.6],[1.7,0.75],
			[1.7,0.85],[2.0,0.5],[2.0,0.7],[2.0,0.8],[2.0,0.9],[2.3,0.6],[2.3,0.75],[2.3,0.85],
			[2.3,0.95],[2.6,0.7],[2.6,0.8],[2.6,0.9],[2.9,0.75],[2.9,0.85],[2.9,0.95],[3.2,0.85],
			[3.2,0.9],[3.4,0.95]
		];
		const maxX = 3.5;
		for (const [fx, al] of scatterData) {
			const xN = fx / maxX;
			const yN = 1 - al;
			points.push({
				x: pad + xN * (W - 2 * pad) + (rand() - 0.5) * 8,
				y: pad + yN * (H - 2 * pad) + (rand() - 0.5) * 8,
				r: noisy(rand, 1.4 + al * 1.2, 0.2, 0.6, 3.2),
				fill: lerpHex('#c8a070', '#AD2111', al),
				alpha: 0.5 + al * 0.4
			});
		}
		// Ambient noise
		for (let i = 0; i < 20; i++) {
			points.push({
				x: pad + rand() * (W - 2 * pad),
				y: pad + rand() * (H - 2 * pad),
				r: noisy(rand, 0.4, 0.3, 0.2, 0.8),
				fill: '#d4b090',
				alpha: 0.15
			});
		}
		drawDelaunay(ctx, W, H, points, { edgeColor: 'rgba(173,33,17,0.08)', centerColor: '#AD2111' });
	}

	/* ── Predicting Biases card renderer ── */
	function renderPredictingBiasesCard(canvas) {
		const { ctx, W, H } = setupCanvas(canvas);
		const rand = rng(2021);
		const pad = 14;
		const points = [];

		// Learning curves: x = s-only rate (evidence), y = s-only error
		// Each curve = one (target, spurious) pair at a given relative MDL
		const curves = [
			{ mdlRatio: 1.26, label: 'easy' },
			{ mdlRatio: 0.80, label: 'med-easy' },
			{ mdlRatio: 0.40, label: 'medium' },
			{ mdlRatio: 0.10, label: 'med-hard' },
			{ mdlRatio: 0.002, label: 'hard' },
		];
		const sOnlyRates = [0.0, 0.05, 0.10, 0.15, 0.25, 0.35, 0.50, 0.65, 0.80, 1.0];

		// Models as layers (BERT, RoBERTa, T5, GPT-2, LSTM)
		const modelOffsets = [0, 0.04, -0.03, 0.06, -0.05];

		for (let ci = 0; ci < curves.length; ci++) {
			const curve = curves[ci];
			// Higher MDL ratio → target is easy → error drops fast
			const difficulty = 1 - Math.min(1, curve.mdlRatio / 1.3);
			// Color: blue (easy target) → red (hard target)
			const curveColor = lerpHex('#2d78b8', '#AD2111', difficulty);

			for (let mi = 0; mi < modelOffsets.length; mi++) {
				for (let si = 0; si < sOnlyRates.length; si++) {
					const sRate = sOnlyRates[si];
					// S-only error: decays with evidence, slower for hard targets
					const decay = curve.mdlRatio > 0.5 ? 8.0 : curve.mdlRatio > 0.1 ? 3.0 : 1.2;
					let error = Math.exp(-sRate * decay);
					error = error * (0.85 + difficulty * 0.15);
					error += modelOffsets[mi] * (1 - sRate);

					const xN = sRate;
					const yN = 1 - Math.max(0, Math.min(1, error));

					points.push({
						x: pad + xN * (W - 2 * pad) + (rand() - 0.5) * 6,
						y: pad + yN * (H - 2 * pad) + (rand() - 0.5) * 6,
						r: noisy(rand, 1.0 + (1 - difficulty) * 1.2, 0.2, 0.4, 2.8),
						fill: curveColor,
						alpha: 0.55 + (1 - difficulty) * 0.35
					});
				}
			}
		}

		// Ambient noise for texture
		for (let i = 0; i < 18; i++) {
			points.push({
				x: pad + rand() * (W - 2 * pad),
				y: pad + rand() * (H - 2 * pad),
				r: noisy(rand, 0.4, 0.3, 0.2, 0.7),
				fill: lerpHex('#c0b8d0', '#8070a0', rand()),
				alpha: 0.12
			});
		}

		drawDelaunay(ctx, W, H, points, {
			edgeColor: 'rgba(45,120,184,0.08)',
			centerColor: '#6050a0'
		});
	}

	/* ── Alphatology card renderer ── */
	function renderAlphatologyCard(canvas) {
		const { ctx, W, H } = setupCanvas(canvas);
		const rand = rng(2022);
		const pad = 14;
		const points = [];

		// Hexagonal grid of points mimicking a Hex board
		const cols = 9, rows = 9;
		const cellW = (W - 2 * pad) / (cols + 0.5);
		const cellH = (H - 2 * pad) / rows;
		const concepts = ['#1E88E5', '#D81B60', '#FFC107', '#004D40'];

		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const xOff = (r % 2) * cellW * 0.5;
				const x = pad + c * cellW + xOff + cellW * 0.5;
				const y = pad + r * cellH + cellH * 0.5;
				// Training progress: cells "activate" from center outward
				const cx = cols / 2, cy = rows / 2;
				const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2) / Math.sqrt(cx * cx + cy * cy);
				const active = rand() > dist * 0.7;
				const color = active ? concepts[Math.floor(rand() * concepts.length)] : '#c8c0b8';
				const alpha = active ? 0.5 + rand() * 0.45 : 0.15 + rand() * 0.1;
				points.push({
					x: x + (rand() - 0.5) * 4,
					y: y + (rand() - 0.5) * 4,
					r: noisy(rand, active ? 1.6 : 0.8, 0.3, 0.4, 2.8),
					fill: color,
					alpha
				});
			}
		}
		// Ambient noise
		for (let i = 0; i < 15; i++) {
			points.push({
				x: pad + rand() * (W - 2 * pad),
				y: pad + rand() * (H - 2 * pad),
				r: noisy(rand, 0.4, 0.3, 0.2, 0.7),
				fill: '#a09888',
				alpha: 0.1
			});
		}
		drawDelaunay(ctx, W, H, points, { edgeColor: 'rgba(30,136,229,0.08)', centerColor: '#004D40' });
	}

	/* ── Lindenmayer Systems card renderer ── */
	function renderLindenmayerCard(canvas) {
		const { ctx, W, H } = setupCanvas(canvas);
		const rand = rng(161);
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, W, H);

		const rules = { F: 'FF+[+F-F-F]-[-F+F+F]' };
		let axiom = 'F';
		for (let g = 0; g < 4; g++) {
			let next = '';
			for (const ch of axiom) next += rules[ch] || ch;
			axiom = next;
		}
		const angle = (25 * Math.PI) / 180;
		const step = Math.min(W, H) * 0.028;
		const segments = [];
		let x = W * 0.5, y = H * 0.92, dir = -Math.PI / 2;
		const stack = [];
		for (const ch of axiom) {
			if (ch === 'F') {
				const nx = x + Math.cos(dir) * step;
				const ny = y + Math.sin(dir) * step;
				segments.push({ x1: x, y1: y, x2: nx, y2: ny });
				x = nx; y = ny;
			} else if (ch === '+') { dir += angle; }
			else if (ch === '-') { dir -= angle; }
			else if (ch === '[') { stack.push({ x, y, dir }); }
			else if (ch === ']') { const s = stack.pop(); x = s.x; y = s.y; dir = s.dir; }
		}
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (const s of segments) {
			if (s.x1 < minX) minX = s.x1; if (s.x2 < minX) minX = s.x2;
			if (s.y1 < minY) minY = s.y1; if (s.y2 < minY) minY = s.y2;
			if (s.x1 > maxX) maxX = s.x1; if (s.x2 > maxX) maxX = s.x2;
			if (s.y1 > maxY) maxY = s.y1; if (s.y2 > maxY) maxY = s.y2;
		}
		const sw = maxX - minX || 1, sh = maxY - minY || 1;
		const scale = Math.min((W - 28) / sw, (H - 28) / sh);
		const ox = (W - sw * scale) / 2 - minX * scale;
		const oy = (H - sh * scale) / 2 - minY * scale;

		for (const s of segments) {
			const depth = Math.min(1, Math.sqrt((s.y1 - minY) / sh));
			ctx.beginPath();
			ctx.moveTo(s.x1 * scale + ox, s.y1 * scale + oy);
			ctx.lineTo(s.x2 * scale + ox, s.y2 * scale + oy);
			ctx.strokeStyle = lerpHex('#5a8a3a', '#a8cc78', depth);
			ctx.lineWidth = 1.2 - depth * 0.6;
			ctx.globalAlpha = 0.5 + (1 - depth) * 0.4;
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
	}

	/* ── Interactive Visualizations (playground) card renderer ── */
	function renderPlaygroundCard(canvas) {
		const { ctx, W, H } = setupCanvas(canvas);
		const rand = rng(808);
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, W, H);

		const cols = ['#3a6b9f', '#c44030', '#e8a020', '#2a9d6a', '#7b5ea7', '#d06040'];
		const shapes = [];
		for (let i = 0; i < 30; i++) {
			shapes.push({
				x: rand() * W, y: rand() * H,
				r: 6 + rand() * 18,
				sides: 3 + Math.floor(rand() * 5),
				color: cols[Math.floor(rand() * cols.length)],
				rot: rand() * Math.PI * 2,
				alpha: 0.25 + rand() * 0.35
			});
		}
		for (const s of shapes) {
			ctx.beginPath();
			for (let j = 0; j <= s.sides; j++) {
				const a = s.rot + (j / s.sides) * Math.PI * 2;
				const px = s.x + Math.cos(a) * s.r;
				const py = s.y + Math.sin(a) * s.r;
				if (j === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			ctx.closePath();
			ctx.fillStyle = hexToRgba(s.color, s.alpha);
			ctx.fill();
			ctx.strokeStyle = hexToRgba(s.color, s.alpha * 1.6);
			ctx.lineWidth = 0.5;
			ctx.stroke();
		}
		ctx.strokeStyle = 'rgba(0,0,0,0.04)';
		ctx.lineWidth = 0.3;
		for (let i = 0; i < shapes.length; i++) {
			for (let j = i + 1; j < shapes.length; j++) {
				const dx = shapes[i].x - shapes[j].x, dy = shapes[i].y - shapes[j].y;
				if (Math.sqrt(dx * dx + dy * dy) < 80) {
					ctx.beginPath();
					ctx.moveTo(shapes[i].x, shapes[i].y);
					ctx.lineTo(shapes[j].x, shapes[j].y);
					ctx.stroke();
				}
			}
		}
	}

	function renderAll() {
		if (findCanvas) renderFindCard(findCanvas);
		if (fenwayCanvas) renderFenwayCard(fenwayCanvas);
		if (listiclesCanvas) renderListiclesCard(listiclesCanvas);
		if (rlCanvas) renderRlCard(rlCanvas);
		if (transformerCanvas) renderTransformerCard(transformerCanvas);
		if (beamCanvas) renderBeamCard(beamCanvas);
		if (ntmCanvas) renderNtmCard(ntmCanvas);
		if (bpeCanvas) renderBpeCard(bpeCanvas);
		if (trainingPriorsCanvas) renderTrainingPriorsCard(trainingPriorsCanvas);
		if (predictingBiasesCanvas) renderPredictingBiasesCard(predictingBiasesCanvas);
		if (alphatologyCanvas) renderAlphatologyCard(alphatologyCanvas);
		if (lindenmayerCanvas) renderLindenmayerCard(lindenmayerCanvas);
		if (playgroundCanvas) renderPlaygroundCard(playgroundCanvas);
	}

	onMount(() => {
		renderAll();
		let timer;
		const onResize = () => {
			clearTimeout(timer);
			timer = setTimeout(renderAll, 150);
		};
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});
</script>

<svelte:head>
	<title>Charles Lovering</title>
</svelte:head>

<section class="mb-14">
	<div class="flex items-start gap-5">
		<img src="{base}/me-180.png" alt="Charles Lovering" class="w-[72px] h-[72px] rounded-lg shrink-0 shadow-sm" />
		<div class="min-w-0">
			<h1 class="text-[1.1rem] font-sans font-semibold text-ink tracking-tight leading-tight">Charles Lovering</h1>
			<p class="text-ink-4 text-[0.88rem] font-sans mt-0.5">Studies neural models</p>
			<div class="flex gap-3 mt-2">
				<a href="https://github.com/cjlovering" target="_blank" rel="noopener noreferrer"
					class="text-ink-5 hover:text-ink-2 transition-colors" aria-label="GitHub">
					<svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
				</a>
				<a href="https://scholar.google.com/citations?user=w0hYPqEAAAAJ&hl=en&oi=ao" target="_blank" rel="noopener noreferrer"
					class="text-ink-5 hover:text-ink-2 transition-colors" aria-label="Google Scholar">
					<svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M5.242 13.769 0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/></svg>
				</a>
			</div>
		</div>
	</div>
	<p class="text-ink-3 text-[0.92rem] leading-relaxed mt-5">I work on understanding neural models (language models, vision models, game-playing models), both their internals (more so during my PhD; i.e., interpretability) and their behavior (more so in my professional role; i.e., evaluation). I completed my PhD at Brown University in 2023 and thereafter have worked as a research scientist at Kensho Technologies.</p>
	<div class="h-px bg-border mt-6"></div>
</section>

{#each sections as section, si}
	{@const items = postsBySection(section.key)}
	{#if items.length}
		<section class="mb-14">
			<div class="flex items-center gap-4 mb-6">
				<h2
					class="text-sm font-sans font-medium text-ink-4 uppercase tracking-widest shrink-0"
				>
					{section.label}
				</h2>
				<div class="flex-1 h-px bg-border"></div>
			</div>
			{#if section.key === 'research'}
				<p class="text-ink-3 text-[0.92rem] leading-relaxed mb-6">Brief breakdowns of some of my research.</p>
			{:else if section.key === 'exposition'}
				<p class="text-ink-3 text-[0.92rem] leading-relaxed mb-6">I found it educational to walk through some papers/concepts. Or rather, mostly, I liked trying to make the figures nice.</p>
			{:else if section.key === 'notes'}
				<p class="text-ink-3 text-[0.92rem] leading-relaxed mb-6">Code tricks that I found useful during my PhD. Nowadays, though, Claude has got you covered!</p>
			{/if}
			<div class="cards" class:cards-compact={section.key === 'notes'}>
				{#each items as post, pi}
					<a href="{base}/{post.slug}" class="card">
						<div class="pane" class:pane-compact={section.key === 'notes'}>
							{#if post.slug === 'find'}
								<canvas bind:this={findCanvas} class="canvas-fill"></canvas>
							{:else if post.slug === 'fenway'}
								<canvas bind:this={fenwayCanvas} class="canvas-fill"></canvas>
							{:else if post.slug === 'listicles'}
								<canvas bind:this={listiclesCanvas} class="canvas-fill"></canvas>
							{:else if post.slug === 'predicting-biases'}
								<canvas bind:this={predictingBiasesCanvas} class="canvas-fill"></canvas>
							{:else if post.slug === 'alphatology'}
								<canvas bind:this={alphatologyCanvas} class="canvas-fill"></canvas>
							{:else if post.slug === 'training-priors'}
								<canvas bind:this={trainingPriorsCanvas} class="canvas-fill"></canvas>
							{:else if post.slug === 'interpretable-rl'}
								<canvas bind:this={rlCanvas} class="canvas-fill"></canvas>
							{:else if post.slug === 'transformer-networks'}
								<canvas bind:this={transformerCanvas} class="canvas-fill"></canvas>
							{:else if post.slug === 'beam-search'}
								<canvas bind:this={beamCanvas} class="canvas-fill"></canvas>
							{:else if post.slug === 'neural-turing'}
								<canvas bind:this={ntmCanvas} class="canvas-fill"></canvas>
							{:else if post.slug === 'byte-encoding'}
								<canvas bind:this={bpeCanvas} class="canvas-fill"></canvas>
							{:else}
								<div class="pane-inner" style={paneGradient(section.key, pi)}>
									<span class="pane-title">{post.title}</span>
								</div>
							{/if}
						</div>
						<p class="card-label">{post.title}</p>
						<div class="card-tags">
							<span class="tag tag-date">{post.date}</span>
							{#each post.tags as tag}
								<span class="tag"
								class:tag-affiliation={tag === 'Kensho' || tag === 'Brown'}
								class:tag-venue={tag === 'ACL 2025' || tag === 'ICLR 2021' || tag === 'NeurIPS 2022' || tag === 'Under Review' || tag === 'Shelved'}
								class:tag-topic={tag !== 'Kensho' && tag !== 'Brown' && tag !== 'ACL 2025' && tag !== 'ICLR 2021' && tag !== 'NeurIPS 2022' && tag !== 'Under Review' && tag !== 'Shelved'}
								class:tag-shelved={tag === 'Shelved'}
							>{tag}</span>
							{/each}
						</div>
					</a>
				{/each}
			</div>
			{#if section.key === 'research'}
				<div class="flex items-center gap-4 mb-6 mt-10">
					<h2 class="text-sm font-sans font-medium text-ink-4 uppercase tracking-widest shrink-0">
						Artifacts
					</h2>
					<div class="flex-1 h-px bg-border"></div>
				</div>
				<p class="text-ink-3 text-[0.92rem] leading-relaxed mb-6">Visualizations and interactive notebooks.</p>
				<div class="cards">
					{#each artifacts as artifact}
						<a href={artifact.url} target="_blank" rel="noopener noreferrer" class="card">
							<div class="pane artifact-pane">
								{#if artifact.title === 'Lindenmayer Systems'}
									<canvas bind:this={lindenmayerCanvas} class="canvas-fill"></canvas>
								{:else}
									<canvas bind:this={playgroundCanvas} class="canvas-fill"></canvas>
								{/if}
								<svg class="external-icon" viewBox="0 0 20 20" fill="currentColor">
									<path d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-3.5a.75.75 0 0 1 1.5 0v3.5A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h3.5a.75.75 0 0 1 0 1.5h-3.5ZM11 3.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-5.22 5.22a.75.75 0 1 1-1.06-1.06l5.22-5.22H11.75A.75.75 0 0 1 11 3.5Z" />
								</svg>
							</div>
							<p class="card-label">{artifact.title}</p>
						</a>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
{/each}

<style>
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1.75rem;
	}
	.cards-compact {
		grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
		gap: 1.25rem;
	}
	.card {
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
	}
	.pane {
		aspect-ratio: 1;
		border-radius: 12px;
		overflow: hidden;
		background: #fff;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 0 0 1px rgba(0, 0, 0, 0.04);
		transition:
			transform 0.25s ease,
			box-shadow 0.25s ease;
	}
	.pane-compact {
		aspect-ratio: 4 / 3;
	}
	.card:hover .pane {
		transform: translateY(-4px);
		box-shadow:
			0 12px 32px rgba(0, 0, 0, 0.1),
			0 0 0 1px rgba(0, 0, 0, 0.04);
	}
	.canvas-fill {
		width: 100%;
		height: 100%;
		display: block;
	}
	.pane-inner {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}
	.pane-title {
		text-align: center;
		font-family: var(--font-serif);
		font-size: 0.88rem;
		line-height: 1.6;
		color: #999;
		letter-spacing: 0.01em;
	}
	.card-label {
		margin-top: 0.75rem;
		font-size: 0.82rem;
		font-weight: 500;
		font-family: var(--font-sans);
		line-height: 1.4;
		color: #555;
		letter-spacing: -0.01em;
	}
	.card-tags {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
		margin-top: 0.35rem;
	}
	.tag {
		font-size: 0.67rem;
		font-weight: 500;
		font-family: var(--font-sans);
		padding: 0.1rem 0.45rem;
		border-radius: 9999px;
		letter-spacing: 0.01em;
	}
	.tag-date {
		background: #f0eeeb;
		color: #6b6866;
	}
	.tag-topic {
		background: #eef4f8;
		color: #1a5276;
	}
	.tag-affiliation {
		background: #fef3e8;
		color: #a0510a;
	}
	.tag-venue {
		background: #e8f5f3;
		color: #1a6b5a;
	}
	.tag-shelved {
		text-decoration: line-through;
	}

	.artifact-pane {
		position: relative;
	}
	.external-icon {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 16px;
		height: 16px;
		color: rgba(0, 0, 0, 0.3);
		transition: color 0.2s ease;
		pointer-events: none;
	}
	.card:hover .external-icon {
		color: rgba(0, 0, 0, 0.55);
	}

	@media (max-width: 500px) {
		.cards {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			gap: 1.25rem;
		}
		.cards-compact {
			grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
			gap: 1rem;
		}
	}
</style>
