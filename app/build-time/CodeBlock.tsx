'use client';
import { useRef } from 'react';
import { useCodeBlock } from '@/lib/useCodeBlock';
import type { CompactRange } from '@/lib/highlight';
import type { Segment } from './samples';

interface Props {
  code: string;
  ranges: CompactRange[];
  segments?: Segment[];
}

export default function CodeBlock({ code, ranges, segments }: Props) {
  const ref = useRef<HTMLElement>(null);
  useCodeBlock(ref, { code, ranges });
  return (
    <pre>
      <code ref={ref}>
        {segments
          ? segments.map((seg, i) =>
              seg.href ? (
                <a key={i} href={seg.href} target="_blank" rel="noreferrer">
                  {seg.text}
                </a>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )
          : code}
      </code>
    </pre>
  );
}
