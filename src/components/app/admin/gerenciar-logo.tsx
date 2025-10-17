"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LogoData {
  url: string;
  nomeArquivo?: string;
  tamanho?: number;
  tipoMime?: string;
  dataUpload?: string;
}

export function GerenciarLogo() {
  const { toast } = useToast();
  const { usuario } = useAuth();
  const [logo, setLogo] = useState<LogoData | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchLogo = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/configuracoes/logo');
      const data: LogoData = await response.json();
      setLogo(data);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar a logo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLogo();
  }, [fetchLogo]);

  const handleFileValidation = (file: File) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Arquivo Inválido", description: "Por favor, selecione um arquivo PNG, JPG, WEBP ou SVG.", variant: "destructive" });
      return false;
    }
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast({ title: "Arquivo Muito Grande", description: "O tamanho máximo do arquivo é 2MB.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const processFile = (file: File) => {
    if (handleFileValidation(file)) {
      setFileToUpload(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };
  
  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!fileToUpload) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('logo', fileToUpload);

    try {
      const response = await fetch('/api/configuracoes/logo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${usuario?._id}` },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast({ title: "Sucesso!", description: "Logo atualizada com sucesso." });
        setFileToUpload(null);
        setPreview(null);
        await fetchLogo();
      } else {
        throw new Error(result.error || "Falha no upload.");
      }
    } catch (error: any) {
      toast({ title: "Erro no Upload", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
       const response = await fetch('/api/configuracoes/logo', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${usuario?._id}` },
      });
      const result = await response.json();
      if(response.ok) {
        toast({ title: "Sucesso!", description: "Logo padrão restaurada." });
        await fetchLogo();
      } else {
        throw new Error(result.error || "Falha ao remover a logo.");
      }
    } catch (error: any) {
       toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  };

  const currentLogoUrl = preview || logo?.url || '/logo.svg';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência do Sistema</CardTitle>
        <CardDescription>
          Personalize a identidade visual do sistema fazendo o upload do logotipo da sua empresa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Coluna de Upload */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Nova Logo</h3>
             <form id="form-file-upload" onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
                <input ref={inputRef} type="file" id="input-file-upload" className="hidden" accept="image/png, image/jpeg, image/svg+xml, image/webp" onChange={handleChange} />
                <label 
                  id="label-file-upload" 
                  htmlFor="input-file-upload"
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors block",
                    isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={onButtonClick}
                >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UploadCloud className="h-10 w-10" />
                        <p>Arraste e solte a logo aqui, ou clique para selecionar</p>
                        <span className="text-xs">PNG, JPG, SVG, WEBP (máx. 2MB)</span>
                    </div>
                </label>
             </form>
            {fileToUpload && (
              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                {uploading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                {uploading ? 'Enviando...' : `Enviar ${fileToUpload.name}`}
              </Button>
            )}
          </div>
          
          {/* Coluna de Preview */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Pré-visualização</h3>
            <div className="border rounded-lg p-4 bg-muted/50 min-h-[200px] flex items-center justify-center">
              {loading ? (
                <Skeleton className="h-24 w-48" />
              ) : (
                <Image
                  key={currentLogoUrl}
                  src={currentLogoUrl}
                  alt="Pré-visualização da logo"
                  width={192}
                  height={96}
                  className="max-h-24 w-auto object-contain"
                  unoptimized // Necessário para SVGs e previews locais
                />
              )}
            </div>
            {logo && logo.url !== '/logo.svg' && !preview && (
              <Card>
                <CardHeader className='p-4'>
                  <CardTitle className='text-base'>Informações da Logo Atual</CardTitle>
                </CardHeader>
                <CardContent className='p-4 text-xs space-y-2'>
                    <p><strong>Arquivo:</strong> {logo.nomeArquivo}</p>
                    <p><strong>Tipo:</strong> <Badge variant="secondary">{logo.tipoMime}</Badge></p>
                    <p><strong>Tamanho:</strong> {(logo.tamanho! / 1024).toFixed(2)} KB</p>
                    <p><strong>Data Upload:</strong> {new Date(logo.dataUpload!).toLocaleString('pt-BR')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={removing || (logo?.url === '/logo.svg')}>
              <Trash2 className="h-4 w-4 mr-2"/>
              Restaurar Logo Padrão
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação removerá a logo customizada e restaurará a logo padrão do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemove} className="bg-destructive hover:bg-destructive/90">
                Sim, restaurar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
