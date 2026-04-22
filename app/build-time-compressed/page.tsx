import type { ReactNode } from "react";
import { parser as jsParser } from "@lezer/javascript";
import { parser as cssParser } from "@lezer/css";
import CodeBlock from "@/components/CodeBlock";
import {
  SHORT_CODE,
  MEDIUM_CODE,
  LINKED_CODE,
  CSS_CODE,
  makeLongCode,
} from "@/lib/samples";

export const dynamic = "force-static";

const URL_RE = /https?:\/\/[^\s'"<>()]+/g;
const TRAILING_PUNCT = /[.,;:!?)\]}]+$/;

function linkify(code: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(code))) {
    const start = m.index;
    let url = m[0];
    const trailing = TRAILING_PUNCT.exec(url);
    if (trailing) url = url.slice(0, -trailing[0].length);
    const end = start + url.length;
    if (start > last) out.push(code.slice(last, start));
    out.push(
      <a key={key++} href={url} target="_blank" rel="noreferrer">
        {url}
      </a>,
    );
    last = end;
    URL_RE.lastIndex = end;
  }
  if (out.length === 0) return code;
  if (last < code.length) out.push(code.slice(last));
  return <>{out}</>;
}

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
        <h2>With a nested link</h2>
        <CodeBlock code={linkify(LINKED_CODE)} parser={jsParser} compressed />
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
