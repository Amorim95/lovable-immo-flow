import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/contexts/CompanyContext";
import { useNavigate } from "react-router-dom";

export default function SobreNos() {
  const { settings } = useCompany();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img 
                src={settings.logo || "/lovable-uploads/default-crm-logo.png"} 
                alt={settings.name} 
                className="h-12 w-auto"
              />
            </div>
            
            <div></div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Título */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Sobre Nós</h1>
            <p className="text-xl text-muted-foreground">
              Conheça nossa história e nossos valores
            </p>
          </div>

          {/* Conteúdo */}
          <Card>
            <CardContent className="p-8">
              {settings.siteAbout ? (
                <div className="prose prose-lg max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-lg">
                    {settings.siteAbout}
                  </p>
                </div>
              ) : (
                <div className="prose prose-lg max-w-none">
                  <h2 className="text-2xl font-semibold text-foreground mb-6">
                    Nossa História
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                    Somos uma imobiliária comprometida em encontrar o imóvel ideal para você. 
                    Com anos de experiência no mercado, oferecemos as melhores oportunidades 
                    e um atendimento personalizado para tornar seu sonho realidade.
                  </p>
                  
                  <h2 className="text-2xl font-semibold text-foreground mb-6">
                    Nossa Missão
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                    Nossa equipe especializada está sempre pronta para ajudá-lo em todas as 
                    etapas do processo, desde a busca até a conclusão do negócio. Acreditamos 
                    que encontrar o lar perfeito é mais do que uma transação comercial - é 
                    realizar sonhos e construir futuros.
                  </p>

                  <h2 className="text-2xl font-semibold text-foreground mb-6">
                    Nossos Valores
                  </h2>
                  <ul className="text-muted-foreground leading-relaxed text-lg space-y-3">
                    <li>• <strong>Transparência:</strong> Informações claras e honestas em todos os processos</li>
                    <li>• <strong>Excelência:</strong> Compromisso com a qualidade em cada atendimento</li>
                    <li>• <strong>Confiança:</strong> Relacionamentos duradouros baseados na credibilidade</li>
                    <li>• <strong>Inovação:</strong> Sempre buscando as melhores soluções para nossos clientes</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações de Contato */}
          <Card className="mt-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Entre em Contato</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settings.siteEmail && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📧</span>
                    <div>
                      <p className="font-medium text-foreground">E-mail</p>
                      <a 
                        href={`mailto:${settings.siteEmail}`} 
                        className="text-primary hover:underline"
                      >
                        {settings.siteEmail}
                      </a>
                    </div>
                  </div>
                )}
                
                {settings.sitePhone && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📞</span>
                    <div>
                      <p className="font-medium text-foreground">Telefone</p>
                      <a 
                        href={`tel:${settings.sitePhone}`} 
                        className="text-primary hover:underline"
                      >
                        {settings.sitePhone}
                      </a>
                    </div>
                  </div>
                )}
                
                {settings.siteWhatsapp && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💬</span>
                    <div>
                      <p className="font-medium text-foreground">WhatsApp</p>
                      <a 
                        href={`https://wa.me/${settings.siteWhatsapp}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Conversar no WhatsApp
                      </a>
                    </div>
                  </div>
                )}
                
                {settings.siteAddress && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-medium text-foreground">Endereço</p>
                      <p className="text-muted-foreground">{settings.siteAddress}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {(settings.siteFacebook || settings.siteInstagram) && (
                <div className="mt-8 pt-6 border-t">
                  <p className="font-medium text-foreground mb-4">Siga-nos nas redes sociais</p>
                  <div className="flex gap-4">
                    {settings.siteFacebook && (
                      <a 
                        href={settings.siteFacebook} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <span>📘</span>
                        Facebook
                      </a>
                    )}
                    {settings.siteInstagram && (
                      <a 
                        href={settings.siteInstagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <span>📸</span>
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}