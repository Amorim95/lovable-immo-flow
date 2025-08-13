import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Share2, Eye, MapPin, Bed, Bath, Car, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Imovel } from "@/types/crm";
import { useNavigate } from "react-router-dom";
import { MobileHeader } from "@/components/MobileHeader";
import { useUserRole } from "@/hooks/useUserRole";
import ImovelFormModal from "@/components/ImovelFormModal";

export default function MobileImoveis() {
  const navigate = useNavigate();
  const { isAdmin, isGestor, isDono } = useUserRole();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedImovel, setSelectedImovel] = useState<Imovel | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; preview: string; type: 'imagem' | 'video' }>>([]);
  const [uploading, setUploading] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    preco: "",
    localizacao: "",
    endereco: "",
    descricao: "",
    quartos: "",
    condominio: "",
    iptu: "",
    banheiros: "",
    vaga_carro: false,
    aceita_animais: false,
    condominio_fechado: false,
    closet: false,
    portaria_24h: false,
    portao_eletronico: false,
  });

  const fetchImoveisCallback = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImoveis(data || []);
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os imóveis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImoveisCallback();
  }, [fetchImoveisCallback]);

  // Função para recarregar a lista após operações
  const refreshImoveis = useCallback(async () => {
    const { data, error } = await supabase
      .from('imoveis')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao recarregar imóveis:', error);
      return;
    }
    
    setImoveis(data || []);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.preco || !formData.localizacao || !formData.endereco || !formData.descricao) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (!selectedImovel && uploadedFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma foto ou vídeo",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (!userId) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      // Função para extrair apenas números do preço para o banco
      const precoNumerico = parseFloat(formData.preco.replace(/[^\d,]/g, '').replace(',', '.'));

      const imovelData = {
        preco: precoNumerico,
        localizacao: formData.localizacao,
        endereco: formData.endereco,
        descricao: formData.descricao,
        quartos: formData.quartos ? parseInt(formData.quartos) : null,
        condominio: formData.condominio ? parseFloat(formData.condominio) : null,
        iptu: formData.iptu ? parseFloat(formData.iptu) : null,
        banheiros: formData.banheiros ? parseInt(formData.banheiros) : null,
        vaga_carro: formData.vaga_carro,
        aceita_animais: formData.aceita_animais,
        condominio_fechado: formData.condominio_fechado,
        closet: formData.closet,
        portaria_24h: formData.portaria_24h,
        portao_eletronico: formData.portao_eletronico,
        user_id: userId,
      };

      if (selectedImovel) {
        // Editando imóvel existente
        const { error: updateError } = await supabase
          .from('imoveis')
          .update(imovelData)
          .eq('id', selectedImovel.id);

        if (updateError) throw updateError;

        toast({
          title: "Sucesso",
          description: "Imóvel atualizado com sucesso!",
        });
      } else {
        // Criando novo imóvel
        const { data: newImovel, error: insertError } = await supabase
          .from('imoveis')
          .insert(imovelData)
          .select('id')
          .single();

        if (insertError) throw insertError;

        // Upload de arquivos apenas para novos imóveis
        if (uploadedFiles.length > 0) {
          await uploadFiles(newImovel.id);
        }

        toast({
          title: "Sucesso",
          description: "Imóvel cadastrado com sucesso!",
        });
      }

      refreshImoveis();
      resetForm();
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar imóvel:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o imóvel",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const uploadFiles = async (imovelId: string) => {
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const fileData = uploadedFiles[i];
        const fileExt = fileData.file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${await supabase.auth.getUser().then(u => u.data.user?.id)}/${imovelId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-media')
          .upload(filePath, fileData.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-media')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('imovel_midias')
          .insert({
            imovel_id: imovelId,
            tipo: fileData.type,
            url: publicUrl,
            ordem: i + 1,
          });

        if (dbError) throw dbError;
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    const validFiles = files.filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      
      if (!isValidSize) {
        toast({
          title: "Erro",
          description: `O arquivo ${file.name} é muito grande. Máximo 10MB.`,
          variant: "destructive",
        });
      }
      
      if (!isValidType) {
        toast({
          title: "Erro", 
          description: `O arquivo ${file.name} não é um tipo válido.`,
          variant: "destructive",
        });
      }
      
      return isValidSize && isValidType;
    });

    const newFiles = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'imagem' as const : 'video' as const,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const resetForm = () => {
    setFormData({
      preco: "",
      localizacao: "",
      endereco: "",
      descricao: "",
      quartos: "",
      condominio: "",
      iptu: "",
      banheiros: "",
      vaga_carro: false,
      aceita_animais: false,
      condominio_fechado: false,
      closet: false,
      portaria_24h: false,
      portao_eletronico: false,
    });
    setUploadedFiles([]);
  };

  const handleEdit = (imovel: Imovel) => {
    setSelectedImovel(imovel);
    setFormData({
      preco: imovel.preco?.toString() || "",
      localizacao: imovel.localizacao,
      endereco: imovel.endereco,
      descricao: imovel.descricao,
      quartos: imovel.quartos?.toString() || "",
      condominio: imovel.condominio?.toString() || "",
      iptu: imovel.iptu?.toString() || "",
      banheiros: imovel.banheiros?.toString() || "",
      vaga_carro: imovel.vaga_carro,
      aceita_animais: imovel.aceita_animais,
      condominio_fechado: imovel.condominio_fechado,
      closet: imovel.closet,
      portaria_24h: imovel.portaria_24h,
      portao_eletronico: imovel.portao_eletronico,
    });
    setIsEditModalOpen(true);
  };

  const handleView = (imovel: Imovel) => {
    navigate(`/imovel/${imovel.id}`);
  };

  const handleShare = async (imovel: Imovel) => {
    try {
      // Tornar o imóvel público se não estiver
      if (!imovel.publico) {
        const { error } = await supabase
          .from('imoveis')
          .update({ publico: true })
          .eq('id', imovel.id);

        if (error) throw error;
      }

      const shareUrl = `${window.location.origin}/imovel-publico/${imovel.slug}`;
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Link copiado!",
        description: "O link público do imóvel foi copiado para a área de transferência",
      });
    } catch (error) {
      console.error('Erro ao compartilhar imóvel:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o link de compartilhamento",
        variant: "destructive",
      });
    }
  };

  const filteredImoveis = imoveis.filter(imovel =>
    imovel.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    imovel.localizacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    imovel.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Imóveis" />
        <div className="p-4">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando imóveis...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Imóveis" />
      
      <div className="p-4 space-y-4">
        {/* Botões principais */}
        <div className="grid grid-cols-2 gap-3">
          {(isAdmin || isGestor || isDono) && (
            <Button 
              onClick={() => { resetForm(); setSelectedImovel(null); setIsCreateModalOpen(true); }}
              className="h-12 text-base font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Cadastrar
            </Button>
          )}
          
          <Button 
            variant="outline"
            onClick={() => navigate('/meu-site')}
            className={`h-12 text-base font-medium ${!(isAdmin || isGestor || isDono) ? 'col-span-2' : ''}`}
          >
            <Globe className="w-5 h-5 mr-2" />
            Meu Site
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar imóveis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Stats compactas */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-primary">{imoveis.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-green-600">{imoveis.filter(i => i.publico).length}</div>
              <div className="text-xs text-muted-foreground">Públicos</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-blue-600">
                {formatPrice(imoveis.length > 0 ? imoveis.reduce((sum, i) => sum + i.preco, 0) / imoveis.length : 0).replace('R$', '').trim()}
              </div>
              <div className="text-xs text-muted-foreground">Média</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Imóveis */}
        <div className="space-y-3">
          {filteredImoveis.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Nenhum imóvel encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filteredImoveis.map((imovel) => (
              <Card key={imovel.id} className="bg-white hover:shadow-md transition-shadow" onClick={() => handleView(imovel)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-primary">{formatPrice(imovel.preco)}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{imovel.localizacao}</span>
                      </div>
                    </div>
                    
                    {imovel.publico && (
                      <Badge variant="secondary" className="text-xs">Público</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {imovel.endereco}
                  </p>

                  {/* Características */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    {imovel.quartos && (
                      <div className="flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                        <span>{imovel.quartos}</span>
                      </div>
                    )}
                    {imovel.banheiros && (
                      <div className="flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        <span>{imovel.banheiros}</span>
                      </div>
                    )}
                    {imovel.vaga_carro && (
                      <div className="flex items-center gap-1">
                        <Car className="w-4 h-4" />
                        <span>Vaga</span>
                      </div>
                    )}
                  </div>

                  {/* Botões de ação */}
                  <div className="grid grid-cols-3 gap-2" onClick={(e) => e.stopPropagation()}>
                     <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(imovel)}
                        className="text-xs px-2"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                      {(isAdmin || isGestor || isDono) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(imovel)}
                          className="text-xs px-2"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                      )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(imovel)}
                      className="text-xs px-2"
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Modais */}
      <ImovelFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Cadastrar Imóvel"
        formData={formData}
        setFormData={setFormData}
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
        handleSubmit={handleSubmit}
        handleFileUpload={handleFileUpload}
        removeFile={removeFile}
        uploading={uploading}
        selectedImovel={selectedImovel}
      />

      <ImovelFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Imóvel"
        formData={formData}
        setFormData={setFormData}
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
        handleSubmit={handleSubmit}
        handleFileUpload={handleFileUpload}
        removeFile={removeFile}
        uploading={uploading}
        selectedImovel={selectedImovel}
      />
    </div>
  );
}