import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Calendar, Tag } from "lucide-react";
import BlogAudioPlayer from "@/components/BlogAudioPlayer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function renderMarkdown(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="blog-img" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Unordered lists
    .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
    // Line breaks to paragraphs
    .replace(/\n\n+/g, '\n\n');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Wrap remaining text blocks in <p>
  const lines = html.split('\n\n');
  html = lines
    .map((block) => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<img')) return block;
      return `<p>${block}</p>`;
    })
    .join('\n');

  return html;
}

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const postQuery = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!slug,
  });

  const post = postQuery.data;

  useEffect(() => {
    if (post) {
      document.title = post.meta_title || post.title;
      const meta = document.querySelector('meta[name="description"]');
      const desc = post.meta_description || post.summary || "";
      if (meta) meta.setAttribute("content", desc);
      else {
        const m = document.createElement("meta");
        m.name = "description";
        m.content = desc;
        document.head.appendChild(m);
      }
    }
  }, [post]);

  if (postQuery.isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (postQuery.error || !post) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Artigo não encontrado</h1>
        <Button onClick={() => navigate("/blog")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Blog
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Top nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/blog")} className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-1" /> Blog.Imob
          </Button>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-[700px] mx-auto px-6 py-10 md:py-16">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {post.category && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              <Tag className="w-3 h-3" /> {post.category}
            </span>
          )}
          {post.published_at && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {format(new Date(post.published_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          )}
          {post.author_name && (
            <span className="text-xs text-gray-500">por {post.author_name}</span>
          )}
        </div>

        {/* Audio Player */}
        <div className="mb-8">
          <BlogAudioPlayer audioUrl={post.audio_url} />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-[44px] font-extrabold leading-tight tracking-tight text-gray-900 mb-6">
          {post.title}
        </h1>

        {/* Summary */}
        {post.summary && (
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 border-l-4 border-blue-600 pl-4">
            {post.summary}
          </p>
        )}

        {/* Cover image */}
        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full rounded-2xl mb-10 aspect-video object-cover"
            loading="lazy"
          />
        )}

        {/* Content */}
        {post.content && (
          <div
            className="blog-article-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />
        )}

        {/* CTA */}
        <div className="mt-16 border-t border-gray-100 pt-10">
          <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Conheça o CRM imobiliário
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Organize seus leads, automatize processos e aumente suas vendas com o MeuCRM.Imob.
            </p>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8"
              onClick={() => { window.scrollTo(0, 0); navigate("/conheca"); }}
            >
              Conhecer o CRM
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </article>

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
  );
}
