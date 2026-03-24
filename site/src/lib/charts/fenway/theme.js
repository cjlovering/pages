/**
 * Unified chart theme for D3 visualizations.
 *
 * All values are concrete (no CSS vars) so D3 scales can interpolate them.
 * The palette mirrors the Tailwind tokens in layout.css.
 */
import * as d3 from 'd3';

// ── Ink palette (mirrors layout.css @theme) ──────────────────────────
const ink = {
	0: '#282828',
	1: '#3c3836',
	2: '#504945',
	3: '#6b6866',
	4: '#676767',
	5: '#969696'
};

const surface = {
	page: '#ffffff',
	muted: '#fafaf9',
	code: '#f3f3f2'
};

const border = {
	default: '#e8e5e0',
	light: '#f0eeeb'
};

// ── Categorical palette ──────────────────────────────────────────────
// Ordered so the first few colors are the most distinct and useful.
const categorical = [
	'#AD2111', // accent red
	'#0E9EE4', // accent blue
	'#E8890C', // warm amber
	'#6A994E', // sage green
	'#7B5EA7', // muted purple
	'#D4803D', // copper
	'#2E7D8C', // teal
	'#C45B84'  // dusty rose
];

// ── Sequential / diverging interpolators ─────────────────────────────
const sequential = {
	/** Warm: page white → accent red */
	warm: d3.interpolateRgb(surface.page, '#AD2111'),
	/** Cool: page white → accent blue */
	cool: d3.interpolateRgb(surface.page, '#0E9EE4'),
	/** Ink: surface → ink */
	ink: d3.interpolateRgb(surface.muted, ink[0])
};

const diverging = {
	/** Blue ← white → Red */
	blueRed: (t) => d3.interpolateRgb('#0E9EE4', '#AD2111')(t)
};

// ── Typography ───────────────────────────────────────────────────────
const font = {
	sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
	serif: "'Iowan Old Style', Georgia, 'Times New Roman', serif",
	mono: "SFMono-Regular, 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, monospace",
	size: {
		title: 15,
		axisLabel: 13,
		tick: 11,
		annotation: 12,
		legend: 12
	},
	weight: {
		normal: 400,
		medium: 500,
		bold: 600
	}
};

// ── Default margins ──────────────────────────────────────────────────
const margin = { top: 24, right: 20, bottom: 44, left: 52 };

// ── Axis & grid styling ──────────────────────────────────────────────
const axis = {
	stroke: ink[5],
	strokeWidth: 1,
	tickSize: 5,
	tickPadding: 6,
	grid: {
		stroke: border.default,
		strokeWidth: 0.5,
		strokeDasharray: '3,3'
	},
	domain: {
		stroke: ink[4],
		strokeWidth: 1
	}
};

// ── Transitions ──────────────────────────────────────────────────────
const transition = {
	duration: 400,
	easing: d3.easeCubicOut
};

// ── Per-model colors (stable across all charts) ─────────────────────
const modelColors = {
	'gpt-4o':       '#AD2111', // accent red
	'gpt-4o-mini':  '#E8890C', // warm amber
	'gpt-4.1':      '#0E9EE4', // accent blue
	'gpt-4.1-mini': '#2E7D8C', // teal
	'gpt-5.1':      '#6A994E', // sage green
	'gpt-5.2':      '#7B5EA7'  // muted purple
};

// SVG pattern types per model (for bar charts / print a11y)
const modelPatterns = {
	'gpt-4o':       { type: 'diagonal', angle: 45, spacing: 6 },
	'gpt-4o-mini':  { type: 'diagonal', angle: -45, spacing: 6 },
	'gpt-4.1':      { type: 'dots', spacing: 7, r: 1.2 },
	'gpt-4.1-mini': { type: 'crosshatch', spacing: 6 },
	'gpt-5.1':      { type: 'horizontal', spacing: 5 },
	'gpt-5.2':      { type: 'vertical', spacing: 5 }
};

// ── Assembled theme ──────────────────────────────────────────────────
export const theme = {
	ink,
	surface,
	border,
	categorical,
	sequential,
	diverging,
	font,
	margin,
	axis,
	transition,
	modelColors,
	modelPatterns
};

// ── Helper: apply axis styling to a D3 axis group ────────────────────
export function styleAxis(g, { grid = false, width = 0, height = 0, orient = 'bottom' } = {}) {
	// Domain line
	g.select('.domain')
		.attr('stroke', axis.domain.stroke)
		.attr('stroke-width', axis.domain.strokeWidth);

	// Tick lines
	g.selectAll('.tick line')
		.attr('stroke', axis.stroke)
		.attr('stroke-width', axis.strokeWidth);

	// Tick labels
	g.selectAll('.tick text')
		.attr('fill', ink[2])
		.attr('font-family', font.sans)
		.attr('font-size', font.size.tick);

	// Optional grid lines
	if (grid) {
		const len = orient === 'bottom' || orient === 'top' ? -height : width;
		g.selectAll('.tick line')
			.clone(true)
			.attr(orient === 'bottom' || orient === 'top' ? 'y2' : 'x2', len)
			.attr('stroke', axis.grid.stroke)
			.attr('stroke-width', axis.grid.strokeWidth)
			.attr('stroke-dasharray', axis.grid.strokeDasharray)
			.lower();
	}
}

// ── Helper: create a categorical D3 color scale ──────────────────────
export function categoricalScale(domain) {
	return d3.scaleOrdinal().domain(domain).range(categorical);
}

// ── Helper: create a sequential D3 color scale ───────────────────────
export function sequentialScale(domain, variant = 'warm') {
	return d3.scaleSequential(sequential[variant]).domain(domain);
}

// ── Helper: create a diverging D3 color scale ────────────────────────
export function divergingScale(domain) {
	const [lo, hi] = domain;
	const mid = (lo + hi) / 2;
	return d3.scaleDiverging(diverging.blueRed).domain([lo, mid, hi]);
}

export default theme;
