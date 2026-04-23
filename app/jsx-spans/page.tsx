import type { Metadata } from "next";
import { parser as jsParser } from "@lezer/javascript";
import { parser as cssParser } from "@lezer/css";
import CodeBlockJsx from "@/components/CodeBlockJsx";
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
  title: "JSX-spans highlighting",
};

export default function Page() {
  return (
    <>
      <h1>JSX-spans highlighting</h1>
      <p>
        Server component renders highlighted tokens as nested{" "}
        <code>&lt;span&gt;</code> JSX children under <code>&lt;code&gt;</code>.
        No client JS, no <code>dangerouslySetInnerHTML</code>.
      </p>
      <section>
        <h2>Short</h2>
        <CodeBlockJsx code={SHORT_CODE} parser={jsParser} />
      </section>
      <section>
        <h2>Medium</h2>
        <CodeBlockJsx code={MEDIUM_CODE} parser={jsParser} />
      </section>
      <section>
        <h2>Enhanced (links + regions)</h2>
        <p>
          JSX children are ignored - only the text content is parsed and
          highlighted.
        </p>
        <CodeBlockJsx code={enhance(LINKED_CODE)} parser={jsParser} />
      </section>
      <section>
        <h2>CSS</h2>
        <CodeBlockJsx code={CSS_CODE} parser={cssParser} />
      </section>
      <section>
        <h2>Long</h2>
        <CodeBlockJsx code={makeLongCode(40)} parser={jsParser} />
      </section>
    </>
  );
}
