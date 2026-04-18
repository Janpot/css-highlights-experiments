import '@/styles/globals.css';
import '@/styles/themes.css';
import Link from 'next/link';
import ThemeSwitcher from './ThemeSwitcher';

export const metadata = {
  title: 'Lezer + CSS Custom Highlight API',
};

export default function RootLayout({ children }) {
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
