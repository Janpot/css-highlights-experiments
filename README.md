# css-highlights-experiments

Experiments with syntax highlighting via [Lezer](https://lezer.codemirror.net/) parsers and the [CSS Custom Highlight API](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API).

The goal: keep the DOM a plain `<pre><code>text</code></pre>` and register token ranges against named highlights (`::highlight(keyword)`, etc.) instead of wrapping tokens in `<span>`s.

## Demos

Each route is a Next.js page under `app/`:

- `/plain-text` — baseline, no highlighting.
- `/build-time` — ranges computed in a server component at build time, shipped to the client as a plain object.
- `/build-time-compressed` — same, but ranges are varint+base64 compressed to shrink the RSC payload.
- `/editor` — `contenteditable` with live re-parsing, optional incremental parsing.
- `/mui` — MUI `CodeHighlighter` (`@mui/internal-docs-infra`) for comparison; uses a classic tokens-to-spans approach.

Each block only registers token ranges for the viewport plus a small buffer, so pages with many large blocks stay responsive.

## Running

```sh
pnpm install
pnpm dev
```

## License

[MIT](./LICENSE)
