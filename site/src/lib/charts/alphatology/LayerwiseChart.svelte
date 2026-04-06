<!--
  Fig 4b: Layerwise best-layer histogram.
  data = [{ condition, layer, count, percent }]
  Shows which network layer has highest probe accuracy, split by short/long-term.
-->
<script>
	import * as d3 from 'd3';
	import { theme, styleAxis } from './theme.js';

	let { data = [], height = 260 } = $props();

	const maxW = 380;

	let wrapper = $state();
	let w = $state(0);

	$effect(() => {
		if (!wrapper) return;
		const ro = new ResizeObserver(([e]) => { w = Math.min(e.contentRect.width, maxW); });
		ro.observe(wrapper);
		return () => ro.disconnect();
	});

	$effect(() => {
		if (!wrapper || w === 0 || !data.length) return;
		render();
	});

	const condColors = {
		'Long-term': '#1E88E5',
		'Short-term': '#D81B60',
	};

	function render() {
		const svg = d3.select(wrapper).selectAll('svg').data([null]);
		const root = svg.enter().append('svg').merge(svg)
			.attr('width', w).attr('height', height)
			.attr('viewBox', `0 0 ${w} ${height}`)
			.style('overflow', 'visible');
		root.selectAll('*').remove();

		const m = { top: 16, right: 16, bottom: 40, left: 52 };
		const iw = w - m.left - m.right;
		const ih = height - m.top - m.bottom;
		const g = root.append('g').attr('transform', `translate(${m.left},${m.top})`);

		// Hatching patterns
		const defs = root.append('defs');

		// Long-term: diagonal hatching
		const patLong = defs.append('pattern')
			.attr('id', 'hatch-long').attr('patternUnits', 'userSpaceOnUse')
			.attr('width', 6).attr('height', 6)
			.attr('patternTransform', 'rotate(45)');
		patLong.append('rect').attr('width', 6).attr('height', 6).attr('fill', condColors['Long-term']);
		patLong.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 6)
			.attr('stroke', 'rgba(255,255,255,0.35)').attr('stroke-width', 1.5);

		// Short-term: dot pattern
		const patShort = defs.append('pattern')
			.attr('id', 'hatch-short').attr('patternUnits', 'userSpaceOnUse')
			.attr('width', 6).attr('height', 6);
		patShort.append('rect').attr('width', 6).attr('height', 6).attr('fill', condColors['Short-term']);
		patShort.append('circle').attr('cx', 3).attr('cy', 3).attr('r', 1.2)
			.attr('fill', 'rgba(255,255,255,0.4)');

		const patternIds = { 'Long-term': 'url(#hatch-long)', 'Short-term': 'url(#hatch-short)' };

		const layers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
		const conditions = ['Long-term', 'Short-term'];

		const x = d3.scaleBand().domain(layers).range([0, iw]).padding(0.15);
		const y = d3.scaleLinear().domain([0, 50]).range([ih, 0]);

		// Grid
		g.selectAll('.grid-line').data(y.ticks(3)).join('line')
			.attr('x1', 0).attr('x2', iw)
			.attr('y1', d => y(d)).attr('y2', d => y(d))
			.attr('stroke', theme.border.default)
			.attr('stroke-width', 0.5)
			.attr('stroke-dasharray', '3,3');

		// X-axis
		const xG = g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x));
		styleAxis(xG, { orient: 'bottom' });
		g.append('text')
			.attr('x', iw / 2).attr('y', ih + 34)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans)
			.attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[3])
			.text('Layer with Highest Accuracy');

		// Y-axis
		const yG = g.append('g').call(d3.axisLeft(y).tickValues([5, 25, 50]).tickFormat(d => `${d}%`));
		styleAxis(yG, { orient: 'left' });
		g.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('x', -ih / 2).attr('y', -38)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans)
			.attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[3])
			.text('Percent of Probes');

		// Bars — grouped by condition within each layer
		const bw = x.bandwidth();
		const halfW = bw / 2 - 1;

		conditions.forEach((cond, ci) => {
			const items = data.filter(d => d.condition === cond);
			const color = condColors[cond];

			items.forEach(d => {
				if (d.percent === 0) return;
				const bx = x(d.layer) + ci * (halfW + 2);
				// Hatched bar
				g.append('rect')
					.attr('x', bx).attr('y', y(d.percent))
					.attr('width', halfW).attr('height', ih - y(d.percent))
					.attr('fill', patternIds[cond]).attr('rx', 1);
				// Border
				g.append('rect')
					.attr('x', bx).attr('y', y(d.percent))
					.attr('width', halfW).attr('height', ih - y(d.percent))
					.attr('fill', 'none').attr('stroke', color)
					.attr('stroke-width', 0.75).attr('rx', 1);
			});

			// KDE-like line
			const pts = items
				.map(d => ({ x: x(d.layer) + ci * (halfW + 2) + halfW / 2, y: y(d.percent) }));
			const nonZero = pts.filter((_, i) => items[i].percent > 0);
			if (nonZero.length > 1) {
				const line = d3.line().x(d => d.x).y(d => d.y).curve(d3.curveBasis);
				g.append('path')
					.attr('d', line(nonZero))
					.attr('fill', 'none')
					.attr('stroke', color)
					.attr('stroke-width', 2);
			}
		});

		// Legend with opaque background
		const legX = 4;
		const legY = 4;
		g.append('rect')
			.attr('x', legX - 4).attr('y', legY - 4)
			.attr('width', 106).attr('height', 40)
			.attr('fill', 'white').attr('stroke', theme.border.default)
			.attr('stroke-width', 0.5).attr('rx', 3);

		const leg = g.append('g').attr('transform', `translate(${legX}, ${legY})`);
		conditions.forEach((cond, i) => {
			const ly = i * 18;
			// Hatched swatch
			leg.append('rect').attr('y', ly).attr('width', 10).attr('height', 10)
				.attr('fill', patternIds[cond]).attr('rx', 1);
			leg.append('rect').attr('y', ly).attr('width', 10).attr('height', 10)
				.attr('fill', 'none').attr('stroke', condColors[cond])
				.attr('stroke-width', 0.75).attr('rx', 1);
			leg.append('text').attr('x', 14).attr('y', ly + 9)
				.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.legend)
				.attr('fill', theme.ink[2]).text(cond);
		});
	}
</script>

<div bind:this={wrapper} class="w-full mx-auto" style="max-width: {maxW}px;"></div>
