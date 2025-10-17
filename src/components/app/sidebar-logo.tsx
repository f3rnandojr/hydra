"use client";

import { Waves } from "lucide-react";
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export function SidebarLogo() {
  const [logoUrl, setLogoUrl] = useState('/logo.svg');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogo() {
      try {
        const response = await fetch('/api/configuracoes/logo');
        if (response.ok) {
          const data = await response.json();
          // Adiciona um timestamp para evitar cache do navegador
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

  const logoContent = loading ? (
    <Skeleton className="h-8 w-8 rounded-md group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10" />
  ) : logoUrl === '/logo.svg' || logoUrl.startsWith('/logo.svg') ? (
    <Waves className="text-primary h-8 w-8 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 transition-all" />
  ) : (
    <Image
        key={logoUrl}
        src={logoUrl}
        alt="Logo"
        width={32}
        height={32}
        className="h-8 w-8 object-contain group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 transition-all"
        unoptimized
        onError={(e) => {
            e.currentTarget.style.display = 'none';
            // O ideal seria ter um fallback aqui, mas para manter simples, apenas escondemos.
            // Poderíamos ter outro estado para mostrar o <Waves />
        }}
    />
  );


  return (
    <div className="flex items-center gap-2 p-2">
      {logoContent}
      <h1 className="text-xl font-bold text-foreground group-data-[collapsible=icon]:hidden">
        Hydra
      </h1>
    </div>
  );
}
