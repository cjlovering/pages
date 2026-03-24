<!--
  Categorical behavior heatmap for calibration experiments.
  Each cell colored by dominant behavior type, intensity by rate.

  <BehaviorHeatmap data={[{ color1, color2, dominant, dominant_rate, avg_wd, ... }]} />
-->
<script>
	import * as d3 from 'd3';
	import { theme } from './theme.js';

	let {
		data = [],
		height: heightProp = null,
		title = '',
		showYLabels = true,
		showXLabels = true
	} = $props();

	// Behavior → (light, dark) color pairs
	const behaviorColors = {
		calibrated:  ['#e8f5e9', '#1b5e20'],
		null:        ['#f5f5f5', '#424242'],
		pref_higher: ['#e3f2fd', '#0d47a1'],
		pref_lower:  ['#ffebee', '#b71c1c'],
		pref_first:  ['#fff3e0', '#e65100'],
		pref_second: ['#f3e5f5', '#4a148c'],
	};

	const behaviorLabels = {
		calibrated:  'calibrated',
		null:        'null',
		pref_higher: 'higher',
		pref_lower:  'lower',
		pref_first:  'first',
		pref_second: 'second',
	};

	// Marble tick label colors (matching PaperHeatmap)
	const labelColors = {
		purple: '#7B2D8E', orange: '#E65100', yellow: '#B8860B',
		pink: '#D81B60', red: '#CC0000', blue: '#1565C0',
		gold: '#B8860B', green: '#2E7D32', black: '#000000',
		brown: '#6D4C41', white: '#888888'
	};

	function cellColor(behavior, rate) {
		const pair = behaviorColors[behavior];
		if (!pair) return '#ffffff';
		const [light, dark] = pair;
		const t = Math.min(1, Math.max(0, (rate - 0.5) * 2));
		return d3.interpolateRgb(light, dark)(t);
	}

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
		const m = {
			top: 8,
			right: 4,
			bottom: showXLabels ? 48 : 4,
			left: 4
		};

		// Extract ordered color lists
		const colors = [...new Set(data.flatMap((d) => [d.color1, d.color2]))].sort();
		const n = colors.length;

		// Build lookup
		const lookup = {};
		data.forEach((d) => { lookup[`${d.color1}__${d.color2}`] = d; });

		// Cell sizing — no cap, square cells
		const iw = w - m.left - m.right;
		const cellW = iw / n;
		const cellH = cellW;
		const ih = cellH * n;
		const totalH = heightProp ?? ih + m.top + m.bottom;

		const svg = d3.select(wrapper).selectAll('svg').data([null]);
		const root = svg.enter().append('svg').merge(svg)
			.attr('width', w)
			.attr('height', totalH)
			.attr('viewBox', `0 0 ${w} ${totalH}`)
			.style('overflow', 'visible');

		root.selectAll('*').remove();
		const g = root.append('g').attr('transform', `translate(${m.left},${m.top})`);

		// Cells
		for (let ri = 0; ri < n; ri++) {
			for (let ci = 0; ci < n; ci++) {
				const c1 = colors[ri];
				const c2 = colors[ci];

				if (c1 === c2) {
					g.append('rect')
						.attr('x', ci * cellW).attr('y', ri * cellH)
						.attr('width', cellW).attr('height', cellH)
						.attr('fill', theme.surface.muted)
						.attr('rx', 2);
					continue;
				}

				const row = lookup[`${c1}__${c2}`];
				if (!row) continue;

				const fill = cellColor(row.dominant, row.dominant_rate);
				const textCol = row.dominant_rate > 0.75 ? theme.surface.page : theme.ink[0];

				g.append('rect')
					.attr('x', ci * cellW).attr('y', ri * cellH)
					.attr('width', cellW).attr('height', cellH)
					.attr('fill', fill)
					.attr('rx', 2);

				// Cell label: behavior + rate (first line) + WD (second line)
				const label = behaviorLabels[row.dominant] ?? row.dominant;
				const fontSize = Math.min(11, cellW * 0.32);

				g.append('text')
					.attr('x', ci * cellW + cellW / 2)
					.attr('y', ri * cellH + cellH / 2 - fontSize * 0.35)
					.attr('text-anchor', 'middle')
					.attr('dominant-baseline', 'middle')
					.attr('font-family', theme.font.sans)
					.attr('font-size', fontSize)
					.attr('font-weight', theme.font.weight.medium)
					.attr('fill', textCol)
					.text(`${label}: ${row.dominant_rate.toFixed(2)}`);

				g.append('text')
					.attr('x', ci * cellW + cellW / 2)
					.attr('y', ri * cellH + cellH / 2 + fontSize * 0.85)
					.attr('text-anchor', 'middle')
					.attr('dominant-baseline', 'middle')
					.attr('font-family', theme.font.mono)
					.attr('font-size', fontSize * 0.8)
					.attr('fill', textCol)
					.attr('opacity', 0.8)
					.text(`WD: ${row.avg_wd.toFixed(2)}`);
			}
		}

		// Bottom x-labels — rotated, colored by marble name
		if (showXLabels) {
			colors.forEach((c, i) => {
				g.append('text')
					.attr('x', i * cellW + cellW / 2).attr('y', ih + 12)
					.attr('text-anchor', 'middle')
					.attr('font-family', theme.font.sans)
					.attr('font-size', Math.min(10, cellW * 0.38))
					.attr('font-weight', theme.font.weight.medium)
					.attr('fill', labelColors[c] ?? theme.ink[2])
					.text(c);
			});
		}

		// Left y-labels — colored by marble name
		if (showYLabels) {
			colors.forEach((c, i) => {
				g.append('text')
					.attr('x', -6)
					.attr('y', i * cellH + cellH / 2)
					.attr('text-anchor', 'end')
					.attr('dominant-baseline', 'middle')
					.attr('font-family', theme.font.sans)
					.attr('font-size', Math.min(10, cellW * 0.38))
					.attr('font-weight', theme.font.weight.medium)
					.attr('fill', labelColors[c] ?? theme.ink[2])
					.text(c);
			});
		}

		// Title
		if (title) {
			root.append('text')
				.attr('x', m.left).attr('y', m.top - 2)
				.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.title)
				.attr('font-weight', theme.font.weight.medium)
				.attr('fill', theme.ink[0])
				.text(title);
		}
	}
</script>

<div bind:this={wrapper} class="w-full overflow-visible"></div>
