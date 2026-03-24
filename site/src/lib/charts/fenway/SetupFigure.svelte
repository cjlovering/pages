<!--
  Three-panel bar chart: Setup | Ideal | GPT-4o Outputs
  Recreates Figure 1 from the paper.
-->
<script>
	import * as d3 from 'd3';
	import { theme } from './theme.js';

	const blue = '#3b82f6';
	const red = '#ef4444';

	const panels = [
		{
			title: 'Setup',
			yLabel: 'Numeric Context',
			bars: [
				{ label: 'blue', value: 98, color: blue },
				{ label: 'red', value: 99, color: red }
			],
			domain: [0, 110],
			format: (v) => v
		},
		{
			title: '\u201CIdeal\u201D',
			bars: [
				{ label: 'blue', value: 49.7, color: blue },
				{ label: 'red', value: 50.2, color: red }
			],
			domain: [0, 100],
			format: (v) => `${v}%`
		},
		{
			title: 'GPT-4o Outputs',
			bars: [
				{ label: 'blue', value: 0.2, color: blue },
				{ label: 'red', value: 99.7, color: red }
			],
			domain: [0, 100],
			format: (v) => `${v}%`
		}
	];

	let wrapper = $state();
	let w = $state(0);

	$effect(() => {
		if (!wrapper) return;
		const ro = new ResizeObserver(([e]) => { w = e.contentRect.width; });
		ro.observe(wrapper);
		return () => ro.disconnect();
	});

	$effect(() => {
		if (!wrapper || w === 0) return;
		render();
	});

	function render() {
		const height = 160;
		const gap = 16;
		const panelW = (w - gap * 2) / 3;
		const m = { top: 40, right: 8, bottom: 28, left: 8 };

		const svg = d3.select(wrapper).selectAll('svg').data([null]);
		const root = svg.enter().append('svg').merge(svg)
			.attr('width', w).attr('height', height)
			.attr('viewBox', `0 0 ${w} ${height}`)
			.style('overflow', 'visible');

		root.selectAll('*').remove();

		panels.forEach((panel, pi) => {
			const ox = pi * (panelW + gap);
			const g = root.append('g').attr('transform', `translate(${ox},0)`);

			// Panel border
			g.append('rect')
				.attr('x', 0).attr('y', 0)
				.attr('width', panelW).attr('height', height)
				.attr('fill', 'none')
				.attr('stroke', theme.border.default)
				.attr('stroke-width', 1)
				.attr('rx', 3);

			const iw = panelW - m.left - m.right;
			const ih = height - m.top - m.bottom;
			const inner = g.append('g').attr('transform', `translate(${m.left},${m.top})`);

			// Title
			g.append('text')
				.attr('x', panelW / 2).attr('y', 16)
				.attr('text-anchor', 'middle')
				.attr('font-family', theme.font.serif).attr('font-size', 13)
				.attr('font-weight', theme.font.weight.medium)
				.attr('fill', theme.ink[0])
				.text(panel.title);

			// Scales
			const x = d3.scaleBand().domain(panel.bars.map((b) => b.label)).range([0, iw]).padding(0.3);
			const y = d3.scaleLinear().domain(panel.domain).range([ih, 0]);

			// Bars
			panel.bars.forEach((bar) => {
				inner.append('rect')
					.attr('x', x(bar.label))
					.attr('y', y(bar.value))
					.attr('width', x.bandwidth())
					.attr('height', ih - y(bar.value))
					.attr('fill', bar.color)
					.attr('rx', 1);

				// Value label
				inner.append('text')
					.attr('x', x(bar.label) + x.bandwidth() / 2)
					.attr('y', y(bar.value) - 4)
					.attr('text-anchor', 'middle')
					.attr('font-family', theme.font.sans).attr('font-size', 11)
					.attr('font-weight', theme.font.weight.medium)
					.attr('fill', theme.ink[1])
					.text(panel.format(bar.value));

				// Color label below bar
				inner.append('text')
					.attr('x', x(bar.label) + x.bandwidth() / 2)
					.attr('y', ih + 14)
					.attr('text-anchor', 'middle')
					.attr('font-family', theme.font.sans).attr('font-size', 10)
					.attr('fill', theme.ink[3])
					.text(bar.label);
			});
		});
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
