import { Code } from './Code';
import {
  SHORT_CODE,
  MEDIUM_CODE,
  LINKED_CODE,
  makeLongCode,
} from '@/lib/samples';

export const dynamic = 'force-static';

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
        <h2>Linked</h2>
        <Code fileName="linked.js">{LINKED_CODE}</Code>
      </section>
      <section>
        <h2>Long</h2>
        <Code fileName="long.js">{makeLongCode(40)}</Code>
      </section>
    </>
  );
}
