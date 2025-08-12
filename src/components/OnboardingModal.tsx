import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Building } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { updateSettings } = useCompany();

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Arquivo muito grande",
          description: "A logo deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }

      setLogo(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira o nome da sua empresa",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      let logoUrl = null;

      // Upload da logo se fornecida
      if (logo) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const fileExt = logo.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-media')
          .upload(fileName, logo);

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          throw new Error('Erro ao fazer upload da logo');
        }

        const { data: { publicUrl } } = supabase.storage
          .from('property-media')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      // Atualizar configurações da empresa
      await updateSettings({
        name: companyName.trim(),
        logo: logoUrl,
        site_title: companyName.trim(),
        site_description: `${companyName.trim()} - Encontre o imóvel dos seus sonhos`,
        site_about: `Bem-vindo à ${companyName.trim()}! Estamos aqui para ajudar você a encontrar o imóvel ideal.`,
      });

      toast({
        title: "Configuração concluída!",
        description: "Sua empresa foi configurada com sucesso.",
      });

      onComplete();
    } catch (error) {
      console.error('Erro ao configurar empresa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Bem-vindo!</DialogTitle>
          <DialogDescription>
            Para começar, vamos configurar sua empresa. Essas informações aparecerão em todo o sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nome da Empresa *</Label>
            <Input
              id="company-name"
              placeholder="Digite o nome da sua empresa"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo da Empresa (opcional)</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('logo')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {logo ? 'Alterar Logo' : 'Selecionar Logo'}
                  </Button>
                </div>
                {logo && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {logo.name}
                  </p>
                )}
              </div>
              
              {logoPreview && (
                <div className="w-16 h-16 border border-border rounded-lg overflow-hidden">
                  <img
                    src={logoPreview}
                    alt="Preview da logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Onde essas informações aparecerão:</strong>
              <br />• Menu superior do sistema
              <br />• Site público da empresa  
              <br />• Ícone do navegador e PWA
              <br />• Cabeçalho de relatórios
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !companyName.trim()}
          >
            {loading ? 'Configurando...' : 'Concluir Configuração'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}