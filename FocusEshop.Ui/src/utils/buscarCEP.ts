export interface CEPResultado {
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

async function buscarBrasilAPI(limpo: string): Promise<CEPResultado | null> {
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
}

async function buscarViaCEP(limpo: string): Promise<CEPResultado | null> {
  const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.erro) return null;
  return {
    logradouro: data.logradouro || '',
    complemento: data.complemento || '',
    bairro: data.bairro || '',
    cidade: data.localidade || data.city || '',
    estado: data.uf || data.state || '',
  };
}

export async function buscarCEP(cep: string): Promise<CEPResultado | null> {
  const limpo = cep.replace(/\D/g, '');
  if (limpo.length !== 8) return null;
  const fontes = [buscarBrasilAPI, buscarViaCEP];
  for (const fonte of fontes) {
    try {
      const resultado = await fonte(limpo);
      if (resultado) return resultado;
    } catch {
      // tenta a próxima fonte
    }
  }
  return null;
}