import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Plus, 
  Search, 
  FileText, 
  Copy, 
  Trash2, 
  Edit2, 
  Eye, 
  Ban, 
  Download, 
  CheckCircle, 
  BookOpen, 
  RefreshCw, 
  ArrowUpRight 
} from 'lucide-react';
import { ContractWizard } from './ContractWizard';
import { defaultClauses, Clause } from '../utils/defaultClauses';
import { formatCurrencyBR, formatDateBR } from '../utils/contractUtils';
import { jsPDF } from 'jspdf';

type ActiveTab = 'todos' | 'propostas' | 'contrapropostas' | 'aceites' | 'contratos' | 'recibos' | 'clausulas';

export const ContractsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('todos');
  const [documents, setDocuments] = useState<any[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<any>('Proposta');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Loaded collections state
  const [loading, setLoading] = useState(true);

  // Preview Modal state
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  // Clauses Administration state
  const [clausesList, setClausesList] = useState<Clause[]>(defaultClauses);
  const [newClauseForm, setNewClauseForm] = useState({ tipo: 'Proposta', titulo: '', texto: '' });

  // Load documents from 'documentosGerados' collection
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'documentosGerados'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      // Sort client side by createdAt
      docs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setDocuments(docs);
      setLoading(false);
    }, (err) => {
      console.warn("Erro ao carregar documentos:", err);
      setLoading(false);
    });

    return unsub;
  }, []);

  // Compute Statistics cards
  const stats = {
    propostas: documents.filter(d => ['Proposta', 'Contraproposta', 'Aceite'].includes(d.tipoDocumento)).length,
    contratos: documents.filter(d => ['ContratoCompraVenda', 'ContratoLocacao'].includes(d.tipoDocumento)).length,
    pendentes: documents.filter(d => d.status === 'Rascunho' || d.status === 'Gerado').length,
    mesActual: documents.filter(d => {
      if (!d.createdAt) return false;
      const date = d.createdAt.seconds ? new Date(d.createdAt.seconds * 1000) : new Date();
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Rascunho': return 'bg-stone-100 text-stone-700 border-stone-200';
      case 'Gerado': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'Enviado': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Assinado': return 'bg-emerald-50 text-emerald-800 border-emerald-150';
      case 'Aceito': return 'bg-teal-50 text-teal-800 border-teal-150';
      case 'Recusado': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Cancelado': return 'bg-red-50 text-red-700 border-red-150 border-dashed';
      default: return 'bg-stone-50 text-stone-600';
    }
  };

  const handleOpenWizard = (type: string) => {
    setSelectedDocType(type);
    setIsWizardOpen(true);
  };

  // Actions
  const handleDuplicate = async (docData: any) => {
    try {
      const { id, createdAt, updatedAt, ...rest } = docData;
      const dup = {
        ...rest,
        status: 'Rascunho',
        codigoImovel: (docData.codigoImovel || '') + ' (Cópia)',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(collection(db, 'documentosGerados'), dup);
      alert("Documento duplicado com sucesso!");
    } catch (err) {
      alert("Falha ao duplicar o documento.");
    }
  };

  const handleCancelStatus = async (id: string) => {
    if (!window.confirm("Deseja realmente cancelar este documento?")) return;
    try {
      await updateDoc(doc(db, 'documentosGerados', id), {
        status: 'Cancelado',
        updatedAt: serverTimestamp()
      });
      alert("Documento cancelado!");
    } catch (err) {
      alert("Erro ao alterar o status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Atenção! Esta ação é irreversível. Deseja mesmo excluir este documento?")) return;
    try {
      await deleteDoc(doc(db, 'documentosGerados', id));
      alert("Documento deletado permanentemente!");
    } catch (err) {
      alert("Erro ao excluir do Firestore.");
    }
  };

  // Fast download PDF using jsPDF
  const exportDocToPDF = (docData: any) => {
    const docPdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const primaryColor = [17, 17, 17];
    const secondaryColor = [245, 180, 0];
    const bodyColor = [60, 60, 60];

    // Banner
    docPdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    docPdf.rect(0, 0, 210, 32, "F");

    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(13);
    docPdf.setTextColor(255, 255, 255);
    docPdf.text("RB SOROCABA NEGÓCIOS IMOBILIÁRIOS", 15, 14);

    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(8);
    docPdf.setTextColor(220, 220, 220);
    docPdf.text("Av. Campolim, nº 1200 - Campolim | Sorocaba - SP | Fone: (15) 99114-3213 | atendimento@rbsorocaba.com.br", 15, 21);

    // Gold bar
    docPdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    docPdf.rect(0, 32, 210, 2, "F");

    // Title
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(15);
    docPdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    
    let label = 'DOCUMENTO COMERCIAL';
    if (docData.tipoDocumento === 'Proposta') label = 'PROPOSTA DE COMPRA';
    else if (docData.tipoDocumento === 'Contraproposta') label = 'CONTRAPROPOSTA DE COMPRA';
    else if (docData.tipoDocumento === 'Aceite') label = 'ACEITE DE PROPOSTA';
    else if (docData.tipoDocumento === 'ContratoCompraVenda') label = 'CONTRATO DE COMPRA E VENDA';
    else if (docData.tipoDocumento === 'ContratoLocacao') label = 'CONTRATO DE LOCAÇÃO';
    else if (docData.tipoDocumento?.startsWith('Recibo')) label = 'RECIBO OFICIAL';

    docPdf.text(label.toUpperCase(), 15, 48);

    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(9);
    docPdf.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);

    let y = 58;
    const marginX = 15;
    const maxLineWidth = 180;

    const printLine = (text: string, bold: boolean = false) => {
      docPdf.setFont("helvetica", bold ? "bold" : "normal");
      const splitText = docPdf.splitTextToSize(text, maxLineWidth);
      docPdf.text(splitText, marginX, y);
      y += (splitText.length * 5) + 1;
      if (y > 270) {
        docPdf.addPage();
        y = 20;
      }
    };

    printLine(`Código do Imóvel: ${docData.codigoImovel || 'S/C'}`, true);
    printLine(`Emissão: ${docData.dataDocumento || formatDateBR(new Date())}`, false);
    printLine(`Status do Termo: ${docData.status || 'Rascunho'}`, false);

    if (docData.dadosImovel) {
      printLine(`IMÓVEL: ${docData.dadosImovel.titulo || ''}`, true);
      printLine(`Logradouro: ${docData.dadosImovel.endereco || ''}, Bairro: ${docData.dadosImovel.bairro || ''}, Cidade: ${docData.dadosImovel.cidade || ''}`, false);
    }

    if (docData.textoFinal) {
      printLine("TEOR INTEGRAL E CLÁUSULAS CONTRATUAIS:", true);
      const paragraphs = docData.textoFinal.split('\n');
      paragraphs.forEach((p: string) => {
        if (p.trim()) {
          printLine(p, false);
        }
      });
    }

    docPdf.save(`RB_SOROCABA_${docData.tipoDocumento || 'DOC'}.pdf`);
  };

  // Add customized clauses template client-side
  const handleAddNewClause = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClauseForm.titulo || !newClauseForm.texto) return;

    const newCl: Clause = {
      id: 'template-' + Date.now(),
      tipoDocumento: newClauseForm.tipo,
      titulo: newClauseForm.titulo,
      texto: newClauseForm.texto,
      ativo: true,
      ordem: clausesList.length + 1
    };

    setClausesList([...clausesList, newCl]);
    setNewClauseForm({ tipo: 'Proposta', titulo: '', texto: '' });
    alert("Nova cláusula adicionada com sucesso!");
  };

  const removeClauseTemplate = (id: string) => {
    setClausesList(clausesList.filter(c => c.id !== id));
  };

  // Filter documents in current selected tab
  const filteredDocs = documents.filter(d => {
    // Tab filter
    if (activeTab === 'propostas' && !['Proposta', 'Contraproposta', 'Aceite'].includes(d.tipoDocumento)) return false;
    if (activeTab === 'contrapropostas' && d.tipoDocumento !== 'Contraproposta') return false;
    if (activeTab === 'aceites' && d.tipoDocumento !== 'Aceite') return false;
    if (activeTab === 'contratos' && !['ContratoCompraVenda', 'ContratoLocacao'].includes(d.tipoDocumento)) return false;
    if (activeTab === 'recibos' && !d.tipoDocumento?.startsWith('Recibo')) return false;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const code = (d.codigoImovel || '').toLowerCase();
      const title = (d.dadosImovel?.titulo || '').toLowerCase();
      const client = (d.dadosComprador?.nome || d.dadosLocatario?.nome || d.dadosPagador || '').toLowerCase();
      return code.includes(term) || title.includes(term) || client.includes(term);
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 bg-stone-50 min-h-screen">
      
      {/* Title block */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-stone-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <span className="text-[#F5B400]">Contratos e Propostas</span>
            <span className="text-stone-300 font-light">|</span>
            <span className="text-xs text-stone-550 font-bold uppercase tracking-widest bg-stone-200 px-2.5 py-1 rounded-full">Painel Admin</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
            Gere propostas de compra, contrapropostas, termos de aceite, minutas de locação e recibos com dados reais sincronizados do CRM.
          </p>
        </div>

        {/* Create Document operations */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => handleOpenWizard('Proposta')}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus size={13} className="text-[#F5B400]" /> Nova Proposta
          </button>
          <button 
            onClick={() => handleOpenWizard('Contraproposta')}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus size={13} className="text-[#F5B400]" /> Contraproposta
          </button>
          <button 
            onClick={() => handleOpenWizard('ContratoCompraVenda')}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus size={13} className="text-[#F5B400]" /> Novo Contrato
          </button>
          <button 
            onClick={() => handleOpenWizard('ReciboEditavel')}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus size={13} className="text-[#F5B400]" /> Novo Recibo
          </button>
        </div>
      </div>

      {/* STATISTICS CARDS COMPONENT */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Propostas criadas', value: stats.propostas, helper: 'Propostas & contrapropostas' },
          { label: 'Contratos gerados', value: stats.contratos, helper: 'Locação & Compra/Venda' },
          { label: 'Pendentes de assinatura', value: stats.pendentes, helper: 'Contratos em rascunho', color: 'text-amber-600' },
          { label: 'Documentos do mês', value: stats.mesActual, helper: 'Competência atual' }
        ].map(card => (
          <div key={card.label} className="bg-white p-5 rounded-2xl border border-stone-150 shadow-xs flex flex-col justify-between h-28 hover:shadow-sm transition">
            <div>
              <span className="text-[9px] text-stone-500 font-extrabold uppercase tracking-wider block">{card.label}</span>
              <span className="text-[10px] text-stone-400 font-medium block mt-0.5">{card.helper}</span>
            </div>
            <span className={`text-2xl font-black ${card.color || 'text-[#111111]'}`}>{card.value}</span>
          </div>
        ))}
      </div>

      {/* WORKSPACE AREA with top tabs */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden flex flex-col">
        
        {/* Tab row */}
        <div className="bg-stone-100 border-b border-stone-200 px-6 py-2.5 flex flex-wrap gap-1.5 justify-between items-center">
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'propostas', label: 'Propostas & Aceites' },
              { id: 'contratos', label: 'Minutas / Contratos' },
              { id: 'recibos', label: 'Recibos Locação' },
              { id: 'clausulas', label: 'Modelos & Cláusulas' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition uppercase tracking-wider ${
                  activeTab === tab.id 
                    ? 'bg-[#111111] text-[#F5B400]' 
                    : 'text-stone-600 hover:text-black hover:bg-stone-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab !== 'clausulas' && (
            <div className="relative w-full max-w-xs mt-2 sm:mt-0">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Filtrar por código ou cliente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-stone-200 bg-white text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          )}
        </div>

        {/* LOADING STATE VIEW */}
        {loading ? (
          <div className="text-center py-20 text-stone-500 font-bold text-xs flex flex-col items-center gap-2">
            <RefreshCw size={24} className="animate-spin text-[#F5B400]" /> Carregando documentos do Firestore...
          </div>
        ) : activeTab === 'clausulas' ? (
          /* CLAUSES TEMPLATE MANAGER TAB VIEW */
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Add template clause form column */}
              <form onSubmit={handleAddNewClause} className="bg-stone-100 p-5 rounded-xl border border-stone-200 space-y-3.5 self-start text-xs">
                <h4 className="text-xs font-black uppercase text-stone-900 flex items-center gap-1 border-b pb-2">
                  <Plus size={14} className="text-[#F5B400]" /> Adicionar Cláusula Modelo
                </h4>
                <div>
                  <label className="block text-[9px] font-bold text-stone-500 uppercase">Documento Alvo</label>
                  <select 
                    value={newClauseForm.tipo} 
                    onChange={e => setNewClauseForm({...newClauseForm, tipo: e.target.value})}
                    className="w-full border border-stone-200 rounded p-2 text-xs bg-white font-semibold mt-1"
                  >
                    <option value="Proposta">Proposta de Compra</option>
                    <option value="Contraproposta">Contraproposta</option>
                    <option value="Aceite">Aceite de Proposta</option>
                    <option value="ContratoCompraVenda">Contrato Compra & Venda</option>
                    <option value="ContratoLocacao">Contrato de Locação</option>
                    <option value="Recibo">Recibos de Aluguel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-stone-500 uppercase">Título da Cláusula</label>
                  <input 
                    type="text" 
                    value={newClauseForm.titulo} 
                    onChange={e => setNewClauseForm({...newClauseForm, titulo: e.target.value})}
                    placeholder="Ex: Da entrega das chaves..." 
                    className="w-full border border-stone-200 rounded p-2 text-xs bg-white font-semibold mt-1" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-stone-500 uppercase">Texto Jurídico da Cláusula</label>
                  <textarea 
                    value={newClauseForm.texto} 
                    onChange={e => setNewClauseForm({...newClauseForm, texto: e.target.value})}
                    placeholder="Redija os termos legais da minuta..." 
                    rows={6}
                    className="w-full border border-stone-200 rounded p-2 text-xs bg-white mt-1" 
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-[#F5B400] text-xs font-black uppercase rounded-lg transition"
                >
                  Salvar nos Modelos
                </button>
              </form>

              {/* Template clauses lists */}
              <div className="col-span-1 md:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-2">
                <h4 className="text-xs font-black uppercase text-stone-900 border-b pb-2">Cláusulas Modelo Cadastradas</h4>
                
                {clausesList.map((cl, i) => (
                  <div key={cl.id} className="p-4 border border-stone-200 rounded-lg bg-white space-y-2 relative shadow-xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] font-black uppercase bg-[#F5B400]/10 text-stone-800 px-2 py-0.5 rounded">
                        {cl.tipoDocumento}
                      </span>
                      <button 
                        onClick={() => removeClauseTemplate(cl.id)}
                        className="text-stone-400 hover:text-rose-600 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <h5 className="text-xs font-bold text-stone-900 uppercase">{cl.titulo}</h5>
                    <p className="text-[11px] text-stone-600 leading-relaxed font-semibold">{cl.texto}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        ) : filteredDocs.length === 0 ? (
          /* EMPTY STATE VIEW */
          <div className="text-center py-20 px-4 space-y-4">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
              <FileText size={22} />
            </div>
            <div>
              <h4 className="text-md font-bold text-[#111111] uppercase tracking-wide">Nenhum documento gerado ainda.</h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Utilize os botões de ação na parte superior ou o botão de atalho rápido na gestão de locação/imóveis para lavrar sua primeira minuta.
              </p>
            </div>
            <button 
              onClick={() => handleOpenWizard('Proposta')}
              className="px-4.5 py-2 bg-neutral-900 hover:bg-neutral-850 text-[#F5B400] text-xs font-black uppercase rounded-xl shadow-xs transition"
            >
              Criar Primeiro Documento
            </button>
          </div>
        ) : (
          /* MAIN DOCUMENTS LIST VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 border-b border-stone-200 text-stone-600 font-extrabold uppercase tracking-wide">
                <tr>
                  <th className="p-4">Tipo do Documento</th>
                  <th className="p-4">Código Imóvel</th>
                  <th className="p-4">Logradouro / Título</th>
                  <th className="p-4">Cliente / Parte Principal</th>
                  <th className="p-4 text-right">Valor Final</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Data do Documento</th>
                  <th className="p-4 text-[#F5B400]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 text-stone-700 bg-white">
                {filteredDocs.map((docData) => {
                  // Determine principal client name
                  const clientName = docData.tipoDocumento === 'ContratoLocacao' 
                    ? docData.dadosLocatario?.nome 
                    : docData.dadosComprador?.nome || docData.dadosPagador || 'S/CLIENTE';

                  // Determine value (use final, proposed or rental)
                  const displayValue = docData.tipoDocumento === 'ContratoLocacao'
                    ? (docData.dadosPagamento?.valorAluguel)
                    : docData.valor || docData.dadosPagamento?.valorFinalNegociado || docData.dadosPagamento?.valorProposto || 0;

                  return (
                    <tr key={docData.id} className="hover:bg-amber-500/5 transition">
                      
                      {/* Document Type badge */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-stone-900">
                            {docData.tipoDocumento === 'Proposta' ? 'Proposta de Compra' : 
                             docData.tipoDocumento === 'Contraproposta' ? 'Contraproposta' :
                             docData.tipoDocumento === 'Aceite' ? 'Aceite' :
                             docData.tipoDocumento === 'ContratoCompraVenda' ? 'Contrato Compra/Venda' :
                             docData.tipoDocumento === 'ContratoLocacao' ? 'Contrato Locação' : 
                             docData.tipoDocumento === 'ReciboLocatario' ? 'Recibo Inquilino' :
                             docData.tipoDocumento === 'ReciboLocador' ? 'Recibo Locador' :
                             docData.tipoDocumento === 'ReciboComissao' ? 'Recibo Comissão' : 'Recibo Personalizado'}
                          </span>
                          <span className="text-[8px] text-stone-400 uppercase font-bold mt-0.5">Criado por: {docData.criadoPorEmail || 'RB'}</span>
                        </div>
                      </td>

                      {/* Code imovel */}
                      <td className="p-4 font-extrabold text-stone-800">
                        {docData.codigoImovel || 'SEM ATRELAR'}
                      </td>

                      {/* Title description of imovel */}
                      <td className="p-4 max-w-xs truncate">
                        <div className="font-bold text-stone-800">{docData.dadosImovel?.titulo || 'Manual ou Recibo'}</div>
                        <div className="text-[9px] text-stone-400 mt-0.5 truncate">{docData.dadosImovel?.endereco || ''}</div>
                      </td>

                      {/* Principal Client */}
                      <td className="p-4">
                        <span className="font-black text-stone-800 uppercase text-[9.5px] block">{clientName}</span>
                        {docData.dadosComprador?.cpfCnpj || docData.dadosLocatario?.cpfCnpj ? (
                          <span className="text-[8.5px] text-stone-400 block mt-0.5">CPF: {docData.dadosComprador?.cpfCnpj || docData.dadosLocatario?.cpfCnpj}</span>
                        ) : null}
                      </td>

                      {/* Price tag */}
                      <td className="p-4 font-black text-stone-900 text-right">
                        {formatCurrencyBR(displayValue)}
                      </td>

                      {/* Status design */}
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border uppercase tracking-wider ${getStatusStyle(docData.status)}`}>
                          {docData.status || 'Rascunho'}
                        </span>
                      </td>

                      {/* Created date */}
                      <td className="p-4 text-stone-500 font-bold">
                        {docData.dataDocumento || 'Fevereiro'}
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {/* Visualizar */}
                          <button 
                            onClick={() => setPreviewDoc(docData)}
                            className="p-1 px-1.5 bg-neutral-100 hover:bg-neutral-200 rounded text-stone-800 transition shadow-xs cursor-pointer"
                            title="Visualizar Informações"
                          >
                            <Eye size={12} />
                          </button>

                          {/* Re-gerar PDF localmente */}
                          <button 
                            onClick={() => exportDocToPDF(docData)}
                            className="p-1 px-1.5 bg-neutral-100 hover:bg-neutral-200 rounded text-stone-800 transition shadow-xs cursor-pointer"
                            title="Baixar PDF Oficial"
                          >
                            <Download size={12} />
                          </button>

                          {/* Duplicar doc */}
                          <button 
                            onClick={() => handleDuplicate(docData)}
                            className="p-1 px-1.5 bg-neutral-100 hover:bg-neutral-200 rounded text-stone-800 transition shadow-xs cursor-pointer"
                            title="Duplicar Termo"
                          >
                            <Copy size={12} />
                          </button>

                          <div className="w-[1px] h-3.5 bg-stone-200 mx-0.5"></div>

                          {/* Cancelar status */}
                          <button 
                            onClick={() => handleCancelStatus(docData.id)}
                            className="p-1 px-1.5 bg-stone-100 hover:bg-stone-200 rounded text-amber-600 transition shadow-xs cursor-pointer"
                            title="Declarar Cancelado"
                          >
                            <Ban size={12} />
                          </button>

                          {/* Deletar doc */}
                          <button 
                            onClick={() => handleDelete(docData.id)}
                            className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition shadow-xs cursor-pointer"
                            title="Excluir Definitivo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* QUICK PREVIEW DRAWER/MODAL FOR SINGLE DOCUMENT */}
      {previewDoc && (
        <div className="fixed inset-0 bg-neutral-900/60 z-[120] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Header bar */}
            <div className="p-5 border-b border-stone-200 flex justify-between items-center bg-[#111111] text-white">
              <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
                <FileText size={16} className="text-[#F5B400]" /> Detalhes do Documento Lavrado
              </h3>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="text-stone-400 hover:text-white font-bold cursor-pointer transition text-xs uppercase"
              >
                Fechar ✕
              </button>
            </div>

            {/* Visual layout body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 border border-stone-100 p-4 rounded-xl bg-stone-100/50">
                <div>
                  <span className="text-[9px] text-stone-500 font-bold uppercase block">Categoria de Documentos</span>
                  <span className="font-extrabold text-xs text-stone-850 uppercase">{previewDoc.tipoDocumento}</span>
                </div>
                <div>
                  <span className="text-[9px] text-stone-500 font-bold uppercase block">Código Imóvel</span>
                  <span className="font-extrabold text-xs text-[#F5B400]">{previewDoc.codigoImovel || 'SEM ATRELAR'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-stone-500 font-bold uppercase block">Data de Emissão</span>
                  <span className="font-extrabold text-xs text-stone-850">{previewDoc.dataDocumento}</span>
                </div>
                <div>
                  <span className="text-[9px] text-stone-500 font-bold uppercase block">Criado por</span>
                  <span className="font-extrabold text-xs text-stone-850">{previewDoc.criadoPorEmail || 'RB'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-stone-500 font-bold uppercase block">Status Atual</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#111111]/5 border border-[#111111]/10 text-neutral-800 uppercase tracking-widest">{previewDoc.status}</span>
                </div>
              </div>

              {previewDoc.observacoesInternas && (
                <div>
                  <strong className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Observações Internas</strong>
                  <p className="p-3 bg-[#F5B400]/5 text-xs text-stone-800 rounded-lg border border-[#F5B400]/10 mt-1 font-semibold">{previewDoc.observacoesInternas}</p>
                </div>
              )}

              <div className="space-y-2">
                <strong className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Teor Integral do PDF Oficial</strong>
                <pre className="p-4 bg-neutral-900 text-stone-100 rounded-xl font-mono text-[10px] overflow-x-auto whitespace-pre-wrap max-h-72 leading-relaxed">
                  {previewDoc.textoFinal}
                </pre>
              </div>

            </div>

            {/* Footer controls */}
            <div className="p-4 bg-stone-50 border-t flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => exportDocToPDF(previewDoc)}
                className="px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-black uppercase rounded-lg flex items-center gap-1 transition"
              >
                <Download size={13} className="text-[#F5B400]" /> Exportar PDF
              </button>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="px-4 py-2 border text-stone-550 hover:bg-stone-100 text-xs font-bold uppercase rounded-lg transition"
              >
                Retornar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FULL-STAGE CREATION AND EDITING CONTRACT WIZARD MODAL */}
      {isWizardOpen && (
        <ContractWizard 
          onClose={() => setIsWizardOpen(false)}
          initialDocType={selectedDocType}
        />
      )}

    </div>
  );
};
