export const SHORT_CODE = `function greet(name) {
  return \`Hello, \${name}!\`;
}

const people = ['Alice', 'Bob', 'Carol'];
for (const p of people) console.log(greet(p));
`;

export const MEDIUM_CODE = `// Tiny reactive store
class Store {
  #state;
  #listeners = new Set();

  constructor(initial) {
    this.#state = initial;
  }

  get() {
    return this.#state;
  }

  set(next) {
    const prev = this.#state;
    this.#state = typeof next === 'function' ? next(prev) : next;
    if (!Object.is(this.#state, prev)) {
      for (const listen of this.#listeners) listen(this.#state, prev);
    }
  }

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }
}

const counter = new Store(0);
counter.subscribe((next) => console.log('count:', next));
counter.set((n) => n + 1);
`;

export const LINKED_CODE = `// The Lezer parser docs live at https://lezer.codemirror.net
// Anchor above is a real clickable link inside the code block.
import { parser } from '@lezer/javascript';

// @region-start region-highlight
const tree = parser.parse('const x = 42');
console.log(tree.toString());
// @region-end region-highlight

const nodeCount = tree.length;
console.log(\`parsed \${nodeCount} characters\`);
`;

export const CSS_CODE = `/* A small CSS snippet */
:root {
  --accent: #4f46e5;
  --radius: 8px;
}

.card {
  padding: 1rem 1.25rem;
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--accent) 10%, white);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.card:hover {
  transform: translateY(-1px);
  transition: transform 120ms ease;
}

@media (prefers-color-scheme: dark) {
  .card {
    background: color-mix(in srgb, var(--accent) 20%, black);
  }
}
`;

export function makeLongCode(copies = 40): string {
  const out: string[] = [];
  for (let i = 0; i < copies; i++) {
    const body = MEDIUM_CODE.replaceAll('Store', 'Store' + i).replaceAll(
      'counter',
      'counter' + i,
    );
    out.push('// --- section ' + i + ' ---\n');
    out.push(body);
    out.push('\n');
  }
  return out.join('');
}
