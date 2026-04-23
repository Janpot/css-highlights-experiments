import type { Metadata } from "next";
import { parser as jsParser } from "@lezer/javascript";
import { parser as cssParser } from "@lezer/css";
import CodeBlockHtmlHydrated from "@/components/CodeBlockHtmlHydrated";
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
  title: "HTML-string (hydrated) highlighting",
};

export default function Page() {
  return (
    <>
      <h1>HTML-string (hydrated) highlighting</h1>
      <p>
        Server generates the highlighted HTML string and passes it as a prop to
        a client component. SSR renders plain text - after hydration, the
        client replaces the contents via{" "}
        <code>dangerouslySetInnerHTML</code>.
      </p>
      <section>
        <h2>Short</h2>
        <CodeBlockHtmlHydrated code={SHORT_CODE} parser={jsParser} />
      </section>
      <section>
        <h2>Medium</h2>
        <CodeBlockHtmlHydrated code={MEDIUM_CODE} parser={jsParser} />
      </section>
      <section>
        <h2>Enhanced (links + regions)</h2>
        <p>
          JSX children are ignored - only the text content is parsed and
          highlighted.
        </p>
        <CodeBlockHtmlHydrated code={enhance(LINKED_CODE)} parser={jsParser} />
      </section>
      <section>
        <h2>CSS</h2>
        <CodeBlockHtmlHydrated code={CSS_CODE} parser={cssParser} />
      </section>
      <section>
        <h2>Long</h2>
        <CodeBlockHtmlHydrated code={makeLongCode(40)} parser={jsParser} />
      </section>
    </>
  );
}
