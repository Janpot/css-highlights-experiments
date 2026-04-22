'use client';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { Parser } from '@lezer/common';
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

const EMPTY_RANGES: RangesData = { classes: [], tokens: [] };

function highlight(parser: Parser | undefined, code: string): RangesData {
  return parser ? computeHighlights(parser, code) : EMPTY_RANGES;
}

interface Props {
  value: string;
  onChange: (next: string) => void;
  parser?: Parser;
  incremental?: boolean;
}

export default function EditableCodeBlock({
  value,
  onChange,
  parser,
  incremental = false,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const parseStateRef = useRef<ParseState | null>(null);
  const [ranges, setRanges] = useState<RangesData>(() =>
    highlight(parser, value),
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
  }, [incremental, parser]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if ((el.textContent ?? '') === value) return;
    el.textContent = value;
    parseStateRef.current = null;
    setRanges(highlight(parser, value));
  }, [value, parser]);

  function handleInput(e: FormEvent<HTMLElement>) {
    const nextCode = e.currentTarget.textContent ?? '';
    let nextRanges: RangesData;
    if (parser && incremental) {
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
      nextRanges = highlight(parser, nextCode);
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
