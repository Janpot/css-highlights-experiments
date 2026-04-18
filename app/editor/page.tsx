import Editor from './Editor';
import { MEDIUM_CODE } from '../build-time/samples';

export const dynamic = 'force-static';

export default function Page() {
  return (
    <>
      <h1>Editor</h1>
      <p>
        <code>&lt;pre contenteditable=&quot;plaintext-only&quot;&gt;</code>.
        Edits trigger a re-parse; highlights update without mutating the DOM, so
        the caret stays put.
      </p>
      <Editor initialCode={MEDIUM_CODE} />
    </>
  );
}
