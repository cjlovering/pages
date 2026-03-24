<!--
  Line chart. Supports single or multiple series, optional area fill.

  Single:   <LinePlot data={[{ x: 0, y: 10 }, ...]} />
  Multi:    <LinePlot data={[{ name: 'A', values: [{ x: 0, y: 10 }, ...] }, ...]} />
-->
<script>
	import * as d3 from 'd3';
	import { theme, styleAxis, categoricalScale } from './theme.js';

	let {
		data = [],
		height = 300,
		margin = theme.margin,
		title = '',
		xLabel = '',
		yLabel = '',
		grid = true,
		area = false,
		curve = 'curveMonotoneX',
		dots = false,
		xType = 'linear',
		colorMap = null
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

	function normalize(raw) {
		// Normalize to multi-series format
		if (Array.isArray(raw) && raw.length && !raw[0].values) {
			return [{ name: '', values: raw }];
		}
		return raw;
	}

	function render() {
		const series = normalize(data);
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

		// Flatten all points for extent
		const allPts = series.flatMap((s) => s.values);

		// X scale
		let x;
		if (xType === 'time') {
			x = d3.scaleTime()
				.domain(d3.extent(allPts, (d) => d.x))
				.range([0, iw]);
		} else {
			x = d3.scaleLinear()
				.domain(d3.extent(allPts, (d) => d.x))
				.nice()
				.range([0, iw]);
		}

		// Y scale
		const yExtent = d3.extent(allPts, (d) => d.y);
		const y = d3.scaleLinear()
			.domain([Math.min(0, yExtent[0]), yExtent[1] * 1.05])
			.nice()
			.range([ih, 0]);

		// Color
		const names = series.map((s) => s.name);
		const color = colorMap
			? (key) => colorMap[key] ?? theme.categorical[0]
			: categoricalScale(names);

		// Axes
		const xG = g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x));
		styleAxis(xG, { orient: 'bottom' });

		const yG = g.append('g').call(d3.axisLeft(y));
		styleAxis(yG, { grid, width: iw, height: ih, orient: 'left' });

		// Curve
		const curveFactory = d3[curve] ?? d3.curveMonotoneX;

		// Area
		if (area) {
			const areaGen = d3.area()
				.x((d) => x(d.x))
				.y0(ih)
				.y1((d) => y(d.y))
				.curve(curveFactory);

			series.forEach((s) => {
				g.append('path')
					.datum(s.values)
					.attr('d', areaGen)
					.attr('fill', color(s.name))
					.attr('opacity', 0.12);
			});
		}

		// Lines
		const lineGen = d3.line()
			.x((d) => x(d.x))
			.y((d) => y(d.y))
			.curve(curveFactory);

		series.forEach((s) => {
			g.append('path')
				.datum(s.values)
				.attr('d', lineGen)
				.attr('fill', 'none')
				.attr('stroke', color(s.name))
				.attr('stroke-width', 2);
		});

		// Dots
		if (dots) {
			series.forEach((s) => {
				g.selectAll(null).data(s.values).enter().append('circle')
					.attr('cx', (d) => x(d.x))
					.attr('cy', (d) => y(d.y))
					.attr('r', 3)
					.attr('fill', color(s.name));
			});
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
				.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.title)
				.attr('font-weight', theme.font.weight.medium)
				.attr('fill', theme.ink[0])
				.text(title);
		}

		// Legend (multi-series only)
		if (series.length > 1) {
			const legend = root.append('g')
				.attr('transform', `translate(${m.left + iw + 8}, ${m.top})`);

			series.forEach((s, i) => {
				const row = legend.append('g').attr('transform', `translate(0,${i * 20})`);
				row.append('line').attr('x1', 0).attr('x2', 14).attr('y1', 6).attr('y2', 6)
					.attr('stroke', color(s.name)).attr('stroke-width', 2);
				row.append('text').attr('x', 20).attr('y', 10)
					.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.legend)
					.attr('fill', theme.ink[2])
					.text(s.name);
			});
		}
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
