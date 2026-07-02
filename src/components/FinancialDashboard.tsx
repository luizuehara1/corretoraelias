import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  onSnapshot,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase'; // Reusing db from standard lib
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  User, 
  Home, 
  CheckCircle2, 
  X, 
  Loader2, 
  Download, 
  Printer, 
  Wallet, 
  RefreshCw, 
  FileText, 
  Check, 
  Trash2, 
  Edit2,
  CalendarDays,
  FileCheck,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CurrencyInput, formatNumberToCurrencyBR } from './CurrencyInput';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';

// Types & Interfaces
export interface FinanceiroEntry {
  id?: string;
  tipo: 'Entrada' | 'Saída' | 'Receita' | 'Despesa' | 'Gasto' | 'Comissão' | 'Repasse' | 'Ajuste';
  categoria: string;
  descricao: string;
  valor: number; // Absolute positive value
  value: number; // Signed value: positive for inputs, negative for outputs
  date: string; // YYYY-MM-DD
  dataCompetencia: string; // YYYY-MM
  dataVencimento: string; // YYYY-MM-DD
  formaPagamento: string;
  status: 'Pago' | 'Recebido' | 'Pendente' | 'Atrasado' | 'Cancelado';
  observacoes?: string;
  origem: 'manual' | 'venda' | 'locacao' | 'automatico';
  
  // Property Link
  imovelId?: string;
  codigoImovel?: string;
  tipoImovel?: string;
  bairroImovel?: string;
  cidadeImovel?: string;
  proprietarioNome?: string;
  
  // Broker Link
  corretorId?: string;
  corretorNome?: string;
  
  // Recurrence info
  recorrente?: boolean;
  periodicidade?: 'Mensal' | 'Quinzenal' | 'Semanal' | 'Anual';
  
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_CATEGORIES = [
  'Marketing',
  'Tráfego Pago',
  'Google Ads',
  'Meta Ads',
  'Fotógrafo',
  'Vídeo',
  'Portais Imobiliários',
  'Combustível',
  'Alimentação',
  'Energia',
  'Água',
  'Internet',
  'Telefone',
  'Material Escritório',
  'Contabilidade',
  'Jurídico',
  'Limpeza',
  'Manutenção',
  'Reforma',
  'IPTU',
  'Condomínio',
  'Cartório',
  'Outros'
];

export const FinancialDashboard: React.FC = () => {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'caixa' | 'entradas' | 'saidas' | 'gastos' | 'comissoes' | 'relatorios'>('dashboard');

  // Core financial state
  const [entries, setEntries] = useState<FinanceiroEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saldoInicial, setSaldoInicial] = useState<number>(10000); // Default, can be configured
  const [isEditingSaldo, setIsEditingSaldo] = useState<boolean>(false);
  const [saldoInputValue, setSaldoInputValue] = useState<string>('10000');

  // Custom categories list
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  // Dropdown lists
  const [properties, setProperties] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState<boolean>(false);
  const [brokersLoading, setBrokersLoading] = useState<boolean>(false);

  // Filters State
  const [filterProperty, setFilterProperty] = useState<string>('');
  const [filterBroker, setFilterBroker] = useState<string>('');
  const [filterProprietario, setFilterProprietario] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Launch modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formType, setFormType] = useState<'create' | 'edit'>('create');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Modal Form state
  const [tipo, setTipo] = useState<FinanceiroEntry['tipo']>('Entrada');
  const [categoria, setCategoria] = useState<string>('Marketing');
  const [descricao, setDescricao] = useState<string>('');
  const [valor, setValor] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formaPagamento, setFormaPagamento] = useState<string>('Pix');
  const [status, setStatus] = useState<FinanceiroEntry['status']>('Recebido');
  const [observacoes, setObservacoes] = useState<string>('');
  
  // Linkages
  const [linkedPropertyId, setLinkedPropertyId] = useState<string>('');
  const [linkedBrokerId, setLinkedBrokerId] = useState<string>('');

  // Recurrence
  const [recorrente, setRecorrente] = useState<boolean>(false);
  const [periodicidade, setPeriodicidade] = useState<'Mensal' | 'Quinzenal' | 'Semanal' | 'Anual'>('Mensal');
  const [recorrenciaParcelas, setRecorrenciaParcelas] = useState<number>(12);

  // Chart aggregation view (Dia, Semana, Mês, Ano)
  const [chartPeriod, setChartPeriod] = useState<'dia' | 'semana' | 'mes' | 'ano'>('mes');

  // Load core financial data and config
  useEffect(() => {
    setLoading(true);
    
    // Realtime listeners for "financeiro"
    const q = query(collection(db, 'financeiro'));
    const unsub = onSnapshot(q, (snapshot) => {
      const items: FinanceiroEntry[] = [];
      snapshot.forEach((docItem) => {
        const d = docItem.data();
        // Make sure we resolve values properly
        const val = Math.abs(d.valor || d.value || d.valorBase || 0);
        // Signed value
        let signedVal = d.value !== undefined ? d.value : d.valor || 0;
        
        // If it's a known negative type, sign it appropriately
        const outflowTypes = ['Saída', 'Despesa', 'Gasto', 'Repasse', 'Saida'];
        if (outflowTypes.includes(d.tipo) && signedVal > 0) {
          signedVal = -signedVal;
        }

        items.push({
          id: docItem.id,
          tipo: d.tipo || 'Ajuste',
          categoria: d.categoria || d.origem || 'Outros',
          descricao: d.descricao || d.descr || `Lançamento ${docItem.id}`,
          valor: val,
          value: signedVal,
          date: d.date || d.dataCompetencia || d.dataVencimento || d.dataVenda || new Date().toISOString().split('T')[0],
          dataCompetencia: d.dataCompetencia || (d.date ? d.date.substring(0, 7) : new Date().toISOString().substring(0, 7)),
          dataVencimento: d.dataVencimento || d.date || new Date().toISOString().split('T')[0],
          formaPagamento: d.formaPagamento || 'Pix',
          status: d.status || 'Pendente',
          observacoes: d.observacoes || d.obs || '',
          origem: d.origem || 'manual',
          imovelId: d.imovelId || '',
          codigoImovel: d.codigoImovel || '',
          tipoImovel: d.tipoImovel || d.imovelTipo || '',
          bairroImovel: d.bairroImovel || d.bairro || '',
          cidadeImovel: d.cidadeImovel || d.cidade || '',
          proprietarioNome: d.proprietarioNome || '',
          corretorId: d.corretorId || '',
          corretorNome: d.corretorNome || '',
          recorrente: d.recorrente || false,
          periodicidade: d.periodicidade || 'Mensal',
          createdAt: d.createdAt || d.criadoEm || '',
          updatedAt: d.updatedAt || d.atualizadoEm || ''
        });
      });

      // Sort by date desc
      items.sort((a, b) => b.date.localeCompare(a.date));
      setEntries(items);
      setLoading(false);
    }, (err) => {
      console.error("Error loading financeiro:", err);
      setLoading(false);
    });

    // Load initial saldo configuration from siteSettings if exists
    const loadInitialBalance = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'siteSettings', 'finance_config'));
        if (configDoc.exists()) {
          const s = configDoc.data().saldoInicial;
          if (s !== undefined) {
            setSaldoInicial(Number(s));
            setSaldoInputValue(String(s));
          }
        } else {
          // Sync default saldo
          await setDoc(doc(db, 'siteSettings', 'finance_config'), { saldoInicial: 10000 });
        }
      } catch (err) {
        console.warn("Could not load finance_config, using default", err);
      }
    };
    loadInitialBalance();

    // Load custom categories if stored
    const loadCustomCategories = async () => {
      try {
        const catDoc = await getDoc(doc(db, 'siteSettings', 'custom_categories'));
        if (catDoc.exists()) {
          setCustomCategories(catDoc.data().list || []);
        }
      } catch (err) {
        console.warn("Could not load custom categories:", err);
      }
    };
    loadCustomCategories();

    return () => {
      unsub();
    };
  }, []);

  // Fetch linked entities lists for selectors
  const loadLinkedEntities = async () => {
    setPropertiesLoading(true);
    setBrokersLoading(true);
    try {
      const snapProp = await getDocs(collection(db, "imoveis"));
      const listProp = snapProp.docs.map(d => ({ id: d.id, ...d.data() }));
      setProperties(listProp);
    } catch (e) {
      console.error("Error loading properties for finance:", e);
    } finally {
      setPropertiesLoading(false);
    }

    try {
      const snapBrok = await getDocs(collection(db, "corretores"));
      const listBrok = snapBrok.docs.map(d => ({ id: d.id, ...d.data() }));
      setBrokers(listBrok);
    } catch (e) {
      console.error("Error loading brokers for finance:", e);
    } finally {
      setBrokersLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      loadLinkedEntities();
    }
  }, [isModalOpen]);

  // Handle saving the Saldo Inicial
  const saveSaldoInicial = async () => {
    const numeric = Number(saldoInputValue) || 0;
    setSaldoInicial(numeric);
    setIsEditingSaldo(false);
    try {
      await setDoc(doc(db, 'siteSettings', 'finance_config'), { saldoInicial: numeric }, { merge: true });
    } catch (err) {
      console.error("Error saving initial balance:", err);
    }
  };

  // Add custom category
  const addCustomCategory = async () => {
    if (!newCategoryName.trim()) return;
    const cleanName = newCategoryName.trim();
    if (DEFAULT_CATEGORIES.includes(cleanName) || customCategories.includes(cleanName)) {
      alert("Categoria já existente!");
      return;
    }
    const updated = [...customCategories, cleanName];
    setCustomCategories(updated);
    setCategoria(cleanName);
    setNewCategoryName('');
    setShowAddCategoryModal(false);

    try {
      await setDoc(doc(db, 'siteSettings', 'custom_categories'), { list: updated }, { merge: true });
    } catch (err) {
      console.error("Error saving custom categories:", err);
    }
  };

  // Categories combined
  const allCategories = useMemo(() => {
    return [...DEFAULT_CATEGORIES, ...customCategories];
  }, [customCategories]);

  // Adjust status based on type
  useEffect(() => {
    const inflowTypes = ['Entrada', 'Receita', 'Comissão'];
    const outflowTypes = ['Saída', 'Despesa', 'Gasto', 'Repasse'];

    if (inflowTypes.includes(tipo)) {
      if (status === 'Pago') setStatus('Recebido');
    } else if (outflowTypes.includes(tipo)) {
      if (status === 'Recebido') setStatus('Pago');
    }
  }, [tipo]);

  // Core indicators calculations
  const totalInflows = useMemo(() => {
    return entries
      .filter(e => (e.status === 'Recebido' || e.status === 'Pago') && e.value >= 0)
      .reduce((sum, e) => sum + e.valor, 0);
  }, [entries]);

  const totalOutflows = useMemo(() => {
    return entries
      .filter(e => (e.status === 'Pago' || e.status === 'Recebido') && e.value < 0)
      .reduce((sum, e) => sum + e.valor, 0);
  }, [entries]);

  const saldoAtual = useMemo(() => {
    return saldoInicial + totalInflows - totalOutflows;
  }, [saldoInicial, totalInflows, totalOutflows]);

  // Dashboard Stats Calculations for the Current Month
  const currentMonthStr = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
  
  const currentMonthStats = useMemo(() => {
    const monthEntries = entries.filter(e => e.date.substring(0, 7) === currentMonthStr);
    
    const receitasNoMes = monthEntries
      .filter(e => (e.status === 'Recebido' || e.status === 'Pago') && e.value >= 0)
      .reduce((sum, e) => sum + e.valor, 0);

    const despesasNoMes = monthEntries
      .filter(e => (e.status === 'Pago' || e.status === 'Recebido') && e.value < 0)
      .reduce((sum, e) => sum + e.valor, 0);

    const lucroLiquido = receitasNoMes - despesasNoMes;

    const comissoesPendentes = entries
      .filter(e => e.status === 'Pendente' && (e.tipo === 'Comissão' || e.categoria.includes('Comissão') || e.categoria.includes('Comissao')))
      .reduce((sum, e) => sum + e.valor, 0);

    const comissoesRecebidas = entries
      .filter(e => (e.status === 'Recebido' || e.status === 'Pago') && (e.tipo === 'Comissão' || e.categoria.includes('Comissão') || e.categoria.includes('Comissao')))
      .reduce((sum, e) => sum + e.valor, 0);

    const gastosOperacionais = monthEntries
      .filter(e => (e.status === 'Pago' || e.status === 'Recebido') && (e.tipo === 'Gasto' || e.tipo === 'Despesa'))
      .reduce((sum, e) => sum + e.valor, 0);

    return {
      receitasNoMes,
      despesasNoMes,
      lucroLiquido,
      comissoesPendentes,
      comissoesRecebidas,
      gastosOperacionais
    };
  }, [entries, currentMonthStr]);

  // Filtering Logic
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      // Search text filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const descMatch = e.descricao.toLowerCase().includes(term);
        const catMatch = e.categoria.toLowerCase().includes(term);
        const propMatch = e.codigoImovel?.toLowerCase().includes(term) || e.proprietarioNome?.toLowerCase().includes(term);
        const brokMatch = e.corretorNome?.toLowerCase().includes(term);
        if (!descMatch && !catMatch && !propMatch && !brokMatch) return false;
      }

      // Tab sub filters
      if (activeSubTab === 'entradas' && e.value < 0) return false;
      if (activeSubTab === 'saidas' && e.value >= 0) return false;
      if (activeSubTab === 'gastos' && e.tipo !== 'Gasto' && e.tipo !== 'Despesa') return false;
      if (activeSubTab === 'comissoes' && e.tipo !== 'Comissão' && !e.categoria.includes('Comissão') && !e.categoria.includes('Comissao')) return false;

      // Advanced filters
      if (filterProperty && e.imovelId !== filterProperty) return false;
      if (filterBroker && e.corretorId !== filterBroker) return false;
      if (filterProprietario && !e.proprietarioNome?.toLowerCase().includes(filterProprietario.toLowerCase())) return false;
      if (filterCategory && e.categoria !== filterCategory) return false;
      if (filterType && e.tipo !== filterType) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      if (filterDateStart && e.date < filterDateStart) return false;
      if (filterDateEnd && e.date > filterDateEnd) return false;

      return true;
    });
  }, [entries, activeSubTab, searchTerm, filterProperty, filterBroker, filterProprietario, filterCategory, filterType, filterStatus, filterDateStart, filterDateEnd]);

  // Chart aggregation for Recharts
  const chartData = useMemo(() => {
    const dataMap: { [key: string]: { dateLabel: string; Entradas: number; Saídas: number } } = {};

    entries.forEach(e => {
      if (e.status !== 'Recebido' && e.status !== 'Pago') return; // Only process settled/paid entries

      let key = '';
      let label = '';

      if (chartPeriod === 'dia') {
        key = e.date; // YYYY-MM-DD
        label = e.date.split('-').reverse().slice(0, 2).join('/'); // DD/MM
      } else if (chartPeriod === 'semana') {
        // Calculate week of year approximation
        const d = new Date(e.date);
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${weekNum}`;
        label = `Sem. ${weekNum}`;
      } else if (chartPeriod === 'mes') {
        key = e.date.substring(0, 7); // YYYY-MM
        label = e.date.substring(5, 7) + '/' + e.date.substring(2, 4); // MM/YY
      } else if (chartPeriod === 'ano') {
        key = e.date.substring(0, 4); // YYYY
        label = key;
      }

      if (!dataMap[key]) {
        dataMap[key] = { dateLabel: label, Entradas: 0, Saídas: 0 };
      }

      if (e.value >= 0) {
        dataMap[key].Entradas += e.valor;
      } else {
        dataMap[key].Saídas += e.valor;
      }
    });

    // Convert map to array and sort by key asc
    const sortedData = Object.keys(dataMap)
      .sort((a, b) => a.localeCompare(b))
      .map(k => dataMap[k]);

    // Limit elements for better readability
    if (chartPeriod === 'dia') return sortedData.slice(-10);
    if (chartPeriod === 'semana') return sortedData.slice(-8);
    if (chartPeriod === 'mes') return sortedData.slice(-12);
    return sortedData;
  }, [entries, chartPeriod]);

  // Handle entry deletion
  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm("Tem certeza de que deseja excluir este lançamento financeiro permanentemente?")) return;
    try {
      await deleteDoc(doc(db, 'financeiro', id));
    } catch (e) {
      console.error("Error deleting financial entry:", e);
      alert("Erro ao excluir o lançamento.");
    }
  };

  // Toggle Conciliation status (Pago/Recebido)
  const handleToggleConciliation = async (entry: FinanceiroEntry) => {
    let nextStatus: FinanceiroEntry['status'] = 'Pendente';
    if (entry.status === 'Pendente' || entry.status === 'Atrasado') {
      nextStatus = entry.value >= 0 ? 'Recebido' : 'Pago';
    } else {
      nextStatus = 'Pendente';
    }

    try {
      await updateDoc(doc(db, 'financeiro', entry.id!), {
        status: nextStatus,
        dataPagamento: nextStatus !== 'Pendente' ? new Date().toISOString().split('T')[0] : null,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error updating conciliation status:", e);
      alert("Erro ao conciliar lançamento.");
    }
  };

  // Trigger Edit modal
  const handleTriggerEdit = (entry: FinanceiroEntry) => {
    setSelectedEntryId(entry.id || null);
    setFormType('edit');
    setTipo(entry.tipo);
    setCategoria(entry.categoria);
    setDescricao(entry.descricao);
    setValor(entry.valor);
    setDate(entry.date);
    setFormaPagamento(entry.formaPagamento);
    setStatus(entry.status);
    setObservacoes(entry.observacoes || '');
    setLinkedPropertyId(entry.imovelId || '');
    setLinkedBrokerId(entry.corretorId || '');
    setRecorrente(false); // Do not cascade edits to recurrence by default
    setIsModalOpen(true);
  };

  // Trigger Create modal
  const handleTriggerCreate = () => {
    setSelectedEntryId(null);
    setFormType('create');
    setTipo('Entrada');
    setCategoria('Marketing');
    setDescricao('');
    setValor(0);
    setDate(new Date().toISOString().split('T')[0]);
    setFormaPagamento('Pix');
    setStatus('Recebido');
    setObservacoes('');
    setLinkedPropertyId('');
    setLinkedBrokerId('');
    setRecorrente(false);
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      alert("Digite uma descrição válida.");
      return;
    }
    if (valor <= 0) {
      alert("Digite um valor válido maior que zero.");
      return;
    }

    // Determine signed value
    const outflowTypes = ['Saída', 'Despesa', 'Gasto', 'Repasse'];
    const isOutflow = outflowTypes.includes(tipo);
    const signedValue = isOutflow ? -valor : valor;

    // Fetch linked objects details
    const selectedPropObj = properties.find(p => p.id === linkedPropertyId);
    const selectedBrokObj = brokers.find(b => b.id === linkedBrokerId);

    const payload: Partial<FinanceiroEntry> = {
      tipo,
      categoria,
      descricao,
      valor,
      value: signedValue,
      date,
      dataCompetencia: date.substring(0, 7),
      dataVencimento: date,
      formaPagamento,
      status,
      observacoes,
      origem: 'manual',
      imovelId: linkedPropertyId || '',
      codigoImovel: selectedPropObj ? (selectedPropObj.codigoImovel || selectedPropObj.codigo || '') : '',
      tipoImovel: selectedPropObj ? (selectedPropObj.type || '') : '',
      bairroImovel: selectedPropObj ? (selectedPropObj.neighborhood || selectedPropObj.bairro || '') : '',
      cidadeImovel: selectedPropObj ? (selectedPropObj.city || '') : '',
      proprietarioNome: selectedPropObj ? (selectedPropObj.emailProprietario?.split('@')[0] || selectedPropObj.proprietarioNome || 'Proprietário') : '',
      corretorId: linkedBrokerId || '',
      corretorNome: selectedBrokObj ? (selectedBrokObj.nome || '') : '',
      recorrente,
      periodicidade: recorrente ? periodicidade : undefined,
      updatedAt: new Date().toISOString()
    };

    try {
      if (formType === 'edit' && selectedEntryId) {
        await updateDoc(doc(db, 'financeiro', selectedEntryId), payload);
        alert("Lançamento atualizado com sucesso!");
      } else {
        // Create standard launch
        payload.createdAt = new Date().toISOString();
        const mainDocRef = await addDoc(collection(db, 'financeiro'), payload);

        // Manage Recurrences!
        if (recorrente && recorrenciaParcelas > 1) {
          const baseDate = new Date(date + 'T12:00:00'); // Prevent timezone offset
          
          for (let i = 1; i < recorrenciaParcelas; i++) {
            let nextDate = new Date(baseDate);
            
            if (periodicidade === 'Semanal') {
              nextDate.setDate(baseDate.getDate() + (i * 7));
            } else if (periodicidade === 'Quinzenal') {
              nextDate.setDate(baseDate.getDate() + (i * 15));
            } else if (periodicidade === 'Mensal') {
              nextDate.setMonth(baseDate.getMonth() + i);
            } else if (periodicidade === 'Anual') {
              nextDate.setFullYear(baseDate.getFullYear() + i);
            }

            const formattedNextDate = nextDate.toISOString().split('T')[0];
            const nextPayload = {
              ...payload,
              date: formattedNextDate,
              dataCompetencia: formattedNextDate.substring(0, 7),
              dataVencimento: formattedNextDate,
              descricao: `${descricao} (${i + 1}/${recorrenciaParcelas})`,
              status: 'Pendente' as const, // Future entries are created as pending
              createdAt: new Date().toISOString()
            };
            
            await addDoc(collection(db, 'financeiro'), nextPayload);
          }
          alert(`Lançamento principal e mais ${recorrenciaParcelas - 1} parcelas recorrentes criadas com sucesso!`);
        } else {
          alert("Lançamento manual criado com sucesso!");
        }
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error saving finance record:", e);
      alert("Erro ao gravar lançamento financeiro.");
    }
  };

  // Print Table/Report function
  const handlePrintReport = () => {
    window.print();
  };

  // Export CSV function
  const handleExportCSV = () => {
    const headers = ["Data", "Tipo", "Categoria", "Descrição", "Valor", "Status", "Forma Pagamento", "Imóvel", "Corretor", "Observações"];
    const rows = filteredEntries.map(e => [
      e.date.split('-').reverse().join('/'),
      e.tipo,
      e.categoria,
      e.descricao,
      formatNumberToCurrencyBR(e.valor),
      e.status,
      e.formaPagamento,
      e.codigoImovel || 'N/A',
      e.corretorNome || 'N/A',
      e.observacoes || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(";"), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_Financeiro_RB_Sorocaba_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION & TOP CASH PANEL */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 border border-stone-800 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5B400]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#F5B400] rounded-full animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-widest text-[#F5B400]">
                RB SOROCABA NEGÓCIOS IMOBILIÁRIOS
              </h3>
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white mt-1">
              GESTÃO INTEGRADA FINANCEIRA & DE CAIXA
            </h2>
            <p className="text-[11px] text-stone-400 font-bold uppercase mt-1 tracking-widest">
              Contabilidade de alta renda, conciliação e fluxo corporativo
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerCreate}
              className="px-5 py-3.5 bg-[#F5B400] hover:bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl transition duration-300 shadow-md flex items-center gap-2 cursor-pointer border border-[#F5B400]"
            >
              <Plus size={14} className="stroke-[3]" />
              Novo Lançamento
            </button>
          </div>
        </div>

        {/* CONTROLE DE CAIXA - INDICATOR PANEL */}
        <div className="mt-8 pt-6 border-t border-stone-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {/* Saldo Inicial Configurable */}
          <div className="bg-stone-900/50 border border-stone-800 p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1">
              Saldo Inicial
              <Info size={10} className="text-stone-500" title="Saldo de abertura do caixa no período" />
            </span>
            {isEditingSaldo ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-white outline-none focus:border-[#F5B400]"
                  value={saldoInputValue}
                  onChange={(e) => setSaldoInputValue(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={saveSaldoInicial}
                  className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition"
                  title="Salvar Saldo Inicial"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setSaldoInputValue(String(saldoInicial));
                    setIsEditingSaldo(false);
                  }}
                  className="p-1 bg-rose-500 text-white rounded hover:bg-rose-600 transition"
                  title="Cancelar"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm md:text-lg font-black font-mono text-stone-200">
                  {formatNumberToCurrencyBR(saldoInicial)}
                </p>
                <button
                  onClick={() => setIsEditingSaldo(true)}
                  className="text-[9px] font-black uppercase tracking-wider text-[#F5B400] hover:text-white cursor-pointer transition"
                >
                  [ Ajustar ]
                </button>
              </div>
            )}
          </div>

          {/* Plus sign representation */}
          <div className="bg-stone-900/50 border border-stone-800 p-4 rounded-2xl flex flex-col justify-between relative">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-400" />
              (+) Entradas Totais
            </span>
            <p className="text-sm md:text-lg font-black font-mono text-emerald-400 mt-2">
              {formatNumberToCurrencyBR(totalInflows)}
            </p>
          </div>

          {/* Minus sign representation */}
          <div className="bg-stone-900/50 border border-stone-800 p-4 rounded-2xl flex flex-col justify-between relative">
            <span className="text-[9px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <TrendingDown size={12} className="text-rose-400" />
              (-) Saídas Totais
            </span>
            <p className="text-sm md:text-lg font-black font-mono text-rose-400 mt-2">
              {formatNumberToCurrencyBR(totalOutflows)}
            </p>
          </div>

          {/* Equal sign representation */}
          <div className="bg-[#F5B400]/10 border border-[#F5B400]/30 p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#F5B400] flex items-center gap-1">
              <Wallet size={12} className="text-[#F5B400]" />
              (=) Saldo Atual em Caixa
            </span>
            <p className="text-sm md:text-xl font-black font-mono text-[#F5B400] mt-2">
              {formatNumberToCurrencyBR(saldoAtual)}
            </p>
          </div>
        </div>
      </div>

      {/* SUB-TABS INTERFACE */}
      <div className="border-b border-stone-100 flex flex-wrap gap-1">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'caixa', label: 'Livro Caixa' },
          { id: 'entradas', label: 'Entradas' },
          { id: 'saidas', label: 'Saídas' },
          { id: 'gastos', label: 'Gastos' },
          { id: 'comissoes', label: 'Comissões' },
          { id: 'relatorios', label: 'Relatórios' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
              activeSubTab === tab.id
                ? 'border-[#F5B400] text-stone-900 font-extrabold bg-[#F5B400]/5'
                : 'border-transparent text-stone-400 hover:text-stone-700 hover:border-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD SUB-TAB */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* STATS BENTO-GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'Receitas (Mês)', val: formatNumberToCurrencyBR(currentMonthStats.receitasNoMes), desc: 'Recebidos do mês', color: 'text-stone-950 border-l-stone-900' },
              { label: 'Despesas (Mês)', val: formatNumberToCurrencyBR(currentMonthStats.despesasNoMes), desc: 'Pagos do mês', color: 'text-rose-600 border-l-rose-500' },
              { label: 'Lucro Líquido', val: formatNumberToCurrencyBR(currentMonthStats.lucroLiquido), desc: 'Resultado operacional', color: currentMonthStats.lucroLiquido >= 0 ? 'text-emerald-600 border-l-emerald-500' : 'text-rose-600 border-l-rose-500' },
              { label: 'Comissões Pendentes', val: formatNumberToCurrencyBR(currentMonthStats.comissoesPendentes), desc: 'Aguardando liberação', color: 'text-amber-600 border-l-amber-500' },
              { label: 'Comissões Recebidas', val: formatNumberToCurrencyBR(currentMonthStats.comissoesRecebidas), desc: 'Acumulado histórico', color: 'text-stone-800 border-l-stone-600' },
              { label: 'Gastos Operacionais', val: formatNumberToCurrencyBR(currentMonthStats.gastosOperacionais), desc: 'Gasto operacional do mês', color: 'text-slate-600 border-l-slate-400' }
            ].map((card, i) => (
              <div key={i} className="bg-white border border-[#EFEFEA] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <span className={`text-[8px] font-black text-stone-400 uppercase tracking-widest pl-1 leading-none block border-l-2 ${card.color.split(' ').pop()}`}>
                  {card.label}
                </span>
                <p className={`text-sm md:text-base font-black font-mono leading-none mt-3 tracking-tight ${card.color.split(' ')[0]}`}>
                  {card.val}
                </p>
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wide mt-2 italic">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>

          {/* FLUXO DE CAIXA CHART CONTAINER */}
          <div className="bg-white border border-[#EFEFEA] rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-50 pb-4 mb-6">
              <div>
                <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest">
                  Gráfico de Fluxo de Caixa (Entradas vs Saídas Liquidadas)
                </h4>
                <p className="text-[10px] text-stone-400 font-bold uppercase mt-0.5">Indicador dinâmico real-time integrado à contabilidade</p>
              </div>

              {/* Aggregation Select */}
              <div className="flex bg-stone-100 rounded-xl p-1 border border-stone-200">
                {(['dia', 'semana', 'mes', 'ano'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      chartPeriod === period
                        ? 'bg-white text-stone-900 shadow-sm font-black'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-stone-400 text-xs italic gap-2">
                <TrendingUp size={24} className="text-stone-300" />
                Sem movimentações financeiras liquidadas o suficiente para plotar gráficos.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F0" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#787880" />
                    <YAxis tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#787880" />
                    <Tooltip 
                      contentStyle={{ background: '#1c1917', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      formatter={(val: number) => [formatNumberToCurrencyBR(val), '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} name="Entradas (PIX/Dinheiro/Boleto)" />
                    <Bar dataKey="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Saídas (Despesas/Repasses/Gastos)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FILTER PANEL (Visible on non-dashboard tabs) */}
      {activeSubTab !== 'dashboard' && (
        <div className="bg-stone-50/50 border border-[#EFEFEA] p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-stone-200/50 pb-2">
            <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest flex items-center gap-1.5">
              <Filter size={12} className="text-amber-500" />
              Painel de Filtros Avançados
            </span>
            {(filterProperty || filterBroker || filterProprietario || filterCategory || filterType || filterStatus || filterDateStart || filterDateEnd || searchTerm) && (
              <button 
                onClick={() => {
                  setFilterProperty('');
                  setFilterBroker('');
                  setFilterProprietario('');
                  setFilterCategory('');
                  setFilterType('');
                  setFilterStatus('');
                  setFilterDateStart('');
                  setFilterDateEnd('');
                  setSearchTerm('');
                }}
                className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-700 tracking-wider cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Search size={12} />
              </span>
              <input
                type="text"
                placeholder="Pesquisar descrição/código..."
                className="w-full bg-white border border-[#EFEFEA] rounded-xl pl-8 pr-3 py-2 text-[10px] font-bold text-stone-900 outline-none focus:border-amber-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <select
              className="bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-[10px] font-bold text-stone-700 outline-none focus:border-amber-500"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="">Filtrar por Tipo</option>
              {['Entrada', 'Saída', 'Receita', 'Despesa', 'Gasto', 'Comissão', 'Repasse', 'Ajuste'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-[10px] font-bold text-stone-700 outline-none focus:border-amber-500"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">Filtrar por Status</option>
              {['Pago', 'Recebido', 'Pendente', 'Atrasado', 'Cancelado'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              className="bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-[10px] font-bold text-stone-700 outline-none focus:border-amber-500"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">Filtrar por Categoria</option>
              {allCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Date Start */}
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase text-stone-400 pl-1">Data Inicial</span>
              <input
                type="date"
                className="bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-[10px] font-bold text-stone-700 outline-none focus:border-amber-500"
                value={filterDateStart}
                onChange={e => setFilterDateStart(e.target.value)}
              />
            </div>

            {/* Date End */}
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase text-stone-400 pl-1">Data Final</span>
              <input
                type="date"
                className="bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-[10px] font-bold text-stone-700 outline-none focus:border-amber-500"
                value={filterDateEnd}
                onChange={e => setFilterDateEnd(e.target.value)}
              />
            </div>

            {/* Owner Filter */}
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase text-stone-400 pl-1">Proprietário</span>
              <input
                type="text"
                placeholder="Nome do Proprietário..."
                className="bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-[10px] font-bold text-stone-700 outline-none focus:border-amber-500"
                value={filterProprietario}
                onChange={e => setFilterProprietario(e.target.value)}
              />
            </div>

            {/* Reset / Status view */}
            <div className="flex items-end justify-end">
              <div className="text-[9px] font-black uppercase text-stone-400 tracking-wider">
                Exibindo: <span className="text-stone-800">{filteredEntries.length} lançamentos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED LEDGER / LIST TAB */}
      {activeSubTab !== 'dashboard' && activeSubTab !== 'relatorios' && (
        <div className="bg-white border border-[#EFEFEA] rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <div>
              <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest">
                {activeSubTab === 'caixa' && 'Extrato Geral do Livro Caixa'}
                {activeSubTab === 'entradas' && 'Controle Detalhado de Entradas'}
                {activeSubTab === 'saidas' && 'Controle Detalhado de Saídas'}
                {activeSubTab === 'gastos' && 'Controle de Gastos e Despesas'}
                {activeSubTab === 'comissoes' && 'Controle de Comissões Pagas / Recebidas'}
              </h4>
              <p className="text-[9px] text-stone-400 font-bold uppercase mt-0.5">Clique nos botões de ação para alterar status ou excluir</p>
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center text-stone-400 text-xs">
              <Loader2 size={24} className="animate-spin text-amber-500 mx-auto mb-2" />
              Sincronizando livro caixa com o Firestore...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-24 text-center text-stone-400 text-xs italic space-y-2">
              <Info size={32} className="mx-auto text-stone-200" />
              <p>Nenhum lançamento financeiro corresponde aos filtros atuais.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead>
                  <tr className="border-b border-stone-100 text-[9px] text-stone-400 font-black uppercase tracking-widest">
                    <th className="pb-3 text-left">Data</th>
                    <th className="pb-3 text-left">Tipo</th>
                    <th className="pb-3 text-left">Categoria</th>
                    <th className="pb-3 text-left">Descrição</th>
                    <th className="pb-3 text-left">Vínculo</th>
                    <th className="pb-3 text-right">Valor</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 pt-2 font-medium">
                  {filteredEntries.map((entry) => {
                    const isOutflow = entry.value < 0;
                    return (
                      <tr key={entry.id} className="hover:bg-stone-50/50 group transition duration-150">
                        <td className="py-4 font-bold text-stone-900">
                          {entry.date.split('-').reverse().join('/')}
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-[6px] text-[8px] font-black uppercase tracking-widest ${
                            isOutflow ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {entry.tipo}
                          </span>
                        </td>
                        <td className="py-4 text-stone-800 font-bold uppercase text-[9px] tracking-wide">
                          {entry.categoria}
                        </td>
                        <td className="py-4 max-w-[180px] truncate pr-2 text-stone-600" title={entry.descricao}>
                          {entry.descricao}
                        </td>
                        <td className="py-4 text-[10px]">
                          {entry.codigoImovel && (
                            <div className="flex items-center gap-1 text-stone-500">
                              <Home size={10} className="text-stone-400 shrink-0" />
                              <span className="font-bold text-stone-700">{entry.codigoImovel}</span>
                            </div>
                          )}
                          {entry.corretorNome && (
                            <div className="flex items-center gap-1 text-stone-400 mt-0.5">
                              <User size={10} className="text-stone-400 shrink-0" />
                              <span className="truncate max-w-[80px]" title={entry.corretorNome}>{entry.corretorNome}</span>
                            </div>
                          )}
                          {!entry.codigoImovel && !entry.corretorNome && (
                            <span className="text-stone-300 italic">Lançamento Geral</span>
                          )}
                        </td>
                        <td className={`py-4 text-right font-bold font-mono text-xs ${
                          isOutflow ? 'text-rose-500' : 'text-stone-900'
                        }`}>
                          {isOutflow ? '-' : '+'}{formatNumberToCurrencyBR(entry.valor)}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-[8px] text-[8px] font-black uppercase tracking-widest ${
                            entry.status === 'Pago' || entry.status === 'Recebido'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : entry.status === 'Pendente'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* Conciliation Switch Action */}
                            <button
                              onClick={() => handleToggleConciliation(entry)}
                              className={`p-1.5 rounded-lg transition-all border cursor-pointer ${
                                entry.status === 'Pago' || entry.status === 'Recebido'
                                  ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-stone-100 hover:text-emerald-500'
                                  : 'bg-white text-stone-400 border-stone-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                              }`}
                              title={entry.status === 'Pago' || entry.status === 'Recebido' ? "Marcar como Pendente" : isOutflow ? "Marcar como Pago" : "Marcar como Recebido"}
                            >
                              <CheckCircle2 size={12} />
                            </button>

                            {/* Edit Action */}
                            <button
                              onClick={() => handleTriggerEdit(entry)}
                              className="p-1.5 bg-white text-stone-600 border border-stone-200 hover:bg-amber-50 hover:text-amber-500 hover:border-amber-200 rounded-lg transition cursor-pointer"
                              title="Editar Lançamento"
                            >
                              <Edit2 size={12} />
                            </button>

                            {/* Delete Action */}
                            <button
                              onClick={() => handleDeleteEntry(entry.id!)}
                              className="p-1.5 bg-white text-rose-500 border border-stone-200 hover:bg-rose-50 hover:border-rose-200 rounded-lg transition cursor-pointer"
                              title="Excluir Lançamento"
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
      )}

      {/* RELATÓRIOS TAB VIEW */}
      {activeSubTab === 'relatorios' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#EFEFEA] rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-50 pb-4">
              <div>
                <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest">
                  Centro de Custos e Fechamento Contábil
                </h4>
                <p className="text-[10px] text-stone-400 font-bold uppercase mt-0.5">Relatório consolidado para exportação e faturamento fiscal</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-stone-200 transition"
                >
                  <Download size={13} />
                  Exportar CSV
                </button>
                <button
                  onClick={handlePrintReport}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-stone-950 transition"
                >
                  <Printer size={13} />
                  Imprimir / PDF
                </button>
              </div>
            </div>

            {/* Summary details table by Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category summary */}
              <div className="border border-stone-150 rounded-2xl p-4 bg-stone-50/50">
                <h5 className="text-[10px] font-black text-stone-900 uppercase tracking-wider mb-3 pb-1 border-b border-stone-200">
                  Resumo por Categorias de Caixa
                </h5>
                <div className="space-y-2 text-xs">
                  {allCategories.map(cat => {
                    const matched = entries.filter(e => e.categoria === cat && (e.status === 'Pago' || e.status === 'Recebido'));
                    if (matched.length === 0) return null;
                    const totalCat = matched.reduce((sum, e) => sum + (e.value), 0);
                    return (
                      <div key={cat} className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="font-bold text-stone-600 uppercase text-[10px]">{cat}</span>
                        <span className={`font-mono font-bold ${totalCat < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                          {totalCat < 0 ? '-' : '+'}{formatNumberToCurrencyBR(Math.abs(totalCat))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status summary */}
              <div className="border border-stone-150 rounded-2xl p-4 bg-stone-50/50">
                <h5 className="text-[10px] font-black text-stone-900 uppercase tracking-wider mb-3 pb-1 border-b border-stone-200">
                  Demonstrativo por Status Contábil
                </h5>
                <div className="space-y-2 text-xs">
                  {['Pago', 'Recebido', 'Pendente', 'Atrasado', 'Cancelado'].map(st => {
                    const matched = entries.filter(e => e.status === st);
                    if (matched.length === 0) return null;
                    const totalSt = matched.reduce((sum, e) => sum + e.valor, 0);
                    return (
                      <div key={st} className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="font-bold text-stone-600 uppercase text-[10px]">{st}</span>
                        <span className="font-mono font-bold text-stone-800">
                          {formatNumberToCurrencyBR(totalSt)} ({matched.length} lançamentos)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* List for printable layout */}
            <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
              <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-stone-700 tracking-wider">
                  Fechamento Consolidado do Período
                </span>
                <span className="text-[9px] font-mono text-stone-400">
                  {filteredEntries.length} itens listados
                </span>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead>
                    <tr className="border-b border-stone-200 text-[9px] text-stone-400 font-black uppercase tracking-widest">
                      <th className="pb-2">Data</th>
                      <th className="pb-2">Tipo</th>
                      <th className="pb-2">Categoria</th>
                      <th className="pb-2">Descrição</th>
                      <th className="pb-2">Imóvel</th>
                      <th className="pb-2">Forma Pag.</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map(e => (
                      <tr key={e.id} className="border-b border-stone-100 text-[11px] font-medium">
                        <td className="py-2.5 font-bold">{e.date.split('-').reverse().join('/')}</td>
                        <td className="py-2.5 uppercase text-[9px]">{e.tipo}</td>
                        <td className="py-2.5 font-bold uppercase text-[9px]">{e.categoria}</td>
                        <td className="py-2.5 truncate max-w-[150px]">{e.descricao}</td>
                        <td className="py-2.5">{e.codigoImovel || 'N/A'}</td>
                        <td className="py-2.5">{e.formaPagamento}</td>
                        <td className="py-2.5 uppercase text-[9px]">{e.status}</td>
                        <td className={`py-2.5 text-right font-mono font-bold ${e.value < 0 ? 'text-rose-500' : 'text-stone-900'}`}>
                          {e.value < 0 ? '-' : '+'}{formatNumberToCurrencyBR(e.valor)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-stone-50 text-stone-900 font-bold text-xs">
                      <td colSpan={7} className="py-3 text-right">Resultado das Transações Filtradas:</td>
                      <td className={`py-3 text-right font-mono font-black ${filteredEntries.reduce((sum, e) => sum + e.value, 0) < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {filteredEntries.reduce((sum, e) => sum + e.value, 0) < 0 ? '-' : '+'}{formatNumberToCurrencyBR(Math.abs(filteredEntries.reduce((sum, e) => sum + e.value, 0)))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAUNCH MODAL (NOVO LANÇAMENTO) */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1400] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden text-stone-900 flex flex-col my-8"
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-stone-950 to-stone-900 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#F5B400]">
                    RB SOROCABA NEGÓCIOS IMOBILIÁRIOS
                  </h3>
                  <h4 className="text-sm font-black uppercase tracking-wider text-white mt-1">
                    {formType === 'create' ? 'Novo Lançamento Manual de Caixa' : 'Editar Lançamento Contábil'}
                  </h4>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-stone-400 hover:text-white transition p-1.5 bg-stone-800 rounded-full cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmitForm} className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de Lançamento */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">
                      Tipo de Lançamento *
                    </label>
                    <select
                      className="w-full bg-stone-50 border border-[#EFEFEA] focus:bg-white focus:border-amber-500 outline-none rounded-xl px-3.5 py-3 text-xs font-bold text-stone-800 transition-all"
                      value={tipo}
                      onChange={e => setTipo(e.target.value as any)}
                      required
                    >
                      {['Entrada', 'Saída', 'Receita', 'Despesa', 'Gasto', 'Comissão', 'Repasse', 'Ajuste'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Categoria */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center pr-1">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">
                        Categoria de Gasto/Receita *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddCategoryModal(true)}
                        className="text-[9px] font-black uppercase text-[#F5B400] hover:text-stone-950 transition cursor-pointer"
                      >
                        + Criar Personalizada
                      </button>
                    </div>
                    <select
                      className="w-full bg-stone-50 border border-[#EFEFEA] focus:bg-white focus:border-amber-500 outline-none rounded-xl px-3.5 py-3 text-xs font-bold text-stone-800 transition-all"
                      value={categoria}
                      onChange={e => setCategoria(e.target.value)}
                      required
                    >
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-1.5 text-left md:col-span-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">
                      Descrição do Lançamento *
                    </label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-[#EFEFEA] focus:bg-white focus:border-amber-500 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all placeholder-stone-400"
                      placeholder="Ex: Gasto com fotógrafo do imóvel código 104, Comissão recebida venda, IPTU pago"
                      value={descricao}
                      onChange={e => setDescricao(e.target.value)}
                      required
                    />
                  </div>

                  {/* Valor (reusing formatted input handler) */}
                  <CurrencyInput
                    label="Valor do Lançamento (Absoluto)"
                    value={valor}
                    onChange={(data) => setValor(data.numericValue)}
                    required
                  />

                  {/* Data Competência */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">
                      Data *
                    </label>
                    <input
                      type="date"
                      className="w-full bg-stone-50 border border-[#EFEFEA] focus:bg-white focus:border-amber-500 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Forma de Pagamento */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">
                      Forma de Pagamento *
                    </label>
                    <select
                      className="w-full bg-stone-50 border border-[#EFEFEA] focus:bg-white focus:border-amber-500 outline-none rounded-xl px-3.5 py-3 text-xs font-bold text-stone-800 transition-all"
                      value={formaPagamento}
                      onChange={e => setFormaPagamento(e.target.value)}
                      required
                    >
                      {['Pix', 'Dinheiro', 'Transferência Bancária', 'Boleto Bancário', 'Cartão de Crédito', 'Cartão de Débito', 'Outro'].map(fp => (
                        <option key={fp} value={fp}>{fp}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">
                      Status de Lançamento *
                    </label>
                    <select
                      className="w-full bg-stone-50 border border-[#EFEFEA] focus:bg-white focus:border-amber-500 outline-none rounded-xl px-3.5 py-3 text-xs font-bold text-stone-800 transition-all"
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      required
                    >
                      {['Entrada', 'Receita', 'Comissão'].includes(tipo) ? (
                        <>
                          <option value="Recebido">Recebido (Liquidado)</option>
                          <option value="Pendente">Pendente (A receber)</option>
                          <option value="Atrasado">Atrasado</option>
                          <option value="Cancelado">Cancelado</option>
                        </>
                      ) : (
                        <>
                          <option value="Pago">Pago (Liquidado)</option>
                          <option value="Pendente">Pendente (A pagar)</option>
                          <option value="Atrasado">Atrasado</option>
                          <option value="Cancelado">Cancelado</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* VINCULO AO IMÓVEL */}
                <div className="bg-stone-50 p-4 border border-stone-200 rounded-2xl text-left space-y-3">
                  <span className="text-[10px] font-black text-stone-600 uppercase tracking-wider flex items-center gap-1">
                    <Home size={12} className="text-amber-500" />
                    Vincular a um Imóvel Ativo (Opcional)
                  </span>

                  <div className="space-y-2">
                    {propertiesLoading ? (
                      <p className="text-[10px] font-medium text-stone-400 animate-pulse">Buscando imóveis no Firestore...</p>
                    ) : (
                      <select
                        className="w-full bg-white border border-[#EFEFEA] rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-800 focus:border-amber-500 outline-none"
                        value={linkedPropertyId}
                        onChange={e => setLinkedPropertyId(e.target.value)}
                      >
                        <option value="">-- Selecione para vincular dados automaticamente --</option>
                        {properties.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.codigoImovel || p.codigo || p.id} - {p.title} ({p.neighborhood || p.bairro}, {p.city || 'Sorocaba'})
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Show pulled info */}
                    {linkedPropertyId && (() => {
                      const sel = properties.find(p => p.id === linkedPropertyId);
                      if (!sel) return null;
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-white p-3 border border-[#EFEFEA] rounded-xl text-[10px] text-stone-600 font-bold">
                          <div>
                            <span className="text-[8px] text-stone-400 block uppercase">Código</span>
                            <span className="text-stone-900">{sel.codigoImovel || sel.codigo || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-stone-400 block uppercase">Tipo</span>
                            <span className="text-stone-900 truncate block">{sel.type || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-stone-400 block uppercase">Bairro</span>
                            <span className="text-stone-900 truncate block">{sel.neighborhood || sel.bairro || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-stone-400 block uppercase">Cidade</span>
                            <span className="text-stone-900 truncate block">{sel.city || 'N/A'}</span>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-[8px] text-stone-400 block uppercase">Proprietário</span>
                            <span className="text-amber-600 truncate block font-black">{sel.emailProprietario?.split('@')[0] || sel.proprietarioNome || 'Geral'}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* VINCULO AO CORRETOR */}
                <div className="bg-stone-50 p-4 border border-stone-200 rounded-2xl text-left space-y-3">
                  <span className="text-[10px] font-black text-stone-600 uppercase tracking-wider flex items-center gap-1">
                    <User size={12} className="text-amber-500" />
                    Corretor Responsável (Opcional)
                  </span>

                  {brokersLoading ? (
                    <p className="text-[10px] font-medium text-stone-400 animate-pulse">Buscando corretores no Firestore...</p>
                  ) : (
                    <select
                      className="w-full bg-white border border-[#EFEFEA] rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-800 focus:border-amber-500 outline-none"
                      value={linkedBrokerId}
                      onChange={e => setLinkedBrokerId(e.target.value)}
                    >
                      <option value="">-- Escolha um corretor (Ex: Premiação, Comissão Paga) --</option>
                      {brokers.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.nome} {b.creci ? `(CRECI ${b.creci})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* LANÇAMENTOS RECORRENTES (ONLY ON CREATE FORM) */}
                {formType === 'create' && (
                  <div className="bg-amber-50/40 p-4 border border-amber-200/50 rounded-2xl text-left space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#A16207] uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        Lançamento Recorrente
                      </span>
                      <input
                        type="checkbox"
                        checked={recorrente}
                        onChange={e => setRecorrente(e.target.checked)}
                        className="w-4 h-4 rounded text-[#F5B400] outline-none cursor-pointer accent-[#F5B400]"
                      />
                    </div>

                    {recorrente && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 animate-fade-in">
                        <div className="space-y-1">
                          <span className="text-[8px] font-black uppercase text-stone-400 pl-1">Periodicidade</span>
                          <select
                            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-[#F5B400]"
                            value={periodicidade}
                            onChange={e => setPeriodicidade(e.target.value as any)}
                          >
                            <option value="Semanal">Semanal</option>
                            <option value="Quinzenal">Quinzenal</option>
                            <option value="Mensal">Mensal (Padrão)</option>
                            <option value="Anual">Anual</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[8px] font-black uppercase text-stone-400 pl-1">Número de Parcelas / Repetições</span>
                          <input
                            type="number"
                            min={2}
                            max={60}
                            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-800 outline-none focus:border-[#F5B400]"
                            value={recorrenciaParcelas}
                            onChange={e => setRecorrenciaParcelas(Math.min(60, Math.max(2, Number(e.target.value) || 2)))}
                          />
                          <p className="text-[9px] text-[#A16207]/70 font-bold uppercase mt-1 leading-tight">
                            Ex: Ao definir 12 parcelas mensais, os próximos 11 meses serão gerados pendentes automaticamente no sistema.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Observações */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">
                    Observações Adicionais
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-stone-50 border border-[#EFEFEA] focus:bg-white focus:border-amber-500 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all placeholder-stone-400"
                    placeholder="Notas, detalhes sobre faturamento contratual, recibos, etc."
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer"
                  >
                    cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#F5B400] hover:bg-black hover:text-[#F5B400] text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition duration-300 cursor-pointer border border-[#F5B400]"
                  >
                    {formType === 'create' ? 'Gravar Lançamento' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE CUSTOM CATEGORY MODAL */}
      <AnimatePresence>
        {showAddCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl relative text-stone-900">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-black font-extrabold text-xs cursor-pointer"
              >
                ✕
              </button>

              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-950">
                  Criar Categoria de Caixa
                </h3>
                <p className="text-[10px] text-stone-400 font-bold uppercase">Cadastre um novo centro de custos para a contabilidade</p>
              </div>

              <input
                type="text"
                placeholder="Ex: Reforma do escritório, Impostos federais..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs font-bold text-stone-800 outline-none focus:border-amber-500"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
              />

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer"
                >
                  cancelar
                </button>
                <button
                  type="button"
                  onClick={addCustomCategory}
                  className="w-full py-3 bg-[#F5B400] text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
