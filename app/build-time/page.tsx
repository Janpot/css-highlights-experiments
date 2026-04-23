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
  title: 'Build-time highlighting',
};

export default function Page() {
  return (
    <>
      <h1>Build-time highlighting</h1>
      <p>
        Server component parses the code at build time and passes the ranges
        array across the client boundary as a plain object. The parser never
        ships to the browser.
      </p>
      <section>
        <h2>Short</h2>
        <CodeBlock code={SHORT_CODE} parser={jsParser} />
      </section>
      <section>
        <h2>Medium</h2>
        <CodeBlock code={MEDIUM_CODE} parser={jsParser} />
      </section>
      <section>
        <h2>Enhanced (links + regions)</h2>
        <CodeBlock code={enhance(LINKED_CODE)} parser={jsParser} />
      </section>
      <section>
        <h2>CSS</h2>
        <CodeBlock code={CSS_CODE} parser={cssParser} />
      </section>
      <section>
        <h2>Long</h2>
        <CodeBlock code={makeLongCode(40)} parser={jsParser} />
      </section>
    </>
  );
}
