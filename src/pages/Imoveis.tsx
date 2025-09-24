import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Share2, Eye, Home, MapPin, Bed, Bath, Car, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Imovel, ImovelMidia } from "@/types/crm";
import ImovelFormModal from "@/components/ImovelFormModal";

export default function Imoveis() {
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

      // Buscar company_id do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (userError || !userData?.company_id) {
        toast({
          title: "Erro",
          description: "Erro ao identificar empresa do usuário",
          variant: "destructive",
        });
        return;
      }

      // Função para extrair apenas números do preço para o banco
      const extractPrice = (priceString: string): number => {
        const numericValue = priceString.replace(/[^\d.,]/g, '').replace(',', '.');
        return parseFloat(numericValue) || 0;
      };

      const imovelData = {
        preco: extractPrice(formData.preco), // Converte para number apenas para o banco
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
        company_id: userData.company_id,
      };

      let imovelId: string;

      if (selectedImovel) {
        // Atualizar imóvel existente
        const { error } = await supabase
          .from('imoveis')
          .update(imovelData)
          .eq('id', selectedImovel.id);

        if (error) throw error;
        imovelId = selectedImovel.id;

        // Upload dos arquivos para imóveis editados
        if (uploadedFiles.length > 0) {
          await uploadFiles(imovelId, userId);
        }

        toast({
          title: "Sucesso",
          description: "Imóvel atualizado com sucesso!",
        });
      } else {
        // Criar novo imóvel
        const { data, error } = await supabase
          .from('imoveis')
          .insert(imovelData)
          .select('id')
          .single();

        if (error) throw error;
        imovelId = data.id;

        // Upload dos arquivos para novos imóveis
        if (uploadedFiles.length > 0) {
          await uploadFiles(imovelId, userId);
        }

        toast({
          title: "Sucesso",
          description: "Imóvel cadastrado com sucesso!",
        });
      }

      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedImovel(null);
      resetForm();
      refreshImoveis();
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

  const uploadFiles = async (imovelId: string, userId: string) => {
    console.log('Iniciando upload de arquivos:', uploadedFiles.length);
    
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const { file, type } = uploadedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${imovelId}/${Date.now()}.${fileExt}`;

        console.log('Fazendo upload do arquivo:', fileName, 'tipo:', type);

        const { error: uploadError } = await supabase.storage
          .from('property-media')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Erro ao fazer upload do arquivo:', uploadError);
          toast({
            title: "Erro no upload",
            description: `Erro ao fazer upload de ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('property-media')
          .getPublicUrl(fileName);

        console.log('Inserindo mídia no banco:', { imovelId, type, publicUrl });

        const { error: insertError } = await supabase
          .from('imovel_midias')
          .insert({
            imovel_id: imovelId,
            tipo: type,
            url: publicUrl,
            ordem: i + 1
          });

        if (insertError) {
          console.error('Erro ao inserir mídia no banco:', insertError);
          toast({
            title: "Erro",
            description: `Erro ao salvar mídia ${file.name} no banco`,
            variant: "destructive",
          });
        } else {
          console.log('Mídia inserida com sucesso');
        }
      }
    } catch (error) {
      console.error('Erro geral no upload:', error);
      toast({
        title: "Erro",
        description: "Erro geral no upload de arquivos",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o limite de 50MB`,
          variant: "destructive",
        });
        return;
      }

      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isVideo && !isImage) {
        toast({
          title: "Formato não suportado",
          description: `${file.name} deve ser uma imagem ou vídeo`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setUploadedFiles(prev => [...prev, {
          file,
          preview,
          type: isVideo ? 'video' : 'imagem'
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
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
      preco: imovel.preco?.toString() || "", // Preserva formatação existente
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
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando imóveis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Imóveis</h1>
          <p className="text-muted-foreground">Gerencie seus imóveis cadastrados</p>
        </div>
        
        {(isAdmin || isGestor || isDono) && (
          <Button onClick={() => { resetForm(); setSelectedImovel(null); setIsCreateModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Imóvel
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar por endereço, localização ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Imóveis</p>
                <p className="text-2xl font-bold">{imoveis.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Públicos</p>
                <p className="text-2xl font-bold">{imoveis.filter(i => i.publico).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Médio</p>
                <p className="text-xl font-bold">
                  {imoveis.length > 0 
                    ? formatPrice(imoveis.reduce((acc, curr) => acc + curr.preco, 0) / imoveis.length)
                    : formatPrice(0)
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Imóveis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredImoveis.map((imovel) => (
          <Card key={imovel.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleView(imovel)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{formatPrice(imovel.preco)}</CardTitle>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{imovel.localizacao}</span>
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {(isAdmin || isGestor || isDono) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(imovel)}
                      title="Editar imóvel"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare(imovel)}
                    title="Compartilhar imóvel"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-sm">{imovel.endereco}</p>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {imovel.descricao}
              </p>

              {/* Características */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
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

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {imovel.publico && (
                  <Badge variant="secondary" className="text-xs">Público</Badge>
                )}
                {imovel.aceita_animais && (
                  <Badge variant="outline" className="text-xs">Pet Friendly</Badge>
                )}
                {imovel.condominio_fechado && (
                  <Badge variant="outline" className="text-xs">Condomínio Fechado</Badge>
                )}
                {imovel.portaria_24h && (
                  <Badge variant="outline" className="text-xs">Portaria 24h</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredImoveis.length === 0 && (
        <div className="text-center py-12">
          <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            {searchTerm ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? 'Tente ajustar os filtros de busca' 
              : 'Comece cadastrando seu primeiro imóvel'
            }
          </p>
        </div>
      )}

      {/* Modals */}
      <ImovelFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Cadastrar Novo Imóvel"
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