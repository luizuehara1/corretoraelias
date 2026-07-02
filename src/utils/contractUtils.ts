export function formatCurrencyBR(valor: number | string | undefined): string {
  if (valor === undefined || valor === null) return 'R$ 0,00';
  const parsed = typeof valor === 'string' ? parseFloat(valor) : valor;
  if (isNaN(parsed)) return 'R$ 0,00';
  return parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function parseCurrencyBR(value: string): number {
  if (!value) return 0;
  // Strip non-digits and preserve decimal
  const clean = value.replace(/[^\d,]/g, '').replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatCPF(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return value;
}

export function formatCNPJ(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 14) {
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
  return value;
}

export function formatPhone(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return value;
}

export function formatDateBR(date: string | Date | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

export function normalizarTexto(texto: string): string {
  if (!texto) return '';
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function montarEnderecoCompleto(dados: any): string {
  if (!dados) return '';
  const parts = [];
  if (dados.endereco || dados.location) parts.push(dados.endereco || dados.location);
  if (dados.numero) parts.push(dados.numero);
  if (dados.complemento) parts.push(dados.complemento);
  if (dados.bairro || dados.neighborhood) parts.push(dados.bairro || dados.neighborhood);
  if (dados.cidade || dados.city) parts.push(dados.cidade || dados.city);
  if (dados.estado || dados.state) parts.push(dados.estado || dados.state);
  if (dados.cep) parts.push(`CEP: ${dados.cep}`);
  return parts.join(', ');
}

export function getTextoPagamentoPDF(dados: any): string {
  if (!dados) return '';
  const list = [];
  if (dados.valorProposta || dados.valorTotal) {
    list.push(`Valor do Negócio: ${formatCurrencyBR(dados.valorProposta || dados.valorTotal)}`);
  }
  if (dados.formasPagamento && dados.formasPagamento.length > 0) {
    list.push(`Formas de Pagamento: ${dados.formasPagamento.join(', ')}`);
  }
  if (dados.detalhesPagamento) {
    list.push(`Detalhes: ${dados.detalhesPagamento}`);
  }
  if (dados.sinal) list.push(`Sinal / Entrada: ${formatCurrencyBR(dados.sinal)}`);
  if (dados.financiamento) list.push(`Financiamento Bancário: ${formatCurrencyBR(dados.financiamento)}`);
  if (dados.fgts) list.push(`FGTS: ${formatCurrencyBR(dados.fgts)}`);
  return list.join(' | ');
}

export function valorPorExtenso(valor: number): string {
  if (valor === 0) return 'zero reais';
  
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dezenas = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const dezenove = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const escreverCentenas = (n: number) => {
    if (n === 100) return 'cem';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    
    let res = centenas[c];
    if (d > 0 || u > 0) {
      if (d === 1) {
        res += ' e ' + dezenove[u];
      } else {
        if (d > 1) res += ' e ' + dezenas[d];
        if (u > 0) res += ' e ' + unidades[u];
      }
    }
    return res;
  };

  const escreverMilhares = (n: number) => {
    const mil = Math.floor(n / 1000);
    const resto = n % 1000;
    
    let res = '';
    if (mil > 0) {
      if (mil === 1) {
        res = 'mil';
      } else {
        res = escreverCentenas(mil) + ' mil';
      }
    }
    
    if (resto > 0) {
      res += (res ? ' e ' : '') + escreverCentenas(resto);
    }
    return res;
  };

  const escreverMilhoes = (n: number) => {
    const milhao = Math.floor(n / 1000000);
    const resto = n % 1000000;
    
    let res = '';
    if (milhao > 0) {
      if (milhao === 1) {
        res = 'um milhão';
      } else {
        res = escreverCentenas(milhao) + ' milhões';
      }
    }
    
    if (resto > 0) {
      res += (res ? ' e ' : '') + escreverMilhares(resto);
    }
    return res;
  };

  const inteiros = Math.floor(valor);
  const centavos = Math.round((valor - inteiros) * 100);

  let resultado = '';
  if (inteiros < 1000) {
    resultado = escreverCentenas(inteiros);
  } else if (inteiros < 1000000) {
    resultado = escreverMilhares(inteiros);
  } else {
    resultado = escreverMilhoes(inteiros);
  }

  resultado += inteiros === 1 ? ' real' : ' reais';

  if (centavos > 0) {
    let textoCentavos = '';
    if (centavos < 10) {
      textoCentavos = unidades[centavos];
    } else if (centavos < 20) {
      textoCentavos = dezenove[centavos - 10];
    } else {
      const d = Math.floor(centavos / 10);
      const u = centavos % 10;
      textoCentavos = dezenas[d] + (u > 0 ? ' e ' + unidades[u] : '');
    }
    resultado += ' e ' + textoCentavos + (centavos === 1 ? ' centavo' : ' centavos');
  }

  return resultado;
}
