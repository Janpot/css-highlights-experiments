export default function Home() {
  return (
    <>
      <h1>Lezer + CSS Custom Highlight API</h1>
      <p>
        Syntax highlighting with <code>::highlight()</code>. The DOM stays a plain{' '}
        <code>&lt;pre&gt;&lt;code&gt;text&lt;/code&gt;&lt;/pre&gt;</code>; token
        ranges are registered against named highlights.
      </p>
      <h2>Demos</h2>
      <ul>
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
          <a href="/client-runtime">/client-runtime</a> — server ships raw code,
          browser parses on mount.
        </li>
        <li>
          <a href="/editor">/editor</a> — <code>contenteditable</code> with live
          re-parsing, optional incremental parsing.
        </li>
      </ul>
      <p>
        Each block only registers token ranges for the viewport + a small
        buffer, so pages with many large blocks stay responsive.
      </p>
    </>
  );
}
