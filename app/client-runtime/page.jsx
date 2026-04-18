import CodeBlock from './CodeBlock';
import { SHORT_CODE, MEDIUM_CODE, makeLongCode } from '../build-time/samples';

export const dynamic = 'force-static';

export default function Page() {
  const blocks = [
    { title: 'Short', code: SHORT_CODE },
    { title: 'Medium', code: MEDIUM_CODE },
    { title: 'Long (viewport-only)', code: makeLongCode(40) },
  ];

  return (
    <>
      <h1>Client-runtime highlighting</h1>
      <p>
        The server ships only the raw code string. The Lezer parser runs in the
        browser on mount. Compare the Network payload size with{' '}
        <a href="/build-time">/build-time</a>.
      </p>
      {blocks.map((b, i) => (
        <section key={i}>
          <h2>{b.title}</h2>
          <CodeBlock code={b.code} />
        </section>
      ))}
    </>
  );
}
