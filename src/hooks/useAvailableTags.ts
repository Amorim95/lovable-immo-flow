import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Tag {
  id: string;
  nome: string;
  cor: string;
}

export function useAvailableTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('lead_tags')
        .select('id, nome, cor')
        .order('nome');

      if (error) {
        console.error('Error loading tags:', error);
        setError('Erro ao carregar tags');
        return;
      }

      setTags(data || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      setError('Erro interno ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  return {
    tags,
    loading,
    error,
    refreshTags: loadTags
  };
}