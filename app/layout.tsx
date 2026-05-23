import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { designSystem } from '../styles/design-system';

export const metadata: Metadata = {
  title: 'Eduflow Universe',
  description: 'Unified SMS-2 migration workspace',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={designSystem.classNames.shell.page}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
