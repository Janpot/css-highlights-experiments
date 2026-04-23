'use client';

import { useEffect, useState } from 'react';

interface Props {
  code: string;
  html: string;
}

export default function CodeBlockHtmlHydratedClient({ code, html }: Props) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return (
    <pre>
      {hydrated ? (
        <code
          className="lzh-root"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <code className="lzh-root">{code}</code>
      )}
    </pre>
  );
}
