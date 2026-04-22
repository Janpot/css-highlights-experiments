'use client';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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

interface Props {
  value: string;
  onChange: (next: string) => void;
  incremental?: boolean;
}

export default function EditableCodeBlock({
  value,
  onChange,
  incremental = false,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const parseStateRef = useRef<ParseState | null>(null);
  const [ranges, setRanges] = useState<RangesData>(() =>
    computeHighlights(parser, value),
  );

  const initialHtml = useMemo(
    () => ({ __html: escapeHtml(value) }),
    // Initial DOM content only; later external updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useCodeBlock(ref, ranges);

  useEffect(() => {
    parseStateRef.current = null;
  }, [incremental]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if ((el.textContent ?? '') === value) return;
    el.textContent = value;
    parseStateRef.current = null;
    setRanges(computeHighlights(parser, value));
  }, [value]);

  function handleInput(e: FormEvent<HTMLElement>) {
    const nextCode = e.currentTarget.textContent ?? '';
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
    setRanges(nextRanges);
    onChange(nextCode);
  }

  return (
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
  );
}
