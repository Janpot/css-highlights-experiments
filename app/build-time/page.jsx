import { parser } from '@lezer/javascript';
import { computeHighlights } from '@/lib/highlight';
import CodeBlock from './CodeBlock';
import {
  SHORT_CODE,
  MEDIUM_CODE,
  LINKED_CODE,
  LINKED_SEGMENTS,
  makeLongCode,
} from './samples';

export const dynamic = 'force-static';

export default function Page() {
  const longCode = makeLongCode(40);
  const blocks = [
    { title: 'Short', code: SHORT_CODE },
    { title: 'Medium', code: MEDIUM_CODE },
    {
      title: 'With a nested link',
      code: LINKED_CODE,
      segments: LINKED_SEGMENTS,
    },
    { title: 'Long (viewport-only)', code: longCode },
  ].map((b) => ({ ...b, ranges: computeHighlights(parser, b.code) }));

  return (
    <>
      <h1>Build-time highlighting</h1>
      <p>
        Server component parses the code at build time and passes a compact
        ranges array across the client boundary. The parser never ships to the
        browser.
      </p>
      {blocks.map((b, i) => (
        <section key={i}>
          <h2>{b.title}</h2>
          <CodeBlock code={b.code} ranges={b.ranges} segments={b.segments} />
        </section>
      ))}
    </>
  );
}
