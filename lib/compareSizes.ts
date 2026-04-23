import { gzipSync } from 'node:zlib';
import { parser as jsParser } from '@lezer/javascript';
import { computeHighlights } from './highlight';
import { encodeRanges } from './rangesCodec';
import {
  segmentsFromRanges,
  htmlFromSegments,
  escapeHtml,
} from './spansFromRanges';

export interface SizePair {
  raw: number;
  gz: number;
}

function measure(s: string): SizePair {
  const raw = Buffer.byteLength(s, 'utf8');
  const gz = gzipSync(s).byteLength;
  return { raw, gz };
}

export function computeHtmlSizes(code: string) {
  const ranges = computeHighlights(jsParser, code);
  const segments = segmentsFromRanges(code, ranges);
  const plainCodeHtml = `<pre><code>${escapeHtml(code)}</code></pre>`;
  const spanCodeHtml = `<pre><code class="lzh-root">${htmlFromSegments(segments)}</code></pre>`;
  const encoded = encodeRanges(ranges);
  const rangesJson = JSON.stringify(ranges);
  const encodedJson = JSON.stringify(encoded);
  return {
    plain: measure(plainCodeHtml),
    spans: measure(spanCodeHtml),
    rangesJson: measure(rangesJson),
    encodedJson: measure(encodedJson),
  };
}
