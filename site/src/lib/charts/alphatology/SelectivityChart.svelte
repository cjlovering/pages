<!--
  Fig 4a: Probing selectivity — two-panel bar chart (long-term | short-term).
  Colored bars = probe accuracy (behind); grey bars = selectivity baseline (overlaid).
  data = [{ concept, condition, accuracy, accuracy_sd, baseline, baseline_sd }]
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

	const condColors = {
		'long-term': '#1E88E5',
		'short-term': '#D81B60',
	};

	const panels = [
		{
			label: 'Long-term',
			condition: 'long-term',
			concepts: ['bridge', 'crescent', 'trapezoid', 'span', 'dead', 'captured'],
		},
		{
			label: 'Short-term',
			condition: 'short-term',
			concepts: ['bridge', 'crescent', 'trapezoid', 'span', 'edge', 'escape', 'bottleneck'],
		},
	];

	function render() {
		const svg = d3.select(wrapper).selectAll('svg').data([null]);
		const root = svg.enter().append('svg').merge(svg)
			.attr('width', w).attr('height', height)
			.attr('viewBox', `0 0 ${w} ${height}`)
			.style('overflow', 'visible');
		root.selectAll('*').remove();

		const m = { top: 16, right: 12, bottom: 52, left: 40 };
		const gap = 24;
		const totalW = w - m.left - m.right - gap;
		const ih = height - m.top - m.bottom;

		// Hatching patterns
		const defs = root.append('defs');

		// Long-term: diagonal hatching
		const patLong = defs.append('pattern')
			.attr('id', 'sel-hatch-long').attr('patternUnits', 'userSpaceOnUse')
			.attr('width', 6).attr('height', 6)
			.attr('patternTransform', 'rotate(45)');
		patLong.append('rect').attr('width', 6).attr('height', 6).attr('fill', condColors['long-term']);
		patLong.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 6)
			.attr('stroke', 'rgba(255,255,255,0.35)').attr('stroke-width', 1.5);

		// Short-term: dot pattern
		const patShort = defs.append('pattern')
			.attr('id', 'sel-hatch-short').attr('patternUnits', 'userSpaceOnUse')
			.attr('width', 6).attr('height', 6);
		patShort.append('rect').attr('width', 6).attr('height', 6).attr('fill', condColors['short-term']);
		patShort.append('circle').attr('cx', 3).attr('cy', 3).attr('r', 1.2)
			.attr('fill', 'rgba(255,255,255,0.4)');

		// Baseline: crosshatch
		const patBase = defs.append('pattern')
			.attr('id', 'sel-hatch-base').attr('patternUnits', 'userSpaceOnUse')
			.attr('width', 6).attr('height', 6);
		patBase.append('rect').attr('width', 6).attr('height', 6).attr('fill', '#ccc');
		patBase.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 6).attr('y2', 6)
			.attr('stroke', 'rgba(255,255,255,0.35)').attr('stroke-width', 1);
		patBase.append('line').attr('x1', 6).attr('y1', 0).attr('x2', 0).attr('y2', 6)
			.attr('stroke', 'rgba(255,255,255,0.35)').attr('stroke-width', 1);

		const condPatterns = {
			'long-term': 'url(#sel-hatch-long)',
			'short-term': 'url(#sel-hatch-short)',
		};

		panels.forEach((panel, pi) => {
			const pw = totalW * (pi === 0 ? 6 / 13 : 7 / 13);
			const px = m.left + (pi === 0 ? 0 : totalW * 6 / 13 + gap);
			const g = root.append('g').attr('transform', `translate(${px},${m.top})`);

			const items = data.filter(d => d.condition === panel.condition);
			const x = d3.scaleBand().domain(panel.concepts).range([0, pw]).padding(0.3);
			const y = d3.scaleLinear().domain([0, 1]).range([ih, 0]);

			// Grid
			g.selectAll('.grid-line').data(y.ticks(5)).join('line')
				.attr('x1', 0).attr('x2', pw)
				.attr('y1', d => y(d)).attr('y2', d => y(d))
				.attr('stroke', theme.border.default)
				.attr('stroke-width', 0.5)
				.attr('stroke-dasharray', '3,3');

			// X-axis
			const xG = g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).tickSize(0));
			styleAxis(xG, { orient: 'bottom' });
			xG.selectAll('.tick text')
				.attr('font-size', 10)
				.attr('transform', 'rotate(-35)')
				.attr('text-anchor', 'end')
				.attr('dx', '-0.4em').attr('dy', '0.4em');

			// Y-axis (only on first panel)
			if (pi === 0) {
				const yG = g.append('g').call(d3.axisLeft(y).ticks(5));
				styleAxis(yG, { orient: 'left' });
				g.append('text')
					.attr('transform', 'rotate(-90)')
					.attr('x', -ih / 2).attr('y', -30)
					.attr('text-anchor', 'middle')
					.attr('font-family', theme.font.sans)
					.attr('font-size', theme.font.size.axisLabel)
					.attr('fill', theme.ink[3])
					.text('Accuracy');
			}

			const bw = x.bandwidth();
			const color = condColors[panel.condition];
			const capW = Math.min(6, bw * 0.2);

			items.forEach(d => {
				const cx = x(d.concept);
				if (cx == null) return;
				const barCx = cx + bw / 2;

				// Accuracy bar (hatched, behind)
				g.append('rect')
					.attr('x', cx).attr('y', y(d.accuracy))
					.attr('width', bw).attr('height', ih - y(d.accuracy))
					.attr('fill', condPatterns[panel.condition]).attr('rx', 1);
				g.append('rect')
					.attr('x', cx).attr('y', y(d.accuracy))
					.attr('width', bw).attr('height', ih - y(d.accuracy))
					.attr('fill', 'none').attr('stroke', color)
					.attr('stroke-width', 0.75).attr('rx', 1);

				// Baseline bar (crosshatched grey, overlaid on top)
				g.append('rect')
					.attr('x', cx).attr('y', y(d.baseline))
					.attr('width', bw).attr('height', ih - y(d.baseline))
					.attr('fill', 'url(#sel-hatch-base)').attr('rx', 1);
				g.append('rect')
					.attr('x', cx).attr('y', y(d.baseline))
					.attr('width', bw).attr('height', ih - y(d.baseline))
					.attr('fill', 'none').attr('stroke', '#aaa')
					.attr('stroke-width', 0.75).attr('rx', 1);

				// Error bar (accuracy)
				const aTop = y(d.accuracy + d.accuracy_sd);
				const aBot = y(Math.max(0, d.accuracy - d.accuracy_sd));
				g.append('line').attr('x1', barCx).attr('x2', barCx).attr('y1', aTop).attr('y2', aBot)
					.attr('stroke', theme.ink[2]).attr('stroke-width', 1);
				g.append('line').attr('x1', barCx - capW).attr('x2', barCx + capW).attr('y1', aTop).attr('y2', aTop)
					.attr('stroke', theme.ink[2]).attr('stroke-width', 1);

				// Error bar (baseline)
				const bTop = y(d.baseline + d.baseline_sd);
				const bBot = y(Math.max(0, d.baseline - d.baseline_sd));
				g.append('line').attr('x1', barCx).attr('x2', barCx).attr('y1', bTop).attr('y2', bBot)
					.attr('stroke', theme.ink[4]).attr('stroke-width', 1);
				g.append('line').attr('x1', barCx - capW).attr('x2', barCx + capW).attr('y1', bTop).attr('y2', bTop)
					.attr('stroke', theme.ink[4]).attr('stroke-width', 1);
			});

			// Legend with opaque background
			const legX = pw - 148;
			const legY = ih - 40;
			const legW = 146;
			const legH = 34;
			g.append('rect')
				.attr('x', legX - 4).attr('y', legY - 4)
				.attr('width', legW).attr('height', legH)
				.attr('fill', 'white').attr('stroke', theme.border.default)
				.attr('stroke-width', 0.5).attr('rx', 3);

			const leg = g.append('g').attr('transform', `translate(${legX},${legY})`);
			leg.append('rect').attr('width', 10).attr('height', 10)
				.attr('fill', condPatterns[panel.condition]).attr('rx', 1);
			leg.append('rect').attr('width', 10).attr('height', 10)
				.attr('fill', 'none').attr('stroke', color).attr('stroke-width', 0.75).attr('rx', 1);
			leg.append('text').attr('x', 14).attr('y', 9)
				.attr('font-family', theme.font.sans).attr('font-size', 10)
				.attr('fill', theme.ink[2]).text(`${panel.label} selectivity`);
			leg.append('rect').attr('y', 14).attr('width', 10).attr('height', 10)
				.attr('fill', 'url(#sel-hatch-base)').attr('rx', 1);
			leg.append('rect').attr('y', 14).attr('width', 10).attr('height', 10)
				.attr('fill', 'none').attr('stroke', '#aaa').attr('stroke-width', 0.75).attr('rx', 1);
			leg.append('text').attr('x', 14).attr('y', 23)
				.attr('font-family', theme.font.sans).attr('font-size', 10)
				.attr('fill', theme.ink[2]).text('Selectivity baseline');
		});
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
