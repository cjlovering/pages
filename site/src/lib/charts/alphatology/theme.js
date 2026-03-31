/**
 * Alphatology chart theme — extends the base ink palette with concept-specific colors.
 */
import * as d3 from 'd3';

const ink = {
	0: '#282828', 1: '#3c3836', 2: '#504945',
	3: '#6b6866', 4: '#676767', 5: '#969696'
};

const surface = { page: '#ffffff', muted: '#fafaf9', code: '#f3f3f2' };
const border  = { default: '#e8e5e0', light: '#f0eeeb' };

// Concept palette — stable across all alphatology charts.
// Internal concepts (warm), edge/ladder (cool), negative (muted)
const conceptColors = {
	bridge:     '#AD2111', // red
	crescent:   '#E8890C', // amber
	trapezoid:  '#D4803D', // copper
	span:       '#6A994E', // green
	edge:       '#0E9EE4', // blue
	bottleneck: '#2E7D8C', // teal
	escape:     '#7B5EA7', // purple
	dead:       '#8B7355', // warm gray
	captured:   '#C45B84'  // rose
};

const conceptOrder = [
	'bridge', 'crescent', 'trapezoid', 'span',
	'edge', 'bottleneck', 'escape',
	'dead', 'captured'
];

// Series colors for MCTS vs policy network
const seriesColors = {
	mcts:   '#282828', // ink
	policy: '#AD2111'  // accent red
};

const categorical = Object.values(conceptColors);

const font = {
	sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
	serif: "'Iowan Old Style', Georgia, 'Times New Roman', serif",
	mono: "SFMono-Regular, 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, monospace",
	size: { title: 15, axisLabel: 13, tick: 11, annotation: 12, legend: 12 },
	weight: { normal: 400, medium: 500, bold: 600 }
};

const margin = { top: 24, right: 20, bottom: 44, left: 52 };

const axis = {
	stroke: ink[5],
	strokeWidth: 1,
	tickSize: 5,
	tickPadding: 6,
	grid: { stroke: border.default, strokeWidth: 0.5, strokeDasharray: '3,3' },
	domain: { stroke: ink[4], strokeWidth: 1 }
};

const transition = { duration: 400, easing: d3.easeCubicOut };

export const theme = {
	ink, surface, border, categorical,
	conceptColors, conceptOrder, seriesColors,
	font, margin, axis, transition
};

export function styleAxis(g, { grid = false, width = 0, height = 0, orient = 'bottom' } = {}) {
	g.select('.domain')
		.attr('stroke', axis.domain.stroke)
		.attr('stroke-width', axis.domain.strokeWidth);
	g.selectAll('.tick line')
		.attr('stroke', axis.stroke)
		.attr('stroke-width', axis.strokeWidth);
	g.selectAll('.tick text')
		.attr('fill', ink[2])
		.attr('font-family', font.sans)
		.attr('font-size', font.size.tick);
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

export function conceptScale(domain) {
	return d3.scaleOrdinal().domain(domain).range(domain.map(c => conceptColors[c] ?? '#999'));
}

export default theme;
