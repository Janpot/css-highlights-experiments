'use client';
import { useMemo, useRef, useState } from 'react';
import { parser } from '@lezer/javascript';
import {
  computeHighlights,
  rangesFromTree,
  parseIncremental,
  applyEdit,
} from '@/lib/highlight';
import { useCodeBlock } from '@/lib/useCodeBlock';

function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export default function Editor({ initialCode }) {
  const ref = useRef(null);
  const [incremental, setIncremental] = useState(true);
  const [code, setCode] = useState(initialCode);
  const [ranges, setRanges] = useState(() => computeHighlights(parser, initialCode));
  const [lastParseMs, setLastParseMs] = useState(null);

  const parseStateRef = useRef(null);

  const initialHtml = useMemo(() => ({ __html: escapeHtml(initialCode) }), [initialCode]);

  useCodeBlock(ref, { code, ranges });

  function handleInput(e) {
    const nextCode = e.currentTarget.textContent ?? '';
    const t0 = performance.now();
    let nextRanges;
    if (incremental) {
      let state = parseStateRef.current;
      if (!state) {
        const { tree, fragments } = parseIncremental(parser, nextCode);
        parseStateRef.current = { code: nextCode, fragments };
        nextRanges = rangesFromTree(tree);
      } else {
        const edited = applyEdit(state, nextCode);
        const { tree, fragments } = parseIncremental(parser, nextCode, edited.fragments);
        parseStateRef.current = { code: nextCode, fragments };
        nextRanges = rangesFromTree(tree);
      }
    } else {
      parseStateRef.current = null;
      nextRanges = computeHighlights(parser, nextCode);
    }
    setLastParseMs(performance.now() - t0);
    setCode(nextCode);
    setRanges(nextRanges);
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <label className="toggle">
          <input
            type="checkbox"
            checked={incremental}
            onChange={(e) => {
              setIncremental(e.target.checked);
              parseStateRef.current = null;
            }}
          />
          incremental parsing
        </label>
        {lastParseMs != null && (
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            last parse: {lastParseMs.toFixed(2)}ms
          </span>
        )}
      </div>
      <pre>
        <code
          ref={ref}
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          spellCheck={false}
          onInput={handleInput}
          dangerouslySetInnerHTML={initialHtml}
        />
      </pre>
    </>
  );
}
