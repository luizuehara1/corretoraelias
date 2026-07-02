import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { defaultClauses, Clause } from '../utils/defaultClauses';
import { 
  formatCurrencyBR, 
  parseCurrencyBR, 
  formatCPF, 
  formatCNPJ, 
  formatPhone, 
  formatDateBR, 
  montarEnderecoCompleto, 
  getTextoPagamentoPDF,
  valorPorExtenso
} from '../utils/contractUtils';
import { Plus, Search, Trash2, ArrowLeft, ArrowRight, Save, FileText, CheckCircle, Printer, Image as ImageIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';

type WizardStage = 'tipo' | 'imovel' | 'partes' | 'pagamento' | 'clausulas' | 'revisao';

type DocType = 'Proposta' | 'Contraproposta' | 'Aceite' | 'ContratoCompraVenda' | 'ContratoLocacao' | 'ReciboLocatario' | 'ReciboLocador' | 'ReciboComissao' | 'ReciboEditavel';

interface ContractWizardProps {
  onClose: () => void;
  initialImovel?: any; // pre-populated imovel from Property detail button
  initialLocacao?: any; // pre-populated locacao from Rental list button
  initialDocType?: DocType;
}

export const ContractWizard: React.FC<ContractWizardProps> = ({ onClose, initialImovel, initialLocacao, initialDocType }) => {
  const [stage, setStage] = useState<WizardStage>('tipo');
  const [tipoDoc, setTipoDoc] = useState<DocType>(initialDocType || 'Proposta');
  const [status, setStatus] = useState<string>('Rascunho');
  const [dataDoc, setDataDoc] = useState<string>(new Date().toISOString().substring(0, 10));
  const [observacoesInternas, setObservacoesInternas] = useState<string>('');

  // Imovel state
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [selectedImovel, setSelectedImovel] = useState<any>(initialImovel || null);
  const [searchImovelTerm, setSearchImovelTerm] = useState<string>('');
  
  // Custom manual metadata fields for chosen Imovel
  const [imovelId, setImovelId] = useState<string>('');
  const [codigoImovel, setCodigoImovel] = useState<string>('');
  const [tipoImovel, setTipoImovel] = useState<string>('');
  const [tituloImovel, setTituloImovel] = useState<string>('');
  const [enderecoImovel, setEnderecoImovel] = useState<string>('');
  const [bairroImovel, setBairroImovel] = useState<string>('');
  const [cidadeImovel, setCidadeImovel] = useState<string>('');
  const [estadoImovel, setEstadoImovel] = useState<string>('SP');
  const [cepImovel, setCepImovel] = useState<string>('');
  const [valVendaImovel, setValVendaImovel] = useState<number>(0);
  const [valAluguelImovel, setValAluguelImovel] = useState<number>(0);
  const [matriculaImovel, setMatriculaImovel] = useState<string>('');
  const [criImovel, setCriImovel] = useState<string>('');

  // Company Settings
  const [companySettings, setCompanySettings] = useState<any>({
    nomeFantasia: "RB Sorocaba Negócios Imobiliários",
    razaoSocial: "RB Sorocaba Negócios Imobiliários Ltda",
    cnpj: "00.000.000/0001-00",
    creciPj: "CRECI 123456-J",
    creciResponsavel: "CRECI 278765-F",
    telefone: "(15) 99114-3213",
    whatsapp: "+55 (15) 99114-3213",
    email: "atendimento@rbsorocaba.com.br",
    site: "www.rbsorocaba.com.br",
    endereco: "Av. Campolim",
    numero: "1200",
    complemento: "Sala 45",
    bairro: "Campolim",
    cidade: "Sorocaba",
    estado: "SP",
    cep: "18047-620",
    responsavelLegal: "Elias Borges",
    textoRodapeContratos: "RB Sorocaba Negócios Imobiliários - Ética, sofisticação e transparência."
  });

  // Parties state
  const [comprador, setComprador] = useState<any>({
    nome: '', cpfCnpj: '', rg: '', estadoCivil: '', profissao: '', telefone: '', whatsapp: '', email: '', endereco: '', cep: '', cidade: '', estado: 'SP', possuiConjuge: false, nomeConjuge: '', cpfConjuge: ''
  });
  const [vendedor, setVendedor] = useState<any>({
    nome: '', cpfCnpj: '', rg: '', estadoCivil: '', profissao: '', telefone: '', whatsapp: '', email: '', endereco: '', cep: '', cidade: '', estado: 'SP'
  });
  const [locatario, setLocatario] = useState<any>({
    nome: '', cpfCnpj: '', rg: '', estadoCivil: '', profissao: '', telefone: '', whatsapp: '', email: '', endereco: '', cep: '', cidade: '', estado: 'SP'
  });
  const [fiador, setFiador] = useState<any>({
    nome: '', cpfCnpj: '', rg: '', telefone: '', endereco: '', temFiador: false
  });

  // Recibo specific fields
  const [reciboPagador, setReciboPagador] = useState<string>('');
  const [reciboRecebedor, setReciboRecebedor] = useState<string>('');
  const [reciboValor, setReciboValor] = useState<number>(0);
  const [reciboData, setReciboData] = useState<string>(new Date().toISOString().substring(0, 10));
  const [reciboCompetencia, setReciboCompetencia] = useState<string>('');
  const [reciboDescricao, setReciboDescricao] = useState<string>('');
  const [reciboObservacoes, setReciboObservacoes] = useState<string>('');

  // Financial fields
  const [valAnunciado, setValAnunciado] = useState<number>(0);
  const [valProposto, setValProposto] = useState<number>(0);
  const [valFinal, setValFinal] = useState<number>(0);
  const [valPorExtenso, setValPorExtenso] = useState<string>('');
  const [formasPagamento, setFormasPagamento] = useState<string[]>([]);
  const [detalhesPagamento, setDetalhesPagamento] = useState<string>('');
  const [valSinal, setValSinal] = useState<number>(0);
  const [valFGTS, setValFGTS] = useState<number>(0);
  const [valFinanciamento, setValFinanciamento] = useState<number>(0);
  const [valConsorcio, setValConsorcio] = useState<number>(0);
  const [valPermuta, setValPermuta] = useState<number>(0);
  const [valParcelamento, setValParcelamento] = useState<number>(0);
  const [prazoPagamento, setPrazoPagamento] = useState<string>('');
  const [validadeProposta, setValidadeProposta] = useState<string>('30 dias');

  // Rental contract financial details
  const [rentalAluguel, setRentalAluguel] = useState<number>(0);
  const [rentalCondominio, setRentalCondominio] = useState<number>(0);
  const [rentalIptu, setRentalIptu] = useState<number>(0);
  const [rentalLixo, setRentalLixo] = useState<number>(0);
  const [rentalAgua, setRentalAgua] = useState<number>(0);
  const [rentalLuz, setRentalLuz] = useState<number>(0);
  const [rentalGas, setRentalGas] = useState<number>(0);
  const [rentalSeguroIncendio, setRentalSeguroIncendio] = useState<number>(0);
  const [rentalDataInicio, setRentalDataInicio] = useState<string>('');
  const [rentalDataFim, setRentalDataFim] = useState<string>('');
  const [rentalDiaVencimento, setRentalDiaVencimento] = useState<number>(10);
  const [rentalGarantia, setRentalGarantia] = useState<string>('Caução');
  const [rentalMulta, setRentalMulta] = useState<string>('10%');
  const [rentalReajuste, setRentalReajuste] = useState<string>('IPCA anual');
  const [rentalComissao, setRentalComissao] = useState<number>(10);

  // Clauses
  const [clauses, setClauses] = useState<Clause[]>([]);

  // Fetch collections
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const snap = await getDocs(collection(db, 'imoveis'));
        setImoveis(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Erro ao carregar imóveis para o wizard de contratos:", e);
      }
    };

    const loadCompanySettings = async () => {
      try {
        const compSnap = await getDoc(doc(db, "siteSettings", "company"));
        if (compSnap.exists()) {
          setCompanySettings(compSnap.data());
        }
      } catch (err) {
        console.warn("Utilizando dados padrão da empresa.");
      }
    };

    loadProperties();
    loadCompanySettings();
  }, []);

  // Prepopulate if initial documents are passed
  useEffect(() => {
    if (initialImovel) {
      applySelectedImovel(initialImovel);
    }
    if (initialLocacao) {
      applySelectedRental(initialLocacao);
    }
  }, [initialImovel, initialLocacao]);

  // Load default clauses when document type changes
  useEffect(() => {
    // Map DocType to clause type template
    let matchType = 'Proposta';
    if (tipoDoc === 'Contraproposta') matchType = 'Contraproposta';
    else if (tipoDoc === 'Aceite') matchType = 'Aceite';
    else if (tipoDoc === 'ContratoCompraVenda') matchType = 'ContratoCompraVenda';
    else if (tipoDoc === 'ContratoLocacao') matchType = 'ContratoLocacao';
    else if (tipoDoc.startsWith('Recibo')) matchType = 'Recibo';

    const defaultList = defaultClauses.filter(c => c.tipoDocumento === matchType);
    setClauses(defaultList);
  }, [tipoDoc]);

  // Handle Imovel selected
  const applySelectedImovel = (imo: any) => {
    setSelectedImovel(imo);
    setImovelId(imo.id);
    setCodigoImovel(imo.codigoImovel || imo.codigo || imo.referencia || '');
    setTipoImovel(imo.type || imo.category || '');
    setTituloImovel(imo.title || '');
    setEnderecoImovel(imo.location || imo.endereco || '');
    setBairroImovel(imo.neighborhood || imo.bairro || '');
    setCidadeImovel(imo.city || imo.cidade || '');
    setEstadoImovel(imo.state || imo.estado || 'SP');
    setCepImovel(imo.cep || '');
    setValVendaImovel(imo.priceValue || imo.valorVenda || 0);
    setValAluguelImovel(imo.valorAluguel || 0);
    setMatriculaImovel(imo.matricula || '');
    setCriImovel(imo.cri || '');

    // Auto-populate vendedor/proprietário
    setVendedor({
      nome: imo.proprietarioNome || imo.ownerId || '',
      cpfCnpj: imo.proprietarioCpf || '',
      rg: '',
      estadoCivil: '',
      profissao: '',
      telefone: imo.proprietarioTelefone || '',
      whatsapp: imo.proprietarioTelefone || '',
      email: imo.proprietarioEmail || imo.emailProprietario || '',
      endereco: '',
      cep: '',
      cidade: '',
      estado: 'SP'
    });

    // For rental, set locador as owner
    if (tipoDoc === 'ContratoLocacao') {
      setRentalAluguel(imo.valorAluguel || 0);
      setRentalCondominio(imo.valorCondominio || 0);
      setRentalIptu(imo.valorIptu || 0);
      setRentalLixo(imo.taxaLixo || 0);
      setRentalSeguroIncendio(imo.seguroIncendio || 0);
    }
  };

  const applySelectedRental = (loc: any) => {
    // autofill locatario, aluguel, dates
    setLocatario({
      nome: loc.locatarioNome || '',
      cpfCnpj: loc.locatarioCpf || '',
      rg: '',
      telefone: loc.locatarioTelefone || '',
      whatsapp: loc.locatarioTelefone || '',
      email: loc.locatarioEmail || '',
      endereco: '',
      cep: '',
      cidade: '',
      estado: 'SP'
    });

    setRentalAluguel(loc.valorAluguel || 0);
    setRentalDiaVencimento(loc.diaVencimento || 10);
    
    // Setup generic receipt values
    setReciboPagador(loc.locatarioNome || '');
    setReciboRecebedor(companySettings.nomeFantasia);
    setReciboValor(loc.valorAluguel || 0);
    setReciboDescricao(`Pagamento referente ao aluguel do imóvel código ${loc.codigoImovel || ''}`);
  };

  const filteredImoveis = imoveis.filter(imo => {
    const term = searchImovelTerm.toLowerCase();
    const cod = (imo.codigoImovel || imo.codigo || imo.referencia || '').toLowerCase();
    const tit = (imo.title || '').toLowerCase();
    return cod.includes(term) || tit.includes(term);
  });

  // Re-calculate valor por extenso when final or proposed value changes
  useEffect(() => {
    const activeValue = tipoDoc.startsWith('Recibo') ? reciboValor : (valFinal || valProposto);
    if (activeValue) {
      try {
        setValPorExtenso(valorPorExtenso(activeValue));
      } catch (err) {
        setValPorExtenso('');
      }
    } else {
      setValPorExtenso('');
    }
  }, [valFinal, valProposto, reciboValor, tipoDoc]);

  // Stages steps title mapping
  const steps: { id: WizardStage; label: string }[] = [
    { id: 'tipo', label: '1. Tipo' },
    { id: 'imovel', label: '2. Imóvel' },
    { id: 'partes', label: '3. Partes' },
    { id: 'pagamento', label: '4. Pagamento' },
    { id: 'clausulas', label: '5. Cláusulas' },
    { id: 'revisao', label: '6. Revisão' }
  ];

  const nextStage = () => {
    if (stage === 'tipo') setStage('imovel');
    else if (stage === 'imovel') setStage('partes');
    else if (stage === 'partes') setStage('pagamento');
    else if (stage === 'pagamento') setStage('clausulas');
    else if (stage === 'clausulas') setStage('revisao');
  };

  const prevStage = () => {
    if (stage === 'imovel') setStage('tipo');
    else if (stage === 'partes') setStage('imovel');
    else if (stage === 'pagamento') setStage('partes');
    else if (stage === 'clausulas') setStage('pagamento');
    else if (stage === 'revisao') setStage('clausulas');
  };

  const addClause = () => {
    const newCl: Clause = {
      id: 'custom-' + Date.now(),
      tipoDocumento: tipoDoc,
      titulo: 'Cláusula Adicional',
      texto: 'Escreva o teor da cláusula aqui...',
      ativo: true,
      ordem: clauses.length + 1
    };
    setClauses([...clauses, newCl]);
  };

  const removeClause = (id: string) => {
    setClauses(clauses.filter(c => c.id !== id));
  };

  const updateClauseText = (id: string, text: string) => {
    setClauses(clauses.map(c => c.id === id ? { ...c, texto: text } : c));
  };

  const updateClauseTitle = (id: string, title: string) => {
    setClauses(clauses.map(c => c.id === id ? { ...c, titulo: title } : c));
  };

  // Compile final complete text of the contract for saving/displaying
  const getDocumentCompiledText = () => {
    let text = '';
    text += `${normalizarTipoDoc(tipoDoc).toUpperCase()}\n\n`;
    text += `IMÓVEL:\n${tituloImovel} (${codigoImovel})\n`;
    text += `Endereço: ${montarEnderecoCompleto({ endereco: enderecoImovel, numero: '', complemento: '', bairro: bairroImovel, cidade: cidadeImovel, estado: estadoImovel, cep: cepImovel })}\n\n`;
    
    text += `PARTES:\n`;
    if (tipoDoc === 'Proposta' || tipoDoc === 'ContratoCompraVenda') {
      text += `Comprador/Proponente: ${comprador.nome}, CPF: ${comprador.cpfCnpj}\n`;
      text += `Vendedor/Proprietário: ${vendedor.nome}, CPF: ${vendedor.cpfCnpj}\n\n`;
    } else if (tipoDoc === 'ContratoLocacao') {
      text += `Locador: ${vendedor.nome}, CPF: ${vendedor.cpfCnpj}\n`;
      text += `Locatário: ${locatario.nome}, CPF: ${locatario.cpfCnpj}\n`;
      if (fiador.temFiador) {
        text += `Fiador: ${fiador.nome}, CPF: ${fiador.cpfCnpj}\n`;
      }
      text += `\n`;
    } else if (tipoDoc.startsWith('Recibo')) {
      text += `Pagador: ${reciboPagador}\n`;
      text += `Recebedor: ${reciboRecebedor}\n\n`;
    }

    text += `CONDIÇÕES FINANCEIRAS:\n`;
    if (tipoDoc.startsWith('Recibo')) {
      text += `Valor: ${formatCurrencyBR(reciboValor)} (${valorPorExtenso(reciboValor)})\n`;
      text += `Competência: ${reciboCompetencia}\n`;
      text += `Descrição: ${reciboDescricao}\n\n`;
    } else {
      text += `Valor do Negócio: ${formatCurrencyBR(valFinal || valProposto)} (${valPorExtenso})\n`;
      text += `Formas de Pagamento: ${formasPagamento.join(', ')}\n\n`;
    }

    text += `CLÁUSULAS CONTRATUAIS:\n`;
    clauses.forEach((c, idx) => {
      text += `${idx + 1}. ${c.titulo.toUpperCase()}: ${c.texto}\n\n`;
    });

    return text;
  };

  const normalizarTipoDoc = (type: DocType): string => {
    switch (type) {
      case 'Proposta': return 'Proposta de Compra';
      case 'Contraproposta': return 'Contraproposta de Compra';
      case 'Aceite': return 'Aceite de Proposta';
      case 'ContratoCompraVenda': return 'Contrato de Compra e Venda';
      case 'ContratoLocacao': return 'Contrato de Locação';
      case 'ReciboLocatario': return 'Recibo do Locatário';
      case 'ReciboLocador': return 'Recibo do Locador';
      case 'ReciboComissao': return 'Recibo de Comissão';
      case 'ReciboEditavel': return 'Recibo Personalizado';
      default: return 'Documento';
    }
  };

  // Safe Firestore Save
  const saveToFirestore = async (finalStatus: string = 'Rascunho') => {
    try {
      const email = auth.currentUser?.email || 'admin@rbsorocaba.com.br';
      const uid = auth.currentUser?.uid || 'system';

      const payload: any = {
        tipoDocumento: tipoDoc,
        status: finalStatus,
        dataDocumento: dataDoc,
        imovelId,
        codigoImovel,
        dadosImovel: {
          titulo: tituloImovel,
          tipo: tipoImovel,
          endereco: enderecoImovel,
          bairro: bairroImovel,
          cidade: cidadeImovel,
          estado: estadoImovel,
          cep: cepImovel,
          matricula: matriculaImovel,
          cri: criImovel,
          valorVenda: valVendaImovel,
          valorAluguel: valAluguelImovel
        },
        observacoesInternas,
        clausulas: clauses,
        textoFinal: getDocumentCompiledText(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        criadoPor: uid,
        criadoPorEmail: email,
      };

      // Set parts based on document type
      if (tipoDoc === 'Proposta' || tipoDoc === 'Contraproposta' || tipoDoc === 'Aceite' || tipoDoc === 'ContratoCompraVenda') {
        payload.dadosComprador = comprador;
        payload.dadosVendedor = vendedor;
        payload.dadosPagamento = {
          valorAnunciado: valAnunciado || valVendaImovel,
          valorProposto: valProposto,
          valorFinalNegociado: valFinal,
          valorPorExtenso: valPorExtenso,
          formasPagamento,
          detalhesPagamento,
          sinal: valSinal,
          financiamento: valFinanciamento,
          fgts: valFGTS,
          consorcio: valConsorcio,
          permuta: valPermuta,
          parcelamentoDireto: valParcelamento,
          prazoPagamento,
          validadeProposta
        };
      } else if (tipoDoc === 'ContratoLocacao') {
        payload.dadosLocatario = locatario;
        payload.dadosLocador = vendedor; // landholder is in vendedor structure
        if (fiador.temFiador) {
          payload.dadosFiador = fiador;
        }
        payload.dadosPagamento = {
          valorAluguel: rentalAluguel || valAluguelImovel,
          condominio: rentalCondominio,
          iptu: rentalIptu,
          taxaLixo: rentalLixo,
          agua: rentalAgua,
          luz: rentalLuz,
          gas: rentalGas,
          seguroIncendio: rentalSeguroIncendio,
          dataInicio: rentalDataInicio,
          dataFim: rentalDataFim,
          diaVencimento: rentalDiaVencimento,
          garantia: rentalGarantia,
          multa: rentalMulta,
          reajuste: rentalReajuste,
          comissao: rentalComissao,
          valorPorExtenso: valorPorExtenso(rentalAluguel)
        };
      } else if (tipoDoc.startsWith('Recibo')) {
        payload.dadosPagador = reciboPagador;
        payload.dadosRecebedor = reciboRecebedor;
        payload.valor = reciboValor;
        payload.data = reciboData;
        payload.competencia = reciboCompetencia;
        payload.descricao = reciboDescricao;
        payload.observacoes = reciboObservacoes;
        payload.valorPorExtenso = valPorExtenso;
      }

      // Save to type collections + general documentosGerados
      const generalColRef = collection(db, 'documentosGerados');
      await addDoc(generalColRef, payload);

      let targetCollection = 'propostas';
      if (tipoDoc === 'Contraproposta') targetCollection = 'contrapropostas';
      else if (tipoDoc === 'Aceite') targetCollection = 'aceitesProposta';
      else if (tipoDoc === 'ContratoCompraVenda') targetCollection = 'contratos';
      else if (tipoDoc === 'ContratoLocacao') targetCollection = 'contratosLocacao';
      else if (tipoDoc.startsWith('Recibo')) targetCollection = 'recibos';

      const specificColRef = collection(db, targetCollection);
      await addDoc(specificColRef, payload);

      alert(`${normalizarTipoDoc(tipoDoc)} salvo com sucesso no Firestore!`);
      onClose();
    } catch (err) {
      console.error("Erro ao salvar documento no Firestore:", err);
      alert("Erro ao salvar o documento. Por favor, verifique as permissões ou dados.");
    }
  };

  // Generate jsPDF beautifully wrapping content & matching letterhead
  const handleGeneratePDF = () => {
    const docPdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Setup basic typography
    docPdf.setFont("helvetica", "bold");

    // Colors
    // RB Sorocaba Colors: Dark Gray (#111111) and Golden Gold (#F5B400)
    const primaryColor = [17, 17, 17]; // #111111
    const secondaryColor = [245, 180, 0]; // #F5B400
    const bodyColor = [60, 60, 60];

    // Header Letterhead
    docPdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    docPdf.rect(0, 0, 210, 35, "F");

    docPdf.setFontSize(14);
    docPdf.setTextColor(255, 255, 255);
    docPdf.text(companySettings.nomeFantasia.toUpperCase(), 15, 15);

    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(8);
    docPdf.setTextColor(230, 230, 230);
    const companyAddress = `${companySettings.endereco}, nº ${companySettings.numero} - ${companySettings.bairro} | ${companySettings.cidade} - ${companySettings.estado}`;
    const companyContacts = `CNPJ: ${companySettings.cnpj} | CRECI-PJ: ${companySettings.creciPj} | Tel/WA: ${companySettings.whatsapp} | ${companySettings.email}`;
    docPdf.text(companyAddress, 15, 22);
    docPdf.text(companyContacts, 15, 27);

    // Decorative Yellow Bar
    docPdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    docPdf.rect(0, 35, 210, 3, "F");

    // Title of Document
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(16);
    docPdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const finalTitle = normalizarTipoDoc(tipoDoc).toUpperCase();
    docPdf.text(finalTitle, 15, 52);

    // Initial positioning
    let y = 62;
    const marginX = 15;
    const pageWidth = 210;
    const maxLineWidth = pageWidth - (marginX * 2);

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > 275) {
        docPdf.addPage();
        y = 20; // reset y on new page
        // Mini Head on subsequent pages
        docPdf.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        docPdf.setLineWidth(0.5);
        docPdf.line(marginX, 12, pageWidth - marginX, 12);
        docPdf.setFont("helvetica", "italic");
        docPdf.setFontSize(7);
        docPdf.text(`${finalTitle} - RB Sorocaba`, marginX, 10);
        y = 20;
      }
    };

    const addSectionHeader = (title: string) => {
      checkPageBreak(15);
      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(10);
      docPdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      docPdf.setFillColor(245, 245, 245);
      docPdf.rect(marginX, y, maxLineWidth, 6, "F");
      docPdf.text(title.toUpperCase(), marginX + 3, y + 4.5);
      y += 10;
    };

    const addKeyValRow = (items: Array<{ key: string; value: string }>) => {
      checkPageBreak(8);
      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(8.5);
      docPdf.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);

      const colWidth = maxLineWidth / items.length;
      items.forEach((item, index) => {
        const itemX = marginX + (index * colWidth);
        const itemText = `${item.key}: ${item.value || '-'}`;
        const truncated = itemText.length > Math.floor(colWidth * 1.8) 
          ? itemText.substring(0, Math.floor(colWidth * 1.8)) + "..."
          : itemText;
        docPdf.text(truncated, itemX, y);
      });
      y += 6;
    };

    // Sections
    // SECTION 1: IMOVEL
    addSectionHeader("1. Descrição do Imóvel");
    addKeyValRow([
      { key: "Código", value: codigoImovel },
      { key: "Tipo/Categoria", value: tipoImovel },
      { key: "Título", value: tituloImovel }
    ]);
    const cleanAddress = montarEnderecoCompleto({ endereco: enderecoImovel, numero: '', complemento: '', bairro: bairroImovel, cidade: cidadeImovel, estado: estadoImovel, cep: cepImovel });
    
    // Auto wrap long address
    checkPageBreak(12);
    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(8.5);
    const wrappedAddr = docPdf.splitTextToSize(`Endereço do Imóvel: ${cleanAddress}`, maxLineWidth);
    docPdf.text(wrappedAddr, marginX, y);
    y += (wrappedAddr.length * 4.5) + 2;

    addKeyValRow([
      { key: "Matrícula", value: matriculaImovel },
      { key: "CRI", value: criImovel },
      { key: "Valor", value: tipoDoc === 'ContratoLocacao' ? formatCurrencyBR(rentalAluguel || valAluguelImovel) : formatCurrencyBR(valFinal || valVendaImovel) }
    ]);

    // SECTION 2: PARTES
    addSectionHeader("2. Partes Envolvidas");
    if (tipoDoc === 'Proposta' || tipoDoc === 'Contraproposta' || tipoDoc === 'Aceite' || tipoDoc === 'ContratoCompraVenda') {
      // Vendor
      docPdf.setFont("helvetica", "bold");
      docPdf.text("Vendedor / Proprietário:", marginX, y);
      y += 4.5;
      addKeyValRow([
        { key: "Nome", value: vendedor.nome },
        { key: "CPF/CNPJ", value: vendedor.cpfCnpj },
        { key: "RG", value: vendedor.rg }
      ]);
      addKeyValRow([
        { key: "Est. Civil", value: vendedor.estadoCivil },
        { key: "Profissão", value: vendedor.profissao },
        { key: "Telefone", value: vendedor.telefone }
      ]);
      y += 2;

      // Comprador
      docPdf.setFont("helvetica", "bold");
      docPdf.text("Comprador / Proponente:", marginX, y);
      y += 4.5;
      addKeyValRow([
        { key: "Nome", value: comprador.nome },
        { key: "CPF/CNPJ", value: comprador.cpfCnpj },
        { key: "RG", value: comprador.rg }
      ]);
      addKeyValRow([
        { key: "Est. Civil", value: comprador.estadoCivil },
        { key: "Profissão", value: comprador.profissao },
        { key: "Telefone", value: comprador.telefone }
      ]);
      if (comprador.possuiConjuge) {
        addKeyValRow([
          { key: "Cônjuge", value: comprador.nomeConjuge },
          { key: "CPF Cônjuge", value: comprador.cpfConjuge }
        ]);
      }
      y += 2;

    } else if (tipoDoc === 'ContratoLocacao') {
      // Locador
      docPdf.setFont("helvetica", "bold");
      docPdf.text("Locador / Proprietário:", marginX, y);
      y += 4.5;
      addKeyValRow([
        { key: "Nome", value: vendedor.nome },
        { key: "CPF/CNPJ", value: vendedor.cpfCnpj },
        { key: "RG", value: vendedor.rg }
      ]);
      addKeyValRow([
        { key: "Est. Civil", value: vendedor.estadoCivil },
        { key: "Profissão", value: vendedor.profissao },
        { key: "Telefone", value: vendedor.telefone }
      ]);
      y += 2;

      // Locatario
      docPdf.setFont("helvetica", "bold");
      docPdf.text("Locatário:", marginX, y);
      y += 4.5;
      addKeyValRow([
        { key: "Nome", value: locatario.nome },
        { key: "CPF/CNPJ", value: locatario.cpfCnpj },
        { key: "RG", value: locatario.rg }
      ]);
      addKeyValRow([
        { key: "Est. Civil", value: locatario.estadoCivil },
        { key: "Profissão", value: locatario.profissao },
        { key: "Telefone", value: locatario.telefone }
      ]);
      y += 2;

      // Fiador
      if (fiador.temFiador) {
        docPdf.setFont("helvetica", "bold");
        docPdf.text("Fiador:", marginX, y);
        y += 4.5;
        addKeyValRow([
          { key: "Nome", value: fiador.nome },
          { key: "CPF/CNPJ", value: fiador.cpfCnpj },
          { key: "Telefone", value: fiador.telefone }
        ]);
        y += 2;
      }
    } else if (tipoDoc.startsWith('Recibo')) {
      addKeyValRow([
        { key: "Pessoa Pagadora", value: reciboPagador },
        { key: "Pessoa Recebedora", value: reciboRecebedor }
      ]);
      addKeyValRow([
        { key: "Competência", value: reciboCompetencia },
        { key: "Data do Recibo", value: formatDateBR(reciboData) }
      ]);
      y += 2;
    }

    // SECTION 3: CONDICOES E PAGAMENTO
    addSectionHeader("3. Condições Comerciais e Valores");
    if (tipoDoc.startsWith('Recibo')) {
      addKeyValRow([
        { key: "Valor Unitário", value: formatCurrencyBR(reciboValor) },
        { key: "Valor por Extenso", value: valPorExtenso }
      ]);
      
      checkPageBreak(12);
      const descWrapped = docPdf.splitTextToSize(`Descrição: ${reciboDescricao}`, maxLineWidth);
      docPdf.setFont("helvetica", "normal");
      docPdf.text(descWrapped, marginX, y);
      y += (descWrapped.length * 4.5) + 2;
    } else if (tipoDoc === 'ContratoLocacao') {
      addKeyValRow([
        { key: "Aluguel Mensal", value: formatCurrencyBR(rentalAluguel) },
        { key: "Condomínio", value: formatCurrencyBR(rentalCondominio) },
        { key: "Dia Vencimento", value: String(rentalDiaVencimento) }
      ]);
      addKeyValRow([
        { key: "IPTU", value: formatCurrencyBR(rentalIptu) },
        { key: "Taxa de Lixo", value: formatCurrencyBR(rentalLixo) },
        { key: "Garantia Locatícia", value: rentalGarantia }
      ]);
      addKeyValRow([
        { key: "Início", value: formatDateBR(rentalDataInicio) },
        { key: "Término", value: formatDateBR(rentalDataFim) },
        { key: "Reajuste", value: rentalReajuste }
      ]);
    } else {
      addKeyValRow([
        { key: "Valor anunciado", value: formatCurrencyBR(valAnunciado || valVendaImovel) },
        { key: "Valor proposto", value: formatCurrencyBR(valProposto) },
        { key: "Valor final", value: formatCurrencyBR(valFinal) }
      ]);
      
      checkPageBreak(12);
      const extText = docPdf.splitTextToSize(`Valor por Extenso: ${valPorExtenso}`, maxLineWidth);
      docPdf.setFont("helvetica", "normal");
      docPdf.text(extText, marginX, y);
      y += (extText.length * 4.5) + 2;

      checkPageBreak(12);
      const payText = docPdf.splitTextToSize(`Formas de pagamento pactuadas: ${formasPagamento.join(', ')}`, maxLineWidth);
      docPdf.setFont("helvetica", "normal");
      docPdf.text(payText, marginX, y);
      y += (payText.length * 4.5) + 2;

      if (detalhesPagamento) {
        checkPageBreak(12);
        const detailsWrapped = docPdf.splitTextToSize(`Detalhamento: ${detalhesPagamento}`, maxLineWidth);
        docPdf.text(detailsWrapped, marginX, y);
        y += (detailsWrapped.length * 4.5) + 2;
      }
    }

    // SECTION 4: CLAUSULAS
    if (clauses.length > 0) {
      addSectionHeader("4. Cláusulas e Condições Gerais");
      clauses.forEach((cl, idx) => {
        checkPageBreak(25);
        docPdf.setFont("helvetica", "bold");
        docPdf.setFontSize(8.5);
        docPdf.text(`${idx + 1}. ${cl.titulo.toUpperCase()}`, marginX, y);
        y += 4.5;

        docPdf.setFont("helvetica", "normal");
        const lines = docPdf.splitTextToSize(cl.texto, maxLineWidth);
        docPdf.text(lines, marginX, y);
        y += (lines.length * 4.2) + 4;
      });
    }

    // SIGNATURES block - push down securely
    checkPageBreak(50);
    y += 10;
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(9);
    docPdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    docPdf.text(`Sorocaba/SP, ${formatDateBR(dataDoc)}`, marginX, y);
    y += 18;

    // Line anchors for signatures
    checkPageBreak(30);
    const colSigWidth = maxLineWidth / 2;
    
    if (tipoDoc === 'Proposta' || tipoDoc === 'Contraproposta' || tipoDoc === 'Aceite' || tipoDoc === 'ContratoCompraVenda') {
      docPdf.line(marginX, y, marginX + 65, y);
      docPdf.line(marginX + colSigWidth, y, marginX + colSigWidth + 65, y);
      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(8);
      docPdf.text("PROPONENTE / COMPRADOR", marginX, y + 4);
      docPdf.text("PROPRIETÁRIO / VENDEDOR", marginX + colSigWidth, y + 4);

      y += 18;
      checkPageBreak(25);
      docPdf.line(marginX, y, marginX + 110, y);
      docPdf.text("RB SOROCABA NEGÓCIOS IMOBILIÁRIOS\nIntermediador Autorizado / CRECI 123456-J", marginX, y + 4);
    } else if (tipoDoc === 'ContratoLocacao') {
      docPdf.line(marginX, y, marginX + 65, y);
      docPdf.line(marginX + colSigWidth, y, marginX + colSigWidth + 65, y);
      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(8);
      docPdf.text("LOCATÁRIO", marginX, y + 4);
      docPdf.text("LOCADOR / PROPRIETÁRIO", marginX + colSigWidth, y + 4);

      if (fiador.temFiador) {
        y += 18;
        checkPageBreak(25);
        docPdf.line(marginX, y, marginX + 65, y);
        docPdf.line(marginX + colSigWidth, y, marginX + colSigWidth + 65, y);
        docPdf.text("FIADOR", marginX, y + 4);
        docPdf.text("TESTEMUNHA / CRECI", marginX + colSigWidth, y + 4);
      }
    } else {
      // Recibo Signatures
      docPdf.line(marginX, y, marginX + 110, y);
      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(8);
      docPdf.text("ASSINATURA DO DECLARANTE / EMISSOR", marginX, y + 4);
    }

    // Save/Download PDF locally!
    docPdf.save(`${tipoDoc}_${codigoImovel || 'RB_Sorocaba'}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header bar */}
        <div className="bg-[#111111] text-white px-6 py-4 flex justify-between items-center shrink-0 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-black uppercase tracking-wider flex items-center gap-2 text-white">
              <span className="text-[#F5B400] font-black">RB SOROCABA</span>
              <span className="text-white/60 font-light">|</span>
              <span className="text-neutral-300">Editor de Documentos</span>
            </h2>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Sem Nome ou Logos Menta - 100% Personalizado</p>
          </div>
          <button onClick={onClose} className="p-1 px-3 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 font-bold uppercase rounded-lg cursor-pointer transition">
            Fechar ✕
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div className="bg-neutral-50 px-6 py-3.5 border-b border-neutral-100 flex items-center justify-between gap-1 shrink-0 overflow-x-auto">
          <div className="flex items-center space-x-2 md:space-x-6">
            {steps.map((step) => (
              <button 
                key={step.id} 
                disabled={stage === 'revisao'}
                onClick={() => setStage(step.id)}
                className={`text-[10px] font-bold uppercase tracking-wider transition ${
                  stage === step.id ? 'text-[#F5B400] border-b-2 border-[#F5B400] pb-1' : 'text-neutral-500 hover:text-black'
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] bg-neutral-200 text-neutral-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Modo: {normalizarTipoDoc(tipoDoc)}
          </span>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          
          {/* STEP 1: SELECT TIPO */}
          {stage === 'tipo' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h3 className="text-md font-bold text-neutral-900 border-b pb-2 uppercase tracking-wide">Etapa 1 — Tipo de Documento</h3>
                <p className="text-xs text-neutral-500 mt-1">Selecione a categoria de documento comercial ou recibo imobiliário.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: 'Proposta', title: 'Proposta de Compra', desc: 'Registrar intenção inicial do comprador.' },
                  { id: 'Contraproposta', title: 'Contraproposta de Compra', desc: 'Modificar proposta original enviada.' },
                  { id: 'Aceite', title: 'Aceite de Proposta', desc: 'Deixar assinalado o aceite das partes.' },
                  { id: 'ContratoCompraVenda', title: 'Contrato de Compra e Venda', desc: 'Minuta particular oficial.' },
                  { id: 'ContratoLocacao', title: 'Contrato de Locação', desc: 'Aluguel com garantias e fiador.' },
                  { id: 'ReciboLocatario', title: 'Recibo de Locação (Inquilino)', desc: 'Recibo para o locatário.' },
                  { id: 'ReciboLocador', title: 'Recibo de Repasse (Proprietário)', desc: 'Recibo repasse com taxas.' },
                  { id: 'ReciboComissao', title: 'Recibo de Comissão', desc: 'Comissão corretor/imobiliária.' },
                  { id: 'ReciboEditavel', title: 'Recibo Editável Completo', desc: 'Recibo com textos customizados.' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setTipoDoc(item.id as DocType)}
                    className={`p-4 text-left border rounded-xl transition cursor-pointer flex flex-col justify-between h-32 ${
                      tipoDoc === item.id 
                        ? 'border-[#F5B400] bg-[#F5B400]/5 ring-1 ring-[#F5B400]' 
                        : 'border-neutral-200 hover:border-neutral-400 bg-white'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wide">{item.title}</h4>
                      <p className="text-[10px] text-neutral-500 mt-2 line-clamp-2">{item.desc}</p>
                    </div>
                    {tipoDoc === item.id && <span className="text-[10px] text-[#F5B400] font-bold uppercase tracking-wider self-end mt-2">Selecionado</span>}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wide mb-1">Status do Documento</label>
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:border-black font-semibold"
                  >
                    <option value="Rascunho">Rascunho</option>
                    <option value="Gerado">Gerado</option>
                    <option value="Enviado">Enviado</option>
                    <option value="Assinado">Assinado</option>
                    <option value="Aceito">Aceito</option>
                    <option value="Recusado">Recusado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wide mb-1">Data de Emissão (Fevereiro/Março etc)</label>
                  <input 
                    type="date" 
                    value={dataDoc} 
                    onChange={e => setDataDoc(e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wide mb-1">Observações Internas (Não aparecem no PDF)</label>
                <textarea 
                  value={observacoesInternas}
                  onChange={e => setObservacoesInternas(e.target.value)}
                  placeholder="Instruções privadas, anotações de telefone, histórico de prospecção..."
                  rows={2}
                  className="w-full border border-neutral-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>
          )}

          {/* STEP 2: SELECIONAR IMOVEL */}
          {stage === 'imovel' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h3 className="text-md font-bold text-neutral-900 border-b pb-2 uppercase tracking-wide">Etapa 2 — Vínculo de Imóvel</h3>
                <p className="text-xs text-neutral-500 mt-1">Busque um imóvel cadastrado no portal da imobiliária para preenchimento automático das informações.</p>
              </div>

              {/* SEARCH BOX */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400 pointer-events-none">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Pesquise por código do imóvel ou título..."
                  value={searchImovelTerm}
                  onChange={e => setSearchImovelTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* SEARCH RESULTS SPLIT VIEW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64 overflow-y-auto border border-neutral-100 p-2 rounded-xl bg-neutral-50">
                {filteredImoveis.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-xs text-neutral-500">Nenhum imóvel encontrado. Tente pesquisar outro termo ou digite os dados abaixo manualmente.</div>
                ) : (
                  filteredImoveis.map(imo => (
                    <div 
                      key={imo.id} 
                      onClick={() => applySelectedImovel(imo)}
                      className={`p-3 rounded-lg border bg-white cursor-pointer transition flex gap-3 ${
                        selectedImovel?.id === imo.id ? 'border-[#F5B400] ring-1 ring-[#F5B400]' : 'border-neutral-100 hover:border-neutral-300'
                      }`}
                    >
                      {imo.image ? (
                        <img src={imo.image} alt={imo.title} className="w-16 h-16 rounded-md object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-16 h-16 bg-neutral-100 rounded-md flex items-center justify-center flex-shrink-0">
                          <ImageIcon size={18} className="text-neutral-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] bg-neutral-150 text-neutral-700 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">{imo.codigoImovel || imo.codigo || 'S/COD'}</span>
                        <h4 className="text-xs font-bold text-neutral-800 truncate mt-1">{imo.title}</h4>
                        <p className="text-[10px] text-neutral-500 truncate">{imo.neighborhood || imo.bairro}, {imo.city || imo.cidade}</p>
                        <p className="text-[10px] font-black text-neutral-900 mt-1">{formatCurrencyBR(imo.priceValue || imo.valorVenda)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* MANUAL ATRIBUTES EDITOR */}
              <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-4">
                <h4 className="text-xs font-black text-[#F5B400] uppercase tracking-wider">Ajustar os Atributos do Imóvel para este Contrato</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 text-xs">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 uppercase">Cód Imóvel</label>
                    <input type="text" value={codigoImovel} onChange={e => setCodigoImovel(e.target.value)} className="w-full border border-neutral-200 rounded p-1.5 text-xs font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 uppercase">Tipo</label>
                    <input type="text" value={tipoImovel} onChange={e => setTipoImovel(e.target.value)} className="w-full border border-neutral-200 rounded p-1.5 text-xs font-semibold bg-white" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-neutral-500 uppercase">Título do Imóvel</label>
                    <input type="text" value={tituloImovel} onChange={e => setTituloImovel(e.target.value)} className="w-full border border-neutral-200 rounded p-1.5 text-xs font-semibold bg-white" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-neutral-500 uppercase">Endereço</label>
                    <input type="text" value={enderecoImovel} onChange={e => setEnderecoImovel(e.target.value)} className="w-full border border-neutral-200 rounded p-1.5 text-xs font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 uppercase">Bairro</label>
                    <input type="text" value={bairroImovel} onChange={e => setBairroImovel(e.target.value)} className="w-full border border-neutral-200 rounded p-1.5 text-xs font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 uppercase">Cidade</label>
                    <input type="text" value={cidadeImovel} onChange={e => setCidadeImovel(e.target.value)} className="w-full border border-neutral-200 rounded p-1.5 text-xs font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 uppercase">Matrícula (S.I.)</label>
                    <input type="text" value={matriculaImovel} onChange={e => setMatriculaImovel(e.target.value)} placeholder="000.000" className="w-full border border-neutral-200 rounded p-1.5 text-xs font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 uppercase">C.R.I. Foro</label>
                    <input type="text" value={criImovel} onChange={e => setCriImovel(e.target.value)} placeholder="1º Oficial Sorocaba" className="w-full border border-neutral-200 rounded p-1.5 text-xs font-semibold bg-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 uppercase">Valor Venda (R$)</label>
                    <input 
                      type="text" 
                      value={formatCurrencyBR(valVendaImovel)} 
                      onChange={e => setValVendaImovel(parseCurrencyBR(e.target.value))} 
                      className="w-full border border-neutral-200 rounded p-1.5 text-xs font-semibold bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 uppercase">Valor Locação (R$)</label>
                    <input 
                      type="text" 
                      value={formatCurrencyBR(valAluguelImovel)} 
                      onChange={e => setValAluguelImovel(parseCurrencyBR(e.target.value))} 
                      className="w-full border border-neutral-200 rounded p-1.5 text-xs font-semibold bg-white" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEWS ENVOLVIDOS (PARTES) */}
          {stage === 'partes' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div>
                <h3 className="text-md font-bold text-neutral-900 border-b pb-2 uppercase tracking-wide">Etapa 3 — Qualificação das Partes</h3>
                <p className="text-xs text-neutral-500 mt-1">Insira os dados cadastrais das pessoas físicas ou jurídicas envolvidas no ato.</p>
              </div>

              {/* RECIBO TYPE PARTIES */}
              {tipoDoc.startsWith('Recibo') ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-neutral-100 rounded-xl bg-white space-y-3">
                    <h4 className="text-xs font-black text-neutral-900 uppercase">Dados do Pagador</h4>
                    <div>
                      <label className="block text-[9px] text-neutral-500 font-bold uppercase mb-1">Nome Completo / Razão Social</label>
                      <input type="text" value={reciboPagador} onChange={e => setReciboPagador(e.target.value)} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                    </div>
                  </div>
                  <div className="p-4 border border-neutral-100 rounded-xl bg-white space-y-3">
                    <h4 className="text-xs font-black text-neutral-900 uppercase">Dados do Recebedor</h4>
                    <div>
                      <label className="block text-[9px] text-neutral-500 font-bold uppercase mb-1">Nome / Empresa Autora</label>
                      <input type="text" value={reciboRecebedor} onChange={e => setReciboRecebedor(e.target.value)} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                    </div>
                  </div>
                </div>
              ) : (
                /* PROPOSTAS, COMPRA E VENDA, LOCACAO PARTIES */
                <div className="space-y-6">
                  
                  {/* LOCADOR / PROPRIETARIO / VENDEDOR (Always Owner of Property) */}
                  <div className="p-4 border border-neutral-150 rounded-xl bg-white space-y-4">
                    <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      Proprietário / Vendedor / Locador
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 uppercase">Nome Completo</label>
                        <input type="text" value={vendedor.nome} onChange={e => setVendedor({...vendedor, nome: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 uppercase">CPF / CNPJ</label>
                        <input type="text" value={vendedor.cpfCnpj} onChange={e => setVendedor({...vendedor, cpfCnpj: formatCPF(e.target.value)})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 uppercase">RG</label>
                        <input type="text" value={vendedor.rg} onChange={e => setVendedor({...vendedor, rg: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 uppercase">Estado Civil</label>
                        <input type="text" value={vendedor.estadoCivil} onChange={e => setVendedor({...vendedor, estadoCivil: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 uppercase">Profissão</label>
                        <input type="text" value={vendedor.profissao} onChange={e => setVendedor({...vendedor, profissao: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 uppercase">Telefone / WHATSAPP</label>
                        <input type="text" value={vendedor.telefone} onChange={e => setVendedor({...vendedor, telefone: formatPhone(e.target.value), whatsapp: formatPhone(e.target.value)})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] font-bold text-neutral-500 uppercase">Endereço Civil</label>
                        <input type="text" value={vendedor.endereco} onChange={e => setVendedor({...vendedor, endereco: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 uppercase">Email proprietário</label>
                        <input type="text" value={vendedor.email} onChange={e => setVendedor({...vendedor, email: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs" />
                      </div>
                    </div>
                  </div>

                  {/* BUYER / LOCATARIO SELECTIVE */}
                  {(tipoDoc === 'Proposta' || tipoDoc === 'Contraproposta' || tipoDoc === 'Aceite' || tipoDoc === 'ContratoCompraVenda') && (
                    <div className="p-4 border border-neutral-150 rounded-xl bg-white space-y-4">
                      <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#F5B400] rounded-full"></span>
                        Qualificação do Comprador / Proponente
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 uppercase">Nome Completo</label>
                          <input type="text" value={comprador.nome} onChange={e => setComprador({...comprador, nome: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 uppercase">CPF / CNPJ</label>
                          <input type="text" value={comprador.cpfCnpj} onChange={e => setComprador({...comprador, cpfCnpj: formatCPF(e.target.value)})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 uppercase">RG</label>
                          <input type="text" value={comprador.rg} onChange={e => setComprador({...comprador, rg: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 uppercase">Estado Civil</label>
                          <input type="text" value={comprador.estadoCivil} onChange={e => setComprador({...comprador, estadoCivil: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 uppercase">Profissão</label>
                          <input type="text" value={comprador.profissao} onChange={e => setComprador({...comprador, profissao: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 uppercase">Telefone / WHATSAPP</label>
                          <input type="text" value={comprador.telefone} onChange={e => setComprador({...comprador, telefone: formatPhone(e.target.value), whatsapp: formatPhone(e.target.value)})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-neutral-500 uppercase">Endereço Residencial</label>
                          <input type="text" value={comprador.endereco} onChange={e => setComprador({...comprador, endereco: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 uppercase">CEP</label>
                          <input type="text" value={comprador.cep} onChange={e => setComprador({...comprador, cep: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs" />
                        </div>
                      </div>

                      {/* SPOUSE OR ADDITIONAL INFO */}
                      <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="chkConjuge" 
                          checked={comprador.possuiConjuge}
                          onChange={e => setComprador({...comprador, possuiConjuge: e.target.checked})}
                          className="rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="chkConjuge" className="text-xs font-bold text-neutral-700 uppercase">Possui cônjuge / co-adquirente?</label>
                      </div>

                      {comprador.possuiConjuge && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-in slide-in-from-top-1 duration-150">
                          <div>
                            <label className="block text-[9px] text-[#F5B400] font-bold uppercase">Nome Completo do Cônjuge</label>
                            <input type="text" value={comprador.nomeConjuge || ''} onChange={e => setComprador({...comprador, nomeConjuge: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                          </div>
                          <div>
                            <label className="block text-[9px] text-[#F5B400] font-bold uppercase">CPF do Cônjuge</label>
                            <input type="text" value={comprador.cpfConjuge || ''} onChange={e => setComprador({...comprador, cpfConjuge: formatCPF(e.target.value)})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* LOCATARIO SPECIFIC FOR RENTALS */}
                  {tipoDoc === 'ContratoLocacao' && (
                    <div className="space-y-6">
                      <div className="p-4 border border-neutral-150 rounded-xl bg-white space-y-4">
                        <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2 font-black">
                          <span className="w-2 h-2 bg-[#F5B400] rounded-full"></span>
                          Qualificação do Locatário
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase">Nome Completo</label>
                            <input type="text" value={locatario.nome} onChange={e => setLocatario({...locatario, nome: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase">CPF / CNPJ</label>
                            <input type="text" value={locatario.cpfCnpj} onChange={e => setLocatario({...locatario, cpfCnpj: formatCPF(e.target.value)})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase">RG</label>
                            <input type="text" value={locatario.rg} onChange={e => setLocatario({...locatario, rg: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase">Estado Civil</label>
                            <input type="text" value={locatario.estadoCivil} onChange={e => setLocatario({...locatario, estadoCivil: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold text-stone-900" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase">Profissão</label>
                            <input type="text" value={locatario.profissao} onChange={e => setLocatario({...locatario, profissao: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase">Telefone / WHATSAPP</label>
                            <input type="text" value={locatario.telefone} onChange={e => setLocatario({...locatario, telefone: formatPhone(e.target.value), whatsapp: formatPhone(e.target.value)})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase">Endereço Residencial Atual</label>
                            <input type="text" value={locatario.endereco} onChange={e => setLocatario({...locatario, endereco: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase">CEP</label>
                            <input type="text" value={locatario.cep} onChange={e => setLocatario({...locatario, cep: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-medium" />
                          </div>
                        </div>

                        {/* FIADOR OPCAO */}
                        <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id="chkFiador" 
                            checked={fiador.temFiador}
                            onChange={e => setFiador({...fiador, temFiador: e.target.checked})}
                            className="rounded border-neutral-300 text-amber-600 focus:ring-amber-500Custom"
                          />
                          <label htmlFor="chkFiador" className="text-xs font-bold text-neutral-700 uppercase">Este contrato possui fiador garante?</label>
                        </div>

                        {fiador.temFiador && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs animate-in slide-in-from-top-1 duration-150">
                            <div>
                              <label className="block text-[9px] text-[#F5B400] font-bold uppercase">Nome Completo Fiador</label>
                              <input type="text" value={fiador.nome} onChange={e => setFiador({...fiador, nome: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-[#F5B400] font-bold uppercase">CPF do Fiador</label>
                              <input type="text" value={fiador.cpfCnpj} onChange={e => setFiador({...fiador, cpfCnpj: formatCPF(e.target.value)})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-[#F5B400] font-bold uppercase">Telefone do Fiador</label>
                              <input type="text" value={fiador.telefone} onChange={e => setFiador({...fiador, telefone: formatPhone(e.target.value)})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[9px] text-[#F5B400] font-bold uppercase">Endereço Residencial Fiador</label>
                              <input type="text" value={fiador.endereco} onChange={e => setFiador({...fiador, endereco: e.target.value})} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* STEP 4: PAGAMENTO / VALORES */}
          {stage === 'pagamento' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h3 className="text-md font-bold text-neutral-900 border-b pb-2 uppercase tracking-wide">Etapa 4 — Detalhes Comerciais e Pagamento</h3>
                <p className="text-xs text-neutral-500 mt-1">Configure as transações financeiras, valores nominais e taxas.</p>
              </div>

              {/* RECIBO VALORES */}
              {tipoDoc.startsWith('Recibo') ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-neutral-600 font-bold uppercase mb-1">Valor Nominal do Recibo (R$)</label>
                    <input 
                      type="text" 
                      value={formatCurrencyBR(reciboValor)} 
                      onChange={e => setReciboValor(parseCurrencyBR(e.target.value))} 
                      className="w-full border border-neutral-200 rounded-lg p-2.5 text-xs font-semibold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-600 font-bold uppercase mb-1">Competência de Referência</label>
                    <input type="text" value={reciboCompetencia} onChange={e => setReciboCompetencia(e.target.value)} placeholder="Ex: Fevereiro/2026" className="w-full border border-neutral-200 rounded-lg p-2 text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-600 font-bold uppercase mb-1">Data do Recibo</label>
                    <input type="date" value={reciboData} onChange={e => setReciboData(e.target.value)} className="w-full border border-neutral-200 rounded-lg p-2 text-xs font-semibold" />
                  </div>
                  <div className="col-span-1 sm:col-span-3">
                    <label className="block text-[10px] text-neutral-600 font-bold uppercase mb-1">Descrição Comercial</label>
                    <input type="text" value={reciboDescricao} onChange={e => setReciboDescricao(e.target.value)} placeholder="Ref. ao aluguel de imóvel comercial na AV Campolim, 1200..." className="w-full border border-neutral-200 rounded-lg p-2.5 text-xs font-medium" />
                  </div>
                  <div className="col-span-1 sm:col-span-3">
                    <label className="block text-[10px] text-neutral-600 font-bold uppercase mb-1">Observações do Recibo (Cláusula Rodapé)</label>
                    <textarea value={reciboObservacoes} onChange={e => setReciboObservacoes(e.target.value)} placeholder="Ex: Isenção de multa concedida de comum acordo..." rows={2} className="w-full border border-neutral-200 rounded-lg p-2 text-xs font-light" />
                  </div>
                </div>
              ) : tipoDoc === 'ContratoLocacao' ? (
                /* LOCACAO VALORES */
                <div className="p-4 border border-neutral-150 bg-white rounded-xl space-y-4">
                  <h4 className="text-xs font-black text-neutral-900 uppercase">Valores e Condições Locatícias</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">Aluguel Mensal (R$)</label>
                      <input type="text" value={formatCurrencyBR(rentalAluguel)} onChange={e => setRentalAluguel(parseCurrencyBR(e.target.value))} className="w-full border border-neutral-200 rounded p-1.5 font-bold" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">Condomínio (R$)</label>
                      <input type="text" value={formatCurrencyBR(rentalCondominio)} onChange={e => setRentalCondominio(parseCurrencyBR(e.target.value))} className="w-full border border-neutral-200 rounded p-1.5 font-bold" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">IPTU Mensal (R$)</label>
                      <input type="text" value={formatCurrencyBR(rentalIptu)} onChange={e => setRentalIptu(parseCurrencyBR(e.target.value))} className="w-full border border-neutral-200 rounded p-1.5" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">Taxa de Lixo (R$)</label>
                      <input type="text" value={formatCurrencyBR(rentalLixo)} onChange={e => setRentalLixo(parseCurrencyBR(e.target.value))} className="w-full border border-neutral-200 rounded p-1.5" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">Seguro Incêndio (R$)</label>
                      <input type="text" value={formatCurrencyBR(rentalSeguroIncendio)} onChange={e => setRentalSeguroIncendio(parseCurrencyBR(e.target.value))} className="w-full border border-neutral-200 rounded p-1.5" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">Dia de Vencimento</label>
                      <input type="number" min={1} max={31} value={rentalDiaVencimento} onChange={e => setRentalDiaVencimento(parseInt(e.target.value || '10'))} className="w-full border border-neutral-200 rounded p-1.5 font-bold" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">Garantia Locatícia</label>
                      <input type="text" value={rentalGarantia} onChange={e => setRentalGarantia(e.target.value)} className="w-full border border-neutral-200 rounded p-1.5 font-bold" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">Comissão RB (%)</label>
                      <input type="number" value={rentalComissao} onChange={e => setRentalComissao(parseFloat(e.target.value || '10'))} className="w-full border border-neutral-200 rounded p-1.5" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">Data Início Locação</label>
                      <input type="date" value={rentalDataInicio} onChange={e => setRentalDataInicio(e.target.value)} className="w-full border border-neutral-200 rounded p-1.5" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">Data Fim Locação</label>
                      <input type="date" value={rentalDataFim} onChange={e => setRentalDataFim(e.target.value)} className="w-full border border-neutral-200 rounded p-1.5" />
                    </div>
                  </div>
                </div>
              ) : (
                /* COMPRA E VENDA OU PROPOSTA VALORES */
                <div className="space-y-6">
                  
                  {/* SELECT MULTIPLE FORMAS DE PAGAMENTO */}
                  <div className="p-4 border border-neutral-150 bg-white rounded-xl space-y-3">
                    <h4 className="text-xs font-black text-neutral-900 uppercase">Formas de Pagamento Pactuadas (Múltipla Seleção)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[
                        'À vista', 'Financiamento bancário', 'FGTS', 'Consórcio', 'Parcelamento direto', 'Sinal / Entrada', 'Permuta', 'Outras'
                      ].map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs">
                          <input 
                            type="checkbox" 
                            id={`chk-${f}`} 
                            checked={formasPagamento.includes(f)}
                            onChange={e => {
                              if (e.target.checked) {
                                setFormasPagamento([...formasPagamento, f]);
                              } else {
                                setFormasPagamento(formasPagamento.filter(item => item !== f));
                              }
                            }}
                            className="rounded border-neutral-300 text-amber-600 focus:ring-amber-500 font-bold"
                          />
                          <label htmlFor={`chk-${f}`} className="text-neutral-700 font-semibold">{f}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border border-neutral-150 bg-white rounded-xl space-y-4">
                    <h4 className="text-xs font-black text-neutral-900 uppercase">Ajustar os Valores Comerciais</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-neutral-500">Valor Anunciado</label>
                        <input type="text" value={formatCurrencyBR(valAnunciado || valVendaImovel)} onChange={e => setValAnunciado(parseCurrencyBR(e.target.value))} className="w-full border border-neutral-200 rounded p-1.5 font-bold" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-neutral-500">Valor Proposto (R$)</label>
                        <input type="text" value={formatCurrencyBR(valProposto)} onChange={e => setValProposto(parseCurrencyBR(e.target.value))} className="w-full border border-neutral-200 rounded p-1.5 font-bold" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-[#F5B400]">Valor Negociado Fechado</label>
                        <input type="text" value={formatCurrencyBR(valFinal)} onChange={e => setValFinal(parseCurrencyBR(e.target.value))} className="w-full border border-neutral-200 rounded p-1.5 font-black text-[#F5B400] bg-amber-500/5 border-amber-300" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-neutral-500">Validade da Proposta</label>
                        <input type="text" value={validadeProposta} onChange={e => setValidadeProposta(e.target.value)} className="w-full border border-neutral-200 rounded p-1.5" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-neutral-500">Sinal / Entrada (R$)</label>
                        <input type="text" value={formatCurrencyBR(valSinal)} onChange={e => setValSinal(parseCurrencyBR(e.target.value))} className="w-full border border-neutral-200 rounded p-1.5" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-neutral-500">Valor FGTS Vinculado</label>
                        <input type="text" value={formatCurrencyBR(valFGTS)} onChange={e => setValFGTS(parseCurrencyBR(e.target.value))} className="w-full border border-neutral-200 rounded p-1.5" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-neutral-500">Valor Financiado</label>
                        <input type="text" value={formatCurrencyBR(valFinanciamento)} onChange={e => setValFinanciamento(parseCurrencyBR(e.target.value))} className="w-full border border-neutral-200 rounded p-1.5" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-neutral-500">Valor de Permuta</label>
                        <input type="text" value={formatCurrencyBR(valPermuta)} onChange={e => setValPermuta(parseCurrencyBR(e.target.value))} className="w-full border border-neutral-200 rounded p-1.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">Valor por Extenso Gerado (Editável)</label>
                        <input type="text" value={valPorExtenso} onChange={e => setValPorExtenso(e.target.value)} className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold bg-neutral-50" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">Detalhamento Condições de Pagamento</label>
                        <input type="text" value={detalhesPagamento} onChange={e => setDetalhesPagamento(e.target.value)} placeholder="Ex: Sinal de R$ 50 mil em cheque + saldo via Caixa Econômica..." className="w-full border border-neutral-200 rounded p-2 text-xs font-semibold" />
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* STEP 5: CLAUSULAS */}
          {stage === 'clausulas' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3 className="text-md font-bold text-neutral-900 uppercase tracking-wide">Etapa 5 — Cláusulas e Termos Gerais</h3>
                  <p className="text-xs text-neutral-500 mt-1">Gerencie, edite ou adicione regras para compor o corpo do documento.</p>
                </div>
                <button 
                  onClick={addClause}
                  className="bg-[#111111] hover:bg-neutral-800 text-[#F5B400] text-xs font-bold uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus size={14} /> Nova Cláusula
                </button>
              </div>

              <div className="space-y-4">
                {clauses.map((c, index) => (
                  <div key={c.id} className="p-4 border border-neutral-200 rounded-xl bg-white space-y-3 shadow-xs relative">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-[#F5B400]/10 text-[#F5B400] font-black w-6 h-6 flex items-center justify-center rounded-full">
                          {index + 1}
                        </span>
                        <input 
                          type="text" 
                          value={c.titulo} 
                          onChange={e => updateClauseTitle(c.id, e.target.value)}
                          className="font-bold text-xs text-neutral-900 border-b border-dashed border-neutral-300 focus:border-black focus:outline-none py-0.5 bg-transparent"
                        />
                      </div>
                      <button 
                        onClick={() => removeClause(c.id)}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-lg cursor-pointer transition"
                        title="Remover cláusula"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      value={c.texto}
                      onChange={e => updateClauseText(c.id, e.target.value)}
                      rows={4}
                      className="w-full text-xs text-neutral-600 border border-neutral-100 focus:border-neutral-300 focus:outline-none p-2 bg-neutral-50/50 rounded-lg resize-y leading-relaxed font-medium"
                    />
                  </div>
                ))}

                {clauses.length === 0 && (
                  <div className="text-center py-12 border border-dashed rounded-xl text-neutral-400 text-xs">
                    Nenhuma cláusula adicionada. Clique em "+ Nova Cláusula" acima para começar.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: REVISAO / PRINT A4 PREVIEW */}
          {stage === 'revisao' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h3 className="text-md font-bold text-neutral-900 border-b pb-2 uppercase tracking-wide">Etapa 6 — Revisão do Documento (Visualização A4)</h3>
                <p className="text-xs text-neutral-500 mt-1">Confirme as informações dispostas no formato oficial A4 de impressão da RB Sorocaba.</p>
              </div>

              {/* A4 PAPER PREVIEW */}
              <div className="bg-gray-100 p-4 sm:p-8 rounded-2xl flex justify-center border border-neutral-200 max-h-[500px] overflow-y-auto shadow-inner">
                <div className="w-[210mm] min-h-[297mm] bg-white text-black p-12 shadow-md relative scale-95 origin-top text-xs leading-relaxed space-y-6">
                  
                  {/* Letterhead Header */}
                  <div className="border-b-4 border-[#F5B400] pb-4 flex justify-between items-start">
                    <div>
                      <h1 className="text-lg font-black uppercase tracking-wider text-[#111111]">{companySettings.nomeFantasia}</h1>
                      <p className="text-[10px] text-neutral-500 mt-1 font-bold">CRECI PJ: {companySettings.creciPj} | Tel: {companySettings.telefone}</p>
                    </div>
                    <div className="text-right text-[10px] text-neutral-500">
                      <p className="font-bold">{companySettings.email}</p>
                      <p className="font-bold">{companySettings.site}</p>
                    </div>
                  </div>

                  {/* Document Title */}
                  <div className="text-center py-6">
                    <h2 className="text-md font-black uppercase tracking-wide text-neutral-900 decoration-[#F5B400] underline decoration-2">
                      {normalizarTipoDoc(tipoDoc)}
                    </h2>
                    <p className="text-[10px] text-neutral-500 font-bold mt-1 uppercase tracking-widest">Documento ID: Proposta Comercial de Compra</p>
                  </div>

                  {/* 1. Imovel block */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-neutral-900 uppercase border-b pb-1 text-[11px] tracking-wide">1. Descrição do Imóvel Prometido</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-medium">
                      <div><strong className="font-extrabold text-[#111111]">Código Interno:</strong> {codigoImovel}</div>
                      <div><strong className="font-extrabold text-[#111111]">Tipo de Unidade:</strong> {tipoImovel}</div>
                      <div className="col-span-2"><strong className="font-extrabold text-[#111111]">Logradouro completo:</strong> {montarEnderecoCompleto({ endereco: enderecoImovel, numero: '', complemento: '', bairro: bairroImovel, city: cidadeImovel, state: estadoImovel, cep: cepImovel })}</div>
                      <div><strong className="font-extrabold text-[#111111]">Matrícula S.I:</strong> {matriculaImovel}</div>
                      <div><strong className="font-extrabold text-[#111111]">Foro C.R.I:</strong> {criImovel}</div>
                    </div>
                  </div>

                  {/* 2. Partes block */}
                  <div className="space-y-2 pt-2">
                    <h3 className="font-bold text-neutral-900 uppercase border-b pb-1 text-[11px] tracking-wide">2. Qualificação Jurídica das Partes</h3>
                    
                    {tipoDoc.startsWith('Recibo') ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p><strong className="font-bold uppercase text-neutral-600 block">Pessoa Pagadora</strong></p>
                          <p className="font-semibold text-neutral-800 mt-1">{reciboPagador}</p>
                        </div>
                        <div>
                          <p><strong className="font-bold uppercase text-neutral-600 block">Pessoa Recebedora</strong></p>
                          <p className="font-semibold text-neutral-800 mt-1">{reciboRecebedor}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 font-semibold">
                        <div>
                          <p><strong className="font-extrabold uppercase text-[#F5B400] text-[10px]">Vendedor / Proprietário / Locador</strong></p>
                          <p className="mt-1">{vendedor.nome} | CPF: {vendedor.cpfCnpj} | RG: {vendedor.rg} | Estado Civil: {vendedor.estadoCivil}</p>
                        </div>
                        <div>
                          <p><strong className="font-extrabold uppercase text-[#F5B400] text-[10px]">Comprador / Locatário / Proponente</strong></p>
                          <p className="mt-1">
                            {tipoDoc === 'ContratoLocacao' ? locatario.nome : comprador.nome} | 
                            CPF: {tipoDoc === 'ContratoLocacao' ? locatario.cpfCnpj : comprador.cpfCnpj} | 
                            RG: {tipoDoc === 'ContratoLocacao' ? locatario.rg : comprador.rg}
                          </p>
                        </div>
                        {fiador.temFiador && (
                          <div>
                            <p><strong className="font-extrabold uppercase text-[#F5B400] text-[10px]">Garantidor Fidejussório (Fiador)</strong></p>
                            <p className="mt-1">{fiador.nome} | CPF: {fiador.cpfCnpj} | Fone: {fiador.telefone}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3. Condicoes block */}
                  <div className="space-y-2 pt-2">
                    <h3 className="font-bold text-neutral-900 uppercase border-b pb-1 text-[11px] tracking-wide">3. Preço, Moeda e Condições Comerciais</h3>
                    
                    {tipoDoc.startsWith('Recibo') ? (
                      <div className="space-y-1 font-semibold">
                        <div><strong className="font-black">VALOR RECEBIDO:</strong> {formatCurrencyBR(reciboValor)} ({valPorExtenso})</div>
                        <div><strong className="font-black">COMPETÊNCIA:</strong> {reciboCompetencia}</div>
                        <div className="pt-2 italic text-neutral-600">Descrição: {reciboDescricao}</div>
                      </div>
                    ) : tipoDoc === 'ContratoLocacao' ? (
                      <div className="grid grid-cols-2 gap-y-1.5 font-medium">
                        <div><strong className="font-black">Aluguel mensal:</strong> {formatCurrencyBR(rentalAluguel)}</div>
                        <div><strong className="font-black">Condomínio:</strong> {formatCurrencyBR(rentalCondominio)}</div>
                        <div><strong className="font-black">Dia Vencimento:</strong> {rentalDiaVencimento} de cada mês</div>
                        <div><strong className="font-black">Garantia expressa:</strong> {rentalGarantia}</div>
                        <div className="col-span-2"><strong className="font-black">Reajuste pactuado:</strong> {rentalReajuste}</div>
                        <div className="col-span-2"><strong className="font-black">Vigência:</strong> de {formatDateBR(rentalDataInicio)} até {formatDateBR(rentalDataFim)}</div>
                      </div>
                    ) : (
                      <div className="space-y-2 font-medium">
                        <div className="grid grid-cols-3 gap-4">
                          <div><strong className="font-extrabold text-neutral-500 block text-[9px]">VALOR PROPONENTE</strong> {formatCurrencyBR(valProposto)}</div>
                          <div><strong className="font-extrabold text-neutral-500 block text-[9px]">VALOR AJUSTADO</strong> {formatCurrencyBR(valFinal)}</div>
                          <div><strong className="font-extrabold text-neutral-500 block text-[9px]">VALIDADE</strong> {validadeProposta}</div>
                        </div>
                        <div className="pt-2"><strong className="font-extrabold text-[#111111]">Por extenso:</strong> {valPorExtenso}</div>
                        <div className="pt-1"><strong className="font-extrabold text-[#111111]">Metodologia:</strong> {formasPagamento.join(', ')}</div>
                        {detalhesPagamento && <div className="pt-1 text-neutral-600"><strong className="font-extrabold text-[#111111]">Detalhamento:</strong> {detalhesPagamento}</div>}
                      </div>
                    )}
                  </div>

                  {/* 4. Clauses block */}
                  {clauses.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <h3 className="font-bold text-neutral-900 uppercase border-b pb-1 text-[11px] tracking-wide">4. Cláusulas de Prática Imobiliária</h3>
                      {clauses.map((el, i) => (
                        <div key={el.id} className="space-y-1">
                          <h4 className="font-extrabold text-neutral-800 uppercase text-[9.5px]">{i + 1}. {el.titulo}</h4>
                          <p className="text-neutral-600 font-medium text-[9px] leading-relaxed">{el.texto}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Locating Signatures */}
                  <div className="pt-12 text-center text-[10px] text-neutral-500">
                    <p className="font-bold">Sorocaba/SP, {formatDateBR(dataDoc)}</p>
                    
                    <div className="grid grid-cols-2 gap-12 pt-16 font-semibold">
                      <div className="border-t border-neutral-300 pt-2 uppercase">Comprador / Locatário / Pagador</div>
                      <div className="border-t border-neutral-300 pt-2 uppercase">Proprietário / Vendedor / Locador</div>
                    </div>
                    
                    <div className="max-w-md mx-auto pt-16">
                      <div className="border-t border-neutral-300 pt-2 font-bold uppercase text-[#111111]">
                        {companySettings.nomeFantasia} | CRECI {companySettings.creciPj}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer controls */}
        <div className="bg-neutral-50 px-6 py-4.5 border-t border-neutral-200 shrink-0 flex justify-between items-center bg-white">
          <div className="flex gap-2">
            {stage !== 'tipo' && (
              <button 
                onClick={prevStage}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-105 text-xs font-bold uppercase rounded-lg flex items-center gap-1 cursor-pointer transition"
              >
                <ArrowLeft size={14} /> Voltar
              </button>
            )}
            <button 
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-500 font-bold uppercase hover:bg-neutral-100 rounded-lg cursor-pointer transition"
            >
              Cancelar
            </button>
          </div>

          <div className="flex gap-2.5">
            {stage !== 'revisao' ? (
              <button 
                onClick={nextStage}
                className="px-5 py-2.5 bg-neutral-900 border border-neutral-900 text-[#F5B400] hover:bg-neutral-800 text-xs font-black uppercase rounded-lg flex items-center gap-1 cursor-pointer transition"
              >
                Avançar <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <button 
                  onClick={() => saveToFirestore('Rascunho')}
                  className="px-4 py-2.5 border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-100 text-xs font-bold uppercase rounded-lg flex items-center gap-1 cursor-pointer transition"
                >
                  <Save size={14} /> Salvar Rascunho
                </button>
                <button 
                  onClick={handleGeneratePDF}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                >
                  <FileText size={15} /> Gerar e Baixar PDF
                </button>
                <button 
                  onClick={() => saveToFirestore('Gerado')}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-[#F5B400] text-xs font-black uppercase rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                >
                  <CheckCircle size={15} /> Validar e Salvar
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
