import { SHORT_CODE, MEDIUM_CODE, makeLongCode } from '@/lib/samples';

export const dynamic = 'force-static';

export default function Page() {
  const blocks = [
    { title: 'Short', code: SHORT_CODE },
    { title: 'Medium', code: MEDIUM_CODE },
    { title: 'Long', code: makeLongCode(40) },
  ];

  return (
    <>
      <h1>Plain text</h1>
      <p>
        Baseline: no highlighting at all, just{' '}
        <code>&lt;pre&gt;&lt;code&gt;</code>. Use this to compare RSC payload
        size and rendering cost against the highlighted variants.
      </p>
      {blocks.map((b, i) => (
        <section key={i}>
          <h2>{b.title}</h2>
          <pre>
            <code>{b.code}</code>
          </pre>
        </section>
      ))}
    </>
  );
}
