'use client';
import { useMemo, useRef } from 'react';
import { parser } from '@lezer/javascript';
import { computeHighlights } from '@/lib/highlight';
import { useCodeBlock } from '@/lib/useCodeBlock';

export default function CodeBlock({ code }: { code: string }) {
  const ref = useRef<HTMLElement>(null);
  const ranges = useMemo(() => computeHighlights(parser, code), [code]);
  useCodeBlock(ref, { code, ranges });
  return (
    <pre>
      <code ref={ref}>{code}</code>
    </pre>
  );
}
