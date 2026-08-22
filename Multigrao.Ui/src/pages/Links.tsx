import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSistemaStore } from '../store/sistemaStore';
import { midiaUrl } from '../utils/imageUrl';
import { parseLinktreeAparencia } from '../types/linktree';
import { LinkIcon } from 'lucide-react';

export default function Links() {
  const { slug } = useParams();
  const config = useSistemaStore((state) => state.config);
  const aparencia = parseLinktreeAparencia(config.linktreeAparencia);
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

  const temaEscuro = aparencia.temaFundo !== 'claro';

  let estiloFundo: React.CSSProperties;
  switch (aparencia.temaFundo) {
    case 'escuro':
      estiloFundo = { backgroundColor: '#111827' };
      break;
    case 'gradiente':
      estiloFundo = { background: `linear-gradient(165deg, ${aparencia.corFundo1} 0%, ${aparencia.corFundo2} 100%)` };
      break;
    case 'imagem':
      estiloFundo = {
        backgroundImage: `linear-gradient(rgba(0,0,0,${aparencia.escurecerImagem / 100}), rgba(0,0,0,${aparencia.escurecerImagem / 100})), url(${midiaUrl(aparencia.imagemFundoUrl) || aparencia.imagemFundoUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
      break;
    default:
      estiloFundo = { backgroundColor: aparencia.corFundo1 };
  }

  const raioAvatar = aparencia.formatoAvatar === 'circular' ? 'rounded-full' : aparencia.formatoAvatar === 'arredondado' ? 'rounded-3xl' : 'rounded-none';
  const fonteTitulo = aparencia.fonteTitulo === 'serifada' ? 'font-serif' : '';

  const classeBotao = 'w-full text-center py-4 px-6 font-bold transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2';
  const estiloBotao: React.CSSProperties = { borderRadius: `${aparencia.raioBotao}px` };
  if (aparencia.sombraBotao && aparencia.formatoBotao === 'cheio') {
    estiloBotao.boxShadow = `0 8px 20px -6px ${corPrincipal}66`;
  }

  const estiloTextoBotao = (): React.CSSProperties => {
    switch (aparencia.formatoBotao) {
      case 'outline':
        return { border: `2px solid ${corPrincipal}`, color: temaEscuro ? '#ffffff' : corPrincipal, backgroundColor: 'transparent' };
      case 'soft':
        return { backgroundColor: `${corPrincipal}26`, color: temaEscuro ? '#ffffff' : corPrincipal };
      default:
        return { backgroundColor: corPrincipal, color: '#ffffff' };
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4" style={estiloFundo}>
      <div className="w-full max-w-md flex flex-col items-center">

        {logo ? (
          <img src={logo} alt={config.nomeEmpresa} className={`w-24 h-24 object-cover shadow-md mb-4 border-2 ${temaEscuro ? 'border-white/20' : 'border-gray-100'} ${raioAvatar}`} />
        ) : (
          <div className={`w-24 h-24 shadow-md mb-4 bg-gray-200 flex items-center justify-center border-2 ${temaEscuro ? 'border-white/20' : 'border-gray-100'} text-gray-400 ${raioAvatar}`}>
            <LinkIcon size={32} />
          </div>
        )}

        <h1 className={`text-xl font-bold mb-1 ${temaEscuro ? 'text-white' : 'text-gray-900'} ${fonteTitulo}`}>{config.nomeEmpresa}</h1>
        {aparencia.mostrarSlogan && config.slogan && (
          <p className={`text-sm mb-8 text-center ${temaEscuro ? 'text-white/70' : 'text-gray-500'}`}>{config.slogan}</p>
        )}

        <div className="w-full flex flex-col gap-4">
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${classeBotao} ${aparencia.formatoBotao === 'cheio' ? 'hover:shadow-lg' : ''}`}
              style={{ ...estiloBotao, ...estiloTextoBotao() }}
            >
              {link.icone && <span>{link.icone}</span>}
              {link.titulo}
            </a>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className={`text-xs uppercase tracking-widest font-semibold ${temaEscuro ? 'text-white/50' : 'text-gray-400'}`}>Tecnologia Multigrãos</p>
        </div>
      </div>
    </div>
  );
}
