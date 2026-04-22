import 'server-only';
import { CodeHighlighter } from '@mui/internal-docs-infra/CodeHighlighter';
import { createParseSource } from '@mui/internal-docs-infra/pipeline/parseSource';
import { enhanceCodeEmphasis } from '@mui/internal-docs-infra/pipeline/enhanceCodeEmphasis';
import { parseImportsAndComments } from '@mui/internal-docs-infra/pipeline/loaderUtils';
import { CodeContent } from './CodeContent';
import { enhanceLinkify } from './enhanceLinkify';

const sourceParser = createParseSource();
const sourceEnhancers = [enhanceCodeEmphasis, enhanceLinkify];

export async function Code({
  children,
  language,
  fileName,
}: {
  children: string;
  language?: string;
  fileName?: string;
}) {
  let source: string = children;
  let comments: Record<number, string[]> | undefined;
  if (fileName) {
    const parsed = await parseImportsAndComments(
      children,
      `file:///virtual/${fileName}`,
      {
        notableCommentsPrefix: ['@highlight'],
        removeCommentsWithPrefix: ['@highlight'],
      },
    );
    source = parsed.code ?? children;
    comments = parsed.comments;
  }
  return (
    <CodeHighlighter
      fileName={fileName}
      language={language}
      Content={CodeContent}
      sourceParser={sourceParser}
      sourceEnhancers={sourceEnhancers}
      code={{ Default: { fileName, language, source, comments } }}
    />
  );
}
