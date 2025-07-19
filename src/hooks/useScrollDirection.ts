import { useState, useEffect } from 'react';

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      
      // Se estiver no topo da página, sempre mostrar o tab bar
      if (scrollY <= 10) {
        setScrollDirection('up');
        setLastScrollY(scrollY);
        return;
      }

      const direction = scrollY > lastScrollY ? 'down' : 'up';
      
      // Só atualizar se a diferença for significativa (reduz o flickering)
      if (direction !== scrollDirection && Math.abs(scrollY - lastScrollY) > 5) {
        setScrollDirection(direction);
      }
      setLastScrollY(scrollY > 0 ? scrollY : 0);
    };

    // Throttle para melhor performance
    let ticking = false;
    const throttledUpdateScrollDirection = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollDirection();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledUpdateScrollDirection, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledUpdateScrollDirection);
    };
  }, [scrollDirection, lastScrollY]);

  return scrollDirection;
}