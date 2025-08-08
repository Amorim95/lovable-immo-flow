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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informações de Contato */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Nossas Informações</h2>
                  
                  <div className="space-y-4">
                    {settings.site_email && (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
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
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Phone className="w-5 h-5 text-primary" />
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

                    {settings.site_whatsapp && (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">WhatsApp</p>
                          <a 
                            href={`https://wa.me/${settings.site_whatsapp}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {settings.site_whatsapp}
                          </a>
                        </div>
                      </div>
                    )}

                    {settings.site_address && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Endereço</p>
                          <p className="text-muted-foreground">{settings.site_address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Redes Sociais */}
              {(settings.site_facebook || settings.site_instagram) && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Redes Sociais</h3>
                    <div className="space-y-3">
                      {settings.site_facebook && (
                        <a 
                          href={settings.site_facebook} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <div className="w-8 h-8 bg-blue-600 rounded text-white flex items-center justify-center text-sm font-bold">
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
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded text-white flex items-center justify-center text-sm">
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

            {/* Formulário de Contato */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Envie uma Mensagem</h2>
                  
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nome</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="seu@email.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Telefone</label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Assunto</label>
                      <select className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        <option value="">Selecione um assunto</option>
                        <option value="compra">Interesse em compra</option>
                        <option value="venda">Quero vender meu imóvel</option>
                        <option value="aluguel">Interesse em aluguel</option>
                        <option value="avaliacao">Avaliação de imóvel</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Mensagem</label>
                      <textarea
                        rows={5}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                        placeholder="Descreva como podemos ajudá-lo..."
                      ></textarea>
                    </div>
                    
                    <Button type="submit" className="w-full">
                      Enviar Mensagem
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
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