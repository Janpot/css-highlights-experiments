import type { ReactNode } from "react";
import { parser } from "@lezer/javascript";
import { computeHighlights } from "@/lib/highlight";
import { encodeRanges, flattenRanges } from "@/lib/rangesCodec";
import CodeBlock from "./CodeBlock";
import { SHORT_CODE, MEDIUM_CODE, LINKED_CODE, makeLongCode } from "./samples";

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

interface Block {
  title: string;
  code: string;
  enhance?: (code: string) => ReactNode;
}

export default function Page() {
  const longCode = makeLongCode(40);
  const blocks: Block[] = [
    { title: "Short", code: SHORT_CODE },
    { title: "Medium", code: MEDIUM_CODE },
    {
      title: "With a nested link",
      code: LINKED_CODE,
      enhance: linkify,
    },
    { title: "Long (viewport-only)", code: longCode },
  ];
  const prepared = blocks.map((b) => ({
    ...b,
    ranges: encodeRanges(flattenRanges(computeHighlights(parser, b.code))),
  }));

  return (
    <>
      <h1>Build-time highlighting</h1>
      <p>
        Server component parses the code at build time and passes a compact
        ranges array across the client boundary. The parser never ships to the
        browser.
      </p>
      {prepared.map((b, i) => (
        <section key={i}>
          <h2>{b.title}</h2>
          <CodeBlock
            code={b.enhance ? b.enhance(b.code) : b.code}
            ranges={b.ranges}
          />
        </section>
      ))}
    </>
  );
}
