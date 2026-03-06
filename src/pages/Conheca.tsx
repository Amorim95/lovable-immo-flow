import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  BarChart3, Zap, Smartphone, Palette, Share2,
  CheckCircle2, ArrowRight, Star, ChevronRight, X
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";

const features = [
  { icon: Palette, title: "Personalize o CRM com a Logo da sua Empresa", description: "Deixe o sistema com a cara do seu negócio. Adicione sua logo e fortaleça sua marca em cada interação." },
  { icon: Smartphone, title: "Aplicativo Mobile Rápido e Fácil de Usar", description: "Acesse leads, dashboards e notificações direto do celular com um app leve e intuitivo." },
  { icon: Share2, title: "Distribuição de Leads Rápida e Eficiente", description: "Leads distribuídos automaticamente para o próximo corretor disponível, sem atrasos." },
  { icon: Zap, title: "Repique Automático", description: "Redistribuição inteligente de leads não atendidos para garantir zero oportunidades perdidas." },
  { icon: BarChart3, title: "Dashboards Completos", description: "Métricas de performance por corretor, equipe e empresa em tempo real." },
];

const plans = [
  {
    name: "Você tem tudo por um único valor.",
    price: "R$450 por mês",
    features: ["Aplicativo Mobile", "Distribuição de Leads", "Dashboards Avançados", "Integração com campanhas"],
    highlighted: true,
  },
];

const perfilOptions = ["Imobiliária", "Corretor Autônomo", "Gestor de equipe de corretores", "Construtora", "Incorporadora"];
const pessoasOptions = ["Só eu", "2 a 5 pessoas", "6 a 15 pessoas", "16 a 40 pessoas", "Mais de 40 pessoas"];
const leadsOptions = ["Indicação", "Portais imobiliários", "Tráfego pago", "Redes sociais", "Não tenho geração previsível"];
const desafioOptions = ["Falta de leads qualificados", "Leads que não respondem", "Corretores não atendem rápido", "Dependência de portais", "Não tenho problemas com meus Leads"];

export default function Conheca() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    perfil: "",
    pessoas: "",
    leads: "",
    desafio: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.telefone.trim() || !form.email.trim()) {
      toast.error("Preencha nome, telefone e e-mail.");
      return;
    }
    if (!form.perfil || !form.pessoas || !form.leads || !form.desafio) {
      toast.error("Responda todas as perguntas.");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

  const resetForm = () => {
    setForm({ nome: "", telefone: "", email: "", perfil: "", pessoas: "", leads: "", desafio: "" });
    setSent(false);
    setDialogOpen(false);
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
            <div className="mt-10 max-w-3xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-600/10 border border-gray-200 bg-white p-2">
                <div className="rounded-xl overflow-hidden aspect-video">
                  <iframe
                    src="https://www.youtube.com/embed/lgir3wDyQKU?modestbranding=1&rel=0&showinfo=0&controls=0&iv_load_policy=3&cc_load_policy=0&disablekb=1"
                    title="Demonstração MeuCRM.Imob"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Direto ao Ponto, sem Enrolação.</h2>
            <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">Você não precisa de uma reunião para saber o Preço.</p>
          </div>
          <div className="flex justify-center max-w-md mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${plan.highlighted ? "border-blue-600 shadow-xl shadow-blue-100 scale-[1.02]" : "border-gray-100 hover:border-gray-200"}`}>
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs font-bold text-center py-1.5">ÚNICO PLANO</div>
                )}
                <CardContent className={`p-8 ${plan.highlighted ? "pt-12" : ""}`}>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-6 mb-6">
                    <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full rounded-full ${plan.highlighted ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-900 hover:bg-gray-800 text-white"}`}
                    onClick={() => setDialogOpen(true)}
                  >
                    Quero Vender Mais
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Flow.Imob */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Precisa de um Site Arrojado e uma gestão dos seus imóveis de forma eficiente?</h2>
          <p className="mt-6 text-lg text-gray-600">Conheça também a <strong className="text-blue-600">Flow.Imob</strong>, onde você:</p>
          <ul className="mt-8 space-y-4 text-left max-w-md mx-auto">
            {["Cadastra seus Imóveis", "Controla as Vendas de Unidade por Unidade", "Gestão de Aluguéis", "Cobranças Automáticas", "Tudo isso incorporado automaticamente no seu Site"].map((item) => (
              <li key={item} className="flex items-start gap-3 text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 inline-block bg-blue-50 border border-blue-200 rounded-2xl px-8 py-4">
            <p className="text-lg font-semibold text-blue-700">Clientes da MeuCRM.Imob tem <span className="text-2xl font-extrabold">30%</span> de desconto vitalício!</p>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/default-crm-logo.png" alt="Logo" className="h-7 w-auto brightness-200" />
            <span className="text-sm text-gray-300 font-semibold">MeuCRM<span className="text-blue-400">.Imob</span></span>
          </div>
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} MeuCRM.Imob — Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Dialog Formulário */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto mx-4 rounded-2xl sm:mx-auto">
          {sent ? (
            <div className="py-10 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-blue-600 mx-auto" />
              <h3 className="text-2xl font-bold text-gray-900">Obrigado pelo interesse!</h3>
              <p className="text-gray-600">Entraremos em contato em breve para agendar a apresentação da ferramenta.</p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full mt-4" onClick={resetForm}>Fechar</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">Vamos Conhecer Melhor a Ferramenta?</DialogTitle>
                <DialogDescription className="text-gray-600">Preencha as informações abaixo para agendarmos uma apresentação.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input placeholder="Seu nome completo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone / WhatsApp</Label>
                  <Input placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>

                <RadioQuestion label="Qual é o seu perfil no mercado imobiliário?" options={perfilOptions} value={form.perfil} onChange={(v) => setForm({ ...form, perfil: v })} />
                <RadioQuestion label="Quantas pessoas trabalham hoje na sua operação comercial?" options={pessoasOptions} value={form.pessoas} onChange={(v) => setForm({ ...form, pessoas: v })} />
                <RadioQuestion label="Hoje, como você gera a maior parte dos seus leads?" options={leadsOptions} value={form.leads} onChange={(v) => setForm({ ...form, leads: v })} />
                <RadioQuestion label="Qual o maior desafio hoje para vender mais imóveis?" options={desafioOptions} value={form.desafio} onChange={(v) => setForm({ ...form, desafio: v })} />

                <Button type="submit" disabled={sending} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full">
                  {sending ? "Enviando..." : "Enviar"}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RadioQuestion({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-800">{label}</Label>
      <RadioGroup value={value} onValueChange={onChange} className="space-y-1.5">
        {options.map((opt) => (
          <div key={opt} className="flex items-center gap-2">
            <RadioGroupItem value={opt} id={opt} />
            <Label htmlFor={opt} className="text-sm text-gray-700 font-normal cursor-pointer">{opt}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
