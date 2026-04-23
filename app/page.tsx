import { parser as jsParser } from '@lezer/javascript';
import CodeBlock from '@/components/CodeBlock';

const USAGE_SAMPLE = `import { parser } from '@lezer/javascript';
import CodeBlock from '@/components/CodeBlock';

export default function Page() {
  return (
    <CodeBlock
      code={\`const greeting = 'hello';\`}
      parser={parser}
    />
  );
}`;

const REACTNODE_SAMPLE = `<CodeBlock
  parser={parser}
  code={
    <>
      {\`import { \`}
      <a href="https://lezer.codemirror.net/">parser</a>
      {\` } from '@lezer/javascript';\`}
    </>
  }
/>`;

export default function Home() {
  return (
    <>
      <h1>Lezer + CSS Custom Highlight API</h1>
      <p>
        Syntax highlighting with <code>::highlight()</code>. The DOM stays a
        plain <code>&lt;pre&gt;&lt;code&gt;text&lt;/code&gt;&lt;/pre&gt;</code>;
        token ranges are registered against named highlights.
      </p>

      <h2>Usage</h2>
      <p>
        <code>&lt;CodeBlock&gt;</code> is a server component: it takes the
        source text and a Lezer parser, runs the parser at render time, and
        ships only the resulting token ranges to the client — the parser itself
        never enters the browser bundle.
      </p>
      <CodeBlock code={USAGE_SAMPLE} parser={jsParser} />

      <p>
        <code>code</code> accepts any <code>ReactNode</code>, not just a string.
        The text content is extracted for parsing, while the original nodes are
        rendered inside the <code>&lt;pre&gt;&lt;code&gt;</code> — so you can
        interleave elements like links or regions and they'll still be
        highlighted:
      </p>
      <CodeBlock code={REACTNODE_SAMPLE} parser={jsParser} />
      <p>Which renders as:</p>
      <CodeBlock
        parser={jsParser}
        code={
          <>
            {`import { `}
            <a href="https://lezer.codemirror.net/">parser</a>
            {` } from '@lezer/javascript';`}
          </>
        }
      />

      <h2>Crossing the client boundary</h2>
      <p>
        What actually gets serialized is two fields:
      </p>
      <ul>
        <li>
          <code>classes</code> — a string array of highlight class names (
          <code>lzh-kw</code>, <code>lzh-str</code>, …).
        </li>
        <li>
          <code>tokens</code> — a flat number array, grouped per class:{' '}
          <code>[classIdx, pairCount, Δstart, length, Δstart, length, …]</code>
          . Starts are stored as deltas from the previous token in the same
          class, so the numbers stay small even in long files.
        </li>
      </ul>
      <p>
        The client walks this array and registers each <code>(start, length)</code>{' '}
        pair against the corresponding CSS Custom Highlight — no per-token
        object allocation, no spans in the DOM.
      </p>

      <h2>Demos</h2>
      <ul>
        <li>
          <a href="/plain-text">/plain-text</a> — baseline:{' '}
          <code>&lt;pre&gt;&lt;code&gt;</code> with no highlighting.
        </li>
        <li>
          <a href="/build-time">/build-time</a> — ranges computed in a server
          component at build time; serialized across the client boundary as a
          plain object.
        </li>
        <li>
          <a href="/build-time-compressed">/build-time-compressed</a> — same,
          but ranges are varint+base64 compressed to shrink the RSC payload.
        </li>
        <li>
          <a href="/editor">/editor</a> — <code>contenteditable</code> with live
          re-parsing, optional incremental parsing.
        </li>
        <li>
          <a href="/mui">/mui</a> — MUI <code>CodeHighlighter</code> (
          <code>@mui/internal-docs-infra</code>) for comparison; uses a classic
          tokens-to-spans approach instead of the CSS Highlight API.
        </li>
      </ul>
    </>
  );
}
