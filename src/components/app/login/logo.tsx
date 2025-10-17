
"use client";

import Image from 'next/image';
import { useEffect, useState } from 'react';

export function LoginLogo() {
  const [logoUrl, setLogoUrl] = useState('/logo.svg');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogo() {
      try {
        const response = await fetch('/api/configuracoes/logo');
        if (response.ok) {
          const data = await response.json();
          // Adiciona um timestamp para evitar cache
          setLogoUrl(`${data.url}?t=${new Date().getTime()}`);
        }
      } catch (error) {
        console.error("Falha ao buscar a logo, usando padrão.");
      } finally {
        setLoading(false);
      }
    }
    fetchLogo();
  }, []);

  if (loading) {
    return <div className="h-20 w-48 mx-auto mb-6 bg-muted rounded-md animate-pulse" />;
  }

  return (
    <Image
      key={logoUrl}
      src={logoUrl}
      alt="Logo Sistema"
      width={192}
      height={80}
      className="h-20 w-auto mx-auto mb-6 object-contain"
      unoptimized
    />
  );
}
