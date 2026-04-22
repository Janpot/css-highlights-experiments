import type { ReactNode } from 'react';
import type { Parser } from '@lezer/common';
import { computeHighlights } from '@/lib/highlight';
import { encodeRanges } from '@/lib/rangesCodec';
import { extractText } from '@/lib/extractText';
import type { RangesData } from '@/lib/rangesCodec';
import CodeBlockClient from './CodeBlockClient';

interface Props {
  code: ReactNode;
  parser?: Parser;
  compressed?: boolean;
}

const EMPTY_RANGES: RangesData = { classes: [], tokens: [] };

export default function CodeBlock({ code, parser, compressed = false }: Props) {
  const ranges = parser
    ? computeHighlights(parser, extractText(code))
    : EMPTY_RANGES;
  return (
    <CodeBlockClient
      code={code}
      ranges={compressed ? encodeRanges(ranges) : ranges}
      compressed={compressed}
    />
  );
}
