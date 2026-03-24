import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converte qualquer URL do Google Drive para o formato de thumbnail público.
 * Funciona sem login e serve HTTPS direto, sem redirecionamentos HTTP.
 * O arquivo precisa estar compartilhado como "Qualquer pessoa com o link".
 */
export function fixDriveUrl(url: string): string {
  if (!url) return url;

  // Extrai o ID do Google Drive de qualquer formato de link
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w2000`;
    }
  }

  // Garante HTTPS para qualquer outra URL
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }

  return url;
}
