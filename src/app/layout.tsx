import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { CafeteriaProvider } from '@/contexts/cafeteria-context';
import { ModalSelecaoCafeteria } from '@/components/app/cafeteria/modal-selecao';

export const metadata: Metadata = {
  title: 'Hydra Sales System',
  description: 'Hydra Sales System for managing collaborators and sales.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <CafeteriaProvider>
            <ModalSelecaoCafeteria />
            {children}
            <Toaster />
          </CafeteriaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
