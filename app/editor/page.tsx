import type { Metadata } from 'next';
import EditorDemo from './EditorDemo';

export const metadata: Metadata = {
  title: 'Editor',
};

export default function Page() {
  return <EditorDemo />;
}
