'use client';
import { ReactNode, useMemo, useRef } from 'react';
import { useCodeBlock } from '@/lib/useCodeBlock';
import {
  decodeRanges,
  type EncodedRanges,
  type RangesData,
} from '@/lib/rangesCodec';

interface Props {
  code: ReactNode;
  ranges: RangesData | EncodedRanges;
  compressed: boolean;
}

export default function CodeBlockClient({ code, ranges, compressed }: Props) {
  const decoded = useMemo(
    () =>
      compressed
        ? decodeRanges(ranges as EncodedRanges)
        : (ranges as RangesData),
    [ranges, compressed],
  );
  const ref = useRef<HTMLElement>(null);
  useCodeBlock(ref, decoded);
  return (
    <pre>
      <code ref={ref}>{code}</code>
    </pre>
  );
}
