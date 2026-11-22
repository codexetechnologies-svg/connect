import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './globals.css';
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { LanguageProvider } from '@/features/i18n/language-provider';

export const metadata: Metadata = {
  title: 'Connect Pharma',
  description: 'Connecting Pharmaceutical Businesses: Compare • Connect • Grow'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
