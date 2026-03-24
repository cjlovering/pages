export const posts = [
	// ── Research ──────────────────────────────────────────
	{
		slug: 'find',
		title: 'On Finding Inconsistencies in Documents',
		subtitle: 'Can language models detect inconsistencies across long documents?',
		date: '2025',
		section: 'research',
		tags: ['LLMs', 'datasets', 'Kensho']
	},
	{
		slug: 'fenway',
		title: 'Language Models Struggle With Numeric Calibration',
		subtitle: 'Evaluating numeric calibration in language model outputs.',
		date: '2025',
		section: 'research',
		tags: ['LLMs', 'calibration', 'ACL 2025', 'Kensho']
	},
	{
		slug: 'listicles',
		title: 'Listicles',
		subtitle: 'A natural dataset without the biases of human-elicited datasets.',
		date: '2018',
		section: 'research',
		tags: ['datasets', 'NLP', 'Brown']
	},
	{
		slug: 'interpretable-rl',
		title: 'Towards Interpretable Reinforcement Learning',
		subtitle: 'Reimplementation for NeurIPS Reproducibility Challenge 2019.',
		date: '2019',
		section: 'research',
		tags: ['reinforcement learning', 'interpretability', 'Brown']
	},

	// ── Exposition ────────────────────────────────────────
	{
		slug: 'transformer-networks',
		title: 'Transformer Networks',
		subtitle: 'Attention is all you need.',
		date: '2019',
		section: 'exposition',
		tags: ['deep learning', 'NLP']
	},
	{
		slug: 'beam-search',
		title: 'Beam Search',
		subtitle: 'Exposition of beam search.',
		date: '2019',
		section: 'exposition',
		tags: ['algorithms', 'NLP']
	},
	{
		slug: 'neural-turing',
		title: 'Neural Turing Machines',
		subtitle: 'Memory-augmented neural networks.',
		date: '2019',
		section: 'exposition',
		tags: ['deep learning']
	},
	{
		slug: 'byte-encoding',
		title: 'Subword Tokenization',
		subtitle: 'Neural machine translation of rare words with subword units.',
		date: '2019',
		section: 'exposition',
		tags: ['NLP']
	},

	// ── Notes ─────────────────────────────────────────────
	{
		slug: 'haiku-merge-params',
		title: 'Haiku Merge Params',
		subtitle: 'Merge pre-trained parameters into a new Haiku model.',
		date: '2020',
		section: 'notes',
		tags: ['Python', 'JAX']
	},
	{
		slug: 'auto-format-python',
		title: 'Auto-Format Python on Save',
		subtitle: 'Set up VS Code to format with black on every save.',
		date: '2020',
		section: 'notes',
		tags: ['Python', 'tools']
	},
	{
		slug: '3d-indexing-pytorch',
		title: '3-D Indexing with PyTorch',
		subtitle: 'Select vectors from a 3-D tensor by index.',
		date: '2020',
		section: 'notes',
		tags: ['Python', 'PyTorch']
	},
	{
		slug: 'pretty-print-pandas',
		title: 'Pretty-Print Pandas in Notebooks',
		subtitle: 'Use display() for HTML-formatted tables anywhere in a cell.',
		date: '2020',
		section: 'notes',
		tags: ['Python', 'pandas']
	},
	{
		slug: 'defaultdict-from-dict',
		title: 'Build a DefaultDict from a Dict',
		subtitle: 'One-line defaultdict initialization with existing data.',
		date: '2020',
		section: 'notes',
		tags: ['Python']
	},
	{
		slug: 'seaborn-too-many-values',
		title: 'Fix "Too Many Values" for Seaborn',
		subtitle: 'Handle more than 6 style values in line plots.',
		date: '2020',
		section: 'notes',
		tags: ['Python', 'seaborn']
	},
	{
		slug: 'bash-too-many-files',
		title: 'Fix "Too Many Files" for Bash',
		subtitle: 'Use find when cp/mv/rename hits the argument limit.',
		date: '2020',
		section: 'notes',
		tags: ['bash']
	},
	{
		slug: 'git-on-a-server',
		title: 'Git on a Server',
		subtitle: 'Fixes for common git annoyances on remote machines.',
		date: '2020',
		section: 'notes',
		tags: ['git']
	},
	{
		slug: 'readable-file-sizes',
		title: 'Readable File/Folder Sizes',
		subtitle: 'Human-readable sizes with du -h.',
		date: '2020',
		section: 'notes',
		tags: ['bash']
	},
	{
		slug: 'number-of-batches',
		title: 'Number of Batches',
		subtitle: 'Correct iteration count including the remainder batch.',
		date: '2020',
		section: 'notes',
		tags: ['Python', 'deep learning']
	},
	{
		slug: 'compile-latex',
		title: 'Compile LaTeX with a Bibliography',
		subtitle: 'The correct command sequence for resolved references.',
		date: '2020',
		section: 'notes',
		tags: ['LaTeX']
	}
];

export const sections = [
	{ key: 'research', label: 'Research' },
	{ key: 'exposition', label: 'Exposition' },
	{ key: 'notes', label: 'Notes' }
];
