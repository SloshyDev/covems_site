'use client';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({ children }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/login') {
      router.replace('/login');
    }
  }, [status, pathname, router]);

  if (status === 'loading') return <div>Cargando...</div>;
  if (status === 'unauthenticated' && pathname !== '/login') return null;
  return children;
}
