<!--
  Fig 5b: Negative concept learning curves (dead + captured).
  data = { dead: [{x,y}], captured: [{x,y}] }
-->
<script>
	import * as d3 from 'd3';
	import { theme, styleAxis } from './theme.js';

	let { data = {}, height = 240 } = $props();

	let wrapper = $state();
	let w = $state(0);

	$effect(() => {
		if (!wrapper) return;
		const ro = new ResizeObserver(([e]) => { w = e.contentRect.width; });
		ro.observe(wrapper);
		return () => ro.disconnect();
	});

	$effect(() => {
		if (!wrapper || w === 0 || !Object.keys(data).length) return;
		render();
	});

	function render() {
		const svg = d3.select(wrapper).selectAll('svg').data([null]);
		const root = svg.enter().append('svg').merge(svg)
			.attr('width', w).attr('height', height)
			.attr('viewBox', `0 0 ${w} ${height}`)
			.style('overflow', 'visible');
		root.selectAll('*').remove();

		const m = { ...theme.margin };
		const iw = w - m.left - m.right;
		const ih = height - m.top - m.bottom;
		const g = root.append('g').attr('transform', `translate(${m.left},${m.top})`);

		const x = d3.scaleLinear().domain([0, 20]).range([0, iw]);
		const y = d3.scaleLinear().domain([0, 1]).nice().range([ih, 0]);

		const xG = g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).ticks(10));
		styleAxis(xG, { orient: 'bottom' });

		const yG = g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.0%')));
		styleAxis(yG, { grid: true, width: iw, height: ih, orient: 'left' });

		const line = d3.line().x(d => x(d.x)).y(d => y(d.y)).curve(d3.curveMonotoneX);

		// ~25% reference line
		g.append('line')
			.attr('x1', 0).attr('x2', iw)
			.attr('y1', y(0.75)).attr('y2', y(0.75))
			.attr('stroke', theme.ink[5]).attr('stroke-width', 1)
			.attr('stroke-dasharray', '6,4');
		g.append('text')
			.attr('x', iw - 2).attr('y', y(0.75) - 4)
			.attr('text-anchor', 'end')
			.attr('font-family', theme.font.sans).attr('font-size', 10)
			.attr('fill', theme.ink[4])
			.text('~25% wasted moves');

		const negColors = { dead: '#1a3a5c', captured: '#3d8ec9' };

		for (const [concept, pts] of Object.entries(data)) {
			const color = negColors[concept] ?? theme.ink[2];
			const area = d3.area().x(d => x(d.x)).y0(ih).y1(d => y(d.y)).curve(d3.curveMonotoneX);
			g.append('path').datum(pts).attr('d', area)
				.attr('fill', color).attr('opacity', 0.08);
			g.append('path').datum(pts).attr('d', line)
				.attr('fill', 'none')
				.attr('stroke', color)
				.attr('stroke-width', 2);

			// End label
			const last = pts[pts.length - 1];
			g.append('text')
				.attr('x', x(last.x) + 4).attr('y', y(last.y) + 4)
				.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.annotation)
				.attr('fill', color)
				.text(concept);
		}

		// Axis labels
		root.append('text')
			.attr('x', m.left + iw / 2).attr('y', height - 4)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[3]).text('Checkpoint');

		root.append('text')
			.attr('transform', `translate(14,${m.top + ih / 2}) rotate(-90)`)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[3]).text('Pass rate');
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
