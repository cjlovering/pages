<!--
  Heatmap.

  <Heatmap
    rows={['A','B','C']}
    cols={['X','Y','Z']}
    data={[[1,2,3],[4,5,6],[7,8,9]]}
  />

  Or flat: data={[{ row: 'A', col: 'X', value: 1 }, ...]}
-->
<script>
	import * as d3 from 'd3';
	import { theme, styleAxis, sequentialScale } from './theme.js';

	let {
		data = [],
		rows = [],
		cols = [],
		height: heightProp = null,
		margin = { top: 24, right: 20, bottom: 52, left: 72 },
		title = '',
		xLabel = '',
		yLabel = '',
		showValues = false,
		colorVariant = 'warm',
		colorDomain = null
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
		if (!wrapper || w === 0) return;
		if (!data.length && !(Array.isArray(data) && data.length === 0)) return;
		render();
	});

	function normalize() {
		// If data is a 2D array, convert to flat format
		if (Array.isArray(data[0])) {
			const flat = [];
			data.forEach((row, ri) => {
				row.forEach((val, ci) => {
					flat.push({ row: rows[ri] ?? `${ri}`, col: cols[ci] ?? `${ci}`, value: val });
				});
			});
			return {
				flat,
				rowKeys: rows.length ? rows : data.map((_, i) => `${i}`),
				colKeys: cols.length ? cols : data[0].map((_, i) => `${i}`)
			};
		}
		// Already flat
		const rowKeys = rows.length ? rows : [...new Set(data.map((d) => d.row))];
		const colKeys = cols.length ? cols : [...new Set(data.map((d) => d.col))];
		return { flat: data, rowKeys, colKeys };
	}

	function render() {
		const { flat, rowKeys, colKeys } = normalize();
		if (!flat.length) return;

		// Auto-height: square-ish cells
		const m = margin;
		const iw = w - m.left - m.right;
		const cellW = iw / colKeys.length;
		const cellH = Math.min(cellW, 40);
		const ih = cellH * rowKeys.length;
		const totalH = heightProp ?? ih + m.top + m.bottom;

		const svg = d3.select(wrapper).selectAll('svg').data([null]);
		const root = svg.enter().append('svg').merge(svg)
			.attr('width', w)
			.attr('height', totalH)
			.attr('viewBox', `0 0 ${w} ${totalH}`)
			.style('overflow', 'visible');

		root.selectAll('*').remove();
		const g = root.append('g').attr('transform', `translate(${m.left},${m.top})`);

		// Scales
		const x = d3.scaleBand().domain(colKeys).range([0, iw]).padding(0.04);
		const y = d3.scaleBand().domain(rowKeys).range([0, ih]).padding(0.04);

		const extent = colorDomain ?? d3.extent(flat, (d) => d.value);
		const color = sequentialScale(extent, colorVariant);

		// Axes
		const xG = g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x));
		styleAxis(xG, { orient: 'bottom' });
		xG.selectAll('.tick text')
			.attr('transform', colKeys.length > 8 ? 'rotate(-45)' : null)
			.style('text-anchor', colKeys.length > 8 ? 'end' : 'middle');

		const yG = g.append('g').call(d3.axisLeft(y));
		styleAxis(yG, { orient: 'left' });

		// Cells
		g.selectAll('.cell').data(flat).enter().append('rect')
			.attr('class', 'cell')
			.attr('x', (d) => x(d.col))
			.attr('y', (d) => y(d.row))
			.attr('width', x.bandwidth())
			.attr('height', y.bandwidth())
			.attr('fill', (d) => color(d.value))
			.attr('rx', 1);

		// Value labels
		if (showValues) {
			g.selectAll('.cell-label').data(flat).enter().append('text')
				.attr('class', 'cell-label')
				.attr('x', (d) => x(d.col) + x.bandwidth() / 2)
				.attr('y', (d) => y(d.row) + y.bandwidth() / 2)
				.attr('dy', '0.35em')
				.attr('text-anchor', 'middle')
				.attr('font-family', theme.font.mono)
				.attr('font-size', Math.min(theme.font.size.tick, x.bandwidth() * 0.4))
				.attr('fill', (d) => {
					// Dark text on light cells, light on dark
					const c = d3.hsl(color(d.value));
					return c.l > 0.55 ? theme.ink[1] : theme.surface.page;
				})
				.text((d) => typeof d.value === 'number' ? d.value.toFixed(2) : d.value);
		}

		// Axis labels
		if (xLabel) {
			root.append('text')
				.attr('x', m.left + iw / 2).attr('y', totalH - 4)
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
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
