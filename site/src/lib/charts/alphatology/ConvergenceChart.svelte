<!--
  Fig 6: Convergence timeline — multi-panel point plot.
  data = [{ concept, tool, metric, mean, sd }]

  Tools: behavioral (blue), probing (pink), structural (gold)
  Metrics: start (circle), converged (x-mark)
  Panels group concepts: internal | edge | ladder | negative | structural
-->
<script>
	import * as d3 from 'd3';
	import { theme, styleAxis } from './theme.js';

	let { data = [], height = 320 } = $props();

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

	const toolColors = {
		behavioral: { start: '#135ea0', converged: '#8dc3f2' },
		probing:    { start: '#b61651', converged: '#f18eb2' },
		structural: { start: '#b38600', converged: '#ffd24d' },
	};

	const panels = [
		{ concepts: ['trapezoid', 'bridge', 'crescent', 'span'], weight: 4 },
		{ concepts: ['edge'], weight: 1 },
		{ concepts: ['escape', 'bottleneck'], weight: 2 },
		{ concepts: ['dead', 'captured'], weight: 2 },
		{ concepts: ['structural'], weight: 1 },
	];

	function render() {
		const svg = d3.select(wrapper).selectAll('svg').data([null]);
		const root = svg.enter().append('svg').merge(svg)
			.attr('width', w).attr('height', height)
			.attr('viewBox', `0 0 ${w} ${height}`)
			.style('overflow', 'visible');
		root.selectAll('*').remove();

		const m = { top: 16, right: 12, bottom: 36, left: 48 };
		const legendW = 120;
		const totalW = w - m.left - m.right - legendW;
		const ih = height - m.top - m.bottom;
		const panelGap = 8;
		const totalWeight = panels.reduce((s, p) => s + p.weight, 0);
		const availW = totalW - panelGap * (panels.length - 1);

		const g = root.append('g').attr('transform', `translate(${m.left},${m.top})`);

		// Shared y-scale: checkpoint 0–20
		const y = d3.scaleLinear().domain([0, 20]).range([ih, 0]);

		// Y-axis (left, shared)
		const yG = g.append('g').call(
			d3.axisLeft(y).tickValues([0, 5, 10, 15, 20])
				.tickFormat(d => `${Math.round(d / 20 * 100)}%`)
		);
		styleAxis(yG, { orient: 'left' });

		// Y-axis label
		g.append('text')
			.attr('transform', `rotate(-90)`)
			.attr('x', -ih / 2).attr('y', -36)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans)
			.attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[3])
			.text('Training Progress');

		// Tool offsets within each concept position
		const toolList = ['behavioral', 'probing', 'structural'];
		const toolOffset = { behavioral: -0.15, probing: 0.15, structural: 0 };

		let panelX = 0;
		panels.forEach((panel, pi) => {
			const pw = (panel.weight / totalWeight) * availW;
			const pg = g.append('g').attr('transform', `translate(${panelX},0)`);

			const x = d3.scaleBand()
				.domain(panel.concepts)
				.range([0, pw])
				.padding(0.3);

			// X-axis
			const xG = pg.append('g')
				.attr('transform', `translate(0,${ih})`)
				.call(d3.axisBottom(x).tickSize(0));
			styleAxis(xG, { orient: 'bottom' });
			xG.select('.domain').remove();
			xG.selectAll('.tick text')
				.attr('font-size', theme.font.size.tick)
				.text(d => d === 'bottleneck' ? 'bottle.' : d);

			// Grid lines
			pg.append('g')
				.selectAll('line')
				.data([0, 5, 10, 15, 20])
				.join('line')
				.attr('x1', 0).attr('x2', pw)
				.attr('y1', d => y(d)).attr('y2', d => y(d))
				.attr('stroke', theme.border.default)
				.attr('stroke-width', 0.5)
				.attr('stroke-dasharray', '3,3');

			// Draw data points per concept
			panel.concepts.forEach(concept => {
				const cx = x(concept) + x.bandwidth() / 2;

				toolList.forEach(tool => {
					const startD = data.find(d => d.concept === concept && d.tool === tool && d.metric === 'start');
					const convD = data.find(d => d.concept === concept && d.tool === tool && d.metric === 'converged');
					if (!startD && !convD) return;

					const off = toolOffset[tool] * x.bandwidth();
					const px = cx + off;
					const colors = toolColors[tool];

					const sy = startD ? y(startD.mean) : null;
					const cy2 = convD ? y(convD.mean) : null;

					// Dashed connector line
					if (sy != null && cy2 != null) {
						pg.append('line')
							.attr('x1', px).attr('x2', px)
							.attr('y1', sy).attr('y2', cy2)
							.attr('stroke', '#aaa')
							.attr('stroke-width', 1)
							.attr('stroke-dasharray', '3,2');
					}

					// Error bars
					if (startD && startD.sd > 0) {
						pg.append('line')
							.attr('x1', px).attr('x2', px)
							.attr('y1', y(startD.mean - startD.sd))
							.attr('y2', y(startD.mean + startD.sd))
							.attr('stroke', colors.start)
							.attr('stroke-width', 1.5)
							.attr('opacity', 0.5);
					}
					if (convD && convD.sd > 0) {
						pg.append('line')
							.attr('x1', px).attr('x2', px)
							.attr('y1', y(convD.mean - convD.sd))
							.attr('y2', y(convD.mean + convD.sd))
							.attr('stroke', colors.converged)
							.attr('stroke-width', 1.5)
							.attr('opacity', 0.5);
					}

					// Start marker (filled circle)
					if (startD) {
						pg.append('circle')
							.attr('cx', px).attr('cy', sy)
							.attr('r', 4.5)
							.attr('fill', colors.start)
							.attr('stroke', theme.surface.page)
							.attr('stroke-width', 1);
					}

					// Converged marker (× cross)
					if (convD) {
						const s = 4;
						pg.append('line')
							.attr('x1', px - s).attr('x2', px + s)
							.attr('y1', cy2 - s).attr('y2', cy2 + s)
							.attr('stroke', colors.converged)
							.attr('stroke-width', 2);
						pg.append('line')
							.attr('x1', px - s).attr('x2', px + s)
							.attr('y1', cy2 + s).attr('y2', cy2 - s)
							.attr('stroke', colors.converged)
							.attr('stroke-width', 2);
					}
				});
			});

			panelX += pw + panelGap;
		});

		// Legend
		const leg = g.append('g')
			.attr('transform', `translate(${totalW + 16}, ${ih / 2 - 60})`);

		const legendItems = [
			{ label: 'behavioral: start', color: toolColors.behavioral.start, marker: 'circle' },
			{ label: 'converged', color: toolColors.behavioral.converged, marker: 'x' },
			{ label: 'probing: start', color: toolColors.probing.start, marker: 'circle' },
			{ label: 'converged', color: toolColors.probing.converged, marker: 'x' },
			{ label: 'structural: start', color: toolColors.structural.start, marker: 'circle' },
			{ label: 'converged', color: toolColors.structural.converged, marker: 'x' },
		];

		legendItems.forEach((item, i) => {
			const ly = i * 18;
			if (item.marker === 'circle') {
				leg.append('circle')
					.attr('cx', 5).attr('cy', ly)
					.attr('r', 4).attr('fill', item.color);
			} else {
				const s = 3.5;
				leg.append('line')
					.attr('x1', 5 - s).attr('x2', 5 + s)
					.attr('y1', ly - s).attr('y2', ly + s)
					.attr('stroke', item.color).attr('stroke-width', 2);
				leg.append('line')
					.attr('x1', 5 - s).attr('x2', 5 + s)
					.attr('y1', ly + s).attr('y2', ly - s)
					.attr('stroke', item.color).attr('stroke-width', 2);
			}
			leg.append('text')
				.attr('x', 16).attr('y', ly + 4)
				.attr('font-family', theme.font.sans)
				.attr('font-size', theme.font.size.legend)
				.attr('fill', theme.ink[2])
				.text(item.label);
		});
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
