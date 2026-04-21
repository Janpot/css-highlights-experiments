'use client';
import { ReactNode, useRef } from 'react';
import { useCodeBlock } from '@/lib/useCodeBlock';
import type { RangesData } from '@/lib/rangesCodec';

interface Props {
  code: ReactNode;
  ranges: RangesData;
}

export default function CodeBlock({ code, ranges }: Props) {
  const ref = useRef<HTMLElement>(null);
  useCodeBlock(ref, ranges);
  return (
    <pre>
      <code ref={ref}>{code}</code>
    </pre>
  );
}
