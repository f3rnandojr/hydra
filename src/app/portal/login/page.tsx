"use client";

import { useState, useEffect } from 'react';
import { useColaboradorAuth } from '@/contexts/colaborador-auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Waves } from 'lucide-react';

export default function ColaboradorLoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login, colaborador } = useColaboradorAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (colaborador) {
      router.push('/portal');
    }
  }, [colaborador, router]);

  if (colaborador) {
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
        description: `Bem-vindo ao portal!`,
      });
      // O useEffect cuidará do redirecionamento
    } else {
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos, ou colaborador inativo.",
        variant: "destructive",
      });
    }
    
    setCarregando(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <Waves className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Hydra</CardTitle>
            </div>
          <CardDescription>
            Portal do Colaborador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Corporativo</Label>
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
              {carregando ? "Entrando..." : "Entrar no Portal"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
