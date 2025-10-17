import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Constrói uma URL absoluta para a API, funcionando tanto em desenvolvimento quanto em produção.
 * @param path O caminho do endpoint da API (ex: /api/setores)
 * @returns A URL absoluta.
 */
export function getAbsoluteApiUrl(path: string) {
  // Em produção (ou ambientes Vercel), usa a variável de ambiente VERCELL_URL.
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'; // Fallback para desenvolvimento local

  // Garante que o caminho não tenha uma barra inicial duplicada.
  const finalPath = path.startsWith('/') ? path : `/${path}`;

  return baseUrl + finalPath;
}
