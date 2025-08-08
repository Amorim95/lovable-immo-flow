-- Criar tabela de imóveis
CREATE TABLE IF NOT EXISTS public.imoveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID NOT NULL,
  
  -- Campos obrigatórios
  preco DECIMAL(12,2) NOT NULL,
  localizacao TEXT NOT NULL,
  endereco TEXT NOT NULL,
  descricao TEXT NOT NULL,
  
  -- Campos opcionais
  quartos INTEGER,
  condominio DECIMAL(10,2),
  iptu DECIMAL(10,2),
  
  -- Etiquetas/tags como boolean
  vaga_carro BOOLEAN DEFAULT false,
  banheiros INTEGER,
  aceita_animais BOOLEAN DEFAULT false,
  condominio_fechado BOOLEAN DEFAULT false,
  closet BOOLEAN DEFAULT false,
  portaria_24h BOOLEAN DEFAULT false,
  portao_eletronico BOOLEAN DEFAULT false,
  
  -- Para controle de visibilidade pública
  publico BOOLEAN DEFAULT false,
  slug TEXT UNIQUE -- Para links públicos
);

-- Criar tabela para imagens/vídeos dos imóveis
CREATE TABLE IF NOT EXISTS public.imovel_midias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  imovel_id UUID NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('imagem', 'video')),
  ordem INTEGER DEFAULT 0
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE TRIGGER update_imoveis_updated_at
  BEFORE UPDATE ON public.imoveis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para imóveis
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios imóveis
CREATE POLICY "Usuários podem ver seus próprios imóveis" 
ON public.imoveis 
FOR SELECT 
USING (user_id = auth.uid());

-- Usuários podem criar seus próprios imóveis
CREATE POLICY "Usuários podem criar seus próprios imóveis" 
ON public.imoveis 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seus próprios imóveis
CREATE POLICY "Usuários podem atualizar seus próprios imóveis" 
ON public.imoveis 
FOR UPDATE 
USING (user_id = auth.uid());

-- Usuários podem deletar seus próprios imóveis
CREATE POLICY "Usuários podem deletar seus próprios imóveis" 
ON public.imoveis 
FOR DELETE 
USING (user_id = auth.uid());

-- Acesso público para imóveis marcados como públicos
CREATE POLICY "Acesso público para imóveis públicos" 
ON public.imoveis 
FOR SELECT 
USING (publico = true);

-- RLS Policies para mídias
ALTER TABLE public.imovel_midias ENABLE ROW LEVEL SECURITY;

-- Usuários podem gerenciar mídias de seus imóveis
CREATE POLICY "Usuários podem gerenciar mídias de seus imóveis" 
ON public.imovel_midias 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.imoveis 
  WHERE id = imovel_midias.imovel_id 
  AND user_id = auth.uid()
));

-- Acesso público para mídias de imóveis públicos
CREATE POLICY "Acesso público para mídias de imóveis públicos" 
ON public.imovel_midias 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.imoveis 
  WHERE id = imovel_midias.imovel_id 
  AND publico = true
));

-- Função para gerar slug único
CREATE OR REPLACE FUNCTION public.generate_imovel_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Gerar slug baseado no id
  NEW.slug := 'imovel-' || substring(NEW.id::text from 1 for 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar slug automaticamente
CREATE OR REPLACE TRIGGER generate_imovel_slug_trigger
  BEFORE INSERT ON public.imoveis
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_imovel_slug();