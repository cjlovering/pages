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
	let colorMetric = $state('ndcg'); // 'ndcg' | 'overlap'

	let checkpoints = $derived(
		cellData ? Object.keys(cellData.overlap).map(Number).sort((a, b) => a - b) : []
	);

	$effect(() => {
		if (!wrapper) return;
		const ro = new ResizeObserver(([e]) => { w = e.contentRect.width; });
		ro.observe(wrapper);
		return () => ro.disconnect();
	});

	// Auto-play — 1200ms interval
	$effect(() => {
		if (playing && checkpoints.length > 1) {
			const id = setInterval(() => {
				const idx = checkpoints.indexOf(checkpoint);
				checkpoint = checkpoints[(idx + 1) % checkpoints.length];
			}, 1200);
			return () => clearInterval(id);
		}
	});

	// Arrow key navigation
	$effect(() => {
		if (!wrapper) return;
		function onKey(e) {
			if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
				e.preventDefault();
				playing = false;
				const idx = checkpoints.indexOf(checkpoint);
				if (e.key === 'ArrowRight' && idx < checkpoints.length - 1) {
					checkpoint = checkpoints[idx + 1];
				} else if (e.key === 'ArrowLeft' && idx > 0) {
					checkpoint = checkpoints[idx - 1];
				}
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	$effect(() => {
		if (!wrapper || w === 0 || !cellData) return;
		void checkpoint;
		void hoveredCell;
		void colorMetric;
		renderBoard();
	});

	$effect(() => {
		if (!chartWrapper || w === 0 || !cellData) return;
		void checkpoint;
		renderChart();
	});

	// ── Hex geometry (matches source: neighbors.py) ──
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

	function seededShuffle(arr, seed) {
		const rng = d3.randomLcg(seed);
		const out = arr.slice();
		for (let i = out.length - 1; i > 0; i--) {
			const j = Math.floor(rng() * (i + 1));
			[out[i], out[j]] = [out[j], out[i]];
		}
		return out;
	}

	function curvedArrow(from, to, nodeR, bulge = 0.15) {
		const dx = to.x - from.x, dy = to.y - from.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist < 1) return '';
		const ux = dx / dist, uy = dy / dist;
		const px = -uy, py = ux;
		const x1 = from.x + ux * nodeR, y1 = from.y + uy * nodeR;
		const x2 = to.x - ux * nodeR, y2 = to.y - uy * nodeR;
		const mx = (x1 + x2) / 2 + px * dist * bulge;
		const my = (y1 + y2) / 2 + py * dist * bulge;
		return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
	}

	function renderBoard() {
		const svgSize = Math.min(size, w);
		const pad = 24;
		const r = (svgSize - 2 * pad) / (BOARD * 2.2);
		const nodeR = r * 0.30;

		const centers = [];
		for (let i = 0; i < TOTAL; i++) {
			const { row, col } = cellPos(i);
			centers.push(hexCenter(row, col, r));
		}

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
		const trueArrows = [];
		const noiseArrows = [];

		for (let i = 0; i < TOTAL; i++) {
			const ov = overlap[i];
			const nbs = neighborMap[i];
			const numTrue = Math.round(ov * nbs.length);
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

		// ── Noise arrows (behind) ──
		const meanOv = d3.mean(overlap);
		const noiseBaseOp = Math.max(0, (1 - meanOv) * 0.22);

		for (const a of noiseArrows) {
			const from = centers[a.from], to = centers[a.to];
			const bulge = ((a.from + a.to) % 2 === 0 ? 0.08 : -0.08);
			const d = curvedArrow(from, to, nodeR, bulge);
			if (!d) continue;
			let op = noiseBaseOp;
			if (hoveredCell >= 0) op = a.from === hoveredCell ? 0.35 : 0.02;

			g.append('path').attr('d', d)
				.attr('fill', 'none').attr('stroke', theme.ink[5])
				.attr('stroke-width', 0.4).attr('opacity', op)
				.attr('marker-end', 'url(#arr-noise)');
		}

		// ── True-neighbor arrows ──
		for (const a of trueArrows) {
			const from = centers[a.from], to = centers[a.to];
			const bulge = ((a.from + a.to) % 3 === 0 ? 0.12 : -0.12);
			const d = curvedArrow(from, to, nodeR, bulge);
			if (!d) continue;
			let op = 0.55, sw = 0.9;
			if (hoveredCell >= 0) {
				if (a.from === hoveredCell || a.to === hoveredCell) { op = 0.9; sw = 1.6; }
				else { op = 0.06; }
			}
			g.append('path').attr('d', d)
				.attr('fill', 'none').attr('stroke', theme.ink[1])
				.attr('stroke-width', sw).attr('opacity', op)
				.attr('marker-end', 'url(#arr-nb)');
		}

		// ── Cells ──
		const ndcgColor = d3.scaleLinear()
			.domain([0.88, 1.0]).range(['#f3f1ee', '#AD2111']).clamp(true);
		const overlapColor = d3.scaleLinear()
			.domain([0, 1]).range(['#f3f1ee', '#AD2111']).clamp(true);
		const fillScale = colorMetric === 'ndcg' ? ndcgColor : overlapColor;

		const overlapStroke = d3.scaleLinear()
			.domain([0, 1]).range([theme.ink[5], theme.ink[0]]);

		for (let i = 0; i < TOTAL; i++) {
			const c = centers[i];
			const isHovered = hoveredCell === i;
			const val = colorMetric === 'ndcg' ? ndcg[i] : overlap[i];

			g.append('circle')
				.attr('cx', c.x).attr('cy', c.y)
				.attr('r', isHovered ? nodeR * 1.3 : nodeR)
				.attr('fill', fillScale(val))
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

		// ── Color legend (right side of SVG) ──
		const legX = svgSize - 18;
		const legY = 30;
		const legH = 80;
		const legW = 10;

		// Gradient bar
		const gradId = 'cell-color-grad';
		const grad = defs.append('linearGradient').attr('id', gradId)
			.attr('x1', '0%').attr('y1', '100%').attr('x2', '0%').attr('y2', '0%');
		grad.append('stop').attr('offset', '0%').attr('stop-color', '#f3f1ee');
		grad.append('stop').attr('offset', '100%').attr('stop-color', '#AD2111');

		root.append('rect')
			.attr('x', legX).attr('y', legY)
			.attr('width', legW).attr('height', legH)
			.attr('fill', `url(#${gradId})`)
			.attr('stroke', theme.border.default).attr('stroke-width', 0.5)
			.attr('rx', 2);

		// Domain labels
		const domainLo = colorMetric === 'ndcg' ? '0.88' : '0%';
		const domainHi = colorMetric === 'ndcg' ? '1.00' : '100%';

		root.append('text')
			.attr('x', legX + legW / 2).attr('y', legY - 4)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', 9)
			.attr('fill', theme.ink[3]).text(domainHi);
		root.append('text')
			.attr('x', legX + legW / 2).attr('y', legY + legH + 10)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', 9)
			.attr('fill', theme.ink[3]).text(domainLo);
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

		// Overlap
		g.append('path').datum(meanOverlap).attr('d', area)
			.attr('fill', theme.conceptColors.bridge).attr('opacity', 0.08);
		g.append('path').datum(meanOverlap).attr('d', line)
			.attr('fill', 'none').attr('stroke', theme.conceptColors.bridge).attr('stroke-width', 1.8);

		// NDCG
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

<div bind:this={wrapper} class="w-full" tabindex="0">
	<div class="hex-svg mx-auto" style="width: {Math.min(size, w)}px;"></div>

	<!-- Controls row -->
	<div class="flex items-center justify-center gap-3 mt-2 mb-1 flex-wrap">
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

		<!-- Color metric toggle -->
		<span class="text-[10px] font-sans text-ink-4 ml-2">Color:</span>
		<button
			onclick={() => { colorMetric = 'ndcg'; }}
			class="text-[11px] font-sans px-1.5 py-0.5 rounded border transition-colors"
			style="background: {colorMetric === 'ndcg' ? '#282828' : 'transparent'}; color: {colorMetric === 'ndcg' ? '#fff' : '#504945'}; border-color: {colorMetric === 'ndcg' ? '#282828' : '#e8e5e0'};"
		>
			NDCG
		</button>
		<button
			onclick={() => { colorMetric = 'overlap'; }}
			class="text-[11px] font-sans px-1.5 py-0.5 rounded border transition-colors"
			style="background: {colorMetric === 'overlap' ? '#282828' : 'transparent'}; color: {colorMetric === 'overlap' ? '#fff' : '#504945'}; border-color: {colorMetric === 'overlap' ? '#282828' : '#e8e5e0'};"
		>
			Overlap
		</button>
	</div>

	<p class="text-center text-[10px] text-ink-4 font-sans mt-0 mb-1">
		Use <kbd class="px-1 py-0.5 rounded border border-[#e8e5e0] text-[10px]">&larr;</kbd>
		<kbd class="px-1 py-0.5 rounded border border-[#e8e5e0] text-[10px]">&rarr;</kbd> to step
	</p>

	<div bind:this={chartWrapper} class="w-full mt-1"></div>
</div>
