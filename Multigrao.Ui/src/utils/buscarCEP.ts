export interface CEPResultado {
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export async function buscarCEP(cep: string): Promise<CEPResultado | null> {
  const limpo = cep.replace(/\D/g, '');
  if (limpo.length !== 8) return null;
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${limpo}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      logradouro: data.logradouro || data.street || '',
      complemento: data.complemento || '',
      bairro: data.bairro || data.neighborhood || '',
      cidade: data.city || data.localidade || '',
      estado: data.state || data.uf || '',
    };
  } catch {
    return null;
  }
}
