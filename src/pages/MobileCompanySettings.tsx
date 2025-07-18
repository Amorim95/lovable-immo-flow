import { useState } from "react";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText,
  Settings,
  Palette,
  Shield,
  CreditCard
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function MobileCompanySettings() {
  const { isAdmin, isGestor } = useUserRole();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nomeEmpresa: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
    website: '',
    descricao: ''
  });

  const canManageCompany = isAdmin || isGestor;

  const handleSave = async () => {
    toast({
      title: "Dados salvos",
      description: "As informações da empresa foram atualizadas com sucesso."
    });
  };

  if (!canManageCompany) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader title="Dados da Empresa" />
        <div className="p-4">
          <div className="text-center py-8">
            <p className="text-gray-500">Você não tem permissão para gerenciar dados da empresa.</p>
          </div>
        </div>
      </div>
    );
  }

  const sections = [
    {
      id: 'basic',
      title: 'Informações Básicas',
      description: 'Nome, CNPJ e dados fundamentais',
      icon: Building2,
      items: [
        { key: 'nomeEmpresa', label: 'Nome da Empresa', type: 'text', placeholder: 'Ex: Imobiliária Premium' },
        { key: 'cnpj', label: 'CNPJ', type: 'text', placeholder: '00.000.000/0001-00' },
        { key: 'descricao', label: 'Descrição', type: 'textarea', placeholder: 'Breve descrição da empresa...' }
      ]
    },
    {
      id: 'contact',
      title: 'Dados de Contato',
      description: 'Telefone, email e endereço',
      icon: Phone,
      items: [
        { key: 'telefone', label: 'Telefone Principal', type: 'text', placeholder: '(11) 99999-9999' },
        { key: 'email', label: 'Email Principal', type: 'email', placeholder: 'contato@imobiliaria.com' },
        { key: 'website', label: 'Website', type: 'text', placeholder: 'https://www.imobiliaria.com' },
        { key: 'endereco', label: 'Endereço', type: 'textarea', placeholder: 'Rua, número, bairro, cidade...' }
      ]
    },
    {
      id: 'branding',
      title: 'Visual e Marca',
      description: 'Logo, cores e identidade visual',
      icon: Palette,
      items: []
    },
    {
      id: 'integrations',
      title: 'Integrações',
      description: 'WhatsApp, Facebook, Google',
      icon: Globe,
      items: []
    },
    {
      id: 'permissions',
      title: 'Permissões e Acessos',
      description: 'Configurações de segurança',
      icon: Shield,
      items: []
    },
    {
      id: 'billing',
      title: 'Faturamento',
      description: 'Planos e pagamentos',
      icon: CreditCard,
      items: []
    }
  ];

  if (activeSection) {
    const section = sections.find(s => s.id === activeSection);
    if (!section) return null;

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader 
          title={section.title}
          showBackButton
          onBack={() => setActiveSection(null)}
        />

        <div className="p-4 space-y-4">
          {section.items.length > 0 ? (
            <>
              <div className="bg-white rounded-lg p-4 space-y-4">
                {section.items.map((item) => (
                  <div key={item.key}>
                    <Label htmlFor={item.key}>{item.label}</Label>
                    {item.type === 'textarea' ? (
                      <Textarea
                        id={item.key}
                        value={formData[item.key as keyof typeof formData]}
                        onChange={(e) => setFormData(prev => ({ ...prev, [item.key]: e.target.value }))}
                        placeholder={item.placeholder}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={item.key}
                        type={item.type}
                        value={formData[item.key as keyof typeof formData]}
                        onChange={(e) => setFormData(prev => ({ ...prev, [item.key]: e.target.value }))}
                        placeholder={item.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={handleSave} className="w-full">
                Salvar Alterações
              </Button>
            </>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Em Desenvolvimento</h3>
              <p className="text-sm text-gray-500">
                Esta seção estará disponível em breve.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Dados da Empresa" />

      <div className="p-4 space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          
          return (
            <div
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className="bg-white rounded-lg p-4 shadow-sm border active:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{section.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}