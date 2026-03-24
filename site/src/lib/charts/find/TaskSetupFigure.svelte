<!--
  Three-panel illustration: Document | Model | Findings
  Shows the FIND task visually: a document with an inconsistency → LLM → structured output.
-->
<script>
	import * as d3 from 'd3';
	import { theme } from './theme.js';

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
		const height = 200;
		const gap = 24;
		const panelW = (w - gap * 2) / 3;
		const m = { top: 36, right: 10, bottom: 12, left: 10 };

		const svg = d3.select(wrapper).selectAll('svg').data([null]);
		const root = svg.enter().append('svg').merge(svg)
			.attr('width', w).attr('height', height)
			.attr('viewBox', `0 0 ${w} ${height}`)
			.style('overflow', 'visible');

		root.selectAll('*').remove();

		// ── Panel 1: Document ──
		const p1 = root.append('g');
		p1.append('rect')
			.attr('x', 0).attr('y', 0)
			.attr('width', panelW).attr('height', height)
			.attr('fill', theme.surface.muted)
			.attr('stroke', theme.border.default)
			.attr('stroke-width', 1).attr('rx', 4);

		p1.append('text')
			.attr('x', panelW / 2).attr('y', 20)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.serif).attr('font-size', 13)
			.attr('font-weight', theme.font.weight.medium)
			.attr('fill', theme.ink[0])
			.text('Document');

		// Simulated text lines
		const lineY = 40;
		const lineH = 8;
		const lineGap = 5;
		const lw = panelW - 2 * m.left;
		for (let i = 0; i < 10; i++) {
			const y = lineY + i * (lineH + lineGap);
			const thisW = i === 9 ? lw * 0.6 : lw * (0.85 + Math.sin(i * 1.7) * 0.15);
			// Highlight evidence spans (lines 3 and 7 -- the inconsistency)
			const isEvidence = (i === 3 || i === 7);
			p1.append('rect')
				.attr('x', m.left).attr('y', y)
				.attr('width', thisW).attr('height', lineH)
				.attr('fill', isEvidence ? '#7B5EA7' : theme.ink[5])
				.attr('opacity', isEvidence ? 0.25 : 0.18)
				.attr('rx', 2);
			if (isEvidence) {
				p1.append('rect')
					.attr('x', m.left).attr('y', y)
					.attr('width', thisW).attr('height', lineH)
					.attr('fill', 'none')
					.attr('stroke', '#7B5EA7')
					.attr('stroke-width', 1.2)
					.attr('rx', 2);
			}
		}

		// Label for highlighted spans
		p1.append('text')
			.attr('x', panelW / 2).attr('y', height - 6)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', 9)
			.attr('fill', '#7B5EA7')
			.text('inconsistency');

		// ── Arrow 1 ──
		const a1x = panelW + gap / 2;
		const a1y = height / 2;
		root.append('line')
			.attr('x1', panelW + 4).attr('y1', a1y)
			.attr('x2', panelW + gap - 4).attr('y2', a1y)
			.attr('stroke', theme.ink[4]).attr('stroke-width', 1.5)
			.attr('marker-end', 'url(#arrow)');

		// ── Panel 2: Model ──
		const p2 = root.append('g').attr('transform', `translate(${panelW + gap},0)`);
		p2.append('rect')
			.attr('x', 0).attr('y', 0)
			.attr('width', panelW).attr('height', height)
			.attr('fill', theme.surface.page)
			.attr('stroke', theme.border.default)
			.attr('stroke-width', 1).attr('rx', 4);

		p2.append('text')
			.attr('x', panelW / 2).attr('y', 20)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.serif).attr('font-size', 13)
			.attr('font-weight', theme.font.weight.medium)
			.attr('fill', theme.ink[0])
			.text('Language Model');

		// Model icon (simple brain/chip shape)
		const cx = panelW / 2;
		const cy = height / 2 + 5;
		p2.append('rect')
			.attr('x', cx - 30).attr('y', cy - 30)
			.attr('width', 60).attr('height', 60)
			.attr('fill', 'none')
			.attr('stroke', theme.ink[4])
			.attr('stroke-width', 1.5).attr('rx', 8);

		// Connecting lines on chip edges
		[-15, 0, 15].forEach(off => {
			// Left side
			p2.append('line')
				.attr('x1', cx - 30).attr('y1', cy + off)
				.attr('x2', cx - 38).attr('y2', cy + off)
				.attr('stroke', theme.ink[4]).attr('stroke-width', 1.5);
			// Right side
			p2.append('line')
				.attr('x1', cx + 30).attr('y1', cy + off)
				.attr('x2', cx + 38).attr('y2', cy + off)
				.attr('stroke', theme.ink[4]).attr('stroke-width', 1.5);
			// Top
			p2.append('line')
				.attr('x1', cx + off).attr('y1', cy - 30)
				.attr('x2', cx + off).attr('y2', cy - 38)
				.attr('stroke', theme.ink[4]).attr('stroke-width', 1.5);
			// Bottom
			p2.append('line')
				.attr('x1', cx + off).attr('y1', cy + 30)
				.attr('x2', cx + off).attr('y2', cy + 38)
				.attr('stroke', theme.ink[4]).attr('stroke-width', 1.5);
		});

		p2.append('text')
			.attr('x', panelW / 2).attr('y', height - 16)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.mono).attr('font-size', 10)
			.attr('fill', theme.ink[3])
			.text('"Find inconsistencies"');

		// ── Arrow 2 ──
		const a2x0 = 2 * panelW + gap;
		root.append('line')
			.attr('x1', a2x0 + 4).attr('y1', a1y)
			.attr('x2', a2x0 + gap - 4).attr('y2', a1y)
			.attr('stroke', theme.ink[4]).attr('stroke-width', 1.5)
			.attr('marker-end', 'url(#arrow)');

		// ── Panel 3: Findings ──
		const p3 = root.append('g').attr('transform', `translate(${2 * (panelW + gap)},0)`);
		p3.append('rect')
			.attr('x', 0).attr('y', 0)
			.attr('width', panelW).attr('height', height)
			.attr('fill', theme.surface.muted)
			.attr('stroke', theme.border.default)
			.attr('stroke-width', 1).attr('rx', 4);

		p3.append('text')
			.attr('x', panelW / 2).attr('y', 20)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.serif).attr('font-size', 13)
			.attr('font-weight', theme.font.weight.medium)
			.attr('fill', theme.ink[0])
			.text('Findings');

		// Structured output representation
		const findings = [
			{ tag: '<evidence>', text: '"...total was $4.2M..."', color: '#7B5EA7' },
			{ tag: '<evidence>', text: '"...sum equals $3.8M..."', color: '#7B5EA7' },
			{ tag: '<description>', text: 'The stated total does', color: '#E8890C' },
			{ tag: '', text: 'not match the sum of', color: '#E8890C' },
			{ tag: '', text: 'line items.', color: '#E8890C' },
		];

		findings.forEach((f, i) => {
			const y = 42 + i * 28;
			if (f.tag) {
				p3.append('text')
					.attr('x', m.left).attr('y', y)
					.attr('font-family', theme.font.mono).attr('font-size', 9)
					.attr('fill', f.color).attr('opacity', 0.7)
					.text(f.tag);
			}
			p3.append('text')
				.attr('x', f.tag ? m.left + 4 : m.left + 8).attr('y', f.tag ? y + 14 : y + 4)
				.attr('font-family', theme.font.mono).attr('font-size', 10)
				.attr('fill', theme.ink[2])
				.text(f.text);
		});

		// Arrow marker definition
		const defs = root.append('defs');
		defs.append('marker')
			.attr('id', 'arrow').attr('viewBox', '0 0 10 10')
			.attr('refX', 9).attr('refY', 5)
			.attr('markerWidth', 6).attr('markerHeight', 6)
			.attr('orient', 'auto-start-reverse')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', theme.ink[4]);
	}
</script>

<div bind:this={wrapper} class="w-full"></div>
