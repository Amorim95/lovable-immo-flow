import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  BarChart3, Zap, Smartphone, Palette, Share2,
  CheckCircle2, ArrowRight, Building2, Phone, Mail,
  Star, ChevronRight } from
"lucide-react";

const features = [
{
  icon: Palette,
  title: "Personalize o CRM com a Logo da sua Empresa",
  description: "Deixe o sistema com a cara do seu negócio. Adicione sua logo e fortaleça sua marca em cada interação."
},
{
  icon: Smartphone,
  title: "Aplicativo Mobile Rápido e Fácil de Usar",
  description: "Acesse leads, dashboards e notificações direto do celular com um app leve e intuitivo."
},
{
  icon: Share2,
  title: "Distribuição de Leads Rápida e Eficiente",
  description: "Leads distribuídos automaticamente para o próximo corretor disponível, sem atrasos."
},
{
  icon: Zap,
  title: "Repique Automático",
  description: "Redistribuição inteligente de leads não atendidos para garantir zero oportunidades perdidas."
},
{
  icon: BarChart3,
  title: "Dashboards Completos",
  description: "Métricas de performance por corretor, equipe e empresa em tempo real."
}];


const plans = [
{
  name: "Starter",
  price: "Consulte",
  description: "Ideal para corretores autônomos",
  features: [
  "Até 5 usuários",
  "Kanban de leads",
  "Notificações push",
  "Suporte por e-mail"],

  highlighted: false
},
{
  name: "Profissional",
  price: "Consulte",
  description: "Para imobiliárias em crescimento",
  features: [
  "Até 30 usuários",
  "Tudo do Starter",
  "Repique automático",
  "Dashboards completos",
  "Gestão de equipes",
  "Suporte prioritário"],

  highlighted: true
},
{
  name: "Enterprise",
  price: "Sob medida",
  description: "Para grandes operações",
  features: [
  "Usuários ilimitados",
  "Tudo do Profissional",
  "Site com domínio próprio",
  "Webhooks personalizados",
  "Onboarding dedicado",
  "SLA garantido"],

  highlighted: false
}];


export default function Conheca() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    empresa: "",
    mensagem: ""
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim() || !formData.email.trim() || !formData.telefone.trim()) {
      toast.error("Preencha nome, e-mail e telefone.");
      return;
    }

    setSending(true);
    // Simula envio — aqui pode integrar com edge function ou webhook futuramente
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
    setFormData({ nome: "", email: "", telefone: "", empresa: "", mensagem: "" });
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 flex items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Star className="w-3.5 h-3.5" />
              Dica de um Especialista em Vendas de Imóveis
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-gray-900">
              Você não precisa de um sistema que promete{" "}
              <span className="text-blue-600">fazer tudo.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl">
              Você precisa de uma ferramenta que cumpre <strong className="text-gray-900">(muito bem)</strong> o que foi feita para fazer.
              Chega de CRMs imobiliários complexos e lentos. Conheça um CRM focado apenas no que importa pra você hoje, <strong className="text-blue-600">VENDAS</strong>.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 text-base"
                onClick={() => document.getElementById("funcionalidades")?.scrollIntoView({ behavior: "smooth" })}>
                
                Quero conhecer
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              O que há de mais Avançado em Gestão Comercial hoje?
            </h2>
            <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">
              Conheça as Melhores Ferramentas focadas em Gestão de Leads.<br />
              Duvido que seu CRM tenha isso Hoje.
            </p>

            {/* Video */}
            <div className="mt-10 max-w-3xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border bg-card p-2">
                <div className="rounded-xl overflow-hidden aspect-video">
                  <iframe
                    src="https://www.youtube.com/embed/PIDRmt_kjnA"
                    title="Demonstração MeuCRM.Imob"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full" />
                  
                </div>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) =>
            <div
              key={f.title}
              className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300">
              
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.description}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">

            </h2>
            <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">
              Escolha o plano ideal para o tamanho da sua operação.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) =>
            <Card
              key={plan.name}
              className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
              plan.highlighted ?
              "border-blue-600 shadow-xl shadow-blue-100 scale-[1.02]" :
              "border-gray-100 hover:border-gray-200"}`
              }>
              
                {plan.highlighted &&
              <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs font-bold text-center py-1.5">
                    MAIS POPULAR
                  </div>
              }
                <CardContent className={`p-8 ${plan.highlighted ? "pt-12" : ""}`}>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  <div className="mt-6 mb-6">
                    <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat) =>
                  <li key={feat} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        {feat}
                      </li>
                  )}
                  </ul>
                  <Button
                  className={`w-full rounded-full ${
                  plan.highlighted ?
                  "bg-blue-600 hover:bg-blue-700 text-white" :
                  "bg-gray-900 hover:bg-gray-800 text-white"}`
                  }
                  onClick={() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })}>
                  
                    Fale conosco
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contato" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Pronto para acelerar suas vendas?
              </h2>
              <p className="mt-4 text-gray-600 text-lg leading-relaxed">
                Preencha o formulário e nossa equipe entrará em contato para apresentar o sistema e tirar todas as suas dúvidas.
              </p>
              <div className="mt-10 space-y-5">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm">Resposta em até 24h úteis</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm">Demonstração personalizada</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm">Suporte dedicado desde o primeiro dia</span>
                </div>
              </div>
            </div>

            <Card className="rounded-2xl border border-gray-200 shadow-lg">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome *</label>
                    <Input
                      placeholder="Seu nome completo"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      maxLength={100}
                      className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                    
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">E-mail *</label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      maxLength={255}
                      className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                    
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Telefone *</label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      maxLength={20}
                      className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                    
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Empresa</label>
                    <Input
                      placeholder="Nome da imobiliária"
                      value={formData.empresa}
                      onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                      maxLength={100}
                      className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                    
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mensagem</label>
                    <Textarea
                      placeholder="Conte um pouco sobre sua operação..."
                      value={formData.mensagem}
                      onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                      maxLength={1000}
                      rows={4}
                      className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                    
                  </div>
                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 text-base">
                    
                    {sending ? "Enviando..." : "Enviar mensagem"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/default-crm-logo.png" alt="Logo" className="h-7 w-auto brightness-200" />
            <span className="text-sm text-gray-300 font-semibold">
              MeuCRM<span className="text-blue-400">.Imob</span>
            </span>
          </div>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} MeuCRM.Imob — Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>);

}