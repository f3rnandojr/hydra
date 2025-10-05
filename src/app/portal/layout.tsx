import { ColaboradorAuthProvider } from '@/contexts/colaborador-auth-context';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ColaboradorAuthProvider>{children}</ColaboradorAuthProvider>;
}
