import type { Metadata } from 'next';
import './globals.css';

/**
 *  Defines the metadata of the application
 */
export const metadata: Metadata = {
  title: 'SECInsiderMonitor',
  description:
    'Application for monitoring insider trading activity based on SEC filings of type 3, 4 and 5.',
};

/**
 *  Defines the root layout of the application
 *
 * @param {React.ReactNode} children - The embedded children of the layout
 * @returns {React.ReactNode} - The root layout of the application
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
