import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSistemaStore } from '../store/sistemaStore';
import { midiaUrl } from '../utils/imageUrl';
import { LinkIcon } from 'lucide-react';

export default function Links() {
  const { slug } = useParams();
  const config = useSistemaStore((state) => state.config);
  const corPrincipal = config.corPrincipal || '#10b981';
  const logo = midiaUrl(config.logoUrl);

  const [links, setLinks] = useState<{ titulo: string; url: string; icone?: string }[]>([]);

  useEffect(() => {
    document.title = `Links - ${config.nomeEmpresa}`;
    
    // Parse links from config.linksBio
    if (config.linksBio) {
      try {
        const parsed = JSON.parse(config.linksBio);
        if (Array.isArray(parsed)) {
          setLinks(parsed);
        }
      } catch (e) {
        console.error("Erro ao parsear links da bio", e);
      }
    } else {
      // Default fallback if empty
      setLinks([
        { titulo: 'Acessar Loja Virtual', url: `/${slug}/commerce` }
      ]);
    }
  }, [config.linksBio, config.nomeEmpresa, slug]);

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4" style={{ backgroundColor: config.designEcommerce === 'wild' ? '#ffffff' : '#f9fafb' }}>
      <div className="w-full max-w-md flex flex-col items-center">
        
        {logo ? (
          <img src={logo} alt={config.nomeEmpresa} className="w-24 h-24 rounded-full object-cover shadow-md mb-4 border-2 border-gray-100" />
        ) : (
          <div className="w-24 h-24 rounded-full shadow-md mb-4 bg-gray-200 flex items-center justify-center border-2 border-gray-100 text-gray-400">
            <LinkIcon size={32} />
          </div>
        )}
        
        <h1 className="text-xl font-bold text-gray-900 mb-1">{config.nomeEmpresa}</h1>
        {config.slogan && <p className="text-sm text-gray-500 mb-8 text-center">{config.slogan}</p>}

        <div className="w-full flex flex-col gap-4">
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-4 px-6 rounded-xl text-white font-bold transition-transform hover:scale-105 hover:shadow-lg active:scale-95"
              style={{ backgroundColor: corPrincipal }}
            >
              {link.titulo}
            </a>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Tecnologia Multigrãos</p>
        </div>
      </div>
    </div>
  );
}
