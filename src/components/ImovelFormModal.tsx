import React, { useCallback, memo } from "react";
import { Upload, X, Image, Video } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Imovel } from "@/types/crm";

interface FormData {
  preco: string;
  localizacao: string;
  endereco: string;
  descricao: string;
  quartos: string;
  condominio: string;
  iptu: string;
  banheiros: string;
  vaga_carro: boolean;
  aceita_animais: boolean;
  condominio_fechado: boolean;
  closet: boolean;
  portaria_24h: boolean;
  portao_eletronico: boolean;
}

interface UploadedFile {
  file: File;
  preview: string;
  type: 'imagem' | 'video';
}

interface ImovelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  handleSubmit: (e: React.FormEvent) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  uploading: boolean;
  selectedImovel: Imovel | null;
}

const ImovelFormModal = memo(({
  isOpen,
  onClose,
  title,
  formData,
  setFormData,
  uploadedFiles,
  setUploadedFiles,
  handleSubmit,
  handleFileUpload,
  removeFile,
  uploading,
  selectedImovel
}: ImovelFormModalProps) => {
  
  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [setFormData]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload de Mídias */}
          <div className="space-y-3">
            <Label>Fotos e Vídeos *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Clique para adicionar fotos e vídeos ou arraste aqui
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos: JPG, PNG, MP4, MOV (máx. 50MB cada)
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 mt-2 transition-colors"
                >
                  Selecionar Arquivos
                </label>
              </div>
            </div>
            
            {/* Preview dos arquivos */}
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {uploadedFiles.map((fileObj, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      {fileObj.type === 'imagem' ? (
                        <img
                          src={fileObj.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                      {fileObj.type === 'imagem' ? <Image className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preco">Preço *</Label>
              <input
                id="preco"
                type="text"
                value={formData.preco}
                onChange={(e) => updateField('preco', e.target.value)}
                onFocus={(e) => {
                  setTimeout(() => {
                    const input = e.target as HTMLInputElement;
                    const length = input.value.length;
                    input.setSelectionRange(length, length);
                  }, 0);
                }}
                onClick={(e) => {
                  const input = e.target as HTMLInputElement;
                  input.setSelectionRange(input.selectionStart || 0, input.selectionStart || 0);
                }}
                placeholder="Ex: 450000 ou R$ 450.000"
                required
                autoComplete="off"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div>
              <Label htmlFor="localizacao">Localização *</Label>
              <input
                id="localizacao"
                type="text"
                value={formData.localizacao}
                onChange={(e) => updateField('localizacao', e.target.value)}
                placeholder="Ex: Bairro, Cidade"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="endereco">Endereço Completo *</Label>
            <input
              id="endereco"
              type="text"
              value={formData.endereco}
              onChange={(e) => updateField('endereco', e.target.value)}
              placeholder="Ex: Rua das Flores, 123"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => updateField('descricao', e.target.value)}
              placeholder="Descreva o imóvel..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="quartos">Quartos</Label>
              <input
                id="quartos"
                type="number"
                value={formData.quartos}
                onChange={(e) => updateField('quartos', e.target.value)}
                placeholder="0"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div>
              <Label htmlFor="banheiros">Banheiros</Label>
              <input
                id="banheiros"
                type="number"
                value={formData.banheiros}
                onChange={(e) => updateField('banheiros', e.target.value)}
                placeholder="0"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div>
              <Label htmlFor="condominio">Condomínio</Label>
              <input
                id="condominio"
                type="number"
                step="0.01"
                value={formData.condominio}
                onChange={(e) => updateField('condominio', e.target.value)}
                placeholder="0.00"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div>
              <Label htmlFor="iptu">IPTU</Label>
              <input
                id="iptu"
                type="number"
                step="0.01"
                value={formData.iptu}
                onChange={(e) => updateField('iptu', e.target.value)}
                placeholder="0.00"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Etiquetas</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'vaga_carro', label: 'Vaga de carro' },
                { key: 'aceita_animais', label: 'Aceita animais' },
                { key: 'condominio_fechado', label: 'Condomínio fechado' },
                { key: 'closet', label: 'Closet' },
                { key: 'portaria_24h', label: 'Portaria 24h' },
                { key: 'portao_eletronico', label: 'Portão eletrônico' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={formData[key as keyof FormData] as boolean}
                    onCheckedChange={(checked) => updateField(key as keyof FormData, checked)}
                  />
                  <Label htmlFor={key} className="text-sm">{label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                selectedImovel ? 'Atualizar' : 'Cadastrar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

ImovelFormModal.displayName = 'ImovelFormModal';

export default ImovelFormModal;