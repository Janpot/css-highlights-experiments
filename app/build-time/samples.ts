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

const tree = parser.parse('const x = 42');
console.log(tree.toString());
`;

export interface Segment {
  text: string;
  href?: string;
}

const LINK_URL = 'https://lezer.codemirror.net';
const LINK_TEXT = 'https://lezer.codemirror.net';
const linkStart = LINKED_CODE.indexOf(LINK_TEXT);
const linkEnd = linkStart + LINK_TEXT.length;

export const LINKED_SEGMENTS: Segment[] = [
  { text: LINKED_CODE.slice(0, linkStart) },
  { text: LINKED_CODE.slice(linkStart, linkEnd), href: LINK_URL },
  { text: LINKED_CODE.slice(linkEnd) },
];

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
