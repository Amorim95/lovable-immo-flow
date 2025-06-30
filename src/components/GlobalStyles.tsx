
import { useEffect } from 'react';

export function GlobalStyles() {
  useEffect(() => {
    // Adiciona estilos globais para melhorar a largura do menu minimizado
    const style = document.createElement('style');
    style.innerHTML = `
      /* Aumenta a largura do menu minimizado */
      .sidebar[data-state="collapsed"] {
        width: 80px !important;
      }
      
      /* Remove o símbolo + das colunas */
      .kanban-column-header .add-button {
        display: none !important;
      }
      
      /* Melhora a visualização dos ícones no menu minimizado */
      .sidebar[data-state="collapsed"] .sidebar-menu-button {
        justify-content: center;
        padding: 12px;
      }
      
      .sidebar[data-state="collapsed"] .sidebar-menu-button svg {
        width: 20px;
        height: 20px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
}
