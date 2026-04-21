import '@/styles/globals.css';
import '@/styles/themes.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import ThemeSwitcher from './ThemeSwitcher';

export const metadata: Metadata = {
  title: 'Lezer + CSS Custom Highlight API',
};

const themeBootstrap = `(function(){try{var t=localStorage.getItem('highlight-demo-theme');if(t==='theme-light'||t==='theme-dark'||t==='theme-dracula'){document.documentElement.className=t;}}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="theme-light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <nav className="site">
          <Link href="/">Home</Link>
          <Link href="/build-time">Build-time</Link>
          <Link href="/build-time-raw">Build-time (raw)</Link>
          <Link href="/client-runtime">Client runtime</Link>
          <Link href="/editor">Editor</Link>
          <Link href="/mui">MUI</Link>
          <span className="spacer" />
          <ThemeSwitcher />
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
