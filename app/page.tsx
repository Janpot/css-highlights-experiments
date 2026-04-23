import { parser as jsParser } from "@lezer/javascript";
import CodeBlock from "@/components/CodeBlock";
import { computeHtmlSizes } from "@/lib/compareSizes";
import { MEDIUM_CODE } from "@/lib/samples";

const tsxParser = jsParser.configure({ dialect: "jsx ts" });

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

interface Row {
  variant: string;
  href: string;
  ssrHtml: "plain" | "spans";
  serverHighlight: boolean;
  support: "widely" | "baseline-2026";
  initialHighlighted: boolean;
  interactivity: string;
}

interface Group {
  label: string;
  rows: Row[];
}

const GROUPS: Group[] = [
  {
    label: "No highlighting",
    rows: [
      {
        variant: "/plain-text",
        href: "/plain-text",
        ssrHtml: "plain",
        serverHighlight: false,
        support: "widely",
        initialHighlighted: false,
        interactivity: "React components",
      },
    ],
  },
  {
    label: "CSS Custom Highlight API",
    rows: [
      {
        variant: "/build-time",
        href: "/build-time",
        ssrHtml: "plain",
        serverHighlight: true,
        support: "baseline-2026",
        initialHighlighted: false,
        interactivity: "React components",
      },
      {
        variant: "/build-time-compressed",
        href: "/build-time-compressed",
        ssrHtml: "plain",
        serverHighlight: true,
        support: "baseline-2026",
        initialHighlighted: false,
        interactivity: "React components",
      },
    ],
  },
  {
    label: "Span-based",
    rows: [
      {
        variant: "/html-string",
        href: "/html-string",
        ssrHtml: "spans",
        serverHighlight: true,
        support: "widely",
        initialHighlighted: true,
        interactivity: "event delegation",
      },
      {
        variant: "/html-string-hydrated",
        href: "/html-string-hydrated",
        ssrHtml: "plain",
        serverHighlight: true,
        support: "widely",
        initialHighlighted: false,
        interactivity: "event delegation",
      },
      {
        variant: "/jsx-spans",
        href: "/jsx-spans",
        ssrHtml: "spans",
        serverHighlight: true,
        support: "widely",
        initialHighlighted: true,
        interactivity: "React components",
      },
      {
        variant: "/mui",
        href: "/mui",
        ssrHtml: "plain",
        serverHighlight: true,
        support: "widely",
        initialHighlighted: false,
        interactivity: "React components",
      },
    ],
  },
];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

function YesNo({ value }: { value: boolean }) {
  return (
    <span
      className={value ? "yn yn-yes" : "yn yn-no"}
      aria-label={value ? "yes" : "no"}
    >
      {value ? "✓" : "✕"}
    </span>
  );
}

export default function Home() {
  const sizes = computeHtmlSizes(MEDIUM_CODE);
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
        ships only the resulting token ranges to the client - the parser itself
        never enters the browser bundle.
      </p>
      <CodeBlock code={USAGE_SAMPLE} parser={tsxParser} />

      <p>
        <code>code</code> accepts any <code>ReactNode</code>, not just a string.
        The text content is extracted for parsing, while the original nodes are
        rendered inside the <code>&lt;pre&gt;&lt;code&gt;</code> - so you can
        interleave elements like links or regions and they'll still be
        highlighted:
      </p>
      <CodeBlock code={REACTNODE_SAMPLE} parser={tsxParser} />
      <p>Which renders as:</p>
      <CodeBlock
        parser={tsxParser}
        code={
          <>
            {`import { `}
            <a href="https://lezer.codemirror.net/">parser</a>
            {` } from '@lezer/javascript';`}
          </>
        }
      />

      <h2>Crossing the client boundary</h2>
      <p>What actually gets serialized is two fields:</p>
      <ul>
        <li>
          <code>classes</code> - a string array of highlight class names (
          <code>lzh-kw</code>, <code>lzh-str</code>, …).
        </li>
        <li>
          <code>tokens</code> - a flat number array, grouped per class:{" "}
          <code>[classIdx, pairCount, Δstart, length, Δstart, length, …]</code>.
          Starts are stored as deltas from the previous token in the same class,
          so the numbers stay small even in long files.
        </li>
      </ul>
      <p>
        The client walks this array and registers each{" "}
        <code>(start, length)</code> pair against the corresponding CSS Custom
        Highlight - no per-token object allocation, no spans in the DOM.
      </p>

      <h2>Demos</h2>
      <ul>
        <li>
          <a href="/plain-text">/plain-text</a> - baseline:{" "}
          <code>&lt;pre&gt;&lt;code&gt;</code> with no highlighting.
        </li>
        <li>
          <a href="/build-time">/build-time</a> - ranges computed in a server
          component at build time; serialized across the client boundary as a
          plain object.
        </li>
        <li>
          <a href="/build-time-compressed">/build-time-compressed</a> - same,
          but ranges are varint+base64 compressed to shrink the RSC payload.
        </li>
        <li>
          <a href="/html-string">/html-string</a> - server component emits an
          HTML string of <code>&lt;span class=&quot;lzh-*&quot;&gt;</code>{" "}
          tokens via <code>dangerouslySetInnerHTML</code>.
        </li>
        <li>
          <a href="/jsx-spans">/jsx-spans</a> - server component returns the
          same spans as nested JSX children of <code>&lt;code&gt;</code>.
        </li>
        <li>
          <a href="/html-string-hydrated">/html-string-hydrated</a> - server
          generates the highlighted HTML string and ships it as a prop; SSR
          renders plain text, the client swaps in the highlighted HTML after
          hydration.
        </li>
        <li>
          <a href="/editor">/editor</a> - <code>contenteditable</code> with live
          re-parsing, optional incremental parsing.
        </li>
        <li>
          <a href="/mui">/mui</a> - MUI <code>CodeHighlighter</code> (
          <code>@mui/internal-docs-infra</code>) for comparison. Uses{" "}
          <a
            href="https://github.com/wooorm/starry-night"
            target="_blank"
            rel="noopener noreferrer"
          >
            starry-night
          </a>{" "}
          to generate HAST on the server, compresses it with a custom DEFLATE
          encoding to cross the client boundary, renders plain text during SSR,
          and expands the HAST into tokens-to-spans after hydration.
        </li>
      </ul>

      <h2>Comparison</h2>
      <p>
        SSR HTML byte counts are measured for the <code>MEDIUM_CODE</code>{" "}
        sample, counting only the{" "}
        <code>&lt;pre&gt;&lt;code&gt;…&lt;/code&gt;</code>
        markup emitted during SSR (not the RSC payload or hydration data).
      </p>
      <table>
        <thead>
          <tr>
            <th>Variant</th>
            <th>Uncompressed HTML</th>
            <th>gzip HTML</th>
            <th>Server-side highlighting</th>
            <th>Browser support</th>
            <th>Initial HTML highlighted</th>
            <th>Interactivity</th>
          </tr>
        </thead>
        {GROUPS.map((g) => (
          <tbody key={g.label}>
            <tr>
              <th colSpan={7} scope="colgroup">
                {g.label}
              </th>
            </tr>
            {g.rows.map((r) => {
              const s = r.ssrHtml === "spans" ? sizes.spans : sizes.plain;
              return (
                <tr key={r.variant}>
                  <td>
                    <a href={r.href}>{r.variant}</a>
                  </td>
                  <td>{formatBytes(s.raw)}</td>
                  <td>{formatBytes(s.gz)}</td>
                  <td>
                    <YesNo value={r.serverHighlight} />
                  </td>
                  <td>
                    {r.support === "widely"
                      ? "widely available"
                      : "Baseline 2026"}
                  </td>
                  <td>
                    <YesNo value={r.initialHighlighted} />
                  </td>
                  <td>{r.interactivity}</td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>

      <h2>Trade-offs of the CSS Custom Highlight API</h2>
      <ul>
        <li>
          A token is assigned to a single highlight - you can't combine class
          styles the way you would with stacked <code>className</code>s on a
          span. Slight mental-model shift: pick one class per range.
        </li>
        <li>
          <code>::highlight()</code> only supports a limited set of CSS
          properties (colors, backgrounds, <code>text-decoration</code>, a few
          others - see{" "}
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::highlight"
            target="_blank"
            rel="noopener noreferrer"
          >
            MDN
          </a>
          ). No <code>font-weight</code>, no <code>font-style</code>, no custom
          markers - so bold keywords or italic comments aren't available.
        </li>
      </ul>
    </>
  );
}
