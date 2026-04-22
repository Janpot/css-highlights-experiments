'use client';
import { useState } from 'react';
import { parser as jsParser } from '@lezer/javascript';
import EditableCodeBlock from '@/components/EditableCodeBlock';
import { MEDIUM_CODE } from '@/lib/samples';

export default function Page() {
  const [code, setCode] = useState(MEDIUM_CODE);
  const [incremental, setIncremental] = useState(true);

  return (
    <>
      <h1>Editor</h1>
      <p>
        <code>&lt;pre contenteditable=&quot;plaintext-only&quot;&gt;</code>.
        Edits trigger a re-parse; highlights update without mutating the DOM, so
        the caret stays put.
      </p>
      <label className="toggle">
        <input
          type="checkbox"
          checked={incremental}
          onChange={(e) => setIncremental(e.target.checked)}
        />
        incremental parsing
      </label>
      <EditableCodeBlock
        value={code}
        onChange={setCode}
        parser={jsParser}
        incremental={incremental}
      />
    </>
  );
}
