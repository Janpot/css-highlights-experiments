import { SHORT_CODE, MEDIUM_CODE, CSS_CODE, makeLongCode } from '@/lib/samples';

export const dynamic = 'force-static';

export default function Page() {
  return (
    <>
      <h1>Plain text</h1>
      <p>
        Baseline: no highlighting at all, just{' '}
        <code>&lt;pre&gt;&lt;code&gt;</code>. Use this to compare RSC payload
        size and rendering cost against the highlighted variants.
      </p>
      <section>
        <h2>Short</h2>
        <pre>
          <code>{SHORT_CODE}</code>
        </pre>
      </section>
      <section>
        <h2>Medium</h2>
        <pre>
          <code>{MEDIUM_CODE}</code>
        </pre>
      </section>
      <section>
        <h2>CSS</h2>
        <pre>
          <code>{CSS_CODE}</code>
        </pre>
      </section>
      <section>
        <h2>Long</h2>
        <pre>
          <code>{makeLongCode(40)}</code>
        </pre>
      </section>
    </>
  );
}
