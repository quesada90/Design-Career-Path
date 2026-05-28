import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '../src/styles/globals.css';
import '../src/styles/tailwind.css';
import '../src/styles/theme.css';
import '../src/styles/fonts.css';

export const metadata: Metadata = {
  title: 'Design Career Path',
  description: 'Track your designer career progression, skills, and growth goals. A personal tool to facilitate meaningful conversations with your manager, lead, or HR partner.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
