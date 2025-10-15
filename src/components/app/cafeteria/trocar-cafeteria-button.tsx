"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useCafeteria } from "@/contexts/cafeteria-context";

export function TrocarCafeteriaButton() {
  const { cafeteriaAtiva, abrirModal } = useCafeteria();

  if (!cafeteriaAtiva) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={abrirModal}
      className="flex items-center gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      Trocar Cafeteria
    </Button>
  );
}
