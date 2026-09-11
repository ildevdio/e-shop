import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/api/Banners';

export type TipoLinkBanner = '' | 'produto' | 'categoria' | 'departamento' | 'externo';
export type PosicaoBanner = 'carrossel' | 'secao' | 'ambos';

export interface Banner {
  id: number;
  empresaId: number;
  titulo: string;
  subtitulo: string | null;
  imagemUrl: string;
  linkTipo: TipoLinkBanner;
  linkValor: string | null;
  posicao: PosicaoBanner;
  ordem: number;
  ativo: boolean;
  dataInicio: string | null;
  dataFim: string | null;
}

export interface CriarBannerDto {
  titulo: string;
  subtitulo?: string | null;
  imagemUrl: string;
  linkTipo: TipoLinkBanner;
  linkValor?: string | null;
  posicao: PosicaoBanner;
  ordem: number;
  ativo: boolean;
  dataInicio?: Date | null;
  dataFim?: Date | null;
}

export const bannerService = {
  getBanners: async (): Promise<Banner[]> => {
    try {
      const response = await axios.get(API_URL);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar banners', error);
      return [];
    }
  },

  getAtivos: async (): Promise<Banner[]> => {
    try {
      const response = await axios.get(`${API_URL}/ativos`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar banners ativos', error);
      return [];
    }
  },

  criarBanner: async (dto: CriarBannerDto): Promise<Banner | null> => {
    try {
      const response = await axios.post(API_URL, dto);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar banner', error);
      return null;
    }
  },

  atualizarBanner: async (id: number, dto: CriarBannerDto): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/${id}`, dto);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar banner', error);
      return false;
    }
  },

  deletarBanner: async (id: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar banner', error);
      return false;
    }
  },
};