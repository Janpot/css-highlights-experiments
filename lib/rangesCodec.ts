import type { CompactRange } from './highlight';

export interface RangesData {
  classes: string[];
  tokens: number[];
}

export interface EncodedRanges {
  classes: string[];
  data: string;
}

function pushVarint(out: number[], value: number): void {
  while (value >= 0x80) {
    out.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  out.push(value & 0x7f);
}

function bytesToBase64(bytes: number[]): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(i, i + 0x8000));
  }
  if (typeof btoa === 'function') return btoa(binary);
  return Buffer.from(binary, 'binary').toString('base64');
}

function base64ToBytes(data: string): Uint8Array {
  if (typeof atob === 'function') {
    const bin = atob(data);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(data, 'base64'));
}

export function flattenRanges(ranges: CompactRange[]): RangesData {
  const classes: string[] = [];
  const classIndex = new Map<string, number>();
  const tokens: number[] = [];

  for (const entry of ranges) {
    const cls = entry[0] as string;
    const pairCount = (entry.length - 1) >> 1;
    if (pairCount === 0) continue;

    let idx = classIndex.get(cls);
    if (idx === undefined) {
      idx = classes.length;
      classes.push(cls);
      classIndex.set(cls, idx);
    }

    tokens.push(idx, pairCount);
    let prev = 0;
    for (let i = 0; i < pairCount; i++) {
      const from = entry[1 + i * 2] as number;
      const len = entry[2 + i * 2] as number;
      tokens.push(from - prev, len);
      prev = from;
    }
  }
  return { classes, tokens };
}

export function encodeRanges({ classes, tokens }: RangesData): EncodedRanges {
  const bytes: number[] = [];
  let i = 0;
  while (i < tokens.length) {
    const classIdx = tokens[i++];
    const pairCount = tokens[i++];
    pushVarint(bytes, classIdx);
    pushVarint(bytes, pairCount);
    for (let p = 0; p < pairCount; p++) {
      pushVarint(bytes, tokens[i++]);
      pushVarint(bytes, tokens[i++]);
    }
  }
  return { classes, data: bytesToBase64(bytes) };
}

export function decodeRanges({ classes, data }: EncodedRanges): RangesData {
  const buf = base64ToBytes(data);
  const tokens: number[] = [];
  let i = 0;
  while (i < buf.length) {
    let classIdx = 0;
    let shift = 0;
    while (buf[i] & 0x80) {
      classIdx |= (buf[i++] & 0x7f) << shift;
      shift += 7;
    }
    classIdx |= buf[i++] << shift;

    let pairCount = 0;
    shift = 0;
    while (buf[i] & 0x80) {
      pairCount |= (buf[i++] & 0x7f) << shift;
      shift += 7;
    }
    pairCount |= buf[i++] << shift;

    tokens.push(classIdx, pairCount);
    for (let p = 0; p < pairCount; p++) {
      let df = 0;
      shift = 0;
      while (buf[i] & 0x80) {
        df |= (buf[i++] & 0x7f) << shift;
        shift += 7;
      }
      df |= buf[i++] << shift;

      let len = 0;
      shift = 0;
      while (buf[i] & 0x80) {
        len |= (buf[i++] & 0x7f) << shift;
        shift += 7;
      }
      len |= buf[i++] << shift;

      tokens.push(df, len);
    }
  }
  return { classes, tokens };
}
