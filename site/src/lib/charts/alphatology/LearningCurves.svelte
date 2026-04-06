<!--
  Fig 5a: Small-multiple learning curves for positive concepts.
  data = { bridge: { mcts_passing: [{x,y}], mcts_z1: [{x,y}], policy_passing: [{x,y}] }, ... }
-->
<script>
	import * as d3 from 'd3';
	import { theme, styleAxis } from './theme.js';

	let { data = {}, height = 520, concepts = [] } = $props();

	let wrapper = $state();
	let w = $state(0);

	// Original paper colors (colorblind-safe)
	const metricStyles = {
		mcts_z1:        { color: '#1E88E5', label: 'MCTS Z > 1',     dash: null,    marker: 'circle' },
		mcts_passing:   { color: '#FFC107', label: 'MCTS passing',    dash: null,    marker: 'square' },
		policy_passing: { color: '#D81B60', label: 'Policy passing',  dash: '5,3',   marker: 'triangle' },
	};
	const metricKeys = ['mcts_z1', 'mcts_passing', 'policy_passing'];

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
		const cellH = (height - pad * (rows - 1) - 40) / rows;
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
			const oy = 30 + row * (cellH + pad);

			const g = root.append('g').attr('transform', `translate(${ox},${oy})`);
			const iw = cellW - m.left - m.right;
			const ih = cellH - m.top - m.bottom;
			const inner = g.append('g').attr('transform', `translate(${m.left},${m.top})`);

			const cd = data[concept];
			if (!cd) return;

			const x = d3.scaleLinear().domain([0, 20]).range([0, iw]);
			const y = d3.scaleLinear().domain([0, 1.05]).range([ih, 0]);

			// Axes
			const xTicks = row === rows - 1 ? [0, 10, 19] : [];
			const xG = inner.append('g').attr('transform', `translate(0,${ih})`)
				.call(d3.axisBottom(x)
					.tickValues(row === rows - 1 ? [0, 10, 19] : [])
					.tickSize(row === rows - 1 ? 3 : 0)
					.tickFormat(d => d === 0 ? '5%' : d === 10 ? '50%' : '100%'));
			styleAxis(xG, { orient: 'bottom' });
			if (row < rows - 1) xG.selectAll('.tick text').remove();

			const yG = inner.append('g')
				.call(d3.axisLeft(y).ticks(col === 0 ? 3 : 0).tickSize(col === 0 ? 3 : 0));
			styleAxis(yG, { grid: true, width: iw, height: ih, orient: 'left' });
			if (col > 0) yG.selectAll('.tick text').remove();

			// Lines + markers for each metric
			const line = d3.line().x(d => x(d.x)).y(d => y(d.y)).curve(d3.curveMonotoneX);

			for (const key of metricKeys) {
				const pts = cd[key];
				if (!pts) continue;
				const style = metricStyles[key];

				// Line
				const path = inner.append('path').datum(pts).attr('d', line)
					.attr('fill', 'none')
					.attr('stroke', style.color)
					.attr('stroke-width', 1.8);
				if (style.dash) path.attr('stroke-dasharray', style.dash);

				// Markers
				const markerSize = 2.2;
				pts.forEach(d => {
					const cx = x(d.x), cy = y(d.y);
					if (style.marker === 'circle') {
						inner.append('circle')
							.attr('cx', cx).attr('cy', cy).attr('r', markerSize)
							.attr('fill', style.color);
					} else if (style.marker === 'square') {
						inner.append('rect')
							.attr('x', cx - markerSize).attr('y', cy - markerSize)
							.attr('width', markerSize * 2).attr('height', markerSize * 2)
							.attr('fill', style.color);
					} else if (style.marker === 'triangle') {
						const s = markerSize * 1.3;
						inner.append('path')
							.attr('d', `M${cx},${cy - s}L${cx - s},${cy + s}L${cx + s},${cy + s}Z`)
							.attr('fill', style.color);
					}
				});
			}

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
		const leg = root.append('g').attr('transform', `translate(${w / 2 - 150}, 8)`);
		let lx = 0;
		for (const key of metricKeys) {
			const style = metricStyles[key];
			// Line sample
			leg.append('line').attr('x1', lx).attr('x2', lx + 18).attr('y1', 6).attr('y2', 6)
				.attr('stroke', style.color).attr('stroke-width', 2)
				.attr('stroke-dasharray', style.dash);
			// Marker sample
			if (style.marker === 'circle') {
				leg.append('circle').attr('cx', lx + 9).attr('cy', 6).attr('r', 2.5)
					.attr('fill', style.color);
			} else if (style.marker === 'square') {
				leg.append('rect').attr('x', lx + 6.5).attr('y', 3.5).attr('width', 5).attr('height', 5)
					.attr('fill', style.color);
			} else if (style.marker === 'triangle') {
				leg.append('path').attr('d', `M${lx + 9},${3}L${lx + 6},${9}L${lx + 12},${9}Z`)
					.attr('fill', style.color);
			}
			leg.append('text').attr('x', lx + 22).attr('y', 10)
				.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.legend)
				.attr('fill', theme.ink[2]).text(style.label);
			lx += style.label.length * 7 + 32;
		}
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
