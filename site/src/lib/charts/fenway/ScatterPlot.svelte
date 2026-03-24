<!--
  Scatter plot. Supports grouping by color, optional trend line.

  <ScatterPlot data={[{ x: 1, y: 2 }, { x: 3, y: 4, group: 'A' }, ...]} />
-->
<script>
	import * as d3 from 'd3';
	import { theme, styleAxis, categoricalScale } from './theme.js';

	let {
		data = [],
		height = 360,
		margin = theme.margin,
		title = '',
		xLabel = '',
		yLabel = '',
		grid = true,
		radius = 4,
		opacity = 0.7,
		trendLine = false,
		diagonal = false,
		colorMap = null,
		legend = true,
		xDomain = null,
		yDomain = null
	} = $props();

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
			.attr('width', w)
			.attr('height', height)
			.attr('viewBox', `0 0 ${w} ${height}`)
			.style('overflow', 'visible');

		root.selectAll('*').remove();

		const m = margin;
		const iw = w - m.left - m.right;
		const ih = height - m.top - m.bottom;
		const g = root.append('g').attr('transform', `translate(${m.left},${m.top})`);

		// Scales (use fixed domains if provided)
		const xExt = xDomain ?? d3.extent(data, (d) => d.x);
		const yExt = yDomain ?? d3.extent(data, (d) => d.y);
		const x = d3.scaleLinear().domain(xExt).nice().range([0, iw]);
		const y = d3.scaleLinear().domain(yExt).nice().range([ih, 0]);

		// Groups
		const groups = [...new Set(data.map((d) => d.group).filter(Boolean))];
		const hasGroups = groups.length > 1;
		const color = colorMap
			? (key) => colorMap[key] ?? theme.categorical[0]
			: hasGroups ? categoricalScale(groups) : () => theme.categorical[0];

		// Axes
		const xG = g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x));
		styleAxis(xG, { orient: 'bottom' });

		const yG = g.append('g').call(d3.axisLeft(y));
		styleAxis(yG, { grid, width: iw, height: ih, orient: 'left' });

		// Diagonal reference line (e.g., y = x)
		if (diagonal) {
			const lo = Math.max(x.domain()[0], y.domain()[0]);
			const hi = Math.min(x.domain()[1], y.domain()[1]);
			g.append('line')
				.attr('x1', x(lo)).attr('y1', y(lo))
				.attr('x2', x(hi)).attr('y2', y(hi))
				.attr('stroke', theme.border.default)
				.attr('stroke-width', 1)
				.attr('stroke-dasharray', '6,4');
		}

		// Points
		g.selectAll('circle.scatter-pt').data(data).enter().append('circle')
			.attr('class', 'scatter-pt')
			.attr('cx', (d) => x(d.x))
			.attr('cy', (d) => y(d.y))
			.attr('r', (d) => d.size ?? radius)
			.attr('fill', (d) => color(d.group ?? ''))
			.attr('opacity', opacity)
			.attr('stroke', theme.surface.page)
			.attr('stroke-width', 0.5);

		// Trend line (linear regression)
		if (trendLine && data.length > 2) {
			const n = data.length;
			const sx = d3.sum(data, (d) => d.x);
			const sy = d3.sum(data, (d) => d.y);
			const sxy = d3.sum(data, (d) => d.x * d.y);
			const sxx = d3.sum(data, (d) => d.x * d.x);
			const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
			const intercept = (sy - slope * sx) / n;
			const [x0, x1] = x.domain();

			g.append('line')
				.attr('x1', x(x0)).attr('y1', y(slope * x0 + intercept))
				.attr('x2', x(x1)).attr('y2', y(slope * x1 + intercept))
				.attr('stroke', theme.ink[4])
				.attr('stroke-width', 1.5)
				.attr('stroke-dasharray', '6,3');
		}

		// Axis labels
		if (xLabel) {
			root.append('text')
				.attr('x', m.left + iw / 2).attr('y', height - 4)
				.attr('text-anchor', 'middle')
				.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.axisLabel)
				.attr('fill', theme.ink[3])
				.text(xLabel);
		}
		if (yLabel) {
			root.append('text')
				.attr('transform', `translate(${14},${m.top + ih / 2}) rotate(-90)`)
				.attr('text-anchor', 'middle')
				.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.axisLabel)
				.attr('fill', theme.ink[3])
				.text(yLabel);
		}

		// Title
		if (title) {
			root.append('text')
				.attr('x', m.left).attr('y', m.top - 8)
				.attr('font-family', theme.font.mono).attr('font-size', theme.font.size.title)
				.attr('font-weight', theme.font.weight.medium)
				.attr('fill', theme.ink[0])
				.text(title);
		}

		// Legend
		if (hasGroups && legend) {
			const legend = root.append('g')
				.attr('transform', `translate(${m.left + iw + 8}, ${m.top})`);

			groups.forEach((grp, i) => {
				const row = legend.append('g').attr('transform', `translate(0,${i * 20})`);
				row.append('circle').attr('cx', 6).attr('cy', 6).attr('r', 5).attr('fill', color(grp));
				row.append('text').attr('x', 18).attr('y', 10)
					.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.legend)
					.attr('fill', theme.ink[2])
					.text(grp);
			});
		}
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
