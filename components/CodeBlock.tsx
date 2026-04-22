import type { ReactNode } from 'react';
import { parser } from '@lezer/javascript';
import { computeHighlights } from '@/lib/highlight';
import { encodeRanges } from '@/lib/rangesCodec';
import { extractText } from '@/lib/extractText';
import CodeBlockClient from './CodeBlockClient';

interface Props {
  code: ReactNode;
  compressed?: boolean;
}

export default function CodeBlock({ code, compressed = false }: Props) {
  const ranges = computeHighlights(parser, extractText(code));
  return (
    <CodeBlockClient
      code={code}
      ranges={compressed ? encodeRanges(ranges) : ranges}
      compressed={compressed}
    />
  );
}
