import { useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';

export function DynamicPWAUpdater() {
  const { settings } = useCompany();

  useEffect(() => {
    const updatePWAIcons = () => {
      const iconUrl = settings.logo || '/lovable-uploads/09f7e1e7-f952-404f-8533-120ee54a68cd.png';
      
      // Update favicon
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = iconUrl;
      }

      // Update apple touch icons
      const appleTouchIcons = document.querySelectorAll('link[rel="apple-touch-icon"]') as NodeListOf<HTMLLinkElement>;
      appleTouchIcons.forEach(icon => {
        icon.href = iconUrl;
      });

      // Update Open Graph image
      const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
      if (ogImage) {
        ogImage.content = iconUrl;
      }

      // Update Twitter image
      const twitterImage = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement;
      if (twitterImage) {
        twitterImage.content = iconUrl;
      }

      // Update app title
      const appTitle = `${settings.name} - Sistema de Gestão de Leads`;
      document.title = appTitle;
      
      const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
      if (ogTitle) {
        ogTitle.content = appTitle;
      }

      // Update manifest dynamically
      updateManifest(iconUrl, settings.name);
    };

    updatePWAIcons();
  }, [settings.logo, settings.name]);

  const updateManifest = (iconUrl: string, companyName: string) => {
    // Create dynamic manifest
    const manifest = {
      name: `${companyName} - Sistema de Gestão de Leads`,
      short_name: companyName,
      description: "Sistema completo de CRM para imobiliárias com gestão de leads, dashboards e integração com Meta Ads",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#1e40af",
      orientation: "portrait-primary",
      scope: "/",
      lang: "pt-BR",
      categories: ["business", "productivity"],
      icons: [
        {
          src: iconUrl,
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: iconUrl,
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: iconUrl,
          sizes: "144x144",
          type: "image/png",
          purpose: "any"
        },
        {
          src: iconUrl,
          sizes: "96x96",
          type: "image/png",
          purpose: "any"
        },
        {
          src: iconUrl,
          sizes: "72x72",
          type: "image/png",
          purpose: "any"
        },
        {
          src: iconUrl,
          sizes: "48x48",
          type: "image/png",
          purpose: "any"
        }
      ],
      shortcuts: [
        {
          name: "Dashboard",
          short_name: "Dashboard",
          description: "Acessar dashboard principal",
          url: "/dashboards",
          icons: [
            {
              src: iconUrl,
              sizes: "96x96"
            }
          ]
        },
        {
          name: "Leads",
          short_name: "Leads",
          description: "Gerenciar leads",
          url: "/",
          icons: [
            {
              src: iconUrl,
              sizes: "96x96"
            }
          ]
        }
      ]
    };

    // Update manifest link
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      manifestLink.href = url;
    }
  };

  return null;
}