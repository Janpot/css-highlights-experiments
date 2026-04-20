'use client';
import { ReactNode, useRef } from 'react';
import { useCodeBlock, useDecodedRanges } from '@/lib/useCodeBlock';
import type { EncodedRanges } from '@/lib/rangesCodec';

interface Props {
  code: ReactNode;
  ranges: EncodedRanges;
}

export default function CodeBlock({ code, ranges }: Props) {
  const ref = useRef<HTMLElement>(null);
  const decoded = useDecodedRanges(ranges);
  useCodeBlock(ref, decoded);
  return (
    <pre>
      <code ref={ref}>{code}</code>
    </pre>
  );
}
