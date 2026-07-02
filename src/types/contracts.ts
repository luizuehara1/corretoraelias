export interface DocumentBase {
  id: string;
  tipoDocumento: 'Proposta' | 'Contraproposta' | 'Aceite' | 'ContratoCompraVenda' | 'ContratoLocacao' | 'Recibo';
  status: 'Rascunho' | 'Gerado' | 'Enviado' | 'Assinado' | 'Aceito' | 'Recusado' | 'Cancelado';
  createdAt: any;
  updatedAt: any;
  criadoPor: string;
  criadoPorEmail: string;
  imovelId: string;
  codigoImovel: string;
  dadosImovel: any;
  observacoesInternas?: string,
  dataDocumento: string;
}

export interface Proposta extends DocumentBase {
  dadosComprador: any;
  dadosVendedor: any;
  valorProposta: number;
  valorFinalNegociado?: number;
  valorPorExtenso?: string;
  formasPagamento: string[];
  detalhesPagamento: string;
  validade: string;
  clausulas: any[];
}

export interface Contraproposta extends DocumentBase {
  propostaOriginalId: string;
  proponenteOriginal: any;
  novoValor: number;
  validade: string;
  clausulas: any[];
}

export interface AceiteProposta extends DocumentBase {
  documentoBaseId: string;
  valorAceito: number;
  clausulas: any[];
}

export interface ContratoCompraVenda extends DocumentBase {
  dadosComprador: any;
  dadosVendedor: any;
  valorTotal: number;
  formasPagamento: string[];
  clausulas: any[];
}

export interface ContratoLocacao extends DocumentBase {
  locador: any;
  locatario: any;
  fiador?: any;
  dataInicio: string;
  dataFim: string;
  valorAluguel: number;
  diaVencimento: number;
  statusPagamento: 'Pago' | 'Pendente' | 'Atrasado';
  clausulas: any[];
}

export interface Recibo extends DocumentBase {
  pagador: string;
  recebedor: string;
  valor: number;
  data: string;
  competencia: string;
  descricao: string;
  editavel: boolean;
  conteudoEditavel?: string;
}
