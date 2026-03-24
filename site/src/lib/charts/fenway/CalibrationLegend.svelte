<!--
  Standalone legend diagram explaining how to read calibration scatter plots.
  Shows 4 colored quadrants, diagonal line, and a calibrated band.
-->
<script>
	import * as d3 from 'd3';
	import { theme, styleAxis } from './theme.js';

	let {
		height = 320,
		margin = { top: 16, right: 20, bottom: 44, left: 52 }
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

		const x = d3.scaleLinear().domain([0, 1]).range([0, iw]);
		const y = d3.scaleLinear().domain([0, 1]).range([ih, 0]);

		// Axes
		const xG = g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).ticks(5));
		styleAxis(xG, { orient: 'bottom' });

		const yG = g.append('g').call(d3.axisLeft(y).ticks(5));
		styleAxis(yG, { orient: 'left' });

		const midPx = x(0.5);
		const midPy = y(0.5);

		// Quadrant colors
		const green = '#1b5e20';
		const red = '#b71c1c';

		// 4 quadrant rects
		// Top-right: directionally calibrated (green)
		g.append('rect').attr('x', midPx).attr('y', 0).attr('width', iw - midPx).attr('height', midPy)
			.attr('fill', green).attr('opacity', 0.08);
		// Bottom-left: directionally calibrated (green)
		g.append('rect').attr('x', 0).attr('y', midPy).attr('width', midPx).attr('height', ih - midPy)
			.attr('fill', green).attr('opacity', 0.08);
		// Top-left: not directionally calibrated (red)
		g.append('rect').attr('x', 0).attr('y', 0).attr('width', midPx).attr('height', midPy)
			.attr('fill', red).attr('opacity', 0.08);
		// Bottom-right: not directionally calibrated (red)
		g.append('rect').attr('x', midPx).attr('y', midPy).attr('width', iw - midPx).attr('height', ih - midPy)
			.attr('fill', red).attr('opacity', 0.08);

		// Diagonal calibrated band (±0.1)
		const bandW = 0.15;
		const bandPts = [
			[x(0), y(bandW)],
			[x(1 - bandW), y(1)],
			[x(1), y(1)],
			[x(1), y(1 - bandW)],
			[x(bandW), y(0)],
			[x(0), y(0)]
		];
		g.append('polygon')
			.attr('points', bandPts.map(p => p.join(',')).join(' '))
			.attr('fill', theme.ink[4])
			.attr('opacity', 0.12);

		// Diagonal line y=x
		g.append('line')
			.attr('x1', x(0)).attr('y1', y(0))
			.attr('x2', x(1)).attr('y2', y(1))
			.attr('stroke', theme.ink[3])
			.attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '6,4');

		// Midpoint lines
		g.append('line')
			.attr('x1', midPx).attr('y1', 0).attr('x2', midPx).attr('y2', ih)
			.attr('stroke', theme.ink[5]).attr('stroke-width', 0.5).attr('stroke-dasharray', '3,3');
		g.append('line')
			.attr('x1', 0).attr('y1', midPy).attr('x2', iw).attr('y2', midPy)
			.attr('stroke', theme.ink[5]).attr('stroke-width', 0.5).attr('stroke-dasharray', '3,3');

		// Labels
		const fs = theme.font.size.annotation;
		const ff = theme.font.sans;

		function addLabel(cx, cy, lines, color) {
			const lg = g.append('g').style('pointer-events', 'none');
			const bg = lg.append('rect')
				.attr('fill', theme.surface.page).attr('opacity', 0.85).attr('rx', 3);
			const txt = lg.append('text')
				.attr('x', cx).attr('y', cy)
				.attr('text-anchor', 'middle')
				.attr('font-family', ff)
				.attr('font-size', fs)
				.attr('font-weight', theme.font.weight.medium)
				.attr('fill', color);
			lines.forEach((line, i) => {
				txt.append('tspan').attr('x', cx).attr('dy', i === 0 ? `-${(lines.length - 1) * 0.6}em` : '1.2em').text(line);
			});
			const bbox = txt.node().getBBox();
			bg.attr('x', bbox.x - 6).attr('y', bbox.y - 3)
				.attr('width', bbox.width + 12).attr('height', bbox.height + 6);
		}

		// Green labels
		addLabel(midPx + (iw - midPx) / 2, midPy / 2, ['Directionally', 'Calibrated'], green);
		addLabel(midPx / 2, midPy + (ih - midPy) / 2, ['Directionally', 'Calibrated'], green);

		// Red labels
		addLabel(midPx / 2, midPy / 2, ['Not Directionally', 'Calibrated'], red);
		addLabel(midPx + (iw - midPx) / 2, midPy + (ih - midPy) / 2, ['Not Directionally', 'Calibrated'], red);

		// "Calibrated" label along diagonal
		const diagX = x(0.5);
		const diagY = y(0.5);
		const diagLg = g.append('g').style('pointer-events', 'none');
		const diagBg = diagLg.append('rect')
			.attr('fill', theme.surface.page).attr('opacity', 0.85).attr('rx', 3);
		const diagTxt = diagLg.append('text')
			.attr('x', diagX).attr('y', diagY)
			.attr('text-anchor', 'middle')
			.attr('font-family', ff)
			.attr('font-size', fs)
			.attr('font-weight', theme.font.weight.medium)
			.attr('fill', theme.ink[2])
			.text('Calibrated');
		const diagBbox = diagTxt.node().getBBox();
		diagBg.attr('x', diagBbox.x - 6).attr('y', diagBbox.y - 3)
			.attr('width', diagBbox.width + 12).attr('height', diagBbox.height + 6);

		// Axis labels
		root.append('text')
			.attr('x', m.left + iw / 2).attr('y', height - 4)
			.attr('text-anchor', 'middle')
			.attr('font-family', ff).attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[3])
			.text('Ideal');

		root.append('text')
			.attr('transform', `translate(${14},${m.top + ih / 2}) rotate(-90)`)
			.attr('text-anchor', 'middle')
			.attr('font-family', ff).attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[3])
			.text('Model');
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
