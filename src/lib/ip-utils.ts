
export async function getClientIP(): Promise<string> {
  try {
    // Em produção, o IP real vem dos headers do Next.js
    // Em desenvolvimento, retorna um IP fictício para testes
    if (process.env.NODE_ENV === 'development') {
      return '192.168.1.100'; // IP de desenvolvimento
    }
    
    // Em produção, precisamos acessar o IP real
    // Isso será implementado quando integrarmos com a action
    return 'unknown';
  } catch (error) {
    console.error('Erro ao detectar IP:', error);
    return 'unknown';
  }
}
