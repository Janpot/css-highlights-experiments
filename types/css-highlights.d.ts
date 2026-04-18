// Ambient declarations for the CSS Custom Highlight API.
// Standard TS lib may already provide these in new versions; these declarations
// are a safety net and are structurally compatible.

export {};

declare global {
  interface Highlight extends Set<AbstractRange> {
    priority: number;
    type: 'highlight' | 'spelling-error' | 'grammar-error';
  }

  // eslint-disable-next-line @typescript-eslint/no-redeclare
  var Highlight: {
    prototype: Highlight;
    new (...ranges: AbstractRange[]): Highlight;
  };

  interface HighlightRegistry extends Map<string, Highlight> {}

  interface CSS {
    readonly highlights: HighlightRegistry;
  }
}
