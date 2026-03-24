<!--
  Diverging heatmap for the paper's 11-color behavior figure (Figure 2).
  TWO categorical color ramps:
    Orange = "Pick First" (cells above anti-diagonal)
    Blue   = "Pick Higher" (cells below anti-diagonal)
  Intensity 0.5 (light) → 1.0 (saturated) within each ramp.
-->
<script>
	import * as d3 from 'd3';
	import { theme } from './theme.js';

	let {
		title = '',
		matrix = [],
		rows = [],
		cols = [],
		height: heightProp = null
	} = $props();

	// Axis label colors matching marble color names
	const labelColors = {
		purple: '#7B2D8E', orange: '#E65100', yellow: '#B8860B',
		pink: '#D81B60', red: '#CC0000', blue: '#1565C0',
		gold: '#B8860B', green: '#2E7D32', black: '#000000',
		brown: '#6D4C41', white: '#888888'
	};

	// Two separate color ramps
	const orangeRamp = d3.scaleLinear()
		.domain([0.5, 1.0])
		.range(['#FFF3E0', '#E65100'])
		.clamp(true);

	const blueRamp = d3.scaleLinear()
		.domain([0.5, 1.0])
		.range(['#E3F2FD', '#0D47A1'])
		.clamp(true);

	let wrapper = $state();
	let w = $state(0);

	$effect(() => {
		if (!wrapper) return;
		const ro = new ResizeObserver(([e]) => { w = e.contentRect.width; });
		ro.observe(wrapper);
		return () => ro.disconnect();
	});

	$effect(() => {
		if (!wrapper || w === 0 || !matrix.length) return;
		render();
	});

	function render() {
		const m = { top: 28, right: 12, bottom: 60, left: 60 };
		const nRows = rows.length;
		const nCols = cols.length;
		const iw = w - m.left - m.right;
		const cellW = iw / nCols;
		const cellH = Math.min(cellW, 36);
		const ih = cellH * nRows;
		const totalH = heightProp ?? ih + m.top + m.bottom;

		const svg = d3.select(wrapper).selectAll('svg').data([null]);
		const root = svg.enter().append('svg').merge(svg)
			.attr('width', w).attr('height', totalH)
			.attr('viewBox', `0 0 ${w} ${totalH}`)
			.style('overflow', 'visible');

		root.selectAll('*').remove();
		const g = root.append('g').attr('transform', `translate(${m.left},${m.top})`);

		// Title
		if (title) {
			root.append('text')
				.attr('x', w / 2).attr('y', 18)
				.attr('text-anchor', 'middle')
				.attr('font-family', theme.font.serif).attr('font-size', theme.font.size.title)
				.attr('font-weight', theme.font.weight.bold)
				.attr('fill', theme.ink[0])
				.text(title);
		}

		// Cells — category from sign: positive = first (orange), negative = higher (blue)
		for (let ri = 0; ri < nRows; ri++) {
			for (let ci = 0; ci < nCols; ci++) {
				const val = matrix[ri][ci];
				const cx = ci * cellW;
				const cy = ri * cellH;

				if (val == null) {
					g.append('rect')
						.attr('x', cx).attr('y', cy)
						.attr('width', cellW).attr('height', cellH)
						.attr('fill', theme.surface.muted)
						.attr('stroke', theme.border.light)
						.attr('stroke-width', 0.5);
					continue;
				}

				const absVal = Math.abs(val);
				const isFirst = val > 0;
				const color = isFirst ? orangeRamp(absVal) : blueRamp(absVal);

				g.append('rect')
					.attr('x', cx).attr('y', cy)
					.attr('width', cellW).attr('height', cellH)
					.attr('fill', color)
					.attr('stroke', theme.border.light)
					.attr('stroke-width', 0.5);

				const textCol = absVal > 0.85 ? '#ffffff' : theme.ink[0];
				const fontSize = Math.min(10, cellW * 0.22);
				g.append('text')
					.attr('x', cx + cellW / 2).attr('y', cy + cellH / 2)
					.attr('dy', '0.35em')
					.attr('text-anchor', 'middle')
					.attr('font-family', theme.font.mono)
					.attr('font-size', fontSize)
					.attr('font-weight', theme.font.weight.medium)
					.attr('fill', textCol)
					.text(absVal.toFixed(2));
			}
		}

		// Row labels (left — Second Option Listed)
		rows.forEach((label, i) => {
			g.append('text')
				.attr('x', -8).attr('y', i * cellH + cellH / 2)
				.attr('dy', '0.35em')
				.attr('text-anchor', 'end')
				.attr('font-family', theme.font.sans).attr('font-size', 10)
				.attr('font-weight', theme.font.weight.medium)
				.attr('fill', labelColors[label] ?? theme.ink[2])
				.text(label);
		});

		// Column labels (bottom — First Option Listed)
		cols.forEach((label, i) => {
			g.append('text')
				.attr('x', i * cellW + cellW / 2).attr('y', ih + 14)
				.attr('text-anchor', 'middle')
				.attr('font-family', theme.font.sans).attr('font-size', 10)
				.attr('font-weight', theme.font.weight.medium)
				.attr('fill', labelColors[label] ?? theme.ink[2])
				.text(label);
		});

		// Axis titles
		g.append('text')
			.attr('transform', `translate(${-m.left + 8},${ih / 2}) rotate(-90)`)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', 11)
			.attr('fill', theme.ink[3])
			.text('Second Option Listed');

		g.append('text')
			.attr('x', iw / 2).attr('y', ih + 30)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', 11)
			.attr('fill', theme.ink[3])
			.text('First Option Listed');

		// ── Two legend bars ──
		const legendW = Math.min(180, iw * 0.4);
		const legendH = 10;
		const legendGap = 24;
		const totalLegendW = legendW * 2 + legendGap;
		const legendStartX = m.left + (iw - totalLegendW) / 2;
		const legendY = totalH - 20;

		const defs = root.append('defs');

		// Orange gradient (Pick First)
		const orangeGrad = defs.append('linearGradient').attr('id', 'paper-hm-orange');
		orangeGrad.append('stop').attr('offset', '0%').attr('stop-color', '#FFF3E0');
		orangeGrad.append('stop').attr('offset', '100%').attr('stop-color', '#E65100');

		// Blue gradient (Pick Higher)
		const blueGrad = defs.append('linearGradient').attr('id', 'paper-hm-blue');
		blueGrad.append('stop').attr('offset', '0%').attr('stop-color', '#E3F2FD');
		blueGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0D47A1');

		// Orange legend bar
		const orangeX = legendStartX;
		root.append('rect')
			.attr('x', orangeX).attr('y', legendY)
			.attr('width', legendW).attr('height', legendH)
			.attr('fill', 'url(#paper-hm-orange)')
			.attr('stroke', theme.border.default).attr('stroke-width', 0.5)
			.attr('rx', 2);

		root.append('text')
			.attr('x', orangeX + legendW / 2).attr('y', legendY - 4)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', 9)
			.attr('font-weight', theme.font.weight.medium)
			.attr('fill', '#E65100')
			.text('Pick First');

		// Blue legend bar
		const blueX = orangeX + legendW + legendGap;
		root.append('rect')
			.attr('x', blueX).attr('y', legendY)
			.attr('width', legendW).attr('height', legendH)
			.attr('fill', 'url(#paper-hm-blue)')
			.attr('stroke', theme.border.default).attr('stroke-width', 0.5)
			.attr('rx', 2);

		root.append('text')
			.attr('x', blueX + legendW / 2).attr('y', legendY - 4)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', 9)
			.attr('font-weight', theme.font.weight.medium)
			.attr('fill', '#0D47A1')
			.text('Pick Higher');

		// Tick marks for both legend bars
		[0.5, 0.75, 1.0].forEach((v) => {
			const t = (v - 0.5) / 0.5;

			// Orange ticks
			const ox = orangeX + t * legendW;
			root.append('line')
				.attr('x1', ox).attr('x2', ox)
				.attr('y1', legendY + legendH).attr('y2', legendY + legendH + 3)
				.attr('stroke', theme.ink[4]).attr('stroke-width', 0.5);
			root.append('text')
				.attr('x', ox).attr('y', legendY + legendH + 11)
				.attr('text-anchor', 'middle')
				.attr('font-family', theme.font.mono).attr('font-size', 8)
				.attr('fill', theme.ink[4])
				.text(v.toFixed(1));

			// Blue ticks
			const bx = blueX + t * legendW;
			root.append('line')
				.attr('x1', bx).attr('x2', bx)
				.attr('y1', legendY + legendH).attr('y2', legendY + legendH + 3)
				.attr('stroke', theme.ink[4]).attr('stroke-width', 0.5);
			root.append('text')
				.attr('x', bx).attr('y', legendY + legendH + 11)
				.attr('text-anchor', 'middle')
				.attr('font-family', theme.font.mono).attr('font-size', 8)
				.attr('fill', theme.ink[4])
				.text(v.toFixed(1));
		});
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
