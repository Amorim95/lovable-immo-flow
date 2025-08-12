import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Building, Sparkles, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface OnboardingStepsProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingSteps({ isOpen, onComplete }: OnboardingStepsProps) {
  const [currentStep, setCurrentStep] = useState(1);
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

  const handleNextStep = () => {
    if (currentStep === 2 && !companyName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira o nome da sua empresa",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleSubmit = async () => {
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

  const renderStep1 = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-foreground">Seja bem-vindo(a) ao Meu CRM!</h2>
        <p className="text-muted-foreground leading-relaxed">
          Que ótimo ter você por aqui! Para começar a usar a plataforma, vamos personalizar o seu ambiente com duas informações rápidas. Leva menos de um minuto.
        </p>
      </div>

      <Button onClick={handleNextStep} className="w-full">
        Vamos começar!
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Building className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Passo 1 de 2: Sobre sua empresa</h2>
        <p className="text-muted-foreground">Primeiro, qual é o nome da sua empresa?</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-name">Nome da empresa</Label>
        <Input
          id="company-name"
          placeholder="Digite o nome da sua empresa"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Este nome será usado para identificar sua conta e em documentos como relatórios e propostas.
        </p>
      </div>

      <Button onClick={handleNextStep} className="w-full" disabled={!companyName.trim()}>
        Avançar
      </Button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Passo 2 de 2: Sua marca</h2>
        <p className="text-muted-foreground">
          Agora, envie o logo da sua empresa para deixar o CRM com a sua identidade visual.
        </p>
      </div>

      <div className="space-y-4">
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
                {logo ? 'Alterar arquivo' : 'Escolher arquivo'}
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

        <p className="text-sm text-muted-foreground">
          <strong>Dica:</strong> Use um arquivo PNG ou JPG. Um logo com fundo transparente fica ótimo!
        </p>
      </div>

      <Button 
        onClick={handleSubmit} 
        className="w-full" 
        disabled={loading}
      >
        {loading ? 'Configurando...' : 'Concluir e acessar o CRM'}
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </DialogContent>
    </Dialog>
  );
}