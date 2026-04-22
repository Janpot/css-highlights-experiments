import { type ReactNode } from 'react';

const URL_RE = /https?:\/\/[^\s'"<>()]+/g;
const TRAILING_PUNCT = /[.,;:!?)\]}]+$/;
const REGION_START = /^[ \t]*\/\/ @region-start\s+(\S+)[ \t]*$/;
const REGION_END = /^[ \t]*\/\/ @region-end\s+(\S+)[ \t]*$/;

function linkify(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  URL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(text))) {
    const start = m.index;
    let url = m[0];
    const trailing = TRAILING_PUNCT.exec(url);
    if (trailing) url = url.slice(0, -trailing[0].length);
    const end = start + url.length;
    if (start > last) out.push(text.slice(last, start));
    out.push(
      <a
        key={`${keyPrefix}-${key++}`}
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        {url}
      </a>,
    );
    last = end;
    URL_RE.lastIndex = end;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

interface Frame {
  className: string | null;
  buffer: string;
  children: ReactNode[];
  key: number;
}

function flush(frame: Frame, keySeed: number) {
  if (!frame.buffer) return;
  frame.children.push(...linkify(frame.buffer, `k${frame.key}-${keySeed}`));
  frame.buffer = '';
}

export function enhance(code: string): ReactNode {
  const lines = code.split('\n');
  const root: Frame = { className: null, buffer: '', children: [], key: 0 };
  const stack: Frame[] = [root];
  let keyCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isLast = i === lines.length - 1;

    const start = REGION_START.exec(line);
    if (start) {
      flush(stack[stack.length - 1], i);
      stack.push({
        className: start[1],
        buffer: '',
        children: [],
        key: keyCounter++,
      });
      continue;
    }

    const end = REGION_END.exec(line);
    if (end) {
      const frame = stack.pop();
      if (!frame || frame.className !== end[1] || stack.length === 0) {
        throw new Error(
          `Mismatched @region-end for "${end[1]}" at line ${i + 1}`,
        );
      }
      flush(frame, i);
      const parent = stack[stack.length - 1];
      parent.children.push(
        <div key={`rg-${frame.key}`} className={frame.className!}>
          {frame.children}
        </div>,
      );
      continue;
    }

    const current = stack[stack.length - 1];
    current.buffer += line;
    if (!isLast) current.buffer += '\n';
  }

  if (stack.length !== 1) {
    throw new Error(`Unclosed @region-start: "${stack[stack.length - 1].className}"`);
  }

  flush(root, lines.length);
  return <>{root.children}</>;
}
