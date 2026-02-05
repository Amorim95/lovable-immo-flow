import { useState, useEffect } from "react";
import { MOTIVATIONAL_QUOTES } from "@/constants/motivationalQuotes";

/**
 * Calcula qual frase do dia mostrar baseado na data atual.
 * O dia muda às 7:35 da manhã.
 * Usa rotação circular: após a última frase, volta para a primeira.
 */
function getDailyQuote(quotes: string[]): string {
  const now = new Date();
  
  // Data de referência: 2 de fevereiro de 2025 (apenas a data, sem horário)
  const referenceYear = 2025;
  const referenceMonth = 1; // Fevereiro (0-indexed)
  const referenceDay = 2;
  
  // Calcula o "dia lógico" atual
  // Se for antes das 7:35, considera como o dia anterior
  let logicalYear = now.getFullYear();
  let logicalMonth = now.getMonth();
  let logicalDay = now.getDate();
  
  if (now.getHours() < 7 || (now.getHours() === 7 && now.getMinutes() < 35)) {
    // Antes das 7:35, usa o dia anterior
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    logicalYear = yesterday.getFullYear();
    logicalMonth = yesterday.getMonth();
    logicalDay = yesterday.getDate();
  }
  
  // Cria datas normalizadas (meia-noite) para cálculo preciso de dias
  const logicalDate = new Date(logicalYear, logicalMonth, logicalDay, 0, 0, 0, 0);
  const refDate = new Date(referenceYear, referenceMonth, referenceDay, 0, 0, 0, 0);
  
  // Calcula dias desde a referência
  const diffTime = logicalDate.getTime() - refDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  // Índice circular (volta ao início após a última frase)
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
