
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoginLogo } from '@/components/app/login/logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login, usuario } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Se já estiver logado, redirecionar para a página inicial
  useEffect(() => {
    if (usuario) {
      router.push('/');
    }
  }, [usuario, router]);

  if (usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <p>Redirecionando...</p>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    const sucesso = await login(email, senha);
    
    if (sucesso) {
      toast({
        title: "Login realizado!",
        description: `Bem-vindo de volta!`,
      });
      // O useEffect cuidará do redirecionamento
    } else {
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos",
        variant: "destructive",
      });
    }
    
    setCarregando(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pt-8">
          <LoginLogo />
          <CardDescription className='pt-4'>
            Sistema de Gestão de Cafeterias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={carregando}
            >
              {carregando ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          
          {/* Credenciais de teste */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Credenciais de teste:</p>
            <div className="text-xs space-y-1">
              <p><strong>Gestor:</strong> admin@hydra.com / 123456</p>
              <p><strong>Usuário:</strong> usuario@hydra.com / 123456</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
