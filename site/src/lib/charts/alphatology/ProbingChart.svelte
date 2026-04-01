<!--
  Fig 4: Probing selectivity bar chart + best-layer dot overlay.
  Bars use a monochromatic blue gradient (darker = higher selectivity),
  styled after the Find article's bar charts.

  data = { selectivity: [{ concept, selectivity, std, bestLayer }], layerHistogram: [...] }
-->
<script>
	import * as d3 from 'd3';
	import { theme, styleAxis } from './theme.js';

	let { data = { selectivity: [], layerHistogram: [] }, height = 320 } = $props();

	let wrapper = $state();
	let w = $state(0);

	$effect(() => {
		if (!wrapper) return;
		const ro = new ResizeObserver(([e]) => { w = e.contentRect.width; });
		ro.observe(wrapper);
		return () => ro.disconnect();
	});

	$effect(() => {
		if (!wrapper || w === 0 || !data.selectivity.length) return;
		render();
	});

	// Blue gradient scale matching the Find article's bar style
	const barGradient = d3.scaleLinear()
		.domain([0, 0.25])
		.range(['#78bbe2', '#1a3a5c'])
		.clamp(true);

	function render() {
		const svg = d3.select(wrapper).selectAll('svg').data([null]);
		const root = svg.enter().append('svg').merge(svg)
			.attr('width', w).attr('height', height)
			.attr('viewBox', `0 0 ${w} ${height}`)
			.style('overflow', 'visible');
		root.selectAll('*').remove();

		const m = { top: 24, right: 80, bottom: 44, left: 52 };
		const iw = w - m.left - m.right;
		const ih = height - m.top - m.bottom;
		const g = root.append('g').attr('transform', `translate(${m.left},${m.top})`);

		const items = data.selectivity;
		const labels = items.map(d => d.concept);
		const maxVal = d3.max(items, d => d.selectivity + d.std) * 1.1;

		const x = d3.scaleBand().domain(labels).range([0, iw]).padding(0.25);
		const y = d3.scaleLinear().domain([0, maxVal]).nice().range([ih, 0]);
		const yLayer = d3.scaleLinear().domain([0, 9]).range([ih, 0]);

		// Axes
		const xG = g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x));
		styleAxis(xG, { orient: 'bottom' });
		xG.selectAll('.tick text')
			.attr('font-size', 10)
			.attr('transform', 'rotate(-35)')
			.attr('text-anchor', 'end')
			.attr('dx', '-0.4em')
			.attr('dy', '0.4em');

		const yG = g.append('g').call(d3.axisLeft(y).ticks(5));
		styleAxis(yG, { grid: true, width: iw, height: ih, orient: 'left' });

		const yLayerG = g.append('g')
			.attr('transform', `translate(${iw},0)`)
			.call(d3.axisRight(yLayer).ticks(10).tickFormat(d => `L${d}`));
		styleAxis(yLayerG, { orient: 'right' });

		// Bars — monochromatic blue gradient by selectivity value
		g.selectAll('.bar').data(items).enter().append('rect')
			.attr('class', 'bar')
			.attr('x', d => x(d.concept))
			.attr('y', d => y(d.selectivity))
			.attr('width', x.bandwidth())
			.attr('height', d => ih - y(d.selectivity))
			.attr('fill', d => barGradient(d.selectivity))
			.attr('rx', 1);

		// Error bars
		const capW = Math.min(8, x.bandwidth() * 0.3);
		items.forEach(d => {
			const cx = x(d.concept) + x.bandwidth() / 2;
			const yTop = y(d.selectivity + d.std);
			const yBot = y(Math.max(0, d.selectivity - d.std));
			g.append('line').attr('x1', cx).attr('x2', cx).attr('y1', yTop).attr('y2', yBot)
				.attr('stroke', theme.ink[2]).attr('stroke-width', 1.2);
			g.append('line').attr('x1', cx - capW).attr('x2', cx + capW).attr('y1', yTop).attr('y2', yTop)
				.attr('stroke', theme.ink[2]).attr('stroke-width', 1.2);
		});

		// Best-layer dots (right y-axis)
		g.selectAll('.layer-dot').data(items).enter().append('circle')
			.attr('class', 'layer-dot')
			.attr('cx', d => x(d.concept) + x.bandwidth() / 2)
			.attr('cy', d => yLayer(d.bestLayer))
			.attr('r', 5)
			.attr('fill', '#AD2111')
			.attr('stroke', theme.surface.page)
			.attr('stroke-width', 1.5);

		// Y labels
		root.append('text')
			.attr('transform', `translate(14,${m.top + ih / 2}) rotate(-90)`)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[3]).text('Selectivity');

		root.append('text')
			.attr('transform', `translate(${w - 6},${m.top + ih / 2}) rotate(90)`)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[3]).text('Best layer');

		// Legend
		const leg = root.append('g').attr('transform', `translate(${m.left + 8}, ${m.top + 4})`);
		leg.append('rect').attr('width', 10).attr('height', 10).attr('rx', 1)
			.attr('fill', '#3672a4');
		leg.append('text').attr('x', 14).attr('y', 9)
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.legend)
			.attr('fill', theme.ink[2]).text('Selectivity');

		const leg2 = root.append('g').attr('transform', `translate(${m.left + 100}, ${m.top + 4})`);
		leg2.append('circle').attr('cx', 5).attr('cy', 5).attr('r', 4)
			.attr('fill', '#AD2111').attr('stroke', theme.surface.page).attr('stroke-width', 1.5);
		leg2.append('text').attr('x', 14).attr('y', 9)
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.legend)
			.attr('fill', theme.ink[2]).text('Best layer');
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
