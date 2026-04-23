import type { Metadata } from "next";
import { parser as jsParser } from "@lezer/javascript";
import { parser as cssParser } from "@lezer/css";
import CodeBlockHtml from "@/components/CodeBlockHtml";
import { enhance } from "@/lib/enhance";
import {
  SHORT_CODE,
  MEDIUM_CODE,
  LINKED_CODE,
  CSS_CODE,
  makeLongCode,
} from "@/lib/samples";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "HTML-string highlighting",
};

export default function Page() {
  return (
    <>
      <h1>HTML-string highlighting</h1>
      <p>
        Server component generates an HTML string of{" "}
        <code>&lt;span class=&quot;lzh-*&quot;&gt;</code> tokens and applies it
        via <code>dangerouslySetInnerHTML</code> on the{" "}
        <code>&lt;code&gt;</code> element. No client JS.
      </p>
      <section>
        <h2>Short</h2>
        <CodeBlockHtml code={SHORT_CODE} parser={jsParser} />
      </section>
      <section>
        <h2>Medium</h2>
        <CodeBlockHtml code={MEDIUM_CODE} parser={jsParser} />
      </section>
      <section>
        <h2>Enhanced (links + regions)</h2>
        <p>
          JSX children are ignored - only the text content is parsed and
          highlighted.
        </p>
        <CodeBlockHtml code={enhance(LINKED_CODE)} parser={jsParser} />
      </section>
      <section>
        <h2>CSS</h2>
        <CodeBlockHtml code={CSS_CODE} parser={cssParser} />
      </section>
      <section>
        <h2>Long</h2>
        <CodeBlockHtml code={makeLongCode(40)} parser={jsParser} />
      </section>
    </>
  );
}
