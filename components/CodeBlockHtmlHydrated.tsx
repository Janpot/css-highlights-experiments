import type { ReactNode } from 'react';
import type { Parser } from '@lezer/common';
import { computeHighlights } from '@/lib/highlight';
import { extractText } from '@/lib/extractText';
import {
  segmentsFromRanges,
  htmlFromSegments,
} from '@/lib/spansFromRanges';
import CodeBlockHtmlHydratedClient from './CodeBlockHtmlHydratedClient';

interface Props {
  code: ReactNode;
  parser: Parser;
}

export default function CodeBlockHtmlHydrated({ code, parser }: Props) {
  const text = extractText(code);
  const ranges = computeHighlights(parser, text);
  const html = htmlFromSegments(segmentsFromRanges(text, ranges));
  return <CodeBlockHtmlHydratedClient code={text} html={html} />;
}
