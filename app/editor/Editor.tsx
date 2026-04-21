'use client';
import { FormEvent, useMemo, useRef, useState } from 'react';
import { parser } from '@lezer/javascript';
import {
  computeHighlights,
  rangesFromTree,
  parseIncremental,
  applyEdit,
  type ParseState,
} from '@/lib/highlight';
import { useCodeBlock } from '@/lib/useCodeBlock';
import type { RangesData } from '@/lib/rangesCodec';

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export default function Editor({ initialCode }: { initialCode: string }) {
  const ref = useRef<HTMLElement>(null);
  const [incremental, setIncremental] = useState(true);
  const [code, setCode] = useState(initialCode);
  const [ranges, setRanges] = useState<RangesData>(() =>
    computeHighlights(parser, initialCode),
  );
  const [lastParseMs, setLastParseMs] = useState<number | null>(null);

  const parseStateRef = useRef<ParseState | null>(null);

  const initialHtml = useMemo(
    () => ({ __html: escapeHtml(initialCode) }),
    [initialCode],
  );

  useCodeBlock(ref, ranges);

  function handleInput(e: FormEvent<HTMLElement>) {
    const nextCode = e.currentTarget.textContent ?? '';
    const t0 = performance.now();
    let nextRanges: RangesData;
    if (incremental) {
      const state = parseStateRef.current;
      if (!state) {
        const { tree, fragments } = parseIncremental(parser, nextCode);
        parseStateRef.current = { code: nextCode, fragments };
        nextRanges = rangesFromTree(tree, nextCode);
      } else {
        const edited = applyEdit(state, nextCode);
        const { tree, fragments } = parseIncremental(
          parser,
          nextCode,
          edited.fragments,
        );
        parseStateRef.current = { code: nextCode, fragments };
        nextRanges = rangesFromTree(tree, nextCode);
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
