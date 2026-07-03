import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { 
  Home, 
  Search, 
  MapPin, 
  BedDouble, 
  Bath, 
  Maximize, 
  Car,
  Phone, 
  Mail, 
  Clock, 
  Instagram, 
  Facebook, 
  Linkedin, 
  MessageCircle,
  Menu,
  X,
  Star,
  DollarSign,
  Info,
  ChevronRight,
  ChevronLeft,
  Play,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle2,
  Plus,
  ArrowUp,
  ArrowUpRight,
  ArrowDown,
  Trash2,
  Eye,
  Settings,
  LayoutDashboard,
  Calendar,
  Check,
  Shield,
  ShieldCheck,
  Lock,
  Camera,
  Upload,
  ImagePlus,
  Download,
  Share2,
  Wallet,
  LogOut,
  Globe,
  FileText,
  Palette,
  PlusCircle,
  User,
  Sparkles,
  Copy,
  ShieldAlert,
  Users,
  Bell,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  db, auth, logout, loginWithGoogle, signInWithEmailAndPassword, sendPasswordResetEmail, checkIfAdmin, submitProperty, getSubmissions, approveProperty, rejectProperty, 
  getPrefixoCodigoImovel, obterPreviaCodigoImovel, seedDefaultSettingsIfEmpty,
  CRM_PERMISSIONS, carregarPerfilSeguro, subscribeToUsers, salvarUsuario, deletarUsuario, 
  subscribeToNotifications, criarNotificacao, marcarNotificacaoComoLida 
} from '../lib/firebase';
import { collection, addDoc, doc, getDoc, setDoc, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { exportReportToPDF } from '../lib/pdfExport';
import ConfigOptionManager from './ConfigOptionManager';
import { CurrencyInput, normalizeCurrencyField, formatNumberToCurrencyBR, parseCurrencyInputBR } from './CurrencyInput';
import { PercentInput, formatPercentBR } from './PercentInput';
import { RentalDashboard } from './RentalDashboard';
import { ContractsDashboard } from './ContractsDashboard';
import { ContractWizard } from './ContractWizard';
import { FinancialDashboard } from './FinancialDashboard';

// Re-using same Property interface for consistency
export interface Property {
  id: string | number;
  title: string;
  description?: string;
  location: string;
  city: string;
  neighborhood: string;
  condominium?: string;
  condoValue?: string;
  purpose: 'Venda' | 'Locação' | 'Venda e Locação' | string;
  tipoNegocio?: string;
  acceptsFinancing?: boolean;
  aceitaFinanciamento?: boolean;
  aceitaPermuta?: boolean;
  aceitaFGTS?: boolean;
  price: string;
  category: 'Residencial' | 'Comercial' | 'Rural';
  type: string;
  propertyType: string;
  beds?: number;
  suites?: number;
  baths?: number;
  parkingCovered?: number;
  parkingUncovered?: number;
  area: string;
  areaTotal?: string;
  areaUseful?: string;
  image: string;
  additionalImages?: string[];
  fotos?: any[];
  fotoPrincipal?: string;
  featured?: boolean;
  priceValue: number;
  coords: [number, number];
  status: 'ativo' | 'inativo' | 'vendido' | string;
  videoUrl?: string;
  caracteristicas?: string[];
  ambientes?: string[];
  caracteristicasEmpreendimento?: string[];
  lazer?: string[];
  instalacoes?: string[];
  acabamentos?: string[];
  proximidades?: string[];
  ownerId?: string;
  emailProprietario?: string;
  proprietarioId?: string;
  userId?: string;
  usuarioId?: string;
  codigoImovel?: string;
  codigo?: string;
  referencia?: string;
  publicado?: boolean;
  publicadoNoSite?: boolean;
  mostrarNosFiltros?: boolean;
  mostrarValorNoSite?: boolean;
  destaque?: boolean;
  destaqueNaHome?: boolean;
  mostrarCatalogo?: boolean;
  disponivelParaVisita?: boolean;
  disponivelParaProposta?: boolean;
  vendido?: boolean;
  tituloAnuncio?: string;
  subtituloAnuncio?: string;
  descricaoCurta?: string;
  descricaoDetalhada?: string;
  diferenciaisAnuncio?: string;
  textoWhatsapp?: string;
  textoInstagram?: string;
  tituloSEO?: string;
  descricaoSEO?: string;
  palavrasChaveSEO?: string;

  // Rental Fields
  valorVenda?: number;
  valorAluguel?: number;
  valorTotalMensal?: number;
  valorCondominio?: number;
  valorIptuAnual?: number;
  valorIptu?: number;
  iptuMensal?: number;
  taxaLixoAnual?: number;
  taxaLixo?: number;
  taxaLixoMensal?: number;
  taxaGas?: number;
  taxaAgua?: number;
  taxaLuz?: number;
  seguroIncendio?: number;
  taxasAdicionais?: number;
  garantiaLocaticia?: string;
  tempoMinimoContrato?: string;
  permitePet?: string;
  mobiliadoStatus?: string;
  observacoesLocacao?: string;
  alugado?: boolean;
  statusLocacao?: string;
  statusVenda?: string;
  gestaoLocacao?: {
    statusLocacao?: string;
    alugado?: boolean;
    contratoAtivo?: boolean;
    locacaoEmDia?: boolean;
    locatarioNome?: string;
    locatarioCpfCnpj?: string;
    locatarioRgIe?: string;
    locatarioWhatsapp?: string;
    locatarioEmail?: string;
    locatarioEndereco?: string;
    dataInicioLocacao?: string;
    dataFimLocacao?: string;
    valorAluguelContratado?: number;
    valorCaucao?: number;
    garantiaLocaticia?: string;
    diaVencimentoAluguel?: string;
    observacoesLocacao?: string;
    permitirVisitaMesmoAlugado?: boolean;
    manterDisponivelParaVenda?: boolean;
  };
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  state?: string;
  latitude?: string | number;
  longitude?: string | number;
}

// Inline mini PDFCalendar component
function PDFCalendar({ year, month, highlightedDays = [] }: { year: number, month: number, highlightedDays: string[] }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

  return (
    <div className="mt-8 border border-slate-100 rounded-2xl overflow-hidden bg-white">
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
        <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Mapa de Atividade</h5>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          {new Date(year, month).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-100 p-px">
        {weekDays.map(d => (
          <div key={d} className="bg-white py-2 text-center">
            <span className="text-[7px] font-black text-slate-400">{d}</span>
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white aspect-square"></div>
        ))}
        {days.map(d => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isHighlighted = highlightedDays.includes(dateStr);
          return (
            <div key={d} className="bg-white aspect-square p-1 flex flex-col items-center justify-center">
              <span className={`text-[9px] font-bold ${isHighlighted ? 'text-amber-600' : 'text-slate-400'}`}>
                {d}
              </span>
              {isHighlighted && <div className="w-1 h-1 bg-amber-600 rounded-full mt-0.5"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const FALLBACK_TIPOS_IMOVEL = [
  "Apartamento", "Casa", "Casa em Condomínio", "Sobrado", "Terreno", 
  "Terreno em Condomínio", "Sala Comercial", "Ponto Comercial", "Galpão", 
  "Chácara", "Sítio", "Área Industrial", "Área Comercial", "Kitnet", 
  "Studio", "Cobertura", "Loft"
].map((x, i) => ({ id: `fti_${i}`, nome: x, ativo: true, ordem: i }));

const FALLBACK_TIPOS_NEGOCIO = [
  "Venda", "Locação", "Venda e Locação"
].map((x, i) => ({ id: `ftn_${i}`, nome: x, ativo: true, ordem: i }));

const FALLBACK_STATUS_IMOVEL = [
  "Disponível", "Vendido", "Alugado", "Reservado", "Em negociação", "Rascunho", "Indisponível"
].map((x, i) => ({ id: `fsi_${i}`, nome: x, ativo: true, ordem: i }));

const FALLBACK_CIDADES = [
  "Sorocaba", "Votorantim", "Itu", "Salto", "Araçoiaba da Serra"
].map((x, i) => ({ id: `fc_${i}`, nome: x, ativo: true, ordem: i }));

const FALLBACK_BAIRROS = [
  "Centro", "Campolim", "Jardim América", "Jardim Europa", "Jardim Faculdade", 
  "Jardim Vergueiro", "Jardim São Carlos", "Jardim Simus", "Jardim Santa Rosália", 
  "Jardim São Paulo", "Jardim Pagliato", "Jardim Prestes de Barros", "Jardim Gonçalves", 
  "Jardim Astro", "Jardim Maria do Carmo", "Jardim Emília", "Jardim Karolyne", 
  "Jardim São Guilherme", "Vila Jardini", "Vila Haro", "Vila Santana", "Vila Progresso", 
  "Vila Angélica", "Vila Carvalho", "Vila Barão", "Vila Hortência", "Vila Gabriel", 
  "Vila Helena", "Vila Fiori", "Éden", "Cajuru do Sul", "Brigadeiro Tobias", 
  "Aparecidinha", "Wanel Ville", "Barcelona", "Trujillo", "Além Ponte", "Cerrado", 
  "Ipanema das Pedras", "Parque Campolim", "Parque São Bento", "Parque Vitória Régia", 
  "Parque das Paineiras", "Parque Esmeralda", "Parque Três Meninos", "Parque Manchester", 
  "Júlio de Mesquita Filho", "Horto Florestal", "Altos do Ipanema", "Condomínio Ibiti Royal", 
  "Condomínio Ibiti Reserva", "Condomínio Giverny", "Condomínio Alphaville Nova Esplanada", 
  "Condomínio Sunset", "Condomínio Mont Blanc", "Condomínio Lago da Boa Vista"
].map((x, i) => ({ id: `fb_${i}`, nome: x, ativo: true, ordem: i }));

const FALLBACK_CARACTERISTICAS = [
  "Mobiliado", "Semi mobiliado", "Decorado", "Novo", "Usado", "Reformado", "Alto padrão", 
  "Andar alto", "Andar baixo", "Sol da manhã", "Sol da tarde", "Face norte", "Face sul", 
  "Face leste", "Face oeste", "Sacada", "Varanda", "Varanda gourmet", "Sacada com churrasqueira", 
  "Churrasqueira privativa", "Área de serviço", "Cozinha planejada", "Cozinha americana", 
  "Sala de estar", "Sala de jantar", "Home office", "Closet", "Despensa", "Lavanderia", 
  "Dependência de empregada", "Banheiro de serviço", "Hidromassagem", "Banheira", 
  "Ar condicionado", "Aquecimento a gás", "Piso porcelanato", "Piso laminado", "Piso vinílico", 
  "Piso cerâmico", "Teto rebaixado em gesso", "Iluminação em LED", "Fechadura eletrônica", 
  "Porta com senha", "Interfone", "Documentação regularizada", "Aceita financiamento", 
  "Aceita permuta", "Aceita FGTS", "Permite pet", "Quintal", "Jardim", "Piscina privativa", 
  "Área gourmet", "Edícula", "Entrada lateral", "Garagem coberta", "Garagem descoberta"
].map((x, i) => ({ id: `fc_opt_${i}`, nome: x, ativo: true, ordem: i }));

const FALLBACK_AMBIENTES = [
  "Sala de estar", "Sala de jantar", "Sala de TV", "Cozinha", "Cozinha americana", 
  "Cozinha gourmet", "Área gourmet", "Varanda", "Sacada", "Sacada gourmet", "Churrasqueira", 
  "Lavanderia", "Área de serviço", "Despensa", "Home office", "Escritório", "Closet", 
  "Suíte master", "Suíte com closet", "Banheiro social", "Lavabo", "Quarto de casal", 
  "Quarto de solteiro", "Dependência de empregada", "Banheiro de serviço", "Garagem", 
  "Depósito privativo", "Terraço", "Jardim", "Quintal", "Piscina privativa", "Edícula", 
  "Corredor lateral", "Área externa", "Canil", "Horta", "Oficina", "Porão", "Sótão"
].map((x, i) => ({ id: `fam_${i}`, nome: x, ativo: true, ordem: i }));

const FALLBACK_CARACTERISTICAS_EMPREENDIMENTO = [
  "Elevador", "Elevador social", "Elevador de serviço", "Hall de entrada", "Hall decorado", 
  "Portaria", "Portaria 24 horas", "Portão eletrônico", "Interfone", "Circuito de câmeras", 
  "Monitoramento", "Segurança 24 horas", "Zelador", "Sistema de alarme", "Acesso por biometria", 
  "Acesso por tag", "Garagem coberta", "Garagem descoberta", "Depósito", "Bicicletário", 
  "Gerador de energia", "Medidores individuais", "Gás central", "Energia solar", 
  "Infraestrutura para ar condicionado", "Infraestrutura para carro elétrico", 
  "Tomada para carro elétrico", "Condomínio fechado", "Rua asfaltada", "Guarita", 
  "Controle de acesso", "Ronda motorizada", "Área verde", "Praça interna", "Espaço delivery", 
  "Vaga para visitantes"
].map((x, i) => ({ id: `fce_${i}`, nome: x, ativo: true, ordem: i }));

const FALLBACK_LAZER = [
  "Piscina", "Piscina adulta", "Piscina infantil", "Piscina aquecida", "Academia", 
  "Sala fitness", "Salão de festas", "Espaço gourmet", "Quiosque", "Churrasqueira coletiva", 
  "Brinquedoteca", "Playground", "Sala de jogos", "Cinema", "Pub", "Wine bar", "Sauna", 
  "Spa", "Ofurô", "Hidromassagem", "Quadra esportiva", "Quadra poliesportiva", 
  "Quadra de tênis", "Quadra de beach tennis", "Campo de futebol", "Pet place", "Pet care", 
  "Espaço kids", "Espaço teen", "Coworking", "Sala de reuniões", "Lounge", "Fire place", 
  "Praça de convivência", "Jardim", "Área verde", "Deck", "Solarium", "Redário", 
  "Pista de caminhada", "Espaço mulher", "Espaço pilates", "Espaço yoga", "Market interno", 
  "Mini mercado"
].map((x, i) => ({ id: `flz_${i}`, nome: x, ativo: true, ordem: i }));

const FALLBACK_INSTALACOES = [
  "Ar condicionado", "Aquecimento a gás", "Gás central", "Medidor de água individual", 
  "Medidor de gás individual", "Medidor de luz individual", "Internet", "Infraestrutura para internet", 
  "TV a cabo", "Cabeamento estruturado", "Sistema de segurança", "Câmeras de segurança", 
  "Alarme", "Interfone", "Portão eletrônico", "Fechadura eletrônica", "Energia solar", 
  "Gerador", "Infraestrutura para carregador elétrico", "Tomada para carro elétrico", 
  "Captação de água da chuva", "Pressurizador", "Poço artesiano", "Aquecedor solar", 
  "Sistema de reuso de água", "Preparação para automação", "Automação residencial"
].map((x, i) => ({ id: `fin_${i}`, nome: x, ativo: true, ordem: i }));

const FALLBACK_ACABAMENTOS = [
  "Porcelanato", "Piso laminado", "Piso vinílico", "Piso cerâmico", "Mármore", "Granito", 
  "Gesso", "Teto rebaixado", "Iluminação em LED", "Móveis planejados", "Bancada em granito", 
  "Bancada em mármore", "Bancada em quartzo", "Esquadrias de alumínio", "Persianas automatizadas", 
  "Vidros temperados", "Portas laqueadas", "Metais de alto padrão", "Revestimento premium", 
  "Acabamento em gesso", "Pintura nova", "Papel de parede", "Rodapé embutido", 
  "Rodapé em poliestireno", "Portas de madeira", "Piso antiderrapante", "Louças e metais instalados"
].map((x, i) => ({ id: `fac_${i}`, nome: x, ativo: true, ordem: i }));

const FALLBACK_PROXIMIDADES = [
  "Mercado", "Supermercado", "Farmácia", "Padaria", "Academia", "Escola", "Creche", 
  "Universidade", "Hospital", "Clínica", "Posto de gasolina", "Banco", "Caixa eletrônico", 
  "Shopping", "Restaurante", "Cafeteria", "Igreja", "Parque", "Praça", "Ponto de ônibus", 
  "Terminal de ônibus", "Acesso rápido ao centro", "Acesso rápido à Rodovia Raposo Tavares", 
  "Acesso rápido à Rodovia Castelo Branco", "Acesso rápido à Rodovia João Leme dos Santos", 
  "Acesso rápido à Avenida Itavuvu", "Acesso rápido à Avenida Ipanema", 
  "Acesso rápido à Avenida Armando Pannunzio", "Comércio local", "Ciclovia", "Condomínios", 
  "Distrito industrial", "Centro comercial", "Faculdade", "Escola particular", "Escola pública", 
  "Delegacia", "UPA", "Posto de saúde", "Pet shop", "Veterinária", "Hipermercado", "Atacadão", 
  "Assaí", "Shopping Iguatemi Esplanada", "Shopping Cidade Sorocaba", "Campolim", "Centro", 
  "Zona Norte", "Zona Leste", "Zona Oeste", "Zona Sul"
].map((x, i) => ({ id: `fpr_${i}`, nome: x, ativo: true, ordem: i }));

const parseToObjects = (arr: any, defaultQty = 0) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((x: any) => {
    if (typeof x === 'string') return { nome: x, ativo: true, quantidade: defaultQty };
    return {
      nome: x.nome || '',
      ativo: x.ativo !== undefined ? x.ativo : true,
      quantidade: x.quantidade !== undefined ? Number(x.quantidade) : defaultQty
    };
  });
};

const BROKER_PHONE = "5515991143213";
const BROKER_EMAIL = "atendimento@rbsorocaba.com.br";

const OPCOES_PADRAO: Record<string, any[]> = {
  caracteristicas: FALLBACK_CARACTERISTICAS,
  ambientes: FALLBACK_AMBIENTES,
  proximidades: FALLBACK_PROXIMIDADES,
  instalacoes: FALLBACK_INSTALACOES,
  acabamentos: FALLBACK_ACABAMENTOS,
  lazer: FALLBACK_LAZER,
  caracteristicasEmpreendimento: FALLBACK_CARACTERISTICAS_EMPREENDIMENTO,
  statusImovel: FALLBACK_STATUS_IMOVEL,
  tiposImovel: FALLBACK_TIPOS_IMOVEL,
  tiposNegocio: FALLBACK_TIPOS_NEGOCIO,
  cidades: FALLBACK_CIDADES,
  bairros: FALLBACK_BAIRROS
};

async function carregarColecaoOpcoes(nomeColecao: string): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, nomeColecao));

    const docsValidos = snap.docs
      .filter((docItem) => docItem.id !== "init")
      .filter((docItem) => docItem.data()?.init !== true)
      .map((docItem) => ({
        id: docItem.id,
        ...docItem.data()
      }))
      .filter((item: any) => item.ativo !== false);

    if (docsValidos.length > 0) {
      return docsValidos;
    }

    return OPCOES_PADRAO[nomeColecao] || [];
  } catch (error) {
    console.warn(`Erro ao carregar ${nomeColecao}:`, error);
    return OPCOES_PADRAO[nomeColecao] || [];
  }
}

async function podeSincronizarOpcoes(user: any): Promise<boolean> {
  if (!user?.email) return false;

  try {
    const email = user.email.toLowerCase();

    const adminSnap = await getDoc(doc(db, "admins", email));

    if (adminSnap.exists()) return true;

    const administradorSnap = await getDoc(doc(db, "administradores", email));

    if (administradorSnap.exists()) return true;

    return false;
  } catch (error) {
    console.warn("Erro ao verificar admin:", error);
    return false;
  }
}

// carregarPerfilSeguro is imported from firebase.ts

async function carregarFinanceiroSeguro(user: any): Promise<any[]> {
  if (!user) return [];

  const uid = user.uid;
  const email = user.email?.toLowerCase();

  const colecoes = [
    "financeiro",
    "transacoesFinanceiras",
    "financialTransactions"
  ];

  const filtros = [
    ["emailProprietario", "==", email],
    ["proprietarioEmail", "==", email],
    ["proprietarioId", "==", uid],
    ["ownerId", "==", uid],
    ["userId", "==", uid],
    ["usuarioId", "==", uid]
  ];

  const resultados: any[] = [];

  for (const nomeColecao of colecoes) {
    for (const filtro of filtros) {
      try {
        const q = query(
          collection(db, nomeColecao),
          where(filtro[0], filtro[1], filtro[2])
        );

        const snap = await getDocs(q);

        snap.docs.forEach((docItem) => {
          if (docItem.id !== "init" && docItem.data()?.init !== true) {
            resultados.push({
              id: docItem.id,
              colecao: nomeColecao,
              ...docItem.data()
            });
          }
        });
      } catch (error) {
        console.warn(`Erro financeiro ${nomeColecao} por ${filtro[0]}:`, error);
      }
    }
  }

  // De-duplicate by ID
  const uniqueResultados = Array.from(new Map(resultados.map(item => [item.id, item])).values());
  return uniqueResultados;
}

async function carregarLocacoesSeguro(user: any): Promise<any[]> {
  if (!user) return [];

  const uid = user.uid;
  const email = user.email?.toLowerCase();

  const filtros = [
    ["proprietarioId", "==", uid],
    ["proprietarioEmail", "==", email],
    ["ownerId", "==", uid]
  ];

  const resultados: any[] = [];

  for (const filtro of filtros) {
    try {
      const q = query(
        collection(db, "locacoes"),
        where(filtro[0], filtro[1], filtro[2])
      );
      const snap = await getDocs(q);
      snap.docs.forEach((docItem) => {
        if (docItem.id !== "init" && docItem.data()?.init !== true) {
          resultados.push({
            id: docItem.id,
            ...docItem.data()
          });
        }
      });
    } catch (error) {
      console.warn(`Erro locacoes por ${filtro[0]}:`, error);
    }
  }

  // Fallback to a general fetch of locacoes inside a try-catch for admin fallback
  try {
    const snap = await getDocs(collection(db, "locacoes"));
    snap.docs.forEach((docItem) => {
      if (docItem.id !== "init" && docItem.data()?.init !== true) {
        resultados.push({
          id: docItem.id,
          ...docItem.data()
        });
      }
    });
  } catch (error) {
    // Silently fails on non-admins, completely expected and safe
  }

  // Deduplicate by ID
  const uniqueResultados = Array.from(new Map(resultados.map(item => [item.id, item])).values());
  return uniqueResultados;
}

interface OptionItem {
  id?: string;
  nome: string;
  permiteQuantidade?: boolean;
}

interface ValueItem {
  nome: string;
  ativo?: boolean;
  quantidade?: number;
}

interface OptionsChecklistProps {
  titulo: string;
  descricao?: string;
  categoria: string;
  opcoes: OptionItem[];
  valores: ValueItem[];
  onChange: (categoria: string, nome: string, checked: boolean) => void;
  onQuantidadeChange: (categoria: string, nome: string, quantidade: number) => void;
  searchPlaceholder?: string;
}

function OptionsChecklist({
  titulo,
  descricao,
  categoria,
  opcoes = [],
  valores = [],
  onChange,
  onQuantidadeChange,
  searchPlaceholder = "Pesquisar..."
}: OptionsChecklistProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOpcoes = useMemo(() => {
    return opcoes.filter(opt => {
      const nome = opt.nome || '';
      return nome.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [opcoes, searchQuery]);

  const shouldShowQty = (opcao: OptionItem) => {
    if (opcao.permiteQuantidade === false) return false;
    return true; // default to true so users can specify counts on items when active
  };

  return (
    <div className="space-y-3 bg-white p-5 rounded-2xl border border-[#EFEFEA] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-slate-100 pb-2">
        <div>
          <label className="text-xs uppercase tracking-widest font-black text-stone-900 border-l-4 border-amber-500 pl-3">
            {titulo}
          </label>
          {descricao && <p className="text-[9px] text-[#A1A19A] mt-1 uppercase font-bold tracking-wider">{descricao}</p>}
        </div>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
          {valores.filter(v => v.ativo).length} marcados
        </span>
      </div>

      {opcoes.length > 5 && (
        <input
          type="text"
          placeholder={searchPlaceholder}
          className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-lg px-3 py-1.5 text-[10px] outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      )}

      {filteredOpcoes.length === 0 ? (
        <p className="text-[10px] text-slate-400 italic py-2">Sem opções de filtro.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto mt-2 p-1 pr-2">
          {filteredOpcoes.map((opcao) => {
            const itemSelecionado = valores.find((item) => item.nome === opcao.nome);
            const marcado = Boolean(itemSelecionado?.ativo);
            const showQty = marcado && shouldShowQty(opcao);

            return (
              <div
                key={opcao.id || opcao.nome}
                className={`flex items-center justify-between group py-1 border-b border-dotted border-slate-100 hover:border-slate-200 transition-all ${
                  marcado ? "bg-amber-50/10" : ""
                }`}
              >
                <label className="flex items-center space-x-3 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer select-none flex-1">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={(e) => onChange(categoria, opcao.nome, e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4 transition-all"
                  />
                  <span className={marcado ? "text-stone-900 font-bold" : "text-stone-400 font-medium"}>
                    {opcao.nome}
                  </span>
                </label>

                {showQty && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-[#EFEFEA] px-2 py-0.5 rounded-lg transition-all">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Qtd:</span>
                    <input
                      type="number"
                      min="0"
                      className="w-10 text-center bg-white border border-[#EFEFEA] rounded text-[10px] font-black text-stone-700 p-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      value={itemSelecionado?.quantidade ?? 0}
                      onChange={(e) =>
                        onQuantidadeChange(
                          categoria,
                          opcao.nome,
                          Number(e.target.value || 0)
                        )
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OwnerPortal({
  properties,
  scheduledVisits,
  blockedSlots,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty,
  onBlockSlot,
  onUnblockSlot,
  onUpdateVisitStatus,
  onDeleteVisit,
  onClose,
  isAuthorized,
  onViewFichaTecnica,
  optTiposImovel = [],
  optTiposNegocio = [],
  optStatusImovel = [],
  optCidades = [],
  optBairros = [],
  optCaracteristicas = [],
  optAmbientes = [],
  optCaracteristicasEmpreendimento = [],
  optLazer = [],
  optInstalacoes = [],
  optAcabamentos = [],
  optProximidades = [],
  optCategoriasImovel = []
}: {
  properties: Property[],
  scheduledVisits: any[],
  blockedSlots: any[],
  onAddProperty: (prop: any) => void,
  onUpdateProperty: (prop: any) => void,
  onDeleteProperty: (id: string | number) => void,
  onBlockSlot?: (slot: any) => Promise<void>,
  onUnblockSlot?: (id: string) => Promise<void>,
  onUpdateVisitStatus?: (id: string, status: 'pending' | 'confirmed' | 'cancelled') => Promise<void>,
  onDeleteVisit?: (id: string) => Promise<void>,
  onClose: () => void,
  isAuthorized: boolean,
  onViewFichaTecnica?: (p: Property) => void,
  optTiposImovel?: any[],
  optTiposNegocio?: any[],
  optStatusImovel?: any[],
  optCidades?: any[],
  optBairros?: any[],
  optCaracteristicas?: any[],
  optAmbientes?: any[],
  optCaracteristicasEmpreendimento?: any[],
  optLazer?: any[],
  optInstalacoes?: any[],
  optAcabamentos?: any[],
  optProximidades?: any[],
  optCategoriasImovel?: any[]
}) {
  const currentUser = auth.currentUser;

  // States for administrative email/password login
  const [adminLoginEmail, setAdminLoginEmail] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [adminAuthSuccess, setAdminAuthSuccess] = useState<string | null>(null);
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [adminAuthMode, setAdminAuthMode] = useState<'login' | 'forgot_password'>('login');

  // Custom Navigation tabs for high-end Owner Portal (Dashboard + dynamic administrative views)
  const [activeTab, setActiveTab] = useState<string>(
    isAuthorized ? 'dashboard' : 'inventory'
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // States for ContractWizard integration from physical property inventory cards
  const [wizardProperty, setWizardProperty] = useState<any>(null);
  const [showDocChoiceModal, setShowDocChoiceModal] = useState(false);
  const [wizardOpenFromPortal, setWizardOpenFromPortal] = useState(false);
  const [wizardTypeFromPortal, setWizardTypeFromPortal] = useState<'Proposta' | 'Contraproposta' | 'ContratoCompraVenda' | 'ContratoLocacao' | 'ReciboEditavel'>('Proposta');

  // States from original admin component
  const [showAddForm, setShowAddForm] = useState(!isAuthorized);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [editTab, setEditTab] = useState<string>('dados_basicos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const [opcoesCadastro, setOpcoesCadastro] = useState<Record<string, any[]>>({});
  const [loadingOpcoes, setLoadingOpcoes] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedReport, setSeedReport] = useState<any>(null);

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    setAdminAuthSuccess(null);

    // Validations:
    if (!adminLoginEmail.trim()) {
      setAdminAuthError("Informe seu e-mail.");
      return;
    }
    if (!adminLoginPassword) {
      setAdminAuthError("Informe sua senha.");
      return;
    }

    setAdminAuthLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, adminLoginEmail.trim(), adminLoginPassword);
      const user = userCredential.user;
      
      // Verify if the email is registered as an admin/leader/broker in Firestore
      const hasPermission = await checkIfAdmin(user);
      if (!hasPermission) {
        await logout();
        setAdminAuthError("Acesso negado. Você não tem permissão para acessar o painel.");
        setAdminAuthLoading(false);
        return;
      }

      setAdminAuthSuccess("Acesso concedido com sucesso! Carregando painel...");
    } catch (error: any) {
      console.error("Erro no login por e-mail/senha:", error);
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/invalid-login-credentials") {
        setAdminAuthError("E-mail ou senha incorretos.");
      } else if (error.code === "auth/user-not-found") {
        setAdminAuthError("Usuário não encontrado.");
      } else if (error.code === "auth/invalid-email") {
        setAdminAuthError("Formato de e-mail inválido.");
      } else {
        setAdminAuthError(error.message || "Erro desconhecido ao tentar fazer login.");
      }
    } finally {
      setAdminAuthLoading(false);
    }
  };

  const handleAdminForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    setAdminAuthSuccess(null);

    if (!adminLoginEmail.trim()) {
      setAdminAuthError("Informe seu e-mail.");
      return;
    }

    setAdminAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, adminLoginEmail.trim());
      setAdminAuthSuccess("Enviamos um link de redefinição para seu e-mail.");
    } catch (error: any) {
      console.error("Erro ao enviar e-mail de redefinição:", error);
      if (error.code === "auth/user-not-found") {
        setAdminAuthError("Usuário não encontrado.");
      } else if (error.code === "auth/invalid-email") {
        setAdminAuthError("Formato de e-mail inválido.");
      } else {
        setAdminAuthError(error.message || "Erro ao tentar redefinir senha.");
      }
    } finally {
      setAdminAuthLoading(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    setAdminAuthError(null);
    setAdminAuthSuccess(null);
    setAdminAuthLoading(true);

    try {
      const result = await loginWithGoogle() as any;
      const user = result?.user || result;
      if (user) {
        const hasPermission = await checkIfAdmin(user);
        if (!hasPermission) {
          await logout();
          setAdminAuthError("Acesso negado. Você não tem permissão para acessar o painel.");
          setAdminAuthLoading(false);
          return;
        }
        setAdminAuthSuccess("Acesso concedido com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro no login via Google:", error);
      setAdminAuthError(error.message || "Erro ao fazer login com Google.");
    } finally {
      setAdminAuthLoading(false);
    }
  };

  const handleSeedOptions = async () => {
    try {
      setIsSeeding(true);
      const res = await seedDefaultSettingsIfEmpty();
      if (res.success) {
        alert("Opções padrão adicionadas com sucesso.");
        setSeedReport(res);
        await carregarTodasOpcoes();
      } else {
        alert("Erro ao adicionar opções padrão: " + res.message);
      }
    } catch (error) {
      console.error("Erro no seed de opções:", error);
      alert("Ocorreu um erro ao carregar as opções.");
    } finally {
      setIsSeeding(false);
    }
  };

  const carregarTodasOpcoes = async () => {
    try {
      setLoadingOpcoes(true);
      const colecoes = [
        "caracteristicas",
        "ambientes",
        "proximidades",
        "instalacoes",
        "acabamentos",
        "lazer",
        "caracteristicasEmpreendimento",
        "statusImovel",
        "tiposImovel",
        "tiposNegocio",
        "cidades",
        "bairros",
        "caracteristicasApartamento",
        "categoriasImovel"
      ];

      const resultado: Record<string, any[]> = {};

      for (const nomeColecao of colecoes) {
        resultado[nomeColecao] = await carregarColecaoOpcoes(nomeColecao);
      }

      setOpcoesCadastro(resultado);
    } catch (err) {
      console.error("Erro geral ao carregar todas as opções:", err);
    } finally {
      setLoadingOpcoes(false);
    }
  };

  useEffect(() => {
    carregarTodasOpcoes();
  }, []);

  const opcoesCaracteristicas = useMemo(() => {
    return opcoesCadastro.caracteristicas || FALLBACK_CARACTERISTICAS;
  }, [opcoesCadastro]);

  const opcoesCaracteristicasApartamento = useMemo(() => {
    return opcoesCadastro.caracteristicasApartamento || [];
  }, [opcoesCadastro]);

  const opcoesCategoriasImovel = useMemo(() => {
    return opcoesCadastro.categoriasImovel || [];
  }, [opcoesCadastro]);

  const opcoesStatusImovel = useMemo(() => {
    const list = opcoesCadastro.statusImovel || [];
    let mapped: string[] = [];
    if (list.length > 0) {
      mapped = list.map((item: any) => {
        if (typeof item === 'string') return item;
        return item.nome || item.label || item.value || '';
      }).filter(Boolean);
    } else {
      mapped = ["Disponível", "Alugado", "Vendido", "Reservado", "Indisponível", "Em negociação", "Em análise", "Rascunho"];
    }
    return Array.from(new Set(mapped));
  }, [opcoesCadastro]);

  const opcoesTiposImovel = useMemo(() => {
    return opcoesCadastro.tiposImovel || FALLBACK_TIPOS_IMOVEL;
  }, [opcoesCadastro]);

  const opcoesAmbientes = useMemo(() => {
    return opcoesCadastro.ambientes || FALLBACK_AMBIENTES;
  }, [opcoesCadastro]);

  const opcoesProximidades = useMemo(() => {
    return opcoesCadastro.proximidades || FALLBACK_PROXIMIDADES;
  }, [opcoesCadastro]);

  const opcoesInstalacoes = useMemo(() => {
    return opcoesCadastro.instalacoes || FALLBACK_INSTALACOES;
  }, [opcoesCadastro]);

  const opcoesAcabamentos = useMemo(() => {
    return opcoesCadastro.acabamentos || FALLBACK_ACABAMENTOS;
  }, [opcoesCadastro]);

  const opcoesLazer = useMemo(() => {
    return opcoesCadastro.lazer || FALLBACK_LAZER;
  }, [opcoesCadastro]);

  const opcoesCaracteristicasEmpreendimento = useMemo(() => {
    return opcoesCadastro.caracteristicasEmpreendimento || FALLBACK_CARACTERISTICAS_EMPREENDIMENTO;
  }, [opcoesCadastro]);

  const handleToggleOpcao = (categoria: string, nome: string, checked: boolean) => {
    setNewProperty((prev: any) => {
      const listaAtual = Array.isArray(prev[categoria]) ? prev[categoria] : [];
      let novaLista;

      if (checked) {
        const jaExiste = listaAtual.some((item: any) => {
          const itemNome = typeof item === 'string' ? item : item?.nome;
          return itemNome === nome;
        });

        if (jaExiste) {
          novaLista = listaAtual.map((item: any) => {
            const itemNome = typeof item === 'string' ? item : item?.nome;
            if (itemNome === nome) {
              if (typeof item === 'string') {
                return { nome: item, ativo: true, quantidade: (categoria === 'ambientes' ? 1 : 0) };
              }
              return { ...item, ativo: true };
            }
            return item;
          });
        } else {
          novaLista = [
            ...listaAtual,
            {
              nome,
              ativo: true,
              quantidade: (categoria === 'ambientes' ? 1 : 0)
            }
          ];
        }
      } else {
        novaLista = listaAtual.map((item: any) => {
          const itemNome = typeof item === 'string' ? item : item?.nome;
          if (itemNome === nome) {
            if (typeof item === 'string') {
              return { nome: item, ativo: false, quantidade: 0 };
            }
            return { ...item, ativo: false, quantidade: 0 };
          }
          return item;
        });
      }

      return {
        ...prev,
        [categoria]: novaLista
      };
    });
  };

  const handleQuantidadeOpcao = (categoria: string, nome: string, quantidade: number) => {
    setNewProperty((prev: any) => {
      const listaAtual = Array.isArray(prev[categoria]) ? prev[categoria] : [];

      const novaLista = listaAtual.map((item: any) => {
        const itemNome = typeof item === 'string' ? item : item?.nome;
        if (itemNome === nome) {
          if (typeof item === 'string') {
            return {
              nome,
              quantidade: Number(quantidade || 0),
              ativo: true
            };
          }
          return {
            ...item,
            quantidade: Number(quantidade || 0),
            ativo: true
          };
        }
        return item;
      });

      return {
        ...prev,
        [categoria]: novaLista
      };
    });
  };

  const updateGLoc = (fields: any) => {
    setNewProperty(prev => ({
      ...prev,
      gestaoLocacao: {
        ...(prev.gestaoLocacao || {}),
        ...fields
      }
    }));
  };

  const clearRentalData = () => {
    if (confirm("Deseja realmente limpar todos os dados de locatário e contrato desta locação?")) {
      setNewProperty(prev => ({
        ...prev,
        statusLocacao: 'Disponível para locação',
        alugado: false,
        gestaoLocacao: {
          statusLocacao: 'Disponível para locação',
          alugado: false,
          contratoAtivo: false,
          locacaoEmDia: true,
          locatarioNome: '',
          locatarioCpfCnpj: '',
          locatarioRgIe: '',
          locatarioWhatsapp: '',
          locatarioEmail: '',
          locatarioEndereco: '',
          dataInicioLocacao: '',
          dataFimLocacao: '',
          valorAluguelContratado: 0,
          valorCaucao: 0,
          garantiaLocaticia: '',
          diaVencimentoAluguel: '',
          observacoesLocacao: '',
          permitirVisitaMesmoAlugado: false,
          manterDisponivelParaVenda: true
        }
      }));
    }
  };
  // Locatários e Contratos de Locação States (RB Sorocaba)
  const [locacoesList, setLocacoesList] = useState<any[]>([]);
  const [locacoesLoading, setLocacoesLoading] = useState(false);
  const [modalLancamentoLocacaoAberto, setModalLancamentoLocacaoAberto] = useState(false);
  const [editingLocacao, setEditingLocacao] = useState<any | null>(null);
  const [loadingSalvarLocacao, setLoadingSalvarLocacao] = useState(false);

  const INITIAL_FORM_LOCACAO = {
    imovelId: "",
    locatarioNome: "",
    locatarioCpfCnpj: "",
    locatarioRgIe: "",
    locatarioWhatsapp: "",
    locatarioEmail: "",
    locatarioEndereco: "",
    locatarioCep: "",
    locatarioCidade: "Sorocaba",
    locatarioEstado: "SP",

    dataInicioLocacao: "",
    dataFimLocacao: "",
    diaVencimentoAluguel: "10",
    garantiaLocaticia: "Caução",

    valorAluguelMensalInput: 0,
    valorCondominioInput: 0,
    iptuMensalInput: 0,
    taxaLixoMensalInput: 0,
    valorCaucaoInput: 0,

    comissaoImobiliariaPercentualInput: 10, // default 10%
    manterDisponivelParaVenda: false,
    observacoesLocacao: ""
  };

  const [formLocacao, setFormLocacao] = useState(INITIAL_FORM_LOCACAO);

  // Load locacoes
  const fetchLocacoes = async () => {
    if (!currentUser) return;
    try {
      setLocacoesLoading(true);
      const docs = await carregarLocacoesSeguro(currentUser);
      setLocacoesList(docs);
    } catch (err) {
      console.warn("Erro ao carregar lista de locações:", err);
      setLocacoesList([]);
    } finally {
      setLocacoesLoading(false);
    }
  };

  useEffect(() => {
    fetchLocacoes();
  }, [currentUser, properties]);

  const handleSelectImovel = (id: string | number) => {
    const imovelMatching = properties.find(p => String(p.id) === String(id));
    if (imovelMatching) {
      const isVendaAndLocacao = imovelMatching.purpose === 'Venda e Locação';
      setFormLocacao(prev => ({
        ...prev,
        imovelId: String(id),
        valorAluguelMensalInput: imovelMatching.valorAluguel || imovelMatching.priceValue || 0,
        valorCondominioInput: imovelMatching.valorCondominio || Number(imovelMatching.condoValue) || 0,
        iptuMensalInput: imovelMatching.iptuMensal || imovelMatching.valorIptu || 0,
        taxaLixoMensalInput: imovelMatching.taxaLixoMensal || imovelMatching.taxaLixo || 0,
        garantiaLocaticia: imovelMatching.garantiaLocaticia || 'Caução',
        manterDisponivelParaVenda: isVendaAndLocacao
      }));
    }
  };

  const handleEditLocacao = (locacao: any) => {
    setEditingLocacao(locacao);
    setFormLocacao({
      imovelId: locacao.imovelId || "",
      locatarioNome: locacao.locatarioNome || "",
      locatarioCpfCnpj: locacao.locatarioCpfCnpj || "",
      locatarioRgIe: locacao.locatarioRgIe || "",
      locatarioWhatsapp: locacao.locatarioWhatsapp || "",
      locatarioEmail: locacao.locatarioEmail || "",
      locatarioEndereco: locacao.locatarioEndereco || "",
      locatarioCep: locacao.locatarioCep || "",
      locatarioCidade: locacao.locatarioCidade || "Sorocaba",
      locatarioEstado: locacao.locatarioEstado || "SP",

      dataInicioLocacao: locacao.dataInicioLocacao || "",
      dataFimLocacao: locacao.dataFimLocacao || "",
      diaVencimentoAluguel: locacao.diaVencimentoAluguel || "10",
      garantiaLocaticia: locacao.garantiaLocaticia || "Caução",

      valorAluguelMensalInput: locacao.valorAluguelMensal || 0,
      valorCondominioInput: locacao.valorCondominio || 0,
      iptuMensalInput: locacao.iptuMensal || 0,
      taxaLixoMensalInput: locacao.taxaLixoMensal || 0,
      valorCaucaoInput: locacao.valorCaucao || 0,

      comissaoImobiliariaPercentualInput: locacao.comissaoImobiliariaPercentual !== undefined ? locacao.comissaoImobiliariaPercentual : 10,

      manterDisponivelParaVenda: !!((properties.find(p => String(p.id) === String(locacao.imovelId)) as any)?.gestaoLocacao?.manterDisponivelParaVenda),
      observacoesLocacao: locacao.observacoesLocacao || ""
    });
    setModalLancamentoLocacaoAberto(true);
  };

  const handleSalvarLocacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!formLocacao.imovelId) {
      alert("Selecione um imóvel!");
      return;
    }
    if (!formLocacao.locatarioNome) {
      alert("Preencha o nome do locatário!");
      return;
    }

    setLoadingSalvarLocacao(true);

    try {
      const selectedProp = properties.find(p => String(p.id) === String(formLocacao.imovelId));
      if (!selectedProp) {
        throw new Error("Imóvel não encontrado na listagem da RB Sorocaba.");
      }

      const baseCal = Number(formLocacao.valorAluguelMensalInput || 0);
      const pct = Number(formLocacao.comissaoImobiliariaPercentualInput || 0);
      const comValue = baseCal * (pct / 100);

      const valTot = baseCal + Number(formLocacao.valorCondominioInput || 0) + Number(formLocacao.iptuMensalInput || 0) + Number(formLocacao.taxaLixoMensalInput || 0);

      const locDoc = {
        imovelId: String(formLocacao.imovelId),
        codigoImovel: String(selectedProp.codigoImovel || selectedProp.codigo || selectedProp.id || ""),
        tituloImovel: String(selectedProp.title || ""),
        enderecoImovel: String(selectedProp.location || ""),

        proprietarioId: String(selectedProp.ownerId || selectedProp.proprietarioId || currentUser.uid || ""),
        proprietarioNome: String(selectedProp.emailProprietario ? selectedProp.emailProprietario.split('@')[0] : "Proprietário"),
        proprietarioEmail: String(selectedProp.emailProprietario || currentUser.email || ""),

        locatarioNome: String(formLocacao.locatarioNome),
        locatarioCpfCnpj: String(formLocacao.locatarioCpfCnpj),
        locatarioRgIe: String(formLocacao.locatarioRgIe),
        locatarioWhatsapp: String(formLocacao.locatarioWhatsapp),
        locatarioEmail: String(formLocacao.locatarioEmail),
        locatarioEndereco: String(formLocacao.locatarioEndereco),
        locatarioCep: String(formLocacao.locatarioCep),
        locatarioCidade: String(formLocacao.locatarioCidade),
        locatarioEstado: String(formLocacao.locatarioEstado),

        dataInicioLocacao: String(formLocacao.dataInicioLocacao),
        dataFimLocacao: String(formLocacao.dataFimLocacao),
        diaVencimentoAluguel: String(formLocacao.diaVencimentoAluguel),
        garantiaLocaticia: String(formLocacao.garantiaLocaticia),

        valorAluguelMensal: baseCal,
        valorCondominio: Number(formLocacao.valorCondominioInput || 0),
        iptuMensal: Number(formLocacao.iptuMensalInput || 0),
        taxaLixoMensal: Number(formLocacao.taxaLixoMensalInput || 0),
        valorTotalMensal: valTot,
        valorCaucao: Number(formLocacao.valorCaucaoInput || 0),

        comissaoImobiliariaPercentual: pct,
        comissaoImobiliariaValor: comValue,
        baseCalculoComissao: baseCal,
        tipoBaseComissao: "aluguel_mensal",

        statusLocacao: "Alugado",
        contratoAtivo: true,
        locacaoEmDia: true,

        observacoesLocacao: String(formLocacao.observacoesLocacao),

        criadoEm: editingLocacao?.criadoEm || new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };

      let locacaoId = "";

      if (editingLocacao) {
        locacaoId = editingLocacao.id;
        const docRef = doc(db, "locacoes", locacaoId);
        await setDoc(docRef, locDoc, { merge: true });

        // Update related pending financial documents
        try {
          const qFin = query(
            collection(db, "financeiro"),
            where("locacaoId", "==", locacaoId),
            where("status", "==", "Pendente")
          );
          const snapFin = await getDocs(qFin);
          for (const docFin of snapFin.docs) {
            const finRef = doc(db, "financeiro", docFin.id);
            await setDoc(finRef, {
              valorBase: baseCal,
              percentualComissao: pct,
              valor: comValue,
              valorComissao: comValue,
              locatarioNome: formLocacao.locatarioNome,
              atualizadoEm: new Date().toISOString()
            }, { merge: true });
          }
        } catch (errFin) {
          console.warn("Erro ao atualizar financeiro pendente relacionado:", errFin);
        }
      } else {
        const res = await addDoc(collection(db, "locacoes"), locDoc);
        locacaoId = res.id;

        // Create finance transaction
        const todayStr = new Date().toISOString().split('T')[0];
        const vencimentoDay = parseInt(formLocacao.diaVencimentoAluguel || "10", 10) || 10;
        const nextMonthDate = new Date();
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        nextMonthDate.setDate(vencimentoDay);
        const vencimentoStr = nextMonthDate.toISOString().split('T')[0];

        const financeiroPayload = {
          tipo: "Receita",
          categoria: "Comissão de Locação",
          descricao: `Comissão imobiliária sobre locação do imóvel ${selectedProp.title}`,

          origem: "locacao",
          locacaoId: String(locacaoId),
          imovelId: String(formLocacao.imovelId),
          codigoImovel: String(selectedProp.codigoImovel || selectedProp.codigo || selectedProp.id || ""),
          tituloImovel: String(selectedProp.title),

          proprietarioId: String(selectedProp.ownerId || selectedProp.proprietarioId || currentUser.uid),
          proprietarioNome: String(selectedProp.emailProprietario ? selectedProp.emailProprietario.split('@')[0] : "Proprietário"),

          locatarioNome: String(formLocacao.locatarioNome),

          valorBase: baseCal,
          percentualComissao: pct,
          valor: comValue,
          valorComissao: comValue,

          status: "Pendente",
          dataCompetencia: todayStr,
          dataVencimento: vencimentoStr,
          dataPagamento: null,

          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        };

        await addDoc(collection(db, "financeiro"), financeiroPayload);
      }

      // Now update properties
      const isOnlyLocacao = selectedProp.purpose === 'Locação';
      const isVendaAndLocacao = selectedProp.purpose === 'Venda e Locação';

      let propertyStatusFields: any = {};
      if (isOnlyLocacao) {
        propertyStatusFields = {
          statusLocacao: "Alugado",
          alugado: true,
          contratoLocacaoAtivo: true,
          disponivelParaLocacao: false,
          disponivelParaVisita: false,
          disponivelParaProposta: false,
          status: "Alugado"
        };
      } else if (isVendaAndLocacao) {
        propertyStatusFields = {
          statusLocacao: "Alugado",
          alugado: true,
          contratoLocacaoAtivo: true,
          disponivelParaLocacao: false,
          disponivelParaVenda: true,
          statusVenda: "Disponível",
          vendido: false,
          status: "Disponível"
        };
      } else {
        propertyStatusFields = {
          statusLocacao: "Alugado",
          alugado: true,
          contratoLocacaoAtivo: true,
          status: "Alugado"
        };
      }

      const updatedGestaoLocacao = {
        locacaoId: locacaoId,
        statusLocacao: "Alugado",
        alugado: true,
        contratoAtivo: true,
        locacaoEmDia: true,

        locatarioNome: String(formLocacao.locatarioNome),
        locatarioCpfCnpj: String(formLocacao.locatarioCpfCnpj),
        locatarioWhatsapp: String(formLocacao.locatarioWhatsapp),
        locatarioEmail: String(formLocacao.locatarioEmail),

        dataInicioLocacao: String(formLocacao.dataInicioLocacao),
        dataFimLocacao: String(formLocacao.dataFimLocacao),
        diaVencimentoAluguel: String(formLocacao.diaVencimentoAluguel),
        garantiaLocaticia: String(formLocacao.garantiaLocaticia),

        valorAluguelContratado: baseCal,
        valorCaucao: Number(formLocacao.valorCaucaoInput || 0),

        comissaoImobiliariaPercentual: pct,
        comissaoImobiliariaValor: comValue,

        manterDisponivelParaVenda: !!formLocacao.manterDisponivelParaVenda,
        observacoesLocacao: String(formLocacao.observacoesLocacao)
      };

      const finalUpdatedProperty = {
        ...selectedProp,
        ...propertyStatusFields,
        gestaoLocacao: updatedGestaoLocacao
      };

      onUpdateProperty(finalUpdatedProperty);

      try {
        await setDoc(doc(db, "imoveis", String(selectedProp.id)), finalUpdatedProperty, { merge: true });
      } catch (errDb) {
        console.warn("Erro ao atualizar ou sincronizar imóvel diretamente:", errDb);
      }

      alert(editingLocacao ? "Locação atualizada com sucesso no sistema da RB Sorocaba!" : "Locação lançada com sucesso no sistema da RB Sorocaba!");
      setModalLancamentoLocacaoAberto(false);
      setEditingLocacao(null);
      setFormLocacao(INITIAL_FORM_LOCACAO);
      fetchLocacoes();

      // Refresh finance list
      try {
        const finDocs = await carregarFinanceiroSeguro(currentUser);
        setFinancialList(finDocs);
      } catch (errFin) {
        console.warn("Erro ao recarregar financeiro:", errFin);
      }

    } catch (error: any) {
      console.error("Erro ao salvar locação:", error);
      alert("Erro ao realizar o lançamento: " + (error.message || String(error)));
    } finally {
      setLoadingSalvarLocacao(false);
    }
  };

  const handleEncerrarLocacao = async (locacao: any) => {
    if (!window.confirm(`Tem certeza que deseja encerrar a locação de ${locacao.locatarioNome}?`)) {
      return;
    }
    try {
      const locRef = doc(db, "locacoes", locacao.id);
      await setDoc(locRef, {
        statusLocacao: "Encerrada",
        contratoAtivo: false,
        dataEncerramento: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }, { merge: true });

      const imovelId = locacao.imovelId;
      const selectedProp = properties.find(p => String(p.id) === String(imovelId));
      if (selectedProp) {
        const isOnlyLocacao = selectedProp.purpose === 'Locação';
        let propertyFields: any = {
          alugado: false,
          contratoLocacaoAtivo: false,
          statusLocacao: "Disponível para locação",
          disponivelParaLocacao: true,
          status: "Disponível"
        };

        if (isOnlyLocacao) {
          propertyFields.disponivelParaVisita = true;
          propertyFields.disponivelParaProposta = true;
        }

        const updatedGestaoLocacao = {
          ...(selectedProp.gestaoLocacao || {}),
          statusLocacao: "Encerrada",
          alugado: false,
          contratoAtivo: false,
          locacaoEmDia: true
        };

        const finalUpdatedProperty = {
          ...selectedProp,
          ...propertyFields,
          gestaoLocacao: updatedGestaoLocacao
        };

        onUpdateProperty(finalUpdatedProperty);

        try {
          await setDoc(doc(db, "imoveis", String(selectedProp.id)), finalUpdatedProperty, { merge: true });
        } catch (errDb) {
          console.warn("Erro ao atualizar o imóvel no cancelamento:", errDb);
        }
      }

      alert("Locação encerrada com sucesso!");
      fetchLocacoes();
    } catch (error: any) {
      console.error("Erro ao encerrar locação:", error);
      alert("Erro ao encerrar locação: " + (error.message || String(error)));
    }
  };

  const handleSetLocacaoStatusEmDia = async (locacao: any, emDia: boolean) => {
    try {
      const locRef = doc(db, "locacoes", locacao.id);
      await setDoc(locRef, {
        locacaoEmDia: emDia,
        atualizadoEm: new Date().toISOString()
      }, { merge: true });

      const selectedProp = properties.find(p => String(p.id) === String(locacao.imovelId));
      if (selectedProp) {
        const finalUpdatedProperty = {
          ...selectedProp,
          gestaoLocacao: {
            ...(selectedProp.gestaoLocacao || {}),
            locacaoEmDia: emDia
          }
        };
        onUpdateProperty(finalUpdatedProperty);
        try {
          await setDoc(doc(db, "imoveis", String(selectedProp.id)), finalUpdatedProperty, { merge: true });
        } catch (errDb) {
          // safe logs
        }
      }

      alert(emDia ? "Locação marcada como Adimplente / Em Dia!" : "Locação marcada com Pendência financeira.");
      fetchLocacoes();
    } catch (error: any) {
      console.error("Erro ao alterar o status financeiro de adimplência:", error);
      alert("Erro ao alterar status: " + (error.message || String(error)));
    }
  };

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isBlockingSlot, setIsBlockingSlot] = useState(false);
  const [isExportingAgenda, setIsExportingAgenda] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportEndDate, setExportEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [blockFormData, setBlockFormData] = useState({ date: '', time: '', reason: '' });
  const [priceError, setPriceError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string | number, title: string } | null>(null);

  // Gemini Integration States
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);
  const [isImprovingIA, setIsImprovingIA] = useState(false);
  const [iaSuccessMessage, setIaSuccessMessage] = useState<string | null>(null);
  const [iaErrorMessage, setIaErrorMessage] = useState<string | null>(null);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [copiedInstagram, setCopiedInstagram] = useState(false);

  // Owner specific profile state (coupled with Firestore 'proprietarios' collection)
  const [profile, setProfile] = useState({
    name: currentUser?.displayName || 'Proprietário RB Sorocaba',
    email: currentUser?.email || 'proprietario@rbsorocaba.com.br',
    phone: '(15) 99123-4567',
    whatsapp: '(15) 99123-4567',
    cpfCnpj: '123.456.789-00',
    address: 'Av. Gisele Constantino, 1850',
    city: 'Sorocaba',
    state: 'SP'
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Owner specific financial state (coupled with Firestore 'financeiro' collection)
  const [financialList, setFinancialList] = useState<any[]>([]);
  const [financialLoading, setFinancialLoading] = useState(true);

  // Dashboard real statistics states
  const [dashboardStats, setDashboardStats] = useState<{
    portfolioAtivo: number;
    leadsVisitas: number;
    receitaMensal: number;
    custosOperacionais: number;
    ultimosImoveis: any[];
    proximasVisitas: any[];
    alertas: any[];
    performance: {
      rentabilidades: { title: string; value: number; label: string; width: string }[];
      retornoGeral: number;
      investimentos: number;
      taxaOcupacao: number;
      mediaContrato: string;
      hasData: boolean;
    };
  } | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Administrative CRM States for RB Sorocaba (when isAuthorized is true)
  const [brokersList, setBrokersList] = useState<any[]>([]);
  const [brokersLoading, setBrokersLoading] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<any | null>(null);

  const [neighborhoodsList, setNeighborhoodsList] = useState<any[]>([]);
  const [neighborhoodsLoading, setNeighborhoodsLoading] = useState(false);
  const [isNeighborhoodModalOpen, setIsNeighborhoodModalOpen] = useState(false);
  const [editingNeighborhood, setEditingNeighborhood] = useState<any | null>(null);

  const [ownersList, setOwnersList] = useState<any[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<any | null>(null);

  // Users CRM States
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  
  // Form fields for adding/editing users
  const [formUser, setFormUser] = useState({
    nome: '',
    email: '',
    telefone: '',
    creci: '',
    cargo: 'Corretor',
    perfil: 'Corretor',
    status: 'Ativo',
    equipe: '',
    supervisor: '',
    foto: ''
  });

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formUser.nome || !formUser.email) {
        alert("Nome e Email são obrigatórios.");
        return;
      }
      
      const userData = {
        ...formUser,
        id: editingUser?.id || '',
        updatedAt: new Date().toISOString()
      };
      
      await salvarUsuario(editingUser?.id || null, userData);
      alert("Usuário salvo com sucesso!");
      setIsUserModalOpen(false);
      setEditingUser(null);
      setFormUser({
        nome: '',
        email: '',
        telefone: '',
        creci: '',
        cargo: 'Corretor',
        perfil: 'Corretor',
        status: 'Ativo',
        equipe: '',
        supervisor: '',
        foto: ''
      });
    } catch (err: any) {
      alert("Erro ao salvar usuário: " + err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Deseja realmente remover este usuário do CRM?")) {
      try {
        await deletarUsuario(userId);
        alert("Usuário removido com sucesso!");
      } catch (err: any) {
        alert("Erro ao remover usuário: " + err.message);
      }
    }
  };

  // Notifications States
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Frontend Permission check
  const temPermissao = (permissao: string): boolean => {
    const userRole = profile?.perfil || "Proprietário";
    const userPerms = CRM_PERMISSIONS[userRole] || [];
    if (userPerms.includes("*")) return true;
    return userPerms.includes(permissao);
  };

  const itemPermissions: Record<string, string> = {
    'dashboard': 'crm',
    'inventory': 'crm',
    'add_property_tab': 'crm',
    'rentals': 'locacoes',
    'contracts': 'contratos',
    'financial': 'financeiro_leitura',
    'visits': 'visitas',
    'submissions': 'crm',
    'brokers': 'usuarios',
    'neighborhoods': 'usuarios',
    'owners': 'crm',
    'siteSettings': 'configuracoes',
    'usuariosCRM': 'usuarios'
  };

  const isItemAllowed = (itemId: string): boolean => {
    if (profile?.perfil === "Administrador") return true;
    const reqPerm = itemPermissions[itemId];
    if (!reqPerm) return true;
    if (itemId === 'financial' && temPermissao('financeiro')) return true;
    return temPermissao(reqPerm);
  };

  const [siteSettings, setSiteSettings] = useState<any>({
    title: "RB Sorocaba Negócios Imobiliários",
    phone: "(15) 99114-3213",
    whatsapp: "+55 (15) 99114-3213",
    email: "atendimento@rbsorocaba.com.br",
    creci: "CRECI 123456-F",
    address: "Avenida Campolim, Sorocaba - SP",
    instagram: "@rbsorocabaimoveis",
    facebook: "rbsorocaba",
    linkedin: "rb-sorocaba-imoveis"
  });
  const [siteSettingsLoading, setSiteSettingsLoading] = useState(false);

  // Advanced site internal settings tabs and structures
  const [settingsSubTab, setSettingsSubTab] = useState<'home' | 'sections' | 'company' | 'options' | 'locations' | 'features' | 'appearance'>('home');
  const [activeOptionsTab, setActiveOptionsTab] = useState<'tiposImovel' | 'tiposNegocio' | 'statusImovel' | 'faixasPreco' | 'categoriasImovel'>('tiposImovel');
  const [activeLocationsTab, setActiveLocationsTab] = useState<'cidades' | 'bairros'>('cidades');
  const [activeFeaturesTab, setActiveFeaturesTab] = useState<'caracteristicas' | 'instalacoes' | 'acabamentos' | 'lazer' | 'ambientes' | 'caracteristicasApartamento' | 'caracteristicasEmpreendimento' | 'proximidades'>('caracteristicas');

  const [siteHomeSettings, setSiteHomeSettings] = useState<any>({
    homeTitle: "RB Sorocaba - Negócios Imobiliários de Alto Padrão",
    homeSubtitle: "Seu novo estilo de vida começa aqui. Encontre as melhores casas e apartamentos em Sorocaba.",
    homeBadge: "ALTO PADRÃO",
    homePrimaryButtonText: "Ver Catálogo",
    homePrimaryButtonLink: "#catalogo",
    homeSecondaryButtonText: "Falar no WhatsApp",
    homeSecondaryButtonLink: "https://wa.me/5515991143213",
    homeBackgroundImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
    homeHeroEffectEnabled: true,
    homeHighlightText: "A imobiliária de confiança da sua família",
    homeCommerceCall: "Atendimento exclusivo e personalizado de ponta a ponta"
  });

  const [siteSectionsSettings, setSiteSectionsSettings] = useState<any>({
    featuredTitle: "Imóveis em Destaque",
    featuredSubtitle: "Confira nossa seleção exclusiva de propriedades de alto padrão em Sorocaba",
    aboutTitle: "Sobre a RB Sorocaba",
    aboutText: "Com anos de experiência no mercado imobiliário de Sorocaba, nos especializamos na curadoria de imóveis de médio e alto padrão, oferecendo segurança, sofisticação e atendimento ultra-personalizado.",
    aboutImageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",
    brokersTitle: "Nossos Corretores",
    brokersSubtitle: "Profissionais altamente capacitados prontos para apresentar o seu novo lar",
    contactTitle: "Fale Conosco",
    contactSupportText: "Tem alguma dúvida ou deseja agendar uma visita especial? Deixe sua mensagem.",
    ctaTitle: "Pronto para Conquistar o Seu Espaço?",
    ctaText: "Converse com um de nossos assessores e tenha acesso a oportunidades exclusivas antes mesmo de irem ao mercado.",
    ctaButtonText: "Enviar Mensagem via WhatsApp",
    ctaButtonLink: "https://wa.me/5515991143213"
  });

  const [siteCompanySettings, setSiteCompanySettings] = useState<any>({
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
    cpfResponsavel: "000.000.000-00",
    cargoResponsavel: "Diretor Comercial",
    logoCabecalhoUrl: "",
    marcaDaguaUrl: "",
    logoRodapeUrl: "",
    faviconUrl: "",
    textoRodapeContratos: "Este documento é confidencial e exclusivo da proposta de intermediação imobiliária.",
    fraseInstitucional: "Ética, sofisticação e transparência na realização de seus sonhos."
  });

  const [siteAppearanceSettings, setSiteAppearanceSettings] = useState<any>({
    primaryColor: "#050505",
    secondaryColor: "#fb923c",
    backgroundColor: "#fcfcfc",
    textColor: "#1c1917",
    logoUrl: "https://i.postimg.cc/L6NcpGfc/ELIAS.jpg",
    navbarLogoUrl: "",
    footerLogoUrl: "",
    faviconUrl: "",
    defaultPropertyImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    defaultHeroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
    effectsEnabled: true,
    animationsEnabled: true
  });

  // Form states for administrative entities
  const [formBroker, setFormBroker] = useState({
    nome: '',
    creci: '',
    telefone: '',
    whatsapp: '',
    email: '',
    fotoUrl: '',
    foto: '',
    ativo: true
  });
  const [formNeighborhood, setFormNeighborhood] = useState({
    nome: '',
    cidade: 'Sorocaba',
    estado: 'SP',
    ativo: true
  });
  const [formOwner, setFormOwner] = useState({
    nome: '',
    cpfCnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    ativo: true
  });

  // Action methods for Brokers CRM
  const handleSaveBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formBroker.nome) {
        alert("O nome do corretor é obrigatório.");
        return;
      }
      const dataToSave = {
        nome: formBroker.nome,
        creci: formBroker.creci || "",
        telefone: formBroker.telefone || "",
        whatsapp: formBroker.whatsapp || "",
        email: formBroker.email || "",
        fotoUrl: formBroker.fotoUrl || formBroker.foto || "",
        foto: formBroker.fotoUrl || formBroker.foto || "",
        ativo: formBroker.ativo
      };
      if (editingBroker) {
        // Update existing corretor
        await setDoc(doc(db, "corretores", editingBroker.id), dataToSave, { merge: true });
        alert("Corretor atualizado com sucesso!");
      } else {
        // Add new corretor
        await addDoc(collection(db, "corretores"), dataToSave);
        alert("Corretor cadastrado com sucesso!");
      }
      setIsBrokerModalOpen(false);
      setEditingBroker(null);
      setFormBroker({ nome: '', creci: '', telefone: '', whatsapp: '', email: '', fotoUrl: '', foto: '', ativo: true });
      fetchBrokers();
    } catch (error) {
      console.error("Erro ao salvar corretor:", error);
      alert("Erro ao gravar dados do corretor.");
    }
  };

  const handleDeleteBroker = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este corretor?")) return;
    try {
      await setDoc(doc(db, "corretores", id), { ativo: false }, { merge: true }); // Soft-delete/inactivate
      alert("Corretor inativado com sucesso!");
      fetchBrokers();
    } catch (error) {
      console.error("Erro ao inativar corretor:", error);
      alert("Erro ao inativar corretor.");
    }
  };

  // Action methods for Neighborhoods CRM
  const handleSaveNeighborhood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formNeighborhood.nome) {
        alert("O nome do bairro é obrigatório.");
        return;
      }
      if (editingNeighborhood) {
        await setDoc(doc(db, "bairros", editingNeighborhood.id), {
          nome: formNeighborhood.nome,
          cidade: formNeighborhood.cidade || "Sorocaba",
          estado: formNeighborhood.estado || "SP",
          ativo: formNeighborhood.ativo
        }, { merge: true });
        alert("Bairro atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "bairros"), {
          nome: formNeighborhood.nome,
          cidade: formNeighborhood.cidade || "Sorocaba",
          estado: formNeighborhood.estado || "SP",
          ativo: formNeighborhood.ativo
        });
        alert("Bairro cadastrado com sucesso!");
      }
      setIsNeighborhoodModalOpen(false);
      setEditingNeighborhood(null);
      setFormNeighborhood({ nome: '', cidade: 'Sorocaba', estado: 'SP', ativo: true });
      fetchNeighborhoodsAll();
    } catch (error) {
      console.error("Erro ao salvar bairro:", error);
      alert("Erro ao gravar dados do bairro.");
    }
  };

  const handleDeleteNeighborhood = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este bairro?")) return;
    try {
      await setDoc(doc(db, "bairros", id), { ativo: false }, { merge: true });
      alert("Bairro inativado com sucesso!");
      fetchNeighborhoodsAll();
    } catch (error) {
      console.error("Erro ao inativar bairro:", error);
      alert("Erro ao inativar bairro.");
    }
  };

  // Action methods for Owners CRM
  const handleSaveOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formOwner.nome) {
        alert("O nome do proprietário é obrigatório.");
        return;
      }
      if (editingOwner) {
        await setDoc(doc(db, "proprietarios", editingOwner.id), {
          nome: formOwner.nome,
          cpfCnpj: formOwner.cpfCnpj || "",
          telefone: formOwner.telefone || "",
          email: formOwner.email || "",
          endereco: formOwner.endereco || "",
          ativo: formOwner.ativo
        }, { merge: true });
        alert("Proprietário atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "proprietarios"), {
          nome: formOwner.nome,
          cpfCnpj: formOwner.cpfCnpj || "",
          telefone: formOwner.telefone || "",
          email: formOwner.email || "",
          endereco: formOwner.endereco || "",
          ativo: formOwner.ativo
        });
        alert("Proprietário cadastrado com sucesso!");
      }
      setIsOwnerModalOpen(false);
      setEditingOwner(null);
      setFormOwner({ nome: '', cpfCnpj: '', telefone: '', email: '', endereco: '', ativo: true });
      fetchOwnersAll();
    } catch (error) {
      console.error("Erro ao salvar proprietário:", error);
      alert("Erro ao gravar dados do proprietário.");
    }
  };

  const handleDeleteOwner = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este proprietário?")) return;
    try {
      await setDoc(doc(db, "proprietarios", id), { ativo: false }, { merge: true });
      alert("Proprietário inativado com sucesso!");
      fetchOwnersAll();
    } catch (error) {
      console.error("Erro ao inativar proprietário:", error);
      alert("Erro ao inativar proprietário.");
    }
  };

  // Action methods for Site Settings Configuration
  const handleSaveSiteSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSiteSettingsLoading(true);

      if (settingsSubTab === 'home') {
        await setDoc(doc(db, "siteSettings", "home"), { ...siteHomeSettings, updatedAt: new Date() }, { merge: true });
      } else if (settingsSubTab === 'sections') {
        await setDoc(doc(db, "siteSettings", "sections"), { ...siteSectionsSettings, updatedAt: new Date() }, { merge: true });
      } else if (settingsSubTab === 'company') {
        await setDoc(doc(db, "siteSettings", "company"), { ...siteCompanySettings, updatedAt: new Date() }, { merge: true });
      } else if (settingsSubTab === 'appearance') {
        await setDoc(doc(db, "siteSettings", "appearance"), { ...siteAppearanceSettings, updatedAt: new Date() }, { merge: true });
      } else {
        // Fallback for security / full save
        await setDoc(doc(db, "siteSettings", "general"), siteSettings, { merge: true });
        await setDoc(doc(db, "siteSettings", "home"), { ...siteHomeSettings, updatedAt: new Date() }, { merge: true });
        await setDoc(doc(db, "siteSettings", "sections"), { ...siteSectionsSettings, updatedAt: new Date() }, { merge: true });
        await setDoc(doc(db, "siteSettings", "company"), { ...siteCompanySettings, updatedAt: new Date() }, { merge: true });
        await setDoc(doc(db, "siteSettings", "appearance"), { ...siteAppearanceSettings, updatedAt: new Date() }, { merge: true });
      }

      alert("Configurações salvas com sucesso.");
    } catch (error) {
      console.error("Erro ao gravar configurações do site:", error);
      alert("Erro ao salvar configurações.");
    } finally {
      setSiteSettingsLoading(false);
    }
  };

  // Fetch routines for new administrative panels
  const fetchSiteSettings = async () => {
    try {
      setSiteSettingsLoading(true);
      
      const settingsDocRef = doc(db, "siteSettings", "general");
      const snap = await getDoc(settingsDocRef);
      if (snap.exists()) {
        setSiteSettings(snap.data());
      }

      const homeSnap = await getDoc(doc(db, "siteSettings", "home"));
      if (homeSnap.exists()) {
        setSiteHomeSettings(homeSnap.data());
      }

      const sectionsSnap = await getDoc(doc(db, "siteSettings", "sections"));
      if (sectionsSnap.exists()) {
        setSiteSectionsSettings(sectionsSnap.data());
      }

      const companySnap = await getDoc(doc(db, "siteSettings", "company"));
      if (companySnap.exists()) {
        setSiteCompanySettings(companySnap.data());
      }

      const appearanceSnap = await getDoc(doc(db, "siteSettings", "appearance"));
      if (appearanceSnap.exists()) {
        setSiteAppearanceSettings(appearanceSnap.data());
      }
    } catch (e) {
      console.warn("Using default site settings. Collection not initialized yet:", e);
    } finally {
      setSiteSettingsLoading(false);
    }
  };

  const fetchBrokers = async () => {
    try {
      setBrokersLoading(true);
      const snap = await getDocs(collection(db, "corretores"));
      const list = snap.docs.map(docItem => ({ id: docItem.id, ...docItem.data() }));
      setBrokersList(list);
    } catch (e) {
      console.error("Error fetching brokers:", e);
    } finally {
      setBrokersLoading(false);
    }
  };

  const fetchNeighborhoodsAll = async () => {
    try {
      setNeighborhoodsLoading(true);
      const snap = await getDocs(collection(db, "bairros"));
      const list = snap.docs.map(docItem => ({ id: docItem.id, ...docItem.data() }));
      setNeighborhoodsList(list);
    } catch (e) {
      console.error("Error fetching neighborhoods:", e);
    } finally {
      setNeighborhoodsLoading(false);
    }
  };

  const fetchOwnersAll = async () => {
    try {
      setOwnersLoading(true);
      const snap = await getDocs(collection(db, "proprietarios"));
      const list = snap.docs.map(docItem => ({ id: docItem.id, ...docItem.data() }));
      setOwnersList(list);
    } catch (e) {
      console.error("Error fetching owners:", e);
    } finally {
      setOwnersLoading(false);
    }
  };

  // Auto trigger the loading sequence when administrative portal opens
  useEffect(() => {
    if (isAuthorized) {
      fetchSiteSettings();
      fetchBrokers();
      fetchNeighborhoodsAll();
      fetchOwnersAll();
    }
  }, [isAuthorized]);

  // Time slots for blocking out schedules
  const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Load submissions
  useEffect(() => {
    if (isAuthorized && activeTab === 'submissions') {
      fetchSubmissions();
    }
  }, [isAuthorized, activeTab]);

  const fetchSubmissions = async () => {
    try {
      const data = await getSubmissions();
      setSubmissions(data || []);
    } catch (error) {
      console.error("Erro ao buscar submissões:", error);
    }
  };

  // Load Profile from Firestore using safe helper
  useEffect(() => {
    if (currentUser) {
      const fetchProfile = async () => {
        try {
          const pData = await carregarPerfilSeguro(currentUser);
          if (pData) {
            setProfile(prev => {
              const mapped = {
                ...prev,
                ...pData,
                name: pData.nome || pData.name || prev.name,
                email: pData.email || prev.email,
                phone: pData.phone || pData.telefone || prev.phone,
                whatsapp: pData.whatsapp || pData.whatsappProprietario || prev.whatsapp,
                cpfCnpj: pData.cpfCnpj || pData.cpf || pData.cnpj || prev.cpfCnpj,
                address: pData.address || pData.endereco || prev.address,
                city: pData.city || pData.cidade || prev.city,
                state: pData.state || pData.estado || prev.state
              };
              return mapped;
            });
          }
        } catch (err) {
          console.warn("Erro ao buscar perfil com segurança:", err);
        }
      };
      fetchProfile();
    }
  }, [currentUser]);

  // Load Financial record history safely using multi-collection helper
  useEffect(() => {
    if (!currentUser) return;
    const fetchFinance = async () => {
      try {
        setFinancialLoading(true);
        const docs = await carregarFinanceiroSeguro(currentUser);
        setFinancialList(docs);
      } catch (err) {
        console.warn("Error safely fetching financial history:", err);
        setFinancialList([]);
      } finally {
        setFinancialLoading(false);
      }
    };
    fetchFinance();
  }, [currentUser]);

  // Helper formatting currency
  const formatCurrencyValue = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const loadDashboardData = async () => {
    try {
      setDashboardLoading(true);
      // 1. Portfolio Ativo
      let imoveisList: any[] = [];
      try {
        const snap = await getDocs(collection(db, "imoveis"));
        imoveisList = snap.docs
          .filter(d => d.id !== "init" && d.data()?.init !== true)
          .map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.error("Erro ao buscar imoveis para dashboard:", e);
        imoveisList = properties || [];
      }

      const isOwner = myProperties.length > 0;
      let ownerImoveis = isOwner 
        ? imoveisList.filter(p => p.ownerId === currentUser?.uid || p.emailProprietario === currentUser?.email || p.proprietarioId === currentUser?.uid || p.userId === currentUser?.uid || p.usuarioId === currentUser?.uid)
        : imoveisList;

      const portfolioAtivo = ownerImoveis.filter((p: any) => p.publicado === true || p.publicadoNoSite === true).length;

      // 2. Leads / Visitas
      let leadsDocs: any[] = [];
      let agendamentosDocs: any[] = [];
      let visitasDocs: any[] = [];
      let solicitacoesDocs: any[] = [];

      try {
        const snap = await getDocs(collection(db, "leads"));
        leadsDocs = snap.docs.filter(d => d.id !== "init" && d.data()?.init !== true).map(d => d.data());
      } catch (e) { console.error("Erro ao carregar leads:", e); }

      try {
        const snap = await getDocs(collection(db, "agendamentos"));
        agendamentosDocs = snap.docs.filter(d => d.id !== "init" && d.data()?.init !== true).map(d => d.data());
      } catch (e) { console.error("Erro ao carregar agendamentos:", e); }

      try {
        const snap = await getDocs(collection(db, "visitas"));
        visitasDocs = snap.docs.filter(d => d.id !== "init" && d.data()?.init !== true).map(d => d.data());
      } catch (e) { console.error("Erro ao carregar visitas:", e); }

      try {
        const snap = await getDocs(collection(db, "solicitacoes"));
        solicitacoesDocs = snap.docs.filter(d => d.id !== "init" && d.data()?.init !== true).map(d => d.data());
      } catch (e) { console.error("Erro ao carregar solicitacoes:", e); }

      if (isOwner) {
        agendamentosDocs = agendamentosDocs.filter(v => ownerImoveis.some(p => String(p.id) === String(v.propertyId)));
        visitasDocs = visitasDocs.filter(v => ownerImoveis.some(p => String(p.id) === String(v.propertyId)));
        leadsDocs = leadsDocs.filter(l => l.ownerId === currentUser?.uid || l.emailProprietario === currentUser?.email);
        solicitacoesDocs = solicitacoesDocs.filter(s => s.ownerId === currentUser?.uid || s.emailProprietario === currentUser?.email);
      }

      const totalLeadsVisitas = leadsDocs.length + agendamentosDocs.length + visitasDocs.length + solicitacoesDocs.length;

      // 3. Receita Mensal & Custos Operacionais
      let financeiroDocs: any[] = [];
      let transacoesDocs: any[] = [];
      let locacoesDocs: any[] = [];

      try {
        const snap = await getDocs(collection(db, "financeiro"));
        financeiroDocs = snap.docs.filter(d => d.id !== "init" && d.data()?.init !== true).map(d => d.data());
      } catch (e) { console.error("Erro ao carregar financeiro:", e); }

      try {
        const snap = await getDocs(collection(db, "transacoesFinanceiras"));
        transacoesDocs = snap.docs.filter(d => d.id !== "init" && d.data()?.init !== true).map(d => d.data());
      } catch (e) { console.error("Erro ao carregar transacoesFinanceiras:", e); }

      try {
        const snap = await getDocs(collection(db, "locacoes"));
        locacoesDocs = snap.docs.filter(d => d.id !== "init" && d.data()?.init !== true).map(d => d.data());
      } catch (e) { console.error("Erro ao carregar locacoes:", e); }

      if (isOwner) {
        const email = currentUser?.email?.toLowerCase();
        const uid = currentUser?.uid;
        const belongsToOwner = (f: any) => f.emailProprietario === email || f.proprietarioEmail === email || f.proprietarioId === uid || f.ownerId === uid || f.userId === uid || f.usuarioId === uid;
        financeiroDocs = financeiroDocs.filter(belongsToOwner);
        transacoesDocs = transacoesDocs.filter(belongsToOwner);
        locacoesDocs = locacoesDocs.filter(belongsToOwner);
      }

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const isDateInCurrentMonth = (d: any) => {
        if (!d) return false;
        let dateObj: Date;
        if (typeof d === 'string') {
          dateObj = new Date(d);
          if (isNaN(dateObj.getTime())) {
            const parts = d.split('/');
            if (parts.length === 3) {
              dateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
          }
        } else if (d && d.seconds !== undefined) {
          dateObj = new Date(d.seconds * 1000);
        } else if (d instanceof Date) {
          dateObj = d;
        } else {
          dateObj = new Date(d);
        }
        if (isNaN(dateObj.getTime())) return false;
        return dateObj.getFullYear() === currentYear && (dateObj.getMonth() + 1) === currentMonth;
      };

      const parseNumericValue = (val: any) => {
        if (val === undefined || val === null) return 0;
        if (typeof val === 'number') return val;
        let str = String(val).replace(/R\$\s*/gi, '').trim();
        if (str.includes(',') && (str.indexOf(',') > str.indexOf('.'))) {
          str = str.replace(/\./g, '').replace(/,/g, '.');
        }
        const num = Number(str);
        return isNaN(num) ? 0 : num;
      };

      const filterReceita = (f: any) => {
        const tipoMatch = String(f.tipo || f.type || '').toLowerCase() === "receita";
        const statusStr = String(f.status || '').toLowerCase();
        const statusMatch = statusStr === "recebido" || statusStr === "pago" || statusStr === "confirmado";
        const dateMatch = isDateInCurrentMonth(f.date || f.data || f.vencimento || f.createdAt || f.criadoEm);
        return tipoMatch && statusMatch && dateMatch;
      };

      const receitaMensalFin = financeiroDocs.filter(filterReceita).reduce((sum, f) => sum + parseNumericValue(f.value || f.valor || f.valorAluguel), 0);
      const receitaMensalTrx = transacoesDocs.filter(filterReceita).reduce((sum, f) => sum + parseNumericValue(f.value || f.valor), 0);
      
      const locacoesReceitas = locacoesDocs.filter(l => {
        const statusStr = String(l.status || '').toLowerCase();
        const isPaid = statusStr === "recebido" || statusStr === "pago" || statusStr === "confirmado" || statusStr === "ativo";
        const dateMatch = isDateInCurrentMonth(l.vencimento || l.vencimentoData || l.dataPagamento || l.startedAt || l.createdAt);
        return isPaid && dateMatch;
      }).reduce((sum, l) => sum + parseNumericValue(l.valorAluguel || l.valor || l.valorTotalMensal), 0);

      const totalReceitaMensal = receitaMensalFin + receitaMensalTrx + locacoesReceitas;

      const filterDespesa = (f: any) => {
        const tipoMatch = String(f.tipo || f.type || '').toLowerCase() === "despesa";
        const statusStr = String(f.status || '').toLowerCase();
        const statusMatch = statusStr === "pago" || statusStr === "confirmado";
        const dateMatch = isDateInCurrentMonth(f.date || f.data || f.vencimento || f.createdAt || f.criadoEm);
        return tipoMatch && statusMatch && dateMatch;
      };

      const despesasFin = financeiroDocs.filter(filterDespesa).reduce((sum, f) => sum + parseNumericValue(f.value || f.valor), 0);
      const despesasTrx = transacoesDocs.filter(filterDespesa).reduce((sum, f) => sum + parseNumericValue(f.value || f.valor), 0);
      const totalCustosOperacionais = despesasFin + despesasTrx;

      // 4. Ultimos Imoveis Cadastrados
      const sortedImoveis = [...ownerImoveis]
        .filter(p => p.id !== "init" && p.init !== true)
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      const ultimosImoveis = sortedImoveis.slice(0, 5);

      // 5. Próximas Visitas Agendadas
      const compareDatesAsc = (a: any, b: any) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      };

      const normalizeVisitsObj = (docs: any[]) => {
        return docs.map(d => ({
          name: d.name || d.nomeCliente || d.clientName || d.solicitanteNome || "Cliente Solicitante",
          date: d.date || d.data || "",
          time: d.time || d.horario || d.hora || "",
          status: d.status || "pending",
          propertyId: d.propertyId || d.imovelId || ""
        }));
      };

      const parsedVisits = [
        ...normalizeVisitsObj(agendamentosDocs),
        ...normalizeVisitsObj(visitasDocs)
      ];

      const todayStr = now.toISOString().split('T')[0];
      const proximasVisitas = parsedVisits
        .filter(v => v.date && v.date >= todayStr)
        .sort(compareDatesAsc);

      // 6. Alertas do Sistema
      const alertas: any[] = [];
      
      const imoveisSemFoto = ownerImoveis.filter(p => !p.image || p.image.includes("placeholder") || p.image === "");
      if (imoveisSemFoto.length > 0) {
        alertas.push({
          id: "sem-foto",
          type: "rose",
          title: "Imóveis Sem Foto",
          description: `Existem ${imoveisSemFoto.length} imóveis cadastrados que não possuem foto principal vinculada.`
        });
      }

      const imoveisSemDescricao = ownerImoveis.filter(p => (p.publicado || p.publicadoNoSite) && (!p.description || p.description.trim().length < 10));
      if (imoveisSemDescricao.length > 0) {
        alertas.push({
          id: "sem-descricao",
          type: "amber",
          title: "Imóveis Sem Descrição",
          description: `Existem ${imoveisSemDescricao.length} imóveis publicados sem descrição detalhada preenchida.`
        });
      }

      const visitasPendentesCount = proximasVisitas.filter(v => v.status === "pending" || v.status === "Pendente").length;
      if (visitasPendentesCount > 0) {
        alertas.push({
          id: "visitas-pendentes",
          type: "amber",
          title: "Visitas Pendentes",
          description: `Sua agenda possui ${visitasPendentesCount} visitas pendentes aguardando confirmação ativa.`
        });
      }

      const leadsSemResposta = leadsDocs.filter(l => l.status === "pending" || l.status === "novo" || l.status === "Novo");
      if (leadsSemResposta.length > 0) {
        alertas.push({
          id: "leads-sem-resposta",
          type: "amber",
          title: "Leads Sem Resposta",
          description: `Existem ${leadsSemResposta.length} leads novos que necessitam de atendimento.`
        });
      }

      const financeiroPendenteCount = [...financeiroDocs, ...transacoesDocs].filter(f => {
        const state = String(f.status || '').toLowerCase();
        return state === "pendente" || state === "atrasado";
      }).length;
      if (financeiroPendenteCount > 0) {
        alertas.push({
          id: "financeiro-pendente",
          type: "rose",
          title: "Financeiro Pendente",
          description: `Existem ${financeiroPendenteCount} lançamentos financeiros marcados como pendentes.`
        });
      }

      // 7. Performance Financeira real data calculations
      const allFinancials = [...financeiroDocs, ...transacoesDocs];
      const hasFinanceData = allFinancials.length > 0;
      
      let performanceObj = {
        rentabilidades: [] as any[],
        retornoGeral: 0,
        investimentos: 0,
        taxaOcupacao: 0,
        mediaContrato: "Conforme contrato",
        hasData: hasFinanceData
      };

      if (hasFinanceData) {
        const totalReceitasAllTime = allFinancials
          .filter(f => String(f.tipo || f.type || '').toLowerCase() === "receita" && (String(f.status || '').toLowerCase() === "recebido" || String(f.status || '').toLowerCase() === "pago" || String(f.status || '').toLowerCase() === "confirmado"))
          .reduce((sum, f) => sum + parseNumericValue(f.value || f.valor), 0);

        const totalDespesasAllTime = allFinancials
          .filter(f => String(f.tipo || f.type || '').toLowerCase() === "despesa" && (String(f.status || '').toLowerCase() === "pago" || String(f.status || '').toLowerCase() === "confirmado"))
          .reduce((sum, f) => sum + parseNumericValue(f.value || f.valor), 0);

        const retornoGeral = totalReceitasAllTime - totalDespesasAllTime;
        const investimentos = totalDespesasAllTime;

        const totalImoveisCount = ownerImoveis.length;
        const alugadosCount = ownerImoveis.filter((p: any) => p.alugado === true || p.statusLocacao?.toLowerCase() === "alugado" || p.status === "Alugado").length;
        const taxaOcupacao = totalImoveisCount > 0 ? (alugadosCount / totalImoveisCount) * 100 : 0;

        const receitasPorImovel: Record<string, number> = {};
        allFinancials
          .filter(f => String(f.tipo || f.type || '').toLowerCase() === "receita")
          .forEach(f => {
            const label = f.propertyName || f.propertyTitle || f.descricao || "Outras Receitas";
            receitasPorImovel[label] = (receitasPorImovel[label] || 0) + parseNumericValue(f.value || f.valor);
          });

        const sortedRentabilidades = Object.entries(receitasPorImovel)
          .map(([title, val]) => ({
            title,
            value: val,
            percent: totalReceitasAllTime > 0 ? Math.round((val / totalReceitasAllTime) * 100) : 0
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 3);

        const rentabilidades = sortedRentabilidades.map(item => ({
          title: item.title,
          value: item.value,
          label: `${formatCurrencyValue(item.value)} / ${item.percent}%`,
          width: `${item.percent}%`
        }));

        performanceObj = {
          rentabilidades,
          retornoGeral,
          investimentos,
          taxaOcupacao: Number(taxaOcupacao.toFixed(1)),
          mediaContrato: "30 Meses",
          hasData: rentabilidades.length > 0
        };
      }

      setDashboardStats({
        portfolioAtivo,
        leadsVisitas: totalLeadsVisitas,
        receitaMensal: totalReceitaMensal,
        custosOperacionais: totalCustosOperacionais,
        ultimosImoveis,
        proximasVisitas,
        alertas,
        performance: performanceObj
      });
      setDashboardLoading(false);
      setDashboardError(null);

      return {
        portfolioAtivo,
        leadsVisitas: totalLeadsVisitas,
        receitaMensal: totalReceitaMensal,
        custosOperacionais: totalCustosOperacionais,
        ultimosImoveis,
        proximasVisitas,
        alertas
      };
    } catch (err: any) {
      console.error("Erro em loadDashboardData:", err);
      setDashboardError("Erro discreto: não foi possível carregar os dados totais do dashboard.");
      setDashboardLoading(false);
      
      return {
        portfolioAtivo: 0,
        leadsVisitas: 0,
        receitaMensal: 0,
        custosOperacionais: 0,
        ultimosImoveis: [],
        proximasVisitas: [],
        alertas: []
      };
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    loadDashboardData();
  }, [currentUser, properties, scheduledVisits, financialList]);

  // Load CRM Users and in-app Notifications in real-time
  useEffect(() => {
    if (!currentUser) return;

    setUsersLoading(true);
    const unsubUsers = subscribeToUsers((users) => {
      setUsersList(users);
      setUsersLoading(false);
    });

    const email = currentUser.email || '';
    const userRole = profile?.perfil || "Proprietário";
    const unsubNotifs = subscribeToNotifications((notifs) => {
      setNotificationsList(notifs);
    }, email, userRole);

    return () => {
      unsubUsers();
      unsubNotifs();
    };
  }, [currentUser, profile?.perfil]);

  // Profile Save handler
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingProfile(true);
    try {
      const docRef = doc(db, "proprietarios", currentUser.uid);
      await setDoc(docRef, profile);
      alert("Perfil do proprietário salvo com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao gravar perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Filter properties of this specific owner
  const myProperties = useMemo(() => {
    return properties.filter(p => {
      const isOwner = p.ownerId === currentUser?.uid || 
                     p.emailProprietario === currentUser?.email ||
                     p.proprietarioId === currentUser?.uid ||
                     p.userId === currentUser?.uid ||
                     p.usuarioId === currentUser?.uid;
      return isOwner;
    });
  }, [properties, currentUser]);

  // If no specific owner associations, fallback to showing all for whitelisted admins
  const displayedProperties = useMemo(() => {
    if (myProperties.length === 0) {
      return properties; // admin sees all
    }
    return myProperties;
  }, [myProperties, properties]);

  // Filter current owner submissions & visits for isolation
  const mySubmissions = useMemo(() => {
    return submissions.filter(s => {
      if (myProperties.length === 0) return true; // admin fallback
      return s.ownerId === currentUser?.uid || s.emailProprietario === currentUser?.email || s.proprietarioId === currentUser?.uid;
    });
  }, [submissions, currentUser, myProperties]);

  const myVisits = useMemo(() => {
    return scheduledVisits.filter(v => {
      if (myProperties.length === 0) return true; // admin fallback
      // Match by property code/id in owner listings or explicit owner properties
      return myProperties.some(p => String(p.id) === String(v.propertyId));
    });
  }, [scheduledVisits, myProperties]);

  // Calculated Metrics of the Owner's Portfolio
  const totalValueInPortfolio = useMemo(() => {
    return displayedProperties.reduce((acc, p) => acc + (p.priceValue || 0), 0);
  }, [displayedProperties]);

  const activePropertiesCount = useMemo(() => {
    return displayedProperties.filter(p => p.status === 'Disponível' || p.status === 'ativo').length;
  }, [displayedProperties]);

  const soldPropertiesCount = useMemo(() => {
    return displayedProperties.filter(p => p.status === 'Vendido' || p.status === 'vendido').length;
  }, [displayedProperties]);

  // Derived financial summary cards values
  const financialTotals = useMemo(() => {
    const received = financialList.filter(f => f.status === 'Recebido').reduce((sum, f) => sum + (f.value || 0), 0);
    const pending = financialList.filter(f => f.status === 'Pendente').reduce((sum, f) => sum + (f.value || 0), 0);
    const predicted = received + pending;
    return {
      portfolio: totalValueInPortfolio,
      received,
      pending,
      predicted
    };
  }, [financialList, totalValueInPortfolio]);

  const handleApprove = async (submission: any) => {
    try {
      await approveProperty(submission.id);
      const { id, status, submittedAt, ...propertyData } = submission;
      onAddProperty(propertyData);
      fetchSubmissions();
      alert("Imóvel aprovado e publicado com sucesso!");
    } catch (error) {
      alert("Erro ao aprovar imóvel.");
    }
  };

  const handleReject = async (id: string) => {
    if (confirm("Deseja realmente rejeitar esta submissão?")) {
      try {
        await rejectProperty(id);
        fetchSubmissions();
      } catch (error) {
        alert("Erro ao rejeitar imóvel.");
      }
    }
  };

  // --- AUTOMATION STATUS FUNCTIONS & HELPER RULES ---
  const applyStatusRules = (status: string, tipoNegocio: string, currentData: any) => {
    const updated = { ...currentData };
    updated.status = status;
    updated.statusImovel = status;

    if (status === "Disponível") {
      updated.vendido = false;
      updated.alugado = false;
      updated.reservado = false;
      updated.indisponivel = false;
      updated.emNegociacao = false;
      updated.disponivelParaVisita = true;
      updated.disponivelParaProposta = true;
      updated.publicado = true;
      updated.publicadoNoSite = true;

      if (tipoNegocio === "Venda") {
        updated.disponivelParaVenda = true;
        updated.disponivelParaLocacao = false;
        updated.statusVenda = "Disponível";
        updated.statusLocacao = "";
      } else if (tipoNegocio === "Locação") {
        updated.disponivelParaVenda = false;
        updated.disponivelParaLocacao = true;
        updated.statusVenda = "";
        updated.statusLocacao = "Disponível";
      } else if (tipoNegocio === "Venda e Locação") {
        updated.disponivelParaVenda = true;
        updated.disponivelParaLocacao = true;
        updated.statusVenda = "Disponível";
        updated.statusLocacao = "Disponível";
      }
    } else if (status === "Alugado") {
      updated.alugado = true;
      updated.vendido = false;
      updated.reservado = false;
      updated.statusLocacao = "Alugado";
      updated.disponivelParaLocacao = false;
      updated.disponivelParaVisita = false;

      if (tipoNegocio === "Locação") {
        updated.disponivelParaVenda = false;
        updated.statusVenda = "";
      } else if (tipoNegocio === "Venda e Locação") {
        updated.vendido = false;
        updated.statusVenda = "Disponível";
        updated.disponivelParaVenda = true;
        updated.publicado = true;
        updated.publicadoNoSite = true;
      }
    } else if (status === "Vendido") {
      updated.vendido = true;
      updated.reservado = false;
      if (tipoNegocio !== "Venda e Locação") {
        updated.alugado = false;
      }
      updated.statusVenda = "Vendido";
      updated.disponivelParaVenda = false;
      updated.disponivelParaLocacao = false;
      updated.disponivelParaVisita = false;
      updated.disponivelParaProposta = false;
      updated.mostrarBadgeVendido = true;
    } else if (status === "Reservado") {
      updated.reservado = true;
      updated.vendido = false;
      updated.alugado = false;
      updated.disponivelParaProposta = false;
      updated.disponivelParaVisita = false;
      updated.publicado = true;
      updated.publicadoNoSite = true;
    } else if (status === "Indisponível") {
      updated.indisponivel = true;
      updated.publicado = false;
      updated.publicadoNoSite = false;
      updated.disponivelParaVenda = false;
      updated.disponivelParaLocacao = false;
      updated.disponivelParaVisita = false;
      updated.disponivelParaProposta = false;
    } else if (status === "Em negociação") {
      updated.emNegociacao = true;
      updated.reservado = false;
      updated.vendido = false;
      updated.alugado = false;
      updated.publicado = true;
      updated.publicadoNoSite = true;
    } else if (status === "Rascunho") {
      updated.publicado = false;
      updated.publicadoNoSite = false;
      updated.disponivelParaVenda = false;
      updated.disponivelParaLocacao = false;
      updated.disponivelParaVisita = false;
      updated.disponivelParaProposta = false;
    }

    return updated;
  };

  const checkExistingActiveRental = async (imovelId: string) => {
    if (!imovelId) return null;
    const q = query(
      collection(db, "locacoes"),
      where("imovelId", "==", String(imovelId)),
      where("status", "==", "Ativa")
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
    return null;
  };

  const checkExistingSale = async (imovelId: string) => {
    if (!imovelId) return null;
    const q = query(
      collection(db, "vendas"),
      where("imovelId", "==", String(imovelId))
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
    return null;
  };

  const createAutomaticRentalFromProperty = async (imovel: any, forceNew: boolean = false, updateExistingId?: string) => {
    const rentalValue = Number(imovel.autoValorAluguelMensal || imovel.valorAluguel || 0);
    const commissionPercentage = Number(imovel.autoPercentualComissao || 10);
    const commissionValue = rentalValue * (commissionPercentage / 100);

    const locDoc = {
      imovelId: String(imovel.id),
      codigoImovel: String(imovel.codigoImovel || imovel.codigo || ""),
      tituloImovel: String(imovel.title || imovel.titulo || ""),
      tipoImovel: String(imovel.type || imovel.tipoImovel || ""),
      enderecoImovel: String(imovel.endereco || ""),
      bairroImovel: String(imovel.bairro || imovel.neighborhood || ""),
      cidadeImovel: String(imovel.cidade || imovel.city || "Sorocaba"),
      
      proprietarioId: String(imovel.ownerId || imovel.proprietarioId || ""),
      proprietarioNome: String(imovel.nomeProprietario || imovel.emailProprietario?.split('@')[0] || "Proprietário"),
      proprietarioEmail: String(imovel.emailProprietarioForm || imovel.emailProprietario || ""),
      proprietarioTelefone: String(imovel.telefoneProprietario || imovel.whatsappProprietario || ""),
      
      locatarioNome: String(imovel.autoLocatarioNome || ""),
      locatarioCpfCnpj: String(imovel.autoLocatarioCpfCnpj || ""),
      locatarioTelefone: String(imovel.autoLocatarioTelefone || ""),
      locatarioEmail: String(imovel.autoLocatarioEmail || ""),
      
      dataInicio: String(imovel.autoDataInicio || ""),
      dataFim: String(imovel.autoDataFim || ""),
      diaVencimento: String(imovel.autoDiaVencimento || "10"),
      
      valorAluguelMensal: rentalValue,
      valorCondominio: Number(imovel.autoValorCondominio || imovel.valorCondominio || 0),
      valorIptu: Number(imovel.autoValorIptu || imovel.valorIptuAnual || 0),
      taxaLixo: Number(imovel.autoTaxaLixo || imovel.taxaLixoAnual || 0),
      taxaAgua: Number(imovel.autoTaxaAgua || 0),
      taxaLuz: Number(imovel.autoTaxaLuz || 0),
      taxaGas: Number(imovel.autoTaxaGas || 0),
      seguroIncendio: Number(imovel.autoSeguroIncendio || 0),
      
      percentualComissao: commissionPercentage,
      valorComissao: commissionValue,
      
      status: "Ativa",
      origem: "cadastro_imovel_status_alugado",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let rentalId = updateExistingId;
    if (updateExistingId && !forceNew) {
      await setDoc(doc(db, "locacoes", updateExistingId), {
        ...locDoc,
        createdAt: imovel._existingRentalCreatedAt || locDoc.createdAt
      }, { merge: true });
    } else {
      const resRef = await addDoc(collection(db, "locacoes"), locDoc);
      rentalId = resRef.id;
    }

    const fullLocacaoObj = { ...locDoc, id: rentalId };
    await createFinancialEntryFromRental(fullLocacaoObj);

    return rentalId;
  };

  const createFinancialEntryFromRental = async (locacao: any) => {
    const rentalValue = Number(locacao.valorAluguelMensal || 0);
    const comPercent = Number(locacao.percentualComissao || 0);
    const comValue = rentalValue * (comPercent / 100);

    const qFin = query(
      collection(db, "financeiro"),
      where("locacaoId", "==", String(locacao.id)),
      where("status", "==", "Pendente")
    );
    const snapFin = await getDocs(qFin);

    const today = new Date();
    const competenciaMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const vencDay = parseInt(locacao.diaVencimento || "10", 10) || 10;
    const vencDate = new Date();
    vencDate.setDate(vencDay);
    if (vencDate < today) {
      vencDate.setMonth(vencDate.getMonth() + 1);
    }
    const vencimentoStr = vencDate.toISOString().split('T')[0];

    const payload = {
      tipo: "Receita",
      categoria: "Comissão de Locação",
      origem: "locacao",
      locacaoId: String(locacao.id),
      imovelId: String(locacao.imovelId),
      codigoImovel: String(locacao.codigoImovel),
      descricao: `Comissão de locação do imóvel ${locacao.codigoImovel}`,
      valorBase: rentalValue,
      percentualComissao: comPercent,
      valor: comValue,
      status: "Pendente",
      dataCompetencia: competenciaMonth,
      dataVencimento: vencimentoStr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!snapFin.empty) {
      const existingFinId = snapFin.docs[0].id;
      await setDoc(doc(db, "financeiro", existingFinId), {
        ...payload,
        createdAt: snapFin.docs[0].data().createdAt || payload.createdAt
      }, { merge: true });
    } else {
      await addDoc(collection(db, "financeiro"), payload);
    }
  };

  const createAutomaticSaleFromProperty = async (imovel: any, forceNew: boolean = false, updateExistingId?: string) => {
    const finalPrice = Number(imovel.autoValorFinalVenda || imovel.valorVenda || 0);
    const commissionPercentage = Number(imovel.autoPercentualComissaoVenda || 6);
    const commissionValue = finalPrice * (commissionPercentage / 100);

    const saleDoc = {
      imovelId: String(imovel.id),
      codigoImovel: String(imovel.codigoImovel || imovel.codigo || ""),
      compradorNome: String(imovel.autoCompradorNome || ""),
      compradorCpfCnpj: String(imovel.autoCompradorCpfCnpj || ""),
      compradorTelefone: String(imovel.autoCompradorTelefone || ""),
      compradorEmail: String(imovel.autoCompradorEmail || ""),
      dataVenda: String(imovel.autoDataVenda || new Date().toISOString().split('T')[0]),
      valorFinalVenda: finalPrice,
      percentualComissao: commissionPercentage,
      valorComissao: commissionValue,
      formaPagamento: String(imovel.autoFormaPagamento || "À Vista"),
      status: "Concluída",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let saleId = updateExistingId;
    if (updateExistingId && !forceNew) {
      await setDoc(doc(db, "vendas", updateExistingId), {
        ...saleDoc,
        createdAt: imovel._existingSaleCreatedAt || saleDoc.createdAt
      }, { merge: true });
    } else {
      const resRef = await addDoc(collection(db, "vendas"), saleDoc);
      saleId = resRef.id;
    }

    const fullSaleObj = { ...saleDoc, id: saleId };
    await createFinancialEntryFromSale(fullSaleObj);

    return saleId;
  };

  const createFinancialEntryFromSale = async (venda: any) => {
    const finalPrice = Number(venda.valorFinalVenda || 0);
    const comPercent = Number(venda.percentualComissao || 0);
    const comValue = finalPrice * (comPercent / 100);

    const qFin = query(
      collection(db, "financeiro"),
      where("vendaId", "==", String(venda.id)),
      where("status", "==", "Pendente")
    );
    const snapFin = await getDocs(qFin);

    const competenciaMonth = venda.dataVenda ? venda.dataVenda.substring(0, 7) : new Date().toISOString().substring(0, 7);

    const payload = {
      tipo: "Receita",
      categoria: "Comissão de Venda",
      origem: "venda",
      vendaId: String(venda.id),
      imovelId: String(venda.imovelId),
      codigoImovel: String(venda.codigoImovel),
      descricao: `Comissão de venda do imóvel ${venda.codigoImovel}`,
      valorBase: finalPrice,
      percentualComissao: comPercent,
      valor: comValue,
      status: "Pendente",
      dataCompetencia: competenciaMonth,
      dataVencimento: venda.dataVenda || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!snapFin.empty) {
      const existingFinId = snapFin.docs[0].id;
      await setDoc(doc(db, "financeiro", existingFinId), {
        ...payload,
        createdAt: snapFin.docs[0].data().createdAt || payload.createdAt
      }, { merge: true });
    } else {
      await addDoc(collection(db, "financeiro"), payload);
    }
  };

  const [duplicationWarning, setDuplicationWarning] = useState<any | null>(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [newProperty, setNewProperty] = useState<any>({
    title: '',
    description: '',
    cep: '',
    endereco: '',
    location: '',
    numero: '',
    complemento: '',
    bairro: '',
    neighborhood: '',
    cidade: 'Sorocaba',
    city: 'Sorocaba',
    estado: 'SP',
    state: 'SP',
    latitude: '',
    longitude: '',
    referencia: '',
    condominium: '',
    condoValue: '',
    purpose: 'Venda',
    acceptsFinancing: false,
    price: '',
    priceValue: 0,
    category: 'Residencial',
    type: 'Casa',
    propertyType: 'Casa',
    beds: 0,
    suites: 0,
    baths: 0,
    lavabos: 0,
    salas: 0,
    parkingCovered: 0,
    parkingUncovered: 0,
    area: '',
    areaTotal: '',
    areaUseful: '',
    areaConstruida: '',
    areaTerreno: '',
    pavimentos: 0,
    andar: 0,
    torres: 0,
    unidadesPorAndar: 0,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
    additionalImages: [],
    videoUrl: '',
    coords: [-23.5018, -47.4581],
    status: 'Disponível',
    featured: false,

    // NEW FIELDS FOR ALL SECTIONS
    codigoImovel: '',
    matricula: '',
    cri: '',
    valorVenda: 0,
    valorAluguel: 0,
    valorCondominio: 0,
    valorIptuAnual: 0,
    taxaLixoAnual: 0,
    taxaGas: 0,
    taxaAgua: 0,
    taxaLuz: 0,
    seguroIncendio: 0,
    taxasAdicionais: 0,
    valorTotalMensal: 0,
    garantiaLocaticia: '',
    permitePet: 'Sim',
    mobiliadoSelect: 'Não mobiliado',
    tempoMinimoContrato: '',
    disponivelParaVisitaForm: 'Sim',
    statusLocacao: '',
    observacoesLocacao: '',

    eEdificio: false,
    estaEmCondominio: false,
    aceitaFinanciamento: false,
    aceitaPermuta: false,
    eMobiliado: false,
    imovelAlugado: false,

    // Lists
    caracteristicas: [],
    ambientes: [],
    caracteristicasEmpreendimento: [],
    lazer: [],
    instalacoes: [],
    acabamentos: [],
    proximidades: [],

    // Proprietario Info
    nomeProprietario: '',
    cpfCnpjProprietario: '',
    rgIeProprietario: '',
    telefoneProprietario: '',
    whatsappProprietario: '',
    emailProprietarioForm: '',
    enderecoProprietario: '',
    cidadeProprietario: 'Sorocaba',
    estadoProprietario: 'SP',
    cepProprietario: '',
    possuiConjuge: false,
    
    nomeConjuge: '',
    cpfConjuge: '',
    rgConjuge: '',
    profissaoConjuge: '',
    estadoCivilConjuge: 'Casado(a)',
    telefoneConjuge: '',
    emailConjuge: '',
    enderecoConjuge: '',

    // Publication
    publicado: true,
    publicadoNoSite: true,
    mostrarNosFiltros: true,
    mostrarValorNoSite: true,
    destaque: false,
    destaqueNaHome: false,
    mostrarCatalogo: true,
    disponivelParaVisita: true,
    disponivelParaProposta: true,
    vendido: false,
    tituloAnuncio: '',
    subtituloAnuncio: '',
    descricaoCurta: '',
    descricaoDetalhada: '',
    diferenciaisAnuncio: '',
    textoWhatsapp: '',
    textoInstagram: '',
    tituloSEO: '',
    descricaoSEO: '',
    palavrasChaveSEO: ''
  });

  const [codigoPreview, setCodigoPreview] = useState<string>('');

  useEffect(() => {
    if (editingId === null && (newProperty.type || newProperty.propertyType)) {
      const tipo = newProperty.type || newProperty.propertyType || "Casa";
      obterPreviaCodigoImovel(tipo).then(res => {
        setCodigoPreview(res);
        setNewProperty((prev: any) => ({
          ...prev,
          codigoImovel: res,
          codigo: res
        }));
      });
    }
  }, [newProperty.type, newProperty.propertyType, editingId]);

  const getCodigoPublicoImovel = (p: Property) => {
    return p.codigoImovel || p.id;
  };

  const handleCopyLink = (p: Property) => {
    const code = getCodigoPublicoImovel(p);
    const link = `${window.location.origin}/imovel/${code}`;
    navigator.clipboard.writeText(link);
    alert(`Link copiado com sucesso para o imóvel ${code}!`);
  };

  async function buscarCoordenadasPorEndereco(enderecoCompleto: string) {
    if (!enderecoCompleto) return;
    try {
      setLoadingGeo(true);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoCompleto)}&limit=1`;
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json"
        }
      });
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const local = data[0];
        const latVal = local.lat || "";
        const lonVal = local.lon || "";

        setNewProperty((prev: any) => ({
          ...prev,
          latitude: latVal,
          longitude: lonVal,
          coords: latVal && lonVal ? [Number(latVal), Number(lonVal)] : prev.coords
        }));
      } else {
        console.warn("Coordenadas não encontradas para:", enderecoCompleto);
      }
    } catch (error) {
      console.error("Erro ao buscar coordenadas:", error);
    } finally {
      setLoadingGeo(false);
    }
  }

  async function buscarEnderecoPorCep(cepDigitado: string) {
    const cepLimpo = String(cepDigitado || "").replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    try {
      setLoadingCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert("CEP não encontrado.");
        return;
      }

      const logradouro = data.logradouro || "";
      const bairro = data.bairro || "";
      const localidade = data.localidade || "Sorocaba";
      const uf = data.uf || "SP";

      setNewProperty((prev: any) => ({
        ...prev,
        cep: cepLimpo,
        endereco: logradouro || prev.endereco || "",
        location: logradouro || prev.location || "",
        bairro: bairro || prev.bairro || "",
        neighborhood: bairro || prev.neighborhood || "",
        cidade: localidade || "Sorocaba",
        city: localidade || "Sorocaba",
        estado: uf || "SP",
        state: uf || "SP"
      }));

      const enderecoCompleto = [
        logradouro,
        bairro,
        localidade,
        uf,
        "Brasil"
      ].filter(Boolean).join(", ");

      buscarCoordenadasPorEndereco(enderecoCompleto);
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      alert("Não foi possível buscar o CEP agora.");
    } finally {
      setLoadingCep(false);
    }
  }

  function handleCepChange(e: React.ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value;
    const cepLimpo = valor.replace(/\D/g, "");
    setNewProperty((prev: any) => ({
      ...prev,
      cep: cepLimpo
    }));
    if (cepLimpo.length === 8) {
      buscarEnderecoPorCep(cepLimpo);
    }
  }

  function formatarCep(value: string | undefined | null) {
    const numeros = String(value || "").replace(/\D/g, "").slice(0, 8);
    if (numeros.length <= 5) return numeros;
    return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
  }

  function montarEnderecoCompletoParaGeo(dados: any) {
    return [
      dados.endereco || dados.location,
      dados.numero,
      dados.bairro || dados.neighborhood,
      dados.cidade || dados.city || "Sorocaba",
      dados.estado || dados.state || "SP",
      "Brasil"
    ].filter(Boolean).join(", ");
  }

  useEffect(() => {
    const valorAluguel = Number(newProperty.valorAluguel || 0);
    const valorCondominio = Number(newProperty.valorCondominio || 0);
    const iptuMensal = Number(newProperty.valorIptuAnual || 0) / 12;
    const taxaLixoMensal = Number(newProperty.taxaLixoAnual || 0) / 12;
    const taxaGas = Number(newProperty.taxaGas || 0);
    const taxaAgua = Number(newProperty.taxaAgua || 0);
    const taxaLuz = Number(newProperty.taxaLuz || 0);
    const seguroIncendio = Number(newProperty.seguroIncendio || 0);
    const taxasAdicionais = Number(newProperty.taxasAdicionais || 0);

    const calculatedTotal = Math.round(
      valorAluguel + 
      valorCondominio + 
      iptuMensal + 
      taxaLixoMensal + 
      taxaGas + 
      taxaAgua + 
      taxaLuz + 
      seguroIncendio + 
      taxasAdicionais
    );

    // Only update if it actually changed to prevent infinite loops
    if (newProperty.valorTotalMensal !== calculatedTotal) {
      setNewProperty((prev: any) => ({
        ...prev,
        valorTotalMensal: calculatedTotal
      }));
    }
  }, [
    newProperty.valorAluguel,
    newProperty.valorCondominio,
    newProperty.valorIptuAnual,
    newProperty.taxaLixoAnual,
    newProperty.taxaGas,
    newProperty.taxaAgua,
    newProperty.taxaLuz,
    newProperty.seguroIncendio,
    newProperty.taxasAdicionais
  ]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const businessType = newProperty.purpose || 'Venda';
    let hasPriceError = false;
    let errorMessage = "";

    if (businessType === 'Venda') {
      if (Number(newProperty.valorVenda || 0) <= 0) {
        hasPriceError = true;
        errorMessage = "Para a finalidade 'Venda', o Valor de Venda deve ser preenchido e maior que zero.";
      }
    } else if (businessType === 'Locação') {
      if (Number(newProperty.valorAluguel || 0) <= 0) {
        hasPriceError = true;
        errorMessage = "Para a finalidade 'Locação', o Valor do Aluguel deve ser preenchido e maior que zero.";
      }
    } else if (businessType === 'Venda e Locação') {
      if (Number(newProperty.valorVenda || 0) <= 0 || Number(newProperty.valorAluguel || 0) <= 0) {
        hasPriceError = true;
        errorMessage = "Para a finalidade 'Venda e Locação', tanto o Valor de Venda quanto o Valor do Aluguel devem ser preenchidos e maiores que zero.";
      }
    }

    if (hasPriceError) {
      setPriceError(errorMessage);
      setEditTab('publicacao');
      return;
    } else {
      setPriceError(null);
    }

    if (newProperty.corretorId) {
      if (!newProperty.corretorNome || (!newProperty.corretorWhatsapp && !newProperty.corretorTelefone)) {
        alert("Se selecionar um corretor responsável, você deve fornecer pelo menos o Nome e o WhatsApp ou Telefone do corretor.");
        return;
      }
    }

    const priceVal = businessType === 'Locação' ? Number(newProperty.valorAluguel || 0) : Number(newProperty.valorVenda || 0);

    setIsSubmitting(true);
    
    try {
      const validUrls = imageUrls.filter(url => url.trim() !== '');
      
      const limparOpcoesAtivas = (lista: any[]) => {
        return Array.isArray(lista)
          ? lista.filter((item: any) => {
              if (item && typeof item === 'object') {
                return item.ativo === true;
              }
              return true;
            })
          : [];
      };

      // Attach statusNotes to the last log entry in approvalHistory if present
      let finalHistory = Array.isArray(newProperty.approvalHistory) ? [...newProperty.approvalHistory] : [];
      if (newProperty.statusNotes && finalHistory.length > 0) {
        finalHistory[finalHistory.length - 1].observacoes = newProperty.statusNotes;
      } else if (newProperty.statusNotes && finalHistory.length === 0) {
        // Create initial log entry if it didn't exist but notes were typed
        finalHistory.push({
          data: new Date().toISOString(),
          usuario: profile?.name || profile?.nome || currentUser?.email || 'Sistema',
          perfil: profile?.perfil || 'Administrador',
          de: 'Rascunho',
          para: newProperty.approvalStatus || 'Rascunho',
          observacoes: newProperty.statusNotes
        });
      }

      const propertyData = {
        ...newProperty,
        approvalStatus: newProperty.approvalStatus || 'Rascunho',
        approvalHistory: finalHistory,
        statusNotes: '', // reset in DB
        priceValue: priceVal,
        tipoNegocio: businessType,
        purpose: businessType,
        price: businessType === 'Locação' 
          ? `R$ ${Number(newProperty.valorAluguel || 0).toLocaleString('pt-BR')}/mês` 
          : businessType === 'Venda e Locação'
            ? `Venda: R$ ${Number(newProperty.valorVenda || 0).toLocaleString('pt-BR')} | Aluguel: R$ ${Number(newProperty.valorAluguel || 0).toLocaleString('pt-BR')}/mês`
            : `R$ ${Number(newProperty.valorVenda || 0).toLocaleString('pt-BR')}`,
        condoValue: newProperty.valorCondominio ? `R$ ${Number(newProperty.valorCondominio).toLocaleString('pt-BR')}` : '',
        
        fotos: newProperty.fotos || validUrls.map((u, i) => ({
          url: u,
          secureUrl: u,
          publicId: '',
          originalFilename: u.split('/').pop() || '',
          ordem: i
        })),
        fotoPrincipal: newProperty.fotoPrincipal || validUrls[0] || newProperty.image || '',
        image: newProperty.fotoPrincipal || validUrls[0] || newProperty.image || '',
        additionalImages: newProperty.fotos 
          ? newProperty.fotos.slice(1).map((f: any) => f.secureUrl || f.url || '')
          : validUrls.slice(1),
        ownerId: currentUser?.uid || '',
        emailProprietario: currentUser?.email || '',
        proprietarioId: currentUser?.uid || '',

        // Filter active checkboxes
        caracteristicas: limparOpcoesAtivas(newProperty.caracteristicas || []),
        ambientes: limparOpcoesAtivas(newProperty.ambientes || []),
        lazer: limparOpcoesAtivas(newProperty.lazer || []),
        instalacoes: limparOpcoesAtivas(newProperty.instalacoes || []),
        acabamentos: limparOpcoesAtivas(newProperty.acabamentos || []),
        proximidades: limparOpcoesAtivas(newProperty.proximidades || []),
        caracteristicasEmpreendimento: limparOpcoesAtivas(newProperty.caracteristicasEmpreendimento || [])
      };

      if (newProperty.status === 'Vendido') {
        propertyData.vendido = true;
        propertyData.disponivelParaVisita = false;
        propertyData.disponivelParaProposta = false;
        propertyData.publicado = true;
        propertyData.publicadoNoSite = true;
      }

      const message = `*Novo Imóvel Anunciado!*%0A%0A` + 
                      `*Título:* ${newProperty.title}%0A` +
                      `*Tipo:* ${newProperty.type || newProperty.propertyType}%0A` +
                      `*Finalidade:* ${newProperty.purpose}%0A` +
                      `*Valor:* ${propertyData.price}%0A` +
                      `*Local:* ${newProperty.neighborhood}, ${newProperty.city}%0A` +
                      `*Dormitórios:* ${newProperty.beds}%0A` +
                      `*Fotos:* ${validUrls.length}%0A%0A` +
                      `_Enviado via Portal RB SOROCABA para ${BROKER_EMAIL}_`;
      
      if (isAuthorized) {
        if (editingId !== null) {
          if (newProperty.status === "Alugado") {
            const activeLoc = await checkExistingActiveRental(editingId);
            if (activeLoc) {
              setDuplicationWarning({
                type: 'rental',
                propertyId: editingId,
                propertyData,
                existingRecord: activeLoc
              });
              setIsSubmitting(false);
              return;
            }
          } else if (newProperty.status === "Vendido") {
            const activeSale = await checkExistingSale(editingId);
            if (activeSale) {
              setDuplicationWarning({
                type: 'sale',
                propertyId: editingId,
                propertyData,
                existingRecord: activeSale
              });
              setIsSubmitting(false);
              return;
            }
          }

          await onUpdateProperty({ ...propertyData, id: editingId } as Property);
          
          if (newProperty.status === "Alugado") {
            await createAutomaticRentalFromProperty({ ...propertyData, id: editingId }, true);
          } else if (newProperty.status === "Vendido") {
            await createAutomaticSaleFromProperty({ ...propertyData, id: editingId }, true);
          }
        } else {
          const res = await (onAddProperty as any)(propertyData);
          if (res && res.success && res.id) {
            const newId = res.id;
            if (newProperty.status === "Alugado") {
              await createAutomaticRentalFromProperty({ ...propertyData, id: newId }, true);
            } else if (newProperty.status === "Vendido") {
              await createAutomaticSaleFromProperty({ ...propertyData, id: newId }, true);
            }
          }
        }
        setShowSuccess(true);
        return;
      } else {
        await submitProperty(propertyData);
        window.open(`https://wa.me/${BROKER_PHONE}?text=${message}`, '_blank');
        alert(`Sua proposta de anúncio foi enviada com sucesso!\nEm breve nossa equipe entrará em contato.`);
        resetForm();
      }
    } catch (error) {
      alert("Erro ao enviar anúncio. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setShowSuccess(false);
    setPriceError(null);
    setEditingId(null);
    setFormStep(1);
    setEditTab('dados_basicos');
    setImageUrls(['']);
    setNewProperty({
      title: '',
      description: '',
      cep: '',
      endereco: '',
      location: '',
      numero: '',
      complemento: '',
      bairro: '',
      neighborhood: '',
      cidade: 'Sorocaba',
      city: 'Sorocaba',
      estado: 'SP',
      state: 'SP',
      latitude: '',
      longitude: '',
      referencia: '',
      condominium: '',
      condoValue: '',
      purpose: 'Venda',
      acceptsFinancing: false,
      price: '',
      priceValue: 0,
      category: 'Residencial',
      type: 'Casa',
      propertyType: 'Casa',
      beds: 0,
      suites: 0,
      baths: 0,
      lavabos: 0,
      salas: 0,
      parkingCovered: 0,
      parkingUncovered: 0,
      area: '',
      areaTotal: '',
      areaUseful: '',
      areaConstruida: '',
      areaTerreno: '',
      pavimentos: 0,
      andar: 0,
      torres: 0,
      unidadesPorAndar: 0,
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
      additionalImages: [],
      videoUrl: '',
      coords: [-23.5018, -47.4581],
      status: 'Disponível',
      featured: false,

      // NEW FIELDS FOR ALL SECTIONS
      codigoImovel: '',
      matricula: '',
      cri: '',
      valorVenda: 0,
      valorAluguel: 0,
      valorCondominio: 0,
      valorIptuAnual: 0,
      taxaLixoAnual: 0,
      taxaGas: 0,
      taxaAgua: 0,
      taxaLuz: 0,
      seguroIncendio: 0,
      taxasAdicionais: 0,
      valorTotalMensal: 0,
      garantiaLocaticia: '',
      permitePet: 'Sim',
      mobiliadoSelect: 'Não mobiliado',
      tempoMinimoContrato: '',
      disponivelParaVisitaForm: 'Sim',
      statusLocacao: '',
      observacoesLocacao: '',

      eEdificio: false,
      estaEmCondominio: false,
      aceitaFinanciamento: false,
      aceitaPermuta: false,
      eMobiliado: false,
      imovelAlugado: false,

      // Lists
      caracteristicas: [],
      ambientes: [],
      caracteristicasEmpreendimento: [],
      lazer: [],
      instalacoes: [],
      acabamentos: [],
      proximidades: [],

      // Proprietario Info
      nomeProprietario: '',
      cpfCnpjProprietario: '',
      rgIeProprietario: '',
      telefoneProprietario: '',
      whatsappProprietario: '',
      emailProprietarioForm: '',
      enderecoProprietario: '',
      cidadeProprietario: 'Sorocaba',
      estadoProprietario: 'SP',
      cepProprietario: '',
      possuiConjuge: false,
      
      nomeConjuge: '',
      cpfConjuge: '',
      rgConjuge: '',
      profissaoConjuge: '',
      estadoCivilConjuge: 'Casado(a)',
      telefoneConjuge: '',
      emailConjuge: '',
      enderecoConjuge: '',

      // Publication
      publicado: true,
      publicadoNoSite: true,
      destaque: false,
      destaqueNaHome: false,
      mostrarCatalogo: true,
      disponivelParaVisita: true,
      disponivelParaProposta: true,
      vendido: false
    });
  };

  const handleEdit = (property: Property) => {
    setEditingId(property.id);
    const code = property.codigoImovel || property.codigo || property.referencia || property.id || '';
    setNewProperty({
      ...property,
      cep: property.cep || '',
      endereco: property.endereco || property.location || '',
      location: property.endereco || property.location || '',
      numero: property.numero || '',
      complemento: property.complemento || '',
      bairro: property.bairro || property.neighborhood || '',
      neighborhood: property.bairro || property.neighborhood || '',
      cidade: property.cidade || property.city || 'Sorocaba',
      city: property.cidade || property.city || 'Sorocaba',
      estado: property.estado || property.state || 'SP',
      state: property.estado || property.state || 'SP',
      latitude: property.latitude !== undefined ? String(property.latitude) : (property.coords?.[0] !== undefined ? String(property.coords[0]) : ''),
      longitude: property.longitude !== undefined ? String(property.longitude) : (property.coords?.[1] !== undefined ? String(property.coords[1]) : ''),
      referencia: property.referencia || '',
      beds: property.beds !== undefined ? Number(property.beds) : 0,
      suites: property.suites !== undefined ? Number(property.suites) : 0,
      baths: property.baths !== undefined ? Number(property.baths) : 0,
      lavabos: (property as any).lavabos !== undefined ? Number((property as any).lavabos) : 0,
      salas: (property as any).salas !== undefined ? Number((property as any).salas) : 0,
      parkingCovered: property.parkingCovered !== undefined ? Number(property.parkingCovered) : 0,
      parkingUncovered: (property as any).parkingUncovered !== undefined ? Number((property as any).parkingUncovered) : 0,
      pavimentos: (property as any).pavimentos !== undefined ? Number((property as any).pavimentos) : 0,
      andar: (property as any).andar !== undefined ? Number((property as any).andar) : 0,
      torres: (property as any).torres !== undefined ? Number((property as any).torres) : 0,
      unidadesPorAndar: (property as any).unidadesPorAndar !== undefined ? Number((property as any).unidadesPorAndar) : 0,

      caracteristicas: parseToObjects(property.caracteristicas, 0),
      ambientes: parseToObjects(property.ambientes, 1),
      caracteristicasEmpreendimento: parseToObjects(property.caracteristicasEmpreendimento || (property as any).caracteristicasCondominio, 0),
      lazer: parseToObjects(property.lazer, 0),
      instalacoes: parseToObjects(property.instalacoes, 0),
      acabamentos: parseToObjects(property.acabamentos, 0),
      proximidades: parseToObjects(property.proximidades, 0),

      codigoImovel: code,
      matricula: (property as any).matricula || '',
      cri: (property as any).cri || '',
      valorVenda: (property as any).valorVenda !== undefined ? Number((property as any).valorVenda) : (property.purpose === 'Venda' ? Number(property.priceValue) : 0),
      valorAluguel: (property as any).valorAluguel !== undefined ? Number((property as any).valorAluguel) : (property.purpose === 'Locação' ? Number(property.priceValue) : 0),
      valorCondominio: (property as any).valorCondominio !== undefined ? Number((property as any).valorCondominio) : Number(property.condoValue || 0),
      valorIptuAnual: (property as any).valorIptuAnual !== undefined ? Number((property as any).valorIptuAnual) : 0,
      taxaLixoAnual: (property as any).taxaLixoAnual !== undefined ? Number((property as any).taxaLixoAnual) : 0,
      taxaGas: (property as any).taxaGas !== undefined ? Number((property as any).taxaGas) : 0,
      taxaAgua: (property as any).taxaAgua !== undefined ? Number((property as any).taxaAgua) : 0,
      taxaLuz: (property as any).taxaLuz !== undefined ? Number((property as any).taxaLuz) : 0,
      seguroIncendio: (property as any).seguroIncendio !== undefined ? Number((property as any).seguroIncendio) : 0,
      taxasAdicionais: (property as any).taxasAdicionais !== undefined ? Number((property as any).taxasAdicionais) : 0,
      valorTotalMensal: (property as any).valorTotalMensal !== undefined ? Number((property as any).valorTotalMensal) : 2000,
      garantiaLocaticia: (property as any).garantiaLocaticia || '',
      permitePet: (property as any).permitePet || 'Sim',
      mobiliadoSelect: (property as any).mobiliadoSelect || 'Não mobiliado',
      tempoMinimoContrato: (property as any).tempoMinimoContrato || '',
      disponivelParaVisitaForm: (property as any).disponivelParaVisitaForm || 'Sim',
      statusLocacao: (property as any).statusLocacao || '',
      observacoesLocacao: (property as any).observacoesLocacao || '',

      eEdificio: !!(property as any).eEdificio,
      estaEmCondominio: !!(property as any).estaEmCondominio || !!property.condominium,
      aceitaFinanciamento: !!(property as any).aceitaFinanciamento || !!property.acceptsFinancing,
      aceitaPermuta: !!(property as any).aceitaPermuta,
      eMobiliado: !!(property as any).eMobiliado,
      imovelAlugado: !!(property as any).imovelAlugado,

      // Proprietario Info
      nomeProprietario: (property as any).nomeProprietario || '',
      cpfCnpjProprietario: (property as any).cpfCnpjProprietario || '',
      rgIeProprietario: (property as any).rgIeProprietario || '',
      telefoneProprietario: (property as any).telefoneProprietario || '',
      whatsappProprietario: (property as any).whatsappProprietario || '',
      emailProprietarioForm: (property as any).emailProprietarioForm || property.emailProprietario || '',
      enderecoProprietario: (property as any).enderecoProprietario || '',
      cidadeProprietario: (property as any).cidadeProprietario || 'Sorocaba',
      estadoProprietario: (property as any).estadoProprietario || 'SP',
      cepProprietario: (property as any).cepProprietario || '',
      possuiConjuge: !!(property as any).possuiConjuge,
      
      nomeConjuge: (property as any).nomeConjuge || '',
      cpfConjuge: (property as any).cpfConjuge || '',
      rgConjuge: (property as any).rgConjuge || '',
      profissaoConjuge: (property as any).profissaoConjuge || '',
      estadoCivilConjuge: (property as any).estadoCivilConjuge || 'Casado(a)',
      telefoneConjuge: (property as any).telefoneConjuge || '',
      emailConjuge: (property as any).emailConjuge || '',
      enderecoConjuge: (property as any).enderecoConjuge || '',

      // Publication
      publicado: property.publicado !== undefined ? !!property.publicado : true,
      publicadoNoSite: property.publicadoNoSite !== undefined ? !!property.publicadoNoSite : true,
      mostrarNosFiltros: property.mostrarNosFiltros !== undefined ? !!property.mostrarNosFiltros : (property.mostrarCatalogo !== undefined ? !!property.mostrarCatalogo : true),
      mostrarValorNoSite: property.mostrarValorNoSite !== undefined ? !!property.mostrarValorNoSite : true,
      destaque: property.destaque !== undefined ? !!property.destaque : false,
      destaqueNaHome: property.destaqueNaHome !== undefined ? !!property.destaqueNaHome : false,
      mostrarCatalogo: property.mostrarCatalogo !== undefined ? !!property.mostrarCatalogo : true,
      disponivelParaVisita: property.disponivelParaVisita !== undefined ? !!property.disponivelParaVisita : true,
      disponivelParaProposta: property.disponivelParaProposta !== undefined ? !!property.disponivelParaProposta : true,
      vendido: !!property.vendido,
      tituloAnuncio: property.tituloAnuncio || (property as any).titulo || property.title || '',
      subtituloAnuncio: property.subtituloAnuncio || '',
      descricaoCurta: property.descricaoCurta || '',
      descricaoDetalhada: property.descricaoDetalhada || property.description || (property as any).descricao || '',
      diferenciaisAnuncio: property.diferenciaisAnuncio || '',
      textoWhatsapp: property.textoWhatsapp || '',
      textoInstagram: property.textoInstagram || '',
      tituloSEO: property.tituloSEO || '',
      descricaoSEO: property.descricaoSEO || '',
      palavrasChaveSEO: property.palavrasChaveSEO || '',

      status: property.status === 'ativo' ? 'Disponível' : (property.status === 'inativo' ? 'Inativo' : property.status || 'Disponível'),
      statusImovel: property.status === 'ativo' ? 'Disponível' : (property.status === 'inativo' ? 'Inativo' : property.status || 'Disponível'),

      autoLocatarioNome: (property as any).autoLocatarioNome || (property.gestaoLocacao as any)?.locatarioNome || '',
      autoLocatarioCpfCnpj: (property as any).autoLocatarioCpfCnpj || (property.gestaoLocacao as any)?.locatarioCpfCnpj || '',
      autoLocatarioTelefone: (property as any).autoLocatarioTelefone || (property.gestaoLocacao as any)?.locatarioWhatsapp || '',
      autoLocatarioEmail: (property as any).autoLocatarioEmail || (property.gestaoLocacao as any)?.locatarioEmail || '',
      autoDataInicio: (property as any).autoDataInicio || (property.gestaoLocacao as any)?.dataInicioLocacao || '',
      autoDataFim: (property as any).autoDataFim || (property.gestaoLocacao as any)?.dataFimLocacao || '',
      autoDiaVencimento: (property as any).autoDiaVencimento || (property.gestaoLocacao as any)?.diaVencimentoAluguel || '10',
      autoValorAluguelMensal: (property as any).autoValorAluguelMensal || (property.gestaoLocacao as any)?.valorAluguelContratado || property.valorAluguel || 0,
      autoValorCondominio: (property as any).autoValorCondominio || (property.gestaoLocacao as any)?.valorCondominio || property.valorCondominio || 0,
      autoValorIptu: (property as any).autoValorIptu || (property.gestaoLocacao as any)?.valorIptu || property.valorIptuAnual || 0,
      autoTaxaLixo: (property as any).autoTaxaLixo || (property.gestaoLocacao as any)?.taxaLixo || property.taxaLixoAnual || 0,
      autoTaxaAgua: (property as any).autoTaxaAgua || (property.gestaoLocacao as any)?.taxaAgua || 0,
      autoTaxaLuz: (property as any).autoTaxaLuz || (property.gestaoLocacao as any)?.taxaLuz || 0,
      autoTaxaGas: (property as any).autoTaxaGas || (property.gestaoLocacao as any)?.taxaGas || 0,
      autoSeguroIncendio: (property as any).autoSeguroIncendio || (property.gestaoLocacao as any)?.seguroIncendio || 0,
      autoPercentualComissao: (property as any).autoPercentualComissao || (property.gestaoLocacao as any)?.comissaoImobiliariaPercentual || 10,
      autoObservacoesLocacao: (property as any).autoObservacoesLocacao || (property.gestaoLocacao as any)?.observacoesLocacao || '',

      autoCompradorNome: (property as any).autoCompradorNome || '',
      autoCompradorCpfCnpj: (property as any).autoCompradorCpfCnpj || '',
      autoCompradorTelefone: (property as any).autoCompradorTelefone || '',
      autoCompradorEmail: (property as any).autoCompradorEmail || '',
      autoDataVenda: (property as any).autoDataVenda || '',
      autoValorFinalVenda: (property as any).autoValorFinalVenda || property.valorVenda || 0,
      autoPercentualComissaoVenda: (property as any).autoPercentualComissaoVenda || 6,
      autoValorComissaoVenda: (property as any).autoValorComissaoVenda || 0,
      autoFormaPagamento: (property as any).autoFormaPagamento || 'À Vista',
      autoObservacoesVenda: (property as any).autoObservacoesVenda || '',
      autoObservacoesReserva: (property as any).autoObservacoesReserva || (property as any).observacoesReserva || '',
    });

    // Load active logs asynchronously
    if (property.id) {
      if (property.status === "Alugado" || (property as any).statusImovel === "Alugado") {
        checkExistingActiveRental(String(property.id)).then((active: any) => {
          if (active) {
            setNewProperty((prev: any) => ({
              ...prev,
              autoLocatarioNome: active.locatarioNome || prev.autoLocatarioNome,
              autoLocatarioCpfCnpj: active.locatarioCpfCnpj || prev.autoLocatarioCpfCnpj,
              autoLocatarioTelefone: active.locatarioTelefone || prev.autoLocatarioTelefone,
              autoLocatarioEmail: active.locatarioEmail || prev.autoLocatarioEmail,
              autoDataInicio: active.dataInicio || prev.autoDataInicio,
              autoDataFim: active.dataFim || prev.autoDataFim,
              autoDiaVencimento: active.diaVencimento || prev.autoDiaVencimento,
              autoValorAluguelMensal: active.valorAluguelMensal || prev.autoValorAluguelMensal,
              autoValorCondominio: active.valorCondominio || prev.autoValorCondominio,
              autoValorIptu: active.valorIptu || prev.autoValorIptu,
              autoTaxaLixo: active.taxaLixo || prev.autoTaxaLixo,
              autoTaxaAgua: active.taxaAgua || prev.autoTaxaAgua,
              autoTaxaLuz: active.taxaLuz || prev.autoTaxaLuz,
              autoTaxaGas: active.taxaGas || prev.autoTaxaGas,
              autoSeguroIncendio: active.seguroIncendio || prev.autoSeguroIncendio,
              autoPercentualComissao: active.percentualComissao || prev.autoPercentualComissao,
              autoObservacoesLocacao: active.observacoesLocacao || prev.autoObservacoesLocacao,
              _existingRentalCreatedAt: active.createdAt
            }));
          }
        });
      } else if (property.status === "Vendido" || (property as any).statusImovel === "Vendido") {
        checkExistingSale(String(property.id)).then((active: any) => {
          if (active) {
            setNewProperty((prev: any) => ({
              ...prev,
              autoCompradorNome: active.compradorNome || prev.autoCompradorNome,
              autoCompradorCpfCnpj: active.compradorCpfCnpj || prev.autoCompradorCpfCnpj,
              autoCompradorTelefone: active.compradorTelefone || prev.autoCompradorTelefone,
              autoCompradorEmail: active.compradorEmail || prev.autoCompradorEmail,
              autoDataVenda: active.dataVenda || prev.autoDataVenda,
              autoValorFinalVenda: active.valorFinalVenda || prev.autoValorFinalVenda,
              autoPercentualComissaoVenda: active.percentualComissao || prev.autoPercentualComissaoVenda,
              autoValorComissaoVenda: active.valorComissao || prev.autoValorComissaoVenda,
              autoFormaPagamento: active.formaPagamento || prev.autoFormaPagamento,
              autoObservacoesVenda: active.observacoesVenda || prev.autoObservacoesVenda,
              _existingSaleCreatedAt: active.createdAt
            }));
          }
        });
      }
    }

    setPriceError(null);
    
    // Construct robust fotos objects array for the editor
    const propertyFotos = Array.isArray(property.fotos) && property.fotos.length > 0
      ? property.fotos.map((f: any, idx: number) => {
          if (typeof f === 'string') {
            return {
              url: f,
              secureUrl: f,
              publicId: '',
              originalFilename: f.split('/').pop() || '',
              ordem: idx
            };
          }
          return {
            url: f.url || f.secureUrl || '',
            secureUrl: f.secureUrl || f.url || '',
            publicId: f.publicId || '',
            originalFilename: f.originalFilename || '',
            ordem: f.ordem !== undefined ? Number(f.ordem) : idx
          };
        })
      : [property.image, ...(property.additionalImages || [])].filter(Boolean).map((url, idx) => ({
          url,
          secureUrl: url,
          publicId: '',
          originalFilename: url.split('/').pop() || '',
          ordem: idx
        }));

    const mainPic = property.fotoPrincipal || property.image || (propertyFotos[0]?.secureUrl || '');

    setNewProperty((prev: any) => ({
      ...prev,
      fotos: propertyFotos,
      fotoPrincipal: mainPic,
      image: mainPic,
      additionalImages: propertyFotos.slice(1).map(f => f.secureUrl || f.url || '')
    }));

    setImageUrls(propertyFotos.map(f => f.secureUrl || f.url || ''));
    setShowAddForm(true);
    setEditTab('dados_basicos');
  };

  const uploadImagemCloudinary = async (file: File) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "du9twy42v";
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "rb_imoveis";
    const folder = import.meta.env.VITE_CLOUDINARY_FOLDER || "rb-sorocaba/imoveis";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao enviar imagem "${file.name}" para o Cloudinary`);
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      secureUrl: data.secure_url,
      publicId: data.public_id,
      originalFilename: data.original_filename || file.name
    };
  };

  const gerarTextosPublicacaoAutomaticos = (imovel: any) => {
    const tipo = imovel.type || imovel.tipoImovel || "Imóvel";
    const finalidade = imovel.purpose || imovel.tipoNegocio || "Venda";
    const cidade = imovel.cidade || imovel.city || "Sorocaba";
    const bairro = imovel.bairro || imovel.neighborhood || "";
    const quartos = imovel.beds ? `${imovel.beds} dormitório(s)` : "";
    const suites = imovel.suites ? `${imovel.suites} suíte(s)` : "";
    const banheiros = imovel.baths ? `${imovel.baths} banheiro(s)` : "";
    const vagas = imovel.parkingCovered ? `${imovel.parkingCovered} vaga(s)` : "";
    
    const areaPrivativa = imovel.areaUseful || imovel.area || "";
    const areaTotal = imovel.areaTotal || "";
    const areaConstruida = imovel.areaConstruida || "";
    const areaTerreno = imovel.areaTerreno || "";

    const valorVenda = imovel.valorVenda ? `R$ ${Number(imovel.valorVenda).toLocaleString('pt-BR')}` : "";
    const valorAluguel = imovel.valorAluguel ? `R$ ${Number(imovel.valorAluguel).toLocaleString('pt-BR')}` : "";
    const valorCondominio = imovel.valorCondominio ? `R$ ${Number(imovel.valorCondominio).toLocaleString('pt-BR')}` : "";
    const valorIptuAnual = imovel.valorIptuAnual ? `R$ ${Number(imovel.valorIptuAnual).toLocaleString('pt-BR')}` : "";
    
    const locStr = bairro ? `${bairro} em ${cidade}` : cidade;
    const codigo = imovel.codigoImovel || imovel.codigo || imovel.id || "";

    // 1. Título do anúncio
    let tit = `${tipo} para ${finalidade === "Locação" ? "aluguel" : "venda"}`;
    if (bairro) tit += ` no ${bairro}`;
    tit += ` em ${cidade}`;
    if (imovel.beds) tit += ` com ${imovel.beds} dorms`;
    if (imovel.suites) tit += ` e ${imovel.suites} suíte(s)`;

    // 2. Subtítulo
    let subtit = "Excelente oportunidade ";
    if (finalidade === "Locação") {
      subtit += "para locação ";
    } else if (finalidade === "Venda") {
      subtit += "para venda ";
    } else {
      subtit += "para morar ou investir ";
    }
    if (bairro) subtit += `no bairro ${bairro}. `;
    subtit += "Conforto, localização extremamente estratégica e excelente infraestrutura.";

    // 3. Descrição curta
    let descCurta = `Ótima oportunidade de ${tipo} disponível para ${finalidade} no ${locStr}. `;
    const listSpecs = [];
    if (quartos) listSpecs.push(quartos);
    if (suites) listSpecs.push(suites);
    if (vagas) listSpecs.push(vagas);
    if (areaPrivativa) listSpecs.push(`${areaPrivativa}m² de área privativa`);
    if (listSpecs.length > 0) {
      descCurta += `O imóvel conta com ${listSpecs.join(", ")}, oferecendo uma distribuição de espaço confortável e inteligente. `;
    }
    descCurta += `Excelente custo-benefício para a região. Entre em contato conosco!`;

    // 4. Descrição detalhada
    let descDetalhada = `Apresentamos esta excelente oportunidade de ${tipo} para ${finalidade} em uma das regiões de maior procura. `;
    if (bairro) descDetalhada += `Situado no cobiçado bairro ${bairro}, em ${cidade}, o imóvel destaca-se pela facilidade de acesso a serviços e conveniências locais.\n\n`;
    else descDetalhada += `Situado em ${cidade}, o imóvel destaca-se pela excelente localização e facilidade de acesso.\n\n`;

    descDetalhada += `**Estrutura do Imóvel & Ambientes**\n`;
    descDetalhada += `Com ambientes bem arejados e excelente iluminação natural, esta propriedade dispõe de:\n`;
    if (quartos) descDetalhada += `- ${quartos}\n`;
    if (suites) descDetalhada += `- ${suites}\n`;
    if (banheiros) descDetalhada += `- ${banheiros}\n`;
    if (imovel.lavabos) descDetalhada += `- ${imovel.lavabos} lavabo(s)\n`;
    if (imovel.salas) descDetalhada += `- ${imovel.salas} sala(s) amplas para convivência\n`;
    if (vagas) descDetalhada += `- ${vagas} de garagem\n`;
    
    if (areaPrivativa || areaTotal || areaConstruida || areaTerreno) {
      descDetalhada += `\n**Metragens:**\n`;
      if (areaPrivativa) descDetalhada += `- Área Privativa: ${areaPrivativa} m²\n`;
      if (areaTotal) descDetalhada += `- Área Total: ${areaTotal} m²\n`;
      if (areaConstruida) descDetalhada += `- Área Construída: ${areaConstruida} m²\n`;
      if (areaTerreno) descDetalhada += `- Área do Terreno: ${areaTerreno} m²\n`;
    }

    // Characteristics & Arrays
    const caracList = Array.isArray(imovel.caracteristicas) ? imovel.caracteristicas : [];
    const ambList = Array.isArray(imovel.ambientes) ? imovel.ambientes : [];
    const proxList = Array.isArray(imovel.proximidades) ? imovel.proximidades : [];
    const lazList = Array.isArray(imovel.lazer) ? imovel.lazer : [];
    const acabList = Array.isArray(imovel.acabamentos) ? imovel.acabamentos : [];
    const instList = Array.isArray(imovel.instalacoes) ? imovel.instalacoes : [];

    const extractLabels = (list: any[]) => list.map(item => {
      if (!item) return '';
      if (typeof item === 'object') {
        return item.nome || item.label || '';
      }
      return String(item);
    }).filter(Boolean);
    
    const labelsCarac = extractLabels(caracList);
    const labelsAmb = extractLabels(ambList);
    const labelsProx = extractLabels(proxList);
    const labelsLaz = extractLabels(lazList);
    const labelsAcab = extractLabels(acabList);
    const labelsInst = extractLabels(instList);

    if (labelsCarac.length > 0) {
      descDetalhada += `\n**Características Gerais:**\n`;
      labelsCarac.forEach(l => { descDetalhada += `- ${l}\n`; });
    }
    if (labelsAmb.length > 0) {
      descDetalhada += `\n**Ambientes Integrados:**\n`;
      labelsAmb.forEach(l => { descDetalhada += `- ${l}\n`; });
    }
    if (labelsLaz.length > 0) {
      descDetalhada += `\n**Lazer e Condomínio:**\n`;
      labelsLaz.forEach(l => { descDetalhada += `- ${l}\n`; });
    }
    if (labelsAcab.length > 0) {
      descDetalhada += `\n**Acabamento:**\n`;
      labelsAcab.forEach(l => { descDetalhada += `- ${l}\n`; });
    }
    if (labelsInst.length > 0) {
      descDetalhada += `\n**Instalações:**\n`;
      labelsInst.forEach(l => { descDetalhada += `- ${l}\n`; });
    }
    if (labelsProx.length > 0) {
      descDetalhada += `\n**Proximidades:**\n`;
      labelsProx.forEach(l => { descDetalhada += `- ${l}\n`; });
    }

    descDetalhada += `\n**Condições Comerciais:**\n`;
    if (valorVenda && (finalidade === 'Venda' || finalidade === 'Venda e Locação')) {
      descDetalhada += `- Venda: ${valorVenda}\n`;
    }
    if (valorAluguel && (finalidade === 'Locação' || finalidade === 'Venda e Locação')) {
      descDetalhada += `- Aluguel: ${valorAluguel}/mês\n`;
    }
    if (valorCondominio) descDetalhada += `- Condomínio: ${valorCondominio}/mês\n`;
    if (valorIptuAnual) descDetalhada += `- IPTU Anual: ${valorIptuAnual}\n`;
    
    if (imovel.aceitaFinanciamento) descDetalhada += `- Aceita Financiamento Bancário\n`;
    if (imovel.aceitaFGTS) descDetalhada += `- Aceita uso de FGTS\n`;
    if (imovel.aceitaPermuta) descDetalhada += `- Estuda Permuta\n`;
    if (imovel.eMobiliado || imovel.mobiliado) descDetalhada += `- Unidade Mobiliada\n`;
    if (imovel.imovelAlugado) descDetalhada += `- Imóvel Atualmente Alugado (Excelente para Investidor)\n`;

    // 5. Diferenciais em destaque
    let difs = "";
    if (bairro) difs += `- Localização privilegiada no bairro ${bairro}\n`;
    else difs += `- Ótima localização em ${cidade}\n`;
    if (suites) difs += `- Dispõe de suíte privativa para maior conforto\n`;
    if (vagas) difs += `- Excelente espaço de garagem (${vagas})\n`;
    if (imovel.aceitaFinanciamento) difs += `- Documentação regularizada, aceita financiamento\n`;
    if (labelsCarac.length > 0) {
      labelsCarac.slice(0, 3).forEach(l => {
        difs += `- ${l}\n`;
      });
    }

    // 6. Texto para WhatsApp
    let txtWhats = `Olá! Tenho interesse no imóvel ${codigo ? `${codigo} - ` : ""}${tit}. Gostaria de obter mais informações, tirar dúvidas e agendar uma visita.`;

    // 7. Legenda Instagram
    let txtInsta = `🔑 EXCELENTE OPORTUNIDADE EM SOROCABA!\n\nProcurando por conforto, praticidade e uma localização privilegiada? Conheça este incrível ${tipo.toLowerCase()} para ${finalidade.toLowerCase()} `;
    if (bairro) txtInsta += `no ${bairro} em ${cidade}`;
    else txtInsta += `em ${cidade}`;
    txtInsta += `!\n\n`;
    if (quartos) txtInsta += `🛏️ ${quartos}\n`;
    if (suites) txtInsta += `🚿 ${suites}\n`;
    if (vagas) txtInsta += `🚗 ${vagas}\n`;
    if (areaPrivativa) txtInsta += `📐 ${areaPrivativa} m² privativos\n`;
    txtInsta += `\n✨ Diferenciais:\n${difs.substring(0, 150)}...\n\n`;
    txtInsta += `Ficou interessado(a)? Não perca tempo e venha conferir cada detalhe com a nossa equipe!\n\n📥 Entre em contato via Direct ou WhatsApp e agende sua visita com a RB Sorocaba Negócios Imobiliários!\n\n#rbsorocaba #sorocaba #imobiliaria #imoveis #seuimovel`;
    if (bairro) txtInsta += ` #${bairro.toLowerCase().replace(/\s+/g, '')}`;
    txtInsta += ` #${tipo.toLowerCase().replace(/\s+/g, '')}`;

    // 8. Título SEO
    let titSEO = `${tipo} para ${finalidade} `;
    if (bairro) titSEO += `no ${bairro} `;
    titSEO += `em ${cidade} | RB Sorocaba`;
    if (titSEO.length > 60) titSEO = titSEO.substring(0, 57) + "...";

    // 9. Meta descrição SEO
    let descSEO = `${tipo} para ${finalidade.toLowerCase()} `;
    if (bairro) descSEO += `no bairro ${bairro} `;
    descSEO += `em ${cidade}. `;
    if (quartos) descSEO += `${quartos}, `;
    if (vagas) descSEO += `${vagas}. `;
    descSEO += "Conheça agora essa excelente oportunidade comercial!";
    if (descSEO.length > 160) descSEO = descSEO.substring(0, 157) + "...";

    // 10. Palavras-chave SEO
    const keywords = [];
    keywords.push(`${tipo.toLowerCase()} em sorocaba`);
    if (bairro) {
      keywords.push(`${tipo.toLowerCase()} no ${bairro.toLowerCase()}`);
      keywords.push(`imovel no ${bairro.toLowerCase()}`);
    }
    keywords.push(`imoveis rb sorocaba`);
    keywords.push(`${tipo.toLowerCase()} para ${finalidade.toLowerCase()}`);
    const kwSEO = keywords.join(", ");

    return {
      tituloAnuncio: tit,
      subtituloAnuncio: subtit,
      descricaoCurta: descCurta,
      descricaoDetalhada: descDetalhada,
      diferenciaisAnuncio: difs,
      textoWhatsapp: txtWhats,
      textoInstagram: txtInsta,
      tituloSEO: titSEO,
      descricaoSEO: descSEO,
      palavrasChaveSEO: kwSEO
    };
  };

  const handleGeminiGenerate = async () => {
    if (isGeneratingIA) return;
    setIsGeneratingIA(true);
    setIaSuccessMessage(null);
    setIaErrorMessage(null);

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ imovel: newProperty })
      });

      if (!response.ok) {
        throw new Error("Falha ao comunicar com o servidor do Gemini.");
      }

      const data = await response.json();
      
      setNewProperty(prev => ({
        ...prev,
        tituloAnuncio: data.tituloAnuncio || prev.tituloAnuncio || '',
        title: data.tituloAnuncio || prev.title || '',
        subtituloAnuncio: data.subtituloAnuncio || prev.subtituloAnuncio || '',
        descricaoCurta: data.descricaoCurta || prev.descricaoCurta || '',
        shortDescription: data.descricaoCurta || prev.shortDescription || '',
        descricaoDetalhada: data.descricaoDetalhada || prev.descricaoDetalhada || '',
        description: data.descricaoDetalhada || prev.description || '',
        diferenciaisAnuncio: data.diferenciaisAnuncio || prev.diferenciaisAnuncio || '',
        textoWhatsapp: data.textoWhatsapp || prev.textoWhatsapp || '',
        textoInstagram: data.textoInstagram || prev.textoInstagram || '',
        tituloSEO: data.tituloSEO || prev.tituloSEO || '',
        descricaoSEO: data.descricaoSEO || prev.descricaoSEO || '',
        palavrasChaveSEO: data.palavrasChaveSEO || prev.palavrasChaveSEO || ''
      }));

      setIaSuccessMessage("Textos gerados com sucesso.");
      setTimeout(() => setIaSuccessMessage(null), 5000);
    } catch (error: any) {
      console.warn("Gemini generation failed, running expert local dynamic fallback generator:", error);
      try {
        const localData = gerarTextosPublicacaoAutomaticos(newProperty);
        setNewProperty(prev => ({
          ...prev,
          tituloAnuncio: localData.tituloAnuncio || prev.tituloAnuncio || '',
          title: localData.tituloAnuncio || prev.title || '',
          subtituloAnuncio: localData.subtituloAnuncio || prev.subtituloAnuncio || '',
          descricaoCurta: localData.descricaoCurta || prev.descricaoCurta || '',
          shortDescription: localData.descricaoCurta || prev.shortDescription || '',
          descricaoDetalhada: localData.descricaoDetalhada || prev.descricaoDetalhada || '',
          description: localData.descricaoDetalhada || prev.description || '',
          diferenciaisAnuncio: localData.diferenciaisAnuncio || prev.diferenciaisAnuncio || '',
          textoWhatsapp: localData.textoWhatsapp || prev.textoWhatsapp || '',
          textoInstagram: localData.textoInstagram || prev.textoInstagram || '',
          tituloSEO: localData.tituloSEO || prev.tituloSEO || '',
          descricaoSEO: localData.descricaoSEO || prev.descricaoSEO || '',
          palavrasChaveSEO: localData.palavrasChaveSEO || prev.palavrasChaveSEO || ''
        }));
        setIaSuccessMessage("Textos gerados com sucesso.");
        setTimeout(() => setIaSuccessMessage(null), 5000);
      } catch (localErr: any) {
        console.error("Local generator also failed:", localErr);
        setIaErrorMessage("Erro ao gerar textos. Tente novamente.");
      }
    } finally {
      setIsGeneratingIA(false);
    }
  };

  const handleGeminiImprove = async () => {
    const textToImprove = newProperty.descricaoDetalhada || newProperty.description || newProperty.descricao || '';
    if (!textToImprove.trim()) {
      setIaErrorMessage("Por favor, digite alguma descrição detalhada antes de solicitar a melhoria com IA.");
      return;
    }

    if (isImprovingIA) return;
    setIsImprovingIA(true);
    setIaSuccessMessage(null);
    setIaErrorMessage(null);

    try {
      const response = await fetch("/api/gemini/improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          text: textToImprove,
          context: newProperty
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao processar melhoria de texto.");
      }

      const data = await response.json();
      
      setNewProperty(prev => ({
        ...prev,
        descricaoDetalhada: data.improvedText || prev.descricaoDetalhada || ''
      }));

      setIaSuccessMessage("Descrição melhorada com sucesso pelo copyspecialist do Gemini AI!");
      setTimeout(() => setIaSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error("Gemini Improve Error:", error);
      setIaErrorMessage(error.message || "Erro no processamento da IA para melhorar a descrição.");
    } finally {
      setIsImprovingIA(false);
    }
  };

  const handleImagesUpload = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;
    
    setUploadingImages(true);
    setUploadError(null);

    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
      } else {
        setUploadError("Apenas arquivos de imagem são permitidos.");
      }
    }

    if (validFiles.length === 0) {
      setUploadingImages(false);
      return;
    }

    const currentFotos = newProperty.fotos ? [...newProperty.fotos] : 
      [newProperty.image, ...(newProperty.additionalImages || [])]
        .filter(Boolean)
        .map((url, idx) => ({
          url,
          secureUrl: url,
          publicId: '',
          originalFilename: url.split('/').pop() || '',
          ordem: idx
        }));

    const uploadedFotos: any[] = [];
    let hasError = false;

    for (let i = 0; i < validFiles.length; i++) {
      try {
        const result = await uploadImagemCloudinary(validFiles[i]);
        uploadedFotos.push({
          url: result.secureUrl,
          secureUrl: result.secureUrl,
          publicId: result.publicId,
          originalFilename: result.originalFilename,
          ordem: currentFotos.length + uploadedFotos.length
        });
      } catch (err: any) {
        console.error("Cloudinary upload file error: ", err);
        hasError = true;
      }
    }

    if (hasError) {
      setUploadError("Houve uma falha ao enviar uma ou mais fotos para o Cloudinary.");
    }

    const nextFotos = [...currentFotos, ...uploadedFotos].map((f, idx) => ({ ...f, ordem: idx }));

    let mainPic = newProperty.fotoPrincipal || newProperty.image || '';
    if (!mainPic && nextFotos.length > 0) {
      mainPic = nextFotos[0].secureUrl || nextFotos[0].url;
    }

    const updatedState = {
      ...newProperty,
      fotos: nextFotos,
      fotoPrincipal: mainPic,
      image: mainPic,
      additionalImages: nextFotos.slice(1).map(f => f.secureUrl || f.url || '')
    };

    setNewProperty(updatedState);
    setImageUrls(nextFotos.map(f => f.secureUrl || f.url || ''));
    setUploadingImages(false);
  };

  const handleRemoveFoto = (index: number) => {
    const currentFotos = newProperty.fotos ? [...newProperty.fotos] : 
      [newProperty.image, ...(newProperty.additionalImages || [])]
        .filter(Boolean)
        .map((url, idx) => ({
          url,
          secureUrl: url,
          publicId: '',
          originalFilename: url.split('/').pop() || '',
          ordem: idx
        }));

    const nextFotos = currentFotos.filter((_, idx) => idx !== index).map((f, idx) => ({ ...f, ordem: idx }));
    
    let mainPic = newProperty.fotoPrincipal || newProperty.image || '';
    const removedPicUrl = currentFotos[index]?.secureUrl || currentFotos[index]?.url;
    if (removedPicUrl === mainPic) {
      mainPic = nextFotos.length > 0 ? (nextFotos[0].secureUrl || nextFotos[0].url) : '';
    }

    setNewProperty({
      ...newProperty,
      fotos: nextFotos,
      fotoPrincipal: mainPic,
      image: mainPic,
      additionalImages: nextFotos.slice(1).map(f => f.secureUrl || f.url || '')
    });
    setImageUrls(nextFotos.map(f => f.secureUrl || f.url || ''));
  };

  const handleSetPrincipalFoto = (index: number) => {
    const currentFotos = newProperty.fotos ? [...newProperty.fotos] : 
      [newProperty.image, ...(newProperty.additionalImages || [])]
        .filter(Boolean)
        .map((url, idx) => ({
          url,
          secureUrl: url,
          publicId: '',
          originalFilename: url.split('/').pop() || '',
          ordem: idx
        }));

    if (index >= currentFotos.length) return;

    const targetFoto = currentFotos[index];
    const remainingFotos = currentFotos.filter((_, idx) => idx !== index);
    const nextFotos = [targetFoto, ...remainingFotos].map((f, idx) => ({ ...f, ordem: idx }));

    const mainPic = targetFoto.secureUrl || targetFoto.url;

    setNewProperty({
      ...newProperty,
      fotos: nextFotos,
      fotoPrincipal: mainPic,
      image: mainPic,
      additionalImages: nextFotos.slice(1).map(f => f.secureUrl || f.url || '')
    });
    setImageUrls(nextFotos.map(f => f.secureUrl || f.url || ''));
  };

  const handleMoveFoto = (index: number, direction: 'up' | 'down') => {
    const currentFotos = newProperty.fotos ? [...newProperty.fotos] : 
      [newProperty.image, ...(newProperty.additionalImages || [])]
        .filter(Boolean)
        .map((url, idx) => ({
          url,
          secureUrl: url,
          publicId: '',
          originalFilename: url.split('/').pop() || '',
          ordem: idx
        }));

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentFotos.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = currentFotos[index];
    currentFotos[index] = currentFotos[targetIndex];
    currentFotos[targetIndex] = temp;

    const nextFotos = currentFotos.map((f, idx) => ({ ...f, ordem: idx }));
    const mainPic = nextFotos[0] ? (nextFotos[0].secureUrl || nextFotos[0].url) : '';

    setNewProperty({
      ...newProperty,
      fotos: nextFotos,
      fotoPrincipal: mainPic,
      image: mainPic,
      additionalImages: nextFotos.slice(1).map(f => f.secureUrl || f.url || '')
    });
    setImageUrls(nextFotos.map(f => f.secureUrl || f.url || ''));
  };

  const addImageUrlField = () => setImageUrls([...imageUrls, '']);
  const updateImageUrl = (index: number, val: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = val;
    setImageUrls(newUrls);
  };
  const removeImageUrlField = (index: number) => {
    if (imageUrls.length > 1) {
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    }
  };



  // Dynamic Premium Admin Portal menu items matching RB Sorocaba CRM specification
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Imóveis', icon: Home },
    { id: 'add_property_tab', label: 'Cadastrar Imóvel', icon: PlusCircle },
    { id: 'rentals', label: 'Gestão de Locações', icon: ShieldCheck, badgeCount: myProperties.filter((p: any) => p.alugado || p.statusLocacao === 'Alugado' || p.gestaoLocacao?.alugado).length },
    { id: 'contracts', label: 'Contratos e Propostas', icon: FileText },
    { id: 'financial', label: 'Financeiro', icon: Wallet },
    { id: 'visits', label: 'Visitas / Agenda', icon: Calendar, badgeCount: myVisits.filter(v => v.status === 'pending').length },
    { id: 'submissions', label: 'Solicitações', icon: FileText, badgeCount: mySubmissions.length },
    { id: 'brokers', label: 'Corretores', icon: Shield },
    { id: 'neighborhoods', label: 'Bairros & Cadastros', icon: MapPin },
    { id: 'owners', label: 'Proprietários', icon: User },
    { id: 'siteSettings', label: 'Configurações do Site', icon: Settings },
    { id: 'usuariosCRM', label: 'Usuários e Permissões', icon: Users },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#F7F7F5] flex overflow-hidden font-sans text-[#111111]"
    >
      {/* SIDEBAR: Ultra-Premium Obsidian (#050505) and Majestic Gold Active States */}
      <aside className={`
        fixed inset-y-0 left-0 bg-[#050505] border-r border-[#1A1A1A] w-64 z-[110] transform transition-transform duration-300 flex flex-col justify-between shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Brand / Branding Banner */}
          <div className="p-6 border-b border-[#1A1A1A] flex justify-between items-center bg-[#101010]">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-[#F5B400] rounded-xl flex items-center justify-center font-black text-[#050505] text-xl shadow-lg shadow-[#F5B400]/25 transition-transform duration-300 hover:scale-105 shrink-0">
                RB
              </div>
              <div className="space-y-0.5">
                <h1 className="text-xs font-black text-white tracking-[0.15em] leading-none uppercase">RB SOROCABA</h1>
                <p className="text-[9px] text-[#F2C94C] uppercase tracking-[0.1em] font-black leading-none mt-1">Imóveis de Luxo</p>
              </div>
            </div>
            {/* Close Mobile Sidebar */}
            <button className="md:hidden p-1.5 rounded-lg bg-[#111111] border border-zinc-800 text-zinc-400 hover:text-white transition-all shadow-sm cursor-pointer" onClick={() => setIsSidebarOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {/* Nav Links (Grouped for High-End SaaS CRM layout) */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto no-scrollbar">
            {isAuthorized ? (
              [
                {
                  title: "Principal",
                  items: menuItems.filter(item => ['dashboard'].includes(item.id) && isItemAllowed(item.id))
                },
                {
                  title: "Operações",
                  items: menuItems.filter(item => ['inventory', 'add_property_tab', 'rentals', 'contracts', 'visits', 'submissions'].includes(item.id) && isItemAllowed(item.id))
                },
                {
                  title: "Finanças",
                  items: menuItems.filter(item => ['financial'].includes(item.id) && isItemAllowed(item.id))
                },
                {
                  title: "Cadastros",
                  items: menuItems.filter(item => ['brokers', 'neighborhoods', 'owners'].includes(item.id) && isItemAllowed(item.id))
                },
                {
                  title: "Configurações",
                  items: menuItems.filter(item => ['siteSettings', 'usuariosCRM'].includes(item.id) && isItemAllowed(item.id))
                }
              ].filter(group => group.items.length > 0).map((group) => (
                <div key={group.title} className="space-y-1.5">
                  <div className="px-3 text-[10px] font-bold tracking-[0.15em] text-[#7A7F8C] uppercase leading-none mb-3 mt-4 first:mt-0">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {group.items.map(item => {
                       const Icon = item.icon;
                       const isActive = item.id === 'add_property_tab' 
                         ? (showAddForm && editingId === null)
                         : (activeTab === item.id && !showAddForm);
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.id === 'add_property_tab') {
                              setShowAddForm(true);
                              setEditingId(null);
                            } else {
                              setActiveTab(item.id as any);
                              setShowAddForm(false);
                            }
                            setIsSidebarOpen(false);
                          }}
                          className={`
                            w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-250 group border border-transparent
                            ${isActive 
                              ? 'bg-[#FDFDFD] text-[#050505] font-extrabold shadow-sm border-[#E7E7E7] relative before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:bg-[#F5B400] before:rounded-r' 
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }
                          `}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon size={15} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-[#F5B400]' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                            <span>{item.label}</span>
                          </div>
                          {item.badgeCount !== undefined && item.badgeCount > 0 && (
                            <span className={`px-2 py-0.5 min-w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-200 ${isActive ? 'bg-[#050505] text-[#F5B400]' : 'bg-[#18181B] text-zinc-400 border border-zinc-800'}`}>
                              {item.badgeCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#0D0D0D] border border-zinc-900/60 p-5 rounded-2xl text-center">
                <Shield size={22} className="mx-auto text-amber-500 mb-2.5" />
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest leading-normal">
                  Acesso Restrito ao Proprietário
                </p>
              </div>
            )}
          </nav>

          {/* Sidebar Footer Information */}
          <div className="p-4 border-t border-[#1A1A1A] bg-[#0A0A0A]/95">
            <div className="flex items-center space-x-3 p-3 bg-[#121212] border border-[#222222] rounded-xl mb-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-[#F5B400]/10 border border-[#F5B400]/20 flex items-center justify-center text-[#F5B400] font-black text-sm uppercase shadow-inner shrink-0">
                {((currentUser?.email || profile.name || "P").charAt(0)).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white leading-tight truncate">{profile.name || currentUser?.email?.split('@')[0] || "Administrador"}</h4>
                <span className="text-[8px] text-[#F2C94C] uppercase tracking-[0.2em] font-extrabold mt-1 block">Premium CRM</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => {
                  setIsSidebarOpen(false);
                  onClose();
                }}
                className="py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] hover:bg-[#F5B400] hover:text-[#050505] text-zinc-300 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Globe size={11} className="shrink-0" />
                Ver Site
              </button>
              <button 
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="py-2.5 bg-[#2D0F0F] border border-red-950/20 hover:bg-red-600 hover:text-white text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut size={11} className="shrink-0" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* CORE CONTENT REGION with Premium light background (#F7F7F5) */}
      <main className="flex-1 flex flex-col bg-[#F7F7F5] relative overflow-hidden">
        {/* Header Ribbon */}
        <header className="h-20 px-6 md:px-8 bg-white border-b border-[#E7E7E7] flex justify-between items-center shrink-0 z-10 shadow-sm">
          <div className="flex items-center space-x-4">
            <button 
              className="md:hidden p-2 text-[#111111] hover:bg-neutral-100 border border-[#E7E7E7] rounded-xl cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-base md:text-lg font-bold text-[#111111] tracking-tight leading-none">
                  {isAuthorized ? menuItems.find(m => m.id === activeTab)?.label : 'Anunciar Imóvel'}
                </h2>
                <span className="flex items-center gap-1.5 bg-[#20C77A]/10 text-[#20C77A] border border-[#20C77A]/20 text-[10px] font-bold px-3 py-1 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#20C77A] animate-pulse" />
                  Sistema Ativo e Seguro
                </span>
              </div>
              <p className="text-[11px] text-[#7A7F8C] font-medium tracking-wide mt-1">RB Sorocaba - Central Corporativa</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <a 
              href="#properties" 
              onClick={onClose} 
              className="hidden sm:flex items-center space-x-2 text-[#111111] border border-[#E7E7E7] hover:border-[#111111] px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider bg-white hover:bg-neutral-50 transition-all duration-250 text-center shadow-sm cursor-pointer"
            >
              <Globe size={13} className="text-[#F5B400] shrink-0" />
              <span>Ver Site Público</span>
            </a>

            {/* Profile User block on top right headers */}
            <div className="flex items-center space-x-3 bg-[#F7F7F5] border border-[#E7E7E7] rounded-xl px-4 py-2">
              <div className="w-8 h-8 rounded-lg bg-[#050505] text-[#F5B400] flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                {((currentUser?.email || profile.name || "A").charAt(0)).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <h4 className="text-xs font-bold text-[#111111] leading-tight truncate">{profile.name || currentUser?.email?.split('@')[0] || "Administrador"}</h4>
                <p className="text-[9px] text-[#7A7F8C] font-semibold uppercase tracking-wider block">Ativo</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-10 h-10 border border-[#E7E7E7] hover:border-[#050505] hover:bg-neutral-50 text-[#7A7F8C] hover:text-[#050505] rounded-xl flex items-center justify-center transition-all bg-white shadow-sm cursor-pointer"
              title="Fechar Painel"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Inner Scrolling Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar">
          
          {/* SHOW AUTHORIZED SUB-SECTIONS */}
          {isAuthorized ? (
            <>
              {activeTab === 'dashboard' && !showAddForm && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* DASHBOARD HEADER WITH STRATEGIC ACTIONS */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white p-6 md:p-8 rounded-3xl border border-[#E7E7E7] shadow-sm">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-extrabold text-[#111111] tracking-tight uppercase">
                        Dashboard RB
                      </h3>
                      <p className="text-[11px] text-[#7A7F8C] uppercase font-bold tracking-wider mt-1.5">
                        Painel operacional de alto padrão • RB Sorocaba Negócios Imobiliários
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setShowAddForm(true);
                          setEditingId(null);
                        }}
                        className="bg-[#050505] hover:bg-[#F5B400] text-white hover:text-[#050505] px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shadow-sm shrink-0 cursor-pointer border border-[#050505]"
                      >
                        <Plus size={16} className="text-[#F5B400] shrink-0 group-hover:text-black" />
                        <span>+ Novo Imóvel</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('contracts')}
                        className={`group flex items-center space-x-3 w-full p-3 rounded-xl transition-all ${
                          activeTab === 'contracts' ? 'bg-[#F5B400] text-black shadow-sm' : 'hover:bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        <FileText size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Contratos e Propostas</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('rentals')}
                        className={`group flex items-center space-x-3 w-full p-3 rounded-xl transition-all ${
                          activeTab === 'rentals' ? 'bg-[#F5B400] text-black shadow-sm' : 'hover:bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        <Calendar size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Gestão Locações</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('visits')}
                        className="bg-white border border-[#E7E7E7] hover:border-[#050505] text-[#111111] px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
                      >
                        <Calendar size={16} className="text-[#F5B400] shrink-0" />
                        <span>Agenda / Visitas</span>
                      </button>
                    </div>
                  </div>

                  {/* SIX SOPHISTICATED CRM SaaS INDICATORS WITH PREMIUM HOVER AND LABELS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
                    {[
                      { 
                        title: 'PORTFÓLIO ATIVO', 
                        value: dashboardStats ? dashboardStats.portfolioAtivo : 0, 
                        growth: '', 
                        isPositive: true,
                        meta: 'Imóveis no portal',
                        icon: Home, 
                        color: 'text-[#050505] bg-neutral-100' 
                      },
                      { 
                        title: 'LEADS / VISITAS', 
                        value: dashboardStats ? dashboardStats.leadsVisitas : 0, 
                        growth: '', 
                        isPositive: true,
                        meta: 'Visitas agendadas',
                        icon: Calendar, 
                        color: 'text-[#F5B400] bg-[#F5B400]/10' 
                      },
                      { 
                        title: 'RECEITA MENSAL', 
                        value: dashboardStats ? formatCurrencyValue(dashboardStats.receitaMensal) : 'R$ 0,00', 
                        growth: '', 
                        isPositive: true,
                        meta: 'Faturamento rentabilizado',
                        icon: Wallet, 
                        color: 'text-[#20C77A] bg-[#20C77A]/10' 
                      },
                      { 
                        title: 'CUSTOS OPERACIONAIS', 
                        value: dashboardStats ? formatCurrencyValue(dashboardStats.custosOperacionais) : 'R$ 0,00', 
                        growth: '', 
                        isPositive: false,
                        meta: 'Custos de manutenção',
                        icon: Settings, 
                        color: 'text-[#EF4444] bg-[#EF4444]/10' 
                      },
                      { 
                        title: 'LOCAÇÕES ATIVAS', 
                        value: myProperties.filter((p: any) => p.alugado || p.status === 'Alugado' || p.statusLocacao === 'Alugado' || p.gestaoLocacao?.alugado).length, 
                        growth: '', 
                        isPositive: true,
                        meta: 'Contratos vigentes',
                        icon: ShieldCheck, 
                        color: 'text-sky-600 bg-sky-50' 
                      },
                      { 
                        title: 'PROP. PENDENTES', 
                        value: mySubmissions.length, 
                        growth: '', 
                        isPositive: true,
                        meta: 'Novas propostas e leads',
                        icon: FileText, 
                        color: 'text-purple-600 bg-purple-50' 
                      }
                    ].map((m, idx) => {
                      const IconComp = m.icon;
                      return (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-[#E7E7E7] shadow-sm hover:shadow-md hover:border-[#F5B400]/25 transition-all duration-300 flex flex-col justify-between group">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="text-[11px] font-bold uppercase text-[#7A7F8C] tracking-wider block">
                                {m.title}
                              </p>
                              <h4 className="text-2xl font-extrabold text-[#111111] leading-none tracking-tight pt-2.5">
                                {m.value}
                              </h4>
                            </div>
                            <div className={`p-2.5 rounded-xl flex items-center justify-center ${m.color} shrink-0 shadow-inner`}>
                              <IconComp size={16} />
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                            <span className="text-[10px] text-[#7A7F8C] font-semibold uppercase tracking-wider">{m.meta}</span>
                            {m.growth && (
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${m.isPositive ? 'text-[#20C77A]' : 'text-[#7A7F8C]'}`}>
                                {m.growth}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* PREMIUM MIDDLE SECTIONS: PERFORMANCE FINANCEIRA, INVESTIMENTOS E ALERTAS DO SISTEMA */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Performance Financeira card with interactive elements */}
                    <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-[#E7E7E7] shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                          <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Performance Financeira & Investimentos</h4>
                          <span className="text-[10px] bg-[#F5B400]/10 text-[#F5B400] border border-[#F5B400]/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                            Consolidado Mensal
                          </span>
                        </div>
                        <p className="text-xs text-[#7A7F8C] font-semibold uppercase mt-3 tracking-wider">Métricas de rentabilidade e distribuição de ativos imobiliários</p>
                        
                        {!dashboardStats?.performance || !dashboardStats.performance.hasData ? (
                          <div className="py-16 text-center text-[#7A7F8C] italic text-xs">
                            Nenhum dado financeiro consolidado neste mês.
                          </div>
                        ) : (
                          <>
                            {/* Custom visual progress bars representing rentability channels */}
                            <div className="space-y-5 mt-6">
                              {dashboardStats.performance.rentabilidades.map((r, i) => (
                                <div key={i}>
                                  <div className="flex justify-between text-xs font-bold text-[#111111] mb-1.5">
                                    <span>{r.title}</span>
                                    <span className="text-[#7A7F8C]">{r.label}</span>
                                  </div>
                                  <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden border border-neutral-200/50">
                                    <div className="bg-[#F5B400] h-full rounded-full transition-all duration-1000" style={{ width: r.width }} />
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Summary numbers block */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-neutral-100">
                              <div>
                                <span className="text-[10px] text-[#7A7F8C] font-bold uppercase tracking-wider block">Retorno Geral</span>
                                <span className="text-base font-extrabold text-[#111111] block mt-1.5">
                                  {formatCurrencyValue(dashboardStats.performance.retornoGeral)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#7A7F8C] font-bold uppercase tracking-wider block">Investimentos</span>
                                <span className="text-base font-extrabold text-[#111111] block mt-1.5">
                                  {formatCurrencyValue(dashboardStats.performance.investimentos)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#7A7F8C] font-bold uppercase tracking-wider block">Taxa de Ocupação</span>
                                <span className="text-base font-extrabold text-[#20C77A] block mt-1.5">
                                  {dashboardStats.performance.taxaOcupacao}%
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#7A7F8C] font-bold uppercase tracking-wider block">Média Contrato</span>
                                <span className="text-base font-extrabold text-[#111111] block mt-1.5">
                                  {dashboardStats.performance.mediaContrato}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Alertas do Sistema Section */}
                    <div className="bg-white p-6 rounded-3xl border border-[#E7E7E7] shadow-sm">
                      <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                        <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Alertas do Sistema</h4>
                        <span className={`w-2.5 h-2.5 rounded-full ${dashboardStats && dashboardStats.alertas.length > 0 ? 'bg-[#EF4444] animate-pulse' : 'bg-neutral-300'}`} />
                      </div>
                      <p className="text-xs text-[#7A7F8C] font-semibold uppercase mt-3 tracking-wider">Detecção de pendências no portfólio</p>
                      
                      <div className="space-y-4 mt-6">
                        {!dashboardStats || dashboardStats.alertas.length === 0 ? (
                          <div className="py-16 text-center text-[#7A7F8C] italic text-xs">
                            Nenhum alerta pendente no momento.
                          </div>
                        ) : (
                          dashboardStats.alertas.map(alert => (
                            <div key={alert.id} className={`p-4 ${alert.type === 'rose' ? 'bg-[#EF4444]/5 border border-[#EF4444]/20 text-[#EF4444]' : 'bg-[#F2C94C]/10 border border-[#F2C94C]/30 text-[#F59E0B]'} rounded-xl flex items-start gap-3.5`}>
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${alert.type === 'rose' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`} />
                              <div>
                                <h4 className={`text-xs font-bold uppercase leading-none ${alert.type === 'rose' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>{alert.title}</h4>
                                <p className="text-[11px] text-[#7A7F8C] font-medium mt-1.5">{alert.description}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM BLOCKS: ÚLTIMOS IMÓVEIS CADASTRADOS & PRÓXIMAS VISITAS */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent properties list summary */}
                    <div className="bg-white border border-[#E7E7E7] rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                        <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Últimos Imóveis Cadastrados</h4>
                        <button onClick={() => setActiveTab('inventory')} className="text-xs font-bold text-[#F5B400] uppercase tracking-wider hover:underline hover:text-[#050505] transition-colors cursor-pointer">
                          Ver Todos
                        </button>
                      </div>
                      {!dashboardStats || dashboardStats.ultimosImoveis.length === 0 ? (
                        <div className="py-16 text-center text-[#7A7F8C] italic text-xs font-semibold">
                          Nenhum imóvel cadastrado no inventário.
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-100 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                          {dashboardStats.ultimosImoveis.map(p => (
                            <div key={p.id} className="py-4 flex items-center justify-between first:pt-1 last:pb-1 hover:bg-neutral-50/50 rounded-xl px-2 transition-colors">
                              <div className="flex items-center space-x-3.5 min-w-0">
                                {p.image ? (
                                  <img src={p.image} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-neutral-100" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-100">
                                    <Home className="text-[#7A7F8C]" size={16} />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-[#111111] leading-tight truncate">{p.title}</p>
                                  <p className="text-[10px] text-[#7A7F8C] font-semibold uppercase tracking-wider mt-1 truncate">{p.neighborhood || p.bairro || 'Sem Bairro'}, {p.city || p.cidade || 'Sorocaba'}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0 pl-2">
                                <span className="text-xs font-bold text-[#111111] block">
                                  {p.price || formatCurrencyValue(p.priceValue || p.valorVenda || p.valorAluguel)}
                                </span>
                                <span className="text-[9px] bg-[#20C77A]/10 border border-[#20C77A]/20 text-[#20C77A] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1 inline-block">
                                  {p.status || 'Ativo'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pending Visits Summary */}
                    <div className="bg-white border border-[#E7E7E7] rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                        <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Próximas Visitas Agendadas</h4>
                        <button onClick={() => setActiveTab('visits')} className="text-xs font-bold text-[#F5B400] uppercase tracking-wider hover:underline hover:text-[#050505] transition-colors cursor-pointer">
                          Sua Agenda
                        </button>
                      </div>
                      {!dashboardStats || dashboardStats.proximasVisitas.length === 0 ? (
                        <div className="py-16 text-center text-[#7A7F8C] italic text-xs font-semibold">
                          Nenhuma visita agendada pendente.
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-100 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                          {dashboardStats.proximasVisitas.map((v, i) => (
                            <div key={i} className="py-4 flex items-center justify-between first:pt-1 last:pb-1 hover:bg-neutral-50/50 rounded-xl px-2 transition-colors">
                              <div>
                                <p className="text-xs font-bold text-[#111111]">{v.name}</p>
                                <p className="text-[10px] text-[#7A7F8C] font-semibold block mt-1">Data: {v.date ? (v.date.includes('-') ? v.date.split('-').reverse().join('/') : v.date) : ''} às {v.time}h</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${v.status === 'confirmed' || v.status === 'Confirmado' ? 'bg-[#20C77A]/10 text-[#20C77A] border border-[#20C77A]/20' : 'bg-[#F2C94C]/10 text-[#F59E0B] border border-[#F2C94C]/20'}`}>
                                  {v.status === 'confirmed' || v.status === 'Confirmado' ? 'Confirmado' : 'Pendente'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. MEUS IMOVEIS TAB VIEW */}
              {activeTab === 'inventory' && !showAddForm && (
                <div className="space-y-6">
                  {/* Tab header buttons */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-xl md:text-2xl font-extrabold text-[#111111] tracking-tight uppercase">
                        Seu Inventário de Imóveis
                      </h3>
                      <p className="text-xs text-[#7A7F8C] font-semibold uppercase mt-1.5 tracking-wider font-mono">RB Sorocaba Curadoria Exclusiva</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddForm(true);
                        setEditingId(null);
                      }}
                      className="bg-[#050505] hover:bg-[#F5B400] hover:text-[#050505] text-white border border-[#050505] px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <PlusCircle size={15} className="text-[#F5B400] shrink-0" />
                      Anunciar Novo Imóvel
                    </button>
                  </div>

                  {/* Empty state list checks */}
                  {displayedProperties.length === 0 ? (
                    <div className="bg-white border border-[#E7E7E7] rounded-3xl p-16 text-center shadow-sm max-w-lg mx-auto">
                      <div className="w-16 h-16 bg-[#F5B400]/10 border border-[#F5B400]/20 text-[#F5B400] rounded-full flex items-center justify-center mx-auto mb-5">
                        <Home className="text-[#F5B400]" size={28} />
                      </div>
                      <h4 className="text-lg font-bold text-[#111111]">Nenhum Imóvel Cadastrado</h4>
                      <p className="text-sm text-[#7A7F8C] max-w-sm mx-auto mt-2.5 font-medium">
                        Nenhum imóvel cadastrado no portal no momento. Cadastre seu primeiro imóvel para comercialização e gestão de visitas imediatas.
                      </p>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="mt-6 bg-[#050505] hover:bg-[#F5B400] text-white hover:text-[#050505] px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer Transition-all duration-300 shadow-sm border border-[#050505]"
                      >
                        Cadastrar Primeiro Imóvel
                      </button>
                    </div>
                  ) : (
                    /* The beautiful high-end Real Estate Card Inventory grid list */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayedProperties.map(p => {
                        const isSold = p.status === 'Vendido' || p.status === 'vendido';
                        return (
                          <div key={p.id} className="bg-white border border-[#E7E7E7] rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-[#F5B400]/45 hover:shadow-md transition-all duration-300 relative group">
                            {/* Card Media Area */}
                            <div className="aspect-video relative overflow-hidden bg-neutral-100">
                              <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                              {/* Status absolute badges */}
                              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm text-white ${isSold ? 'bg-[#050505] border border-[#F5B400]/30' : (p.alugado ? 'bg-sky-600' : 'bg-[#F2C94C] !text-[#050505]')}`}>
                                  {p.purpose || p.tipoNegocio || 'Venda'}
                                </span>
                                {isSold && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#050505] text-[#F5B400] border border-[#F5B400]/25 shadow-sm">
                                    VENDIDO
                                  </span>
                                )}
                                {p.alugado && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-sky-950 text-sky-400 border border-sky-800 shadow-sm">
                                    ALUGADO
                                  </span>
                                )}
                              </div>
                              <div className="absolute bottom-3 right-3 bg-[#050505]/85 backdrop-blur-sm text-[10px] text-zinc-300 font-bold px-3 py-1 rounded-lg">
                                Código: {getCodigoPublicoImovel(p)}
                              </div>
                            </div>

                            {/* Card Content Data */}
                            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                              <div>
                                <h4 className="text-base font-bold text-[#111111] line-clamp-1 group-hover:text-[#F5B400] transition-colors duration-250">{p.title}</h4>
                                <div className="flex items-center space-x-1.5 text-[#7A7F8C] text-xs mt-1.5">
                                  <MapPin size={12} className="text-[#F5B400] shrink-0" />
                                  <span className="truncate font-medium">{p.neighborhood}, {p.city}</span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] text-[#7A7F8C] font-bold uppercase tracking-wider border-t border-neutral-100 pt-4">
                                  <div className="flex items-center space-x-1 flex-1">
                                    <Maximize size={11} className="text-[#7A7F8C] shrink-0" />
                                    <span>{p.area}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 flex-1">
                                    <BedDouble size={11} className="text-[#7A7F8C] shrink-0" />
                                    <span>{p.beds || 0} Quartos</span>
                                  </div>
                                  <div className="flex items-center space-x-1 flex-1">
                                    <Bath size={11} className="text-[#7A7F8C] shrink-0" />
                                    <span>{p.baths || 0} Banheiros</span>
                                  </div>
                                </div>
                              </div>

                              {/* Price tag & Action Row */}
                              <div className="border-t border-neutral-100 pt-4 flex flex-col space-y-3.5">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[10px] text-[#7A7F8C] font-bold uppercase tracking-wider">Valor do Ativo</span>
                                  <p className="text-lg font-extrabold text-[#111111] leading-none">
                                    {p.price}
                                  </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2.5">
                                  <button
                                    onClick={() => handleEdit(p)}
                                    className="px-3 py-2.5 bg-white hover:bg-neutral-50 border border-[#E7E7E7] hover:border-[#111111] text-xs font-bold uppercase tracking-wider rounded-xl text-[#111111] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                  >
                                    <Settings size={13} className="text-[#F5B400]" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleCopyLink(p)}
                                    className="px-3 py-2.5 bg-white hover:bg-neutral-50 border border-[#E7E7E7] hover:border-[#111111] text-xs font-bold uppercase tracking-wider rounded-xl text-[#111111] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                  >
                                    <Share2 size={13} className="text-[#F5B400]" />
                                    Copiar Link
                                  </button>
                                </div>
                                <button
                                  onClick={() => {
                                    if (onViewFichaTecnica) {
                                      onViewFichaTecnica(p);
                                    } else {
                                      setViewingProperty(p);
                                    }
                                  }}
                                  className="w-full py-3 bg-[#050505] text-white hover:bg-neutral-850 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-[#050505]"
                                >
                                  <Eye size={14} className="text-[#F5B400] shrink-0" />
                                  Visualizar Ficha Técnica
                                </button>
                                <button
                                  onClick={() => {
                                    setWizardProperty(p);
                                    setShowDocChoiceModal(true);
                                  }}
                                  className="w-full py-3 bg-[#F5B400] text-black hover:bg-[#111111] hover:text-[#F5B400] rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-[#F5B400]"
                                >
                                  <FileText size={14} className="shrink-0" />
                                  Gerar Documento / Contrato
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. SOLICICACOES TAB VIEW */}
              {activeTab === 'submissions' && !showAddForm && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl md:text-2xl font-extrabold text-[#111111] tracking-tight text-stone-900 uppercase">
                      Interesses e Solicitações Recebidas
                    </h3>
                    <p className="text-xs text-[#7A7F8C] font-semibold uppercase mt-1.5 tracking-wider">Contatos diretos de interessados no seu portfólio de imóveis</p>
                  </div>

                  {mySubmissions.length === 0 ? (
                    <div className="bg-white border border-[#E7E7E7] rounded-3xl p-16 text-center shadow-sm max-w-lg mx-auto">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-5 border border-neutral-200">
                        <FileText className="text-[#F5B400]" size={28} />
                      </div>
                      <h4 className="text-lg font-bold text-[#111111]">Nenhuma solicitação no momento</h4>
                      <p className="text-sm text-[#7A7F8C] max-w-sm mx-auto mt-2 font-medium">
                        Quando novos clientes enviarem solicitações, interesses ou contatos vinculados aos seus imóveis, eles aparecerão aqui.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white border border-[#E7E7E7] rounded-3xl overflow-hidden shadow-sm">
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-[#050505] text-white border-b border-neutral-150 uppercase text-[10px] tracking-wider font-bold">
                            <tr>
                              <th className="p-4 md:p-5">Remetente</th>
                              <th className="p-4 md:p-5">Telefone</th>
                              <th className="p-4 md:p-5">Propriedade</th>
                              <th className="p-4 md:p-5 text-center">Tipo</th>
                              <th className="p-4 md:p-5 text-right w-[240px]">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 text-sm">
                            {mySubmissions.map(s => (
                              <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors">
                                <td className="p-4 md:p-5 font-bold text-[#111111]">{s.title || s.name || 'Anônimo'}</td>
                                <td className="p-4 md:p-5 text-[#7A7F8C]">
                                  <div className="flex items-center space-x-2">
                                    <span>{s.phone}</span>
                                    <a href={`https://wa.me/${s.phone?.replace(/\D/g, '')}`} target="_blank" className="text-[#20C77A] hover:opacity-80">
                                      <MessageCircle size={15} />
                                    </a>
                                  </div>
                                </td>
                                <td className="p-4 md:p-5 text-[#111111] max-w-[200px] truncate">{s.neighborhood || 'Bairro'} • {s.bedroomCount || s.beds || 3} Dorms</td>
                                <td className="p-4 md:p-5 text-center">
                                  <span className="bg-[#F5B400]/10 border border-[#F5B400]/20 text-[#050505] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    {s.type || 'Interesse'}
                                  </span>
                                </td>
                                <td className="p-4 md:p-5 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button 
                                      onClick={() => handleApprove(s)}
                                      className="bg-[#20C77A]/10 text-[#20C77A] border border-[#20C77A]/20 hover:bg-[#20C77A] hover:text-white transition-all duration-300 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                    >
                                      Aprovar
                                    </button>
                                    <button 
                                      onClick={() => handleReject(s.id)}
                                      className="bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 hover:bg-[#EF4444] hover:text-white transition-all duration-300 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                    >
                                      Remover/Recusar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards View */}
                      <div className="md:hidden divide-y divide-[#EFEFEA]">
                        {mySubmissions.map(s => (
                          <div key={s.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-bold text-stone-900">{s.title || s.name || 'Anônimo'}</h4>
                              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                                {s.type || 'Interesse'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">Telefone: {s.phone}</p>
                            <p className="text-xs text-slate-600">Destino: {s.neighborhood} • {s.city}</p>
                            <div className="flex justify-end gap-2 pt-2">
                              <a 
                                href={`https://wa.me/${s.phone?.replace(/\D/g, '')}`} 
                                target="_blank" 
                                className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1"
                              >
                                <MessageCircle size={12} />
                                WhatsApp
                              </a>
                              <button 
                                onClick={() => handleApprove(s)}
                                className="bg-[#050505] text-amber-500 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                              >
                                Aprovar
                              </button>
                              <button 
                                onClick={() => handleReject(s.id)}
                                className="bg-red-50 text-red-500 border border-red-150 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                              >
                                Recusar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. VISITAS / AGENDA TAB VIEW */}
              {activeTab === 'visits' && !showAddForm && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-black text-stone-900 uppercase tracking-widest">
                        Gestão de Agenda e Visitas
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold uppercase mt-1">Evite conflitos bloqueando seus horários indisponíveis</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setIsBlockingSlot(!isBlockingSlot)}
                        className="bg-[#050505] text-amber-500 border border-zinc-900 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                      >
                        {isBlockingSlot ? 'Reduzir Bloqueios' : 'Bloquear Horário'}
                      </button>
                      <button 
                        onClick={async () => {
                          setIsExportingAgenda(true);
                          await exportReportToPDF('agenda-full-report', `Agenda-RB-Sorocaba-${exportStartDate}-a-${exportEndDate}`);
                          setIsExportingAgenda(false);
                        }}
                        disabled={isExportingAgenda}
                        className="bg-white hover:bg-slate-50 border border-[#EFEFEA] text-stone-900 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        {isExportingAgenda ? <Loader2 size={13} className="animate-spin text-amber-500" /> : <Download size={13} className="text-amber-500" />}
                        Exportar Relatório
                      </button>
                    </div>
                  </div>

                  {/* Slot blocking form overlays under agenda */}
                  {isBlockingSlot && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      className="bg-white border border-red-100 rounded-2xl p-5 shadow-sm"
                    >
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!blockFormData.date || !blockFormData.time) {
                          alert("Preencha a data e o horário!");
                          return;
                        }
                        if (onBlockSlot) {
                          await onBlockSlot(blockFormData);
                          alert("Horário bloqueado com sucesso!");
                          setBlockFormData({ date: '', time: '', reason: '' });
                        }
                      }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-1">Data do Bloqueio</label>
                          <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-rose-500 outline-none"
                            value={blockFormData.date} onChange={e => setBlockFormData({...blockFormData, date: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-1">Horário</label>
                          <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-rose-500 outline-none"
                            value={blockFormData.time} onChange={e => setBlockFormData({...blockFormData, time: e.target.value})}>
                            <option value="">Selecione...</option>
                            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}h</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] pl-1">Motivo do Bloqueio</label>
                          <div className="flex gap-2">
                            <input type="text" placeholder="Ex: Viagem, manutenção programada..." 
                              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-rose-500 outline-none"
                              value={blockFormData.reason} onChange={e => setBlockFormData({...blockFormData, reason: e.target.value})} />
                            <button type="submit" className="bg-rose-500 text-white px-5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-600 transition-colors">
                              Bloquear
                            </button>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {myVisits.length === 0 && blockedSlots.length === 0 ? (
                    <div className="bg-white border border-[#EFEFEA] rounded-2xl p-12 text-center shadow-sm">
                      <Calendar className="text-amber-500 mx-auto mb-4 animate-pulse" size={40} />
                      <h4 className="text-base font-bold text-stone-900">Agenda Livre</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 font-medium">
                        Sua agenda e agendamentos de visitas aos seus imóveis em Sorocaba estão limpos. Use o bloqueador acima para impossibilitar agendamentos em horários pessoais.
                      </p>
                    </div>
                  ) : (
                    /* Calendar Table list */
                    <div className="bg-white border border-[#EFEFEA] rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans">
                          <thead className="bg-[#050505] text-[#A1A1AA] border-b border-zinc-900 uppercase text-[9px] tracking-widest font-black">
                            <tr>
                              <th className="p-4">Data/Hora</th>
                              <th className="p-4">Cliente/Visitante</th>
                              <th className="p-4">Responsável Imóvel</th>
                              <th className="p-4 text-center">Status</th>
                              <th className="p-4 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EFEFEA] text-xs">
                            {/* Merge visits and blocks for elegant display */}
                            {[
                              ...myVisits.map(v => ({...v, typeKey: 'visit'})),
                              ...blockedSlots.map(s => ({...s, typeKey: 'blocked'}))
                            ].sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time)).map((item, idx) => {
                              const isBlocked = item.typeKey === 'blocked';
                              return (
                                <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${isBlocked ? 'bg-red-50/20' : ''}`}>
                                  <td className="p-4 font-bold text-stone-900">
                                    {item.date.split('-').reverse().join('/')} às {item.time}h
                                  </td>
                                  <td className="p-4">
                                    {isBlocked ? (
                                      <span className="text-red-650 italic font-medium text-[11px]">Horário Bloqueado: {item.reason || 'S/ Motivo'}</span>
                                    ) : (
                                      <div>
                                        <p className="font-bold text-stone-900 leading-none">{item.name}</p>
                                        <div className="flex items-center space-x-1 mt-1 text-slate-400">
                                          <span>{item.phone}</span>
                                          <a href={`https://wa.me/${item.phone?.replace(/\D/g, '')}`} target="_blank" className="text-[#25D366] shrink-0">
                                            <MessageCircle size={10} />
                                          </a>
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-4 text-slate-600 truncate max-w-[200px]">
                                    {item.propertyName || item.reason || 'Imóvel RB Sorocaba'}
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={`
                                      px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest
                                      ${isBlocked 
                                        ? 'bg-rose-50 text-rose-600' 
                                        : item.status === 'confirmed' 
                                          ? 'bg-emerald-50 text-emerald-600' 
                                          : 'bg-amber-50 text-amber-700'
                                      }
                                    `}>
                                      {isBlocked ? 'Inativo/Bloqueio' : item.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    {isBlocked ? (
                                      <button 
                                        onClick={() => onUnblockSlot?.(item.id)}
                                        className="text-rose-500 hover:text-rose-600 text-[10px] font-bold uppercase underline underline-offset-4"
                                      >
                                        Remover
                                      </button>
                                    ) : (
                                      <div className="flex justify-end gap-1.5">
                                        {item.status !== 'confirmed' && (
                                          <button
                                            onClick={async () => {
                                              setStatusUpdating(item.id);
                                              try {
                                                await onUpdateVisitStatus?.(item.id, 'confirmed');
                                              } finally {
                                                setStatusUpdating(null);
                                              }
                                            }}
                                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 p-2 rounded-lg transition-all"
                                            title="Confirmar"
                                          >
                                            <Check size={14} />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => {
                                            if (confirm("Excluir este agendamento permanente?")) {
                                              onDeleteVisit?.(item.id);
                                            }
                                          }}
                                          className="bg-red-50 text-red-500 hover:bg-red-100 p-2 rounded-lg transition-all"
                                          title="Deletar"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GESTÃO DE LOCAÇÕES TAB VIEW */}
              {activeTab === 'rentals' && !showAddForm && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-black text-stone-900 uppercase tracking-widest">
                        Gestão de Locações Ativas
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold uppercase mt-1">
                        Controle administrativo e financeiro de imóveis alugados - RB Sorocaba
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingLocacao(null);
                        setFormLocacao(INITIAL_FORM_LOCACAO);
                        setModalLancamentoLocacaoAberto(true);
                      }}
                      className="bg-stone-950 text-amber-500 hover:bg-stone-900 border border-stone-850 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Plus size={14} className="stroke-[3]" /> Lançar Locação
                    </button>
                  </div>

                  {(() => {
                    const activeLocaciones = locacoesList.filter(l => l.contratoAtivo !== false);
                    const totalIncome = activeLocaciones.reduce((acc, l) => acc + Number(l.valorAluguelMensal || 0), 0);
                    const inDayCount = activeLocaciones.filter(l => l.locacaoEmDia !== false).length;
                    const delinquentCount = activeLocaciones.filter(l => l.locacaoEmDia === false || l.statusLocacao === 'Pendente').length;
                    const predictedCommission = activeLocaciones.reduce((acc, l) => acc + Number(l.comissaoImobiliariaValor || 0), 0);

                    return (
                      <>
                        {/* Summary metric cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                          <div className="bg-white border border-[#EFEFEA] p-5 rounded-2xl shadow-xs hover:border-amber-400 transition-all">
                            <span className="text-[8px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1 leading-none block border-l-2 border-amber-500">
                              Contratos Ativos
                            </span>
                            <p className="text-lg md:text-2xl font-black text-stone-900 leading-none mt-2.5 tracking-tight">
                              {activeLocaciones.length}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1.5 font-medium">Contratos em vigência</p>
                          </div>

                          <div className="bg-white border border-[#EFEFEA] p-5 rounded-2xl shadow-xs hover:border-amber-400 transition-all">
                            <span className="text-[8px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1 leading-none block border-l-2 border-emerald-500">
                              Aluguel Mensal
                            </span>
                            <p className="text-lg md:text-xl font-black text-emerald-600 leading-none mt-2.5 tracking-tight">
                              R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1.5 font-medium">Total de aluguéis ativos</p>
                          </div>

                          <div className="bg-white border border-[#EFEFEA] p-5 rounded-2xl shadow-xs hover:border-amber-400 transition-all">
                            <span className="text-[8px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1 leading-none block border-l-2 border-amber-500">
                              Comissão Prevista
                            </span>
                            <p className="text-lg md:text-xl font-black text-amber-600 leading-none mt-2.5 tracking-tight">
                              R$ {predictedCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1.5 font-medium">Honorários RB Sorocaba</p>
                          </div>

                          <div className="bg-white border border-[#EFEFEA] p-5 rounded-2xl shadow-xs hover:border-amber-400 transition-all">
                            <span className="text-[8px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1 leading-none block border-l-2 border-emerald-500">
                              Em Dia
                            </span>
                            <p className="text-lg md:text-2xl font-black text-emerald-600 leading-none mt-2.5 tracking-tight">
                              {inDayCount}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1.5 font-medium">Adimplência ({activeLocaciones.length > 0 ? Math.round((inDayCount / activeLocaciones.length) * 100) : 0}%)</p>
                          </div>

                          <div className="bg-white border border-[#EFEFEA] p-5 rounded-2xl shadow-xs hover:border-amber-400 transition-all">
                            <span className="text-[8px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1 leading-none block border-l-2 border-rose-500">
                              Pendentes
                            </span>
                            <p className="text-lg md:text-2xl font-black text-rose-600 leading-none mt-2.5 tracking-tight">
                              {delinquentCount}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1.5 font-medium">Cobranças retroativas</p>
                          </div>
                        </div>

                        {/* List/Table of Rented Properties */}
                        <div className="bg-white border border-[#EFEFEA] rounded-2xl p-6 shadow-xs space-y-4">
                          <div className="border-b border-slate-50 pb-3 flex justify-between items-center">
                            <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest">Painel de Locatários e Contratos</h4>
                          </div>

                          {locacoesList.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-xs space-y-3">
                              <CheckCircle2 className="mx-auto text-amber-500" size={32} />
                              <p className="font-bold uppercase tracking-widest text-[#A1A1AA]">Nenhuma locação encontrada no sistema</p>
                              <p className="text-[10px] max-w-sm mx-auto leading-relaxed">Não há contratos de locação registrados para seu usuário. Lance uma nova locação preenchendo todos os dados.</p>
                              <button 
                                onClick={() => {
                                  setEditingLocacao(null);
                                  setFormLocacao(INITIAL_FORM_LOCACAO);
                                  setModalLancamentoLocacaoAberto(true);
                                }}
                                className="bg-stone-950 text-amber-500 hover:bg-stone-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest mt-2"
                              >
                                + Lançar primeira locação
                              </button>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs text-slate-600">
                                <thead>
                                  <tr className="border-b border-slate-100 text-[10px] text-[#A1A1AA] font-black uppercase tracking-widest">
                                    <th className="pb-3 text-left">Imóvel</th>
                                    <th className="pb-3 text-left">Locatário / Contatos</th>
                                    <th className="pb-3 text-left">Aluguel Contratado</th>
                                    <th className="pb-3 text-left">Taxas Adicionais</th>
                                    <th className="pb-3 text-left">Comissão RB</th>
                                    <th className="pb-3 text-left">Status</th>
                                    <th className="pb-3 text-right">Controles Administrativos</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {locacoesList.map((loc: any) => {
                                    const locacaoEmDia = loc.locacaoEmDia !== false;
                                    const totalConsolidado = Number(loc.valorAluguelMensal || 0) + Number(loc.valorCondominio || 0) + Number(loc.iptuMensal || 0) + Number(loc.taxaLixoMensal || 0);

                                    return (
                                      <tr key={loc.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-all font-medium">
                                        <td className="py-4 text-left max-w-[200px]">
                                          <div className="font-black text-stone-950 uppercase tracking-tight truncate" title={loc.tituloImovel}>{loc.tituloImovel}</div>
                                          <div className="text-[9px] text-amber-600 font-mono font-bold mt-0.5">RB-{loc.codigoImovel || loc.imovelId}</div>
                                          <div className="text-[9px] text-slate-400 font-semibold truncate" title={loc.enderecoImovel}>{loc.enderecoImovel}</div>
                                        </td>
                                        <td className="py-4 text-left">
                                          <div className="font-bold text-stone-900">{loc.locatarioNome || "Não informado"}</div>
                                          {loc.locatarioCpfCnpj && (
                                            <div className="text-[9px] text-slate-400 font-mono">CPF: {loc.locatarioCpfCnpj}</div>
                                          )}
                                          <div className="text-[9px] text-slate-400 font-serif mt-1 flex flex-col gap-0.5">
                                            {loc.locatarioWhatsapp && <span className="font-sans">📞 {loc.locatarioWhatsapp}</span>}
                                            {loc.locatarioEmail && <span className="font-sans">✉️ {loc.locatarioEmail}</span>}
                                          </div>
                                        </td>
                                        <td className="py-4 text-left">
                                          <div className="font-extrabold text-stone-950">R$ {Number(loc.valorAluguelMensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                          <div className="text-[9px] text-slate-400 font-semibold mt-0.5">Vencimento: dia {loc.diaVencimentoAluguel || "10"}</div>
                                          <div className="text-[8px] text-amber-700 font-mono mt-1 bg-amber-50 px-1.5 py-0.5 rounded inline-block">
                                            Garantia: {loc.garantiaLocaticia || "Caução"}
                                          </div>
                                        </td>
                                        <td className="py-4 text-left">
                                          <div className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                                            Cond: R$ {Number(loc.valorCondominio || 0).toLocaleString('pt-BR')} <br />
                                            IPTU: R$ {Number(loc.iptuMensal || 0).toLocaleString('pt-BR')} <br />
                                            Lixo: R$ {Number(loc.taxaLixoMensal || 0).toLocaleString('pt-BR')}
                                          </div>
                                          <div className="text-[9px] text-stone-800 font-bold mt-1">
                                            Total: R$ {totalConsolidado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </div>
                                        </td>
                                        <td className="py-4 text-left">
                                          <div className="font-bold text-amber-600">R$ {Number(loc.comissaoImobiliariaValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                          <div className="text-[9px] text-slate-400 font-bold font-mono mt-0.5">({loc.comissaoImobiliariaPercentual}%) do Aluguel</div>
                                        </td>
                                        <td className="py-4 text-left">
                                          <div className="flex flex-col gap-1 items-start">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${loc.contratoAtivo !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-50 text-stone-500 border border-stone-200'}`}>
                                              {loc.contratoAtivo !== false ? 'Contrato Ativo' : 'Encerrada'}
                                            </span>
                                            {loc.contratoAtivo !== false && (
                                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${locacaoEmDia ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'}`}>
                                                {locacaoEmDia ? 'Adimplente ✅' : 'Pendente ⚠️'}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-4 text-right">
                                          <div className="flex flex-wrap justify-end gap-1.5">
                                            <button
                                              onClick={() => handleEditLocacao(loc)}
                                              className="border border-slate-200 hover:border-amber-400 text-stone-800 hover:bg-slate-50 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all cursor-pointer"
                                            >
                                              Editar
                                            </button>
                                            
                                            {loc.contratoAtivo !== false && (
                                              <>
                                                {locacaoEmDia ? (
                                                  <button
                                                    onClick={() => handleSetLocacaoStatusEmDia(loc, false)}
                                                    className="border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-700 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all cursor-pointer"
                                                    title="Alterar para status devedor / em atraso"
                                                  >
                                                    Pendente
                                                  </button>
                                                ) : (
                                                  <button
                                                    onClick={() => handleSetLocacaoStatusEmDia(loc, true)}
                                                    className="border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all cursor-pointer"
                                                    title="Marcar aluguel pago / em dia"
                                                  >
                                                    Em Dia
                                                  </button>
                                                )}
                                                
                                                <button
                                                  onClick={() => handleEncerrarLocacao(loc)}
                                                  className="border border-stone-800 bg-stone-900 text-amber-500 hover:bg-stone-800 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all cursor-pointer"
                                                >
                                                  Encerrar
                                                </button>
                                              </>
                                            )}
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

                        {/* Modal Lançamento overlay */}
                        {modalLancamentoLocacaoAberto && (
                          <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                            <div className="bg-white rounded-3xl max-w-4xl w-full border border-[#EFEFEA] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                              {/* Header */}
                              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-stone-50">
                                <div>
                                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest leading-none">
                                    {editingLocacao ? 'Editar Locação Existente' : 'Lançar Nova Locação'}
                                  </h3>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">RB Sorocaba Negócios Imobiliários - Gestão Integrada</p>
                                </div>
                                <button 
                                  onClick={() => {
                                    setModalLancamentoLocacaoAberto(false);
                                    setEditingLocacao(null);
                                  }}
                                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-stone-900 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>

                              {/* Form Content */}
                              <form onSubmit={handleSalvarLocacao} className="flex-1 overflow-y-auto p-8 space-y-8 text-xs">
                                {/* SEÇÃO 1 - Imóvel */}
                                <div className="space-y-4">
                                  <h4 className="font-extrabold text-[#D4AF37] uppercase tracking-wider text-[11px] pb-1 border-b border-amber-100">
                                    SEÇÃO 1 - Seleção do Imóvel
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Selecionar Imóvel *</label>
                                      <select
                                        required
                                        value={formLocacao.imovelId}
                                        onChange={(e) => handleSelectImovel(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 transition-colors accent-amber-500 focus:outline-none"
                                      >
                                        <option value="">-- Selecione o Imóvel da RB Sorocaba --</option>
                                        {properties
                                          .filter((p: any) => {
                                            const matchesPurpose = p.purpose === "Locação" || p.purpose === "Venda e Locação" || p.tipoNegocio === "Locação" || p.tipoNegocio === "Venda e Locação";
                                            const isRented = p.alugado === true || p.statusLocacao === "Alugado" || p.gestaoLocacao?.alugado === true;
                                            const isCurrentEditing = editingLocacao && String(p.id) === String(editingLocacao.imovelId);
                                            return matchesPurpose && (!isRented || isCurrentEditing);
                                          })
                                          .map(p => {
                                            const label = `${p.title} (RB-${p.codigoImovel || p.codigo || p.id}) - ${p.purpose}`;
                                            return (
                                              <option key={p.id} value={p.id}>
                                                {label}
                                              </option>
                                            );
                                          })}
                                      </select>
                                    </div>
                                    {formLocacao.imovelId && (() => {
                                      const selectedProp = properties.find(p => String(p.id) === String(formLocacao.imovelId));
                                      if (!selectedProp) return null;
                                      return (
                                        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex flex-col justify-center space-y-1">
                                          <div className="font-black text-stone-900 uppercase">RB-{selectedProp.codigoImovel || selectedProp.codigo || selectedProp.id} - {selectedProp.title}</div>
                                          <div className="text-slate-500">{selectedProp.neighborhood}, {selectedProp.city} - {selectedProp.purpose}</div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  
                                  {formLocacao.imovelId && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                      <div>
                                        <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5">Aluguel Mensal Sugerido</label>
                                        <div className="font-bold text-stone-800 text-xs">
                                          R$ {(properties.find(p => String(p.id) === String(formLocacao.imovelId))?.valorAluguel || properties.find(p => String(p.id) === String(formLocacao.imovelId))?.valorAluguel || properties.find(p => String(p.id) === String(formLocacao.imovelId))?.priceValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5">Condomínio</label>
                                        <div className="font-bold text-stone-800 text-xs">
                                          R$ {(properties.find(p => String(p.id) === String(formLocacao.imovelId))?.valorCondominio || Number(properties.find(p => String(p.id) === String(formLocacao.imovelId))?.condoValue) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5">IPTU Mensal</label>
                                        <div className="font-bold text-stone-800 text-xs">
                                          R$ {(properties.find(p => String(p.id) === String(formLocacao.imovelId))?.iptuMensal || properties.find(p => String(p.id) === String(formLocacao.imovelId))?.valorIptu || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5">Taxa de Lixo</label>
                                        <div className="font-bold text-stone-800 text-xs">
                                          R$ {(properties.find(p => String(p.id) === String(formLocacao.imovelId))?.taxaLixoMensal || properties.find(p => String(p.id) === String(formLocacao.imovelId))?.taxaLixo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* SEÇÃO 2 - Dados do Locatário */}
                                <div className="space-y-4">
                                  <h4 className="font-extrabold text-[#D4AF37] uppercase tracking-wider text-[11px] pb-1 border-b border-amber-100">
                                    SEÇÃO 2 - Dados Cadastrais do Locatário
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Nome Completo do Locatário *</label>
                                      <input
                                        required
                                        type="text"
                                        placeholder="Ex: João da Silva"
                                        value={formLocacao.locatarioNome}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, locatarioNome: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">CPF/CNPJ</label>
                                      <input
                                        type="text"
                                        placeholder="Ex: 123.456.789-00"
                                        value={formLocacao.locatarioCpfCnpj}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, locatarioCpfCnpj: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">RG/IE</label>
                                      <input
                                        type="text"
                                        placeholder="Ex: 12.345.678-9"
                                        value={formLocacao.locatarioRgIe}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, locatarioRgIe: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">WhatsApp</label>
                                      <input
                                        type="text"
                                        placeholder="Ex: (15) 99123-4567"
                                        value={formLocacao.locatarioWhatsapp}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, locatarioWhatsapp: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">E-mail</label>
                                      <input
                                        type="email"
                                        placeholder="Ex: locatario@gmail.com"
                                        value={formLocacao.locatarioEmail}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, locatarioEmail: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Endereço Completo</label>
                                      <input
                                        type="text"
                                        placeholder="Ex: Rua das Flores, 123"
                                        value={formLocacao.locatarioEndereco}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, locatarioEndereco: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">CEP</label>
                                      <input
                                        type="text"
                                        placeholder="Ex: 18000-000"
                                        value={formLocacao.locatarioCep}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, locatarioCep: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Cidade</label>
                                      <input
                                        type="text"
                                        value={formLocacao.locatarioCidade}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, locatarioCidade: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Estado</label>
                                      <input
                                        type="text"
                                        value={formLocacao.locatarioEstado}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, locatarioEstado: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* SEÇÃO 3 - Contrato */}
                                <div className="space-y-4">
                                  <h4 className="font-extrabold text-[#D4AF37] uppercase tracking-wider text-[11px] pb-1 border-b border-amber-100">
                                    SEÇÃO 3 - Vigência de Aluguel e Valores Contratuais
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Início do Contrato *</label>
                                      <input
                                        required
                                        type="date"
                                        value={formLocacao.dataInicioLocacao}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, dataInicioLocacao: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Vencimento de Contrato *</label>
                                      <input
                                        required
                                        type="date"
                                        value={formLocacao.dataFimLocacao}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, dataFimLocacao: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Dia de Vencimento *</label>
                                      <input
                                        required
                                        type="number"
                                        min="1"
                                        max="31"
                                        placeholder="Ex: 5"
                                        value={formLocacao.diaVencimentoAluguel}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, diaVencimentoAluguel: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Garantia Locatícia *</label>
                                      <select
                                        required
                                        value={formLocacao.garantiaLocaticia}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, garantiaLocaticia: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      >
                                        <option value="Caução">Caução</option>
                                        <option value="Fiador">Fiador</option>
                                        <option value="Seguro Fiança">Seguro Fiança</option>
                                        <option value="Título de Capitalização">Título de Capitalização</option>
                                        <option value="CredPago">CredPago</option>
                                        <option value="Sem garantia">Sem garantia</option>
                                        <option value="A combinar">A combinar</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Depósito Caução (BRL)</label>
                                      <input
                                        type="number"
                                        placeholder="Ex: 6000"
                                        value={formLocacao.valorCaucaoInput || ''}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, valorCaucaoInput: Number(e.target.value) }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Valor Aluguel Contratado *</label>
                                      <input
                                        required
                                        type="number"
                                        placeholder="Ex: 2400"
                                        value={formLocacao.valorAluguelMensalInput || ''}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, valorAluguelMensalInput: Number(e.target.value) }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Condomínio Mensal</label>
                                      <input
                                        type="number"
                                        placeholder="Ex: 350"
                                        value={formLocacao.valorCondominioInput || ''}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, valorCondominioInput: Number(e.target.value) }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">IPTU Mensal</label>
                                      <input
                                        type="number"
                                        placeholder="Ex: 80"
                                        value={formLocacao.iptuMensalInput || ''}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, iptuMensalInput: Number(e.target.value) }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Taxa de Lixo Mensal</label>
                                      <input
                                        type="number"
                                        placeholder="Ex: 20"
                                        value={formLocacao.taxaLixoMensalInput || ''}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, taxaLixoMensalInput: Number(e.target.value) }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-medium text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>

                                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 sm:col-span-2 md:col-span-3 flex justify-between items-center">
                                      <div>
                                        <span className="block text-[9px] font-black uppercase text-amber-800 tracking-wider">CÁLCULO TOTAL DA LOCAÇÃO</span>
                                        <span className="text-[10px] text-amber-700 font-semibold">(Aluguel + Condomínio + IPTU + Lixo)</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-base font-black text-amber-900 tracking-tight">
                                          R$ {(
                                            (formLocacao.valorAluguelMensalInput || 0) +
                                            (formLocacao.valorCondominioInput || 0) +
                                            (formLocacao.iptuMensalInput || 0) +
                                            (formLocacao.taxaLixoMensalInput || 0)
                                          ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="block text-[9px] font-bold text-amber-600">Mensal Consolidado</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* SEÇÃO 4 - Comissão da Imobiliária */}
                                <div className="space-y-4">
                                  <h4 className="font-extrabold text-[#D4AF37] uppercase tracking-wider text-[11px] pb-1 border-b border-amber-100">
                                    SEÇÃO 4 - Comissão da Imobiliária (RB Sorocaba)
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Percentual (%) *</label>
                                      <input
                                        required
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={formLocacao.comissaoImobiliariaPercentualInput}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, comissaoImobiliariaPercentualInput: Number(e.target.value) }))}
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-xl px-4 py-2.5 font-bold text-stone-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Aluguel Base de Cálculo</label>
                                      <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 font-black text-slate-700">
                                        R$ {(formLocacao.valorAluguelMensalInput || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Comissão RB Sorocaba Calculada</label>
                                      <div className="bg-amber-100 border border-amber-200 rounded-xl px-4 py-2.5 font-black text-amber-900">
                                        R$ {(
                                          (formLocacao.valorAluguelMensalInput || 0) *
                                          ((formLocacao.comissaoImobiliariaPercentualInput || 0) / 100)
                                        ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-[10px] italic text-[#A1A1AA] font-medium leading-relaxed pl-1 border-l-2 border-stone-300">
                                    Nota regulamentar: A comissão RB Sorocaba é faturada única e exclusivamente sobre o valor líquido do Aluguel de R$ {(formLocacao.valorAluguelMensalInput || 0).toLocaleString('pt-BR')}, sem incidência sobre taxas extras ou contribuição de condomínio.
                                  </p>
                                </div>

                                {/* SEÇÃO 5 - Configurações Extras e Observações */}
                                <div className="space-y-4">
                                  <h4 className="font-extrabold text-[#D4AF37] uppercase tracking-wider text-[11px] pb-1 border-b border-amber-100">
                                    SEÇÃO 5 - Diretrizes Contratuais e Histórico
                                  </h4>
                                  
                                  <div className="flex flex-col gap-3 py-1.5 pl-1">
                                    <label className="flex items-center gap-2.5 select-none text-slate-700 font-bold">
                                      <input
                                        type="checkbox"
                                        checked={formLocacao.manterDisponivelParaVenda}
                                        onChange={(e) => setFormLocacao(prev => ({ ...prev, manterDisponivelParaVenda: e.target.checked }))}
                                        className="w-4.5 h-4.5 accent-amber-500 cursor-pointer rounded"
                                      />
                                      Manter Imóvel Ativo para Vendas Simultâneas no Site
                                    </label>
                                    <p className="text-[10px] text-slate-400 pl-7 leading-relaxed">
                                      Dica: Recomenda-se manter ativa a venda se o imóvel for de finalidade dupla "Venda e Locação" e o proprietário concordar com visitas agendadas.
                                    </p>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Observações da Locação</label>
                                    <textarea
                                      rows={3}
                                      placeholder="Ex: Contrato assinado via Docusign, garantia de caução em poupança exclusiva..."
                                      value={formLocacao.observacoesLocacao}
                                      onChange={(e) => setFormLocacao(prev => ({ ...prev, observacoesLocacao: e.target.value }))}
                                      className="w-full bg-slate-50 border border-slate-100 hover:border-amber-400 rounded-2xl px-4 py-3 font-medium text-stone-800 focus:outline-none transition-colors"
                                    />
                                  </div>
                                </div>

                                {/* Footer actions inside scrollable */}
                                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                  <button
                                    type="button"
                                    disabled={loadingSalvarLocacao}
                                    onClick={() => {
                                      setModalLancamentoLocacaoAberto(false);
                                      setEditingLocacao(null);
                                    }}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-stone-900 font-black uppercase tracking-wider hover:bg-slate-50 transition-all text-[10px] disabled:opacity-50 cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={loadingSalvarLocacao}
                                    className="px-6 py-2.5 rounded-xl bg-stone-900 text-amber-500 hover:bg-[#111] font-black uppercase tracking-wider transition-all border border-stone-800 text-[10px] shadow-md hover:shadow-lg flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                  >
                                    {loadingSalvarLocacao ? (
                                      <>
                                        <Loader2 size={12} className="animate-spin" /> Processando...
                                      </>
                                    ) : editingLocacao ? (
                                      'Atualizar Alterações'
                                    ) : (
                                      'Lançar Operação'
                                    )}
                                  </button>
                                </div>
                              </form>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* 5. FINANCEIRO TAB VIEW (EXCLUSIVE REGION) */}
              {activeTab === 'financial' && !showAddForm && (
                <FinancialDashboard />
              )}

              {/* 7. GESTÃO DE LOCAÇÕES TAB VIEW */}
              {activeTab === 'rentals' && !showAddForm && (
                <RentalDashboard />
              )}

              {/* 8. CONTRATOS E PROPOSTAS TAB VIEW */}
              {activeTab === 'contracts' && !showAddForm && (
                <ContractsDashboard />
              )}

              {activeTab === 'profile' && !showAddForm && (
                <div className="space-y-8 max-w-4xl">
                  <div>
                    <h3 className="text-xl font-extrabold text-[#050505] uppercase tracking-widest">
                      Seu Perfil de Proprietário
                    </h3>
                    <p className="text-xs text-[#A1A1AA] font-bold uppercase tracking-wider mt-1.5">Suas credenciais e dados para elaboração contratual na RB Sorocaba</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-8">
                    {/* SECTION 1: Dados Pessoais & Identificação */}
                    <div className="bg-white border border-[#EFEFEA] rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-[#F6F6F4] bg-neutral-50/50 flex items-center space-x-3.5">
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                          <User size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#050505] uppercase tracking-wider">Dados Pessoais & Identificação</h4>
                          <p className="text-[9px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">Informações cadastrais civis e faturamento</p>
                        </div>
                      </div>
                      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Nome Completo</label>
                          <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all placeholder-[#A1A1AA]"
                            value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Seu nome completo" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">CPF ou CNPJ</label>
                          <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all placeholder-[#A1A1AA]"
                            value={profile.cpfCnpj} onChange={e => setProfile({...profile, cpfCnpj: e.target.value})} placeholder="000.000.000-00 ou CNPJ" />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Email Cadastrado (Não Alterável)</label>
                          <div className="flex items-center space-x-2 bg-[#F2F2EC] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-semibold text-slate-400 cursor-not-allowed">
                            <Mail size={13} className="text-slate-400 shrink-0" />
                            <span>{profile.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: Comunicação & Contato */}
                    <div className="bg-white border border-[#EFEFEA] rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-[#F6F6F4] bg-neutral-50/50 flex items-center space-x-3.5">
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                          <Phone size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#050505] uppercase tracking-wider">Comunicação & Contatos Diretos</h4>
                          <p className="text-[9px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">Canais diretos para confirmação de visitas e propostas</p>
                        </div>
                      </div>
                      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">WhatsApp de Contato</label>
                          <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all placeholder-[#A1A1AA]"
                            value={profile.whatsapp} onChange={e => setProfile({...profile, whatsapp: e.target.value})} placeholder="+55 (15) 99999-9999" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Telefone Fixo</label>
                          <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all placeholder-[#A1A1AA]"
                            value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="(15) 3333-3333" />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: Endereço & Localização */}
                    <div className="bg-white border border-[#EFEFEA] rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-[#F6F6F4] bg-neutral-50/50 flex items-center space-x-3.5">
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#050505] uppercase tracking-wider">Endereço Principal & Localização</h4>
                          <p className="text-[9px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">Localização física para faturamento fiscal e intimações contratuais</p>
                        </div>
                      </div>
                      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Endereço Principal</label>
                          <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all placeholder-[#A1A1AA]"
                            value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} placeholder="Rua, Número, Bloco, AP" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Cidade Sede</label>
                          <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all placeholder-[#A1A1AA]"
                            value={profile.city} onChange={e => setProfile({...profile, city: e.target.value})} placeholder="Sorocaba" />
                        </div>
                        <div className="space-y-1.5 md:col-span-3">
                          <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Estado (UF)</label>
                          <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all placeholder-[#A1A1AA]"
                            value={profile.state} onChange={e => setProfile({...profile, state: e.target.value})} placeholder="SP" />
                        </div>
                      </div>
                    </div>

                    {/* Form actions submitting button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="bg-[#050505] hover:bg-stone-900 text-white hover:text-amber-500 border border-zinc-900 px-10 py-4 rounded-xl text-xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow shadow-stone-950/20 hover:shadow-lg active:scale-[0.98] duration-205"
                      >
                        {savingProfile ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-amber-500" />
                            Gravando alterações...
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={14} className="text-amber-500" />
                            Confirmar & Salvar Alterações
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 7. CORRETORES TAB VIEW - PREMIUM CRM STAFF MANAGER */}
              {activeTab === 'brokers' && !showAddForm && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-[#050505] uppercase tracking-widest">
                        Gestão de Corretores Whitelist
                      </h3>
                      <p className="text-xs text-[#A1A1AA] font-bold uppercase tracking-wider mt-1.5">
                        Equipe oficial de vendas e locação cadastrada na RB Sorocaba
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingBroker(null);
                        setFormBroker({ nome: '', creci: '', telefone: '', whatsapp: '', email: '', fotoUrl: '', foto: '', ativo: true });
                        setIsBrokerModalOpen(true);
                      }}
                      className="bg-[#050505] text-amber-500 hover:bg-[#121212] hover:text-amber-400 border border-neutral-900 px-6 py-3 rounded-lg text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2 transition-all shadow"
                    >
                      <Plus size={14} /> Cadastrar Corretor
                    </button>
                  </div>

                  {brokersLoading ? (
                    <div className="p-12 text-center bg-white border border-[#EFEFEA] rounded-2xl flex flex-col items-center justify-center space-y-3">
                      <Loader2 size={24} className="animate-spin text-amber-500" />
                      <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">Sincronizando corretores corporativos...</p>
                    </div>
                  ) : brokersList.length === 0 ? (
                    <div className="bg-white border border-[#EFEFEA] rounded-2xl p-12 text-center space-y-4">
                      <Shield size={32} className="mx-auto text-amber-500/45" />
                      <p className="text-stone-500 font-medium text-xs leading-relaxed">Nenhum corretor corporativo associado à base no momento.</p>
                      <button
                        onClick={() => {
                          setEditingBroker(null);
                          setFormBroker({ nome: 'Corretor Demonstrativo', creci: 'CRECI 99999-F', telefone: '(15) 99123-4567', whatsapp: '(15) 99123-4567', email: 'vendas@rbsorocaba.com.br', fotoUrl: '', foto: '', ativo: true });
                          setIsBrokerModalOpen(true);
                        }}
                        className="text-amber-500 hover:text-amber-600 text-xs font-black uppercase tracking-widest"
                      >
                        Clique para Inicializar com Exemplo
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {brokersList.map((broker) => (
                        <div key={broker.id} className="bg-white border border-[#EFEFEA] rounded-2xl shadow-sm hover:shadow-md overflow-hidden relative group transition-all duration-200">
                          <div className="p-6 flex items-start space-x-4">
                            <div className="w-16 h-16 rounded-full bg-stone-100 border border-[#EFEFEA] flex items-center justify-center font-black text-stone-400 text-xl overflow-hidden shrink-0">
                              {(broker.fotoUrl || broker.foto) ? (
                                <img src={broker.fotoUrl || broker.foto} alt={broker.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                (broker.nome || "C").charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-xs font-black text-[#050505] uppercase tracking-wider truncate">{broker.nome}</h4>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 ${broker.ativo ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                                  {broker.ativo ? "Ativo" : "Inativo"}
                                </span>
                              </div>
                              <p className="text-[10px] text-amber-600 font-extrabold tracking-wider uppercase">{broker.creci || "Sem CRECI"}</p>
                              
                              <div className="text-[10px] text-zinc-500 space-y-0.5 font-medium">
                                <p className="truncate">📞 {broker.telefone || "Telefone não cadastrado"}</p>
                                {broker.whatsapp && <p className="truncate">💬 {broker.whatsapp}</p>}
                                <p className="truncate">✉️ {broker.email || "E-mail corporativo"}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="px-5 py-3.5 bg-neutral-50/70 border-t border-[#F6F6F4] flex justify-end space-x-2.5">
                            <button
                              onClick={() => {
                                setEditingBroker(broker);
                                setFormBroker({
                                  nome: broker.nome || "",
                                  creci: broker.creci || "",
                                  telefone: broker.telefone || "",
                                  whatsapp: broker.whatsapp || broker.whatsApp || "",
                                  email: broker.email || "",
                                  fotoUrl: broker.fotoUrl || broker.foto || "",
                                  foto: broker.foto || broker.fotoUrl || "",
                                  ativo: broker.ativo !== undefined ? broker.ativo : true
                                });
                                setIsBrokerModalOpen(true);
                              }}
                              className="text-stone-600 hover:text-amber-500 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteBroker(broker.id)}
                              className="text-red-500 hover:text-red-600 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 8. NEIGHBORHOODS TAB VIEW - PREMIUM CONFIG PANEL */}
              {activeTab === 'neighborhoods' && !showAddForm && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-[#050505] uppercase tracking-widest">
                        Zonamento & Bairros de Atuação
                      </h3>
                      <p className="text-xs text-[#A1A1AA] font-bold uppercase tracking-wider mt-1.5">
                        Gerencie os bairros oficiais de Sorocaba com indexação de mapas de buscas
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingNeighborhood(null);
                        setFormNeighborhood({ nome: '', cidade: 'Sorocaba', estado: 'SP', ativo: true });
                        setIsNeighborhoodModalOpen(true);
                      }}
                      className="bg-[#050505] text-amber-500 hover:bg-[#121212] hover:text-amber-400 border border-neutral-900 px-6 py-3 rounded-lg text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2 transition-all shadow"
                    >
                      <Plus size={14} /> Cadastrar Bairro
                    </button>
                  </div>

                  {neighborhoodsLoading ? (
                    <div className="p-12 text-center bg-white border border-[#EFEFEA] rounded-2xl flex flex-col items-center justify-center space-y-3">
                      <Loader2 size={24} className="animate-spin text-amber-500" />
                      <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">Sincronizando zonas cadastrais...</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-[#EFEFEA] rounded-2xl overflow-hidden shadow-sm">
                      <div className="p-5 border-b border-[#F6F6F4] bg-neutral-50/50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Lista de Bairros Ativos (Sorocaba - SP)</span>
                        <span className="text-[9px] font-bold bg-[#F6F6F4] border border-[#EFEFEA] text-[#050505] uppercase tracking-widest px-2.5 py-1 rounded-full">Total: {neighborhoodsList.length}</span>
                      </div>
                      
                      {neighborhoodsList.length === 0 ? (
                        <div className="p-12 text-center space-y-4">
                          <MapPin size={28} className="mx-auto text-amber-500/40" />
                          <p className="text-stone-500 font-medium text-xs">A base de bairros personalizados ainda não possui registros locais.</p>
                          <button
                            onClick={() => {
                              setEditingNeighborhood(null);
                              setFormNeighborhood({ nome: 'Campolim', cidade: 'Sorocaba', estado: 'SP', ativo: true });
                              setIsNeighborhoodModalOpen(true);
                            }}
                            className="text-amber-500 hover:text-amber-600 text-xs font-black uppercase tracking-widest"
                          >
                            Inicializar com Campolim
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-neutral-50 border-b border-[#F6F6F4]">
                                <th className="text-[9px] pl-6 py-4.5 text-left font-black text-[#A1A1AA] uppercase tracking-widest">Nome do Bairro</th>
                                <th className="text-[9px] py-4.5 text-left font-black text-[#A1A1AA] uppercase tracking-widest">Cidade / Região</th>
                                <th className="text-[9px] py-4.5 text-left font-black text-[#A1A1AA] uppercase tracking-widest">Estado (UF)</th>
                                <th className="text-[9px] py-4.5 text-left font-black text-[#A1A1AA] uppercase tracking-widest">Situação</th>
                                <th className="text-[9px] pr-6 py-4.5 text-right font-black text-[#A1A1AA] uppercase tracking-widest">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {neighborhoodsList.map((neighborhood) => (
                                <tr key={neighborhood.id} className="border-b border-[#F6F6F4] hover:bg-neutral-50/30 transition-all">
                                  <td className="pl-6 py-4.5">
                                    <span className="text-xs font-black text-[#050505] uppercase tracking-wider">{neighborhood.nome}</span>
                                  </td>
                                  <td className="py-4.5">
                                    <span className="text-xs font-bold text-stone-500">{neighborhood.cidade || "Sorocaba"}</span>
                                  </td>
                                  <td className="py-4.5">
                                    <span className="text-xs font-mono text-stone-400">{neighborhood.estado || "SP"}</span>
                                  </td>
                                  <td className="py-4.5">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${neighborhood.ativo ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                                      {neighborhood.ativo ? "Sim" : "Não"}
                                    </span>
                                  </td>
                                  <td className="pr-6 py-4.5 text-right">
                                    <div className="inline-flex space-x-3">
                                      <button
                                        onClick={() => {
                                          setEditingNeighborhood(neighborhood);
                                          setFormNeighborhood({
                                            nome: neighborhood.nome || "",
                                            cidade: neighborhood.cidade || "Sorocaba",
                                            estado: neighborhood.estado || "SP",
                                            ativo: neighborhood.ativo !== undefined ? neighborhood.ativo : true
                                          });
                                          setIsNeighborhoodModalOpen(true);
                                        }}
                                        className="text-stone-500 hover:text-amber-500 text-[10px] font-black uppercase tracking-widest"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        onClick={() => handleDeleteNeighborhood(neighborhood.id)}
                                        className="text-red-500 hover:text-red-600 text-[10px] font-black uppercase tracking-widest"
                                      >
                                        Excluir
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 9. OWNERS TAB VIEW - PREMIUM CRM CUSTOMER MANAGER */}
              {activeTab === 'owners' && !showAddForm && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-[#050505] uppercase tracking-widest">
                        Base Cadastral de Proprietários
                      </h3>
                      <p className="text-xs text-[#A1A1AA] font-bold uppercase tracking-wider mt-1.5">
                        Central de dados civis e de faturamento de proprietários com imóveis na RB Sorocaba
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingOwner(null);
                        setFormOwner({ nome: '', cpfCnpj: '', telefone: '', email: '', endereco: '', ativo: true });
                        setIsOwnerModalOpen(true);
                      }}
                      className="bg-[#050505] text-amber-500 hover:bg-[#121212] hover:text-amber-400 border border-neutral-900 px-6 py-3 rounded-lg text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2 transition-all shadow"
                    >
                      <Plus size={14} /> Cadastrar Proprietário
                    </button>
                  </div>

                  {ownersLoading ? (
                    <div className="p-12 text-center bg-white border border-[#EFEFEA] rounded-2xl flex flex-col items-center justify-center space-y-3">
                      <Loader2 size={24} className="animate-spin text-amber-500" />
                      <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">Sincronizando clientes cadastrados...</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-[#EFEFEA] rounded-2xl overflow-hidden shadow-sm">
                      <div className="p-5 border-b border-[#F6F6F4] bg-neutral-50/50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Proprietários Oficiais</span>
                        <span className="text-[9px] font-bold bg-[#F6F6F4] border border-[#EFEFEA] px-2.5 py-1 text-[#050505] uppercase tracking-widest rounded-full">Total: {ownersList.length}</span>
                      </div>

                      {ownersList.length === 0 ? (
                        <div className="p-12 text-center space-y-4">
                          <User size={28} className="mx-auto text-amber-500/40" />
                          <p className="text-stone-500 font-medium text-xs">Não há proprietários declarados na base cadastral no momento.</p>
                          <button
                            onClick={() => {
                              setEditingOwner(null);
                              setFormOwner({ nome: 'Ronaldo Bueno Sorocaba', cpfCnpj: '445.889.321-00', telefone: '(15) 99114-3213', email: 'ronaldo.bueno@gmail.com', endereco: 'Campolim, Sorocaba', ativo: true });
                              setIsOwnerModalOpen(true);
                            }}
                            className="text-amber-500 hover:text-amber-600 text-xs font-black uppercase tracking-widest"
                          >
                            Inicializar com Exemplo
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-neutral-50 border-b border-[#F6F6F4]">
                                <th className="text-[9px] pl-6 py-4.5 text-left font-black text-[#A1A1AA] uppercase tracking-widest">Proprietário</th>
                                <th className="text-[9px] py-4.5 text-left font-black text-[#A1A1AA] uppercase tracking-widest">CPF / CNPJ</th>
                                <th className="text-[9px] py-4.5 text-left font-black text-[#A1A1AA] uppercase tracking-widest">Telefone / E-mail</th>
                                <th className="text-[9px] py-4.5 text-left font-black text-[#A1A1AA] uppercase tracking-widest">Endereço Principal</th>
                                <th className="text-[9px] py-4.5 text-left font-black text-[#A1A1AA] uppercase tracking-widest">Status</th>
                                <th className="text-[9px] pr-6 py-4.5 text-right font-black text-[#A1A1AA] uppercase tracking-widest">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ownersList.map((owner) => (
                                <tr key={owner.id} className="border-b border-[#F6F6F4] hover:bg-neutral-50/30 transition-all">
                                  <td className="pl-6 py-4.5">
                                    <span className="text-xs font-black text-[#050505] uppercase tracking-wider">{owner.nome}</span>
                                  </td>
                                  <td className="py-4.5">
                                    <span className="text-xs font-mono font-bold text-stone-600">{owner.cpfCnpj || "Não informado"}</span>
                                  </td>
                                  <td className="py-4.5">
                                    <div className="text-[10px] text-zinc-500 font-bold space-y-0.5">
                                      <p>📞 {owner.telefone || "(15) --"}</p>
                                      <p className="font-medium text-stone-400">{owner.email || "Sem e-mail"}</p>
                                    </div>
                                  </td>
                                  <td className="py-4.5">
                                    <span className="text-xs font-medium text-stone-600 truncate max-w-xs block">{owner.endereco || "Não preenchido"}</span>
                                  </td>
                                  <td className="py-4.5">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${owner.ativo ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                                      {owner.ativo ? "Sim" : "Não"}
                                    </span>
                                  </td>
                                  <td className="pr-6 py-4.5 text-right">
                                    <div className="inline-flex space-x-3">
                                      <button
                                        onClick={() => {
                                          setEditingOwner(owner);
                                          setFormOwner({
                                            nome: owner.nome || "",
                                            cpfCnpj: owner.cpfCnpj || "",
                                            telefone: owner.telefone || "",
                                            email: owner.email || "",
                                            endereco: owner.endereco || "",
                                            ativo: owner.ativo !== undefined ? owner.ativo : true
                                          });
                                          setIsOwnerModalOpen(true);
                                        }}
                                        className="text-stone-500 hover:text-amber-500 text-[10px] font-black uppercase tracking-widest"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        onClick={() => handleDeleteOwner(owner.id)}
                                        className="text-red-500 hover:text-red-600 text-[10px] font-black uppercase tracking-widest"
                                      >
                                        Excluir
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* USUARIOS CRM - CONTROLE DE ACESSO E PERMISSÕES */}
              {activeTab === 'usuariosCRM' && !showAddForm && (
                <div className="space-y-8 animate-fade-in text-left">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-[#050505] uppercase tracking-widest flex items-center gap-2">
                        <Users size={22} className="text-amber-500" />
                        Usuários & Controle de Permissões
                      </h3>
                      <p className="text-xs text-[#A1A1AA] font-bold uppercase tracking-wider mt-1.5">
                        Defina cargos, perfis de acesso e status de corretores, gerentes, financeiros e proprietários
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingUser(null);
                        setFormUser({
                          nome: '',
                          email: '',
                          telefone: '',
                          creci: '',
                          cargo: 'Corretor',
                          perfil: 'Corretor',
                          status: 'Ativo',
                          equipe: '',
                          supervisor: '',
                          foto: ''
                        });
                        setIsUserModalOpen(true);
                      }}
                      className="bg-[#050505] text-amber-500 hover:bg-[#121212] hover:text-amber-400 border border-neutral-900 px-6 py-3 rounded-lg text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2 transition-all shadow cursor-pointer"
                    >
                      <Plus size={14} /> Novo Usuário CRM
                    </button>
                  </div>

                  {usersLoading ? (
                    <div className="p-12 text-center bg-white border border-[#EFEFEA] rounded-2xl flex flex-col items-center justify-center space-y-3">
                      <Loader2 size={24} className="animate-spin text-amber-500" />
                      <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">Sincronizando banco de usuários...</p>
                    </div>
                  ) : usersList.length === 0 ? (
                    <div className="bg-white border border-[#EFEFEA] rounded-2xl p-12 text-center space-y-4">
                      <Users size={32} className="mx-auto text-amber-500/45" />
                      <p className="text-stone-500 font-medium text-xs leading-relaxed">Nenhum usuário cadastrado no controle de acesso.</p>
                      <button
                        onClick={() => {
                          setEditingUser(null);
                          setFormUser({
                            nome: 'Corretor Exemplo',
                            email: 'corretor@rbsorocaba.com.br',
                            telefone: '(15) 99123-4567',
                            creci: '123456-F',
                            cargo: 'Corretor Associado',
                            perfil: 'Corretor',
                            status: 'Ativo',
                            equipe: 'Vendas Campolim',
                            supervisor: 'Gerente Carlos',
                            foto: ''
                          });
                          setIsUserModalOpen(true);
                        }}
                        className="text-amber-500 hover:text-amber-600 text-xs font-black uppercase tracking-widest cursor-pointer"
                      >
                        Inicializar com Exemplo
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white border border-[#EFEFEA] rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#EFEFEA] bg-[#FDFDFD] text-[10px] font-black uppercase tracking-wider text-stone-400">
                              <th className="py-4 px-6">Usuário</th>
                              <th className="py-4 px-6">Contato / CRECI</th>
                              <th className="py-4 px-6">Perfil / Cargo</th>
                              <th className="py-4 px-6">Equipe / Supervisor</th>
                              <th className="py-4 px-6">Status</th>
                              <th className="py-4 px-6 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usersList.map((usr: any) => (
                              <tr key={usr.id} className="border-b border-[#F6F6F4] hover:bg-[#FAF9F6] text-xs transition-all">
                                <td className="py-4 px-6">
                                  <div className="flex items-center space-x-3">
                                    {usr.foto ? (
                                      <img src={usr.foto} alt={usr.nome} className="w-9 h-9 rounded-full object-cover border border-amber-500/10" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 text-[11px] font-black">
                                        {(usr.nome || 'U').substring(0, 1)}
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-extrabold text-stone-900 leading-none">{usr.nome}</p>
                                      <p className="text-[10px] text-slate-400 font-bold mt-1">{usr.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 font-bold text-stone-700">
                                  <p>{usr.telefone || 'Sem telefone'}</p>
                                  {usr.creci && <p className="text-[9px] text-[#F5B400] uppercase mt-0.5 font-black">CRECI: {usr.creci}</p>}
                                </td>
                                <td className="py-4 px-6 font-bold text-stone-800">
                                  <div className="flex flex-col space-y-1">
                                    <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-center max-w-max ${
                                      usr.perfil === 'Administrador' ? 'bg-amber-100 text-amber-800' :
                                      usr.perfil === 'Líder' ? 'bg-blue-100 text-blue-800' :
                                      usr.perfil === 'Corretor' ? 'bg-emerald-100 text-emerald-800' :
                                      usr.perfil === 'Financeiro' ? 'bg-purple-100 text-purple-800' :
                                      usr.perfil === 'Marketing' ? 'bg-pink-100 text-pink-800' :
                                      usr.perfil === 'Assistente' ? 'bg-teal-100 text-teal-800' :
                                      'bg-stone-100 text-stone-700'
                                    }`}>
                                      {usr.perfil}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium pl-1">{usr.cargo || 'Membro'}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-stone-700 font-bold">
                                  <p>{usr.equipe || '-'}</p>
                                  {usr.supervisor && <p className="text-[10px] text-slate-400 font-medium">Supervisor: {usr.supervisor}</p>}
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider ${
                                    usr.status === 'Ativo' ? 'text-emerald-600' :
                                    usr.status === 'Férias' ? 'text-amber-500' :
                                    usr.status === 'Bloqueado' ? 'text-red-500' :
                                    'text-slate-400'
                                  }`}>
                                    <span className={`w-2 h-2 rounded-full ${
                                      usr.status === 'Ativo' ? 'bg-emerald-500' :
                                      usr.status === 'Férias' ? 'bg-amber-500' :
                                      usr.status === 'Bloqueado' ? 'bg-red-500' :
                                      'bg-slate-400'
                                    }`} />
                                    {usr.status || 'Ativo'}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex items-center justify-end space-x-3">
                                    <button
                                      onClick={() => {
                                        setEditingUser(usr);
                                        setFormUser({
                                          nome: usr.nome || '',
                                          email: usr.email || '',
                                          telefone: usr.telefone || '',
                                          creci: usr.creci || '',
                                          cargo: usr.cargo || 'Corretor',
                                          perfil: usr.perfil || 'Corretor',
                                          status: usr.status || 'Ativo',
                                          equipe: usr.equipe || '',
                                          supervisor: usr.supervisor || '',
                                          foto: usr.foto || ''
                                        });
                                        setIsUserModalOpen(true);
                                      }}
                                      className="text-stone-500 hover:text-amber-500 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(usr.id)}
                                      className="text-red-500 hover:text-red-600 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                                    >
                                      Excluir
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 10. SITE SETTINGS TAB VIEW - PREMIUM BRAND CONFIG */}
              {activeTab === 'siteSettings' && !showAddForm && (
                <div className="space-y-8">
                  {/* Outer Main Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                    <div>
                      <h3 className="text-xl font-black text-[#050505] uppercase tracking-widest">
                        Painel de Configuração do Site
                      </h3>
                      <p className="text-xs text-[#A1A1AA] font-bold uppercase tracking-wider mt-1.5">
                        Brand, dados estruturais de Sorocaba, metadados e visual do ecossistema RB
                      </p>
                    </div>

                    {/* Quick Global Save Button for configuration forms */}
                    {['home', 'sections', 'company', 'appearance'].includes(settingsSubTab) && (
                      <button
                        onClick={() => handleSaveSiteSettings()}
                        disabled={siteSettingsLoading}
                        className="bg-[#050505] hover:bg-stone-900 border border-zinc-900 text-[#FFD700] hover:text-[#FFE033] px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow transition-all duration-200"
                      >
                        {siteSettingsLoading ? (
                          <>
                            <Loader2 size={12} className="animate-spin text-[#FFD700]" />
                            Gravando alterações...
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={14} className="text-[#FFD700]" />
                            Salvar Alterações
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT INTERNAL SIDEBAR MENU */}
                    <div className="lg:col-span-3 space-y-2.5">
                      {[
                        { id: 'home', label: 'Página Inicial', icon: Home, desc: 'Frase de boas-vindas e hero' },
                        { id: 'sections', label: 'Seções do Site', icon: FileText, desc: 'Sobre nós, CTAs e banners' },
                        { id: 'company', label: 'Dados da Empresa', icon: ShieldCheck, desc: 'Razão social e certidões' },
                        { id: 'options', label: 'Opções de Imóveis', icon: PlusCircle, desc: 'Tipos de oferta e status' },
                        { id: 'locations', label: 'Cidades e Bairros', icon: MapPin, desc: 'Distribuição territorial' },
                        { id: 'features', label: 'Filtros e Características', icon: Sparkles, desc: 'Lazer e acabamentos' },
                        { id: 'appearance', label: 'Aparência do Site', icon: Palette, desc: 'Cores, logos e efeitos' }
                      ].map((menuItem) => (
                        <button
                          key={menuItem.id}
                          onClick={() => setSettingsSubTab(menuItem.id as any)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 ${
                            settingsSubTab === menuItem.id
                              ? 'bg-[#050505] text-[#FFD700] border-zinc-950 shadow-md shadow-stone-950/10'
                              : 'bg-white hover:bg-[#FCFCFB] hover:border-zinc-300 text-stone-700 border-[#EFEFEA]'
                          }`}
                        >
                          <menuItem.icon size={16} className={`mt-0.5 ${settingsSubTab === menuItem.id ? 'text-[#FFD700]' : 'text-stone-400'}`} />
                          <div className="space-y-0.5">
                            <span className="text-xs font-black uppercase tracking-wider block">{menuItem.label}</span>
                            <span className={`text-[8px] font-bold uppercase tracking-widest block ${settingsSubTab === menuItem.id ? 'text-stone-400' : 'text-stone-400'}`}>
                              {menuItem.desc}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* RIGHT MAIN PANEL DISPLAY AREA */}
                    <div className="lg:col-span-9 bg-white border border-[#EFEFEA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 min-h-[500px]">
                      
                      {/* 10.1 PÁGINA INICIAL */}
                      {settingsSubTab === 'home' && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-black text-[#050505] uppercase tracking-wider">Design da Página Inicial</h4>
                            <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">Definições da Hero Section superior e elementos de impacto do site publico</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 object-contain">
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Título Principal do Hero</label>
                              <input 
                                type="text" 
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all"
                                value={siteHomeSettings.homeTitle || ''} 
                                onChange={e => setSiteHomeSettings({...siteHomeSettings, homeTitle: e.target.value})} 
                                placeholder="RB Sorocaba - Negócios Imobiliários de Alto Padrão" 
                              />
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Subtítulo Completo do Hero</label>
                              <textarea 
                                rows={2}
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all resize-none"
                                value={siteHomeSettings.homeSubtitle || ''} 
                                onChange={e => setSiteHomeSettings({...siteHomeSettings, homeSubtitle: e.target.value})} 
                                placeholder="Seu novo estilo de vida começa aqui..." 
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Tag de Destaque (Badge superior)</label>
                              <input 
                                type="text" 
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all"
                                value={siteHomeSettings.homeBadge || ''} 
                                onChange={e => setSiteHomeSettings({...siteHomeSettings, homeBadge: e.target.value})} 
                                placeholder="ALTO PADRÃO" 
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Slogan Inferior / Texto de Destaque</label>
                              <input 
                                type="text" 
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all"
                                value={siteHomeSettings.homeHighlightText || ''} 
                                onChange={e => setSiteHomeSettings({...siteHomeSettings, homeHighlightText: e.target.value})} 
                                placeholder="Líder em Sorocaba" 
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Texto do Botão Principal</label>
                              <input 
                                type="text" 
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all"
                                value={siteHomeSettings.homePrimaryButtonText || ''} 
                                onChange={e => setSiteHomeSettings({...siteHomeSettings, homePrimaryButtonText: e.target.value})} 
                                placeholder="Ver Catálogo" 
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Link do Botão Principal (Âncora ou URL)</label>
                              <input 
                                type="text" 
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all"
                                value={siteHomeSettings.homePrimaryButtonLink || ''} 
                                onChange={e => setSiteHomeSettings({...siteHomeSettings, homePrimaryButtonLink: e.target.value})} 
                                placeholder="#catalogo" 
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Texto do Botão Secundário</label>
                              <input 
                                type="text" 
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all"
                                value={siteHomeSettings.homeSecondaryButtonText || ''} 
                                onChange={e => setSiteHomeSettings({...siteHomeSettings, homeSecondaryButtonText: e.target.value})} 
                                placeholder="Falar no WhatsApp" 
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Link do Botão Secundário (URL)</label>
                              <input 
                                type="text" 
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all"
                                value={siteHomeSettings.homeSecondaryButtonLink || ''} 
                                onChange={e => setSiteHomeSettings({...siteHomeSettings, homeSecondaryButtonLink: e.target.value})} 
                                placeholder="https://wa.me/5515..." 
                              />
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Imagem de Fundo Principal (URL ou Unsplash)</label>
                              <input 
                                type="text" 
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all"
                                value={siteHomeSettings.homeBackgroundImage || ''} 
                                onChange={e => setSiteHomeSettings({...siteHomeSettings, homeBackgroundImage: e.target.value})} 
                                placeholder="https://images.unsplash.com/..." 
                              />
                              {siteHomeSettings.homeBackgroundImage && (
                                <img src={siteHomeSettings.homeBackgroundImage} alt="Preview Background" className="mt-2 h-20 w-fit max-w-full rounded-lg border object-cover shadow-sm bg-stone-100" />
                              )}
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Frase de Chamada Comercial Inferior</label>
                              <input 
                                type="text" 
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 transition-all"
                                value={siteHomeSettings.homeCommerceCall || ''} 
                                onChange={e => setSiteHomeSettings({...siteHomeSettings, homeCommerceCall: e.target.value})} 
                                placeholder="Atendimento personalizado de ponta a ponta" 
                              />
                            </div>

                            <div className="md:col-span-2 flex items-center justify-between p-4.5 bg-[#FCFCFB] border border-[#EFEFEA] rounded-2xl mt-2">
                              <div>
                                <span className="text-xs font-bold text-stone-800 block">Efeito Dinâmico de Zoom no Hero</span>
                                <span className="text-[9px] text-[#A1A1AA] font-bold uppercase tracking-widest block mt-0.5">Aplica uma transição de zoom lenta e sutil para valorizar a imagem de fundo</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSiteHomeSettings({...siteHomeSettings, homeHeroEffectEnabled: !siteHomeSettings.homeHeroEffectEnabled})}
                                className={`px-4.5 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                                  siteHomeSettings.homeHeroEffectEnabled !== false
                                    ? 'bg-amber-100/50 border-amber-300 text-amber-700'
                                    : 'bg-stone-50 border-stone-200 text-stone-400'
                                }`}
                              >
                                {siteHomeSettings.homeHeroEffectEnabled !== false ? 'Habilitado' : 'Desabilitado'}
                              </button>
                            </div>

                          </div>
                        </div>
                      )}

                      {/* 10.2 SEÇÕES DO SITE */}
                      {settingsSubTab === 'sections' && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-black text-[#050505] uppercase tracking-wider">Conteúdo das Seções Secundárias</h4>
                            <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">Altere títulos institucionais, história e portfólio da RB Sorocaba</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* IMÓVEIS EM DESTAQUE */}
                            <div className="space-y-1.5 bg-[#FCFCFB] p-4.5 border border-[#EFEFEA] rounded-2xl md:col-span-2">
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest pl-1">Coleção: Imóveis em Destaque</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Título da Seção</label>
                                  <input type="text" className="w-full bg-white border border-[#EFEFEA] focus:border-amber-500 outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-stone-900"
                                    value={siteSectionsSettings.featuredTitle || ''} onChange={e => setSiteSectionsSettings({...siteSectionsSettings, featuredTitle: e.target.value})} placeholder="Imóveis em Destaque" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Subtítulo da Seção</label>
                                  <input type="text" className="w-full bg-white border border-[#EFEFEA] focus:border-amber-500 outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-stone-900"
                                    value={siteSectionsSettings.featuredSubtitle || ''} onChange={e => setSiteSectionsSettings({...siteSectionsSettings, featuredSubtitle: e.target.value})} placeholder="Confira nossa seleção exclusiva..." />
                                </div>
                              </div>
                            </div>

                            {/* SOBRE NÓS */}
                            <div className="space-y-3 bg-[#FCFCFB] p-4.5 border border-[#EFEFEA] rounded-2xl md:col-span-2">
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest pl-1">Seção: Sobre a RB Sorocaba</span>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Título do Bloco</label>
                                <input type="text" className="w-full bg-white border border-[#EFEFEA] focus:border-amber-500 outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-stone-900"
                                  value={siteSectionsSettings.aboutTitle || ''} onChange={e => setSiteSectionsSettings({...siteSectionsSettings, aboutTitle: e.target.value})} placeholder="Sobre a RB Sorocaba" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Narrativa da Empresa (Text Area)</label>
                                <textarea rows={4} className="w-full bg-white border border-[#EFEFEA] focus:border-amber-500 outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900 resize-none"
                                  value={siteSectionsSettings.aboutText || ''} onChange={e => setSiteSectionsSettings({...siteSectionsSettings, aboutText: e.target.value})} placeholder="História e valores da marca..." />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Imagem Lateral Institucional (URL)</label>
                                <input type="text" className="w-full bg-white border border-[#EFEFEA] focus:border-amber-500 outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-stone-900"
                                  value={siteSectionsSettings.aboutImageUrl || ''} onChange={e => setSiteSectionsSettings({...siteSectionsSettings, aboutImageUrl: e.target.value})} placeholder="https://images.unsplash..." />
                                {siteSectionsSettings.aboutImageUrl && (
                                  <img src={siteSectionsSettings.aboutImageUrl} alt="Institucional Preview" className="h-16 w-fit rounded border object-cover bg-stone-100 mt-1" />
                                )}
                              </div>
                            </div>

                            {/* EQUIPE / CORRETORES */}
                            <div className="space-y-1 bg-[#FCFCFB] p-4.5 border border-[#EFEFEA] rounded-2xl">
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block pl-1 mb-2">Coleção de Corretores Parceiros</span>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Título Corretores</label>
                                <input type="text" className="w-full bg-white border border-[#EFEFEA] outline-none rounded-xl px-4 py-2 text-xs font-bold text-stone-900"
                                  value={siteSectionsSettings.brokersTitle || ''} onChange={e => setSiteSectionsSettings({...siteSectionsSettings, brokersTitle: e.target.value})} />
                                <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest block mt-2">Subtítulo</label>
                                <input type="text" className="w-full bg-white border border-[#EFEFEA] outline-none rounded-xl px-4 py-2 text-xs font-bold text-stone-900"
                                  value={siteSectionsSettings.brokersSubtitle || ''} onChange={e => setSiteSectionsSettings({...siteSectionsSettings, brokersSubtitle: e.target.value})} />
                              </div>
                            </div>

                            {/* FALE CONOSCO / CONTATO */}
                            <div className="space-y-1 bg-[#FCFCFB] p-4.5 border border-[#EFEFEA] rounded-2xl">
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block pl-1 mb-2">Seção Fale Conosco / Contatos</span>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Título Formulário</label>
                                <input type="text" className="w-full bg-white border border-[#EFEFEA] outline-none rounded-xl px-4 py-2 text-xs font-bold text-stone-900"
                                  value={siteSectionsSettings.contactTitle || ''} onChange={e => setSiteSectionsSettings({...siteSectionsSettings, contactTitle: e.target.value})} />
                                <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest block mt-2">Texto de Suporte / Legal</label>
                                <input type="text" className="w-full bg-white border border-[#EFEFEA] outline-none rounded-xl px-4 py-2 text-xs font-bold text-stone-900"
                                  value={siteSectionsSettings.contactSupportText || ''} onChange={e => setSiteSectionsSettings({...siteSectionsSettings, contactSupportText: e.target.value})} />
                              </div>
                            </div>

                            {/* CTA BANNER FINAL */}
                            <div className="space-y-3 bg-[#FCFCFB] p-4.5 border border-[#EFEFEA] rounded-2xl md:col-span-2">
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest pl-1">Seção CTA: Chamada Para Ação no Fundo de Página</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Título do CTA Banner</label>
                                  <input type="text" className="w-full bg-white border border-[#EFEFEA] outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-stone-900"
                                    value={siteSectionsSettings.ctaTitle || ''} onChange={e => setSiteSectionsSettings({...siteSectionsSettings, ctaTitle: e.target.value})} placeholder="Pronto para Conquistar o Seu Espaço?" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Texto Descritivo Principal</label>
                                  <input type="text" className="w-full bg-white border border-[#EFEFEA] outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-stone-900"
                                    value={siteSectionsSettings.ctaText || ''} onChange={e => setSiteSectionsSettings({...siteSectionsSettings, ctaText: e.target.value})} placeholder="Converse com um de nossos assessores..." />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Texto do Botão CTA</label>
                                  <input type="text" className="w-full bg-white border border-[#EFEFEA] outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-stone-900"
                                    value={siteSectionsSettings.ctaButtonText || ''} onChange={e => setSiteSectionsSettings({...siteSectionsSettings, ctaButtonText: e.target.value})} placeholder="Enviar Mensagem via WhatsApp" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Link do Botão (WhatsApp/URL)</label>
                                  <input type="text" className="w-full bg-white border border-[#EFEFEA] outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-stone-900"
                                    value={siteSectionsSettings.ctaButtonLink || ''} onChange={e => setSiteSectionsSettings({...siteSectionsSettings, ctaButtonLink: e.target.value})} placeholder="https://wa.me/55159..." />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 10.3 DADOS DA EMPRESA */}
                      {settingsSubTab === 'company' && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-black text-[#050505] uppercase tracking-wider">Identidade Juridica & Dados e-Commerce</h4>
                            <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">CNPJ, registros CRECI autorizados, endereço sede e canais de atendimento</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Nome Fantasia Comercial</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.nomeFantasia || ''} onChange={e => {
                                  setSiteCompanySettings({...siteCompanySettings, nomeFantasia: e.target.value});
                                  setSiteSettings({...siteSettings, title: e.target.value}); // sync old general Title
                                }} placeholder="RB Sorocaba Negócios Imobiliários" />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Razão Social</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.razaoSocial || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, razaoSocial: e.target.value})} />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">CNPJ Oficial</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.cnpj || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, cnpj: e.target.value})} placeholder="00.000.000/0001-00" />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">CRECI da Pessoa Jurídica (PJ)</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.creciPj || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, creciPj: e.target.value})} placeholder="CRECI 123456-J" />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">CRECI do Responsável Técnico</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.creciResponsavel || ''} onChange={e => {
                                  setSiteCompanySettings({...siteCompanySettings, creciResponsavel: e.target.value});
                                  setSiteSettings({...siteSettings, creci: e.target.value}); // Sync old CRECI
                                }} placeholder="CRECI 278765-F" />
                            </div>

                            <div className="space-y-1.5 text-stone-900 font-bold">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Telefone de Contato</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.telefone || ''} onChange={e => {
                                  setSiteCompanySettings({...siteCompanySettings, telefone: e.target.value});
                                  setSiteSettings({...siteSettings, phone: e.target.value}); // sync fallback
                                }} placeholder="(15) 99114-3213" />
                            </div>

                            <div className="space-y-1.5 text-stone-900 font-bold">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">WhatsApp Principal</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.whatsapp || ''} onChange={e => {
                                  setSiteCompanySettings({...siteCompanySettings, whatsapp: e.target.value});
                                  setSiteSettings({...siteSettings, whatsapp: e.target.value}); // sync fallback
                                }} placeholder="+55 (15) 99114-3213" />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">E-mail Comercial</label>
                              <input type="email" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.email || ''} onChange={e => {
                                  setSiteCompanySettings({...siteCompanySettings, email: e.target.value});
                                  setSiteSettings({...siteSettings, email: e.target.value}); // sync
                                }} placeholder="atendimento@rbsorocaba.com.br" />
                            </div>

                            <div className="space-y-1.5 md:col-span-3 border-t border-neutral-100 pt-3">
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest pl-1">Endereço de Correspondência Física (Sede/Escritório)</span>
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Logradouro / Avenida / Rua</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.endereco || ''} onChange={e => {
                                  setSiteCompanySettings({...siteCompanySettings, endereco: e.target.value});
                                  setSiteSettings({...siteSettings, address: e.target.value + ', ' + (siteCompanySettings.numero || '') + ' - ' + (siteCompanySettings.cidade || '')}); // sync general
                                }} placeholder="Avenida Campolim" />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Número</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.numero || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, numero: e.target.value})} placeholder="1200" />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Complemento / Sala</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.complemento || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, complemento: e.target.value})} placeholder="Sala 45" />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Bairro</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.bairro || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, bairro: e.target.value})} placeholder="Campolim" />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Cidade</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.cidade || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, cidade: e.target.value})} placeholder="Sorocaba" />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Estado</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.estado || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, estado: e.target.value})} placeholder="SP" />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">CEP</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.cep || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, cep: e.target.value})} placeholder="18047-620" />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Site Institucional</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.site || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, site: e.target.value})} placeholder="www.rbsorocaba.com.br" />
                            </div>

                            <div className="space-y-1.5 md:col-span-3 border-t border-neutral-100 pt-3">
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest pl-1">Responsável Técnico / Corretor Parceiro Legal</span>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Nome Completo</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.responsavelLegal || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, responsavelLegal: e.target.value})} placeholder="Elias Borges" />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">CPF do Responsável</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.cpfResponsavel || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, cpfResponsavel: e.target.value})} placeholder="000.000.000-00" />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Cargo / Designação</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.cargoResponsavel || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, cargoResponsavel: e.target.value})} placeholder="Diretor Comercial" />
                            </div>

                            <div className="space-y-1.5 md:col-span-3">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Rodapé Legal de Contratos (Surgirá em PDFs)</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.textoRodapeContratos || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, textoRodapeContratos: e.target.value})} />
                            </div>

                            <div className="space-y-1.5 md:col-span-3">
                              <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">Frase Institucional Corporativa (Slogan)</label>
                              <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl px-4 py-3 text-xs font-bold text-stone-900"
                                value={siteCompanySettings.fraseInstitucional || ''} onChange={e => setSiteCompanySettings({...siteCompanySettings, fraseInstitucional: e.target.value})} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 10.4 OPÇÕES DE IMÓVEIS */}
                      {settingsSubTab === 'options' && (
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-black text-[#050505] uppercase tracking-wider">Sub-Aba: Listas Cadastrais</h4>
                              <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">Metadados para classificação de anúncios imobiliários</p>
                            </div>
                            <span className="text-[8px] bg-green-50 text-green-700 px-3 py-1.5 border border-green-200 uppercase tracking-widest font-black rounded-lg">Tem Tempo Real Ativo</span>
                          </div>

                          {/* Options tabs selection */}
                          <div className="flex flex-wrap gap-2.5 border-b border-stone-100 pb-4">
                            {[
                              { id: 'tiposImovel', label: 'Tipos de Imóvel' },
                              { id: 'tiposNegocio', label: 'Tipos de Negócio' },
                              { id: 'statusImovel', label: 'Status de Cadastro' },
                              { id: 'faixasPreco', label: 'Faixas de Preço de Sorocaba' },
                              { id: 'categoriasImovel', label: 'Categorias do Imóvel' }
                            ].map(tab => (
                              <button
                                key={tab.id}
                                onClick={() => setActiveOptionsTab(tab.id as any)}
                                className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                  activeOptionsTab === tab.id
                                    ? 'bg-[#050505] text-[#FFD700] border-zinc-950 shadow-sm'
                                    : 'bg-[#F6F6F4] hover:bg-stone-200 text-stone-600 border-[#EFEFEA]'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          {/* Active element */}
                          {activeOptionsTab === 'tiposImovel' && (
                            <ConfigOptionManager 
                              collectionName="tiposImovel" 
                              title="Tipos de Imóvel" 
                              description="Controla categorias como: Apartamento, Casa Térrea, Sobrado, Terreno, Galpão, Cobertura." 
                            />
                          )}
                          {activeOptionsTab === 'tiposNegocio' && (
                            <ConfigOptionManager 
                              collectionName="tiposNegocio" 
                              title="Tipos de Negócio" 
                              description="Classificação comercial primária de transação. Ex: Venda, Locação." 
                            />
                          )}
                          {activeOptionsTab === 'statusImovel' && (
                            <ConfigOptionManager 
                              collectionName="statusImovel" 
                              title="Status de Cadastro" 
                              description="Status operacional de andamento da propriedade. Ex: Disponível, Vendido, Alugado, sob consulta." 
                            />
                          )}
                          {activeOptionsTab === 'faixasPreco' && (
                            <ConfigOptionManager 
                              collectionName="faixasPreco" 
                              title="Faixas de Preço" 
                              description="Intervalos de valor para orientar filtros rápidos e barras de pesquisa." 
                            />
                          )}
                          {activeOptionsTab === 'categoriasImovel' && (
                            <ConfigOptionManager 
                              collectionName="categoriasImovel" 
                              title="Categorias do Imóvel" 
                              description="Controla as categorias principais do imóvel. Ex: Residencial, Comercial, Rural, Terreno, Industrial." 
                            />
                          )}
                        </div>
                      )}

                      {/* 10.5 CIDADES E BAIRROS */}
                      {settingsSubTab === 'locations' && (
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-black text-[#050505] uppercase tracking-wider">Cidades e Bairros de Sorocaba & Região</h4>
                              <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">Gerenciamento dinâmico de endereços integrados aos filtros de busca</p>
                            </div>
                            <span className="text-[8px] bg-green-50 text-green-700 px-3 py-1.5 border border-green-200 uppercase tracking-widest font-black rounded-lg">Sincronização Ativa</span>
                          </div>

                          {/* Locations switch tabs */}
                          <div className="flex gap-2.5 border-b border-stone-100 pb-4">
                            {[
                              { id: 'cidades', label: 'Gerenciar Cidades' },
                              { id: 'bairros', label: 'Gerenciar Bairros Associados' }
                            ].map(tab => (
                              <button
                                key={tab.id}
                                onClick={() => setActiveLocationsTab(tab.id as any)}
                                className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                  activeLocationsTab === tab.id
                                    ? 'bg-[#050505] text-[#FFD700] border-zinc-950 shadow-sm'
                                    : 'bg-[#F6F6F4] hover:bg-stone-200 text-stone-600 border-[#EFEFEA]'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          {activeLocationsTab === 'cidades' && (
                            <ConfigOptionManager 
                              collectionName="cidades" 
                              title="Cidades Cadastradas" 
                              description="Cidades válidas no seletor de cadastro. Ex: Sorocaba, Votorantim, Itu, Salto de Pirapora." 
                            />
                          )}

                          {activeLocationsTab === 'bairros' && (
                            <ConfigOptionManager 
                              collectionName="bairros" 
                              title="Bairros Filiados" 
                              description="Associe bairros como Campolim, Mangal, Vergueiro às respectivas cidades para manter os filtros precisos." 
                              citiesList={optCidades}
                            />
                          )}
                        </div>
                      )}

                      {/* 10.6 FILTROS E CARACTERÍSTICAS */}
                      {settingsSubTab === 'features' && (
                        <div className="space-y-6 overflow-contain">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-black text-[#050505] uppercase tracking-wider">Filtros, Comodidades & Características</h4>
                              <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">Gestão das opções de infraestrutura e itens de lazer nas listagens</p>
                            </div>
                            <span className="text-[8px] bg-green-50 text-green-700 px-3 py-1.5 border border-green-200 uppercase tracking-widest font-black rounded-lg">Real-Time</span>
                          </div>

                          {/* Seeding Button / Sync Bank */}
                          <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1">
                              <h5 className="text-[11px] font-black uppercase text-amber-900 tracking-wider">Sincronização de Opções Profissionais</h5>
                              <p className="text-[10px] text-amber-700 font-medium">
                                Alimente as coleções de Características, Ambientes, Proximidades, Instalações, Acabamentos, Lazer, Tipos e Categorias com um banco completo de Sorocaba com mais de 100 opções. 
                                <span className="font-bold underline ml-1">Obs: Itens existentes não serão duplicados.</span>
                              </p>
                              {seedReport && (
                                <span className="block text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-200 rounded-lg max-w-max mt-2">
                                  Último relatório de adições: {Object.entries(seedReport.counts).map(([col, n]) => `${col}: +${n}`).join(", ") || "Nenhum item novo adicionado"}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={handleSeedOptions}
                              disabled={isSeeding}
                              className={`shrink-0 flex items-center justify-center space-x-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                                isSeeding
                                  ? 'bg-amber-100 text-amber-400 border-amber-200 cursor-not-allowed'
                                  : 'bg-amber-500 hover:bg-amber-600 text-stone-900 border-amber-600 shadow-[0_4px_12px_rgba(245,158,11,0.2)] active:scale-95'
                              }`}
                            >
                              {isSeeding ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-stone-800 border-t-transparent rounded-full animate-spin"></div>
                                  <span>Sincronizando Banco...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={14} className="animate-pulse" />
                                  <span>Sincronizar Opções Padrão</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Selection filters tabs */}
                          <div className="flex flex-wrap gap-2 border-b border-stone-100 pb-4">
                            {[
                              { id: 'caracteristicas', label: 'Características' },
                              { id: 'instalacoes', label: 'Instalações' },
                              { id: 'acabamentos', label: 'Acabamentos' },
                              { id: 'lazer', label: 'Lazer & Convenções' },
                              { id: 'ambientes', label: 'Divisão de Ambientes' },
                              { id: 'caracteristicasApartamento', label: 'Apartamento' },
                              { id: 'caracteristicasEmpreendimento', label: 'Construção' },
                              { id: 'proximidades', label: 'Proximidades' }
                            ].map(tab => (
                              <button
                                key={tab.id}
                                onClick={() => setActiveFeaturesTab(tab.id as any)}
                                className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                                  activeFeaturesTab === tab.id
                                    ? 'bg-[#050505] text-[#FFD700] border-zinc-950 shadow-sm'
                                    : 'bg-[#F6F6F4] hover:bg-stone-200 text-stone-600 border-[#EFEFEA]'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          {activeFeaturesTab === 'caracteristicas' && (
                            <ConfigOptionManager collectionName="caracteristicas" title="Características Gerais" description="Ex: Armários Embutidos, Mobiliado, Closet, Banheira." />
                          )}
                          {activeFeaturesTab === 'instalacoes' && (
                            <ConfigOptionManager collectionName="instalacoes" title="Instalações Tecnológicas" description="Ex: Ar Condicionado, Aquecimento Solar, Internet Fibra." />
                          )}
                          {activeFeaturesTab === 'acabamentos' && (
                            <ConfigOptionManager collectionName="acabamentos" title="Acabamentos Nobres" description="Ex: Piso Porcelanato, Revestimento Mármore, Forro Gesso." />
                          )}
                          {activeFeaturesTab === 'lazer' && (
                            <ConfigOptionManager collectionName="lazer" title="Opções de Lazer & Áreas Comuns" description="Ex: Piscina Aquecida, Academia, Playground, Quadra de Tênis." />
                          )}
                          {activeFeaturesTab === 'ambientes' && (
                            <ConfigOptionManager collectionName="ambientes" title="Ambientes Internos" description="Ex: Home Office, Lavabo, Dependência de Empregada, Adega." />
                          )}
                          {activeFeaturesTab === 'caracteristicasApartamento' && (
                            <ConfigOptionManager collectionName="caracteristicasApartamento" title="Características do Apartamento" description="Ex: Varanda Gourmet, Andar Alto, Vista Livre, Elevador Privativo." />
                          )}
                          {activeFeaturesTab === 'caracteristicasEmpreendimento' && (
                            <ConfigOptionManager collectionName="caracteristicasEmpreendimento" title="Características do Empreendimento" description="Ex: Portaria Blindada 24h, Vaga de Visitante, Gerador Elétrico." />
                          )}
                          {activeFeaturesTab === 'proximidades' && (
                            <ConfigOptionManager collectionName="proximidades" title="Pontos Fortes de Proximidade Comercial" description="Ex: 5 min do Shopping Iguatemi, Próximo a Escolas Bilíngues." />
                          )}
                        </div>
                      )}

                      {/* 10.7 APARÊNCIA DO SITE */}
                      {settingsSubTab === 'appearance' && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-black text-[#050505] uppercase tracking-wider">Visual & Identidade Estética do Site</h4>
                            <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">Customização de cores primárias, logos institucionais de cabeçalho/rodape e efeitos de carregamento</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            
                            {/* COLOR SETTINGS CORES */}
                            <div className="space-y-4 bg-[#FCFCFB] p-5 border border-[#EFEFEA] rounded-2xl">
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block pl-1">Estilo & Guia de Cores Hexadecimal</span>
                              
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#D1D1D6] uppercase tracking-widest block">Cor Primária (Fundo Escuro / Barra de Navegação)</label>
                                <div className="flex gap-2">
                                  <input type="color" className="w-10 h-10 border border-[#EFEFEA] rounded-lg cursor-pointer bg-white"
                                    value={siteAppearanceSettings.primaryColor || '#050505'} onChange={e => setSiteAppearanceSettings({...siteAppearanceSettings, primaryColor: e.target.value})} />
                                  <input type="text" className="flex-1 bg-white border border-[#EFEFEA] rounded-xl px-4 text-xs font-mono font-bold"
                                    value={siteAppearanceSettings.primaryColor || '#050505'} onChange={e => setSiteAppearanceSettings({...siteAppearanceSettings, primaryColor: e.target.value})} />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#D1D1D6] uppercase tracking-widest block">Cor de Destaque / Botão Ativo (Gold/Yellow)</label>
                                <div className="flex gap-2">
                                  <input type="color" className="w-10 h-10 border border-[#EFEFEA] rounded-lg cursor-pointer bg-white"
                                    value={siteAppearanceSettings.secondaryColor || '#fb923c'} onChange={e => setSiteAppearanceSettings({...siteAppearanceSettings, secondaryColor: e.target.value})} />
                                  <input type="text" className="flex-1 bg-white border border-[#EFEFEA] rounded-xl px-4 text-xs font-mono font-bold"
                                    value={siteAppearanceSettings.secondaryColor || '#fb923c'} onChange={e => setSiteAppearanceSettings({...siteAppearanceSettings, secondaryColor: e.target.value})} />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#D1D1D6] uppercase tracking-widest block">Cor do Fundo Geral (Site Corporativo)</label>
                                <div className="flex gap-2">
                                  <input type="color" className="w-10 h-10 border border-[#EFEFEA] rounded-lg cursor-pointer bg-white"
                                    value={siteAppearanceSettings.backgroundColor || '#fcfcfc'} onChange={e => setSiteAppearanceSettings({...siteAppearanceSettings, backgroundColor: e.target.value})} />
                                  <input type="text" className="flex-1 bg-white border border-[#EFEFEA] rounded-xl px-4 text-xs font-mono font-bold"
                                    value={siteAppearanceSettings.backgroundColor || '#fcfcfc'} onChange={e => setSiteAppearanceSettings({...siteAppearanceSettings, backgroundColor: e.target.value})} />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#D1D1D6] uppercase tracking-widest block">Cor dos Textos Gerais</label>
                                <div className="flex gap-2">
                                  <input type="color" className="w-10 h-10 border border-[#EFEFEA] rounded-lg cursor-pointer bg-white"
                                    value={siteAppearanceSettings.textColor || '#1c1917'} onChange={e => setSiteAppearanceSettings({...siteAppearanceSettings, textColor: e.target.value})} />
                                  <input type="text" className="flex-1 bg-white border border-[#EFEFEA] rounded-xl px-4 text-xs font-mono font-bold"
                                    value={siteAppearanceSettings.textColor || '#1c1917'} onChange={e => setSiteAppearanceSettings({...siteAppearanceSettings, textColor: e.target.value})} />
                                </div>
                              </div>
                            </div>

                            {/* LOGOS & FAVICONS IMAGENS */}
                            <div className="space-y-4 bg-[#FCFCFB] p-5 border border-[#EFEFEA] rounded-2xl">
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block pl-1">Links das Logos da Empresa</span>

                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Logo Oficial do Cabeçalho (Header)</label>
                                <input type="text" className="w-full bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-xs font-bold text-stone-900"
                                  value={siteAppearanceSettings.logoUrl || ''} onChange={e => setSiteAppearanceSettings({...siteAppearanceSettings, logoUrl: e.target.value})} placeholder="https://i.postimg..." />
                                {siteAppearanceSettings.logoUrl && (
                                  <img src={siteAppearanceSettings.logoUrl} alt="Logo Header" className="h-8 max-w-full object-contain bg-slate-900 p-1 rounded mt-1" />
                                )}
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Favicon do Navegador (.ico / .png)</label>
                                <input type="text" className="w-full bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-xs font-bold text-stone-900"
                                  value={siteAppearanceSettings.faviconUrl || ''} onChange={e => setSiteAppearanceSettings({...siteAppearanceSettings, faviconUrl: e.target.value})} />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Imagem Corporativa Fallback (Sem Foto)</label>
                                <input type="text" className="w-full bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-xs font-bold text-stone-900"
                                  value={siteAppearanceSettings.defaultPropertyImage || ''} onChange={e => setSiteAppearanceSettings({...siteAppearanceSettings, defaultPropertyImage: e.target.value})} />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest">Cover Image Fallback para Carrosséis</label>
                                <input type="text" className="w-full bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-xs font-bold text-stone-900"
                                  value={siteAppearanceSettings.defaultHeroImage || ''} onChange={e => setSiteAppearanceSettings({...siteAppearanceSettings, defaultHeroImage: e.target.value})} />
                              </div>
                            </div>

                            {/* ANIMATION CONTROLS EFETOS */}
                            <div className="space-y-4 bg-[#FCFCFB] p-5 border border-[#EFEFEA] rounded-2xl md:col-span-2">
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block pl-1">Efeitos Visuais e Transições Avançadas</span>
                              
                              <div className="flex items-center justify-between p-3.5 bg-white border border-[#EFEFEA] rounded-xl">
                                <div>
                                  <span className="text-xs font-bold text-stone-800 block">Efeitos de Transições de Layout</span>
                                  <span className="text-[9px] text-[#A1A1AA] font-bold block uppercase tracking-widest">Habilitar carregamento gradativo, fade-ins e gradientes dinâmicos de luz</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSiteAppearanceSettings({...siteAppearanceSettings, effectsEnabled: !siteAppearanceSettings.effectsEnabled})}
                                  className={`px-4.5 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                                    siteAppearanceSettings.effectsEnabled !== false
                                      ? 'bg-amber-100/50 border-amber-300 text-amber-700'
                                      : 'bg-stone-50 border-stone-200 text-stone-400'
                                  }`}
                                >
                                  {siteAppearanceSettings.effectsEnabled !== false ? 'Habilitado' : 'Desabilitado'}
                                </button>
                              </div>

                              <div className="flex items-center justify-between p-3.5 bg-white border border-[#EFEFEA] rounded-xl">
                                <div>
                                  <span className="text-xs font-bold text-stone-800 block">Animações de Interação (Framer Motion)</span>
                                  <span className="text-[9px] text-[#A1A1AA] font-bold block uppercase tracking-widest">Habilitar efeitos de hover, bounce, micro-movimentos nos cards e na sidebar</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSiteAppearanceSettings({...siteAppearanceSettings, animationsEnabled: !siteAppearanceSettings.animationsEnabled})}
                                  className={`px-4.5 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                                    siteAppearanceSettings.animationsEnabled !== false
                                      ? 'bg-amber-100/50 border-amber-300 text-amber-700'
                                      : 'bg-stone-50 border-stone-200 text-stone-400'
                                  }`}
                                >
                                  {siteAppearanceSettings.animationsEnabled !== false ? 'Habilitado' : 'Desabilitado'}
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* NON-AUTHORIZED SCREEN: PREMIUM WALL WITH INTEGRATED EMAIL/PASSWORD & GOOGLE LOGIN */
            <div className="max-w-md mx-auto my-8 bg-white border border-[#EFEFEA] rounded-3xl p-8 shadow-xl space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-100">
                  <Lock size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-tight text-stone-900">Portal Administrativo</h3>
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Acesso Restrito & Criptografado</p>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed font-semibold px-2">
                  Gerencie seu inventário, propostas e histórico operacional com segurança máxima.
                </p>
              </div>

              {/* Status Messages */}
              {adminAuthError && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-2xl flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <p className="leading-relaxed">{adminAuthError}</p>
                </div>
              )}

              {adminAuthSuccess && (
                <div className="p-4 bg-green-50 border border-green-100 text-green-700 text-xs font-bold rounded-2xl flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  <p className="leading-relaxed">{adminAuthSuccess}</p>
                </div>
              )}

              {adminAuthMode === 'login' ? (
                /* LOGIN FORM */
                <form onSubmit={handleAdminEmailLogin} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">E-mail Corporativo</label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled={adminAuthLoading}
                        value={adminLoginEmail}
                        onChange={(e) => setAdminLoginEmail(e.target.value)}
                        placeholder="nome@rbsorocaba.com.br"
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl pl-10 pr-4 py-3.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:bg-white transition-all duration-300"
                      />
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                        <User size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Senha de Acesso</label>
                      <button
                        type="button"
                        onClick={() => {
                          setAdminAuthError(null);
                          setAdminAuthSuccess(null);
                          setAdminAuthMode('forgot_password');
                        }}
                        className="text-[10px] font-black text-amber-600 hover:text-amber-700 uppercase tracking-wider transition-colors"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        disabled={adminAuthLoading}
                        value={adminLoginPassword}
                        onChange={(e) => setAdminLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl pl-10 pr-4 py-3.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:bg-white transition-all duration-300"
                      />
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                        <Lock size={16} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={adminAuthLoading}
                    className="w-full py-4 bg-[#050505] hover:bg-stone-900 text-[#F5B400] rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {adminAuthLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#F5B400]/25 border-t-[#F5B400] rounded-full animate-spin" />
                        <span>Entrando...</span>
                      </>
                    ) : (
                      <span>Entrar no Painel</span>
                    )}
                  </button>
                </form>
              ) : (
                /* FORGOT PASSWORD FORM */
                <form onSubmit={handleAdminForgotPassword} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">E-mail Cadastrado</label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled={adminAuthLoading}
                        value={adminLoginEmail}
                        onChange={(e) => setAdminLoginEmail(e.target.value)}
                        placeholder="nome@rbsorocaba.com.br"
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] outline-none rounded-xl pl-10 pr-4 py-3.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:bg-white transition-all duration-300"
                      />
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                        <User size={16} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={adminAuthLoading}
                    className="w-full py-4 bg-[#050505] hover:bg-stone-900 text-[#F5B400] rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {adminAuthLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#F5B400]/25 border-t-[#F5B400] rounded-full animate-spin" />
                        <span>Redefinindo...</span>
                      </>
                    ) : (
                      <span>Enviar Link de Recuperação</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdminAuthError(null);
                      setAdminAuthSuccess(null);
                      setAdminAuthMode('login');
                    }}
                    className="w-full text-xs font-bold text-zinc-500 hover:text-stone-900 uppercase tracking-wider transition-colors pt-1 cursor-pointer"
                  >
                    Voltar para o Login
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-zinc-100" />
                <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Ou</span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>

              {/* Google login Option */}
              <button
                type="button"
                onClick={handleAdminGoogleLogin}
                disabled={adminAuthLoading}
                className="w-full py-4 bg-[#F9F9FB] hover:bg-[#F3F3F5] border border-stone-200 text-stone-700 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                {adminAuthLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
                    <span>Entrando com Google...</span>
                  </>
                ) : (
                  <>
                    <Shield size={16} className="text-stone-500" />
                    Autenticação com Google
                  </>
                )}
              </button>
            </div>
          )}

          {/* ADD / EDIT PROPERTY FORM OVERLAY */}
          {showAddForm && (
            <div className="space-y-6">
              {/* Add form banner indicator */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#050505] rounded-3xl p-6 md:p-8 text-white border border-[#101010] gap-4">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#7A7F8C]">Curadoria Imobiliária Premium</h4>
                  <h3 className="text-lg md:text-xl font-bold text-white tracking-tight mt-1">
                    {editingId !== null ? `Editando Imóvel: ${newProperty.title || 'Sem título'}` : 'Cadastrar Proposta de Imóvel'}
                  </h3>
                  <p className="text-xs text-[#F5B400] font-semibold uppercase mt-1 tracking-wider">
                    RB Sorocaba Negócios Imobiliários
                  </p>
                </div>
                <button 
                  onClick={resetForm}
                  className="px-5 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-[#F5B400] hover:bg-white hover:text-[#050505] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer shadow-sm"
                >
                  Voltar ao Painel
                </button>
              </div>

              {/* Form Multi-step body */}
              <div className="bg-white border border-[#E7E7E7] rounded-3xl p-6 md:p-8 shadow-sm">
                {showSuccess ? (
                  <div className="py-16 flex flex-col items-center text-center space-y-6 max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-[#20C77A]/10 rounded-full flex items-center justify-center text-[#20C77A] border border-[#20C77A]/20">
                      <CheckCircle2 size={36} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-[#111111] uppercase tracking-wider">Procedimento Executado!</h4>
                      <p className="text-xs text-[#7A7F8C]">O imóvel foi enviado com sucesso e atualizado no inventário permanente da RB Sorocaba.</p>
                    </div>
                    <button 
                      onClick={resetForm}
                      className="bg-[#050505] hover:bg-[#F5B400] text-white hover:text-[#050505] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer"
                    >
                      OK, Finalizar
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* WIZARD LEFT SIDEBAR TABS */}
                    <div className="lg:col-span-3 flex flex-col space-y-1.5 border-b lg:border-b-0 lg:border-r border-neutral-100 pb-6 lg:pb-0 lg:pr-6">
                      <div className="flex justify-between items-center mb-2.5 hidden lg:flex">
                        <span className="text-[11px] font-bold uppercase text-[#7A7F8C] tracking-wider">Progresso da Ficha</span>
                        <span className="text-xs font-bold text-[#F5B400] font-mono">
                          {Math.round((([
                            'dados_basicos', 'localizacao', 'proprietario', 'caracteristicas', 
                            'ambientes', 'proximidades', 'instalacao', 'acabamento', 'lazer', 
                            'imagens', 'videos', 'publicacao'
                           ].indexOf(editTab) + 1) / 12) * 100)}%
                        </span>
                      </div>
                      
                      {/* Integrated filling progress indicator bar */}
                      <div className="mb-5 bg-neutral-100 h-2 rounded-full overflow-hidden hidden lg:block border border-neutral-250/50">
                        <div 
                          className="bg-[#F5B400] h-full transition-all duration-350" 
                          style={{ 
                            width: `${(([
                              'dados_basicos', 'localizacao', 'proprietario', 'caracteristicas', 
                              'ambientes', 'proximidades', 'instalacao', 'acabamento', 'lazer', 
                              'imagens', 'videos', 'publicacao'
                            ].indexOf(editTab) + 1) / 12) * 100}%` 
                          }} 
                        />
                      </div>

                      <div className="text-[11px] font-bold uppercase text-[#7A7F8C] tracking-wider mb-2.5 hidden lg:block">Etapas da Ficha</div>
                      
                      {/* Mobile horizontal scroll bar */}
                      <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible space-x-2 lg:space-x-0 lg:space-y-1 pb-3 lg:pb-0 no-scrollbar select-none">
                        {[
                          { id: 'dados_basicos', label: 'Dados Básicos' },
                          { id: 'localizacao', label: 'Localização' },
                          { id: 'proprietario', label: 'Proprietário' },
                          { id: 'caracteristicas', label: 'Características' },
                          { id: 'ambientes', label: 'Ambientes' },
                          { id: 'proximidades', label: 'Proximidades' },
                          { id: 'instalacao', label: 'Instalação' },
                          { id: 'acabamento', label: 'Acabamento' },
                          { id: 'lazer', label: 'Lazer e Condomínio' },
                          { id: 'imagens', label: 'Imagens' },
                          { id: 'videos', label: 'Vídeos' },
                          { id: 'publicacao', label: 'Publicação' }
                        ].map((tb, idx) => {
                          const isActive = editTab === tb.id;
                          return (
                            <button
                              key={tb.id}
                              type="button"
                              onClick={() => setEditTab(tb.id)}
                              className={`whitespace-nowrap px-4 py-3 rounded-xl text-left text-xs font-bold uppercase transition-all duration-200 flex items-center justify-between shrink-0 cursor-pointer ${
                                isActive 
                                  ? 'bg-[#050505] text-[#F5B400] shadow-sm border border-[#050505]' 
                                  : 'bg-[#F7F7F5] text-[#7A7F8C] hover:bg-neutral-100 hover:text-[#111111] border border-[#E7E7E7]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`text-[10px] font-mono font-bold rounded-lg w-5 h-5 flex items-center justify-center ${isActive ? 'bg-[#F5B400] text-[#050505]' : 'bg-[#E7E7E7] text-[#7A7F8C]'}`}>
                                  {idx + 1}
                                </span>
                                <span>{tb.label}</span>
                              </div>
                              <ChevronRight size={13} className={`hidden lg:block transition-transform ${isActive ? 'translate-x-1' : 'opacity-40'}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* WIZARD RIGHT CONTENT BLOCK */}
                    <form onSubmit={handleSubmit} className="lg:col-span-9 space-y-6">

                      {/* 1. DADOS BÁSICOS */}
                      {editTab === 'dados_basicos' && (
                        <div className="space-y-5">
                          <div className="border-b border-slate-100 pb-3">
                            <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest border-l-4 border-amber-500 pl-3">Identificação e Áreas do Imóvel</h4>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Insira o escopo e as descrições fundamentais do imóvel</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-stone-600">Categoria *</label>
                              <select className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-bold text-stone-800"
                                value={newProperty.category} onChange={e => setNewProperty({...newProperty, category: e.target.value as any})}>
                                {opcoesCategoriasImovel.map((c: any) => (
                                  <option key={c.id || c.value} value={c.nome || c.label}>{c.nome || c.label}</option>
                                ))}
                                {opcoesCategoriasImovel.length === 0 && (
                                  <>
                                    <option value="Residencial">Residencial</option>
                                    <option value="Comercial">Comercial</option>
                                    <option value="Rural">Rural</option>
                                  </>
                                )}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-stone-600">Tipo de Imóvel *</label>
                              <select className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-bold text-stone-800"
                                value={newProperty.type || newProperty.propertyType} 
                                onChange={e => setNewProperty({...newProperty, type: e.target.value, propertyType: e.target.value})}>
                                {opcoesTiposImovel.map((t: any) => (
                                  <option key={t.id || t.value} value={t.nome || t.label}>{t.nome || t.label}</option>
                                ))}
                                {opcoesTiposImovel.length === 0 && (
                                  <>
                                    {FALLBACK_TIPOS_IMOVEL.map(t => (
                                      <option key={t.id} value={t.nome}>{t.nome}</option>
                                    ))}
                                    {optTiposImovel.map(t => (
                                      <option key={t.id} value={t.nome}>{t.nome}</option>
                                    ))}
                                  </>
                                )}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] font-black uppercase text-stone-600">Código / Referência</label>
                                <span className="text-[7.5px] font-black uppercase text-[#888880] tracking-wider leading-none">Auto-Sequencial</span>
                              </div>
                              <input type="text" readOnly
                                className="w-full bg-[#EFEFEA]/50 border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-mono font-bold text-stone-600 cursor-not-allowed select-all"
                                value={editingId !== null ? (newProperty.codigoImovel || newProperty.codigo || '') : (codigoPreview || '')}
                                placeholder="Gerado automaticamente de forma sequencial..." />
                              <span className="text-[8px] font-bold text-amber-600 uppercase tracking-wider block pt-0.5 font-mono">
                                {editingId !== null ? 'Código gravado e protegido' : `Prévia dinâmica: ${codigoPreview || 'Gerando...'} se ${newProperty.type || 'Casa'}`}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-stone-600">Matrícula (Opcional)</label>
                              <input type="text" placeholder="Ex: 123.456"
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                value={newProperty.matricula || ''} onChange={e => setNewProperty({...newProperty, matricula: e.target.value})} />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-stone-600">C.R.I. Local (Opcional)</label>
                              <input type="text" placeholder="Ex: 2º CRI Sorocaba"
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                value={newProperty.cri || ''} onChange={e => setNewProperty({...newProperty, cri: e.target.value})} />
                            </div>

                            <div className="flex items-end justify-start pb-3">
                              <label className="flex items-center space-x-2 text-xs font-bold text-stone-700 cursor-pointer select-none">
                                <input type="checkbox" checked={!!newProperty.eEdificio} onChange={e => setNewProperty({...newProperty, eEdificio: e.target.checked})}
                                  className="rounded border-slate-300 text-[#FFD700] w-4 h-4 focus:ring-amber-500" />
                                <span>É edifício?</span>
                              </label>
                            </div>

                            {/* Condominium name toggle logic */}
                            <div className="space-y-1 md:col-span-2">
                              <label className="flex items-center space-x-2 text-xs font-bold text-stone-700 mb-1 cursor-pointer select-none">
                                <input type="checkbox" checked={!!newProperty.estaEmCondominio} onChange={e => setNewProperty({...newProperty, estaEmCondominio: e.target.checked})}
                                  className="rounded border-slate-300 text-amber-500 w-4 h-4 focus:ring-amber-500" />
                                <span>Este imóvel está inserido em condomínio fechado?</span>
                              </label>
                              
                              {newProperty.estaEmCondominio && (
                                <input type="text" placeholder="Escreva o nome oficial do Condomínio (Ex: Giverny, Sunset...)"
                                  className="w-full bg-[#F1F1ED] border border-amber-300 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium mt-1 animate-fade-in"
                                  value={newProperty.condominium || ''} onChange={e => setNewProperty({...newProperty, condominium: e.target.value})} />
                              )}
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[9px] font-black uppercase text-stone-600">Descrição Comercial Completa</label>
                              <textarea placeholder="Faça uma excelente descrição realçando os diferenciais em Sorocaba..." rows={5}
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                value={newProperty.description || ''} onChange={e => setNewProperty({...newProperty, description: e.target.value})} />
                            </div>

                            {/* QUANTITATIVE DETAILS */}
                            <div className="md:col-span-2 bg-[#F6F6F4] p-5 rounded-2xl border border-[#EFEFEA] space-y-4">
                              <div className="text-[10px] font-black uppercase text-stone-900 tracking-wider border-b border-slate-200 pb-1">
                                Cômodos & Demais Componentes Quantitativos
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase text-slate-500">Dormitórios</label>
                                  <input type="number" min="0" className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold"
                                    value={newProperty.beds} onChange={e => setNewProperty({...newProperty, beds: Number(e.target.value)})} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase text-slate-500">Suítes</label>
                                  <input type="number" min="0" className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold"
                                    value={newProperty.suites} onChange={e => setNewProperty({...newProperty, suites: Number(e.target.value)})} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase text-slate-500">Banheiros</label>
                                  <input type="number" min="0" className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold"
                                    value={newProperty.baths || 0} onChange={e => setNewProperty({...newProperty, baths: Number(e.target.value)})} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase text-slate-500">Lavabos</label>
                                  <input type="number" min="0" className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold"
                                    value={newProperty.lavabos || 0} onChange={e => setNewProperty({...newProperty, lavabos: Number(e.target.value)})} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase text-slate-500">Salas</label>
                                  <input type="number" min="0" className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold"
                                    value={newProperty.salas || 0} onChange={e => setNewProperty({...newProperty, salas: Number(e.target.value)})} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase text-slate-500">Vagas Cobertas</label>
                                  <input type="number" min="0" className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold"
                                    value={newProperty.parkingCovered || 0} onChange={e => setNewProperty({...newProperty, parkingCovered: Number(e.target.value)})} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase text-slate-500">Vagas Descobertas</label>
                                  <input type="number" min="0" className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold"
                                    value={newProperty.parkingUncovered || 0} onChange={e => setNewProperty({...newProperty, parkingUncovered: Number(e.target.value)})} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase text-slate-500">Pavimentos</label>
                                  <input type="number" min="0" className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold"
                                    value={newProperty.pavimentos || 0} onChange={e => setNewProperty({...newProperty, pavimentos: Number(e.target.value)})} />
                                </div>
                              </div>
                            </div>

                            {/* BUILDING DATA IN CASE OF APARTMENT/EDIFICIO */}
                            {(newProperty.eEdificio || newProperty.type === 'Apartamento') && (
                              <div className="md:col-span-2 bg-slate-50 border border-slate-100 p-5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase text-slate-500">Número do Andar</label>
                                  <input type="number" min="0" className="w-full bg-white border border-slate-100 rounded-lg px-3 py-2 text-xs"
                                    value={newProperty.andar || 0} onChange={e => setNewProperty({...newProperty, andar: Number(e.target.value)})} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase text-slate-500">Quantidade de Torres</label>
                                  <input type="number" min="0" className="w-full bg-white border border-slate-100 rounded-lg px-3 py-2 text-xs"
                                    value={newProperty.torres || 0} onChange={e => setNewProperty({...newProperty, torres: Number(e.target.value)})} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase text-slate-500">Unidades por Andar</label>
                                  <input type="number" min="0" className="w-full bg-white border border-slate-100 rounded-lg px-3 py-2 text-xs"
                                    value={newProperty.unidadesPorAndar || 0} onChange={e => setNewProperty({...newProperty, unidadesPorAndar: Number(e.target.value)})} />
                                </div>
                              </div>
                            )}

                            {/* METRIC MEASUREMENTS AND AREAS */}
                            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-amber-50/40 p-5 border border-amber-100/70 rounded-2xl">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-amber-900">Área Útil Privativa</label>
                                <input type="text" placeholder="Ex: 120m²" required
                                  className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold"
                                  value={newProperty.areaUseful || newProperty.area || ''} onChange={e => setNewProperty({...newProperty, areaUseful: e.target.value, area: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-amber-900">Área Total</label>
                                <input type="text" placeholder="Ex: 300m²"
                                  className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold"
                                  value={newProperty.areaTotal || ''} onChange={e => setNewProperty({...newProperty, areaTotal: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-amber-900">Área Construída</label>
                                <input type="text" placeholder="Ex: 240m²"
                                  className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold"
                                  value={newProperty.areaConstruida || ''} onChange={e => setNewProperty({...newProperty, areaConstruida: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-amber-900">Área de Terreno</label>
                                <input type="text" placeholder="Ex: 360m²"
                                  className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold"
                                  value={newProperty.areaTerreno || ''} onChange={e => setNewProperty({...newProperty, areaTerreno: e.target.value})} />
                              </div>
                            </div>

                          </div>

                          {/* 1.5. REGRAS DO NEGÓCIO INTEGRADO */}
                          <div className="space-y-6 pt-6 border-t border-slate-200 mt-6">
                          <div className="border-b border-slate-100 pb-3">
                            <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest border-l-4 border-amber-500 pl-3">Regras do Negócio & Condições Financeiras</h4>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Defina o comportamento comercial, valores de fechamento e taxas adicionais</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            <div className="col-span-full bg-[#F6F6F4] p-6 rounded-2xl border border-[#EFEFEA] space-y-6 animate-fade-in mb-4">
                              <div className="text-[10px] font-black uppercase text-stone-900 tracking-wider pb-2 border-b border-stone-200 flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-stone-900 font-extrabold">
                                  <Shield size={12} className="text-amber-500" />
                                  Status e Controle Comercial
                                </span>
                                <span className="text-[8px] bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Automático</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Status do Imóvel */}
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase text-stone-600">Status do Imóvel *</label>
                                  <select 
                                    className="w-full bg-white border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-bold text-stone-900"
                                    value={newProperty.status || 'Disponível'} 
                                    onChange={e => {
                                      const newStatus = e.target.value;
                                      const updated = applyStatusRules(newStatus, newProperty.purpose || 'Venda', newProperty);
                                      setNewProperty(updated);
                                    }}
                                  >
                                    {opcoesStatusImovel.map((opt: string) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Finalidade do Negócio */}
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase text-stone-600">Finalidade do Negócio *</label>
                                  <select 
                                    className="w-full bg-white border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-bold text-stone-900"
                                    value={newProperty.purpose || 'Venda'} 
                                    onChange={e => {
                                      const newPurpose = e.target.value;
                                      const updated = applyStatusRules(newProperty.status || 'Disponível', newPurpose, {
                                        ...newProperty,
                                        purpose: newPurpose as any,
                                        tipoNegocio: newPurpose
                                      });
                                      setNewProperty(updated);
                                    }}
                                  >
                                    <option value="Venda">Venda</option>
                                    <option value="Locação">Locação</option>
                                    <option value="Venda e Locação">Venda e Locação</option>
                                  </select>
                                </div>

                                {/* Controls check lists */}
                                <div className="sm:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-3">
                                  <label className="flex items-center space-x-2.5 p-3.5 bg-white border border-[#EFEFEA] rounded-xl cursor-pointer hover:bg-stone-50 select-none">
                                    <input type="checkbox" className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 h-4.5 w-4.5 animate-none"
                                      checked={!!newProperty.disponivelParaVenda}
                                      onChange={e => setNewProperty({...newProperty, disponivelParaVenda: e.target.checked})} />
                                    <span className="text-[10px] font-black text-stone-700 uppercase tracking-wide">Disponível para Venda</span>
                                  </label>

                                  <label className="flex items-center space-x-2.5 p-3.5 bg-white border border-[#EFEFEA] rounded-xl cursor-pointer hover:bg-stone-50 select-none">
                                    <input type="checkbox" className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 h-4.5 w-4.5 animate-none"
                                      checked={!!newProperty.disponivelParaLocacao}
                                      onChange={e => setNewProperty({...newProperty, disponivelParaLocacao: e.target.checked})} />
                                    <span className="text-[10px] font-black text-stone-700 uppercase tracking-wide">Disponível para Locação</span>
                                  </label>

                                  <label className="flex items-center space-x-2.5 p-3.5 bg-white border border-[#EFEFEA] rounded-xl cursor-pointer hover:bg-stone-50 select-none">
                                    <input type="checkbox" className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 h-4.5 w-4.5"
                                      checked={!!newProperty.publicadoNoSite}
                                      onChange={e => setNewProperty({...newProperty, publicadoNoSite: e.target.checked, publicado: e.target.checked})} />
                                    <span className="text-[10px] font-black text-stone-700 uppercase tracking-wide">Publicar no Site</span>
                                  </label>

                                  <label className="flex items-center space-x-2.5 p-3.5 bg-white border border-[#EFEFEA] rounded-xl cursor-pointer hover:bg-stone-50 select-none">
                                    <input type="checkbox" className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 h-4.5 w-4.5"
                                      checked={!!newProperty.mostrarNosFiltros}
                                      onChange={e => setNewProperty({...newProperty, mostrarNosFiltros: e.target.checked})} />
                                    <span className="text-[10px] font-black text-stone-700 uppercase tracking-wide">Mostrar nos Filtros</span>
                                  </label>

                                  <label className="flex items-center space-x-2.5 p-3.5 bg-white border border-[#EFEFEA] rounded-xl cursor-pointer hover:bg-stone-50 select-none">
                                    <input type="checkbox" className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 h-4.5 w-4.5"
                                      checked={!!newProperty.destaqueNaHome}
                                      onChange={e => setNewProperty({...newProperty, destaqueNaHome: e.target.checked, featured: e.target.checked})} />
                                    <span className="text-[10px] font-black text-stone-700 uppercase tracking-wide">Destacar na Home</span>
                                  </label>

                                  <label className="flex items-center space-x-2.5 p-3.5 bg-white border border-[#EFEFEA] rounded-xl cursor-pointer hover:bg-stone-50 select-none">
                                    <input type="checkbox" className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 h-4.5 w-4.5"
                                      checked={!!newProperty.disponivelParaVisita}
                                      onChange={e => setNewProperty({...newProperty, disponivelParaVisita: e.target.checked})} />
                                    <span className="text-[10px] font-black text-stone-700 uppercase tracking-wide">Disponível para Visita</span>
                                  </label>

                                  <label className="flex items-center space-x-2.5 p-3.5 bg-white border border-[#EFEFEA] rounded-xl cursor-pointer hover:bg-stone-50 select-none">
                                    <input type="checkbox" className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500 h-4.5 w-4.5"
                                      checked={!!newProperty.disponivelParaProposta}
                                      onChange={e => setNewProperty({...newProperty, disponivelParaProposta: e.target.checked})} />
                                    <span className="text-[10px] font-black text-stone-700 uppercase tracking-wide">Permitir Proposta</span>
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* DADOS DA LOCAÇÃO ATUAL */}
                            {newProperty.status === 'Alugado' && (
                              <div className="col-span-full bg-[#F6F6F4] p-6 rounded-2xl border-l-4 border-amber-500 border-y border-r border-[#EFEFEA] space-y-4 animate-fade-in mb-4">
                                <div className="text-[10px] font-black uppercase text-stone-900 tracking-wider pb-2 border-b border-stone-200">
                                  Dados da Locação Atual (Automação de Locação)
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">Nome do Locatário *</label>
                                    <input type="text" required placeholder="Ex: João da Silva"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold text-[#111]"
                                      value={newProperty.autoLocatarioNome || ''} onChange={e => setNewProperty({...newProperty, autoLocatarioNome: e.target.value})} />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">CPF/CNPJ do Locatário *</label>
                                    <input type="text" required placeholder="Ex: 000.000.000-00"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#111]"
                                      value={newProperty.autoLocatarioCpfCnpj || ''} onChange={e => setNewProperty({...newProperty, autoLocatarioCpfCnpj: e.target.value})} />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">Telefone do Locatário *</label>
                                    <input type="text" required placeholder="Ex: (15) 99123-4567"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#111]"
                                      value={newProperty.autoLocatarioTelefone || ''} onChange={e => setNewProperty({...newProperty, autoLocatarioTelefone: e.target.value})} />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">E-mail do Locatário *</label>
                                    <input type="email" required placeholder="locatario@email.com"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold text-[#111]"
                                      value={newProperty.autoLocatarioEmail || ''} onChange={e => setNewProperty({...newProperty, autoLocatarioEmail: e.target.value})} />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Início da Locação *</label>
                                    <input type="date" required
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold text-[#111]"
                                      value={newProperty.autoDataInicio || ''} onChange={e => setNewProperty({...newProperty, autoDataInicio: e.target.value})} />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500 font-mono font-semibold">Fim da Locação</label>
                                    <input type="date"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold text-[#111]"
                                      value={newProperty.autoDataFim || ''} onChange={e => setNewProperty({...newProperty, autoDataFim: e.target.value})} />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Dia do Vencimento *</label>
                                    <input type="number" min="1" max="31" required placeholder="Ex: 10"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#111]"
                                      value={newProperty.autoDiaVencimento || '10'} onChange={e => setNewProperty({...newProperty, autoDiaVencimento: e.target.value})} />
                                  </div>

                                  <PercentInput
                                    label="Comissão Imobiliária"
                                    value={newProperty.autoPercentualComissao !== undefined ? newProperty.autoPercentualComissao : 10}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, autoPercentualComissao: numericValue})}
                                    required
                                  />

                                  <CurrencyInput
                                    label="Aluguel Mensal"
                                    value={newProperty.autoValorAluguelMensal !== undefined ? newProperty.autoValorAluguelMensal : ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, autoValorAluguelMensal: numericValue})}
                                    required
                                  />

                                  <CurrencyInput
                                    label="Condomínio Mensal"
                                    value={newProperty.autoValorCondominio !== undefined ? newProperty.autoValorCondominio : ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, autoValorCondominio: numericValue})}
                                  />

                                  <CurrencyInput
                                    label="IPTU Mensal"
                                    value={newProperty.autoValorIptu !== undefined ? newProperty.autoValorIptu : ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, autoValorIptu: numericValue})}
                                  />

                                  <CurrencyInput
                                    label="Taxa Lixo Mensal"
                                    value={newProperty.autoTaxaLixo !== undefined ? newProperty.autoTaxaLixo : ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, autoTaxaLixo: numericValue})}
                                  />

                                  <CurrencyInput
                                    label="Taxa Água"
                                    value={newProperty.autoTaxaAgua !== undefined ? newProperty.autoTaxaAgua : ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, autoTaxaAgua: numericValue})}
                                  />

                                  <CurrencyInput
                                    label="Taxa Luz"
                                    value={newProperty.autoTaxaLuz !== undefined ? newProperty.autoTaxaLuz : ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, autoTaxaLuz: numericValue})}
                                  />

                                  <CurrencyInput
                                    label="Taxa Gás"
                                    value={newProperty.autoTaxaGas !== undefined ? newProperty.autoTaxaGas : ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, autoTaxaGas: numericValue})}
                                  />

                                  <CurrencyInput
                                    label="Seguro Incêndio"
                                    value={newProperty.autoSeguroIncendio !== undefined ? newProperty.autoSeguroIncendio : ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, autoSeguroIncendio: numericValue})}
                                  />

                                  <div className="sm:col-span-2 md:col-span-3 space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Observações da Locação</label>
                                    <input type="text" placeholder="Observações..."
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold text-stone-900 font-mono"
                                      value={newProperty.autoObservacoesLocacao || ''} onChange={e => setNewProperty({...newProperty, autoObservacoesLocacao: e.target.value})} />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* DADOS DA VENDA */}
                            {newProperty.status === 'Vendido' && (
                              <div className="col-span-full bg-[#F6F6F4] p-6 rounded-2xl border-l-4 border-amber-500 border-y border-r border-[#EFEFEA] space-y-4 animate-fade-in mb-4">
                                <div className="text-[10px] font-black uppercase text-stone-900 tracking-wider pb-2 border-b border-stone-200">
                                  Dados da Venda (Controle Comercial Auto-Venda)
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">Nome do Comprador *</label>
                                    <input type="text" required placeholder="Ex: Maria Oliveira"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold text-[#111]"
                                      value={newProperty.autoCompradorNome || ''} onChange={e => setNewProperty({...newProperty, autoCompradorNome: e.target.value})} />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">CPF/CNPJ do Comprador *</label>
                                    <input type="text" required placeholder="Ex: 000.000.000-00"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#111]"
                                      value={newProperty.autoCompradorCpfCnpj || ''} onChange={e => setNewProperty({...newProperty, autoCompradorCpfCnpj: e.target.value})} />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">Telefone do Comprador *</label>
                                    <input type="text" required placeholder="Ex: (15) 99123-4567"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#111]"
                                      value={newProperty.autoCompradorTelefone || ''} onChange={e => setNewProperty({...newProperty, autoCompradorTelefone: e.target.value})} />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">E-mail do Comprador *</label>
                                    <input type="email" required placeholder="comprador@email.com"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold text-[#111]"
                                      value={newProperty.autoCompradorEmail || ''} onChange={e => setNewProperty({...newProperty, autoCompradorEmail: e.target.value})} />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Data da Venda *</label>
                                    <input type="date" required
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold text-[#111]"
                                      value={newProperty.autoDataVenda || ''} onChange={e => setNewProperty({...newProperty, autoDataVenda: e.target.value})} />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">Forma de Pagamento *</label>
                                    <select required className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold text-stone-900"
                                      value={newProperty.autoFormaPagamento || 'À Vista'} onChange={e => setNewProperty({...newProperty, autoFormaPagamento: e.target.value})}>
                                      <option value="À Vista">À Vista</option>
                                      <option value="Financiamento Bancário">Financiamento Bancário</option>
                                      <option value="Permuta">Permuta</option>
                                      <option value="Parcelado Direto">Parcelado Direto</option>
                                    </select>
                                  </div>

                                  <CurrencyInput
                                    label="Valor de Fechamento"
                                    value={newProperty.autoValorFinalVenda !== undefined ? newProperty.autoValorFinalVenda : ''}
                                    onChange={({ numericValue }) => {
                                      const pct = Number(newProperty.autoPercentualComissaoVenda || 6);
                                      setNewProperty({
                                        ...newProperty,
                                        autoValorFinalVenda: numericValue,
                                        autoValorComissaoVenda: Math.round(numericValue * (pct / 100))
                                      });
                                    }}
                                    required
                                  />

                                  <PercentInput
                                    label="Comissão"
                                    value={newProperty.autoPercentualComissaoVenda !== undefined ? newProperty.autoPercentualComissaoVenda : 6}
                                    onChange={({ numericValue }) => {
                                      const val = Number(newProperty.autoValorFinalVenda || 0);
                                      setNewProperty({
                                        ...newProperty,
                                        autoPercentualComissaoVenda: numericValue,
                                        autoValorComissaoVenda: Math.round(val * (numericValue / 100))
                                      });
                                    }}
                                    required
                                  />

                                  <CurrencyInput
                                    label="Comissão (R$ Calculado)"
                                    value={newProperty.autoValorComissaoVenda !== undefined ? newProperty.autoValorComissaoVenda : ''}
                                    onChange={() => {}}
                                    disabled
                                  />

                                  <div className="sm:col-span-2 md:col-span-3 space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Observações da Venda</label>
                                    <input type="text" placeholder="Observações da transação..."
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold text-stone-900 font-mono"
                                      value={newProperty.autoObservacoesVenda || ''} onChange={e => setNewProperty({...newProperty, autoObservacoesVenda: e.target.value})} />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* OBSERVAÇÕES DA RESERVA */}
                            {newProperty.status === 'Reservado' && (
                              <div className="col-span-full bg-[#F6F6F4] p-5 rounded-2xl border-l-4 border-amber-500 border-y border-r border-[#EFEFEA] space-y-1 animate-fade-in mb-4">
                                <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Observações da Reserva</label>
                                <input type="text" placeholder="Ex: Reservado pelo corretor André até dia 20..."
                                  className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold text-[#111] font-mono"
                                  value={newProperty.autoObservacoesReserva || ''} onChange={e => setNewProperty({...newProperty, autoObservacoesReserva: e.target.value})} />
                              </div>
                            )}

                            {/* VALORES VENDA */}
                            {(newProperty.purpose === 'Venda' || newProperty.purpose === 'Venda e Locação') && (
                              <div className="md:col-span-2 bg-[#F6F6F4] p-5 rounded-2xl border border-[#EFEFEA] space-y-4 animate-fade-in">
                                <div className="text-[10px] font-black uppercase text-stone-900 tracking-wider">Métrica de Valores: Venda</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <CurrencyInput
                                    label="Valor de Venda"
                                    value={newProperty.valorVenda || ''}
                                    onChange={({ numericValue }) => setNewProperty({
                                      ...newProperty,
                                      valorVenda: numericValue,
                                      priceValue: numericValue
                                    })}
                                    required={newProperty.purpose === 'Venda' || newProperty.purpose === 'Venda e Locação'}
                                  />

                                  <CurrencyInput
                                    label="Condomínio (mês)"
                                    value={newProperty.valorCondominio || ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, valorCondominio: numericValue})}
                                  />

                                  <CurrencyInput
                                    label="IPTU Anual"
                                    value={newProperty.valorIptuAnual || ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, valorIptuAnual: numericValue, valorIptu: numericValue})}
                                  />

                                  <CurrencyInput
                                    label="Taxa Exclusiva Lixo Anual"
                                    value={newProperty.taxaLixoAnual || ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, taxaLixoAnual: numericValue, taxaLixo: numericValue})}
                                  />

                                  <CurrencyInput
                                    label="Taxa de Gás"
                                    value={newProperty.taxaGas || ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, taxaGas: numericValue})}
                                  />

                                  <CurrencyInput
                                    label="Taxa de Água"
                                    value={newProperty.taxaAgua || ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, taxaAgua: numericValue})}
                                  />

                                  <CurrencyInput
                                    label="Taxa de Luz"
                                    value={newProperty.taxaLuz || ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, taxaLuz: numericValue})}
                                  />

                                  <CurrencyInput
                                    label="Taxas Adicionais"
                                    value={newProperty.taxasAdicionais || ''}
                                    onChange={({ numericValue }) => setNewProperty({...newProperty, taxasAdicionais: numericValue})}
                                  />

                                  <div className="col-span-full border-t border-slate-200 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex flex-col justify-center space-y-2">
                                      <label className="flex items-center space-x-2 text-xs font-bold text-stone-700 cursor-pointer select-none">
                                        <input type="checkbox" checked={!!newProperty.aceitaFinanciamento} onChange={e => setNewProperty({...newProperty, aceitaFinanciamento: e.target.checked})}
                                          className="rounded border-slate-300 text-amber-500 w-4 h-4 focus:ring-amber-500" />
                                        <span>Aceita Financiamento Bancário?</span>
                                      </label>
                                      <label className="flex items-center space-x-2 text-xs font-bold text-stone-700 cursor-pointer select-none">
                                        <input type="checkbox" checked={!!newProperty.aceitaPermuta} onChange={e => setNewProperty({...newProperty, aceitaPermuta: e.target.checked})}
                                          className="rounded border-slate-300 text-amber-500 w-4 h-4 focus:ring-amber-500" />
                                        <span>Aceita Permuta em Sorocaba?</span>
                                      </label>
                                      <label className="flex items-center space-x-2 text-xs font-bold text-stone-700 cursor-pointer select-none">
                                        <input type="checkbox" checked={!!newProperty.aceitaFGTS} onChange={e => setNewProperty({...newProperty, aceitaFGTS: e.target.checked})}
                                          className="rounded border-slate-300 text-amber-500 w-4 h-4 focus:ring-amber-500" />
                                        <span>Aceita FGTS?</span>
                                      </label>
                                    </div>
                                    <div className="flex flex-col justify-center space-y-2">
                                      <label className="flex items-center space-x-2 text-xs font-bold text-stone-700 cursor-pointer select-none">
                                        <input type="checkbox" checked={!!newProperty.eMobiliado} onChange={e => {
                                          const checked = e.target.checked;
                                          setNewProperty({
                                            ...newProperty, 
                                            eMobiliado: checked,
                                            mobiliado: checked,
                                            mobiliadoStatus: checked ? 'Sim' : 'Não'
                                          });
                                        }}
                                          className="rounded border-slate-300 text-amber-500 w-4 h-4 focus:ring-amber-500" />
                                        <span>Mobiliado?</span>
                                      </label>
                                      <label className="flex items-center space-x-2 text-xs font-bold text-stone-700 cursor-pointer select-none">
                                        <input type="checkbox" checked={!!newProperty.imovelAlugado} onChange={e => setNewProperty({...newProperty, imovelAlugado: e.target.checked})}
                                          className="rounded border-slate-300 text-amber-500 w-4 h-4 focus:ring-amber-500" />
                                        <span>Imóvel Alugado atualmente?</span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* VALORES LOCAÇÃO */}
                            {(newProperty.purpose === 'Locação' || newProperty.purpose === 'Venda e Locação') && (
                              <div className="md:col-span-2 bg-[#F6F6F4] p-5 rounded-2xl border border-[#EFEFEA] space-y-4 animate-fade-in">
                                <div className="text-[10px] font-black uppercase text-stone-900 tracking-wider">Métrica de Valores: Locação</div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500 font-mono">VALOR ALUGUEL *</label>
                                    <input type="number" placeholder="Ex: 3500" required={newProperty.purpose === 'Locação'}
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold text-amber-600"
                                      value={newProperty.valorAluguel || ''} onChange={e => setNewProperty({...newProperty, valorAluguel: Number(e.target.value)})} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">CONDOMÍNIO (mês)</label>
                                    <input type="number" placeholder="Ex: 450"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold"
                                      value={newProperty.valorCondominio || ''} onChange={e => setNewProperty({...newProperty, valorCondominio: Number(e.target.value)})} />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <label className="text-[8px] font-black uppercase text-slate-500 font-mono">IPTU ANUAL</label>
                                      {Number(newProperty.valorIptuAnual || 0) > 0 && (
                                        <span className="text-[8px] font-black text-amber-600 uppercase font-mono">
                                          Mensal: R$ {Number(newProperty.valorIptuAnual / 12).toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                    <input type="number" placeholder="Ex: 2400"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold"
                                      value={newProperty.valorIptuAnual || ''} onChange={e => setNewProperty({...newProperty, valorIptuAnual: Number(e.target.value), valorIptu: Number(e.target.value)})} />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <label className="text-[8px] font-black uppercase text-slate-500">TX LIXO ANUAL</label>
                                      {Number(newProperty.taxaLixoAnual || 0) > 0 && (
                                        <span className="text-[8px] font-black text-amber-600 uppercase font-mono">
                                          Mensal: R$ {Number(newProperty.taxaLixoAnual / 12).toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                    <input type="number" placeholder="Ex: 120"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono font-bold"
                                      value={newProperty.taxaLixoAnual || ''} onChange={e => setNewProperty({...newProperty, taxaLixoAnual: Number(e.target.value), taxaLixo: Number(e.target.value)})} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">TAXA DE GÁS</label>
                                    <input type="number" placeholder="Ex: 0"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono"
                                      value={newProperty.taxaGas || ''} onChange={e => setNewProperty({...newProperty, taxaGas: Number(e.target.value)})} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">TAXA DE ÁGUA</label>
                                    <input type="number" placeholder="Ex: 0"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono"
                                      value={newProperty.taxaAgua || ''} onChange={e => setNewProperty({...newProperty, taxaAgua: Number(e.target.value)})} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">TAXA DE LUZ</label>
                                    <input type="number" placeholder="Ex: 0"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono"
                                      value={newProperty.taxaLuz || ''} onChange={e => setNewProperty({...newProperty, taxaLuz: Number(e.target.value)})} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">SEGURO INCÊNDIO</label>
                                    <input type="number" placeholder="Ex: 350"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs"
                                      value={newProperty.seguroIncendio || ''} onChange={e => setNewProperty({...newProperty, seguroIncendio: Number(e.target.value)})} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">TAXAS ADICIONAIS</label>
                                    <input type="number" placeholder="Extra"
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs"
                                      value={newProperty.taxasAdicionais || ''} onChange={e => setNewProperty({...newProperty, taxasAdicionais: Number(e.target.value)})} />
                                  </div>

                                  <div className="md:col-span-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                                    <div>
                                      <span className="text-[10px] font-black uppercase text-stone-800 block">Valor Total Mensal Projetado</span>
                                      <span className="text-[8px] text-stone-500 uppercase font-mono">Contendo Aluguel + Condo + IPTU mensal ({Number(newProperty.valorIptuAnual / 12).toFixed(1)}) + Lixo mensal ({Number(newProperty.taxaLixoAnual / 12).toFixed(1)}) + Taxas</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-stone-600 font-mono">R$</span>
                                      <input type="number"
                                        className="bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-sm font-mono font-black text-amber-700 w-32 outline-none focus:ring-1 focus:ring-amber-500"
                                        value={newProperty.valorTotalMensal !== undefined ? Number(newProperty.valorTotalMensal).toFixed(0) : ''} 
                                        onChange={e => setNewProperty({...newProperty, valorTotalMensal: Number(e.target.value)})} />
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200 pt-3">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">Garantia Locatícia</label>
                                    <select className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold"
                                      value={newProperty.garantiaLocaticia || ''} onChange={e => setNewProperty({...newProperty, garantiaLocaticia: e.target.value})}>
                                      <option value="">Selecione...</option>
                                      <option value="Caução">Caução</option>
                                      <option value="Fiador">Fiador</option>
                                      <option value="Seguro Fiança">Seguro Fiança</option>
                                      <option value="Título de Capitalização">Título de Capitalização</option>
                                      <option value="CredPago">CredPago</option>
                                      <option value="Sem garantia">Sem garantia</option>
                                      <option value="A combinar">A combinar</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Permite PET?</label>
                                    <select className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold"
                                      value={newProperty.permitePet || ''} onChange={e => setNewProperty({...newProperty, permitePet: e.target.value})}>
                                      <option value="">Selecione...</option>
                                      <option value="Sim">Sim</option>
                                      <option value="Não">Não</option>
                                      <option value="Sob consulta">Sob consulta</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">Mobiliado?</label>
                                    <select className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold"
                                      value={newProperty.mobiliadoStatus || ''} 
                                      onChange={e => {
                                        const val = e.target.value;
                                        setNewProperty({
                                          ...newProperty,
                                          mobiliadoStatus: val,
                                          mobiliado: val === "Sim" || val === "Semi mobiliado",
                                          eMobiliado: val === "Sim" || val === "Semi mobiliado"
                                        });
                                      }}>
                                      <option value="">Selecione...</option>
                                      <option value="Sim">Sim</option>
                                      <option value="Não">Não</option>
                                      <option value="Semi mobiliado">Semi mobiliado</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">Tempo Mínimo Contrato</label>
                                    <select className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold"
                                      value={newProperty.tempoMinimoContrato || ''} onChange={e => setNewProperty({...newProperty, tempoMinimoContrato: e.target.value})}>
                                      <option value="">Selecione...</option>
                                      <option value="6 meses">6 meses</option>
                                      <option value="12 meses">12 meses</option>
                                      <option value="18 meses">18 meses</option>
                                      <option value="24 meses">24 meses</option>
                                      <option value="30 meses">30 meses</option>
                                      <option value="36 meses">36 meses</option>
                                      <option value="A combinar">A combinar</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Disponível para Visitas?</label>
                                    <select className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold"
                                      value={newProperty.disponivelParaVisita === true ? 'Sim' : newProperty.disponivelParaVisita === false ? 'Não' : ''} 
                                      onChange={e => {
                                        const val = e.target.value;
                                        setNewProperty({
                                          ...newProperty,
                                          disponivelParaVisita: val === "Sim" ? true : val === "Não" ? false : true
                                        });
                                      }}>
                                      <option value="">Selecione...</option>
                                      <option value="Sim">Sim</option>
                                      <option value="Não">Não</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">Status da Locação</label>
                                    <select className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-bold"
                                      value={newProperty.statusLocacao || ''} 
                                      onChange={e => {
                                        const val = e.target.value;
                                        let extra = {};
                                        if (val === 'Alugado') {
                                          extra = {
                                            alugado: true,
                                            disponivelParaVisita: false,
                                            disponivelParaProposta: false
                                          };
                                        }
                                        setNewProperty({
                                          ...newProperty,
                                          statusLocacao: val,
                                          ...extra
                                        });
                                      }}>
                                      <option value="">Selecione...</option>
                                      <option value="Disponível para locação">Disponível para locação</option>
                                      <option value="Alugado">Alugado</option>
                                      <option value="Reservado">Reservado</option>
                                      <option value="Em negociação">Em negociação</option>
                                      <option value="Indisponível">Indisponível</option>
                                    </select>
                                  </div>
                                  <div className="col-span-full space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">Observações da Locação</label>
                                    <textarea placeholder="Insira observações relevantes para locação (Ex: fiador obrigatório na cidade de Sorocaba...)" rows={2}
                                      className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-mono whitespace-pre-wrap"
                                      value={newProperty.observacoesLocacao || ''} onChange={e => setNewProperty({...newProperty, observacoesLocacao: e.target.value})} />
                                  </div>

                                  {newProperty.statusLocacao === 'Alugado' && (
                                    <div className="col-span-full border border-sky-200 bg-sky-50/20 p-5 rounded-2xl md:rounded-3xl mt-4 space-y-4">
                                      <div className="flex justify-between items-center border-b border-sky-100/50 pb-2">
                                        <h4 className="text-xs font-black text-sky-950 uppercase tracking-widest flex items-center gap-1.5">
                                          <ShieldCheck size={14} className="text-sky-600" />
                                          Ficha de Gestão de Locação Ativa
                                        </h4>
                                        <button
                                          type="button"
                                          onClick={clearRentalData}
                                          className="text-[10px] bg-sky-100 hover:bg-sky-200 text-sky-800 font-black px-2.5 py-1 rounded-lg uppercase tracking-wide transition-all"
                                        >
                                          Limpar dados da locação
                                        </button>
                                      </div>

                                      {/* Tenant Information group */}
                                      <div className="space-y-3">
                                        <span className="text-[9px] font-black uppercase text-sky-700 tracking-wider">1. Dados do Locatário</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-500">Nome Completo</label>
                                            <input type="text" placeholder="Ex: João da Silva"
                                              className="w-full bg-white border border-[#EFEFEA] rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                                              value={newProperty.gestaoLocacao?.locatarioNome || ''}
                                              onChange={e => updateGLoc({ locatarioNome: e.target.value })} />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-500">CPF ou CNPJ</label>
                                            <input type="text" placeholder="Ex: 000.000.000-00"
                                              className="w-full bg-white border border-[#EFEFEA] rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                                              value={newProperty.gestaoLocacao?.locatarioCpfCnpj || ''}
                                              onChange={e => updateGLoc({ locatarioCpfCnpj: e.target.value })} />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-500">RG / IE</label>
                                            <input type="text" placeholder="Ex: 00.000.000-0"
                                              className="w-full bg-white border border-[#EFEFEA] rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                                              value={newProperty.gestaoLocacao?.locatarioRgIe || ''}
                                              onChange={e => updateGLoc({ locatarioRgIe: e.target.value })} />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-500">WhatsApp / Telefone</label>
                                            <input type="text" placeholder="Ex: (15) 99999-9999"
                                              className="w-full bg-white border border-[#EFEFEA] rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                                              value={newProperty.gestaoLocacao?.locatarioWhatsapp || ''}
                                              onChange={e => updateGLoc({ locatarioWhatsapp: e.target.value })} />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-500">E-mail</label>
                                            <input type="email" placeholder="Ex: jsilva@email.com"
                                              className="w-full bg-white border border-[#EFEFEA] rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                                              value={newProperty.gestaoLocacao?.locatarioEmail || ''}
                                              onChange={e => updateGLoc({ locatarioEmail: e.target.value })} />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-500">Endereço de Cobrança</label>
                                            <input type="text" placeholder="Ex: Rua das Flores, 123"
                                              className="w-full bg-white border border-[#EFEFEA] rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                                              value={newProperty.gestaoLocacao?.locatarioEndereco || ''}
                                              onChange={e => updateGLoc({ locatarioEndereco: e.target.value })} />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Contract Information group */}
                                      <div className="space-y-3 pt-2">
                                        <span className="text-[9px] font-black uppercase text-sky-700 tracking-wider">2. Condições Contratuais</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-500">Data de Início</label>
                                            <input type="date"
                                              className="w-full bg-white border border-[#EFEFEA] rounded-lg px-2.5 py-1.5 text-xs font-semibold font-mono"
                                              value={newProperty.gestaoLocacao?.dataInicioLocacao || ''}
                                              onChange={e => updateGLoc({ dataInicioLocacao: e.target.value })} />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-500">Data de Término</label>
                                            <input type="date"
                                              className="w-full bg-white border border-[#EFEFEA] rounded-lg px-2.5 py-1.5 text-xs font-semibold font-mono"
                                              value={newProperty.gestaoLocacao?.dataFimLocacao || ''}
                                              onChange={e => updateGLoc({ dataFimLocacao: e.target.value })} />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-500">Valor Aluguel Contratado (R$)</label>
                                            <input type="number" placeholder="Ex: 1500"
                                              className="w-full bg-white border border-[#EFEFEA] rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                                              value={newProperty.gestaoLocacao?.valorAluguelContratado || newProperty.valorAluguel || ''}
                                              onChange={e => updateGLoc({ valorAluguelContratado: Number(e.target.value) })} />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-500">Valor da Caução / Depósito (R$)</label>
                                            <input type="number" placeholder="Ex: 4500"
                                              className="w-full bg-white border border-[#EFEFEA] rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                                              value={newProperty.gestaoLocacao?.valorCaucao || ''}
                                              onChange={e => updateGLoc({ valorCaucao: Number(e.target.value) })} />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-500">Garantia Locatícia</label>
                                            <select className="w-full bg-white border border-[#EFEFEA] rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                                              value={newProperty.gestaoLocacao?.garantiaLocaticia || newProperty.garantiaLocaticia || ''}
                                              onChange={e => updateGLoc({ garantiaLocaticia: e.target.value })}>
                                              <option value="">Selecione...</option>
                                              <option value="Caução">Caução / Depósito</option>
                                              <option value="CredPago">CredPago / Seguro Fiança digital</option>
                                              <option value="Fiador">Fiador tradicional</option>
                                              <option value="Título de Capitalização">Título de Capitalização</option>
                                              <option value="Sem garantia">Sem garantia</option>
                                            </select>
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-500">Dia de Vencimento</label>
                                            <input type="number" placeholder="Ex: 5" min={1} max={31}
                                              className="w-full bg-white border border-[#EFEFEA] rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                                              value={newProperty.gestaoLocacao?.diaVencimentoAluguel || ''}
                                              onChange={e => updateGLoc({ diaVencimentoAluguel: e.target.value })} />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Checkbox Flags group */}
                                      <div className="space-y-3 pt-2">
                                        <span className="text-[9px] font-black uppercase text-sky-700 tracking-wider">3. Parâmetros & Compromissos Administrativos</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/60 p-4 rounded-xl border border-sky-100/30">
                                          <label className="flex items-center space-x-2.5 text-xs font-bold text-[#1E293B] cursor-pointer select-none">
                                            <input type="checkbox"
                                              checked={newProperty.gestaoLocacao?.contratoAtivo !== false}
                                              onChange={e => updateGLoc({ contratoAtivo: e.target.checked })}
                                              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 focus:ring-offset-0" />
                                            <span>Contrato ativo?</span>
                                          </label>
                                          <label className="flex items-center space-x-2.5 text-xs font-bold text-[#1E293B] cursor-pointer select-none">
                                            <input type="checkbox"
                                              checked={newProperty.gestaoLocacao?.locacaoEmDia !== false}
                                              onChange={e => updateGLoc({ locacaoEmDia: e.target.checked })}
                                              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 focus:ring-offset-0" />
                                            <span>Pagamento em dia?</span>
                                          </label>
                                          <label className="flex items-center space-x-2.5 text-xs font-bold text-[#1E293B] cursor-pointer select-none">
                                            <input type="checkbox"
                                              checked={!!newProperty.gestaoLocacao?.permitirVisitaMesmoAlugado}
                                              onChange={e => updateGLoc({ permitirVisitaMesmoAlugado: e.target.checked })}
                                              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 focus:ring-offset-0" />
                                            <span>Permitir visits?</span>
                                          </label>
                                          <label className="flex items-center space-x-2.5 text-xs font-bold text-[#1E293B] cursor-pointer select-none">
                                            <input type="checkbox"
                                              checked={newProperty.gestaoLocacao?.manterDisponivelParaVenda !== false}
                                              onChange={e => updateGLoc({ manterDisponivelParaVenda: e.target.checked })}
                                              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 focus:ring-offset-0" />
                                            <span>Disponível p/ venda?</span>
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      </div>
                    )}

                      {/* 2. LOCALIZAÇÃO */}
                      {editTab === 'localizacao' && (
                        <div className="space-y-5">
                          <div className="border-b border-slate-100 pb-3">
                            <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest border-l-4 border-amber-500 pl-3">Localização do imóvel em Sorocaba/SP</h4>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Defina o logradouro e confere a integridade do endereço na cidade</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* CEP FIELD */}
                            <div className="space-y-1 relative">
                              <label className="text-[9px] font-black uppercase text-stone-600 font-mono flex items-center justify-between">
                                <span>CEP *</span>
                                {loadingCep && <span className="text-[8px] text-amber-600 animate-pulse normal-case font-bold">Buscando endereço...</span>}
                              </label>
                              <input 
                                type="text" 
                                placeholder="Ex: 18000-000" 
                                required
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium font-mono"
                                value={formatarCep(newProperty.cep)} 
                                onChange={handleCepChange} 
                              />
                            </div>

                            {/* ENDEREÇO FIELD */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-stone-600">Endereço (Rua/Avenida/Alameda) *</label>
                              <input 
                                type="text" 
                                placeholder="Ex: Avenida Gisele Constantino" 
                                required
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                value={newProperty.endereco || newProperty.location || ''} 
                                onChange={e => setNewProperty({
                                  ...newProperty, 
                                  endereco: e.target.value, 
                                  location: e.target.value 
                                })} 
                              />
                            </div>

                            {/* NUMERO E COMPLEMENTO */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-stone-600">Número</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: 1850"
                                  className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                  value={newProperty.numero || ''} 
                                  onChange={e => setNewProperty({
                                    ...newProperty, 
                                    numero: e.target.value 
                                  })} 
                                  onBlur={() => {
                                    const enderecoCompleto = montarEnderecoCompletoParaGeo(newProperty);
                                    buscarCoordenadasPorEndereco(enderecoCompleto);
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-stone-600">Complemento (Sala / Apto...)</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: Bloco B - Apto 12"
                                  className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                  value={newProperty.complemento || ''} 
                                  onChange={e => setNewProperty({
                                    ...newProperty, 
                                    complemento: e.target.value 
                                  })} 
                                />
                              </div>
                            </div>

                            {/* BAIRRO */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-stone-600 font-bold">Bairro *</label>
                              <select 
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-bold text-stone-85"
                                value={newProperty.bairro || newProperty.neighborhood || ''} 
                                onChange={e => setNewProperty({
                                  ...newProperty, 
                                  bairro: e.target.value, 
                                  neighborhood: e.target.value 
                                })}
                              >
                                <option value="">Selecione o Bairro...</option>
                                {FALLBACK_BAIRROS.map(b => (
                                  <option key={b.id} value={b.nome}>{b.nome}</option>
                                ))}
                                {optBairros.map(b => (
                                  <option key={b.id} value={b.nome}>{b.nome}</option>
                                ))}
                                {newProperty.bairro && !FALLBACK_BAIRROS.some(b => b.nome === newProperty.bairro) && !optBairros.some(b => b.nome === newProperty.bairro) && (
                                  <option value={newProperty.bairro}>{newProperty.bairro}</option>
                                )}
                              </select>
                            </div>

                            {/* CIDADE E ESTADO */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-stone-600">Cidade *</label>
                                <select 
                                  className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-bold text-stone-85"
                                  value={newProperty.cidade || newProperty.city || 'Sorocaba'} 
                                  onChange={e => setNewProperty({
                                    ...newProperty, 
                                    cidade: e.target.value, 
                                    city: e.target.value 
                                  })}
                                >
                                  {FALLBACK_CIDADES.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                                  {optCidades.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                                  {newProperty.cidade && !FALLBACK_CIDADES.some(c => c.nome === newProperty.cidade) && !optCidades.some(c => c.nome === newProperty.cidade) && (
                                    <option value={newProperty.cidade}>{newProperty.cidade}</option>
                                  )}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-stone-600">Estado *</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: SP" 
                                  required
                                  className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                                  value={newProperty.estado || newProperty.state || 'SP'} 
                                  onChange={e => setNewProperty({
                                    ...newProperty, 
                                    estado: e.target.value, 
                                    state: e.target.value 
                                  })} 
                                />
                              </div>
                            </div>

                            {/* REFERENCIA */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-stone-600">Referência *</label>
                              <input 
                                type="text" 
                                placeholder="Ex: CSO9988" 
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                value={newProperty.referencia || ''} 
                                onChange={e => setNewProperty({
                                  ...newProperty, 
                                  referencia: e.target.value 
                                })} 
                              />
                            </div>

                            {/* LANDSCAPE / COORDINATES OF GEOLOCATION */}
                            <div className="space-y-1 md:col-span-2 bg-[#F6F6F4] p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-[9px] font-black uppercase text-stone-600">Coordenadas de Geolocalização (Lat, Lng)</label>
                                {loadingGeo && <span className="text-[8px] text-amber-600 animate-pulse font-bold">Buscando coordenadas...</span>}
                              </div>
                              <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex gap-2 flex-grow">
                                  <input 
                                    type="number" 
                                    step="any" 
                                    placeholder="Latitude"
                                    className="w-1/2 bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium font-mono"
                                    value={newProperty.latitude || (newProperty.coords?.[0] !== undefined ? String(newProperty.coords[0]) : '')} 
                                    onChange={e => {
                                      const latVal = e.target.value;
                                      const lngVal = newProperty.longitude || (newProperty.coords?.[1] !== undefined ? String(newProperty.coords[1]) : '-47.4581');
                                      setNewProperty({
                                        ...newProperty, 
                                        latitude: latVal, 
                                        coords: [Number(latVal) || -23.5018, Number(lngVal) || -47.4581]
                                      });
                                    }} 
                                  />
                                  <input 
                                    type="number" 
                                    step="any" 
                                    placeholder="Longitude"
                                    className="w-1/2 bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium font-mono"
                                    value={newProperty.longitude || (newProperty.coords?.[1] !== undefined ? String(newProperty.coords[1]) : '')} 
                                    onChange={e => {
                                      const latVal = newProperty.latitude || (newProperty.coords?.[0] !== undefined ? String(newProperty.coords[0]) : '-23.5018');
                                      const lngVal = e.target.value;
                                      setNewProperty({
                                        ...newProperty, 
                                        longitude: lngVal, 
                                        coords: [Number(latVal) || -23.5018, Number(lngVal) || -47.4581]
                                      });
                                    }} 
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const enderecoCompleto = montarEnderecoCompletoParaGeo(newProperty);
                                    buscarCoordenadasPorEndereco(enderecoCompleto);
                                  }}
                                  className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold uppercase text-[9px] tracking-wider px-4 py-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-1 shrink-0"
                                >
                                  Buscar coordenadas
                                </button>
                              </div>
                              <p className="text-[9px] text-slate-400 mt-2 uppercase font-semibold">
                                O preenchimento é automático, mas permite ajuste manual se desejar.
                              </p>
                            </div>

                          </div>
                        </div>
                      )}

                      {/* 3. PROPRIETÁRIO */}
                      {editTab === 'proprietario' && (
                        <div className="space-y-5">
                          <div className="border-b border-slate-100 pb-3">
                            <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest border-l-4 border-amber-500 pl-3">Atribuição e Dados do Proprietário</h4>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Vínculo jurídico e cadastral do proprietário da ficha técnica</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-stone-600">Nome Completo do Proprietário Principal *</label>
                              <input type="text" placeholder="Ex: Luiz Sepúlveda Uehara" required
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                value={newProperty.nomeProprietario || ''} onChange={e => setNewProperty({...newProperty, nomeProprietario: e.target.value})} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-stone-600">CPF / CNPJ</label>
                                <input type="text" placeholder="Ex: 123.456.789-00"
                                  className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                  value={newProperty.cpfCnpjProprietario || ''} onChange={e => setNewProperty({...newProperty, cpfCnpjProprietario: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-stone-600">RG / I.E.</label>
                                <input type="text" placeholder="Ex: 12.345.678-X"
                                  className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                  value={newProperty.rgIeProprietario || ''} onChange={e => setNewProperty({...newProperty, rgIeProprietario: e.target.value})} />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-stone-600">Telefone Fixo</label>
                                <input type="text" placeholder="(15) 3211-1234"
                                  className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                  value={newProperty.telefoneProprietario || ''} onChange={e => setNewProperty({...newProperty, telefoneProprietario: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-stone-600">Celular / WhatsApp *</label>
                                <input type="text" placeholder="(15) 99123-4567" required
                                  className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                  value={newProperty.whatsappProprietario || ''} onChange={e => setNewProperty({...newProperty, whatsappProprietario: e.target.value})} />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-stone-600">Endereço de E-mail para Contato *</label>
                              <input type="email" placeholder="nome@provedor.com" required
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                value={newProperty.emailProprietarioForm || ''} onChange={e => setNewProperty({...newProperty, emailProprietarioForm: e.target.value})} />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[9px] font-black uppercase text-stone-600">Endereço de Correspondência</label>
                              <input type="text" placeholder="Ex: Av Gisele Constantino, 1000 - Apto 32"
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                value={newProperty.enderecoProprietario || ''} onChange={e => setNewProperty({...newProperty, enderecoProprietario: e.target.value})} />
                            </div>

                            <div className="grid grid-cols-3 gap-3 md:col-span-2">
                              <div className="col-span-2 space-y-1 font-bold">
                                <label className="text-[9px] font-black uppercase text-stone-600">Cidade Residência</label>
                                <input type="text" className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                                  value={newProperty.cidadeProprietario || 'Sorocaba'} onChange={e => setNewProperty({...newProperty, cidadeProprietario: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-stone-600">Estado Civil / Conjuge</label>
                                <div className="pt-2 flex items-center justify-center">
                                  <label className="flex items-center space-x-2 text-xs font-bold text-stone-700 cursor-pointer select-none">
                                    <input type="checkbox" checked={!!newProperty.possuiConjuge} onChange={e => setNewProperty({...newProperty, possuiConjuge: e.target.checked})}
                                      className="rounded border-slate-300 text-amber-500 w-4 h-4 focus:ring-amber-500" />
                                    <span>Vincular Cônjuge?</span>
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* SPOUSE OR CO-OWNER FORM SUB-BLOCK */}
                            {newProperty.possuiConjuge && (
                              <div className="md:col-span-2 bg-[#F6F6F4] p-5 rounded-3xl border border-dashed border-amber-300 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                <div className="md:col-span-2 border-b border-slate-200 pb-1.5 flex justify-between items-center">
                                  <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest border-s-4 border-amber-500 ps-2">Informações Cadastrais do Cônjuge</span>
                                  <span className="text-[8px] font-semibold text-amber-600 uppercase tracking-wider font-mono">Regime de Bens unificado</span>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase text-slate-500">Nome do Cônjuge</label>
                                  <input type="text" className="w-full bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-xs"
                                    value={newProperty.nomeConjuge || ''} onChange={e => setNewProperty({...newProperty, nomeConjuge: e.target.value})} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">CPF</label>
                                    <input type="text" className="w-full bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-xs"
                                      value={newProperty.cpfConjuge || ''} onChange={e => setNewProperty({...newProperty, cpfConjuge: e.target.value})} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">RG</label>
                                    <input type="text" className="w-full bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-xs"
                                      value={newProperty.rgConjuge || ''} onChange={e => setNewProperty({...newProperty, rgConjuge: e.target.value})} />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">Profissão</label>
                                    <input type="text" className="w-full bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-xs"
                                      value={newProperty.profissaoConjuge || ''} onChange={e => setNewProperty({...newProperty, profissaoConjuge: e.target.value})} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">Estado Civil</label>
                                    <select className="w-full bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-xs font-bold"
                                      value={newProperty.estadoCivilConjuge || 'Casado(a)'} onChange={e => setNewProperty({...newProperty, estadoCivilConjuge: e.target.value})}>
                                      <option value="Casado(a)">Casado(a)</option>
                                      <option value="União Estável">União Estável</option>
                                      <option value="Divorciado(a)">Divorciado(a)</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">Celular / WhatsApp</label>
                                    <input type="text" className="w-full bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-xs"
                                      value={newProperty.telefoneConjuge || ''} onChange={e => setNewProperty({...newProperty, telefoneConjuge: e.target.value})} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500">E-mail</label>
                                    <input type="email" className="w-full bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-xs"
                                      value={newProperty.emailConjuge || ''} onChange={e => setNewProperty({...newProperty, emailConjuge: e.target.value})} />
                                  </div>
                                </div>

                                <div className="md:col-span-2 space-y-1">
                                  <label className="text-[8px] font-black uppercase text-slate-500">Endereço Residencial do Cônjuge</label>
                                  <input type="text" className="w-full bg-white border border-[#EFEFEA] rounded-xl px-3 py-2 text-xs"
                                    value={newProperty.enderecoConjuge || ''} onChange={e => setNewProperty({...newProperty, enderecoConjuge: e.target.value})} />
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      )}

                      {/* 4. CARACTERÍSTICAS */}
                      {editTab === 'caracteristicas' && (
                        <div className="space-y-5 animate-fade-in">
                          <OptionsChecklist
                            titulo="Características Construtivas & Diferenciais"
                            descricao="Atributos internos, orientações de sol e recursos do lote"
                            categoria="caracteristicas"
                            opcoes={opcoesCaracteristicas}
                            valores={newProperty.caracteristicas || []}
                            onChange={handleToggleOpcao}
                            onQuantidadeChange={handleQuantidadeOpcao}
                            searchPlaceholder="Pesquisar características..."
                          />

                          {String(newProperty.type || newProperty.propertyType || "").toLowerCase().includes("apartamento") && (
                            <OptionsChecklist
                              titulo="Características do Apartamento"
                              descricao="Itens e recursos específicos para unidades de apartamento"
                              categoria="caracteristicasApartamento"
                              opcoes={opcoesCaracteristicasApartamento}
                              valores={newProperty.caracteristicasApartamento || []}
                              onChange={handleToggleOpcao}
                              onQuantidadeChange={handleQuantidadeOpcao}
                              searchPlaceholder="Pesquisar características do apartamento..."
                            />
                          )}
                        </div>
                      )}

                      {/* 5. AMBIENTES */}
                      {editTab === 'ambientes' && (
                        <div className="space-y-5 animate-fade-in">
                          <OptionsChecklist
                            titulo="Divisórias e Ambientes"
                            descricao="Indique quais os cômodos e suas respectivas quantidades"
                            categoria="ambientes"
                            opcoes={opcoesAmbientes}
                            valores={newProperty.ambientes || []}
                            onChange={handleToggleOpcao}
                            onQuantidadeChange={handleQuantidadeOpcao}
                            searchPlaceholder="Pesquisar ambientes..."
                          />
                        </div>
                      )}

                      {/* 6. PROXIMIDADES */}
                      {editTab === 'proximidades' && (
                        <div className="space-y-5 animate-fade-in">
                          <OptionsChecklist
                            titulo="Serviços, Vias rápidas e Shoppings a poucos minutos"
                            descricao="Pontos de interesse específicos em Sorocaba/SP (sem praias)"
                            categoria="proximidades"
                            opcoes={opcoesProximidades}
                            valores={newProperty.proximidades || []}
                            onChange={handleToggleOpcao}
                            onQuantidadeChange={handleQuantidadeOpcao}
                            searchPlaceholder="Pesquisar proximidades..."
                          />
                        </div>
                      )}

                      {/* 7. INSTALAÇÃO */}
                      {editTab === 'instalacao' && (
                        <div className="space-y-5 animate-fade-in">
                          <OptionsChecklist
                            titulo="Sistemas e Infraestruturas Instaladas"
                            descricao="Estruturas básicas integradas ao imóvel como gás, ar e tecnologia"
                            categoria="instalacoes"
                            opcoes={opcoesInstalacoes}
                            valores={newProperty.instalacoes || []}
                            onChange={handleToggleOpcao}
                            onQuantidadeChange={handleQuantidadeOpcao}
                            searchPlaceholder="Pesquisar instalações..."
                          />
                        </div>
                      )}

                      {/* 8. ACABAMENTO */}
                      {editTab === 'acabamento' && (
                        <div className="space-y-5 animate-fade-in">
                          <OptionsChecklist
                            titulo="Revestimentos e Acabamentos Empregados"
                            descricao="Tratamento de pisos, luminárias, louças, metais e rebaixos"
                            categoria="acabamentos"
                            opcoes={opcoesAcabamentos}
                            valores={newProperty.acabamentos || []}
                            onChange={handleToggleOpcao}
                            onQuantidadeChange={handleQuantidadeOpcao}
                            searchPlaceholder="Pesquisar acabamentos..."
                          />
                        </div>
                      )}

                      {/* 9. LAZER & CONDOMÍNIO */}
                      {editTab === 'lazer' && (
                        <div className="space-y-5 animate-fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                            <OptionsChecklist
                              titulo="Lazer e Convivência Coletivos"
                              descricao="Equipamentos esportivos e áreas de convivência coletivas"
                              categoria="lazer"
                              opcoes={opcoesLazer}
                              valores={newProperty.lazer || []}
                              onChange={handleToggleOpcao}
                              onQuantidadeChange={handleQuantidadeOpcao}
                              searchPlaceholder="Pesquisar itens de lazer..."
                            />
                            <OptionsChecklist
                              titulo="Diferenciais do Empreendimento"
                              descricao="Itens do condomínio, portarias e segurança"
                              categoria="caracteristicasEmpreendimento"
                              opcoes={opcoesCaracteristicasEmpreendimento}
                              valores={newProperty.caracteristicasEmpreendimento || []}
                              onChange={handleToggleOpcao}
                              onQuantidadeChange={handleQuantidadeOpcao}
                              searchPlaceholder="Pesquisar itens de condomínio..."
                            />
                          </div>
                        </div>
                      )}

                      {/* 10. IMAGENS */}
                      {editTab === 'imagens' && (
                        <div className="space-y-6">
                          <div className="border-b border-slate-100 pb-3">
                            <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest border-l-4 border-amber-500 pl-3">Mídia Fotográfica do Imóvel</h4>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Faça o upload de fotos para o Cloudinary ou configure a galeria de imagens</p>
                          </div>

                          {/* Cloudinary Upload Zone */}
                          <div className="border-2 border-dashed border-slate-200 hover:border-amber-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-amber-50/5 transition-all relative group shadow-sm">
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*" 
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                              onChange={(e) => {
                                if (e.target.files) handleImagesUpload(e.target.files);
                              }}
                            />
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <div className="p-4 bg-white border border-slate-150 group-hover:bg-amber-50 rounded-2xl text-slate-450 group-hover:text-amber-500 transition-colors shadow-sm">
                                <Upload size={22} className="group-hover:scale-110 transition-transform" />
                              </div>
                              <p className="text-xs font-black text-stone-850">
                                Arraste múltiplas fotos aqui ou clique para selecionar
                              </p>
                              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                Formatos suportados: JPG, PNG, WEBP (Apenas arquivos de imagem)
                              </p>
                            </div>
                          </div>

                          {/* Loading Status */}
                          {uploadingImages && (
                            <div className="flex items-center gap-2.5 p-4 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-xs font-bold animate-pulse">
                              <Loader2 size={16} className="animate-spin text-amber-500" />
                              <span>Enviando fotos e gerando links com Cloudinary... Por favor, aguarde.</span>
                            </div>
                          )}

                          {/* Error Status */}
                          {uploadError && (
                            <div className="p-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold">
                              {uploadError}
                            </div>
                          )}

                          {/* Cloudinary Gallery Visualizer */}
                          <div className="border-t border-slate-100 pt-5">
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-[10px] font-black text-stone-900 uppercase tracking-widest border-l-4 border-stone-800 pl-2">
                                Fotos Cadastradas ({(newProperty.fotos || []).length})
                              </div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Arraste para reordenar ou use as setas</p>
                            </div>

                            {(newProperty.fotos || []).length === 0 ? (
                              <div className="p-8 border border-dashed border-slate-150 rounded-xl text-center text-slate-400 text-xs font-bold">
                                Nenhuma foto enviada para o imóvel. Use a área acima ou adicione links manuais abaixo.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {(newProperty.fotos || []).map((foto: any, idx: number) => {
                                  const isMain = foto.secureUrl === newProperty.fotoPrincipal || foto.url === newProperty.fotoPrincipal || idx === 0;
                                  return (
                                    <div key={idx} className={`border rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col group transition-all duration-300 relative ${isMain ? 'ring-2 ring-amber-500 border-amber-500' : 'border-slate-100 hover:border-slate-300 hover:shadow-md'}`}>
                                      {/* Thumbnail Preview wrapper */}
                                      <div className="aspect-video relative overflow-hidden bg-slate-50 border-b border-slate-100">
                                        <img src={foto.secureUrl || foto.url} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" referrerPolicy="no-referrer" />
                                        
                                        {/* Main Badge / Ordem Badge */}
                                        <div className="absolute top-2 left-2 flex gap-1.5 items-center">
                                          <span className="bg-stone-900/80 text-[8px] text-white font-mono font-black tracking-widest px-1.5 py-0.5 rounded-md">
                                            #{idx + 1}
                                          </span>
                                          {isMain && (
                                            <span className="bg-amber-500 text-[8px] text-white font-black tracking-widest px-2 py-0.5 rounded-md uppercase flex items-center gap-1 shadow-xs">
                                              ★ Principal
                                            </span>
                                          )}
                                        </div>

                                        {/* Hover Overlay Controls */}
                                        <div className="absolute top-2 right-2 flex gap-1.5">
                                          <button type="button" onClick={() => handleRemoveFoto(idx)} className="p-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg transition-colors shadow-sm" title="Remover Imagem">
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Photo Detail & Order bar */}
                                      <div className="p-3.5 flex flex-col justify-between flex-1 space-y-3">
                                        <div className="text-[9.5px] text-slate-500 font-semibold font-mono truncate max-w-full" title={foto.originalFilename || "Link Externo"}>
                                          {foto.originalFilename || "imagem_imovel.jpg"}
                                        </div>

                                        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-50">
                                          {/* Set main button */}
                                          {!isMain ? (
                                            <button type="button" onClick={() => handleSetPrincipalFoto(idx)} className="text-[9px] font-black uppercase text-amber-500 hover:text-amber-600 tracking-wider hover:underline transition-colors">
                                              Definir Principal
                                            </button>
                                          ) : (
                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                              Seleção Principal
                                            </span>
                                          )}

                                          {/* Reorder actions */}
                                          <div className="flex gap-1.5">
                                            <button type="button" disabled={idx === 0} onClick={() => handleMoveFoto(idx, 'up')} className={`p-1.5 rounded-md border text-slate-400 hover:bg-slate-50 transition-colors ${idx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-stone-800 hover:border-slate-300'}`} title="Mover para cima">
                                              <ArrowUp size={11} />
                                            </button>
                                            <button type="button" disabled={idx === (newProperty.fotos || []).length - 1} onClick={() => handleMoveFoto(idx, 'down')} className={`p-1.5 rounded-md border text-slate-400 hover:bg-slate-50 transition-colors ${idx === (newProperty.fotos || []).length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-stone-800 hover:border-slate-300'}`} title="Mover para baixo">
                                              <ArrowDown size={11} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Fallback & Advanced Manual URLs Inputs */}
                          <div className="border-t border-slate-100 pt-5 mt-4">
                            <details className="cursor-pointer group">
                              <summary className="text-[10px] font-black text-stone-600 uppercase tracking-widest select-none outline-none hover:text-amber-500 transition-colors">
                                🔗 Configurações Avançadas de Links Manuais
                              </summary>
                              <div className="space-y-4 mt-4 cursor-default pl-1">
                                <p className="text-[10px] text-slate-400 uppercase font-semibold">Se preferir, insira ou ajuste os links absolutos das imagens diretamente abaixo:</p>
                                
                                {imageUrls.map((url, idx) => (
                                  <div key={idx} className="flex gap-2.5 items-center">
                                    <span className="text-[9px] font-mono font-black text-slate-450 bg-[#F6F6F4] border border-[#EFEFEA] px-2 py-1 rounded w-8 text-center shrink-0">
                                      #{idx + 1}
                                    </span>
                                    <input type="text" placeholder={`Adicione o link absoluto da foto #${idx + 1} (Ex: https://images.unsplash.com/...)`}
                                      className="flex-1 bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-mono text-zinc-650"
                                      value={url} onChange={e => {
                                        updateImageUrl(idx, e.target.value);
                                        // Dynamically build/update property.fotos array on manual tweaks
                                        const nextUrls = [...imageUrls];
                                        nextUrls[idx] = e.target.value;
                                        const cleanUrls = nextUrls.filter(u => u.trim() !== '');
                                        const nextFotos = cleanUrls.map((u, i) => {
                                          const existing = (newProperty.fotos || [])[i];
                                          return {
                                            url: u,
                                            secureUrl: u,
                                            publicId: existing?.publicId || '',
                                            originalFilename: existing?.originalFilename || u.split('/').pop() || '',
                                            ordem: i
                                          };
                                        });
                                        setNewProperty(prev => ({
                                          ...prev,
                                          fotos: nextFotos,
                                          fotoPrincipal: nextFotos[0]?.secureUrl || '',
                                          image: nextFotos[0]?.secureUrl || '',
                                          additionalImages: nextFotos.slice(1).map(f => f.secureUrl || '')
                                        }));
                                      }} />
                                    <button type="button" onClick={() => {
                                      removeImageUrlField(idx);
                                      const nextUrls = imageUrls.filter((_, i) => i !== idx);
                                      const cleanUrls = nextUrls.filter(u => u.trim() !== '');
                                      const nextFotos = cleanUrls.map((u, i) => {
                                        const existing = (newProperty.fotos || [])[i];
                                        return {
                                          url: u,
                                          secureUrl: u,
                                          publicId: existing?.publicId || '',
                                          originalFilename: existing?.originalFilename || u.split('/').pop() || '',
                                          ordem: i
                                        };
                                      });
                                      setNewProperty(prev => ({
                                        ...prev,
                                        fotos: nextFotos,
                                        fotoPrincipal: nextFotos[0]?.secureUrl || '',
                                        image: nextFotos[0]?.secureUrl || '',
                                        additionalImages: nextFotos.slice(1).map(f => f.secureUrl || '')
                                      }));
                                    }} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors">
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                ))}
                                
                                <button type="button" onClick={() => {
                                  addImageUrlField();
                                  setImageUrls([...imageUrls, '']);
                                }} className="text-xs font-black text-amber-500 hover:underline uppercase tracking-wide flex items-center gap-1 mt-3">
                                  <Plus size={14} className="text-amber-500" />
                                  Inserir Outro Link de Imagem
                                </button>
                              </div>
                            </details>
                          </div>

                        </div>
                      )}

                      {/* 11. VÍDEOS */}
                      {editTab === 'videos' && (
                        <div className="space-y-5">
                          <div className="border-b border-slate-100 pb-3">
                            <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest border-l-4 border-amber-500 pl-3">Vídeo Tour ou Drone</h4>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Links do YouTube, Vimeo ou mp4 direto de alta resolução</p>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-stone-600 font-mono">URL do Vídeo</label>
                              <input type="text" placeholder="Ex: https://www.youtube.com/watch?v=ABC123XYZ"
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3.5 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                                value={newProperty.videoUrl || ''} onChange={e => setNewProperty({...newProperty, videoUrl: e.target.value})} />
                            </div>
                            <p className="text-[9px] text-slate-400 leading-normal uppercase font-semibold">
                              O tour em vídeo aumenta em até 83% o engajamento de leads qualificados no portal imobiliário RB Sorocaba.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 12. PUBLICAÇÃO (FOCADO APENAS NO ANÚNCIO DO SITE DO IMÓVEL COM ASSISTENTE GEMINI) */}
                      {editTab === 'publicacao' && (
                        <div className="space-y-6 animate-fade-in">
                          <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
                            <div>
                              <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest border-l-4 border-amber-500 pl-3">Anúncio do Site & SEO</h4>
                              <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Crie a apresentação perfeita para o portal da RB Sorocaba</p>
                            </div>
                          </div>

                          {/* ASSISTENTE DE IA GEMINI */}
                          <div className="bg-stone-950 p-6 rounded-3xl border border-stone-800 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 text-amber-500 select-none pointer-events-none">
                              <Sparkles size={120} />
                            </div>

                            <div className="relative z-10 space-y-4">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-amber-500 rounded-lg text-stone-950">
                                  <Sparkles size={16} />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black uppercase text-white tracking-widest">Assistente de Redação com Inteligência Artificial</h4>
                                  <p className="text-[9px] text-slate-400 uppercase font-bold">Desenvolvido com Google Gemini API v3.5-Flash</p>
                                </div>
                              </div>

                              <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                                Nosso assistente analisa todas as características inseridas (bairro, ambientes, características construtivas, preços) e redige anúncios perfeitamente otimizados, incluindo títulos que engajam, copies para posts de Instagram, abordagens de WhatsApp e metatags profissionais para rankear no Google.
                              </p>

                              {/* AI SUCCESS & ERROR ALERTS */}
                              {iaSuccessMessage && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-semibold animate-pulse">
                                  ✓ {iaSuccessMessage}
                                </div>
                              )}
                              {iaErrorMessage && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                                  ✗ Erro: {iaErrorMessage}
                                </div>
                              )}

                              <div className="flex gap-3 flex-wrap pt-2">
                                <button
                                  type="button"
                                  disabled={isGeneratingIA || isImprovingIA}
                                  onClick={handleGeminiGenerate}
                                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                                >
                                  {isGeneratingIA ? (
                                    <>
                                      <Loader2 size={13} className="animate-spin text-stone-950" />
                                      Gerando Redações...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles size={12} />
                                      Gerar Textos Completos via IA
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  disabled={isGeneratingIA || isImprovingIA}
                                  onClick={handleGeminiImprove}
                                  className="px-4 py-2.5 bg-white hover:bg-slate-100 disabled:bg-stone-800 disabled:text-stone-500 text-stone-900 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200 shrink-0 cursor-pointer"
                                >
                                  {isImprovingIA ? (
                                    <>
                                      <Loader2 size={13} className="animate-spin text-stone-950" />
                                      Refinando Descrição...
                                    </>
                                  ) : (
                                    <>
                                      Refinar Descrição com IA
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* CORRETOR RESPONSÁVEL */}
                          <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                              <User size={16} className="text-amber-500" />
                              <span className="text-[10px] font-black uppercase text-stone-900 tracking-wider">Corretor Responsável pelo Imóvel</span>
                            </div>

                            <div className="space-y-3">
                              <label className="text-[9px] font-black uppercase text-stone-600 block">Selecione o Corretor Responsável</label>
                              <select
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                                value={newProperty.corretorId || ''}
                                onChange={(e) => {
                                  const brokerId = e.target.value;
                                  if (!brokerId) {
                                    setNewProperty({
                                      ...newProperty,
                                      corretorId: "",
                                      corretorNome: "",
                                      corretorTelefone: "",
                                      corretorWhatsapp: "",
                                      corretorEmail: "",
                                      corretorCreci: "",
                                      corretorFoto: ""
                                    });
                                  } else {
                                    const selectedBroker = brokersList.find((b: any) => b.id === brokerId);
                                    if (selectedBroker) {
                                      setNewProperty({
                                        ...newProperty,
                                        corretorId: selectedBroker.id || "",
                                        corretorNome: selectedBroker.nome || "",
                                        corretorTelefone: selectedBroker.telefone || "",
                                        corretorWhatsapp: selectedBroker.whatsapp || selectedBroker.whatsApp || selectedBroker.telefone || "",
                                        corretorEmail: selectedBroker.email || "",
                                        corretorCreci: selectedBroker.creci || "",
                                        corretorFoto: selectedBroker.fotoUrl || selectedBroker.foto || ""
                                      });
                                    }
                                  }
                                }}
                              >
                                <option value="">Nenhum - Atendimento RB Sorocaba (Padrão)</option>
                                {brokersList
                                  .filter((b: any) => b.ativo !== false)
                                  .sort((a: any, b: any) => (a.nome || '').localeCompare(b.nome || ''))
                                  .map((broker: any) => (
                                    <option key={broker.id} value={broker.id}>
                                      {broker.nome} {broker.creci ? `(${broker.creci})` : ''}
                                    </option>
                                  ))}
                              </select>

                              {newProperty.corretorId && (
                                <div className="flex items-center gap-4 p-3 bg-[#F6F6F4] rounded-xl border border-[#EFEFEA]">
                                  {(newProperty.corretorFoto || newProperty.corretorFotoUrl) ? (
                                    <img 
                                      src={newProperty.corretorFoto || newProperty.corretorFotoUrl} 
                                      alt={newProperty.corretorNome} 
                                      className="w-12 h-12 rounded-full object-cover border border-amber-500/20"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 text-sm font-black">
                                      {(newProperty.corretorNome || 'C').substring(0, 1)}
                                    </div>
                                  )}
                                  <div className="text-xs">
                                    <p className="font-extrabold text-stone-900">{newProperty.corretorNome}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                                      {newProperty.corretorCreci ? `CRECI: ${newProperty.corretorCreci}` : 'CRECI não cadastrado'}
                                    </p>
                                    <div className="text-[9px] text-[#7A7F8C] font-semibold mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                      {newProperty.corretorTelefone && <span>📞 {newProperty.corretorTelefone}</span>}
                                      {newProperty.corretorWhatsapp && <span>💬 {newProperty.corretorWhatsapp}</span>}
                                      {newProperty.corretorEmail && <span>✉️ {newProperty.corretorEmail}</span>}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* CAMPOS DO ANÚNCIO (VISUAL PREMIUM E ORGANIZADO) */}
                          <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-5 shadow-xs">
                            <span className="text-[10px] font-black uppercase text-stone-900 tracking-wider block border-b border-slate-100 pb-2">Conteúdo do Website</span>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-bold">
                              <div className="space-y-1 col-span-2">
                                <label className="text-[9px] font-black uppercase text-stone-600">Título do Anúncio *</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: Espetacular Casa Térrea com 3 Suítes no Campolim" 
                                  required
                                  className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-bold text-stone-900"
                                  value={newProperty.tituloAnuncio || ''} 
                                  onChange={e => setNewProperty({...newProperty, tituloAnuncio: e.target.value, title: e.target.value})} 
                                />
                              </div>

                              <div className="space-y-1 col-span-2">
                                <label className="text-[9px] font-black uppercase text-stone-600">Subtítulo ou Chamada Curta</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: Alto padrão, acabamento refinado e localização nobre" 
                                  className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium text-stone-850"
                                  value={newProperty.subtituloAnuncio || ''} 
                                  onChange={e => setNewProperty({...newProperty, subtituloAnuncio: e.target.value})} 
                                />
                              </div>

                              <div className="md:col-span-2 space-y-1">
                                <label className="text-[9px] font-black uppercase text-stone-600">Descrição Curta (Cards e Listagem)</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: Excelente oportunidade residencial no campolim, contendo amplas suítes, piscina e área gourmet completa..." 
                                  className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium text-stone-800"
                                  value={newProperty.descricaoCurta || ''} 
                                  onChange={e => setNewProperty({...newProperty, descricaoCurta: e.target.value, shortDescription: e.target.value})} 
                                />
                              </div>

                              <div className="md:col-span-2 space-y-1">
                                <div className="flex justify-between items-center">
                                  <label className="text-[9px] font-black uppercase text-stone-600">Descrição Detalhada do Imóvel</label>
                                  <div className="text-[9px] text-slate-400 font-mono font-medium">
                                    {(newProperty.descricaoDetalhada || '').length} caracteres • {(newProperty.descricaoDetalhada || '').trim().split(/\s+/).filter(Boolean).length} palavras
                                  </div>
                                </div>
                                <textarea 
                                  rows={8}
                                  placeholder="Escreva a descrição completa do seu imóvel. Destaque acabamentos, cômodos, insolação, segurança e facilidades próximas." 
                                  className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium text-stone-800 font-sans whitespace-pre-wrap leading-relaxed"
                                  value={newProperty.descricaoDetalhada || newProperty.description || newProperty.descricao || ''} 
                                  onChange={e => setNewProperty({...newProperty, descricaoDetalhada: e.target.value, description: e.target.value})} 
                                />
                              </div>

                              <div className="md:col-span-2 space-y-1">
                                <label className="text-[9px] font-black uppercase text-stone-600">Diferenciais em Destaque (Um por linha)</label>
                                <textarea 
                                  rows={4}
                                  placeholder="- Localização privilegiada no Campolim&#10;- Acabamento em Porcelanato Portinari&#10;- Piscina com aquecimento solar" 
                                  className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-mono text-stone-800 whitespace-pre-wrap leading-relaxed font-semibold"
                                  value={newProperty.diferenciaisAnuncio || ''} 
                                  onChange={e => setNewProperty({...newProperty, diferenciaisAnuncio: e.target.value})} 
                                />
                              </div>
                            </div>
                          </div>

                          {/* RECURSOS DE DIVULGAÇÃO SOCIAL */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3 shadow-xs">
                              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black uppercase text-stone-900 tracking-wider">Texto para WhatsApp</span>
                                <button
                                  type="button"
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 text-[8px] font-black uppercase tracking-wider rounded-md transition-all flex items-center gap-1 cursor-pointer"
                                  onClick={() => {
                                    navigator.clipboard.writeText(newProperty.textoWhatsapp || '');
                                    setCopiedWhatsapp(true);
                                    setTimeout(() => setCopiedWhatsapp(false), 2000);
                                  }}
                                >
                                  {copiedWhatsapp ? 'Copiado!' : (
                                    <>
                                      <Copy size={10} />
                                      Copiar Texto
                                    </>
                                  )}
                                </button>
                              </div>
                              <textarea
                                rows={6}
                                placeholder="Texto dinâmico pronto para envio rápido via WhatsApp..."
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-mono text-emerald-800 leading-relaxed whitespace-pre-wrap"
                                value={newProperty.textoWhatsapp || ''}
                                onChange={e => setNewProperty({...newProperty, textoWhatsapp: e.target.value})}
                              />
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3 shadow-xs">
                              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black uppercase text-stone-900 tracking-wider">Legenda Instagram / Redes Sociais</span>
                                <button
                                  type="button"
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 text-[8px] font-black uppercase tracking-wider rounded-md transition-all flex items-center gap-1 cursor-pointer"
                                  onClick={() => {
                                    navigator.clipboard.writeText(newProperty.textoInstagram || '');
                                    setCopiedInstagram(true);
                                    setTimeout(() => setCopiedInstagram(false), 2000);
                                  }}
                                >
                                  {copiedInstagram ? 'Copiado!' : (
                                    <>
                                      <Copy size={10} />
                                      Copiar Legenda
                                    </>
                                  )}
                                </button>
                              </div>
                              <textarea
                                rows={6}
                                placeholder="Legenda com hashtags e apelo visual para atrair leads no Instagram..."
                                className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-mono text-pink-800 leading-relaxed whitespace-pre-wrap"
                                value={newProperty.textoInstagram || ''}
                                onChange={e => setNewProperty({...newProperty, textoInstagram: e.target.value})}
                              />
                            </div>
                          </div>

                          {/* OTIMIZAÇÃO DE BUSCA SEO */}
                          <div className="bg-[#F6F6F4] p-5 rounded-2xl border border-[#EFEFEA] space-y-4 font-bold">
                            <span className="text-[10px] font-black uppercase text-stone-900 tracking-wider block border-b border-zinc-200 pb-1.5">Meta Tags de Otimização (Google SEO)</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-slate-500">Título SEO (Máx 60 caracteres)</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: Casa à venda no Campolim com 3 suítes | RB" 
                                  className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-semibold"
                                  value={newProperty.tituloSEO || ''} 
                                  onChange={e => setNewProperty({...newProperty, tituloSEO: e.target.value})} 
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <label className="text-[8px] font-black uppercase text-slate-500">Meta Descrição SEO (Máx 160 caracteres)</label>
                                  <span className={`text-[8.5px] font-bold ${(newProperty.descricaoSEO || '').length > 160 ? 'text-rose-500' : 'text-slate-400'}`}>
                                    {(newProperty.descricaoSEO || '').length}/160
                                  </span>
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="Ex: Excelente casa térrea no Jardim Campolim de Sorocaba contendo acabamento de altíssimo nível, amplas salas..." 
                                  className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-semibold"
                                  value={newProperty.descricaoSEO || ''} 
                                  onChange={e => setNewProperty({...newProperty, descricaoSEO: e.target.value})} 
                                />
                              </div>

                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[8px] font-black uppercase text-slate-500">Palavras-chave SEO (Separadas por vírgula)</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: casa campolim sorocaba, imovel alto padrao sorocaba, comprar casa campolim" 
                                  className="w-full bg-white border border-[#EFEFEA] rounded-lg px-3 py-2 text-xs font-semibold font-mono"
                                  value={newProperty.palavrasChaveSEO || ''} 
                                  onChange={e => setNewProperty({...newProperty, palavrasChaveSEO: e.target.value})} 
                                />
                              </div>
                            </div>
                          </div>

                          {/* EXPOSIÇÃO E STATUS DO PORTAL */}
                          <div className="bg-[#050505] p-5 rounded-3xl border border-zinc-900 space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block border-b border-zinc-800 pb-1.5">Controle de Divulgação & Visibilidade do Site</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <label className="flex items-center space-x-3 text-xs font-black text-slate-300 cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  checked={newProperty.publicadoNoSite !== false} 
                                  onChange={e => setNewProperty({...newProperty, publicadoNoSite: e.target.checked, publicado: e.target.checked})}
                                  className="rounded border-zinc-700 bg-zinc-900 text-amber-500 w-4 h-4 focus:ring-amber-500" 
                                />
                                <span>Publicado no site?</span>
                              </label>

                              <label className="flex items-center space-x-3 text-xs font-black text-slate-300 cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  checked={newProperty.mostrarNosFiltros !== false && newProperty.mostrarCatalogo !== false} 
                                  onChange={e => setNewProperty({...newProperty, mostrarCatalogo: e.target.checked, mostrarNosFiltros: e.target.checked})}
                                  className="rounded border-zinc-700 bg-zinc-900 text-amber-500 w-4 h-4 focus:ring-amber-500" 
                                />
                                <span>Mostrar nos Filtros?</span>
                              </label>

                              <label className="flex items-center space-x-3 text-xs font-black text-slate-300 cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  checked={newProperty.mostrarValorNoSite !== false} 
                                  onChange={e => setNewProperty({...newProperty, mostrarValorNoSite: e.target.checked})}
                                  className="rounded border-zinc-700 bg-zinc-900 text-amber-500 w-4 h-4 focus:ring-amber-500" 
                                />
                                <span>Mostrar Valor no site?</span>
                              </label>

                              <label className="flex items-center space-x-3 text-xs font-black text-slate-300 cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  checked={!!newProperty.destaque} 
                                  onChange={e => setNewProperty({...newProperty, destaque: e.target.checked, destaqueNaHome: e.target.checked})}
                                  className="rounded border-zinc-700 bg-zinc-900 text-amber-500 w-4 h-4 focus:ring-amber-500" 
                                />
                                <span>Destaque na Home?</span>
                              </label>
                            </div>
                          </div>

                          {/* FLUXO DE APROVAÇÃO E HISTÓRICO - CONTROLE CRM */}
                          <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4 shadow-sm text-left">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                              <ShieldAlert size={16} className="text-amber-500" />
                              <span className="text-[10px] font-black uppercase text-stone-900 tracking-wider">Fluxo de Aprovação & Controle Interno</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-stone-600 block">Status de Aprovação Atual</label>
                                {temPermissao('aprovar_imovel') ? (
                                  <select
                                    className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                                    value={newProperty.approvalStatus || 'Rascunho'}
                                    onChange={(e) => {
                                      const newStatus = e.target.value;
                                      const currentHist = Array.isArray(newProperty.approvalHistory) ? newProperty.approvalHistory : [];
                                      const logEntry = {
                                        data: new Date().toISOString(),
                                        usuario: profile?.name || profile?.nome || currentUser?.email || 'Sistema',
                                        perfil: profile?.perfil || 'Administrador',
                                        de: newProperty.approvalStatus || 'Rascunho',
                                        para: newStatus,
                                        observacoes: ''
                                      };
                                      setNewProperty({
                                        ...newProperty,
                                        approvalStatus: newStatus,
                                        approvalHistory: [...currentHist, logEntry]
                                      });
                                    }}
                                  >
                                    <option value="Rascunho">Rascunho (Rascunho)</option>
                                    <option value="Em análise">Em análise (Em análise)</option>
                                    <option value="Aguardando aprovação">Aguardando aprovação (Solicitar Alterações)</option>
                                    <option value="Aprovado">Aprovado (Aprovado)</option>
                                    <option value="Publicado">Publicado (Publicado no Site)</option>
                                    <option value="Reprovado">Reprovado (Reprovado)</option>
                                    <option value="Arquivado">Arquivado (Arquivado)</option>
                                  </select>
                                ) : (
                                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                                    <span className="text-xs font-extrabold text-stone-800">
                                      {newProperty.approvalStatus || 'Rascunho'}
                                    </span>
                                    {['Rascunho', 'Reprovado'].includes(newProperty.approvalStatus || 'Rascunho') && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const currentHist = Array.isArray(newProperty.approvalHistory) ? newProperty.approvalHistory : [];
                                          const logEntry = {
                                            data: new Date().toISOString(),
                                            usuario: profile?.name || profile?.nome || currentUser?.email || 'Usuário',
                                            perfil: profile?.perfil || 'Corretor',
                                            de: newProperty.approvalStatus || 'Rascunho',
                                            para: 'Em análise',
                                            observacoes: 'Submetido para análise pelo corretor'
                                          };
                                          setNewProperty({
                                            ...newProperty,
                                            approvalStatus: 'Em análise',
                                            approvalHistory: [...currentHist, logEntry]
                                          });
                                          alert("Imóvel enviado para análise da gerência!");
                                        }}
                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer"
                                      >
                                        Enviar para Análise
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-stone-600 block">Observações / Solicitação de Alteração</label>
                                <input
                                  type="text"
                                  placeholder="Digite observações sobre a mudança de status ou correções necessárias..."
                                  className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-medium text-stone-800 outline-none focus:ring-1 focus:ring-amber-500"
                                  value={newProperty.statusNotes || ''}
                                  onChange={(e) => {
                                    setNewProperty({
                                      ...newProperty,
                                      statusNotes: e.target.value
                                    });
                                  }}
                                />
                              </div>

                              <div className="col-span-1 md:col-span-2 space-y-2 mt-2">
                                <label className="text-[9px] font-black uppercase text-stone-500 block border-b border-slate-100 pb-1">Histórico de Alterações de Status</label>
                                {(!newProperty.approvalHistory || newProperty.approvalHistory.length === 0) ? (
                                  <p className="text-[10px] text-slate-400 italic font-semibold">Nenhum histórico registrado.</p>
                                ) : (
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar pr-1">
                                    {(newProperty.approvalHistory as any[]).map((log: any, i: number) => (
                                      <div key={i} className="flex gap-2 text-[10px] bg-stone-50 p-2.5 rounded-xl border border-stone-100 leading-normal font-medium text-stone-850">
                                        <div className="shrink-0 text-amber-600 font-extrabold uppercase text-[8px] tracking-wider pt-0.5">
                                          {new Date(log.data).toLocaleDateString('pt-BR')} {new Date(log.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        <div className="flex-1">
                                          <p>
                                            <span className="font-extrabold text-stone-900">{log.usuario}</span> ({log.perfil}) alterou de <span className="font-bold text-slate-500">"{log.de}"</span> para <span className="font-extrabold text-amber-700">"{log.para}"</span>
                                          </p>
                                          {log.observacoes && (
                                            <p className="text-stone-500 mt-0.5 text-[9px] italic bg-amber-500/5 p-1 rounded-md border border-amber-500/10">
                                              💬 "{log.observacoes}"
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* LEGACY FIELDS REMOVED AND REFACTORED TO REGRAS DE NEGOCIO */}

                        </div>
                      )}

                      {/* Sticky/Fixed Wizards footer buttons to switch tabs effortlessly */}
                      <div className="border-t border-neutral-100 pt-5 mt-8 flex justify-between items-center bg-neutral-50/50 p-4.5 rounded-2xl border border-neutral-150/40">
                        {/* Prev task */}
                        <div>
                          {editTab !== 'dados_basicos' ? (
                            <button
                              type="button"
                              onClick={() => {
                                const idx = [
                                  'dados_basicos', 'localizacao', 'proprietario', 'caracteristicas', 
                                  'ambientes', 'proximidades', 'instalacao', 'acabamento', 'lazer', 
                                  'imagens', 'videos', 'publicacao'
                                ].indexOf(editTab);
                                if (idx > 0) setEditTab([
                                  'dados_basicos', 'localizacao', 'proprietario', 'caracteristicas', 
                                  'ambientes', 'proximidades', 'instalacao', 'acabamento', 'lazer', 
                                  'imagens', 'videos', 'publicacao'
                                ][idx - 1]);
                              }}
                              className="px-5 py-3 bg-white hover:bg-neutral-100 text-[#111111] text-xs font-bold uppercase rounded-xl border border-[#E7E7E7] tracking-wider transition-all duration-300 cursor-pointer shadow-sm"
                            >
                              Voltar Seção
                            </button>
                          ) : (
                            <div />
                          )}
                        </div>

                        {/* Save, Cancel and Next triggers */}
                        <div className="flex gap-3.5 items-center">
                          <button
                            type="button"
                            onClick={resetForm}
                            className="text-[#7A7F8C] hover:text-[#050505] text-xs font-bold uppercase tracking-wider px-3 cursor-pointer transition-colors"
                          >
                            Cancelar
                          </button>
                          
                          {editTab !== 'publicacao' ? (
                            <button
                              type="button"
                              onClick={() => {
                                const idx = [
                                  'dados_basicos', 'localizacao', 'proprietario', 'caracteristicas', 
                                  'ambientes', 'proximidades', 'instalacao', 'acabamento', 'lazer', 
                                  'imagens', 'videos', 'publicacao'
                                ].indexOf(editTab);
                                if (idx !== -1 && idx < 11) setEditTab([
                                  'dados_basicos', 'localizacao', 'proprietario', 'caracteristicas', 
                                  'ambientes', 'proximidades', 'instalacao', 'acabamento', 'lazer', 
                                  'imagens', 'videos', 'publicacao'
                                ][idx + 1]);
                              }}
                              className="bg-[#050505] hover:bg-[#F5B400] hover:text-[#050505] text-white px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-305 border border-[#050505] cursor-pointer shadow-sm group"
                            >
                              <span>Próxima Seção</span>
                              <ArrowRight size={14} className="text-[#F5B400] shrink-0 group-hover:text-black" />
                            </button>
                          ) : (
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="bg-[#F5B400] hover:bg-[#F2C94C] border border-[#F5B400] text-[#050505] px-7 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 shadow-sm cursor-pointer"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 size={14} className="animate-spin text-stone-950" />
                                  <span>Publicando...</span>
                                </>
                              ) : (
                                <>
                                  <span>{editingId ? 'Salvar Ficha' : 'Publicar Anúncio'}</span>
                                  <Send size={14} />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                    </form>

                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* HIDDEN LOGS FOR AGENDA REPORT PDF EXPORT INTEGRATION */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div id="agenda-full-report" className="bg-white p-12 w-[800px]">
            <div className="mb-10 text-center pb-8 border-b border-slate-100">
               <h4 className="text-amber-500 font-black text-3xl uppercase tracking-tighter">Relatório de Agenda</h4>
               <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">RB Sorocaba Negócios Imobiliários • Período: {exportStartDate.split('-').reverse().join('/')} até {exportEndDate.split('-').reverse().join('/')}</p>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Visitas no Período</p>
                <p className="text-3xl font-black text-zinc-950">{myVisits.filter(v => v.date >= exportStartDate && v.date <= exportEndDate).length}</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                <p className="text-amber-600 text-[10px] uppercase tracking-widest font-bold mb-1">Confirmadas</p>
                <p className="text-3xl font-black text-amber-600">{myVisits.filter(v => v.date >= exportStartDate && v.date <= exportEndDate && v.status === 'confirmed').length}</p>
              </div>
              <div className="bg-red-50 p-6 rounded-2xl border border-rose-100">
                <p className="text-rose-600 text-[10px] uppercase tracking-widest font-bold mb-1">Bloqueios</p>
                <p className="text-3xl font-black text-rose-600">{blockedSlots.filter(s => s.date >= exportStartDate && s.date <= exportEndDate).length}</p>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="text-xs font-black text-stone-900 uppercase tracking-[0.2em] flex items-center gap-2">
                 <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                 Compromissos Agendados
              </h4>

              <PDFCalendar 
                year={parseInt(exportStartDate.split('-')[0])} 
                month={parseInt(exportStartDate.split('-')[1]) - 1} 
                highlightedDays={[
                  ...myVisits.filter(v => v.date >= exportStartDate && v.date <= exportEndDate).map(v => v.date),
                  ...blockedSlots.filter(s => s.date >= exportStartDate && s.date <= exportEndDate).map(s => s.date)
                ]} 
              />

              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-[#050505] text-[#A1A1AA] uppercase tracking-widest font-bold">
                    <tr>
                      <th className="px-5 py-4">Data/Hora</th>
                      <th className="px-5 py-4">Cliente/Motivo</th>
                      <th className="px-5 py-4 text-center">Tipo/Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ...myVisits.filter(v => v.date >= exportStartDate && v.date <= exportEndDate).map(v => ({...v, typeKey: 'visit'})),
                      ...blockedSlots.filter(s => s.date >= exportStartDate && s.date <= exportEndDate).map(s => ({...s, typeKey: 'blocked'}))
                    ].sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time)).map((v, i) => (
                      <tr key={i} className="bg-white">
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {v.date.split('-').reverse().join('/')} às {v.time}h
                        </td>
                        <td className="px-5 py-4 text-slate-500 font-medium">
                          {v.typeKey === 'blocked' ? (
                            <span style={{ color: '#DC2626' }}>BLOQUEIO: {v.reason || 'Sem motivo'}</span>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{v.name}</span>
                              <span className="text-[8px] text-slate-450">{v.propertyName || 'Imóvel'}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            v.typeKey === 'blocked' ? 'bg-rose-50 text-rose-600' :
                            v.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {v.typeKey === 'blocked' ? 'Bloqueado' : v.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* DELETE CONFIRMATION INTERSTITIAL */}
        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-xl">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
                  <Trash2 size={28} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-stone-900 uppercase tracking-widest">Remover do Catálogo?</h3>
                  <p className="text-xs text-slate-400">
                    Você pretende apagar definitivamente <span className="text-stone-900 font-bold">"{confirmDelete.title}"</span>. Esta ação removerá sua visibilidade pública no site.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      onDeleteProperty(confirmDelete.id);
                      setConfirmDelete(null);
                    }}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                  >
                    Excluir Permanentemente
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-100 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                  >
                    Preservar Imóvel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. BROKER EDIT/CREATE CRM DIALOG */}
        <AnimatePresence>
          {isBrokerModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white border border-[#EFEFEA] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-[#F6F6F4] bg-[#050505] text-[#F1F1ED] flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#F1F1ED]">
                      {editingBroker ? "Editar Perfil do Corretor" : "Cadastrar Novo Corretor"}
                    </h4>
                    <p className="text-[9px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">Whitelist de credenciais da RB Sorocaba</p>
                  </div>
                  <button 
                    onClick={() => setIsBrokerModalOpen(false)}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-[#A1A1AA] hover:text-[#F1F1ED]"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveBroker} className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Nome Completo do Corretor</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500"
                      value={formBroker.nome} 
                      onChange={e => setFormBroker({...formBroker, nome: e.target.value})} 
                      placeholder="Ex: Ronaldo Bueno" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">CRECI Regional</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-[#050505] outline-none focus:ring-1 focus:ring-amber-500"
                        value={formBroker.creci} 
                        onChange={e => setFormBroker({...formBroker, creci: e.target.value})} 
                        placeholder="Ex: CRECI 235123-F" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Telefone de Atendimento</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-[#050505] outline-none focus:ring-1 focus:ring-amber-500"
                        value={formBroker.telefone} 
                        onChange={e => setFormBroker({...formBroker, telefone: e.target.value})} 
                        placeholder="Ex: (15) 99114-3213" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">E-mail Corporativo</label>
                    <input 
                      type="email" 
                      className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-semibold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500"
                      value={formBroker.email} 
                      onChange={e => setFormBroker({...formBroker, email: e.target.value})} 
                      placeholder="ronaldo@rbsorocaba.com.br" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">URL da Foto de Perfil (Opcional)</label>
                    <input 
                      type="text" 
                      className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-semibold text-stone-900 outline-none"
                      value={formBroker.fotoUrl} 
                      onChange={e => setFormBroker({...formBroker, fotoUrl: e.target.value})} 
                      placeholder="https://..." 
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <input 
                      id="broker-status" 
                      type="checkbox" 
                      className="rounded border-[#EFEFEA] text-amber-500 focus:ring-amber-500 h-4.5 w-4.5"
                      checked={formBroker.ativo} 
                      onChange={e => setFormBroker({...formBroker, ativo: e.target.checked})} 
                    />
                    <label htmlFor="broker-status" className="text-xs font-extrabold text-stone-700 uppercase tracking-wider cursor-pointer">
                      Corretor Ativo Whitelisted
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#F6F6F4]">
                    <button 
                      type="button" 
                      onClick={() => setIsBrokerModalOpen(false)}
                      className="px-5 py-3 bg-[#F6F6F4] hover:bg-[#F1F1ED] text-stone-600 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-3 bg-[#050505] text-amber-500 hover:text-amber-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all shadow"
                    >
                      Salvar Cadastro
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. NEIGHBORHOOD EDIT/CREATE CRM DIALOG */}
        <AnimatePresence>
          {isNeighborhoodModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white border border-[#EFEFEA] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-[#F6F6F4] bg-[#050505] text-[#F1F1ED] flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#F1F1ED]">
                      {editingNeighborhood ? "Editar Bairro Customizado" : "Cadastrar Novo Bairro"}
                    </h4>
                    <p className="text-[9px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">Zonas de busca Sorocaba & SP</p>
                  </div>
                  <button 
                    onClick={() => setIsNeighborhoodModalOpen(false)}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-[#A1A1AA] hover:text-[#F1F1ED]"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveNeighborhood} className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Nome Oficial do Bairro</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500"
                      value={formNeighborhood.nome} 
                      onChange={e => setFormNeighborhood({...formNeighborhood, nome: e.target.value})} 
                      placeholder="Ex: Campolim" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Cidade</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#F2F2EC] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-[#050505] cursor-not-allowed"
                        disabled
                        value={formNeighborhood.cidade} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Estado</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#F2F2EC] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-[#050505] cursor-not-allowed"
                        disabled
                        value={formNeighborhood.estado} 
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <input 
                      id="neighb-status" 
                      type="checkbox" 
                      className="rounded border-[#EFEFEA] text-amber-500 focus:ring-amber-500 h-4.5 w-4.5"
                      checked={formNeighborhood.ativo} 
                      onChange={e => setFormNeighborhood({...formNeighborhood, ativo: e.target.checked})} 
                    />
                    <label htmlFor="neighb-status" className="text-xs font-extrabold text-stone-700 uppercase tracking-wider cursor-pointer">
                      Bairro Ativo para Buscas
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#F6F6F4]">
                    <button 
                      type="button" 
                      onClick={() => setIsNeighborhoodModalOpen(false)}
                      className="px-5 py-3 bg-[#F6F6F4] hover:bg-[#F1F1ED] text-stone-600 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-3 bg-[#050505] text-amber-500 hover:text-amber-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all shadow"
                    >
                      Salvar Bairro
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. OWNER EDIT/CREATE CRM DIALOG */}
        <AnimatePresence>
          {isOwnerModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white border border-[#EFEFEA] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-[#F6F6F4] bg-[#050505] text-[#F1F1ED] flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#F1F1ED]">
                      {editingOwner ? "Editar Proprietário" : "Cadastrar Proprietário"}
                    </h4>
                    <p className="text-[9px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">Banco de dados de contratos RB Sorocaba</p>
                  </div>
                  <button 
                    onClick={() => setIsOwnerModalOpen(false)}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-[#A1A1AA] hover:text-[#F1F1ED]"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveOwner} className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Nome Completo</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500"
                      value={formOwner.nome} 
                      onChange={e => setFormOwner({...formOwner, nome: e.target.value})} 
                      placeholder="Ex: Ronaldo Bueno" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">CPF ou CNPJ</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-[#050505] outline-none focus:ring-1 focus:ring-amber-500"
                        value={formOwner.cpfCnpj} 
                        onChange={e => setFormOwner({...formOwner, cpfCnpj: e.target.value})} 
                        placeholder="Ex: 414.123.321-00" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">WhatsApp de Contato</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-[#050505] outline-none focus:ring-1 focus:ring-amber-500"
                        value={formOwner.telefone} 
                        onChange={e => setFormOwner({...formOwner, telefone: e.target.value})} 
                        placeholder="Ex: (15) 99114-3213" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">E-mail Cadastrado</label>
                    <input 
                      type="email" 
                      className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-semibold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500"
                      value={formOwner.email} 
                      onChange={e => setFormOwner({...formOwner, email: e.target.value})} 
                      placeholder="proprietario@gmail.com" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Endereço de Faturamento</label>
                    <input 
                      type="text" 
                      className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-semibold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500"
                      value={formOwner.endereco} 
                      onChange={e => setFormOwner({...formOwner, endereco: e.target.value})} 
                      placeholder="Ex: Av. Campolim, 100 - Sorocaba/SP" 
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <input 
                      id="owner-status" 
                      type="checkbox" 
                      className="rounded border-[#EFEFEA] text-amber-500 focus:ring-amber-500 h-4.5 w-4.5"
                      checked={formOwner.ativo} 
                      onChange={e => setFormOwner({...formOwner, ativo: e.target.checked})} 
                    />
                    <label htmlFor="owner-status" className="text-xs font-extrabold text-stone-700 uppercase tracking-wider cursor-pointer">
                      Contrato de Proprietário Ativo Whitelisted
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#F6F6F4]">
                    <button 
                      type="button" 
                      onClick={() => setIsOwnerModalOpen(false)}
                      className="px-5 py-3 bg-[#F6F6F4] hover:bg-[#F1F1ED] text-stone-600 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-3 bg-[#050505] text-amber-500 hover:text-amber-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all shadow"
                    >
                      Salvar Proprietário
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DUPLICATION WARNING MODAL */}
        <AnimatePresence>
          {duplicationWarning && (
            <div className="fixed inset-0 z-[2000] overflow-y-auto bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full border border-[#EFEFEA] shadow-2xl overflow-hidden flex flex-col p-8 space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                    <ShieldAlert size={28} />
                  </div>
                  <h3 className="text-base font-black text-stone-900 uppercase tracking-widest">
                    Aviso de Duplicidade Detectado
                  </h3>
                  <p className="text-xs text-stone-500 font-medium leading-relaxed">
                    {duplicationWarning.type === 'rental' 
                      ? 'Este imóvel já possui uma locação ativa vinculada a ele no banco de dados. Deseja atualizar a locação existente?'
                      : 'Este imóvel já possui um registro de venda vinculado a ele no banco de dados. Deseja atualizar a venda existente?'}
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { type, propertyId, propertyData, existingRecord } = duplicationWarning;
                        if (type === 'rental') {
                          await onUpdateProperty({ ...propertyData, id: propertyId } as Property);
                          await createAutomaticRentalFromProperty({ ...propertyData, id: propertyId }, false, existingRecord.id);
                        } else {
                          await onUpdateProperty({ ...propertyData, id: propertyId } as Property);
                          await createAutomaticSaleFromProperty({ ...propertyData, id: propertyId }, false, existingRecord.id);
                        }
                        setDuplicationWarning(null);
                        setShowSuccess(true);
                        resetForm();
                      } catch (err) {
                        alert("Erro ao executar atualização.");
                      }
                    }}
                    className="w-full py-3.5 bg-[#050505] hover:bg-zinc-800 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow"
                  >
                    {duplicationWarning.type === 'rental' ? 'Atualizar Locação Existente' : 'Atualizar Venda Existente'}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { type, propertyId, propertyData } = duplicationWarning;
                        if (type === 'rental') {
                          await onUpdateProperty({ ...propertyData, id: propertyId } as Property);
                          await createAutomaticRentalFromProperty({ ...propertyData, id: propertyId }, true);
                        } else {
                          await onUpdateProperty({ ...propertyData, id: propertyId } as Property);
                          await createAutomaticSaleFromProperty({ ...propertyData, id: propertyId }, true);
                        }
                        setDuplicationWarning(null);
                        setShowSuccess(true);
                        resetForm();
                      } catch (err) {
                        alert("Erro ao criar novo registro.");
                      }
                    }}
                    className="w-full py-3.5 bg-neutral-200 hover:bg-neutral-300 text-stone-900 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                  >
                    {duplicationWarning.type === 'rental' ? 'Criar Nova Locação mesmo assim' : 'Criar Novo Registro'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDuplicationWarning(null)}
                    className="w-full py-3.5 bg-[#F6F6F4] hover:bg-[#F1F1ED] text-stone-600 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL PARA ESCOLHER TIPO DE DOCUMENTO LOGO APÓS CLICAR EM 'GERAR DOCUMENTO' NO IMÓVEL */}
        <AnimatePresence>
          {showDocChoiceModal && wizardProperty && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-3xl max-w-sm w-full space-y-5 shadow-2xl relative text-stone-900">
                
                <button 
                  onClick={() => {
                    setShowDocChoiceModal(false);
                    setWizardProperty(null);
                  }}
                  className="absolute top-4 right-4 text-stone-400 hover:text-black font-extrabold text-xs cursor-pointer"
                >
                  ✕
                </button>

                <div className="space-y-1.5 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-[#F5B400]/10 text-amber-500 rounded-full flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <h3 className="text-xs font-black uppercase text-stone-900 tracking-widest mt-2">
                    Gerar Documento Oficial
                  </h3>
                  <p className="text-[11px] text-stone-500 font-bold max-w-xs leading-tight">
                    Imóvel: {wizardProperty.title}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  {[
                    { id: 'Proposta', label: 'Proposta de Compra' },
                    { id: 'Contraproposta', label: 'Contraproposta de Compra' },
                    { id: 'ContratoCompraVenda', label: 'Contrato Compra & Venda' },
                    { id: 'ContratoLocacao', label: 'Contrato de Locação' },
                    { id: 'ReciboEditavel', label: 'Recibo Editável' }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => {
                        setWizardTypeFromPortal(btn.id as any);
                        setShowDocChoiceModal(false);
                        setWizardOpenFromPortal(true);
                      }}
                      className="w-full text-left p-3.5 bg-stone-100 hover:bg-[#F5B400]/10 hover:border-[#F5B400] border border-stone-200 rounded-2xl text-[11px] font-black uppercase tracking-wider text-stone-800 transition flex justify-between items-center cursor-pointer"
                    >
                      <span>{btn.label}</span>
                      <ArrowUpRight size={13} className="text-amber-500 shrink-0" />
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setShowDocChoiceModal(false);
                    setWizardProperty(null);
                  }}
                  className="w-full py-3 bg-neutral-100 hover:bg-neutral-250 text-stone-600 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer"
                >
                  cancelar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. CRM USER EDIT/CREATE DIALOG */}
        <AnimatePresence>
          {isUserModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white border border-[#EFEFEA] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl my-8 text-left"
              >
                <div className="p-6 border-b border-[#F6F6F4] bg-[#050505] text-[#F1F1ED] flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#F1F1ED]">
                      {editingUser ? "Editar Usuário CRM" : "Novo Usuário CRM"}
                    </h4>
                    <p className="text-[9px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">RB Sorocaba Controle de Acesso</p>
                  </div>
                  <button 
                    onClick={() => setIsUserModalOpen(false)}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-[#A1A1AA] hover:text-[#F1F1ED] cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveUser} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Nome Completo *</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500"
                      value={formUser.nome} 
                      onChange={e => setFormUser({...formUser, nome: e.target.value})} 
                      placeholder="Ex: Carlos Albuquerque" 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Email (Login Firebase) *</label>
                      <input 
                        type="email" 
                        required 
                        disabled={!!editingUser}
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60"
                        value={formUser.email} 
                        onChange={e => setFormUser({...formUser, email: e.target.value})} 
                        placeholder="carlos@rbsorocaba.com.br" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Telefone / WhatsApp</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500"
                        value={formUser.telefone} 
                        onChange={e => setFormUser({...formUser, telefone: e.target.value})} 
                        placeholder="(15) 99123-4567" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">CRECI (Se houver)</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500"
                        value={formUser.creci} 
                        onChange={e => setFormUser({...formUser, creci: e.target.value})} 
                        placeholder="Ex: 123456-F" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Cargo Corporativo</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500"
                        value={formUser.cargo} 
                        onChange={e => setFormUser({...formUser, cargo: e.target.value})} 
                        placeholder="Ex: Corretor de Vendas" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Perfil de Acesso CRM *</label>
                      <select 
                        required
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                        value={formUser.perfil} 
                        onChange={e => setFormUser({...formUser, perfil: e.target.value})}
                      >
                        <option value="Administrador">Administrador (Acesso Total)</option>
                        <option value="Líder">Líder / Gerente (Gestão + CRM)</option>
                        <option value="Corretor">Corretor (Apenas CRM próprio)</option>
                        <option value="Assistente">Assistente (Registro de Imóveis)</option>
                        <option value="Financeiro">Financeiro (Painel Financeiro)</option>
                        <option value="Marketing">Marketing (Publicações & SEO)</option>
                        <option value="Proprietário">Proprietário (Portal Proprietário)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Status do Usuário *</label>
                      <select 
                        required
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                        value={formUser.status} 
                        onChange={e => setFormUser({...formUser, status: e.target.value})}
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                        <option value="Bloqueado">Bloqueado</option>
                        <option value="Férias">Férias</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Equipe Associada</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500"
                        value={formUser.equipe} 
                        onChange={e => setFormUser({...formUser, equipe: e.target.value})} 
                        placeholder="Ex: Vendas Campolim" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Supervisor Responsável</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500"
                        value={formUser.supervisor} 
                        onChange={e => setFormUser({...formUser, supervisor: e.target.value})} 
                        placeholder="Ex: Diretor Carlos" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Foto do Usuário (URL)</label>
                    <input 
                      type="text" 
                      className="w-full bg-[#F6F6F4] border border-[#EFEFEA] rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-amber-500"
                      value={formUser.foto} 
                      onChange={e => setFormUser({...formUser, foto: e.target.value})} 
                      placeholder="https://images.unsplash.com/photo-..." 
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsUserModalOpen(false)}
                      className="flex-1 py-3.5 bg-[#F6F6F4] hover:bg-[#F1F1ED] text-stone-600 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3.5 bg-[#050505] hover:bg-stone-900 text-amber-500 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer"
                    >
                      {editingUser ? "Salvar Alterações" : "Criar Usuário"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* COMPONENT CONTRACT WIZARD SEAMLESSLY ATTACHED */}
        {wizardOpenFromPortal && wizardProperty && (
          <ContractWizard 
            onClose={() => {
              setWizardOpenFromPortal(false);
              setWizardProperty(null);
            }}
            initialImovel={wizardProperty}
            initialDocType={wizardTypeFromPortal}
          />
        )}

      </main>
    </motion.div>
  );
}
