import { useState, useEffect } from "react";
import { MOTIVATIONAL_QUOTES } from "@/constants/motivationalQuotes";

// Frases especiais com datas fixas (YYYY-MM-DD)
// Após essas datas, volta à rotação normal
const SPECIAL_QUOTES: Record<string, string> = {
  "2026-02-16": "Enquanto você diz \"eu mereço\", alguém está fazendo mais que você e conquistando o lugar que você sonha.",
  "2026-02-17": "Merecimento sem esforço é ilusão confortável.",
  "2026-02-18": "Faça hoje o que os fracos não fazem e viva o amanhã que os fortes desfrutam.",
};

/**
 * Calcula qual frase do dia mostrar baseado na data atual.
 * O dia muda às 7:35 da manhã.
 * Primeiro verifica frases especiais por data, depois usa rotação circular.
 */
function getDailyQuote(quotes: string[]): string {
  const now = new Date();
  
  // Calcula o "dia lógico" atual
  // Se for antes das 7:35, considera como o dia anterior
  let logicalYear = now.getFullYear();
  let logicalMonth = now.getMonth();
  let logicalDay = now.getDate();
  
  if (now.getHours() < 7 || (now.getHours() === 7 && now.getMinutes() < 35)) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    logicalYear = yesterday.getFullYear();
    logicalMonth = yesterday.getMonth();
    logicalDay = yesterday.getDate();
  }
  
  // Verificar frases especiais por data
  const dateKey = `${logicalYear}-${String(logicalMonth + 1).padStart(2, '0')}-${String(logicalDay).padStart(2, '0')}`;
  if (SPECIAL_QUOTES[dateKey]) {
    return SPECIAL_QUOTES[dateKey];
  }
  
  // Data de referência: 2 de fevereiro de 2025
  const referenceYear = 2025;
  const referenceMonth = 1;
  const referenceDay = 2;
  
  const logicalDate = new Date(logicalYear, logicalMonth, logicalDay, 0, 0, 0, 0);
  const refDate = new Date(referenceYear, referenceMonth, referenceDay, 0, 0, 0, 0);
  
  const diffTime = logicalDate.getTime() - refDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  const index = ((diffDays % quotes.length) + quotes.length) % quotes.length;
  
  return quotes[index];
}

export const useDailyQuote = () => {
  const [quote, setQuote] = useState(() => getDailyQuote(MOTIVATIONAL_QUOTES));
  
  useEffect(() => {
    // Atualiza a frase se o usuário ficar na página durante a mudança às 7:35
    const checkForUpdate = () => {
      const newQuote = getDailyQuote(MOTIVATIONAL_QUOTES);
      if (newQuote !== quote) {
        setQuote(newQuote);
      }
    };
    
    const interval = setInterval(checkForUpdate, 60000); // Verifica a cada minuto
    return () => clearInterval(interval);
  }, [quote]);
  
  return quote;
};
