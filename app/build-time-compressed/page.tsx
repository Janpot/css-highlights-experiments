import type { Metadata } from 'next';
import { parser as jsParser } from '@lezer/javascript';
import { parser as cssParser } from '@lezer/css';
import CodeBlock from '@/components/CodeBlock';
import { enhance } from '@/lib/enhance';
import {
  SHORT_CODE,
  MEDIUM_CODE,
  LINKED_CODE,
  CSS_CODE,
  makeLongCode,
} from '@/lib/samples';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Build-time highlighting (compressed)',
};

export default function Page() {
  return (
    <>
      <h1>Build-time highlighting (compressed)</h1>
      <p>
        Same as <a href="/build-time">/build-time</a>, but with compression: the
        ranges are varint-packed and base64-encoded before crossing the client
        boundary, and decoded in the browser. Compare the RSC payload size.
      </p>
      <section>
        <h2>Short</h2>
        <CodeBlock code={SHORT_CODE} parser={jsParser} compressed />
      </section>
      <section>
        <h2>Medium</h2>
        <CodeBlock code={MEDIUM_CODE} parser={jsParser} compressed />
      </section>
      <section>
        <h2>Enhanced (links + regions)</h2>
        <CodeBlock code={enhance(LINKED_CODE)} parser={jsParser} compressed />
      </section>
      <section>
        <h2>CSS</h2>
        <CodeBlock code={CSS_CODE} parser={cssParser} compressed />
      </section>
      <section>
        <h2>Long</h2>
        <CodeBlock code={makeLongCode(40)} parser={jsParser} compressed />
      </section>
    </>
  );
}
