import type { ReactNode } from 'react';
import { parser } from '@lezer/javascript';
import { computeHighlights } from '@/lib/highlight';
import { flattenRanges } from '@/lib/rangesCodec';
import CodeBlock from './CodeBlock';
import {
  SHORT_CODE,
  MEDIUM_CODE,
  LINKED_CODE,
  makeLongCode,
} from '../build-time/samples';

export const dynamic = 'force-static';

const URL_RE = /https?:\/\/[^\s'"<>()]+/g;
const TRAILING_PUNCT = /[.,;:!?)\]}]+$/;

function linkify(code: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(code))) {
    const start = m.index;
    let url = m[0];
    const trailing = TRAILING_PUNCT.exec(url);
    if (trailing) url = url.slice(0, -trailing[0].length);
    const end = start + url.length;
    if (start > last) out.push(code.slice(last, start));
    out.push(
      <a key={key++} href={url} target="_blank" rel="noreferrer">
        {url}
      </a>,
    );
    last = end;
    URL_RE.lastIndex = end;
  }
  if (out.length === 0) return code;
  if (last < code.length) out.push(code.slice(last));
  return <>{out}</>;
}

interface Block {
  title: string;
  code: string;
  enhance?: (code: string) => ReactNode;
}

export default function Page() {
  const longCode = makeLongCode(40);
  const blocks: Block[] = [
    { title: 'Short', code: SHORT_CODE },
    { title: 'Medium', code: MEDIUM_CODE },
    {
      title: 'With a nested link',
      code: LINKED_CODE,
      enhance: linkify,
    },
    { title: 'Long (viewport-only)', code: longCode },
  ];
  const prepared = blocks.map((b) => ({
    ...b,
    ranges: flattenRanges(computeHighlights(parser, b.code)),
  }));

  return (
    <>
      <h1>Build-time highlighting (uncompressed)</h1>
      <p>
        Same as <a href="/build-time">/build-time</a>, but the flattened ranges
        (class list + token number array) are serialized by React as-is across
        the client boundary — no varint / base64 packing. Compare the RSC
        payload size to the compressed version.
      </p>
      {prepared.map((b, i) => (
        <section key={i}>
          <h2>{b.title}</h2>
          <CodeBlock
            code={b.enhance ? b.enhance(b.code) : b.code}
            ranges={b.ranges}
          />
        </section>
      ))}
    </>
  );
}
