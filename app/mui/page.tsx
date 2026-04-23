import type { Metadata } from 'next';
import { Code } from './Code';
import {
  SHORT_CODE,
  MEDIUM_CODE,
  LINKED_CODE,
  CSS_CODE,
  makeLongCode,
} from '@/lib/samples';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'MUI CodeHighlighter',
};

const MUI_LINKED_CODE = LINKED_CODE.replace(
  /^([ \t]*)\/\/ @region-start\s+\S+[ \t]*$/gm,
  '$1// @highlight-start',
).replace(
  /^([ \t]*)\/\/ @region-end\s+\S+[ \t]*$/gm,
  '$1// @highlight-end',
);

export default function Page() {
  return (
    <>
      <h1>MUI CodeHighlighter</h1>
      <p>
        Simple code block integration of{' '}
        <code>@mui/internal-docs-infra</code>. Compare with{' '}
        <a href="/build-time">/build-time</a> (CSS Highlight API).
      </p>
      <section>
        <h2>Short</h2>
        <Code fileName="short.js">{SHORT_CODE}</Code>
      </section>
      <section>
        <h2>Medium</h2>
        <Code fileName="medium.js">{MEDIUM_CODE}</Code>
      </section>
      <section>
        <h2>Enhanced (links + regions)</h2>
        <Code fileName="linked.js">{MUI_LINKED_CODE}</Code>
      </section>
      <section>
        <h2>CSS</h2>
        <Code fileName="styles.css">{CSS_CODE}</Code>
      </section>
      <section>
        <h2>Long</h2>
        <Code fileName="long.js">{makeLongCode(40)}</Code>
      </section>
    </>
  );
}
