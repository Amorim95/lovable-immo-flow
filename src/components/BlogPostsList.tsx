import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit2, Trash2, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BlogPostsListProps {
  onNewPost: () => void;
  onEditPost: (postId: string) => void;
}

export function BlogPostsList({ onNewPost, onEditPost }: BlogPostsListProps) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);

  const postsQuery = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir o post "${title}"? Esta ação é irreversível.`)) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Post excluído", description: `"${title}" foi removido.` });
      postsQuery.refetch();
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Todos os Posts</CardTitle>
            <CardDescription>Gerencie os artigos do Blog.Imob</CardDescription>
          </div>
          <Button onClick={onNewPost}>
            <Plus className="w-4 h-4 mr-2" /> Criar Novo Post
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent>
        {postsQuery.isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Carregando posts...</div>
        ) : (postsQuery.data?.length || 0) === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Nenhum post criado ainda. Clique em "Criar Novo Post" para começar.
          </div>
        ) : (
          <Table>
            <TableCaption>{postsQuery.data?.length} post(s)</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="hidden lg:table-cell">Autor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {postsQuery.data?.map((post: any) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="font-medium leading-tight max-w-[300px] truncate">{post.title}</div>
                    <div className="text-xs text-muted-foreground">/blog/{post.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.status === "published" ? "default" : "secondary"}>
                      {post.status === "published" ? "Publicado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {post.category || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {post.published_at
                      ? format(new Date(post.published_at), "dd/MM/yyyy", { locale: ptBR })
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {post.author_name || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {post.status === "published" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => onEditPost(post.id)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={deleting === post.id}
                        onClick={() => handleDelete(post.id, post.title)}
                      >
                        {deleting === post.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
