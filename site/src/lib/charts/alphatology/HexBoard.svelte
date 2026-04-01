<!--
  D3-rendered hex board with nearest-neighbor arrows.
  Arrows to true neighbors have opacity proportional to the overlap score;
  noise arrows to random non-neighbors fill the remaining "budget".

  cellData = { overlap: { "0": [81 floats], ... }, ndcg: { "0": [81 floats], ... } }
-->
<script>
	import * as d3 from 'd3';
	import { theme, styleAxis } from './theme.js';

	let {
		cellData = null,
		size = 400,
	} = $props();

	const BOARD = 9;
	const TOTAL = BOARD * BOARD; // 81

	let wrapper = $state();
	let chartWrapper = $state();
	let w = $state(0);
	let checkpoint = $state(0);
	let playing = $state(true);

	// Sorted checkpoint keys (numeric order)
	let checkpoints = $derived(
		cellData ? Object.keys(cellData.overlap).map(Number).sort((a, b) => a - b) : []
	);

	$effect(() => {
		if (!wrapper) return;
		const ro = new ResizeObserver(([e]) => { w = e.contentRect.width; });
		ro.observe(wrapper);
		return () => ro.disconnect();
	});

	// Auto-play timer
	$effect(() => {
		if (playing && checkpoints.length > 1) {
			const id = setInterval(() => {
				const idx = checkpoints.indexOf(checkpoint);
				checkpoint = checkpoints[(idx + 1) % checkpoints.length];
			}, 1200);
			return () => clearInterval(id);
		}
	});

	// Render hex board whenever checkpoint or width changes
	$effect(() => {
		if (!wrapper || w === 0 || !cellData) return;
		const _ = checkpoint;
		renderBoard();
	});

	// Render NDCG chart
	$effect(() => {
		if (!chartWrapper || w === 0 || !cellData) return;
		const _ = checkpoint;
		renderChart();
	});

	// ── Hex geometry ──
	// Offset coordinates: row = i / 9, col = i % 9
	// Pointy-top hex with offset rows shifted right
	function cellPos(i) {
		const row = Math.floor(i / BOARD);
		const col = i % BOARD;
		return { row, col };
	}

	function hexCenter(row, col, r) {
		// Pointy-top hex, odd-row offset (shifted right)
		const x = r * Math.sqrt(3) * (col + (row % 2 === 1 ? 0.5 : 0));
		const y = r * 1.5 * row;
		return { x, y };
	}

	// True hexagonal neighbors for a cell
	function trueNeighbors(row, col) {
		const even = row % 2 === 0;
		const offsets = even
			? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
			: [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
		const result = [];
		for (const [dr, dc] of offsets) {
			const nr = row + dr;
			const nc = col + dc;
			if (nr >= 0 && nr < BOARD && nc >= 0 && nc < BOARD) {
				result.push(nr * BOARD + nc);
			}
		}
		return result;
	}

	// Precompute neighbor lists and a few random non-neighbors per cell
	const neighborMap = [];
	const nonNeighborSample = [];
	const rng = d3.randomLcg(42);

	for (let i = 0; i < TOTAL; i++) {
		const { row, col } = cellPos(i);
		const nb = trueNeighbors(row, col);
		neighborMap.push(nb);

		// Pick some random non-neighbors for noise arrows
		const nbSet = new Set(nb);
		nbSet.add(i);
		const candidates = [];
		for (let j = 0; j < TOTAL; j++) {
			if (!nbSet.has(j)) candidates.push(j);
		}
		// Shuffle deterministically and pick up to 4
		const shuffled = candidates.slice().sort(() => rng() - 0.5);
		nonNeighborSample.push(shuffled.slice(0, 4));
	}

	function renderBoard() {
		const svgSize = Math.min(size, w);
		const pad = 20;
		const r = (svgSize - 2 * pad) / (BOARD * 1.8);

		// Compute all centers
		const centers = [];
		for (let i = 0; i < TOTAL; i++) {
			const { row, col } = cellPos(i);
			centers.push(hexCenter(row, col, r));
		}
		// Center the board
		const xs = centers.map(c => c.x);
		const ys = centers.map(c => c.y);
		const xMin = Math.min(...xs), xMax = Math.max(...xs);
		const yMin = Math.min(...ys), yMax = Math.max(...ys);
		const ox = (svgSize - (xMax - xMin)) / 2 - xMin;
		const oy = (svgSize - (yMax - yMin)) / 2 - yMin;

		const overlap = cellData.overlap[String(checkpoint)] ?? new Array(TOTAL).fill(0);

		const svg = d3.select(wrapper).select('.hex-svg');
		let root = svg.selectAll('svg').data([null]);
		root = root.enter().append('svg').merge(root)
			.attr('width', svgSize).attr('height', svgSize)
			.attr('viewBox', `0 0 ${svgSize} ${svgSize}`);
		root.selectAll('*').remove();

		const g = root.append('g').attr('transform', `translate(${ox},${oy})`);

		// Arrow marker
		const defs = root.append('defs');
		defs.append('marker')
			.attr('id', 'arrow-true')
			.attr('viewBox', '0 0 6 6')
			.attr('refX', 5).attr('refY', 3)
			.attr('markerWidth', 4).attr('markerHeight', 4)
			.attr('orient', 'auto')
			.append('path').attr('d', 'M0,0 L6,3 L0,6 Z')
			.attr('fill', theme.ink[1]);

		defs.append('marker')
			.attr('id', 'arrow-noise')
			.attr('viewBox', '0 0 6 6')
			.attr('refX', 5).attr('refY', 3)
			.attr('markerWidth', 3).attr('markerHeight', 3)
			.attr('orient', 'auto')
			.append('path').attr('d', 'M0,0 L6,3 L0,6 Z')
			.attr('fill', theme.ink[5]);

		const nodeR = r * 0.32;

		// Draw arrows
		for (let i = 0; i < TOTAL; i++) {
			const ov = overlap[i];
			const from = centers[i];

			// True-neighbor arrows (opacity = overlap)
			if (ov > 0) {
				for (const nb of neighborMap[i]) {
					const to = centers[nb];
					const dx = to.x - from.x;
					const dy = to.y - from.y;
					const dist = Math.sqrt(dx * dx + dy * dy);
					const ux = dx / dist, uy = dy / dist;
					g.append('line')
						.attr('x1', from.x + ux * nodeR)
						.attr('y1', from.y + uy * nodeR)
						.attr('x2', to.x - ux * nodeR)
						.attr('y2', to.y - uy * nodeR)
						.attr('stroke', theme.ink[1])
						.attr('stroke-width', 0.8)
						.attr('opacity', ov * 0.7)
						.attr('marker-end', 'url(#arrow-true)');
				}
			}

			// Noise arrows (opacity = 1 - overlap, fading as board learns)
			const noiseOp = (1 - ov) * 0.25;
			if (noiseOp > 0.02) {
				for (const nb of nonNeighborSample[i]) {
					const to = centers[nb];
					const dx = to.x - from.x;
					const dy = to.y - from.y;
					const dist = Math.sqrt(dx * dx + dy * dy);
					const ux = dx / dist, uy = dy / dist;
					g.append('line')
						.attr('x1', from.x + ux * nodeR)
						.attr('y1', from.y + uy * nodeR)
						.attr('x2', to.x - ux * (nodeR + 2))
						.attr('y2', to.y - uy * (nodeR + 2))
						.attr('stroke', theme.ink[5])
						.attr('stroke-width', 0.5)
						.attr('opacity', noiseOp)
						.attr('marker-end', 'url(#arrow-noise)');
				}
			}
		}

		// Draw cells on top
		for (let i = 0; i < TOTAL; i++) {
			const c = centers[i];
			const ov = overlap[i];
			g.append('circle')
				.attr('cx', c.x).attr('cy', c.y)
				.attr('r', nodeR)
				.attr('fill', d3.interpolateRgb('#e8e5e0', '#AD2111')(ov))
				.attr('stroke', theme.ink[4])
				.attr('stroke-width', 0.5);
		}

		// Checkpoint label
		root.append('text')
			.attr('x', svgSize / 2).attr('y', 16)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans)
			.attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[2])
			.text(`Checkpoint ${checkpoint} / ${checkpoints[checkpoints.length - 1]}`);
	}

	function renderChart() {
		const chartH = 120;
		const m = { top: 12, right: 20, bottom: 28, left: 52 };
		const iw = w - m.left - m.right;
		const ih = chartH - m.top - m.bottom;

		// Compute mean overlap per checkpoint
		const meanOverlap = checkpoints.map(ck => {
			const vals = cellData.overlap[String(ck)];
			return { x: ck, y: d3.mean(vals) };
		});
		const meanNdcg = checkpoints.map(ck => {
			const vals = cellData.ndcg[String(ck)];
			return { x: ck, y: d3.mean(vals) };
		});

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

		// Overlap line
		const area = d3.area().x(d => x(d.x)).y0(ih).y1(d => y(d.y)).curve(d3.curveMonotoneX);
		g.append('path').datum(meanOverlap).attr('d', area)
			.attr('fill', theme.conceptColors.bridge).attr('opacity', 0.08);
		g.append('path').datum(meanOverlap).attr('d', line)
			.attr('fill', 'none').attr('stroke', theme.conceptColors.bridge).attr('stroke-width', 1.8);

		// NDCG line
		g.append('path').datum(meanNdcg).attr('d', line)
			.attr('fill', 'none').attr('stroke', theme.conceptColors.edge)
			.attr('stroke-width', 1.8).attr('stroke-dasharray', '4,3');

		// Playhead
		const px = x(checkpoint);
		g.append('line')
			.attr('x1', px).attr('x2', px).attr('y1', 0).attr('y2', ih)
			.attr('stroke', theme.ink[0]).attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '4,3');

		// Dots at playhead
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

		// X label
		root.append('text')
			.attr('x', m.left + iw / 2).attr('y', chartH - 2)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[3]).text('Checkpoint');
	}

	function togglePlay() { playing = !playing; }
	function goTo(ck) { checkpoint = ck; playing = false; }
</script>

<div bind:this={wrapper} class="w-full">
	<div class="hex-svg mx-auto" style="width: {Math.min(size, w)}px;"></div>

	<!-- Controls -->
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
