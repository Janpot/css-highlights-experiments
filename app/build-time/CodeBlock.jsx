'use client';
import { useRef } from 'react';
import { useCodeBlock } from '@/lib/useCodeBlock';

export default function CodeBlock({ code, ranges, segments }) {
  const ref = useRef(null);
  useCodeBlock(ref, { code, ranges });
  return (
    <pre>
      <code ref={ref}>
        {segments
          ? segments.map((seg, i) =>
              seg.href ? (
                <a key={i} href={seg.href} target="_blank" rel="noreferrer">
                  {seg.text}
                </a>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )
          : code}
      </code>
    </pre>
  );
}
