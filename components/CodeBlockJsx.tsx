import type { ReactNode } from 'react';
import type { Parser } from '@lezer/common';
import { computeHighlights } from '@/lib/highlight';
import { extractText } from '@/lib/extractText';
import { segmentsFromRanges } from '@/lib/spansFromRanges';

interface Props {
  code: ReactNode;
  parser: Parser;
}

export default function CodeBlockJsx({ code, parser }: Props) {
  const text = extractText(code);
  const ranges = computeHighlights(parser, text);
  const segments = segmentsFromRanges(text, ranges);
  return (
    <pre>
      <code className="lzh-root">
        {segments.map((s, i) =>
          s.cls ? (
            <span key={i} className={s.cls}>
              {s.text}
            </span>
          ) : (
            s.text
          ),
        )}
      </code>
    </pre>
  );
}
