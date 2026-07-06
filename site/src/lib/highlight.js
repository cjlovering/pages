// Loaded lazily from +layout.svelte only on pages that contain code blocks,
// so highlight.js stays out of the shared bundle.
import 'highlight.js/styles/base16/solarized-light.css';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import latex from 'highlight.js/lib/languages/latex';

hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('latex', latex);

export default hljs;
