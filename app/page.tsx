import { parser as jsParser } from "@lezer/javascript";
import CodeBlock from "@/components/CodeBlock";
import pageSizes from "@/data/pageSizes.json";

interface WebVitals {
  ttfb: number | null;
  fcp: number | null;
  lcp: number | null;
  inp: number | null;
  cls: number | null;
}
interface TimingBucket {
  scripting: number | null;
  layout: number | null;
  paint: number | null;
}
interface Timings {
  before: TimingBucket;
  after: TimingBucket;
}
interface PageSize {
  compressed: number;
  uncompressed: number;
  encoding: string | null;
  webVitals?: WebVitals;
  timings?: Timings;
}
const sizeMap = (pageSizes as unknown as { pages: Record<string, PageSize> })
  .pages;
const measuredAt = (pageSizes as { measuredAt: string | null }).measuredAt;

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
  serverHighlight: boolean | null;
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
        serverHighlight: null,
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
        serverHighlight: true,
        support: "baseline-2026",
        initialHighlighted: false,
        interactivity: "React components",
      },
      {
        variant: "/build-time-compressed",
        href: "/build-time-compressed",
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
        serverHighlight: true,
        support: "widely",
        initialHighlighted: true,
        interactivity: "event delegation",
      },
      {
        variant: "/html-string-hydrated",
        href: "/html-string-hydrated",
        serverHighlight: true,
        support: "widely",
        initialHighlighted: false,
        interactivity: "event delegation",
      },
      {
        variant: "/jsx-spans",
        href: "/jsx-spans",
        serverHighlight: true,
        support: "widely",
        initialHighlighted: true,
        interactivity: "React components",
      },
      {
        variant: "/mui",
        href: "/mui",
        serverHighlight: true,
        support: "widely",
        initialHighlighted: false,
        interactivity: "React components",
      },
    ],
  },
];

const byteFormatter = new Intl.NumberFormat("en-US", {
  style: "unit",
  unit: "byte",
  unitDisplay: "narrow",
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatBytes(n: number): string {
  return byteFormatter.format(n);
}

function formatMs(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n < 10) return n.toFixed(1);
  return Math.round(n).toLocaleString();
}

function formatCls(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toFixed(3);
}

const METRIC_KEYS = [
  "uncompressed",
  "compressed",
  "ttfb",
  "fcp",
  "lcp",
  "inp",
  "cls",
  "before.scripting",
  "before.layout",
  "before.paint",
  "after.scripting",
  "after.layout",
  "after.paint",
] as const;
type MetricKey = (typeof METRIC_KEYS)[number];

function getMetric(href: string, key: MetricKey): number | null {
  const s = sizeMap[href];
  if (!s) return null;
  switch (key) {
    case "uncompressed":
      return s.uncompressed;
    case "compressed":
      return s.compressed;
    case "ttfb":
      return s.webVitals?.ttfb ?? null;
    case "fcp":
      return s.webVitals?.fcp ?? null;
    case "lcp":
      return s.webVitals?.lcp ?? null;
    case "inp":
      return s.webVitals?.inp ?? null;
    case "cls":
      return s.webVitals?.cls ?? null;
    case "before.scripting":
      return s.timings?.before?.scripting ?? null;
    case "before.layout":
      return s.timings?.before?.layout ?? null;
    case "before.paint":
      return s.timings?.before?.paint ?? null;
    case "after.scripting":
      return s.timings?.after?.scripting ?? null;
    case "after.layout":
      return s.timings?.after?.layout ?? null;
    case "after.paint":
      return s.timings?.after?.paint ?? null;
  }
}

const allHrefs = GROUPS.flatMap((g) => g.rows.map((r) => r.href)).filter(
  (h) => h !== "/plain-text",
);
const extremes: Record<MetricKey, { min: number; max: number } | null> =
  Object.fromEntries(
    METRIC_KEYS.map((key) => {
      const values = allHrefs
        .map((h) => getMetric(h, key))
        .filter((v): v is number => v != null);
      if (values.length < 2) return [key, null];
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (min === max) return [key, null];
      return [key, { min, max }];
    }),
  ) as Record<MetricKey, { min: number; max: number } | null>;

function numCellProps(
  href: string,
  key: MetricKey,
): { className: string; style?: React.CSSProperties } {
  if (!allHrefs.includes(href)) return { className: "num" };
  const v = getMetric(href, key);
  const ex = extremes[key];
  if (v == null || !ex) return { className: "num" };
  const t = (v - ex.min) / (ex.max - ex.min);
  return {
    className: "num num-scale",
    style: { "--t": t.toFixed(4) } as React.CSSProperties,
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Heading({ as: Tag, children }: { as: "h2" | "h3"; children: string }) {
  const id = slugify(children);
  return (
    <Tag id={id}>
      <a href={`#${id}`} className="anchor-link">
        {children}
      </a>
    </Tag>
  );
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
  return (
    <>
      <h1>Lezer + CSS Custom Highlight API</h1>
      <p>
        Syntax highlighting with <code>::highlight()</code>. The DOM stays a
        plain <code>&lt;pre&gt;&lt;code&gt;text&lt;/code&gt;&lt;/pre&gt;</code>;
        token ranges are registered against named highlights.
      </p>

      <Heading as="h2">Usage</Heading>
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

      <Heading as="h2">Crossing the client boundary</Heading>
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

      <Heading as="h2">Demos</Heading>
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

      <Heading as="h2">Comparison</Heading>
      <p>
        Sizes are real HTTP response bodies. <code>pnpm measure</code> runs{" "}
        <code>next build</code>, starts <code>next start</code> on port 3100,
        requests each variant with{" "}
        <code>Accept-Encoding: gzip, deflate, br</code>, and records the bytes
        received over the wire (compressed) and after decoding (uncompressed)
        into <code>data/pageSizes.json</code>. Pass a base URL (e.g.{" "}
        <code>pnpm measure https://example.com</code>) to skip the build and
        measure an already-running server instead.
        {measuredAt ? ` Last measured ${measuredAt}.` : " Not yet measured."}
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th rowSpan={2}>Variant</th>
              <th className="num" rowSpan={2}>
                Uncompressed HTML
              </th>
              <th className="num" rowSpan={2}>
                Compressed HTML
              </th>
              <th className="num" rowSpan={2}>
                TTFB (ms)
              </th>
              <th className="num" rowSpan={2}>
                FCP (ms)
              </th>
              <th className="num" rowSpan={2}>
                LCP (ms)
              </th>
              <th className="num" rowSpan={2}>
                INP (ms)
              </th>
              <th className="num" rowSpan={2}>
                CLS
              </th>
              <th className="num" colSpan={3} scope="colgroup">
                Before scroll (ms)
              </th>
              <th className="num" colSpan={3} scope="colgroup">
                After scroll (ms)
              </th>
              <th className="yn-cell" rowSpan={2}>
                Server-side highlighting
              </th>
              <th rowSpan={2}>Browser support</th>
              <th className="yn-cell" rowSpan={2}>
                Initial HTML highlighted
              </th>
              <th rowSpan={2}>Interactivity</th>
            </tr>
            <tr>
              <th className="num">Script</th>
              <th className="num">Layout</th>
              <th className="num">Paint</th>
              <th className="num">Script</th>
              <th className="num">Layout</th>
              <th className="num">Paint</th>
            </tr>
          </thead>
          {GROUPS.map((g) => {
            const groupId = `group-${slugify(g.label)}`;
            return (
              <tbody key={g.label}>
                <tr>
                  <th id={groupId} colSpan={18} scope="colgroup">
                    <a href={`#${groupId}`} className="anchor-link">
                      {g.label}
                    </a>
                  </th>
                </tr>
                {g.rows.map((r) => {
                  const s = sizeMap[r.href];
                  const wv = s?.webVitals;
                  const t = s?.timings;
                  return (
                    <tr key={r.variant}>
                      <td>
                        <a href={r.href}>{r.variant}</a>
                      </td>
                      <td {...numCellProps(r.href, "uncompressed")}>
                        {s ? formatBytes(s.uncompressed) : "—"}
                      </td>
                      <td {...numCellProps(r.href, "compressed")}>
                        {s
                          ? `${formatBytes(s.compressed)}${s.encoding ? ` (${s.encoding})` : ""}`
                          : "—"}
                      </td>
                      <td {...numCellProps(r.href, "ttfb")}>
                        {formatMs(wv?.ttfb)}
                      </td>
                      <td {...numCellProps(r.href, "fcp")}>
                        {formatMs(wv?.fcp)}
                      </td>
                      <td {...numCellProps(r.href, "lcp")}>
                        {formatMs(wv?.lcp)}
                      </td>
                      <td {...numCellProps(r.href, "inp")}>
                        {formatMs(wv?.inp)}
                      </td>
                      <td {...numCellProps(r.href, "cls")}>
                        {formatCls(wv?.cls)}
                      </td>
                      <td {...numCellProps(r.href, "before.scripting")}>
                        {formatMs(t?.before?.scripting)}
                      </td>
                      <td {...numCellProps(r.href, "before.layout")}>
                        {formatMs(t?.before?.layout)}
                      </td>
                      <td {...numCellProps(r.href, "before.paint")}>
                        {formatMs(t?.before?.paint)}
                      </td>
                      <td {...numCellProps(r.href, "after.scripting")}>
                        {formatMs(t?.after?.scripting)}
                      </td>
                      <td {...numCellProps(r.href, "after.layout")}>
                        {formatMs(t?.after?.layout)}
                      </td>
                      <td {...numCellProps(r.href, "after.paint")}>
                        {formatMs(t?.after?.paint)}
                      </td>
                      <td className="yn-cell">
                        {r.serverHighlight === null ? (
                          "—"
                        ) : (
                          <YesNo value={r.serverHighlight} />
                        )}
                      </td>
                      <td>
                        {r.support === "widely"
                          ? "widely available"
                          : "Baseline 2026"}
                      </td>
                      <td className="yn-cell">
                        <YesNo value={r.initialHighlighted} />
                      </td>
                      <td>{r.interactivity}</td>
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>
      <p style={{ fontSize: "0.9em", opacity: 0.7 }}>
        Web Vitals (TTFB, FCP, LCP, INP, CLS) are collected by{" "}
        <code>pnpm measure</code> via Playwright: each variant is loaded in a
        real Chromium page, <code>useReportWebVitals</code> forwards metrics to
        the Node runner, and a synthetic click + tab keystroke trigger INP. Each
        variant is measured across 20 runs and the table shows the 75th
        percentile. Numbers reflect unthrottled local rendering.
      </p>
      <p style={{ fontSize: "0.9em", opacity: 0.7 }}>
        The Before/After scroll timings come from a Chrome DevTools Protocol{" "}
        <code>Tracing</code> session over the same Playwright run. The page is
        loaded and left to settle, a <code>performance.mark</code> delimits the
        &quot;before scroll&quot; window, the runner scrolls through the page to
        the bottom and back, and a second mark closes the &quot;after
        scroll&quot; window. Trace events are bucketed by self-time into Script
        (JS execution, parsing, compile), Layout (style recalc, layout), and
        Paint (paint, composite, raster) - so you can see how much work each
        variant does at first render vs. during scroll. Each variant runs 20
        times and the table shows the 75th percentile.
      </p>

      <Heading as="h2">Trade-offs of the CSS Custom Highlight API</Heading>
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
