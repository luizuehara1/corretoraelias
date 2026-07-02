export interface Clause {
  id: string;
  tipoDocumento: string;
  titulo: string;
  texto: string;
  ativo: boolean;
  ordem: number;
}

export const defaultClauses: Clause[] = [
  // Proposta de Compra
  {
    id: 'prop-1',
    tipoDocumento: 'Proposta',
    titulo: 'Da validade da proposta',
    texto: 'Esta proposta tem caráter irrevogável e irretratável pelo prazo de validade indicado no formulário, obrigando as partes ao seu fiel cumprimento após o aceite.',
    ativo: true,
    ordem: 1
  },
  {
    id: 'prop-2',
    tipoDocumento: 'Proposta',
    titulo: 'Da regularidade documental',
    texto: 'O vendedor declara, sob as penas da lei, que o imóvel encontra-se livre e desembaraçado de quaisquer ônus, gravames, dívidas ou restrições judiciais, e compromete-se a apresentar certidões negativas atualizadas.',
    ativo: true,
    ordem: 2
  },
  {
    id: 'prop-3',
    tipoDocumento: 'Proposta',
    titulo: 'Da intermediação imobiliária',
    texto: 'A presente transação foi intermediada pela RB Sorocaba Negócios Imobiliários, cabendo ao proprietário vendedor o pagamento da respectiva comissão sobre o valor total da venda, conforme contratado.',
    ativo: true,
    ordem: 3
  },

  // Contraproposta
  {
    id: 'contra-1',
    tipoDocumento: 'Contraproposta',
    titulo: 'Manutenção de termos anteriores',
    texto: 'Ficam mantidos todos os demais termos e condições da proposta original que não colidirem direto com as modificações expressas nesta contraproposta.',
    ativo: true,
    ordem: 1
  },
  {
    id: 'contra-2',
    tipoDocumento: 'Contraproposta',
    titulo: 'Do prazo de aceitação',
    texto: 'A presente contraproposta expira de pleno direito caso não seja aceita por escrito pelo proponente original no prazo estabelecido, retornando as partes ao estado anterior sem qualquer obrigação.',
    ativo: true,
    ordem: 2
  },

  // Aceite
  {
    id: 'aceite-1',
    tipoDocumento: 'Aceite',
    titulo: 'Do acordo de vontades',
    texto: 'Com a assinatura deste Aceite, as partes declaram estarem em pleno e perfeito acordo em relação a todos os valores, prazos e condições financeiras descritas no respectivo documento.',
    ativo: true,
    ordem: 1
  },
  {
    id: 'aceite-2',
    tipoDocumento: 'Aceite',
    titulo: 'Do compromisso de contratar',
    texto: 'As partes se obrigam a assinar o competente Instrumento Particular de Compra e Venda no prazo máximo de 10 (dez) dias corridos a contar desta data, sob pena de caracterizar desistência injustificada.',
    ativo: true,
    ordem: 2
  },

  // Contrato de Compra e Venda
  {
    id: 'ccv-1',
    tipoDocumento: 'ContratoCompraVenda',
    titulo: 'Do objeto e descrição',
    texto: 'O presente contrato tem por objeto a promessa de compra e venda do imóvel perfeitamente qualificado e descrito na Etapa 2 deste instrumento.',
    ativo: true,
    ordem: 1
  },
  {
    id: 'ccv-2',
    tipoDocumento: 'ContratoCompraVenda',
    titulo: 'Da posse e imissão',
    texto: 'A imissão na posse do imóvel será outorgada ao comprador na data da quitação integral do preço ou, em caso de financiamento, após a assinatura do contrato com a instituição financeira e respectivo registro.',
    ativo: true,
    ordem: 2
  },
  {
    id: 'ccv-3',
    tipoDocumento: 'ContratoCompraVenda',
    titulo: 'Da comissão de intermediação',
    texto: 'As partes declaram que a venda foi intermediada pela imobiliária RB Sorocaba Negócios Imobiliários, CRECI 123456-J, sendo integralmente devida a comissão correspondente nos termos de nossa tabela.',
    ativo: true,
    ordem: 3
  },
  {
    id: 'ccv-4',
    tipoDocumento: 'ContratoCompraVenda',
    titulo: 'Do foro de eleição',
    texto: 'Elege-se o foro da Comarca de Sorocaba/SP para dirimir as controvérsias decorrentes deste contrato, com renúncia expressa a qualquer outro por mais privilegiado que seja.',
    ativo: true,
    ordem: 4
  },

  // Contrato de Locação
  {
    id: 'loc-1',
    tipoDocumento: 'ContratoLocacao',
    titulo: 'Do prazo e destinação',
    texto: 'O prazo de locação é o acordado formalmente entre as partes, destinando-se o imóvel exclusivamente para fins residenciais, salvo estipulação em contrário por escrito.',
    ativo: true,
    ordem: 1
  },
  {
    id: 'loc-2',
    tipoDocumento: 'ContratoLocacao',
    titulo: 'Dos encargos locatícios',
    texto: 'Além do aluguel mensal, correrão por conta exclusiva do locatário as despesas de condomínio, parcelas de IPTU, taxa de lixo, água, esgoto, energia elétrica e seguro contra incêndio obrigatório.',
    ativo: true,
    ordem: 2
  },
  {
    id: 'loc-3',
    tipoDocumento: 'ContratoLocacao',
    titulo: 'Da vistoria e conservação',
    texto: 'O locatário obriga-se a manter o imóvel nas mesmas condições perfeitas em que o recebe, conforme termo de vistoria inicial acoplado a este instrumento.',
    ativo: true,
    ordem: 3
  },
  {
    id: 'loc-4',
    tipoDocumento: 'ContratoLocacao',
    titulo: 'Da multa por inadimplemento',
    texto: 'O atraso no pagamento do aluguel sujeitará o locatário a multa moratória de 10% (dez por cento) sobre o valor do débito, acrescido de juros de 1% ao mês e correção monetária.',
    ativo: true,
    ordem: 4
  },

  // Recibos
  {
    id: 'rec-1',
    tipoDocumento: 'Recibo',
    titulo: 'Quitação plena',
    texto: 'Pelo presente recibo, o declarante quita plenamente os valores especificados para o respectivo período de referência sem qualquer pendência.',
    ativo: true,
    ordem: 1
  }
];
