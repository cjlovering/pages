<!--
  Fig 6: Behavioral vs probing convergence — dumbbell chart.
  data = [{ concept, behavioral, probing }]
-->
<script>
	import * as d3 from 'd3';
	import { theme, styleAxis } from './theme.js';

	let { data = [], height = 300 } = $props();

	let wrapper = $state();
	let w = $state(0);

	$effect(() => {
		if (!wrapper) return;
		const ro = new ResizeObserver(([e]) => { w = e.contentRect.width; });
		ro.observe(wrapper);
		return () => ro.disconnect();
	});

	$effect(() => {
		if (!wrapper || w === 0 || !data.length) return;
		render();
	});

	function render() {
		const svg = d3.select(wrapper).selectAll('svg').data([null]);
		const root = svg.enter().append('svg').merge(svg)
			.attr('width', w).attr('height', height)
			.attr('viewBox', `0 0 ${w} ${height}`)
			.style('overflow', 'visible');
		root.selectAll('*').remove();

		const m = { top: 30, right: 20, bottom: 44, left: 90 };
		const iw = w - m.left - m.right;
		const ih = height - m.top - m.bottom;
		const g = root.append('g').attr('transform', `translate(${m.left},${m.top})`);

		const labels = data.map(d => d.concept);
		const y = d3.scaleBand().domain(labels).range([0, ih]).padding(0.35);
		const x = d3.scaleLinear().domain([0, 20]).range([0, iw]);

		const xG = g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).ticks(10));
		styleAxis(xG, { orient: 'bottom' });

		const yG = g.append('g').call(d3.axisLeft(y));
		styleAxis(yG, { orient: 'left' });
		yG.selectAll('.tick text')
			.attr('fill', d => theme.conceptColors[d] ?? theme.ink[2])
			.attr('font-weight', theme.font.weight.medium);

		// Dumbbell lines + dots
		data.forEach(d => {
			const cy = y(d.concept) + y.bandwidth() / 2;
			const bx = d.behavioral != null ? x(d.behavioral) : null;
			const px = d.probing != null ? x(d.probing) : null;

			// Connector line
			if (bx != null && px != null) {
				g.append('line')
					.attr('x1', bx).attr('x2', px)
					.attr('y1', cy).attr('y2', cy)
					.attr('stroke', theme.ink[5]).attr('stroke-width', 1.5);
			}

			// Behavioral dot (filled)
			if (bx != null) {
				g.append('circle')
					.attr('cx', bx).attr('cy', cy)
					.attr('r', 5.5)
					.attr('fill', theme.conceptColors[d.concept])
					.attr('stroke', theme.surface.page).attr('stroke-width', 1.5);
			}

			// Probing dot (open)
			if (px != null) {
				g.append('circle')
					.attr('cx', px).attr('cy', cy)
					.attr('r', 5.5)
					.attr('fill', theme.surface.page)
					.attr('stroke', theme.conceptColors[d.concept]).attr('stroke-width', 2);
			}
		});

		// Axis labels
		root.append('text')
			.attr('x', m.left + iw / 2).attr('y', height - 4)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[3]).text('Checkpoint');

		// Legend
		const leg = root.append('g').attr('transform', `translate(${m.left + 4}, ${m.top - 18})`);

		leg.append('circle').attr('cx', 5).attr('cy', 5).attr('r', 4)
			.attr('fill', theme.ink[2]).attr('stroke', theme.surface.page).attr('stroke-width', 1.5);
		leg.append('text').attr('x', 14).attr('y', 9)
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.legend)
			.attr('fill', theme.ink[2]).text('Behavioral');

		leg.append('circle').attr('cx', 105).attr('cy', 5).attr('r', 4)
			.attr('fill', theme.surface.page).attr('stroke', theme.ink[2]).attr('stroke-width', 2);
		leg.append('text').attr('x', 114).attr('y', 9)
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.legend)
			.attr('fill', theme.ink[2]).text('Probing');
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
