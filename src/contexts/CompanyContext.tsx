import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CompanySettings {
  name: string;
  logo: string | null;
  theme: string;
  isDarkMode: boolean;
}

interface CompanyContextType {
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>({
    name: 'Click Imóveis',
    logo: null,
    theme: 'blue',
    isDarkMode: false
  });

  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <CompanyContext.Provider value={{ settings, updateSettings }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}