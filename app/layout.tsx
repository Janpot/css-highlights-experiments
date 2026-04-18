import '@/styles/globals.css';
import '@/styles/themes.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import ThemeSwitcher from './ThemeSwitcher';

export const metadata: Metadata = {
  title: 'Lezer + CSS Custom Highlight API',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="theme-light">
      <body>
        <nav className="site">
          <Link href="/">Home</Link>
          <Link href="/build-time">Build-time</Link>
          <Link href="/client-runtime">Client runtime</Link>
          <Link href="/editor">Editor</Link>
          <span className="spacer" />
          <ThemeSwitcher />
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
