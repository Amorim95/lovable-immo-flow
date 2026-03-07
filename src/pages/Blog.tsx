import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const upcomingTopics = [
  "CRM para imobiliárias",
  "Como organizar leads imobiliários",
  "Funil de vendas imobiliário",
  "Automação de atendimento para corretores",
  "Gestão comercial para imobiliárias",
  "Como aumentar conversão de leads imobiliários",
  "Tecnologia e inovação no mercado imobiliário",
];

export default function Blog() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Blog.Imob — CRM Imobiliário, Gestão de Leads e Vendas | MeuCRM.Imob</title>
        <meta name="description" content="Conteúdos estratégicos sobre CRM imobiliário, gestão de leads, vendas imobiliárias e tecnologia para imobiliárias. Aprenda a estruturar processos comerciais e aumentar suas vendas." />
        <meta name="keywords" content="CRM imobiliário, CRM para imobiliária, CRM para corretores, gestão de leads imobiliários, funil de vendas imobiliário, sistema para imobiliária" />
        <link rel="canonical" href="https://lovable-immo-flow.lovable.app/blog" />
        <meta property="og:title" content="Blog.Imob — CRM Imobiliário, Gestão de Leads e Vendas" />
        <meta property="og:description" content="Conteúdos estratégicos sobre CRM imobiliário, gestão de leads e vendas imobiliárias." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://lovable-immo-flow.lovable.app/blog" />
      </Helmet>

      <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Hero */}
        <section className="relative overflow-hidden min-h-[60vh] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
          <div className="relative max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
              <FileText className="w-3.5 h-3.5" />
              Conteúdo Estratégico
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-gray-900">
              Blog<span className="text-blue-600">.Imob</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Conteúdos estratégicos sobre <strong className="text-gray-900">CRM imobiliário</strong>, gestão de leads, vendas imobiliárias e tecnologia para imobiliárias.
            </p>
            <p className="mt-4 text-base text-gray-500 max-w-xl mx-auto">
              Aprenda como estruturar processos comerciais, organizar leads e aumentar as vendas da sua imobiliária utilizando tecnologia e CRM.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 text-base"
                onClick={() => navigate("/conheca")}
              >
                Conhecer o CRM
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* Posts Section - Empty State */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Artigos e Conteúdos</h2>
              <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">
                Conhecimento prático para transformar sua operação imobiliária.
              </p>
            </div>

            {/* Empty state */}
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-10 md:p-14 text-center">
                <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Estamos preparando conteúdos estratégicos sobre CRM imobiliário, vendas e gestão imobiliária.
                </h3>
                <p className="text-gray-600 mb-8">Em breve você encontrará aqui conteúdos sobre:</p>
                <ul className="space-y-3 text-left max-w-md mx-auto mb-8">
                  {upcomingTopics.map((topic) => (
                    <li key={topic} className="flex items-start gap-3 text-gray-700 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Preview grid skeleton - shows the layout that will be used */}
            <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-40 pointer-events-none select-none" aria-hidden="true">
              {[1, 2, 3].map((i) => (
                <article key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                  <div className="aspect-video bg-gray-100" />
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-20 bg-gray-100 rounded-full" />
                      <span className="h-4 w-24 bg-gray-100 rounded" />
                    </div>
                    <div className="h-6 w-3/4 bg-gray-100 rounded" />
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-50 rounded" />
                      <div className="h-4 w-2/3 bg-gray-50 rounded" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Authority Section */}
        <section className="py-20 md:py-28 bg-gray-50">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Tecnologia e inteligência comercial para o mercado imobiliário
            </h2>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              O <strong className="text-gray-900">MeuCRM.Imob</strong> é uma plataforma criada para organizar o processo comercial de imobiliárias, centralizando leads, automações e acompanhamento de vendas em um único sistema.
            </p>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Nosso objetivo é ajudar imobiliárias e corretores a estruturarem processos mais eficientes e aumentarem suas conversões.
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 text-base"
                onClick={() => navigate("/conheca")}
              >
                Conhecer o CRM
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/lovable-uploads/default-crm-logo.png" alt="MeuCRM.Imob Logo" className="h-7 w-auto brightness-200" />
              <span className="text-sm text-gray-300 font-semibold">MeuCRM<span className="text-blue-400">.Imob</span></span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/conheca" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Conheça o CRM</a>
              <a href="/blog" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Blog.Imob</a>
            </div>
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} MeuCRM.Imob — Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
