import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nursery-SaaS API',
  description: 'Backend API for Nursery-SaaS platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
