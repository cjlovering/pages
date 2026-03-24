<!--
  Bar chart. Supports simple and grouped bars, error bars, and SVG pattern overlays.

  Simple:  <BarPlot data={[{ label: 'A', value: 10 }, ...]} />
  Errors:  <BarPlot data={[{ label: 'A', value: 10, error: 2 }, ...]} />
  Grouped: <BarPlot data={[{ label: 'A', value: 10, group: 'X' }, ...]} />
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
		horizontal = false,
		grid = true,
		valueLabels = false,
		colorMap = null,
		patterns = false
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

	function createPatternDefs(defs, labels, colorScale) {
		labels.forEach((label) => {
			const pat = theme.modelPatterns[label];
			if (!pat) return;
			const color = colorScale(label);
			const id = `pat-${label.replace(/[^a-zA-Z0-9]/g, '-')}`;

			if (pat.type === 'diagonal') {
				const s = pat.spacing;
				const p = defs.append('pattern').attr('id', id)
					.attr('patternUnits', 'userSpaceOnUse')
					.attr('width', s).attr('height', s)
					.attr('patternTransform', `rotate(${pat.angle})`);
				p.append('rect').attr('width', s).attr('height', s).attr('fill', color);
				p.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', s)
					.attr('stroke', 'rgba(255,255,255,0.35)').attr('stroke-width', 1.5);
			} else if (pat.type === 'dots') {
				const s = pat.spacing;
				const p = defs.append('pattern').attr('id', id)
					.attr('patternUnits', 'userSpaceOnUse')
					.attr('width', s).attr('height', s);
				p.append('rect').attr('width', s).attr('height', s).attr('fill', color);
				p.append('circle').attr('cx', s / 2).attr('cy', s / 2).attr('r', pat.r)
					.attr('fill', 'rgba(255,255,255,0.4)');
			} else if (pat.type === 'crosshatch') {
				const s = pat.spacing;
				const p = defs.append('pattern').attr('id', id)
					.attr('patternUnits', 'userSpaceOnUse')
					.attr('width', s).attr('height', s);
				p.append('rect').attr('width', s).attr('height', s).attr('fill', color);
				p.append('line').attr('x1', 0).attr('y1', 0).attr('x2', s).attr('y2', s)
					.attr('stroke', 'rgba(255,255,255,0.3)').attr('stroke-width', 1);
				p.append('line').attr('x1', s).attr('y1', 0).attr('x2', 0).attr('y2', s)
					.attr('stroke', 'rgba(255,255,255,0.3)').attr('stroke-width', 1);
			} else if (pat.type === 'horizontal') {
				const s = pat.spacing;
				const p = defs.append('pattern').attr('id', id)
					.attr('patternUnits', 'userSpaceOnUse')
					.attr('width', s).attr('height', s);
				p.append('rect').attr('width', s).attr('height', s).attr('fill', color);
				p.append('line').attr('x1', 0).attr('y1', s / 2).attr('x2', s).attr('y2', s / 2)
					.attr('stroke', 'rgba(255,255,255,0.35)').attr('stroke-width', 1);
			} else if (pat.type === 'vertical') {
				const s = pat.spacing;
				const p = defs.append('pattern').attr('id', id)
					.attr('patternUnits', 'userSpaceOnUse')
					.attr('width', s).attr('height', s);
				p.append('rect').attr('width', s).attr('height', s).attr('fill', color);
				p.append('line').attr('x1', s / 2).attr('y1', 0).attr('x2', s / 2).attr('y2', s)
					.attr('stroke', 'rgba(255,255,255,0.35)').attr('stroke-width', 1);
			}
		});
	}

	function barFill(label, colorScale) {
		if (patterns && theme.modelPatterns[label]) {
			return `url(#pat-${label.replace(/[^a-zA-Z0-9]/g, '-')})`;
		}
		return colorScale(label);
	}

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

		// Detect grouped data
		const groups = [...new Set(data.map((d) => d.group).filter(Boolean))];
		const isGrouped = groups.length > 1;
		const labels = [...new Set(data.map((d) => d.label))];

		// Scales
		const bandScale = d3.scaleBand().domain(labels).range([0, horizontal ? ih : iw]).padding(0.2);
		const maxVal = d3.max(data, (d) => d.value + (d.error ?? 0)) ?? 0;
		const linearScale = d3.scaleLinear().domain([0, maxVal * 1.08]).nice().range(horizontal ? [0, iw] : [ih, 0]);
		const colorScale = colorMap
			? (key) => colorMap[key] ?? theme.categorical[0]
			: categoricalScale(isGrouped ? groups : labels);

		let subBand;
		if (isGrouped) {
			subBand = d3.scaleBand().domain(groups).range([0, bandScale.bandwidth()]).padding(0.05);
		}

		// Pattern defs
		if (patterns) {
			const defs = root.append('defs');
			createPatternDefs(defs, labels, colorScale);
		}

		// Axes
		const bandAxis = horizontal ? d3.axisLeft(bandScale) : d3.axisBottom(bandScale);
		const linearAxis = horizontal ? d3.axisBottom(linearScale) : d3.axisLeft(linearScale);

		const bandG = g.append('g')
			.attr('transform', horizontal ? '' : `translate(0,${ih})`)
			.call(bandAxis);
		styleAxis(bandG, { orient: horizontal ? 'left' : 'bottom' });
		// Style band-axis tick labels as monospace (model names, etc.)
		bandG.selectAll('.tick text')
			.attr('font-family', theme.font.mono)
			.attr('font-size', 11);

		const linearG = g.append('g')
			.attr('transform', horizontal ? `translate(0,${ih})` : '')
			.call(linearAxis);
		styleAxis(linearG, { grid, width: iw, height: ih, orient: horizontal ? 'bottom' : 'left' });

		// Bars
		const bars = g.selectAll('.bar').data(data).enter().append('rect').attr('class', 'bar');

		if (horizontal) {
			bars
				.attr('y', (d) => bandScale(d.label) + (isGrouped ? subBand(d.group) : 0))
				.attr('x', 0)
				.attr('height', isGrouped ? subBand.bandwidth() : bandScale.bandwidth())
				.attr('width', (d) => linearScale(d.value))
				.attr('fill', (d) => barFill(isGrouped ? d.group : d.label, colorScale))
				.attr('rx', 1);
		} else {
			bars
				.attr('x', (d) => bandScale(d.label) + (isGrouped ? subBand(d.group) : 0))
				.attr('y', (d) => linearScale(d.value))
				.attr('width', isGrouped ? subBand.bandwidth() : bandScale.bandwidth())
				.attr('height', (d) => ih - linearScale(d.value))
				.attr('fill', (d) => barFill(isGrouped ? d.group : d.label, colorScale))
				.attr('rx', 1);
		}

		// Error bars
		const hasErrors = data.some((d) => d.error != null);
		if (hasErrors && !horizontal) {
			const capW = Math.min(10, bandScale.bandwidth() * 0.4);

			data.forEach((d) => {
				if (d.error == null) return;
				const cx = bandScale(d.label) + (isGrouped ? subBand(d.group) + subBand.bandwidth() / 2 : bandScale.bandwidth() / 2);
				const yTop = linearScale(d.value + d.error);
				const yBot = linearScale(Math.max(0, d.value - d.error));

				// Vertical line
				g.append('line')
					.attr('x1', cx).attr('x2', cx)
					.attr('y1', yTop).attr('y2', yBot)
					.attr('stroke', theme.ink[2])
					.attr('stroke-width', 1.2);

				// Top cap
				g.append('line')
					.attr('x1', cx - capW).attr('x2', cx + capW)
					.attr('y1', yTop).attr('y2', yTop)
					.attr('stroke', theme.ink[2])
					.attr('stroke-width', 1.2);

				// Bottom cap
				g.append('line')
					.attr('x1', cx - capW).attr('x2', cx + capW)
					.attr('y1', yBot).attr('y2', yBot)
					.attr('stroke', theme.ink[2])
					.attr('stroke-width', 1.2);
			});
		}

		// Value labels on bars
		if (valueLabels) {
			const errorOffset = hasErrors ? 14 : 6;
			g.selectAll('.val-label').data(data).enter().append('text')
				.attr('class', 'val-label')
				.attr('text-anchor', horizontal ? 'start' : 'middle')
				.attr('font-family', theme.font.sans)
				.attr('font-size', theme.font.size.annotation)
				.attr('fill', theme.ink[2])
				.attr('x', (d) => horizontal
					? linearScale(d.value) + 4
					: bandScale(d.label) + (isGrouped ? subBand(d.group) + subBand.bandwidth() / 2 : bandScale.bandwidth() / 2))
				.attr('y', (d) => horizontal
					? bandScale(d.label) + (isGrouped ? subBand(d.group) + subBand.bandwidth() / 2 : bandScale.bandwidth() / 2) + 4
					: linearScale(d.value + (d.error ?? 0)) - errorOffset)
				.text((d) => typeof d.value === 'number' ? d.value.toFixed(3) : d.value);
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

		// Legend (grouped only)
		if (isGrouped) {
			const legend = root.append('g')
				.attr('transform', `translate(${m.left + iw + 8}, ${m.top})`);

			groups.forEach((grp, i) => {
				const row = legend.append('g').attr('transform', `translate(0,${i * 20})`);
				row.append('rect').attr('width', 12).attr('height', 12).attr('rx', 2).attr('fill', colorScale(grp));
				row.append('text').attr('x', 18).attr('y', 10)
					.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.legend)
					.attr('fill', theme.ink[2])
					.text(grp);
			});
		}
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
