import { highlightTree, tagHighlighter, tags as t, Highlighter } from '@lezer/highlight';
import { Parser, Tree, TreeFragment, ChangedRange, SyntaxNode } from '@lezer/common';
import type { RangesData } from './rangesCodec';

export const defaultHighlighter: Highlighter = tagHighlighter([
  {
    tag: [
      t.keyword,
      t.controlKeyword,
      t.operatorKeyword,
      t.definitionKeyword,
      t.modifier,
    ],
    class: 'lzh-kw',
  },
  { tag: t.self, class: 'lzh-this' },
  { tag: [t.string, t.special(t.string)], class: 'lzh-str' },
  { tag: t.regexp, class: 'lzh-re' },
  { tag: t.escape, class: 'lzh-esc' },
  { tag: [t.number, t.integer, t.float], class: 'lzh-num' },
  { tag: t.bool, class: 'lzh-bool' },
  { tag: t.null, class: 'lzh-nul' },
  { tag: [t.lineComment, t.blockComment, t.docComment, t.comment], class: 'lzh-cmt' },
  { tag: t.variableName, class: 'lzh-var' },
  { tag: t.propertyName, class: 'lzh-prop' },
  {
    tag: [
      t.function(t.variableName),
      t.function(t.propertyName),
      t.function(t.definition(t.variableName)),
      t.definition(t.propertyName),
    ],
    class: 'lzh-fn',
  },
  { tag: t.definition(t.special(t.propertyName)), class: 'lzh-prop' },
  { tag: t.definition(t.variableName), class: 'lzh-def' },
  { tag: t.className, class: 'lzh-cls' },
  { tag: t.constant(t.className), class: 'lzh-cls' },
  { tag: t.labelName, class: 'lzh-def' },
  { tag: t.typeName, class: 'lzh-type' },
  { tag: [t.unit, t.color], class: 'lzh-num' },
  { tag: t.atom, class: 'lzh-const' },
  { tag: t.operator, class: 'lzh-op' },
  { tag: [t.punctuation, t.paren, t.brace, t.bracket, t.separator], class: 'lzh-punct' },
  { tag: t.angleBracket, class: 'lzh-punct' },
  { tag: t.standard(t.tagName), class: 'lzh-tag-builtin' },
  { tag: t.tagName, class: 'lzh-tag' },
  { tag: t.attributeName, class: 'lzh-attr' },
  { tag: t.meta, class: 'lzh-meta' },
]);

// Built-in constructors and namespace objects. starry-night scopes these as
// `support.class.*` → pl-c1 (blue). Bare identifier references.
const SUPPORT_CLASSES = new Set([
  'globalThis', 'Object', 'Function', 'Array', 'String', 'Number', 'Boolean',
  'Symbol', 'BigInt', 'Math', 'Date', 'JSON', 'RegExp', 'Atomics', 'Intl',
  'Error', 'TypeError', 'SyntaxError', 'ReferenceError', 'RangeError', 'URIError', 'EvalError', 'AggregateError',
  'Promise', 'Proxy', 'Reflect', 'Map', 'Set', 'WeakMap', 'WeakSet',
  'ArrayBuffer', 'SharedArrayBuffer', 'DataView',
  'Int8Array', 'Uint8Array', 'Uint8ClampedArray',
  'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array',
  'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array',
]);

// Built-in free functions. starry-night scopes these as `support.function.js`
// → pl-c1 (blue) when called.
const SUPPORT_FUNCTIONS = new Set([
  'isNaN', 'isFinite', 'parseInt', 'parseFloat',
  'eval', 'encodeURI', 'decodeURI', 'encodeURIComponent', 'decodeURIComponent',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame',
  'fetch', 'atob', 'btoa', 'structuredClone',
]);

// Common method names that starry-night scopes as support.function.dom.js or
// support.function.console.js → pl-c1 (blue). Subset of starry-night's full
// list, covering Array/Set/Map/common DOM methods plus all console.* methods.
const SUPPORT_METHODS = new Set([
  // console
  'log', 'warn', 'error', 'info', 'debug', 'trace',
  'assert', 'clear', 'count', 'countReset',
  'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd',
  'profile', 'profileEnd', 'table', 'time', 'timeEnd', 'timeLog',
  // Array / iterables
  'forEach', 'map', 'filter', 'reduce', 'reduceRight',
  'find', 'findIndex', 'findLast', 'findLastIndex',
  'some', 'every', 'includes', 'indexOf', 'lastIndexOf',
  'push', 'pop', 'shift', 'unshift',
  'slice', 'splice', 'concat', 'join',
  'reverse', 'sort', 'fill', 'flat', 'flatMap', 'copyWithin',
  'values', 'keys', 'entries',
  // Set / Map / WeakMap / WeakSet
  'add', 'delete', 'has', 'get', 'set',
  // Object / generic
  'toString', 'valueOf', 'hasOwnProperty',
  // Promise
  'then', 'catch', 'finally',
  // DOM (small sample — starry-night's list is far larger)
  'querySelector', 'querySelectorAll', 'getElementById',
  'getElementsByClassName', 'getElementsByTagName',
  'addEventListener', 'removeEventListener', 'dispatchEvent',
  'appendChild', 'removeChild', 'insertBefore', 'replaceChild',
  'getAttribute', 'setAttribute', 'removeAttribute', 'hasAttribute',
  'focus', 'blur', 'click', 'submit',
  'createElement', 'createTextNode', 'createDocumentFragment',
]);

function isConstScope(decl: SyntaxNode, code: string): boolean {
  for (let child = decl.firstChild; child; child = child.nextSibling) {
    if (code.slice(child.from, child.to) === 'const') return true;
    if (
      child.name === 'VariableDefinition' ||
      child.name === 'ArrayPattern' ||
      child.name === 'ObjectPattern'
    ) {
      return false;
    }
  }
  return false;
}

function collectConstDefs(tree: Tree, code: string): Set<number> {
  const starts = new Set<number>();
  tree.iterate({
    enter(node) {
      if (node.name !== 'VariableDefinition') return;
      for (let p: SyntaxNode | null = node.node.parent; p; p = p.parent) {
        const pn = p.name;
        if (
          pn === 'VariableDeclaration' ||
          pn === 'ForOfSpec' ||
          pn === 'ForInSpec'
        ) {
          if (isConstScope(p, code)) starts.add(node.from);
          return;
        }
        if (
          pn === 'FunctionDeclaration' ||
          pn === 'FunctionExpression' ||
          pn === 'ArrowFunction' ||
          pn === 'MethodDeclaration' ||
          pn === 'ClassDeclaration' ||
          pn === 'ClassExpression'
        ) {
          return;
        }
      }
    },
  });
  return starts;
}

// Collect [from, to) ranges for Interpolation nodes whose body is a single
// bare VariableName (e.g. `${name}`). MUI colors these navy via
// `.pl-s .pl-pse .pl-s1`. We leave complex `${...}` alone.
function collectBareInterpolations(tree: Tree): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  tree.iterate({
    enter(node) {
      if (node.name !== 'Interpolation') return;
      // Children: InterpolationStart, (optional expr), InterpolationEnd.
      let exprCount = 0;
      let onlyVar = false;
      for (let c = node.node.firstChild; c; c = c.nextSibling) {
        if (c.name === 'InterpolationStart' || c.name === 'InterpolationEnd') continue;
        exprCount++;
        onlyVar = c.name === 'VariableName';
      }
      if (exprCount === 1 && onlyVar) {
        out.push([node.from, node.to]);
      }
    },
  });
  return out;
}

function inInterpolation(
  from: number,
  to: number,
  ranges: Array<[number, number]>,
): boolean {
  for (const [a, b] of ranges) {
    if (from >= a && to <= b) return true;
  }
  return false;
}

export function rangesFromTree(
  tree: Tree,
  code: string,
  highlighter: Highlighter = defaultHighlighter,
): RangesData {
  const constDefs = collectConstDefs(tree, code);
  const bareInterp = collectBareInterpolations(tree);
  const buckets = new Map<string, number[]>();

  highlightTree(tree, highlighter, (from, to, initialCls) => {
    let cls = initialCls;
    const text = code.slice(from, to);

    if (initialCls === 'lzh-var' || initialCls === 'lzh-cls') {
      if (text === 'console') cls = 'lzh-fn';
      else if (SUPPORT_CLASSES.has(text)) cls = 'lzh-const';
    } else if (initialCls === 'lzh-fn') {
      const prevCh = from > 0 ? code.charCodeAt(from - 1) : 0;
      const isMethodCall = prevCh === 0x2e; // '.'
      if (isMethodCall) {
        if (SUPPORT_METHODS.has(text)) cls = 'lzh-const';
      } else {
        if (SUPPORT_FUNCTIONS.has(text)) cls = 'lzh-const';
      }
    } else if (initialCls === 'lzh-def' && constDefs.has(from)) {
      cls = 'lzh-const';
    }

    if (
      (cls === 'lzh-punct' || cls === 'lzh-var') &&
      inInterpolation(from, to, bareInterp)
    ) {
      cls = 'lzh-str';
    }

    let arr = buckets.get(cls);
    if (!arr) buckets.set(cls, (arr = []));
    arr.push(from, to - from);
  });

  const classes: string[] = [];
  const tokens: number[] = [];
  for (const [cls, pairs] of buckets) {
    const idx = classes.length;
    classes.push(cls);
    tokens.push(idx, pairs.length >> 1);
    let prev = 0;
    for (let i = 0; i < pairs.length; i += 2) {
      const from = pairs[i];
      const len = pairs[i + 1];
      tokens.push(from - prev, len);
      prev = from;
    }
  }
  return { classes, tokens };
}

export function computeHighlights(parser: Parser, code: string): RangesData {
  return rangesFromTree(parser.parse(code), code);
}

export interface ParseState {
  code: string;
  fragments: readonly TreeFragment[];
}

export function parseIncremental(
  parser: Parser,
  code: string,
  prevFragments: readonly TreeFragment[] = [],
): { tree: Tree; fragments: readonly TreeFragment[] } {
  const tree = parser.parse(code, prevFragments);
  return { tree, fragments: TreeFragment.addTree(tree) };
}

export function applyEdit(prev: ParseState, nextCode: string): ParseState {
  const changes = diffChange(prev.code, nextCode);
  const fragments = TreeFragment.applyChanges(prev.fragments, changes);
  return { code: nextCode, fragments };
}

function diffChange(a: string, b: string): ChangedRange[] {
  if (a === b) return [];
  let p = 0;
  const max = Math.min(a.length, b.length);
  while (p < max && a.charCodeAt(p) === b.charCodeAt(p)) p++;
  let sa = a.length;
  let sb = b.length;
  while (sa > p && sb > p && a.charCodeAt(sa - 1) === b.charCodeAt(sb - 1)) {
    sa--;
    sb--;
  }
  return [{ fromA: p, toA: sa, fromB: p, toB: sb }];
}
