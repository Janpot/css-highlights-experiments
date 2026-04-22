import 'server-only';
import { CodeHighlighter } from '@mui/internal-docs-infra/CodeHighlighter';
import { createParseSource } from '@mui/internal-docs-infra/pipeline/parseSource';
import { enhanceCodeEmphasis } from '@mui/internal-docs-infra/pipeline/enhanceCodeEmphasis';
import { CodeContent } from './CodeContent';

const sourceParser = createParseSource();
const sourceEnhancers = [enhanceCodeEmphasis];

export function Code({
  children,
  language,
  fileName,
}: {
  children: string;
  language?: string;
  fileName?: string;
}) {
  return (
    <CodeHighlighter
      language={language}
      fileName={fileName}
      Content={CodeContent}
      sourceParser={sourceParser}
      sourceEnhancers={sourceEnhancers}
    >
      {children}
    </CodeHighlighter>
  );
}
