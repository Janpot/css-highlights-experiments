'use client';
import { useRef } from 'react';
import { useCodeBlock, useDecodedRanges } from '@/lib/useCodeBlock';
import type { EncodedRanges } from '@/lib/rangesCodec';
import type { Segment } from './samples';

interface Props {
  code: string;
  ranges: EncodedRanges;
  segments?: Segment[];
}

export default function CodeBlock({ code, ranges, segments }: Props) {
  const ref = useRef<HTMLElement>(null);
  const decoded = useDecodedRanges(ranges);
  useCodeBlock(ref, decoded);
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
