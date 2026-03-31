<!--
  Fig 7: Animated board structure — crossfades between checkpoint PNGs
  with a synchronized NDCG line chart underneath and a playhead.

  frames = [{ src, checkpoint }]
  structureData = { ndcg: [{x,y}], overlap: [{x,y}] }
-->
<script>
	import * as d3 from 'd3';
	import { theme, styleAxis } from './theme.js';

	let {
		frames = [],
		structureData = { ndcg: [], overlap: [] },
		imgSize = 360,
	} = $props();

	let wrapper = $state();
	let chartWrapper = $state();
	let w = $state(0);
	let currentFrame = $state(0);
	let playing = $state(true);
	let intervalId = $state(null);

	// Map frame index to checkpoint value
	function currentCheckpoint() {
		return frames[currentFrame]?.checkpoint ?? 0;
	}

	$effect(() => {
		if (!wrapper) return;
		const ro = new ResizeObserver(([e]) => { w = e.contentRect.width; });
		ro.observe(wrapper);
		return () => ro.disconnect();
	});

	// Auto-play
	$effect(() => {
		if (playing && frames.length > 1) {
			intervalId = setInterval(() => {
				currentFrame = (currentFrame + 1) % frames.length;
			}, 2000);
			return () => clearInterval(intervalId);
		}
	});

	// Render chart whenever frame or width changes
	$effect(() => {
		if (!chartWrapper || w === 0 || !structureData.ndcg.length) return;
		// Access currentFrame to trigger re-render
		const _ = currentFrame;
		renderChart();
	});

	function renderChart() {
		const chartH = 140;
		const m = { top: 16, right: 20, bottom: 32, left: 52 };
		const iw = w - m.left - m.right;
		const ih = chartH - m.top - m.bottom;

		const svg = d3.select(chartWrapper).selectAll('svg').data([null]);
		const root = svg.enter().append('svg').merge(svg)
			.attr('width', w).attr('height', chartH)
			.attr('viewBox', `0 0 ${w} ${chartH}`)
			.style('overflow', 'visible');
		root.selectAll('*').remove();

		const g = root.append('g').attr('transform', `translate(${m.left},${m.top})`);

		const x = d3.scaleLinear().domain([0, 19]).range([0, iw]);
		const y = d3.scaleLinear().domain([0.9, 1]).range([ih, 0]);

		const xG = g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).ticks(10));
		styleAxis(xG, { orient: 'bottom' });

		const yG = g.append('g').call(d3.axisLeft(y).ticks(4).tickFormat(d3.format('.2f')));
		styleAxis(yG, { grid: true, width: iw, height: ih, orient: 'left' });

		// NDCG line
		const line = d3.line().x(d => x(d.x)).y(d => y(d.y)).curve(d3.curveMonotoneX);
		const area = d3.area().x(d => x(d.x)).y0(ih).y1(d => y(d.y)).curve(d3.curveMonotoneX);

		g.append('path').datum(structureData.ndcg).attr('d', area)
			.attr('fill', theme.conceptColors.bridge).attr('opacity', 0.08);
		g.append('path').datum(structureData.ndcg).attr('d', line)
			.attr('fill', 'none').attr('stroke', theme.conceptColors.bridge).attr('stroke-width', 2);

		// Playhead
		const ckpt = currentCheckpoint();
		// Map checkpoint (0-20) to data index (0-19)
		const dataIdx = Math.min(ckpt, 19);
		const px = x(dataIdx);
		g.append('line')
			.attr('x1', px).attr('x2', px)
			.attr('y1', 0).attr('y2', ih)
			.attr('stroke', theme.ink[0]).attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '4,3');
		g.append('circle')
			.attr('cx', px)
			.attr('cy', y(structureData.ndcg.find(d => d.x === dataIdx)?.y ?? 0.93))
			.attr('r', 4)
			.attr('fill', theme.conceptColors.bridge)
			.attr('stroke', theme.surface.page).attr('stroke-width', 1.5);

		// Labels
		root.append('text')
			.attr('x', m.left + iw / 2).attr('y', chartH - 2)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[3]).text('Checkpoint');
		root.append('text')
			.attr('transform', `translate(14,${m.top + ih / 2}) rotate(-90)`)
			.attr('text-anchor', 'middle')
			.attr('font-family', theme.font.sans).attr('font-size', theme.font.size.axisLabel)
			.attr('fill', theme.ink[3]).text('NDCG');
	}

	function togglePlay() {
		playing = !playing;
	}

	function goTo(i) {
		currentFrame = i;
		playing = false;
	}
</script>

<div bind:this={wrapper} class="w-full">
	<!-- Image area -->
	<div class="relative mx-auto" style="width: {Math.min(imgSize, w)}px; height: {Math.min(imgSize, w)}px;">
		{#each frames as frame, i}
			<img
				src={frame.src}
				alt="Board structure at checkpoint {frame.checkpoint}"
				class="absolute inset-0 w-full h-full object-contain transition-opacity duration-700"
				style="opacity: {i === currentFrame ? 1 : 0};"
				loading="lazy"
			/>
		{/each}
	</div>

	<!-- Controls -->
	<div class="flex items-center justify-center gap-3 mt-2 mb-1">
		<button
			onclick={togglePlay}
			class="text-xs font-sans px-2 py-0.5 rounded border border-[#e8e5e0] hover:bg-[#fafaf9] transition-colors"
		>
			{playing ? 'Pause' : 'Play'}
		</button>
		{#each frames as frame, i}
			<button
				onclick={() => goTo(i)}
				class="text-xs font-sans px-2 py-0.5 rounded border transition-colors"
				class:bg-ink={i === currentFrame}
				style="background: {i === currentFrame ? '#282828' : 'transparent'}; color: {i === currentFrame ? '#fff' : '#504945'}; border-color: {i === currentFrame ? '#282828' : '#e8e5e0'};"
			>
				{frame.checkpoint}
			</button>
		{/each}
	</div>

	<!-- NDCG chart underneath -->
	<div bind:this={chartWrapper} class="w-full mt-1"></div>
</div>
