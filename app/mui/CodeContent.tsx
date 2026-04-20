'use client';
import type { ContentProps } from '@mui/internal-docs-infra/CodeHighlighter/types';
import { useCode } from '@mui/internal-docs-infra/useCode';
import '@wooorm/starry-night/style/light';

export function CodeContent(props: ContentProps<object>) {
  const code = useCode(props);
  return <div className="mui-code">{code.selectedFile}</div>;
}
