
"use client";

// This function now calls our new API route
export async function getCafeteriaByIP(ip: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/cafeteria-session?ip=${encodeURIComponent(ip)}`);
    if (!response.ok) {
        return null;
    }
    const data = await response.json();
    return data.cafeteria || null;
  } catch (error) {
    console.error('Erro ao obter cafeteria por IP via API:', error);
    return null;
  }
}

// This function now calls our new API route
export async function createOrUpdateSession(
  ip: string, 
  cafeteria: string, 
  usuario: string
): Promise<boolean> {
  try {
     const response = await fetch('/api/cafeteria-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ip, cafeteria, usuario }),
    });
    return response.ok;
  } catch (error) {
    console.error('Erro ao criar/atualizar sessão via API:', error);
    return false;
  }
}
