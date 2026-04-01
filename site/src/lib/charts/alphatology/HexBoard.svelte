<!--
  D3 hex board with nearest-neighbor arrows reconstructed from overlap scores.

  At each checkpoint, for each cell we know what fraction of its true hex
  neighbors the model recovered (overlap ∈ {0, 1/6, …, 1}). We sample
  that many true neighbors at full opacity and fill the remaining "budget"
  with random non-neighbor arrows — producing chaos early and a clean
  hex grid late, matching the original PDF visualizations.

  cellData = { overlap: { "0": [81 floats], … }, ndcg: { "0": [81 floats], … } }
-->
<script>
	import * as d3 from 'd3';
	import { theme, styleAxis } from './theme.js';

	let { cellData = null, size = 420 } = $props();

	const BOARD = 9;
	const TOTAL = BOARD * BOARD;

	let wrapper = $state();
	let chartWrapper = $state();
	let w = $state(0);
	let checkpoint = $state(0);
	let playing = $state(true);
	let hoveredCell = $state(-1);

	let checkpoints = $derived(
		cellData ? Object.keys(cellData.overlap).map(Number).sort((a, b) => a - b) : []
	);

	$effect(() => {
		if (!wrapper) return;
		const ro = new ResizeObserver(([e]) => { w = e.contentRect.width; });
		ro.observe(wrapper);
		return () => ro.disconnect();
	});

	$effect(() => {
		if (playing && checkpoints.length > 1) {
			const id = setInterval(() => {
				const idx = checkpoints.indexOf(checkpoint);
				checkpoint = checkpoints[(idx + 1) % checkpoints.length];
			}, 1800);
			return () => clearInterval(id);
		}
	});

	$effect(() => {
		if (!wrapper || w === 0 || !cellData) return;
		void checkpoint;
		void hoveredCell;
		renderBoard();
	});

	$effect(() => {
		if (!chartWrapper || w === 0 || !cellData) return;
		void checkpoint;
		renderChart();
	});

	// ── Hex geometry (matches source: neighbors.py) ──
	// Neighbor directions from the original code:
	// (r-1, c), (r-1, c+1), (r, c-1), (r, c+1), (r+1, c), (r+1, c-1)
	// These are axial/offset coords for a parallelogram hex grid.
	function cellPos(i) {
		return { row: Math.floor(i / BOARD), col: i % BOARD };
	}

	function trueNeighbors(row, col) {
		const offsets = [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, -1]];
		const result = [];
		for (const [dr, dc] of offsets) {
			const nr = row + dr, nc = col + dc;
			if (nr >= 0 && nr < BOARD && nc >= 0 && nc < BOARD)
				result.push(nr * BOARD + nc);
		}
		return result;
	}

	// Hex center in pixel coords — parallelogram layout (like a real Hex board).
	// Each row shifts right by half a cell width, forming the diamond shape.
	function hexCenter(row, col, r) {
		const h = r * Math.sqrt(3);
		const x = col * h + row * h * 0.5;
		const y = row * r * 1.5;
		return { x, y };
	}

	// ── Precompute neighbor lists ──
	const neighborMap = [];
	const allNonNeighbors = [];

	for (let i = 0; i < TOTAL; i++) {
		const { row, col } = cellPos(i);
		const nb = trueNeighbors(row, col);
		neighborMap.push(nb);

		const nbSet = new Set(nb);
		nbSet.add(i);
		const cands = [];
		for (let j = 0; j < TOTAL; j++) {
			if (!nbSet.has(j)) cands.push(j);
		}
		allNonNeighbors.push(cands);
	}

	// Seeded deterministic shuffle for sampling
	function seededShuffle(arr, seed) {
		const rng = d3.randomLcg(seed);
		const out = arr.slice();
		for (let i = out.length - 1; i > 0; i--) {
			const j = Math.floor(rng() * (i + 1));
			[out[i], out[j]] = [out[j], out[i]];
		}
		return out;
	}

	// ── Curved arrow path (quadratic bezier with perpendicular bulge) ──
	function curvedArrow(from, to, nodeR, bulge = 0.15) {
		const dx = to.x - from.x, dy = to.y - from.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist < 1) return '';
		const ux = dx / dist, uy = dy / dist;
		// Perpendicular direction
		const px = -uy, py = ux;
		// Start/end offset by node radius
		const x1 = from.x + ux * nodeR, y1 = from.y + uy * nodeR;
		const x2 = to.x - ux * nodeR, y2 = to.y - uy * nodeR;
		// Control point: midpoint + perpendicular offset
		const mx = (x1 + x2) / 2 + px * dist * bulge;
		const my = (y1 + y2) / 2 + py * dist * bulge;
		return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
	}

	function renderBoard() {
		const svgSize = Math.min(size, w);
		const pad = 24;
		const r = (svgSize - 2 * pad) / (BOARD * 2.2);
		const nodeR = r * 0.30;

		// Compute centers
		const centers = [];
		for (let i = 0; i < TOTAL; i++) {
			const { row, col } = cellPos(i);
			centers.push(hexCenter(row, col, r));
		}

		// Center the board in SVG
		const xs = centers.map(c => c.x), ys = centers.map(c => c.y);
		const ox = (svgSize - (Math.max(...xs) - Math.min(...xs))) / 2 - Math.min(...xs);
		const oy = (svgSize - (Math.max(...ys) - Math.min(...ys))) / 2 - Math.min(...ys);

		const overlap = cellData.overlap[String(checkpoint)] ?? new Array(TOTAL).fill(0);
		const ndcg = cellData.ndcg[String(checkpoint)] ?? new Array(TOTAL).fill(0.9);

		const svg = d3.select(wrapper).select('.hex-svg');
		let root = svg.selectAll('svg').data([null]);
		root = root.enter().append('svg').merge(root)
			.attr('width', svgSize).attr('height', svgSize)
			.attr('viewBox', `0 0 ${svgSize} ${svgSize}`);
		root.selectAll('*').remove();

		const defs = root.append('defs');

		// Arrow markers — two variants: neighbor (dark) and noise (light)
		for (const [id, fill, sz] of [
			['arr-nb', theme.ink[1], 4],
			['arr-noise', theme.ink[5], 3]
		]) {
			defs.append('marker').attr('id', id)
				.attr('viewBox', '0 0 6 6')
				.attr('refX', 5).attr('refY', 3)
				.attr('markerWidth', sz).attr('markerHeight', sz)
				.attr('orient', 'auto')
				.append('path').attr('d', 'M0,0 L6,3 L0,6 Z').attr('fill', fill);
		}

		const g = root.append('g').attr('transform', `translate(${ox},${oy})`);

		// ── Build arrow data ──
		// For each cell, sample floor(overlap * numNeighbors) true neighbors,
		// and (6 - sampled) noise arrows to random non-neighbors.
		const trueArrows = [];
		const noiseArrows = [];

		for (let i = 0; i < TOTAL; i++) {
			const ov = overlap[i];
			const nbs = neighborMap[i];
			const numTrue = Math.round(ov * nbs.length);

			// Deterministic sample based on checkpoint + cell
			const shuffledNbs = seededShuffle(nbs, checkpoint * 1000 + i);
			const shown = shuffledNbs.slice(0, numTrue);
			const numNoise = nbs.length - numTrue;

			for (const nb of shown) {
				trueArrows.push({ from: i, to: nb });
			}

			if (numNoise > 0) {
				const shuffledNon = seededShuffle(allNonNeighbors[i], checkpoint * 1000 + i + 500);
				for (let k = 0; k < Math.min(numNoise, 4); k++) {
					noiseArrows.push({ from: i, to: shuffledNon[k] });
				}
			}
		}

		// ── Draw noise arrows first (behind) ──
		const meanOv = d3.mean(overlap);
		const noiseBaseOp = Math.max(0, (1 - meanOv) * 0.22);

		for (const a of noiseArrows) {
			const from = centers[a.from], to = centers[a.to];
			// Vary bulge direction for visual variety
			const bulge = ((a.from + a.to) % 2 === 0 ? 0.08 : -0.08);
			const d = curvedArrow(from, to, nodeR, bulge);
			if (!d) continue;

			let op = noiseBaseOp;
			if (hoveredCell >= 0) op = a.from === hoveredCell ? 0.35 : 0.02;

			g.append('path')
				.attr('d', d)
				.attr('fill', 'none')
				.attr('stroke', theme.ink[5])
				.attr('stroke-width', 0.4)
				.attr('opacity', op)
				.attr('marker-end', 'url(#arr-noise)');
		}

		// ── Draw true-neighbor arrows ──
		for (const a of trueArrows) {
			const from = centers[a.from], to = centers[a.to];
			const bulge = ((a.from + a.to) % 3 === 0 ? 0.12 : -0.12);
			const d = curvedArrow(from, to, nodeR, bulge);
			if (!d) continue;

			let op = 0.55;
			let sw = 0.9;
			if (hoveredCell >= 0) {
				if (a.from === hoveredCell || a.to === hoveredCell) {
					op = 0.9; sw = 1.6;
				} else {
					op = 0.06;
				}
			}

			g.append('path')
				.attr('d', d)
				.attr('fill', 'none')
				.attr('stroke', theme.ink[1])
				.attr('stroke-width', sw)
				.attr('opacity', op)
				.attr('marker-end', 'url(#arr-nb)');
		}

		// ── Draw cells on top ──
		// Fill: NDCG-based (how well this cell's neighbor ranking matches ground truth)
		// Stroke: overlap-based (how many true neighbors recovered)
		const ndcgColor = d3.scaleLinear()
			.domain([0.88, 1.0]).range(['#f3f1ee', '#AD2111']).clamp(true);
		const overlapStroke = d3.scaleLinear()
			.domain([0, 1]).range([theme.ink[5], theme.ink[0]]);

		for (let i = 0; i < TOTAL; i++) {
			const c = centers[i];
			const isHovered = hoveredCell === i;

			g.append('circle')
				.attr('cx', c.x).attr('cy', c.y)
				.attr('r', isHovered ? nodeR * 1.3 : nodeR)
				.attr('fill', ndcgColor(ndcg[i]))
				.attr('stroke', isHovered ? theme.ink[0] : overlapStroke(overlap[i]))
				.attr('stroke-width', isHovered ? 2 : 0.8)
				.attr('cursor', 'pointer')
				.on('mouseenter', () => { hoveredCell = i; })
				.on('mouseleave', () => { hoveredCell = -1; });
		}

		// ── Checkpoint label ──
		root.append('text')
			.attr('x', svgSize / 2).attr('y', 16)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans)
			.attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[2])
			.text(`Checkpoint ${checkpoint} / ${checkpoints[checkpoints.length - 1]}`);

		// ── Hover tooltip ──
		if (hoveredCell >= 0) {
			const c = centers[hoveredCell];
			const ov = overlap[hoveredCell];
			const nd = ndcg[hoveredCell];
			const nbs = neighborMap[hoveredCell].length;
			const recovered = Math.round(ov * nbs);
			root.append('text')
				.attr('x', c.x + ox).attr('y', c.y + oy - nodeR - 6)
				.attr('text-anchor', 'middle')
				.attr('font-family', theme.font.sans)
				.attr('font-size', 10)
				.attr('fill', theme.ink[1])
				.text(`Cell ${hoveredCell}: ${recovered}/${nbs} neighbors, NDCG ${nd.toFixed(3)}`);
		}
	}

	function renderChart() {
		const chartH = 120;
		const m = { top: 12, right: 20, bottom: 28, left: 52 };
		const iw = w - m.left - m.right;
		const ih = chartH - m.top - m.bottom;

		const meanOverlap = checkpoints.map(ck => ({
			x: ck, y: d3.mean(cellData.overlap[String(ck)])
		}));
		const meanNdcg = checkpoints.map(ck => ({
			x: ck, y: d3.mean(cellData.ndcg[String(ck)])
		}));

		const svg = d3.select(chartWrapper).selectAll('svg').data([null]);
		const root = svg.enter().append('svg').merge(svg)
			.attr('width', w).attr('height', chartH)
			.attr('viewBox', `0 0 ${w} ${chartH}`)
			.style('overflow', 'visible');
		root.selectAll('*').remove();

		const g = root.append('g').attr('transform', `translate(${m.left},${m.top})`);
		const x = d3.scaleLinear().domain([0, checkpoints[checkpoints.length - 1]]).range([0, iw]);
		const y = d3.scaleLinear().domain([0, 1]).range([ih, 0]);

		const xG = g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).ticks(10));
		styleAxis(xG, { orient: 'bottom' });
		const yG = g.append('g').call(d3.axisLeft(y).ticks(4).tickFormat(d3.format('.0%')));
		styleAxis(yG, { grid: true, width: iw, height: ih, orient: 'left' });

		const line = d3.line().x(d => x(d.x)).y(d => y(d.y)).curve(d3.curveMonotoneX);
		const area = d3.area().x(d => x(d.x)).y0(ih).y1(d => y(d.y)).curve(d3.curveMonotoneX);

		// Overlap fill + line
		g.append('path').datum(meanOverlap).attr('d', area)
			.attr('fill', theme.conceptColors.bridge).attr('opacity', 0.08);
		g.append('path').datum(meanOverlap).attr('d', line)
			.attr('fill', 'none').attr('stroke', theme.conceptColors.bridge).attr('stroke-width', 1.8);

		// NDCG dashed line
		g.append('path').datum(meanNdcg).attr('d', line)
			.attr('fill', 'none').attr('stroke', theme.conceptColors.edge)
			.attr('stroke-width', 1.8).attr('stroke-dasharray', '4,3');

		// Playhead
		const px = x(checkpoint);
		g.append('line')
			.attr('x1', px).attr('x2', px).attr('y1', 0).attr('y2', ih)
			.attr('stroke', theme.ink[0]).attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '4,3');

		const ovVal = meanOverlap.find(d => d.x === checkpoint);
		if (ovVal) {
			g.append('circle').attr('cx', px).attr('cy', y(ovVal.y)).attr('r', 3.5)
				.attr('fill', theme.conceptColors.bridge).attr('stroke', '#fff').attr('stroke-width', 1.5);
		}
		const ndVal = meanNdcg.find(d => d.x === checkpoint);
		if (ndVal) {
			g.append('circle').attr('cx', px).attr('cy', y(ndVal.y)).attr('r', 3.5)
				.attr('fill', theme.conceptColors.edge).attr('stroke', '#fff').attr('stroke-width', 1.5);
		}

		// Legend
		const leg = g.append('g').attr('transform', `translate(${iw - 150}, 2)`);
		leg.append('line').attr('x1', 0).attr('x2', 14).attr('y1', 5).attr('y2', 5)
			.attr('stroke', theme.conceptColors.bridge).attr('stroke-width', 2);
		leg.append('text').attr('x', 18).attr('y', 9)
			.attr('font-family', theme.font.sans).attr('font-size', 10)
			.attr('fill', theme.ink[2]).text('Overlap');
		leg.append('line').attr('x1', 75).attr('x2', 89).attr('y1', 5).attr('y2', 5)
			.attr('stroke', theme.conceptColors.edge).attr('stroke-width', 2)
			.attr('stroke-dasharray', '4,3');
		leg.append('text').attr('x', 93).attr('y', 9)
			.attr('font-family', theme.font.sans).attr('font-size', 10)
			.attr('fill', theme.ink[2]).text('NDCG');

		root.append('text')
			.attr('x', m.left + iw / 2).attr('y', chartH - 2)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[3]).text('Checkpoint');
	}

	function togglePlay() { playing = !playing; }
</script>

<div bind:this={wrapper} class="w-full">
	<div class="hex-svg mx-auto" style="width: {Math.min(size, w)}px;"></div>

	<div class="flex items-center justify-center gap-2 mt-2 mb-1 flex-wrap">
		<button
			onclick={togglePlay}
			class="text-xs font-sans px-2 py-0.5 rounded border border-[#e8e5e0] hover:bg-[#fafaf9] transition-colors"
		>
			{playing ? 'Pause' : 'Play'}
		</button>
		<input
			type="range"
			min={checkpoints[0] ?? 0}
			max={checkpoints[checkpoints.length - 1] ?? 19}
			step="1"
			bind:value={checkpoint}
			oninput={() => { playing = false; }}
			class="w-40 accent-[#AD2111]"
		/>
		<span class="text-xs font-sans text-ink-3 w-6 text-right">{checkpoint}</span>
	</div>

	<div bind:this={chartWrapper} class="w-full mt-1"></div>
</div>
