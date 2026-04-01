<!--
  Fig 5a: Small-multiple learning curves for positive concepts.
  data = { bridge: { mcts: [{x,y}], policy: [{x,y}] }, ... }
-->
<script>
	import * as d3 from 'd3';
	import { theme, styleAxis } from './theme.js';

	let { data = {}, height = 520, concepts = [] } = $props();

	let wrapper = $state();
	let w = $state(0);

	$effect(() => {
		if (!wrapper) return;
		const ro = new ResizeObserver(([e]) => { w = e.contentRect.width; });
		ro.observe(wrapper);
		return () => ro.disconnect();
	});

	$effect(() => {
		if (!wrapper || w === 0 || !concepts.length) return;
		render();
	});

	function render() {
		const n = concepts.length;
		const cols = Math.min(4, n);
		const rows = Math.ceil(n / cols);
		const pad = 12;
		const cellW = (w - pad * (cols - 1)) / cols;
		const cellH = (height - pad * (rows - 1) - 40) / rows; // 40 for legend
		const totalH = rows * cellH + (rows - 1) * pad + 40;

		const svg = d3.select(wrapper).selectAll('svg').data([null]);
		const root = svg.enter().append('svg').merge(svg)
			.attr('width', w).attr('height', totalH)
			.attr('viewBox', `0 0 ${w} ${totalH}`)
			.style('overflow', 'visible');
		root.selectAll('*').remove();

		const m = { top: 20, right: 8, bottom: 24, left: 32 };

		concepts.forEach((concept, i) => {
			const col = i % cols;
			const row = Math.floor(i / cols);
			const ox = col * (cellW + pad);
			const oy = 30 + row * (cellH + pad); // 30 for legend space

			const g = root.append('g').attr('transform', `translate(${ox},${oy})`);
			const iw = cellW - m.left - m.right;
			const ih = cellH - m.top - m.bottom;
			const inner = g.append('g').attr('transform', `translate(${m.left},${m.top})`);

			const cd = data[concept];
			if (!cd) return;

			const x = d3.scaleLinear().domain([0, 20]).range([0, iw]);
			const y = d3.scaleLinear().domain([0, 1]).range([ih, 0]);

			// Axes
			const xTicks = row === rows - 1 ? 5 : 0;
			const xG = inner.append('g').attr('transform', `translate(0,${ih})`)
				.call(d3.axisBottom(x).ticks(xTicks).tickSize(row === rows - 1 ? 3 : 0));
			styleAxis(xG, { orient: 'bottom' });
			if (row < rows - 1) xG.selectAll('.tick text').remove();

			const yTicks = col === 0 ? 3 : 0;
			const yG = inner.append('g')
				.call(d3.axisLeft(y).ticks(yTicks).tickSize(col === 0 ? 3 : 0));
			styleAxis(yG, { grid: true, width: iw, height: ih, orient: 'left' });
			if (col > 0) yG.selectAll('.tick text').remove();

			// Lines
			const line = d3.line().x(d => x(d.x)).y(d => y(d.y)).curve(d3.curveMonotoneX);

			// MCTS area
			const area = d3.area().x(d => x(d.x)).y0(ih).y1(d => y(d.y)).curve(d3.curveMonotoneX);
			inner.append('path').datum(cd.mcts).attr('d', area)
				.attr('fill', theme.seriesColors.mcts).attr('opacity', 0.08);

			// MCTS line
			inner.append('path').datum(cd.mcts).attr('d', line)
				.attr('fill', 'none').attr('stroke', theme.seriesColors.mcts)
				.attr('stroke-width', 1.8);

			// Policy line
			inner.append('path').datum(cd.policy).attr('d', line)
				.attr('fill', 'none').attr('stroke', theme.seriesColors.policy)
				.attr('stroke-width', 1.8)
				.attr('stroke-dasharray', '4,3');

			// Title
			g.append('text')
				.attr('x', m.left + iw / 2).attr('y', m.top - 6)
				.attr('text-anchor', 'middle')
				.attr('font-family', theme.font.sans).attr('font-size', 11)
				.attr('font-weight', theme.font.weight.medium)
				.attr('fill', theme.conceptColors[concept] ?? theme.ink[0])
				.text(concept);
		});

		// Legend at top
		const leg = root.append('g').attr('transform', `translate(${w / 2 - 100}, 8)`);
		// MCTS
		leg.append('line').attr('x1', 0).attr('x2', 18).attr('y1', 6).attr('y2', 6)
			.attr('stroke', theme.seriesColors.mcts).attr('stroke-width', 2);
		leg.append('text').attr('x', 22).attr('y', 10)
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.legend)
			.attr('fill', theme.ink[2]).text('MCTS');
		// Policy
		leg.append('line').attr('x1', 70).attr('x2', 88).attr('y1', 6).attr('y2', 6)
			.attr('stroke', theme.seriesColors.policy).attr('stroke-width', 2)
			.attr('stroke-dasharray', '4,3');
		leg.append('text').attr('x', 92).attr('y', 10)
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.legend)
			.attr('fill', theme.ink[2]).text('Policy network');
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
