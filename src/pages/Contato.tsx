import { ArrowLeft, Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/contexts/CompanyContext";

export default function Contato() {
  const { settings } = useCompany();

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            
            <div className="flex-1 flex justify-center">
              {settings.logo ? (
                <img src={settings.logo} alt={settings.name} className="h-8" />
              ) : (
                <h1 className="text-2xl font-bold text-primary">{settings.site_title || settings.name}</h1>
              )}
            </div>
            
            <div className="w-[72px]" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Entre em Contato</h1>
            <p className="text-lg text-muted-foreground">
              Estamos aqui para ajudar você a encontrar o imóvel perfeito
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Informações de Contato */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold mb-6 text-center">Nossas Informações</h2>
                
                <div className="space-y-6">
                  {settings.site_email && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Email</p>
                        <a 
                          href={`mailto:${settings.site_email}`} 
                          className="text-primary hover:underline"
                        >
                          {settings.site_email}
                        </a>
                      </div>
                    </div>
                  )}

                  {settings.site_phone && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Phone className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Telefone</p>
                        <a 
                          href={`tel:${settings.site_phone}`} 
                          className="text-primary hover:underline"
                        >
                          {settings.site_phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {settings.site_address && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Endereço</p>
                        <p className="text-muted-foreground">{settings.site_address}</p>
                      </div>
                    </div>
                  )}

                  {/* Botão do WhatsApp */}
                  {settings.site_whatsapp && (
                    <div className="pt-6 border-t">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-4">Fale Conosco pelo WhatsApp</h3>
                        <a 
                          href={`https://wa.me/${settings.site_whatsapp}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg transition-colors text-lg font-medium"
                        >
                          <MessageCircle className="w-6 h-6" />
                          Conversar no WhatsApp
                        </a>
                        <p className="text-sm text-muted-foreground mt-3">
                          Atendimento rápido e personalizado
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Redes Sociais */}
            {(settings.site_facebook || settings.site_instagram) && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-center">Redes Sociais</h3>
                  <div className="flex justify-center gap-6">
                    {settings.site_facebook && (
                      <a 
                        href={settings.site_facebook} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <div className="w-10 h-10 bg-blue-600 rounded-full text-white flex items-center justify-center text-lg font-bold">
                          f
                        </div>
                        Facebook
                      </a>
                    )}
                    {settings.site_instagram && (
                      <a 
                        href={settings.site_instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full text-white flex items-center justify-center text-lg">
                          📷
                        </div>
                        Instagram
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Seção Adicional */}
          <div className="mt-12 text-center">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-4">Horário de Atendimento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-muted-foreground">
                  <div>
                    <p className="font-medium">Segunda à Sexta</p>
                    <p>8:00 às 18:00</p>
                  </div>
                  <div>
                    <p className="font-medium">Sábados</p>
                    <p>8:00 às 14:00</p>
                  </div>
                </div>
                <p className="mt-4 text-sm">
                  *Atendimento via WhatsApp 24 horas
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}