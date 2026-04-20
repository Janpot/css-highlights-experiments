'use client';
import { RefObject, useEffect, useMemo } from 'react';
import { buildTextNodeIndex, makeRange } from './domIndex';
import {
  setBlockActiveRanges,
  clearBlock,
  isSupported,
} from './highlightManager';
import {
  decodeRanges,
  type EncodedRanges,
  type RangesData,
} from './rangesCodec';

let nextId = 0;

export function useCodeBlock(
  codeRef: RefObject<HTMLElement | null>,
  ranges: RangesData,
): void {
  useEffect(() => {
    if (!isSupported()) return;
    const el = codeRef.current;
    if (!el) return;

    const blockId = ++nextId;
    const nodeIndex = buildTextNodeIndex(el);
    const perClass = new Map<string, Range[]>();
    const { classes, tokens } = ranges;

    let i = 0;
    while (i < tokens.length) {
      const cls = classes[tokens[i++]];
      const pairCount = tokens[i++];
      const classList = cls.split(/\s+/).filter(Boolean);
      let from = 0;
      for (let p = 0; p < pairCount; p++) {
        from += tokens[i++];
        const len = tokens[i++];
        const r = makeRange(nodeIndex, from, from + len);
        if (!r || classList.length === 0) continue;
        for (const c of classList) {
          let arr = perClass.get(c);
          if (!arr) perClass.set(c, (arr = []));
          arr.push(r);
        }
      }
    }
    setBlockActiveRanges(blockId, perClass);

    return () => clearBlock(blockId);
  }, [codeRef, ranges]);
}

export function useDecodedRanges(encoded: EncodedRanges): RangesData {
  return useMemo(() => decodeRanges(encoded), [encoded]);
}
