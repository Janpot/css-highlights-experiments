import type { ReactNode } from 'react';
import type { Parser } from '@lezer/common';
import { computeHighlights } from '@/lib/highlight';
import { extractText } from '@/lib/extractText';
import {
  segmentsFromRanges,
  htmlFromSegments,
} from '@/lib/spansFromRanges';

interface Props {
  code: ReactNode;
  parser: Parser;
}

export default function CodeBlockHtml({ code, parser }: Props) {
  const text = extractText(code);
  const ranges = computeHighlights(parser, text);
  const html = htmlFromSegments(segmentsFromRanges(text, ranges));
  return (
    <pre>
      <code
        className="lzh-root"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </pre>
  );
}
