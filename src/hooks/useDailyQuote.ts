import { useState, useEffect } from "react";
import { MOTIVATIONAL_QUOTES } from "@/constants/motivationalQuotes";

/**
 * Calcula qual frase do dia mostrar baseado na data atual.
 * O dia muda às 7:35 da manhã.
 * Usa rotação circular: após a última frase, volta para a primeira.
 */
function getDailyQuote(quotes: string[]): string {
  const now = new Date();
  const referenceDate = new Date('2025-02-02T07:35:00');
  
  // Ajusta para considerar que o dia muda às 7:35
  const adjustedNow = new Date(now);
  if (now.getHours() < 7 || (now.getHours() === 7 && now.getMinutes() < 35)) {
    adjustedNow.setDate(adjustedNow.getDate() - 1);
  }
  
  // Calcula dias desde a referência
  const diffTime = adjustedNow.getTime() - referenceDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
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
