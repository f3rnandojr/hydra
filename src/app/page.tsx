import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/colaboradores');
  return null;
}
