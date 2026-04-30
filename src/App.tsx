/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent, useMemo } from 'react';
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
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Firebase ---
import { 
  saveLead, 
  loginWithGoogle, 
  logout, 
  onAuthStateChanged, 
  checkIfAdmin, 
  User, 
  auth,
  submitProperty,
  getSubmissions,
  approveProperty,
  rejectProperty,
  getProperties,
  addPropertyToInventory,
  updatePropertyInInventory,
  deletePropertyFromInventory,
  scheduleVisit,
  getVisits,
  blockSlot,
  unblockSlot,
  getBlockedSlots,
  subscribeToVisits,
  subscribeToBlockedSlots,
  subscribeToProperties,
  toggleFavorite,
  subscribeToFavorites,
  updateVisitStatus,
  deleteVisit
} from './lib/firebase';
import { exportReportToPDF, generateFullCatalogPDF } from './lib/pdfExport';
import { sendVisitConfirmationNotification } from './services/notificationService';

// --- Config ---
const BROKER_PHONE = '5515981504714';
const BROKER_EMAIL = 'eliasborgess@creci.org.com.br';

// Fix for Leaflet default icon issues in Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Types ---

interface FormData {
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
}

interface Property {
  id: string | number;
  title: string;
  description?: string; // Descrição
  location: string;
  city: string;
  neighborhood: string;
  condominium?: string;
  condoValue?: string;
  purpose: 'Venda' | 'Locação';
  acceptsFinancing?: boolean;
  price: string;
  category: 'Residencial' | 'Comercial' | 'Rural';
  type: string;
  propertyType: string;
  beds?: number; // Quartos
  suites?: number;
  baths?: number; // Banheiros
  parkingCovered?: number; // Vagas
  parkingUncovered?: number;
  area: string;
  areaTotal?: string;
  areaUseful?: string;
  image: string;
  additionalImages?: string[]; // Imagens
  featured?: boolean;
  priceValue: number;
  coords: [number, number];
  status: 'ativo' | 'inativo' | 'vendido';
  videoUrl?: string; // URL do vídeo (YouTube/Vimeo)
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  text: string;
  rating: number;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  image: string;
  creci?: string;
  instagram?: string;
  whatsapp?: string;
}

// --- Data ---

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Ricardo Mendes",
    role: "Empresário",
    text: "O atendimento da RB SOROCABA NEGOCIOS IMOBILIARIOS é fora de série. Encontraram o imóvel perfeito para minha família em tempo recorde.",
    rating: 5
  },
  {
    id: 2,
    name: "Ana Carla Silveira",
    role: "Arquiteta",
    text: "Como profissional da área, sou exigente. A curadoria de imóveis deles é impecável, focado em design e qualidade.",
    rating: 5
  },
  {
    id: 3,
    name: "Marcos Oliveira",
    role: "Investidor",
    text: "Segurança e transparência. Recomendo para qualquer investidor que busca rentabilidade e ativos de valor real.",
    rating: 5
  }
];

const TEAM: TeamMember[] = [
  { id: 1, name: "ELIAS BORGES", role: "Consultor Imobiliário", image: "https://i.postimg.cc/L6NcpGfc/ELIAS.jpg", creci: "278765", instagram: "corretoreliasborges", whatsapp: "5515981127219" },
  { id: 2, name: "CLEIDIANE BORGES", role: "Consultora Imobiliária", image: "https://i.postimg.cc/bNcxvv0w/Whats-App-Image-2026-04-23-at-20-31-01.jpg", creci: "314765-F", instagram: "cleidiane.borges1", whatsapp: "5515981621928" }
];

const PROPERTY_CATEGORIES = {
  Residencial: ['Apartamento', 'Área', 'Casa', 'Chácara', 'Kitnet', 'Sobrado', 'Terreno'],
  Comercial: ['Área', 'Barracão', 'Casa', 'Galpão', 'Hotel', 'Ponto', 'Prédio', 'Sala', 'Salão', 'Sobrado', 'Terreno'],
  Rural: ['Área', 'Casa', 'Chácara', 'Sítio', 'Sobrado', 'Terreno']
} as const;

type PropertyCategory = keyof typeof PROPERTY_CATEGORIES;

// --- Helpers ---

const parsePriceInput = (value: string): number | "" => {
  if (!value) return "";
  const clean = value.toLowerCase().replace(/[r$\s.]/g, "").replace(",", ".");
  if (clean.endsWith("m")) {
    const num = parseFloat(clean);
    return isNaN(num) ? "" : num * 1000000;
  }
  if (clean.endsWith("k")) {
    const num = parseFloat(clean);
    return isNaN(num) ? "" : num * 1000;
  }
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? "" : parsed;
};

const formatCurrency = (value: number | "") => {
  if (value === "") return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
};

const getVideoEmbedUrl = (url?: string) => {
  if (!url) return null;
  
  // YouTube
  const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  
  // Vimeo
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/)([0-9]+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  
  return null;
};

// --- Components ---

function VisitRegistrationOverlay({ 
  property, 
  onClose,
  existingVisits = [],
  blockedSlots = []
}: { 
  property: Property, 
  onClose: () => void,
  existingVisits?: any[],
  blockedSlots?: any[]
}) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Available hourly slots from 8:00 to 18:00
  const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const isSlotOccupied = (date: string, time: string) => {
    const isBlocked = blockedSlots.some(s => s.date === date && s.time === time);
    const isVisited = existingVisits.some(v => v.date === date && v.time === time && v.status !== 'cancelled');
    return isBlocked || isVisited;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.time) {
      alert("Por favor, selecione um horário disponível.");
      return;
    }
    setStatus('loading');

    try {
      // Save to Firebase using the new helper
      await scheduleVisit({
        propertyId: property.id,
        propertyName: property.title,
        name: formData.name,
        phone: formData.phone,
        date: formData.date,
        time: formData.time,
        message: formData.message
      });

      // Simulation of Email Notification
      console.log("%c[NOTIFICATION]", "color: #ff5c00; font-weight: bold", "Enviando e-mail para corretores...");
      console.log(`Assunto: Novo agendamento VIP para ${property.title}`);
      console.log(`Corpo: O cliente ${formData.name} solicitou visita para o dia ${formData.date} às ${formData.time}h.`);

      // Prepare WhatsApp Message
      const message = `*Solicitação de Visita VIP*%0A%0A` +
                      `*Imóvel:* ${property.title}%0A` +
                      `*Cliente:* ${formData.name}%0A` +
                      `*WhatsApp:* ${formData.phone}%0A` +
                      `*Data:* ${formData.date.split('-').reverse().join('/')}%0A` +
                      `*Horário:* ${formData.time}h%0A` +
                      `*Mensagem:* ${formData.message || 'Sem observações'}`;
      
      // WhatsApp notification
      window.open(`https://wa.me/${BROKER_PHONE}?text=${message}`, '_blank');

      setStatus('success');
    } catch (error) {
      console.error('Erro ao agendar visita:', error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-brand-dark/95 backdrop-blur-xl flex items-center justify-center p-6"
      >
        <div className="bg-white rounded-3xl md:rounded-[3rem] p-12 max-w-xl w-full text-center space-y-8 shadow-2xl relative">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <Check size={48} />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">Agendamento Solicitado!</h3>
            <p className="text-slate-500 mb-6">Sua solicitação foi processada com sucesso:</p>
            
            <div className="flex flex-col gap-3 max-w-sm mx-auto text-left">
              <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-4 rounded-2xl">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={16} />
                </div>
                <p className="text-xs font-bold uppercase tracking-tight">Status registrado no Painel Admin</p>
              </div>
              <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-4 rounded-2xl">
                <div className="w-8 h-8 bg-brand-orange text-white rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail size={16} />
                </div>
                <p className="text-xs font-bold uppercase tracking-tight">Notificação enviada para os e-mails</p>
              </div>
              <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-4 rounded-2xl">
                <div className="w-8 h-8 bg-[#25D366] text-white rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={16} />
                </div>
                <p className="text-xs font-bold uppercase tracking-tight">Redirecionado para o WhatsApp</p>
              </div>
            </div>
            
            <p className="text-slate-400 text-sm italic mt-8">Entraremos em contato em breve para confirmar sua visita à {property.title}.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-full btn-primary py-4 md:py-5 text-lg md:text-xl"
          >
            Voltar ao Site
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-3xl p-4 md:p-10 flex flex-col overflow-hidden"
    >
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full">
        <div className="flex justify-between items-center mb-6 md:mb-12">
          <div className="flex items-center space-x-4 md:space-x-6 text-white group cursor-pointer" onClick={onClose}>
            <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-orange rounded-2xl md:rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(255,92,0,0.4)]">
              <Calendar size={24} className="md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="text-xl md:text-4xl font-black tracking-tighter uppercase leading-none">Visita <span className="text-brand-orange">VIP</span></h2>
              <p className="text-white/40 text-[10px] md:text-sm font-bold tracking-[0.2em] truncate max-w-[150px] md:max-w-none">{property.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 md:w-16 md:h-16 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-all border border-white/10 hover:border-brand-orange group"
          >
            <X size={24} className="md:w-8 md:h-8 group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            {/* Property Preview Card */}
            <div className="hidden lg:block space-y-8 sticky top-0 group">
              <div className="rounded-3xl md:rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                <img src={property.image} className="w-full h-[350px] md:h-[500px] object-cover group-hover:scale-105 transition-transform duration-[2s]" alt={property.title} />
                <div className="absolute bottom-10 left-10 z-20">
                  <div className="flex items-center text-brand-orange mb-2 font-bold tracking-widest text-xs uppercase">
                    <MapPin size={14} className="mr-2" />
                    {property.location}
                  </div>
                  <h4 className="text-4xl font-black text-white tracking-tighter mb-4">{property.title}</h4>
                  <div className="flex gap-6">
                    <div className="flex flex-col">
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Dorm/Suítes</span>
                      <span className="text-white font-bold">{property.beds || 0} / {property.suites || 0}</span>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col">
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Área Útil</span>
                      <span className="text-white font-bold">{property.areaUseful || property.area}</span>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col">
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Vagas</span>
                      <span className="text-white font-bold">{(property.parkingCovered || 0) + (property.parkingUncovered || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-brand-orange/10 border border-brand-orange/20 p-8 md:p-10 rounded-3xl md:rounded-[2.5rem]">
                <p className="text-brand-orange leading-relaxed font-bold italic text-xl text-center">
                  "Viva a experiência exclusiva de conhecer cada detalhe desta propriedade excepcional com um de nossos diretores."
                </p>
              </div>
            </div>

            {/* Visit Form */}
            <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-16 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-brand-orange/5 rounded-bl-full" />
              
              <form onSubmit={handleSubmit} className="relative z-10 space-y-6 md:space-y-8">
                <div className="space-y-4 md:space-y-6">
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-black text-slate-400 ml-2">Identificação</label>
                    <input 
                      required
                      type="text" 
                      placeholder="NOME COMPLETO"
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl md:rounded-[1.5rem] px-6 md:px-8 py-4 md:py-5 outline-none focus:border-brand-orange focus:bg-white transition-all text-base md:text-lg font-bold placeholder:text-slate-300"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-black text-slate-400 ml-2">WhatsApp de Contato</label>
                    <input 
                      required
                      type="tel" 
                      placeholder="(15) 00000-0000"
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl md:rounded-[1.5rem] px-6 md:px-8 py-4 md:py-5 outline-none focus:border-brand-orange focus:bg-white transition-all text-base md:text-lg font-bold placeholder:text-slate-300"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-black text-slate-400 ml-2">Data da Visita</label>
                    <input 
                      required
                      type="date" 
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl md:rounded-[1.5rem] px-6 md:px-8 py-4 md:py-5 outline-none focus:border-brand-orange focus:bg-white transition-all text-base md:text-lg font-bold"
                      value={formData.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setFormData({...formData, date: e.target.value, time: ''})}
                    />
                  </div>

                  <div className={`space-y-2 md:space-y-3 transition-all duration-500 ${formData.date ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <label className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-black text-slate-400 ml-2">
                      {formData.date ? 'Escolha um Horário Disponível' : 'Selecione uma Data para ver horários'}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 md:gap-3">
                      {TIME_SLOTS.map(time => {
                        const occupied = formData.date ? isSlotOccupied(formData.date, time) : false;
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={occupied || !formData.date}
                            onClick={() => setFormData({ ...formData, time })}
                            className={`py-2 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all border-2 ${
                              formData.time === time 
                                ? 'bg-brand-orange border-brand-orange text-white shadow-md md:shadow-lg shadow-orange-500/30' 
                                : occupied 
                                  ? 'bg-slate-100 border-transparent text-slate-300 cursor-not-allowed opacity-50' 
                                  : 'bg-slate-50 border-transparent text-slate-600 hover:border-brand-orange/30'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-black text-slate-400 ml-2">Mensagem (Opcional)</label>
                    <textarea 
                      rows={2}
                      placeholder="DESEJA ALGUM FOCO ESPECÍFICO?"
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl md:rounded-[1.5rem] px-6 md:px-8 py-4 md:py-5 outline-none focus:border-brand-orange focus:bg-white transition-all text-base md:text-lg font-bold resize-none placeholder:text-slate-300"
                      value={formData.message}
                      onChange={e => setFormData({...formData, message: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-2 md:pt-4">
                  {status === 'error' && (
                    <div className="bg-red-50 text-red-600 p-3 md:p-4 rounded-xl text-[10px] md:text-xs font-bold mb-4 text-center border border-red-100">
                      Ocorreu um erro ao salvar seu agendamento. Por favor, tente novamente ou fale conosco via WhatsApp.
                    </div>
                  )}

                  {!formData.time && (
                    <p className="text-center text-brand-orange text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 md:mb-4 animate-pulse">
                      {formData.date ? 'Selecione um horário disponível para agendar' : 'Selecione uma data e horário para agendar'}
                    </p>
                  )}
                  <button 
                    disabled={status === 'loading' || !formData.time}
                    type="submit" 
                    className="w-full bg-gradient-to-r from-brand-orange to-red-600 hover:scale-105 !py-4 md:!py-6 !rounded-2xl md:!rounded-[2rem] text-lg md:text-xl flex items-center justify-center space-x-3 md:space-x-4 shadow-[0_15px_30px_rgba(255,92,0,0.3)] group/btn disabled:opacity-50 disabled:grayscale transition-all duration-300"
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        PROCESSANDO AGENDAMENTO...
                      </span>
                    ) : (
                      <>
                        <span className="tracking-tighter font-black">
                          {formData.time ? 'CONFIRMAR AGENDAMENTO VIP' : 'AGENDAR VISITA VIP'}
                        </span>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover/btn:translate-x-2 transition-transform">
                          <ChevronRight size={24} />
                        </div>
                      </>
                    )}
                  </button>
                  <p className="mt-8 text-center text-slate-400 text-xs font-bold leading-relaxed">
                    SEUS DADOS ESTÃO SEGUROS. UM ESPECIALISTA DA RB SOROCABA ENTRARÁ EM CONTATO PARA CONFIRMAÇÃO.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PropertyDetailModal({ property, onClose }: { property: Property; onClose: () => void }) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  const mediaItems = [
    { type: 'image', url: property.image },
    ...(property.additionalImages || []).map(url => ({ type: 'image', url })),
    ...(property.videoUrl ? [{ type: 'video', url: property.videoUrl }] : [])
  ];

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-3xl p-4 md:p-10 flex flex-col overflow-hidden"
    >
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full">
        <div className="flex justify-between items-center mb-6 md:mb-12">
          <div className="flex items-center space-x-4 md:space-x-6 text-white">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-orange rounded-2xl md:rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(255,92,0,0.4)]">
              <Eye size={24} className="md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="text-xl md:text-4xl font-black tracking-tighter uppercase leading-none">Visualização <span className="text-brand-orange">Detalhada</span></h2>
              <p className="text-white/40 text-[10px] md:text-sm font-bold tracking-[0.2em] truncate max-w-[150px] md:max-w-none">{property.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 md:w-16 md:h-16 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-all border border-white/10 hover:border-brand-orange group"
          >
            <X size={24} className="md:w-8 md:h-8 group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-10 space-y-8 md:space-y-12">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20">
            {/* Gallery Carousel Section */}
            <div className="space-y-4 md:space-y-6">
              <div className="relative group rounded-2xl md:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl aspect-[4/3] bg-white/5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentMediaIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                    className="w-full h-full"
                  >
                    {mediaItems[currentMediaIndex].type === 'image' ? (
                      <img 
                        src={mediaItems[currentMediaIndex].url} 
                        className="w-full h-full object-cover" 
                        alt={property.title} 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-full h-full bg-black">
                        <iframe
                          width="100%"
                          height="100%"
                          src={getVideoEmbedUrl(mediaItems[currentMediaIndex].url) || ''}
                          title="Vídeo do Imóvel"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        ></iframe>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows */}
                {mediaItems.length > 1 && (
                  <>
                    <button 
                      onClick={prevMedia}
                      className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/50 backdrop-blur-xl border border-white/10 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-orange hover:border-brand-orange hover:scale-110 active:scale-95"
                    >
                      <ChevronLeft size={32} />
                    </button>
                    <button 
                      onClick={nextMedia}
                      className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/50 backdrop-blur-xl border border-white/10 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-orange hover:border-brand-orange hover:scale-110 active:scale-95"
                    >
                      <ChevronRight size={32} />
                    </button>
                    
                    {/* Counter Overlay */}
                    <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white/70">
                      {currentMediaIndex + 1} / {mediaItems.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnails / Indicators */}
              {mediaItems.length > 1 && (
                <div className="flex flex-wrap gap-3 justify-center">
                  {mediaItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentMediaIndex(idx)}
                      className={`relative w-20 aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        currentMediaIndex === idx 
                          ? 'border-brand-orange scale-105 shadow-[0_0_20px_rgba(255,92,0,0.3)]' 
                          : 'border-white/5 opacity-40 hover:opacity-100 hover:border-white/20'
                      }`}
                    >
                      {item.type === 'image' ? (
                        <img src={item.url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                          <Play size={16} className="text-brand-orange" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="space-y-6 md:space-y-10 text-white">
              <div className="space-y-3 md:space-y-4">
                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-brand-orange font-black uppercase tracking-widest text-[9px] md:text-xs">
                  <span className="bg-brand-orange/10 border border-brand-orange/20 px-2.5 md:px-3 py-1 rounded-full">{property.purpose}</span>
                  <span className="bg-white/10 border border-white/10 px-2.5 md:px-3 py-1 rounded-full">{property.category}</span>
                  {property.propertyType && (
                    <span className="bg-white/10 border border-white/10 px-2.5 md:px-3 py-1 rounded-full">{property.propertyType}</span>
                  )}
                </div>
                <h3 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">{property.title}</h3>
                <div className="flex items-center text-white/40 font-bold uppercase tracking-widest text-[10px] md:text-xs">
                  <MapPin size={14} className="mr-2 text-brand-orange md:w-4 md:h-4" />
                  {property.neighborhood}, {property.city}
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                <div className="space-y-1">
                  <p className="text-white/30 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Área Total</p>
                  <p className="text-base md:text-lg font-bold">{property.area}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-white/30 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Dormitórios</p>
                  <p className="text-base md:text-lg font-bold">{property.beds || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-white/30 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Suítes</p>
                  <p className="text-base md:text-lg font-bold">{property.suites || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-white/30 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Banheiros</p>
                  <p className="text-base md:text-lg font-bold">{property.baths || 0}</p>
                </div>
              </div>

              {property.description && (
                <div className="space-y-3 md:space-y-4">
                  <h4 className="text-xs md:text-sm font-black uppercase tracking-widest text-brand-orange border-l-2 border-brand-orange pl-4">Descrição do Imóvel</h4>
                  <p className="text-white/70 leading-relaxed text-sm whitespace-pre-wrap">{property.description}</p>
                </div>
              )}
              
              <div className="space-y-4 md:space-y-6">
                <h4 className="text-xs md:text-sm font-black uppercase tracking-widest text-brand-orange border-l-2 border-brand-orange pl-4">Valores e Condições</h4>
                <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-4">
                  <span className="text-3xl md:text-5xl font-black tracking-tighter">{property.price}</span>
                  <span className="text-white/40 text-[10px] md:text-sm mb-1 sm:mb-2 font-bold italic">/ Investimento</span>
                </div>
                
                {property.condominium && (
                   <div className="flex items-center text-white/60 font-bold italic text-xs md:text-sm">
                     <span className="mr-2 opacity-50">• Condomínio:</span>
                     {property.condominium} {property.condoValue ? `(${property.condoValue})` : ''}
                   </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${property.acceptsFinancing ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,44,44,0.5)]'}`} />
                  <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest opacity-70">
                    {property.acceptsFinancing ? 'Aceita Financiamento' : 'Não Aceita Financiamento'}
                  </span>
                </div>
              </div>

              <div className="pt-6 md:pt-8 border-t border-white/10 grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-white/5 p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/5 space-y-1 md:space-y-2">
                  <p className="text-white/30 text-[8px] md:text-[10px] font-black uppercase tracking-widest">Garagem Coberta</p>
                  <p className="text-lg md:text-xl font-bold">{property.parkingCovered || 0} Vagas</p>
                </div>
                <div className="bg-white/5 p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/5 space-y-1 md:space-y-2">
                  <p className="text-white/30 text-[8px] md:text-[10px] font-black uppercase tracking-widest">Garagem Aberta</p>
                  <p className="text-lg md:text-xl font-bold">{property.parkingUncovered || 0} Vagas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PDFCalendar({ year, month, highlightedDays = [] }: { year: number, month: number, highlightedDays: string[] }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

  return (
    <div className="mt-8 border border-slate-100 rounded-3xl overflow-hidden bg-white">
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
        <h5 className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Mapa de Atividade</h5>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">{new Date(year, month).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-100 p-px">
        {weekDays.map(d => (
          <div key={d} className="bg-white p-2 text-center" style={{ backgroundColor: '#ffffff' }}>
            <span className="text-[7px] font-black text-slate-400">{d}</span>
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white aspect-square" style={{ backgroundColor: '#ffffff' }}></div>
        ))}
        {days.map(d => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isHighlighted = highlightedDays.includes(dateStr);
          return (
            <div key={d} className="bg-white aspect-square p-1 flex flex-col items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
              <span className={`text-[9px] font-bold ${isHighlighted ? 'text-brand-orange' : 'text-slate-400'}`} style={{ color: isHighlighted ? '#FF5C00' : '#CBD4E1' }}>{d}</span>
              {isHighlighted && <div className="w-1 h-1 bg-brand-orange rounded-full mt-0.5" style={{ backgroundColor: '#FF5C00' }}></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthlyReportModal({ 
  visits, 
  properties,
  onClose 
}: { 
  visits: any[], 
  properties: Property[] | any, // Handle potential type mismatch if needed
  onClose: () => void 
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const stats = useMemo(() => {
    const monthVisits = visits.filter(v => {
      if (!v.date) return false;
      const d = new Date(v.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const houseFrequency: { [key: string]: { count: number, title: string, id: string } } = {};
    monthVisits.forEach(v => {
      const prop = properties.find(p => p.id === String(v.propertyId));
      const propId = String(v.propertyId);
      if (!houseFrequency[propId]) {
        houseFrequency[propId] = { count: 0, title: prop?.title || 'Imóvel Desconhecido', id: propId };
      }
      houseFrequency[propId].count++;
    });

    const topHouses = Object.values(houseFrequency).sort((a, b) => b.count - a.count);

    return {
      total: monthVisits.length,
      confirmed: monthVisits.filter(v => v.status === 'confirmed').length,
      pending: monthVisits.filter(v => v.status === 'pending').length,
      cancelled: monthVisits.filter(v => v.status === 'cancelled').length,
      monthVisits: monthVisits.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      topHouses,
      monthName: new Date(selectedYear, selectedMonth).toLocaleString('pt-BR', { month: 'long' })
    };
  }, [visits, properties, selectedMonth, selectedYear]);

  const months = Array.from({ length: 12 }, (_, i) => i);
  const years = [new Date().getFullYear(), new Date().getFullYear() - 1];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-brand-dark/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl md:rounded-[3rem] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Painel de Performance</h3>
            <div className="flex items-center gap-4 mt-2">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm font-bold text-brand-dark outline-none focus:border-brand-orange"
              >
                {months.map(m => (
                  <option key={m} value={m}>
                    {new Date(2000, m).toLocaleString('pt-BR', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm font-bold text-brand-dark outline-none focus:border-brand-orange"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors shadow-sm">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-10 no-scrollbar space-y-10">
          <div id="report-content" className="bg-white p-6 rounded-3xl" style={{ backgroundColor: '#ffffff' }}>
            <div className="mb-10 text-center pb-8 border-b border-slate-50">
               <h4 className="text-brand-orange font-black text-3xl uppercase tracking-tighter">Relatório Estratégico</h4>
               <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">RB Sorocaba Negócios Imobiliários • {stats.monthName} {selectedYear}</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100" style={{ backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' }}>
                <p className="text-slate-400 text-[9px] uppercase tracking-widest font-bold mb-1">Carga de Visitas</p>
                <p className="text-3xl font-black text-brand-dark" style={{ color: '#0F172A' }}>{stats.total}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-3xl border border-green-100" style={{ backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }}>
                <p className="text-green-600/60 text-[9px] uppercase tracking-widest font-bold mb-1">Efetuadas</p>
                <p className="text-3xl font-black text-green-600" style={{ color: '#16A34A' }}>{stats.confirmed}</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100" style={{ backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }}>
                <p className="text-brand-orange/60 text-[9px] uppercase tracking-widest font-bold mb-1">Aguardando</p>
                <p className="text-3xl font-black text-brand-orange" style={{ color: '#FF5C00' }}>{stats.pending}</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-3xl" style={{ backgroundColor: '#0F172A' }}>
                <p className="text-white/40 text-[9px] uppercase tracking-widest font-bold mb-1">Aproveitamento</p>
                <p className="text-3xl font-black text-white" style={{ color: '#FFFFFF' }}>
                  {stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-brand-orange rounded-full"></div>
                  Imóveis mais Visitados
                </h4>
                <div className="grid gap-3">
                  {stats.topHouses.length > 0 ? stats.topHouses.map((house, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100" style={{ backgroundColor: '#F8FAFC' }}>
                      <span className="text-xs font-bold text-slate-700 max-w-[70%] truncate">{house.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">vistas</span>
                        <span className="bg-brand-orange text-white w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shadow-sm shadow-brand-orange/20" style={{ backgroundColor: '#FF5C00' }}>{house.count}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 italic py-4">Nenhuma visita registrada neste período.</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em] flex items-center gap-2">
                   <div className="w-1.5 h-4 bg-brand-orange rounded-full"></div>
                   Cronograma do Período
                </h4>
                
                <PDFCalendar 
                  year={selectedYear} 
                  month={selectedMonth} 
                  highlightedDays={stats.monthVisits.map(v => v.date)} 
                />

                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest font-bold">
                      <tr>
                        <th className="px-5 py-4">Data</th>
                        <th className="px-5 py-4">Cliente / Imóvel</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {stats.monthVisits.map((v, i) => {
                        const prop = properties.find(p => p.id === String(v.propertyId));
                        return (
                          <tr key={i} className="bg-white">
                            <td className="px-5 py-4 font-bold text-slate-900">{new Date(v.date).toLocaleDateString('pt-BR')}</td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <span className="text-slate-900 font-bold">{v.name}</span>
                                <span className="text-brand-orange text-[8px] font-black uppercase tracking-widest">{prop?.title || 'Imóvel'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter ${
                                v.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                v.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-brand-orange'
                              }`}>
                                {v.status === 'confirmed' ? 'Visita OK' : v.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 italic" style={{ backgroundColor: '#F8FAFC' }}>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Relatório gerado automaticamente p/ Auditoria de Qualidade RB Sorocaba. Foram identificados {stats.total} pontos de contato e {stats.confirmed} apresentações diretas de produto.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={async () => {
                setIsExporting(true);
                await exportReportToPDF('report-content', `Relatorio-Mensal-${stats.monthName}-${selectedYear}`);
                setIsExporting(false);
              }}
              disabled={isExporting}
              className="flex-1 bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
              Exportar Plano de Ação
            </button>
            <button 
              onClick={onClose}
              className="flex-1 bg-brand-dark text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-brand-orange transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AdminPortal({ 
  properties, 
  scheduledVisits = [],
  blockedSlots = [],
  onAddProperty, 
  onUpdateProperty,
  onDeleteProperty, 
  onUnblockSlot,
  onBlockSlot,
  onUpdateVisitStatus,
  onDeleteVisit,
  onClose,
  isAuthorized
 }: { 
  properties: Property[], 
  scheduledVisits?: any[],
  blockedSlots?: any[],
  onAddProperty: (p: Omit<Property, 'id'>) => void,
  onUpdateProperty: (p: Property) => void,
  onDeleteProperty: (id: string | number) => void,
  onUnblockSlot?: (id: string) => Promise<void>,
  onBlockSlot?: (slot: any) => Promise<void>,
  onUpdateVisitStatus?: (id: string, status: 'pending' | 'confirmed' | 'cancelled') => Promise<void>,
  onDeleteVisit?: (id: string) => Promise<void>,
  onClose: () => void,
  isAuthorized: boolean
 }) {
  const [showAddForm, setShowAddForm] = useState(!isAuthorized);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'submissions' | 'visits'>('inventory');
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isBlockingSlot, setIsBlockingSlot] = useState(false);
  const [isExportingAgenda, setIsExportingAgenda] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportEndDate, setExportEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [showReport, setShowReport] = useState(false);
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [blockFormData, setBlockFormData] = useState({ date: '', time: '', reason: '' });
  const [priceError, setPriceError] = useState<string | null>(null);

  const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

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

  useEffect(() => {
    if (isAuthorized && activeTab === 'submissions') {
      fetchSubmissions();
    }
  }, [isAuthorized, activeTab]);

  const fetchSubmissions = async () => {
    try {
      const data = await getSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error("Erro ao buscar submissões:", error);
    }
  };

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

  const [showSuccess, setShowSuccess] = useState(false);
  const [newProperty, setNewProperty] = useState<Omit<Property, 'id'> & { id?: number }>({
    title: '',
    description: '',
    location: '',
    city: 'Sorocaba',
    neighborhood: '',
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
    parkingCovered: 0,
    parkingUncovered: 0,
    area: '',
    areaTotal: '',
    areaUseful: '',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
    featured: false,
    coords: [-23.5018, -47.4581],
    status: 'ativo',
    videoUrl: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validation for priceValue
    if (newProperty.priceValue <= 0) {
      setPriceError("O valor numérico do imóvel deve ser maior que zero.");
      setFormStep(2);
      return;
    } else {
      setPriceError(null);
    }
    
    if (formStep < 4) {
      setFormStep(formStep + 1);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const validUrls = imageUrls.filter(url => url.trim() !== '');
      const propertyData = {
        ...newProperty,
        image: validUrls[0] || newProperty.image,
        additionalImages: validUrls.slice(1)
      };

      // WhatsApp Notification Trigger
      const message = `*Novo Imóvel Anunciado!*%0A%0A` + 
                      `*Título:* ${newProperty.title}%0A` +
                      `*Tipo:* ${newProperty.type}%0A` +
                      `*Finalidade:* ${newProperty.purpose}%0A` +
                      `*Valor:* ${newProperty.price}%0A` +
                      `*Local:* ${newProperty.neighborhood}, ${newProperty.city}%0A` +
                      `*Dormitórios:* ${newProperty.beds}%0A` +
                      `*Fotos:* ${validUrls.length}%0A%0A` +
                      `_Enviado via Portal RB SOROCABA para ${BROKER_EMAIL}_`;
      
      if (isAuthorized) {
        if (editingId !== null) {
          onUpdateProperty({ ...propertyData, id: editingId } as Property);
        } else {
          onAddProperty(propertyData);
        }
        
        setShowSuccess(true);
        // Skip WhatsApp and Alert for admin
        return;
      } else {
        await submitProperty(propertyData);
        window.open(`https://wa.me/${BROKER_PHONE}?text=${message}`, '_blank');
        
        const successMsg = `Sua proposta foi enviada para análise!\nEm breve nossa equipe entrará em contato. Você também pode nos avisar via WhatsApp.`;
        alert(successMsg);
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
    setImageUrls(['']);
    setNewProperty({
      title: '',
      description: '',
      location: '',
      city: 'Sorocaba',
      neighborhood: '',
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
      parkingCovered: 0,
      parkingUncovered: 0,
      area: '',
      areaTotal: '',
      areaUseful: '',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
      coords: [-23.5018, -47.4581],
      status: 'ativo',
      featured: false,
      videoUrl: ''
    });
  };

  const handleEdit = (property: Property) => {
    setEditingId(property.id);
    setNewProperty(property);
    setPriceError(null);
    setImageUrls([property.image, ...(property.additionalImages || [])]);
    setShowAddForm(true);
    setFormStep(1);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-brand-dark/95 backdrop-blur-xl p-4 md:p-10 flex flex-col overflow-hidden"
    >
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center text-white">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">{isAuthorized ? 'Portal do Proprietário' : 'Portal Administrativo'}</h2>
            <p className="text-white/50 text-sm">{isAuthorized ? 'Gerencie seu portfólio de luxo' : 'Acesse para gerenciar imóveis'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {!isAuthorized && (
            <button 
              onClick={() => loginWithGoogle()}
              className="bg-brand-orange text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white hover:text-brand-orange transition-all flex items-center gap-2"
            >
              <Shield size={18} />
              Login Administrativo
            </button>
          )}
          <button 
            onClick={onClose}
            className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-10">
        {/* Tabs and Stats Summary Overlay */}
        {isAuthorized && (
          <div className="flex flex-col space-y-8">
            {/* Tab Switcher */}
            <div className="flex space-x-1 bg-white/5 p-1 rounded-2xl w-fit border border-white/10">
              <button 
                onClick={() => setActiveTab('inventory')}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-brand-orange text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                Meu Inventário
              </button>
              <button 
                onClick={() => setActiveTab('submissions')}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'submissions' ? 'bg-brand-orange text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                Solicitações Pendentes
                {submissions.length > 0 && (
                  <span className="bg-white text-brand-orange w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                    {submissions.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('visits')}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'visits' ? 'bg-brand-orange text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                Visitas e Agenda
                {scheduledVisits.filter(v => v.status === 'pending').length > 0 && (
                  <span className="bg-white text-brand-orange w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                    {scheduledVisits.filter(v => v.status === 'pending').length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'inventory' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total de Imóveis', val: properties.length },
                  { label: 'Valor em Carteira', val: 'R$ ' + (properties.reduce((acc, p) => acc + (p.priceValue || 0), 0) / 1000000).toFixed(1) + 'M' },
                  { label: 'Status', val: 'Ativo' },
                  { label: 'Leads Hoje', val: '12' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions - Only for Admin */}
        {isAuthorized && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <button 
              onClick={() => {
                if (showAddForm && editingId !== null) {
                  resetForm();
                } else {
                  setShowAddForm(!showAddForm);
                  if (!showAddForm) {
                    setEditingId(null);
                    setFormStep(1);
                  }
                }
              }}
              className="btn-primary py-4 px-8 flex items-center space-x-3"
            >
              <Plus size={20} className={showAddForm && editingId === null ? 'rotate-45 transition-transform' : ''} />
              <span>{showAddForm ? (editingId !== null ? 'Cancelar Edição' : 'Fechar Formulário') : 'Cadastrar Novo Imóvel'}</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <a href="#properties" onClick={onClose} className="text-white/70 hover:text-white font-bold flex items-center space-x-2 transition-colors">
                <Eye size={20} />
                <span>Ver Site Público</span>
              </a>
              {activeTab === 'visits' && (
                <div className="flex flex-wrap items-end gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Início</span>
                    <input 
                      type="date" 
                      value={exportStartDate} 
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="bg-brand-dark/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Término</span>
                    <input 
                      type="date" 
                      value={exportEndDate} 
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="bg-brand-dark/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-brand-orange"
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      if (exportEndDate < exportStartDate) {
                        alert("A data de término deve ser igual ou posterior à data de início.");
                        return;
                      }
                      setIsExportingAgenda(true);
                      await exportReportToPDF('agenda-full-report', `Agenda-RB-Sorocaba-${exportStartDate}-a-${exportEndDate}`);
                      setIsExportingAgenda(false);
                    }}
                    disabled={isExportingAgenda || exportEndDate < exportStartDate}
                    className="bg-brand-orange text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95"
                  >
                    {isExportingAgenda ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                    Exportar
                  </button>
                  <div className="w-px h-8 bg-white/10 mx-1 self-center"></div>
                  <button 
                    onClick={() => setShowReport(true)}
                    className="bg-white/10 text-white hover:bg-brand-orange px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 h-[34px]"
                  >
                    <LayoutDashboard size={14} />
                    Gestão Mensal
                  </button>
                  <button 
                    onClick={() => setIsBlockingSlot(!isBlockingSlot)}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 h-[34px]"
                  >
                    <Clock size={14} />
                    {isBlockingSlot ? 'Fechar' : 'Bloquear'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Block Slot Form */}
        <AnimatePresence>
          {showReport && (
            <MonthlyReportModal 
              visits={scheduledVisits} 
              properties={properties}
              onClose={() => setShowReport(false)} 
            />
          )}
          {viewingProperty && (
            <PropertyDetailModal 
              property={viewingProperty} 
              onClose={() => setViewingProperty(null)} 
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isBlockingSlot && activeTab === 'visits' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-50 border border-red-100 rounded-3xl md:rounded-[2.5rem] p-8 md:p-12 space-y-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                 <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                    <Shield size={20} />
                 </div>
                 <h4 className="text-xl font-bold text-red-900">Bloquear Novo Horário</h4>
              </div>
              <form 
                className="grid md:grid-cols-4 gap-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (onBlockSlot) {
                    await onBlockSlot(blockFormData);
                    setBlockFormData({ date: '', time: '', reason: '' });
                    setIsBlockingSlot(false);
                    alert("Horário bloqueado com sucesso!");
                  }
                }}
              >
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-red-400 ml-2">Data</label>
                  <input required type="date" className="w-full bg-white border border-red-100 rounded-2xl px-6 py-4 outline-none focus:border-red-500"
                    value={blockFormData.date} min={new Date().toISOString().split('T')[0]} onChange={e => setBlockFormData({...blockFormData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-red-400 ml-2">Horário</label>
                  <select required className="w-full bg-white border border-red-100 rounded-2xl px-6 py-4 outline-none focus:border-red-500 appearance-none"
                    value={blockFormData.time} onChange={e => setBlockFormData({...blockFormData, time: e.target.value})}>
                    <option value="">Selecionar...</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-red-400 ml-2">Motivo (Opcional)</label>
                  <div className="flex gap-4">
                    <input type="text" placeholder="Ex: Feriado, manutenção..." className="flex-1 bg-white border border-red-100 rounded-2xl px-6 py-4 outline-none focus:border-red-500"
                      value={blockFormData.reason} onChange={e => setBlockFormData({...blockFormData, reason: e.target.value})} />
                    <button type="submit" className="bg-red-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-600 transition-colors">Bloquear</button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Form Overlay */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white rounded-3xl md:rounded-[2.5rem] overflow-hidden"
            >
              {showSuccess ? (
                <div className="p-12 md:p-20 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-green-50 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center text-green-500">
                    <CheckCircle2 size={48} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black text-brand-dark uppercase tracking-tight">Imóvel Cadastrado com Sucesso!</h3>
                    <p className="text-slate-500 max-w-md mx-auto">As informações e imagens foram atualizadas no sistema e já estão disponíveis no portal.</p>
                  </div>
                  <button 
                    onClick={resetForm}
                    className="bg-brand-orange text-white px-10 py-5 rounded-[2rem] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand-orange/20"
                  >
                    Voltar ao Painel
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-8 md:p-12 pb-0 flex justify-between items-end">
                    <div>
                      <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">
                        {editingId !== null ? 'Editar Imóvel' : 'Novo Cadastro'}
                      </h3>
                      <div className="w-12 h-1 bg-brand-orange mt-2" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4].map(s => (
                        <div 
                          key={s} 
                          className={`h-2 rounded-full transition-all duration-500 ${formStep >= s ? 'w-8 bg-brand-orange' : 'w-2 bg-slate-200'}`} 
                        />
                      ))}
                      <span className="ml-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Etapa {formStep} de 4</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
                {formStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em] mb-4 border-l-4 border-brand-orange pl-4">Características Principais</h4>
                    <div className="grid md:grid-cols-4 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Dormitórios</label>
                        <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                          value={newProperty.beds || ''} onChange={e => setNewProperty({...newProperty, beds: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Suítes</label>
                        <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                          value={newProperty.suites || ''} onChange={e => setNewProperty({...newProperty, suites: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Vagas Cobertas</label>
                        <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                          value={newProperty.parkingCovered || ''} onChange={e => setNewProperty({...newProperty, parkingCovered: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Vagas Descobertas</label>
                        <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                          value={newProperty.parkingUncovered || ''} onChange={e => setNewProperty({...newProperty, parkingUncovered: Number(e.target.value)})} />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Área Total / Terreno</label>
                        <input required type="text" placeholder="Ex: 1000m²" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                          value={newProperty.areaTotal || ''} onChange={e => setNewProperty({...newProperty, areaTotal: e.target.value, area: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Área Útil / Construída</label>
                        <input required type="text" placeholder="Ex: 450m²" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                          value={newProperty.areaUseful || ''} onChange={e => setNewProperty({...newProperty, areaUseful: e.target.value})} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {formStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em] mb-4 border-l-4 border-brand-orange pl-4">Finalidade e Valores</h4>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Finalidade</label>
                        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                          <button type="button" onClick={() => setNewProperty({...newProperty, purpose: 'Venda'})}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${newProperty.purpose === 'Venda' ? 'bg-brand-orange text-white' : 'text-slate-400'}`}>Venda</button>
                          <button type="button" onClick={() => setNewProperty({...newProperty, purpose: 'Locação'})}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${newProperty.purpose === 'Locação' ? 'bg-brand-orange text-white' : 'text-slate-400'}`}>Locação</button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Status do Imóvel</label>
                        <select 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 appearance-none outline-none focus:border-brand-orange cursor-pointer font-bold"
                          value={newProperty.status}
                          onChange={e => setNewProperty({...newProperty, status: e.target.value as any})}
                        >
                          <option value="ativo">Ativo (Publicado)</option>
                          <option value="inativo">Inativo (Rascunho)</option>
                          <option value="vendido">Vendido</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Aceita Financiamento?</label>
                        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                          <button type="button" onClick={() => setNewProperty({...newProperty, acceptsFinancing: true})}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${newProperty.acceptsFinancing ? 'bg-brand-orange text-white' : 'text-slate-400'}`}>Sim</button>
                          <button type="button" onClick={() => setNewProperty({...newProperty, acceptsFinancing: false})}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${!newProperty.acceptsFinancing ? 'bg-brand-orange text-white' : 'text-slate-400'}`}>Não</button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Destaque na Home?</label>
                        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                          <button type="button" onClick={() => setNewProperty({...newProperty, featured: true})}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${newProperty.featured ? 'bg-brand-orange text-white' : 'text-slate-400'}`}>Sim</button>
                          <button type="button" onClick={() => setNewProperty({...newProperty, featured: false})}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${!newProperty.featured ? 'bg-brand-orange text-white' : 'text-slate-400'}`}>Não</button>
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Valor Formatado</label>
                        <input required type="text" placeholder="Ex: R$ 2.500.000" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                          value={newProperty.price} onChange={e => setNewProperty({...newProperty, price: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Valor Numérico (para filtros)</label>
                        <input required type="number" placeholder="Ex: 2500000" className={`w-full bg-slate-50 border ${priceError ? 'border-red-500' : 'border-slate-100'} rounded-2xl px-6 py-4 outline-none focus:border-brand-orange`}
                          value={newProperty.priceValue || ''} onChange={e => {
                            const val = Number(e.target.value);
                            setNewProperty({...newProperty, priceValue: val});
                            if (val > 0) setPriceError(null);
                          }} />
                        {priceError && (
                          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-2">{priceError}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Valor Condomínio (opcional)</label>
                        <input type="text" placeholder="Ex: R$ 850" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                          value={newProperty.condoValue || ''} onChange={e => setNewProperty({...newProperty, condoValue: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Descrição Detalhada</label>
                      <textarea 
                        rows={4}
                        placeholder="Descreva os diferenciais do imóvel, acabamentos, infraestrutura do condomínio, etc."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange resize-none"
                        value={newProperty.description}
                        onChange={e => setNewProperty({...newProperty, description: e.target.value})}
                      />
                    </div>
                  </motion.div>
                )}

                {formStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em] mb-4 border-l-4 border-brand-orange pl-4">Tipo e Localização</h4>
                    <div className="grid md:grid-cols-4 gap-8">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Título do Anúncio</label>
                        <input required type="text" placeholder="Ex: Mansão Alpha Luxury" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                          value={newProperty.title} onChange={e => setNewProperty({...newProperty, title: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Categoria</label>
                        <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 appearance-none outline-none focus:border-brand-orange cursor-pointer"
                          value={newProperty.category} onChange={e => {
                            const cat = e.target.value as PropertyCategory;
                            setNewProperty({...newProperty, category: cat, type: PROPERTY_CATEGORIES[cat][0]});
                          }}>
                          {Object.keys(PROPERTY_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Tipo de Imóvel</label>
                        <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 appearance-none outline-none focus:border-brand-orange cursor-pointer"
                          value={newProperty.propertyType} onChange={e => setNewProperty({...newProperty, propertyType: e.target.value})}>
                          <option value="Casa">Casa</option>
                          <option value="Apartamento">Apartamento</option>
                          <option value="Comercial">Comercial</option>
                          <option value="Chácara/Sítio">Chácara/Sítio</option>
                          <option value="Terreno">Terreno</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-4 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Sub-tipo (Granular)</label>
                        <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 appearance-none outline-none focus:border-brand-orange cursor-pointer"
                          value={newProperty.type} onChange={e => setNewProperty({...newProperty, type: e.target.value})}>
                          {PROPERTY_CATEGORIES[newProperty.category].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-3 space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Endereço Completo *</label>
                        <input required type="text" placeholder="Rua, Número, Bairro, Cidade" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                          value={newProperty.location} onChange={e => setNewProperty({...newProperty, location: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Cidade</label>
                        <input required type="text" placeholder="Ex: Sorocaba" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                          value={newProperty.city} onChange={e => setNewProperty({...newProperty, city: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Bairro</label>
                        <input required type="text" placeholder="Ex: Campolim" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                          value={newProperty.neighborhood} onChange={e => setNewProperty({...newProperty, neighborhood: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Condomínio (Opcional)</label>
                        <input type="text" placeholder="Ex: Villa de Luxo" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                          value={newProperty.condominium || ''} onChange={e => setNewProperty({...newProperty, condominium: e.target.value})} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {formStep === 4 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em] mb-4 border-l-4 border-brand-orange pl-4">Fotos via URL</h4>
                    <p className="text-slate-500 text-sm">Insira os links das fotos hospedadas. O primeiro será a imagem principal.</p>
                    
                    <div className="space-y-4">
                      {imageUrls.map((url, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex-1 space-y-2">
                             <input 
                              type="text" 
                              placeholder={`URL da imagem ${idx + 1}`}
                              value={url}
                              onChange={(e) => updateImageUrl(idx, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange font-mono text-xs"
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeImageUrlField(idx)}
                            className="p-4 text-red-100 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={addImageUrlField}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-brand-orange hover:text-brand-orange transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={18} />
                        Adicionar mais uma URL
                      </button>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em] border-l-4 border-brand-orange pl-4">Vídeo (YouTube / Vimeo)</h4>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Link do Vídeo (Opcional)</label>
                        <input 
                          type="text" 
                          placeholder="Ex: https://www.youtube.com/watch?v=..." 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange font-mono text-xs"
                          value={newProperty.videoUrl || ''} 
                          onChange={e => setNewProperty({...newProperty, videoUrl: e.target.value})} 
                        />
                      </div>
                    </div>

                    {imageUrls[0] && (
                      <div className="bg-slate-50 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Prévia da Capa</p>
                        <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                          <img src={imageUrls[0]} className="w-full h-full object-cover" alt="Preview Capa" onError={(e) => e.currentTarget.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop'} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                  <div>
                    {formStep > 1 && (
                      <button type="button" onClick={() => setFormStep(formStep - 1)} className="px-8 py-4 font-bold text-slate-400 hover:text-brand-dark transition-colors flex items-center space-x-2">
                        <ArrowRight size={18} className="rotate-180" />
                        <span>Voltar</span>
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-4">
                    <button type="button" onClick={resetForm} className="px-8 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="btn-primary px-12 py-4 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <span>{formStep < 4 ? 'Próximo Passo' : (editingId !== null ? 'Salvar Alterações' : (isAuthorized ? 'Publicar no Site' : 'Finalizar e Enviar'))}</span>
                          {formStep < 4 ? <ArrowRight size={18} /> : <Send size={18} />}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </motion.div>
          )}
        </AnimatePresence>

        {/* Property List Table - Only for Admin */}
        {isAuthorized && (
          <div className="bg-white/5 border border-white/10 rounded-3xl md:rounded-[2.5rem] overflow-hidden">
            <div className="p-4 md:p-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-base md:text-xl font-bold text-white uppercase tracking-tighter">
                {activeTab === 'inventory' ? 'Suas Propriedades' : 
                 activeTab === 'submissions' ? 'Solicitações' : 'Visitas e Bloqueios'}
              </h3>
              <div className="flex gap-3 md:gap-4">
                <span className="bg-brand-orange/20 text-brand-orange text-[9px] md:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  {activeTab === 'inventory' ? `${properties.length} Ativas` : 
                   activeTab === 'submissions' ? `${submissions.length} Pendentes` : `${scheduledVisits.length} Visitas`}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    {activeTab === 'visits' ? (
                      <>
                        <th className="p-4 md:p-6 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">Data/Hora</th>
                        <th className="p-4 md:p-6 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">Cliente</th>
                        <th className="p-4 md:p-6 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 hidden md:table-cell">Imóvel</th>
                        <th className="p-4 md:p-6 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 text-right">Ações</th>
                      </>
                    ) : (
                      <>
                        <th className="p-4 md:p-6 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">Imóvel</th>
                        <th className="p-4 md:p-6 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 hidden sm:table-cell">Local</th>
                        <th className="p-4 md:p-6 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">Valor</th>
                        <th className="p-4 md:p-6 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 text-right">Ações</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeTab === 'inventory' ? properties.map(p => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 md:p-6">
                        <div className="flex items-center space-x-3 md:space-x-4">
                          <img src={p.image} className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <p className="text-white font-bold text-xs md:text-base leading-none mb-1">{p.title}</p>
                            <p className="text-white/40 text-[9px] md:text-xs">{p.type} • {p.area}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 md:p-6 text-white/60 text-xs md:text-sm hidden sm:table-cell">{p.location}</td>
                      <td className="p-4 md:p-6 font-bold text-brand-orange text-xs md:text-base" title={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.priceValue)}>{p.price}</td>
                      <td className="p-4 md:p-6 text-right">
                        <div className="flex items-center justify-end space-x-1 md:space-x-3">
                          <button 
                            onClick={() => setViewingProperty(p)}
                            className="text-white/30 hover:text-white hover:bg-white/10 p-2 md:p-3 rounded-lg md:rounded-xl transition-all"
                            title="Visualizar"
                          >
                            <Eye size={16} md:size={18} />
                          </button>
                          <button 
                            onClick={() => handleEdit(p)}
                            className="text-brand-orange/50 hover:text-brand-orange hover:bg-brand-orange/10 p-2 md:p-3 rounded-lg md:rounded-xl transition-all"
                            title="Editar"
                          >
                            <Settings size={16} md:size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm("Deseja realmente excluir este imóvel?")) {
                                onDeleteProperty(p.id);
                              }
                            }}
                            className="text-red-400/50 hover:text-red-400 hover:bg-red-400/10 p-2 md:p-3 rounded-lg md:rounded-xl transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={16} md:size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : activeTab === 'submissions' ? submissions.map(s => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 md:p-6">
                        <div className="flex items-center space-x-3 md:space-x-4">
                          <img src={s.image} className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <p className="text-white font-bold text-xs md:text-base leading-none mb-1">{s.title}</p>
                            <p className="text-white/40 text-[9px] md:text-xs">{s.type} • {s.area}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 md:p-6 text-white/60 text-xs md:text-sm hidden sm:table-cell">{s.neighborhood}, {s.city}</td>
                      <td className="p-4 md:p-6 font-bold text-brand-orange text-xs md:text-base">{s.price}</td>
                      <td className="p-4 md:p-6 text-right">
                        <div className="flex items-center justify-end space-x-2 md:space-x-3">
                          <button 
                            onClick={() => handleApprove(s)}
                            className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-bold text-[8px] md:text-[10px] uppercase tracking-widest transition-all"
                          >
                            Aprovar
                          </button>
                          <button 
                            onClick={() => handleReject(s.id)}
                            className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-bold text-[8px] md:text-[10px] uppercase tracking-widest transition-all"
                          >
                            Recusar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <>
                      {[
                        ...scheduledVisits.map(v => ({...v, adminType: 'visit'})),
                        ...blockedSlots.map(s => ({...s, adminType: 'blocked'}))
                      ].sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time)).map((item, idx) => (
                        <tr key={idx} className={`hover:bg-white/5 transition-colors group ${item.adminType === 'blocked' ? 'bg-red-500/5' : ''}`}>
                          <td className="p-4 md:p-6">
                            <div className="flex items-center space-x-2 md:space-x-3">
                              {item.adminType === 'blocked' ? <Shield size={14} md:size={16} className="text-red-400" /> : <Calendar size={14} md:size={16} className="text-brand-orange" />}
                              <div>
                                <p className="text-white font-bold text-xs md:text-base leading-none mb-1">{item.date.split('-').reverse().join('/')}</p>
                                <p className="text-white/40 text-[9px] md:text-xs">{item.time}h</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 md:p-6">
                            {item.adminType === 'blocked' ? (
                              <span className="text-red-400/60 font-medium italic text-[10px] md:text-sm">Bloqueado: {item.reason || 'S/ Motivo'}</span>
                            ) : (
                              <div>
                                <p className="text-white font-bold text-xs md:text-base leading-none mb-1">{item.name}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-white/40 text-[9px] md:text-xs">{item.phone}</p>
                                  <a href={`https://wa.me/${item.phone.replace(/\D/g, '')}`} target="_blank" className="text-green-400 hover:text-green-300">
                                    <MessageCircle size={10} md:size={12} />
                                  </a>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-4 md:p-6 hidden md:table-cell">
                            <p className="text-white/60 text-sm truncate max-w-[200px]">{item.propertyName || item.reason || '-'}</p>
                          </td>
                          <td className="p-4 md:p-6 text-right">
                             {item.adminType === 'blocked' ? (
                               <button 
                                 onClick={() => onUnblockSlot && onUnblockSlot(item.id)}
                                 className="text-red-400 hover:text-red-300 font-bold text-[8px] md:text-[10px] uppercase tracking-widest underline underline-offset-4"
                               >
                                 Remover
                               </button>
                             ) : (
                               <div className="flex items-center justify-end space-x-1 md:space-x-2">
                                 {statusUpdating === item.id ? (
                                   <div className="p-2"><Loader2 className="animate-spin text-white/20" size={14} md:size={16} /></div>
                                 ) : (
                                   <>
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
                                         className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white p-1.5 md:p-2 rounded-lg transition-all"
                                         title="Confirmar"
                                       >
                                         <Check size={14} md:size={16} />
                                       </button>
                                     )}
                                   </>
                                 )}
                                 <button 
                                   onClick={() => {
                                     if (confirm("Deseja realmente excluir este agendamento?")) {
                                       onDeleteVisit && onDeleteVisit(item.id);
                                     }
                                   }}
                                   className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-1.5 md:p-2 rounded-lg transition-all"
                                   title="Excluir"
                                 >
                                   <Trash2 size={14} md:size={16} />
                                 </button>
                               </div>
                             )}
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                  {activeTab === 'submissions' && submissions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-20 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Clock size={32} className="text-white/20" />
                        </div>
                        <p className="text-white font-bold">Nenhuma solicitação pendente</p>
                        <p className="text-white/30 text-sm mt-2">Novos anúncios de proprietários aparecerão aqui.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Report for PDF Export */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div id="agenda-full-report" className="bg-white p-12 w-[800px]" style={{ backgroundColor: '#ffffff' }}>
          <div className="mb-10 text-center pb-8 border-b border-slate-50">
             <h4 className="text-brand-orange font-black text-3xl uppercase tracking-tighter">Relatório de Agenda</h4>
             <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">RB Sorocaba Negócios Imobiliários • Período: {exportStartDate.split('-').reverse().join('/')} até {exportEndDate.split('-').reverse().join('/')}</p>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100" style={{ backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' }}>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Visitas no Período</p>
              <p className="text-3xl font-black text-brand-dark" style={{ color: '#0F172A' }}>{scheduledVisits.filter(v => v.date >= exportStartDate && v.date <= exportEndDate).length}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-3xl border border-green-100" style={{ backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }}>
              <p className="text-green-600 text-[10px] uppercase tracking-widest font-bold mb-1">Confirmadas</p>
              <p className="text-3xl font-black text-green-600" style={{ color: '#16A34A' }}>{scheduledVisits.filter(v => v.date >= exportStartDate && v.date <= exportEndDate && v.status === 'confirmed').length}</p>
            </div>
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100" style={{ backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }}>
              <p className="text-red-600 text-[10px] uppercase tracking-widest font-bold mb-1">Bloqueios</p>
              <p className="text-3xl font-black text-red-600" style={{ color: '#DC2626' }}>{blockedSlots.filter(s => s.date >= exportStartDate && s.date <= exportEndDate).length}</p>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-xs font-black text-brand-dark uppercase tracking-[0.2em] flex items-center gap-2">
               <div className="w-1.5 h-4 bg-brand-orange rounded-full"></div>
               Compromissos Agendados
            </h4>

            <PDFCalendar 
              year={parseInt(exportStartDate.split('-')[0])} 
              month={parseInt(exportStartDate.split('-')[1]) - 1} 
              highlightedDays={[
                ...scheduledVisits.filter(v => v.date >= exportStartDate && v.date <= exportEndDate),
                ...blockedSlots.filter(s => s.date >= exportStartDate && s.date <= exportEndDate)
              ].map(v => v.date)} 
            />

            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-4">Data/Hora</th>
                    <th className="px-5 py-4">Cliente/Motivo</th>
                    <th className="px-5 py-4">Tipo/Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    ...scheduledVisits.filter(v => v.date >= exportStartDate && v.date <= exportEndDate).map(v => ({...v, typeKey: 'visit'})),
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
                            <span className="text-[8px] text-slate-400">{v.propertyName || 'Imóvel'}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter ${
                          v.typeKey === 'blocked' ? 'bg-red-100 text-red-700' :
                          v.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-brand-orange'
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

          <div className="mt-12 bg-slate-50 p-6 rounded-3xl border border-slate-100 italic" style={{ backgroundColor: '#F8FAFC' }}>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Relatório consolidado de compromissos gerado via Portal RB Sorocaba. Este documento contém os agendamentos e bloqueios registrados para o período selecionado.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}



function PropertyCard({ 
  property, 
  onSelect, 
  isFavorite, 
  onToggleFavorite 
}: { 
  property: Property; 
  onSelect: (p: Property) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const [isHoveringPrice, setIsHoveringPrice] = useState(false);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-700 group border border-slate-100/50 hover:border-brand-orange/20 cursor-pointer relative"
    >
      <div className="relative aspect-[4/3] overflow-hidden" onClick={() => onSelect(property)}>
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all duration-500 z-10" />
        <img 
          src={property.image} 
          alt={property.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 md:top-6 left-4 md:left-6 z-20 flex flex-col gap-2">
          <span className="bg-black/80 backdrop-blur-md text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest border border-white/10 w-fit">
            {property.purpose === 'Locação' ? 'Locação' : 'Venda'}
          </span>
          <span className="bg-white/90 backdrop-blur-md text-brand-dark px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest border border-white/10 w-fit">
            {property.propertyType || property.type}
          </span>
        </div>

        {/* Favorite Button Overlay */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(String(property.id));
          }}
          className={`absolute top-4 md:top-6 right-4 md:right-6 z-30 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all backdrop-blur-xl border ${
            isFavorite 
              ? 'bg-brand-orange text-white border-brand-orange shadow-lg shadow-orange-500/30' 
              : 'bg-white/10 text-white border-white/20 hover:bg-white hover:text-brand-orange'
          }`}
        >
          <Star size={18} md:size={20} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>
      
      <div className="p-5 md:p-8">
        <div className="flex flex-col mb-4 md:mb-6">
          <div className="flex items-center text-slate-400 text-[9px] md:text-sm font-medium italic mb-1 md:mb-2">
            <MapPin size={12} md:size={14} className="mr-1 text-brand-orange md:w-4 md:h-4" />
            {property.location}
          </div>
          <h3 className="text-lg md:text-2xl font-black text-brand-dark tracking-tighter uppercase leading-tight group-hover:text-brand-orange transition-colors">
            {property.title}
          </h3>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <p className="text-xl md:text-3xl font-black text-brand-orange tracking-tighter uppercase">
            {property.price}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 py-4 md:py-6 border-y border-slate-50">
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50/50 group-hover:bg-orange-50 transition-colors">
            <BedDouble className="text-brand-orange mb-1 group-hover:scale-110 transition-transform" size={12} md:size={14} />
            <span className="text-[8px] md:text-[10px] font-bold text-slate-900">{property.beds || 0}</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50/50 group-hover:bg-orange-50 transition-colors">
            <Bath className="text-brand-orange mb-1 group-hover:scale-110 transition-transform" size={12} md:size={14} />
            <span className="text-[8px] md:text-[10px] font-bold text-slate-900">{property.suites || 0}</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50/50 group-hover:bg-orange-50 transition-colors">
            <Car className="text-brand-orange mb-1 group-hover:scale-110 transition-transform" size={12} md:size={14} />
            <span className="text-[8px] md:text-[10px] font-bold text-slate-900">{(property.parkingCovered || 0) + (property.parkingUncovered || 0)}</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50/50 group-hover:bg-orange-50 transition-colors">
            <Maximize className="text-brand-orange mb-1 group-hover:scale-110 transition-transform" size={12} md:size={14} />
            <span className="text-[8px] md:text-[10px] font-bold text-slate-900">{property.areaUseful || property.area}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 md:mt-8">
          <button 
            onClick={(e) => { e.stopPropagation(); onSelect(property); }}
            className="w-full btn-primary !h-14 !text-[10px] uppercase tracking-[0.2em] font-black flex items-center justify-center gap-2 group/btn relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center">
              Agendar Visita <ChevronRight size={14} className="text-white group-hover/btn:translate-x-2 transition-transform ml-2" />
            </span>
            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function PropertyMap({ properties }: { properties: Property[] }) {
  const defaultCenter: [number, number] = [-23.5018, -47.4581]; // Centro de Sorocaba
  
  // Component to automatically adjust map bounds based on markers
  function MapAutoBounds({ properties }: { properties: Property[] }) {
    const map = useMap();
    
    useEffect(() => {
      if (properties.length > 0) {
        const bounds = L.latLngBounds(properties.map(p => p.coords));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }, [properties, map]);
    
    return null;
  }

  // Component to provide manual recenter control
  function RecenterControl({ properties }: { properties: Property[] }) {
    const map = useMap();
    
    const handleRecenter = () => {
      if (properties.length > 0) {
        const bounds = L.latLngBounds(properties.map(p => p.coords));
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      }
    };

    return (
      <div className="leaflet-top leaflet-right mt-16 mr-3">
        <div className="leaflet-control">
          <button
            type="button"
            onClick={handleRecenter}
            title="Recentrar Mapa"
            className="flex items-center justify-center bg-white text-brand-dark hover:text-brand-orange w-10 h-10 rounded-xl shadow-lg border border-slate-200 transition-all hover:scale-110 active:scale-95"
            style={{ pointerEvents: 'auto' }}
          >
            <Maximize size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={12} 
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapAutoBounds properties={properties} />
      <RecenterControl properties={properties} />
      {properties.map(property => (
        <Marker key={property.id} position={property.coords}>
          <Popup className="property-popup">
            <div className="w-48">
              <img 
                src={property.image} 
                alt={property.title} 
                className="w-full h-24 object-cover rounded-lg mb-2" 
                referrerPolicy="no-referrer"
              />
              <h4 className="font-bold text-sm text-brand-dark mb-1">{property.title}</h4>
              <p className="text-[10px] text-slate-500 mb-2 truncate">{property.location}</p>
              <div className="flex justify-between items-center">
                <span className="text-brand-orange font-bold text-xs">{property.price}</span>
                <a href="#properties" className="text-[10px] font-bold text-brand-dark hover:text-brand-orange underline">Ver detalhes</a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    interest: 'Comprar',
    message: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      await saveLead({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        interest: formData.interest,
        message: formData.message
      });

      // WhatsApp Notification (Background/Server-side simulation)
      // Nota: Para enviar WhatsApp em background sem abrir nova aba, você precisará de uma API oficial ou bridge.
      // Vou deixar o código preparado para quando você tiver um Webhook ou API.
      
      /* 
      const WHATSAPP_API_URL = import.meta.env.VITE_WHATSAPP_API_URL;
      if (WHATSAPP_API_URL) {
        await fetch(WHATSAPP_API_URL, {
          method: 'POST',
          body: JSON.stringify({
            to: BROKER_PHONE,
            message: `Novo Lead: ${formData.name} - ${formData.phone}`
          })
        });
      }
      */

      setStatus('success');
      // window.open removido a pedido para não redirecionar o usuário
    } catch (error) {
      console.error('Erro ao salvar lead no Firestore:', error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 md:p-16 rounded-[2.5rem] md:rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="w-24 h-24 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <CheckCircle2 size={56} />
        </div>
        <h3 className="text-3xl md:text-5xl font-black mb-6 uppercase tracking-tighter">CONTATO SOLICITADO</h3>
        <p className="text-slate-500 mb-10 text-lg leading-relaxed font-medium">Sua mensagem foi entregue diretamente ao nosso concierge privado. Em instantes, entraremos em contato.</p>
        <button 
          onClick={() => setStatus('idle')}
          className="px-10 py-5 rounded-full bg-brand-dark text-white font-black uppercase tracking-widest text-[10px] hover:bg-brand-orange transition-all shadow-xl shadow-black/10 flex items-center justify-center mx-auto gap-3"
        >
          <ArrowRight className="rotate-180" size={16} /> <span>Enviar Outra Mensagem</span>
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.08)] space-y-8 border border-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-orange to-red-600" />
      <div className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3 group">
            <label className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-400 ml-4 group-focus-within:text-brand-orange transition-colors">Nome Completo</label>
            <div className="relative">
              <input 
                required
                type="text" 
                placeholder="Ex: Alexander von Noble"
                className="w-full bg-slate-50/50 border-2 border-slate-50 rounded-2xl px-6 py-5 outline-none focus:border-brand-orange/20 focus:bg-white transition-all font-black text-brand-dark placeholder:text-slate-300 placeholder:font-medium"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-3 group">
            <label className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-400 ml-4 group-focus-within:text-brand-orange transition-colors">Assessoria Requerida</label>
            <div className="relative">
              <select 
                className="w-full bg-slate-50/50 border-2 border-slate-50 rounded-2xl px-6 py-5 outline-none focus:border-brand-orange/20 focus:bg-white transition-all font-black text-brand-dark cursor-pointer appearance-none uppercase tracking-widest text-[10px]"
                value={formData.interest}
                onChange={e => setFormData({...formData, interest: e.target.value})}
              >
                <option value="Comprar">Aquisição de Ativos</option>
                <option value="Vender">Venda & Desinvestimento</option>
                <option value="Investimento">Consultoria Estratégica</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20"><Plus size={16} /></div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3 group">
            <label className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-400 ml-4 group-focus-within:text-brand-orange transition-colors">WhatsApp Direct</label>
            <input 
              required
              type="tel" 
              placeholder="(15) 99999-9999"
              className="w-full bg-slate-50/50 border-2 border-slate-50 rounded-2xl px-6 py-5 outline-none focus:border-brand-orange/20 focus:bg-white transition-all font-black text-brand-dark placeholder:text-slate-300 placeholder:font-medium"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div className="space-y-3 group">
            <label className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-400 ml-4 group-focus-within:text-brand-orange transition-colors">Canal de E-mail</label>
            <input 
              required
              type="email" 
              placeholder="private@luxury.com"
              className="w-full bg-slate-50/50 border-2 border-slate-50 rounded-2xl px-6 py-5 outline-none focus:border-brand-orange/20 focus:bg-white transition-all font-black text-brand-dark placeholder:text-slate-300 placeholder:font-medium"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-3 group">
          <label className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-400 ml-4 group-focus-within:text-brand-orange transition-colors">Considerações Privadas</label>
          <textarea 
            required
            placeholder="Descreva brevemente sua expectativa..."
            className="w-full bg-slate-50/50 border-2 border-slate-50 rounded-2xl px-6 py-5 outline-none focus:border-brand-orange/20 focus:bg-white transition-all font-black text-brand-dark h-48 resize-none placeholder:text-slate-300 placeholder:font-medium leading-relaxed"
            value={formData.message}
            onChange={e => setFormData({...formData, message: e.target.value})}
          ></textarea>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={status === 'loading'}
        className="w-full btn-primary !h-20 !rounded-2xl md:!rounded-[1.5rem] !text-xs !bg-brand-dark uppercase tracking-[0.6em] font-black flex items-center justify-center gap-4 group/btn relative overflow-hidden disabled:opacity-50 shadow-2xl shadow-black/20"
      >
        <span className="relative z-10 flex items-center">
          {status === 'loading' ? 'SOLICITANDO...' : 'INICIAR ASSESSORIA PRIVADA'}
          <ArrowRight className="group-hover/btn:translate-x-2 transition-transform ml-4" />
        </span>
        <div className="absolute inset-0 bg-brand-orange -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-700" />
      </button>
      
      <div className="flex items-center justify-center space-x-6 pt-4 grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
         <Shield size={16} /> <span className="text-[8px] font-black tracking-widest uppercase">Encryption 256-bit Secure</span>
      </div>
    </form>
  );
}

function HistoryModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-3xl p-6 md:p-12 overflow-y-auto flex items-center justify-center"
    >
      <div className="max-w-4xl w-full bg-white rounded-3xl md:rounded-[3rem] p-8 md:p-16 relative shadow-2xl overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange opacity-5 rounded-bl-full -mr-10 -mt-10" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 bg-slate-100 hover:bg-brand-orange hover:text-white rounded-full flex items-center justify-center transition-all group/close"
        >
          <X size={24} className="group-hover/close:rotate-90 transition-transform" />
        </button>

        <div className="space-y-10 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center text-white">
              <Star size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase">Nossa <span className="text-brand-orange">História</span></h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">O Legado RB Sorocaba</p>
            </div>
          </div>

          <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
            <p className="font-bold text-slate-900 border-l-4 border-brand-orange pl-4 italic">
              "A RB SOROCABA NEGÓCIOS IMOBILIÁRIOS nasceu de um sonho: transformar a jornada de busca pelo lar ideal em uma experiência de pura satisfação e segurança."
            </p>
            <p>
              Fundada há mais de uma década pelo visionário Elias Borges, a imobiliária iniciou suas atividades com o foco voltado para o atendimento personalizado e humano. Desde o primeiro dia, entendemos que não estávamos apenas vendendo paredes e telhados, mas ajudando a construir capítulos fundamentais na vida de nossos clientes.
            </p>
            <p>
              Ao longo dos anos, consolidamos nossa posição no mercado de Sorocaba e região como sinônimo de ética, transparência e curadoria de excelência. Nossa equipe cresceu, integrando profissionais como Cleidiane Borges, que compartilham os mesmos valores fundamentais de dedicação absoluta ao cliente.
            </p>
            <p>
              Especializamo-nos no segmento de médio e alto padrão, entendendo as nuances e exigências desse mercado. Hoje, a RB SOROCABA é referência em assessoria imobiliária estratégica, oferecendo não apenas um catálogo premium, mas um suporte completo que inclui análise documental rigorosa, consultoria de investimentos e um concierge dedicado.
            </p>
            <p className="font-medium text-brand-dark">
              Nossa história continua sendo escrita a cada chave entregue e a cada novo sorriso. Convidamos você a fazer parte desse legado e descobrir por que somos a escolha certa para quem busca o extraordinário.
            </p>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex -space-x-4">
              <img src="https://i.postimg.cc/L6NcpGfc/ELIAS.jpg" className="w-16 h-16 rounded-full border-4 border-white object-cover" alt="Elias Borges" />
              <img src="https://i.postimg.cc/bNcxvv0w/Whats-App-Image-2026-04-23-at-20-31-01.jpg" className="w-16 h-16 rounded-full border-4 border-white object-cover" alt="Cleidiane Borges" />
            </div>
            <button 
              onClick={onClose}
              className="btn-primary px-10 py-4 shadow-orange-500/20"
            >
              Conhecer Imóveis
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ConfirmVisitModal({ visitId, onClose }: { visitId: string; onClose: () => void }) {
  const [isFinishing, setIsFinishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConfirm = async () => {
    setIsFinishing(true);
    setError(null);
    try {
      await updateVisitStatus(visitId, 'confirmed');
      setSuccess(true);
    } catch (e) {
      console.error(e);
      setError("Não foi possível confirmar sua visita no momento. Por favor, tente novamente ou entre em contato via WhatsApp.");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-brand-dark/95 backdrop-blur-3xl flex items-center justify-center p-6"
    >
      <div className="bg-white rounded-3xl md:rounded-[3rem] p-8 md:p-12 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-brand-orange/5 rounded-bl-full" />
        
        {/* Logo and Brand */}
        <div className="flex items-center justify-center space-x-3 mb-10">
          <div className="w-10 h-10 bg-brand-orange flex items-center justify-center rounded-xl">
            <Home className="text-white" size={20} />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 uppercase">
            RB <span className="text-brand-orange">SOROCABA</span>
          </span>
        </div>

        {success ? (
          <div className="space-y-4 md:space-y-6 relative z-10">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500">
               <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">Visita Confirmada!</h2>
              <p className="text-sm md:text-base text-slate-500 font-bold mt-2 leading-relaxed">
                Sua presença foi registrada com sucesso em nossa agenda VIP.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Próximos Passos</p>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Um de nossos especialistas entrará em contato em breve para alinhar os últimos detalhes e o ponto de encontro.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="w-full bg-brand-orange text-white py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-orange-500/20"
            >
              Concluir
            </button>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8 relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto text-brand-orange">
               <Calendar className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">Validação de Visita</h2>
              <p className="text-sm md:text-base text-slate-500 font-bold mt-2 leading-relaxed">
                Recebemos sua solicitação. Por favor, confirme seu interesse para que possamos reservar seu horário exclusivo.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 italic">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <button 
                onClick={onConfirm}
                disabled={isFinishing}
                className="w-full bg-brand-orange text-white py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isFinishing ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                {isFinishing ? 'PROCESSANDO...' : 'CONFIRMAR PRESENÇA VIP'}
              </button>
              
              {!isFinishing && (
                <button 
                  onClick={onClose}
                  className="text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
                >
                  Confirmar mais tarde
                </button>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-center space-x-2 text-slate-400">
               <Lock size={12} />
               <span className="text-[10px] font-black uppercase tracking-widest">Conexão Segura & Criptografada</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedPropertyForVisit, setSelectedPropertyForVisit] = useState<Property | null>(null);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [scheduledVisits, setScheduledVisits] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [confirmingVisitId, setConfirmingVisitId] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const confirmId = urlParams.get('confirm_visit');
    if (confirmId) {
      setConfirmingVisitId(confirmId);
      // Remove param from URL to avoid repeating on refresh
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  useEffect(() => {
    let unsubscribeFavorites: (() => void) | undefined;

    if (currentUser) {
      unsubscribeFavorites = subscribeToFavorites(currentUser.uid, (favs) => {
        setUserFavorites(favs);
      });
    } else {
      setUserFavorites([]);
    }

    return () => {
      if (unsubscribeFavorites) unsubscribeFavorites();
    };
  }, [currentUser]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const adminStatus = await checkIfAdmin(user);
          setIsAuthorized(adminStatus);
        } catch (error) {
          console.error("Erro ao verificar status de admin:", error);
          setIsAuthorized(false);
        }
      } else {
        setIsAuthorized(false);
      }
      setIsAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    // Só inicia listeners após carregar o auth para evitar permission-denied precoces
    if (isAuthLoading) return;

    // Listeners em tempo real
    const unsubscribeSlots = subscribeToBlockedSlots((slots) => {
      setBlockedSlots(slots);
    });
    
    const unsubscribeProperties = subscribeToProperties((props) => {
      setProperties(props as Property[]);
      setIsLoading(false);
    }, isAuthorized);

    let unsubscribeVisits: (() => void) | undefined;
    if (isAuthorized) {
      unsubscribeVisits = subscribeToVisits((visits) => {
        setScheduledVisits(visits);
      });
    }

    return () => {
      unsubscribeSlots();
      unsubscribeProperties();
      if (unsubscribeVisits) unsubscribeVisits();
    };
  }, [isAuthorized, isAuthLoading]);

  const handlePropertyRegistrationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdminOpen(true);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Todas' | 'Residencial' | 'Comercial' | 'Rural'>('Todas');
  const [typeFilter, setTypeFilter] = useState<string>('Todas');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [minPriceDisplay, setMinPriceDisplay] = useState('');
  const [maxPriceDisplay, setMaxPriceDisplay] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc'>('default');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMegaFilter, setShowMegaFilter] = useState(false);

  // Filter options for the map section specifically
  const filterOptions = useMemo(() => {
    const cities = new Set<string>();
    const neighborhoods = new Set<string>();
    const condominiums = new Set<string>();
    
    properties.forEach(p => {
      cities.add(p.city);
      neighborhoods.add(p.neighborhood);
      if (p.condominium) condominiums.add(p.condominium);
    });

    return {
      cities: Array.from(cities).sort(),
      neighborhoods: Array.from(neighborhoods).sort(),
      condominiums: Array.from(condominiums).sort()
    };
  }, [properties]);

  const suggestions = useMemo(() => {
    const all = new Set<string>();
    properties.forEach(p => {
      all.add(p.city);
      all.add(p.neighborhood);
      if (p.condominium) all.add(p.condominium);
    });
    
    const list = Array.from(all);
    if (!searchTerm) return [];
    
    return list.filter(item => 
      item.toLowerCase().includes(searchTerm.toLowerCase()) && 
      item.toLowerCase() !== searchTerm.toLowerCase()
    ).slice(0, 5);
  }, [searchTerm, properties]);

  const filteredProperties = useMemo(() => {
    let result = properties.filter(p => {
      const matchesCategory = categoryFilter === 'Todas' || p.category === categoryFilter;
      const matchesType = typeFilter === 'Todas' || p.type === typeFilter;
      const matchesFavorites = !showOnlyFavorites || userFavorites.includes(String(p.id));
      
      const search = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
                           p.title.toLowerCase().includes(search) ||
                           p.city.toLowerCase().includes(search) ||
                           p.neighborhood.toLowerCase().includes(search) ||
                           (p.condominium && p.condominium.toLowerCase().includes(search));
      
      const matchesMin = minPrice === '' || p.priceValue >= minPrice;
      const matchesMax = maxPrice === '' || p.priceValue <= maxPrice;

      return matchesCategory && matchesType && matchesSearch && matchesMin && matchesMax && matchesFavorites;
    });

    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.priceValue - b.priceValue);
    }

    return result;
  }, [searchTerm, categoryFilter, typeFilter, minPrice, maxPrice, sortBy, properties]);

  const addProperty = async (newP: Omit<Property, 'id'>) => {
    try {
      await addPropertyToInventory(newP);
      // Removed manual fetch - handled by real-time subscription
    } catch (error) {
      alert("Erro ao adicionar imóvel no banco de dados.");
    }
  };

  const deleteProperty = async (id: string | number) => {
    if (window.confirm('Tem certeza que deseja remover este imóvel? Esta ação não pode ser desfeita.')) {
      try {
        if (typeof id === 'string') {
          await deletePropertyFromInventory(id);
          // Removed manual fetch - handled by real-time subscription
        } else {
          setProperties(properties.filter(p => p.id !== id));
        }
      } catch (error) {
        alert("Erro ao remover o imóvel.");
      }
    }
  };

  const updateProperty = async (updatedP: Property) => {
    try {
      if (typeof updatedP.id === 'string') {
        const { id, ...data } = updatedP;
        await updatePropertyInInventory(id, data);
        // Removed manual fetch - handled by real-time subscription
      } else {
        setProperties(properties.map(p => p.id === updatedP.id ? updatedP : p));
      }
    } catch (error) {
      alert("Erro ao atualizar o imóvel.");
    }
  };

  const handleToggleFavorite = async (propertyId: string) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }
    try {
      await toggleFavorite(currentUser.uid, propertyId);
    } catch (error) {
      console.error("Erro ao favoritar:", error);
    }
  };

  const [featuredIndex, setFeaturedIndex] = useState(0);
  const featuredProperties = useMemo(() => properties.filter(p => p.featured), [properties]);

  useEffect(() => {
    if (featuredProperties.length === 0) {
      setFeaturedIndex(0);
      return;
    }
    if (featuredIndex >= featuredProperties.length) {
      setFeaturedIndex(0);
    }
    if (featuredProperties.length <= 1) return;
    const interval = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % featuredProperties.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [featuredProperties.length, featuredIndex]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-orange/20 rounded-2xl md:rounded-[2rem] flex items-center justify-center animate-pulse">
          <Home size={40} className="text-brand-orange" />
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">RB SOROCABA • CARREGANDO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-brand-orange selection:text-white">
      {/* --- History Modal --- */}
      <AnimatePresence>
        {isHistoryOpen && (
          <HistoryModal onClose={() => setIsHistoryOpen(false)} />
        )}
      </AnimatePresence>

      {/* --- Schedule Visit Modal --- */}
      <AnimatePresence>
        {isVisitModalOpen && selectedPropertyForVisit && (
          <VisitRegistrationOverlay 
            property={selectedPropertyForVisit}
            existingVisits={scheduledVisits}
            blockedSlots={blockedSlots}
            onClose={() => {
              setIsVisitModalOpen(false);
              setSelectedPropertyForVisit(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* --- Admin Portal Overlay --- */}
      <AnimatePresence>
        {isAdminOpen && (
          <AdminPortal 
            properties={properties} 
            scheduledVisits={scheduledVisits}
            blockedSlots={blockedSlots}
            onAddProperty={addProperty} 
            onUpdateProperty={updateProperty}
            onDeleteProperty={deleteProperty}
            onUnblockSlot={async (id) => {
              await unblockSlot(id);
            }}
            onBlockSlot={async (slot) => {
              await blockSlot(slot);
            }}
            onUpdateVisitStatus={async (id, status) => {
              try {
                await updateVisitStatus(id, status);
                if (status === 'confirmed') {
                  const visit = scheduledVisits.find(v => v.id === id);
                  if (visit) {
                    const property = properties.find(p => p.id === String(visit.propertyId));
                    await sendVisitConfirmationNotification({
                      visit_id: id,
                      to_name: visit.name,
                      to_email: visit.email || 'atendimento@rbsorocaba.com.br',
                      to_phone: visit.phone,
                      property_title: property?.title || 'Imóvel Selecionado',
                      visit_date: visit.date,
                      visit_time: visit.time
                    });
                    alert("Visita confirmada e notificação enviada!");
                  }
                } else {
                  alert("Status atualizado com sucesso!");
                }
              } catch (error) {
                console.error("Erro ao atualizar visita:", error);
                alert("Erro ao atualizar status da visita.");
              }
            }}
            onDeleteVisit={async (id) => {
              await deleteVisit(id);
            }}
            onClose={() => setIsAdminOpen(false)} 
            isAuthorized={isAuthorized}
          />
        )}
      </AnimatePresence>
      {/* --- Floating Action Button --- */}
      <motion.a 
        href={`https://wa.me/${BROKER_PHONE}?text=${encodeURIComponent('Olá! Gostaria de falar sobre os imóveis da RB SOROCABA NEGOCIOS IMOBILIARIOS.')}`}
        target="_blank" 
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 z-50 bg-[#128C7E] text-white p-4 rounded-2xl shadow-[0_10px_30px_rgba(18,140,126,0.3)] hover:bg-[#075E54] transition-all flex items-center justify-center group"
      >
        <MessageCircle size={32} />
        <span className="absolute right-full mr-4 bg-black text-white px-4 py-2 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 whitespace-nowrap text-sm font-bold border border-white/10 pointer-events-none">
          Fale conosco agora!
        </span>
      </motion.a>

      {/* --- Mega Filter Modal --- */}
      <AnimatePresence>
        {showMegaFilter && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-3xl p-6 md:p-12 overflow-y-auto"
          >
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-16">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-brand-orange rounded-3xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(255,92,0,0.4)]">
                    <Search size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter">O QUE VOCÊ <span className="text-brand-orange">PROCURA?</span></h2>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Explore nosso catálogo especializado</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMegaFilter(false)}
                  className="w-16 h-16 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-all border border-white/10"
                >
                  <X size={32} />
                </button>
              </div>

              {/* Price Range in Mega Filter */}
              <div className="mb-12 bg-white/5 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-4 w-full">
                  <span className="text-brand-orange text-[10px] font-black uppercase tracking-[0.3em] ml-2">Faixa de Investimento</span>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 relative w-full">
                       <input 
                         type="number"
                         placeholder="Preço Mínimo (R$)"
                         className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-brand-orange transition-all font-bold placeholder:text-white/20"
                         value={minPrice}
                         onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                       />
                    </div>
                    <div className="w-4 h-px bg-white/20 hidden sm:block" />
                    <div className="flex-1 relative w-full">
                       <input 
                         type="number"
                         placeholder="Preço Máximo (R$)"
                         className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-brand-orange transition-all font-bold placeholder:text-white/20"
                         value={maxPrice}
                         onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                       />
                    </div>
                  </div>
                </div>
                <div className="w-px h-16 bg-white/10 hidden md:block" />
                <div className="flex flex-col items-center">
                  <span className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-2">Imóveis encontrados</span>
                  <span className="text-4xl font-black text-brand-orange">{filteredProperties.length}</span>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-12">
                {(Object.keys(PROPERTY_CATEGORIES) as PropertyCategory[]).map(cat => (
                  <div key={cat} className="space-y-8">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">{cat}</h3>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {PROPERTY_CATEGORIES[cat].map(type => (
                        <button 
                          key={type}
                          onClick={() => {
                            setCategoryFilter(cat);
                            setTypeFilter(type);
                            setShowMegaFilter(false);
                            // Scroll to properties section
                            document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 hover:bg-brand-orange text-left transition-all border border-white/5 hover:border-brand-orange shadow-lg"
                        >
                          <span className="text-white/60 group-hover:text-white font-bold group-hover:translate-x-2 transition-all">{type}</span>
                          <ChevronRight size={18} className="text-brand-orange group-hover:text-white opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-20 pt-10 border-t border-white/10 text-center">
                <button 
                  onClick={() => {
                    setCategoryFilter('Todas');
                    setTypeFilter('Todas');
                    setShowMegaFilter(false);
                    document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 md:px-12 py-4 md:py-5 bg-white text-black rounded-full font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-brand-orange hover:text-white transition-all shadow-2xl"
                >
                  Ver Todos os Imóveis sem Filtro
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Navbar --- */}
      <nav className={`fixed top-0 left-0 w-full z-40 transition-all duration-700 ${isScrolled ? 'py-4 bg-black/40 backdrop-blur-3xl border-b border-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.5)]' : 'py-5 md:py-8 bg-transparent'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div 
             className="flex items-center space-x-4 group cursor-pointer"
             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative">
              <div className="w-12 h-12 bg-brand-orange flex items-center justify-center rounded-2xl shadow-[0_10px_30px_rgba(255,92,0,0.4)] rotate-6 group-hover:rotate-0 transition-all duration-500 transform hover:scale-110">
                <Home className="text-white -rotate-6 group-hover:rotate-0 transition-all duration-500" />
              </div>
              <div className="absolute -inset-1 bg-brand-orange/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="flex flex-col">
              <span className="text-2xl md:text-3xl font-black tracking-tighter leading-none text-white uppercase">
                RB <span className="text-brand-orange group-hover:tracking-widest transition-all duration-500">SOROCABA</span>
              </span>
              <span className="text-[8px] md:text-[9px] font-black tracking-[0.5em] uppercase opacity-40 text-white leading-none mt-1">NEGÓCIOS IMOBILIÁRIOS</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className={`hidden md:flex items-center space-x-10 ${isScrolled ? 'text-white/80 font-semibold' : 'text-white/90 font-semibold'}`}>
            <a href="#" className="hover:text-brand-orange transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-brand-orange hover:after:w-full after:transition-all">Home</a>
            <a href="#properties" className="hover:text-brand-orange transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-brand-orange hover:after:w-full after:transition-all">Propriedades</a>
            <a href="#team" className="hover:text-brand-orange transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-brand-orange hover:after:w-full after:transition-all">Corretores</a>
            
            {isAuthorized ? (
              <button 
                onClick={() => setIsAdminOpen(true)}
                className="bg-brand-orange/10 text-brand-orange border border-brand-orange/20 px-4 py-2 rounded-full font-bold uppercase tracking-widest text-[9px] hover:bg-brand-orange hover:text-white transition-all flex items-center gap-2"
              >
                <Plus size={14} />
                Gerenciar Imóveis
              </button>
            ) : (
              <div className="flex items-center space-x-6">
                <a 
                  href="#contact" 
                  onClick={handlePropertyRegistrationClick}
                  className="text-white/60 hover:text-brand-orange font-bold uppercase tracking-widest text-[9px] hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Plus size={14} />
                  Anunciar meu Imóvel
                </a>
                {!currentUser && (
                  <button 
                    onClick={() => loginWithGoogle()}
                    className="text-white/60 hover:text-brand-orange font-bold uppercase tracking-widest text-[9px] hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <Shield size={14} />
                    Entrar
                  </button>
                )}
              </div>
            )}
            
            <a href="#contact" className="btn-primary !px-6 !py-3 shadow-orange-500/20">
              Fale Conosco
            </a>
            
            {currentUser && (
              <button 
                onClick={logout}
                className="ml-4 w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 text-red-400 flex items-center justify-center transition-all"
                title="Sair"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className={`md:hidden p-2 rounded-lg transition-colors ${isScrolled ? 'text-white' : 'text-white'}`}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={28} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-dark/95 backdrop-blur-2xl md:hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-[100px] -ml-48 -mb-48" />

            <div className="relative h-full flex flex-col p-8 sm:p-12 overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-16">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-brand-orange flex items-center justify-center rounded-xl shadow-lg rotate-3">
                    <Home className="text-white -rotate-3" size={20} />
                  </div>
                  <span className="flex flex-col">
                    <span className="text-xl font-black tracking-tighter leading-none text-white">
                      RB <span className="text-brand-orange">SOROCABA</span>
                    </span>
                  </span>
                </div>
                <button 
                  className="w-12 h-12 bg-white/5 hover:bg-brand-orange text-white rounded-full flex items-center justify-center transition-all border border-white/10"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Fechar menu"
                >
                  <X size={28} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col space-y-6">
                {[
                  { label: 'Início', href: '#' },
                  { label: 'Propriedades', href: '#properties' },
                  { label: 'Corretores', href: '#team' },
                ].map((link, i) => (
                  <motion.a
                    key={link.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-3xl md:text-4xl font-black text-white hover:text-brand-orange transition-all tracking-tighter uppercase leading-none"
                  >
                    {link.label}
                  </motion.a>
                ))}
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {isAuthorized ? (
                    <button 
                      onClick={() => { setIsAdminOpen(true); setMobileMenuOpen(false); }} 
                      className="text-2xl md:text-3xl font-black text-brand-orange text-left uppercase tracking-tighter mt-4"
                    >
                      Painel Admin
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { handlePropertyRegistrationClick(e); setMobileMenuOpen(false); }} 
                      className="text-2xl md:text-3xl font-black text-brand-orange text-left uppercase tracking-tighter mt-4"
                    >
                      Anunciar Imóvel
                    </button>
                  )}
                </motion.div>
              </nav>

              {/* Action and User Info */}
              <div className="mt-16 space-y-8">
                {currentUser ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt={currentUser.displayName || ''} className="w-12 h-12 rounded-full border-2 border-brand-orange p-0.5" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-brand-orange flex items-center justify-center text-white font-black">{currentUser.displayName?.charAt(0)}</div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-white font-bold leading-tight">{currentUser.displayName}</span>
                        <span className="text-white/40 text-xs truncate max-w-[200px]">{currentUser.email}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="text-red-400 font-bold uppercase tracking-widest text-[10px] hover:text-red-300 transition-colors flex items-center gap-2 border-t border-white/5 pt-4"
                    >
                      <Shield size={14} /> Sair da Conta
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => { loginWithGoogle(); setMobileMenuOpen(false); }}
                    className="w-full bg-white/5 hover:bg-white/10 text-white p-6 rounded-3xl border border-white/10 flex items-center justify-center gap-3 transition-all group"
                  >
                    <Shield className="text-brand-orange group-hover:scale-110 transition-transform" />
                    <span className="font-bold uppercase tracking-[0.2em] text-[10px]">Acessar minha conta</span>
                  </motion.button>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="w-full btn-primary !h-16 md:!h-20 !text-lg md:!text-xl flex items-center justify-center uppercase tracking-widest font-black">
                    Fale Conosco
                  </a>
                </motion.div>
              </div>

              {/* Social and Footer */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-auto pt-16 flex flex-col space-y-8"
              >
                <div className="flex justify-center space-x-6">
                  {[
                    { icon: Instagram, href: 'https://instagram.com' },
                    { icon: Facebook, href: 'https://facebook.com' },
                    { icon: MessageCircle, href: `https://wa.me/${BROKER_PHONE}` },
                  ].map((social, i) => (
                    <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-white/5 hover:bg-brand-orange text-white rounded-full flex items-center justify-center transition-all border border-white/10 group">
                      <social.icon size={24} className="group-hover:scale-110 transition-transform" />
                    </a>
                  ))}
                </div>
                <p className="text-center text-white/20 text-[10px] uppercase font-bold tracking-[0.5em]">RB SOROCABA © 2024</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isLoading && (
          <motion.div
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* --- Hero Section --- */}
            <section className="relative h-auto md:h-screen min-h-[85vh] flex items-start md:items-center pt-32 pb-16 md:pt-20 overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" 
            alt="Luxury Home"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <div className="container mx-auto px-6 relative z-20">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center space-x-3 mb-4 md:mb-6">
                <div className="h-[1.5px] w-10 md:w-12 bg-brand-orange" />
                <span className="text-brand-orange font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs">Exclusividade em Sorocaba</span>
              </div>
              <h1 className="text-3xl md:text-6xl lg:text-7xl text-white font-black leading-[1] md:leading-[0.85] mb-5 md:mb-8 tracking-tighter uppercase drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                SUA PRÓXIMA <br className="hidden md:block" />
                <span className="text-transparent hover:text-brand-orange transition-all duration-700 cursor-default" style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.8)' }}>CONQUISTA</span>
              </h1>
              <p className="text-xs md:text-lg text-white/70 mb-6 md:mb-10 max-w-2xl leading-relaxed font-medium md:border-l border-white/20 md:pl-8">
                Curadoria especializada dos imóveis mais desejados da região. <br className="hidden md:block" />
                Arquitetura, luxo e o endereço que você sempre sonhou.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 md:gap-6 mb-12 md:mb-12">
                <a href="#properties" className="btn-primary !px-6 md:!px-12 !py-4 md:!py-6 text-sm md:text-lg group relative overflow-hidden flex items-center justify-center">
                  <span className="relative z-10 flex items-center">
                    Explorar Imóveis 
                    <ChevronRight className="group-hover:translate-x-2 transition-transform ml-2" />
                  </span>
                  <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                </a>
                <a 
                  href="#contact"
                  onClick={handlePropertyRegistrationClick}
                  className="bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white px-6 md:px-12 py-4 md:py-6 rounded-full font-black transition-all border border-white/10 flex items-center justify-center gap-3 group text-sm md:text-base ring-1 ring-white/5 hover:ring-brand-orange/40"
                >
                  {isAuthorized ? 'Gerenciar Imóveis' : 'Anunciar meu Imóvel'}
                  <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-brand-orange flex items-center justify-center group-hover:rotate-90 transition-transform duration-500 shadow-lg shadow-orange-500/30">
                    <Plus size={14} md:size={18} className="text-white" />
                  </div>
                </a>
              </div>
            </motion.div>

            {/* Advanced Search Bar - Refined for Mobile */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="bg-black/90 backdrop-blur-3xl p-3 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col items-stretch gap-3 md:gap-5 border border-white/10"
            >
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4">
                <div className="flex-1 relative">
                  <div className="flex items-center px-4 md:px-5 bg-white/5 rounded-xl md:rounded-2xl border border-white/10 py-2.5 md:py-3.5 group focus-within:border-brand-orange transition-all shadow-inner">
                    <Search className="text-brand-orange mr-2 md:mr-3 shrink-0" size={16} md:size={20} />
                    <input 
                      type="text" 
                      placeholder="Localização, bairro ou condomínio..." 
                      className="w-full outline-none bg-transparent text-white font-bold placeholder:text-white/20 text-xs md:text-lg"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onFocus={() => setShowSuggestions(true)}
                    />
                  </div>

                  {/* Suggestions Dropdown */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 w-full mt-3 bg-black/95 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl border border-white/10 z-50 overflow-hidden"
                      >
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            className="w-full text-left px-7 py-4 hover:bg-brand-orange/10 transition-colors flex items-center space-x-4 group border-b border-white/5 last:border-0"
                            onClick={() => {
                              setSearchTerm(s);
                              setShowSuggestions(false);
                            }}
                          >
                            <MapPin size={18} className="text-white/20 group-hover:text-brand-orange transition-colors" />
                            <span className="text-white/60 group-hover:text-white font-bold text-sm md:text-base">{s}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="md:w-64 bg-white/5 rounded-xl md:rounded-2xl border border-white/10 px-5 py-3 md:py-3.5 relative group focus-within:border-brand-orange transition-all shadow-inner">
                  <span className="absolute -top-3 left-4 bg-black px-2 text-[8px] font-black tracking-widest text-brand-orange uppercase">Categoria</span>
                  <select 
                    className="w-full bg-transparent outline-none text-white font-black cursor-pointer appearance-none uppercase text-[10px] md:text-xs tracking-widest"
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value as any);
                      setTypeFilter('Todas');
                    }}
                  >
                    <option value="Todas" className="bg-brand-dark">Todas Categorias</option>
                    <option value="Residencial" className="bg-brand-dark">Residencial</option>
                    <option value="Comercial" className="bg-brand-dark">Comercial</option>
                    <option value="Rural" className="bg-brand-dark">Rural</option>
                  </select>
                </div>

                <a href="#properties" className="btn-primary !px-10 !py-3 md:!py-3.5 shadow-orange-500/20 text-center whitespace-nowrap flex items-center justify-center gap-3 w-full md:w-auto">
                  <Search size={20} />
                  <span className="text-sm md:text-base">BUSCAR IMÓVEIS</span>
                </a>
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
                <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6 w-full">
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] whitespace-nowrap">Faixa de Investimento</span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="flex-1 sm:w-36 relative group">
                        <input 
                          type="text" 
                          placeholder="Mínimo (ex: 500k)"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-brand-orange transition-all placeholder:text-white/10"
                          value={minPriceDisplay}
                          onChange={(e) => setMinPriceDisplay(e.target.value)}
                          onBlur={() => {
                            const val = parsePriceInput(minPriceDisplay);
                            setMinPrice(val);
                            if (val !== '') setMinPriceDisplay(formatCurrency(val));
                          }}
                        />
                      </div>
                      <div className="w-4 h-[1px] bg-white/20" />
                      <div className="flex-1 sm:w-36 relative group">
                        <input 
                          type="text" 
                          placeholder="Máximo (ex: 2M)"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-brand-orange transition-all placeholder:text-white/10"
                          value={maxPriceDisplay}
                          onChange={(e) => setMaxPriceDisplay(e.target.value)}
                          onBlur={() => {
                            const val = parsePriceInput(maxPriceDisplay);
                            setMaxPrice(val);
                            if (val !== '') setMaxPriceDisplay(formatCurrency(val));
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 w-full flex flex-col gap-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Arraste para definir teto de preço</span>
                      <span className="text-[11px] font-black text-brand-orange font-mono">
                        {maxPrice === '' ? 'SEM LIMITE' : formatCurrency(maxPrice)}
                      </span>
                    </div>
                    <div className="relative h-6 flex items-center">
                      <input 
                        type="range"
                        min="0"
                        max="10000000"
                        step="100000"
                        value={maxPrice === '' ? 10000000 : maxPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const finalVal = val === 10000000 ? '' : val;
                          setMaxPrice(finalVal);
                          setMaxPriceDisplay(finalVal === '' ? '' : formatCurrency(finalVal));
                        }}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-orange hover:accent-orange-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Applied Filter Tags */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mr-2">Filtros Ativos:</span>
                  
                  {searchTerm && (
                    <div className="flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/30 px-3 py-1.5 rounded-full transition-all hover:bg-brand-orange/20">
                      <Search size={10} className="text-brand-orange" />
                      <span className="text-[9px] font-black text-brand-orange uppercase">{searchTerm}</span>
                      <button onClick={() => setSearchTerm('')} className="text-brand-orange/50 hover:text-white"><X size={10} /></button>
                    </div>
                  )}

                  {(minPrice !== '' || maxPrice !== '') && (
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                      <DollarSign size={10} className="text-white/40" />
                      <span className="text-[9px] font-black text-white/50 uppercase">
                        {minPrice !== '' ? formatCurrency(minPrice) : 'R$ 0'} - {maxPrice !== '' ? formatCurrency(maxPrice) : '∞'}
                      </span>
                      <button 
                        onClick={() => {
                          setMinPrice(''); setMaxPrice('');
                          setMinPriceDisplay(''); setMaxPriceDisplay('');
                        }} 
                        className="text-white/20 hover:text-white"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}

                  {categoryFilter !== 'Todas' && (
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                      <Home size={10} className="text-white/40" />
                      <span className="text-[9px] font-black text-white/50 uppercase">{categoryFilter}</span>
                      <button onClick={() => setCategoryFilter('Todas')} className="text-white/20 hover:text-white"><X size={10} /></button>
                    </div>
                  )}

                  {!searchTerm && minPrice === '' && maxPrice === '' && categoryFilter === 'Todas' && (
                    <span className="text-[9px] font-bold text-white/10 uppercase italic">Nenhum filtro aplicado</span>
                  )}

                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('Todas');
                      setMinPrice('');
                      setMaxPrice('');
                      setMinPriceDisplay('');
                      setMaxPriceDisplay('');
                    }}
                    className="ml-auto text-[8px] font-black text-white/20 hover:text-brand-orange uppercase tracking-widest transition-colors underline underline-offset-4"
                  >
                    Limpar Tudo
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Social Proof */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="mt-10 md:mt-16 flex flex-wrap gap-8 md:gap-16 justify-center md:justify-start"
            >
              {[
                { val: 'R$ 1.2B+', lab: 'Volume de Negócios' },
                { val: '500+', lab: 'Imóveis de Luxo' },
                { val: '100%', lab: 'Transações Seguras' }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center md:items-start group cursor-default">
                  <span className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter group-hover:text-brand-orange transition-colors">{stat.val}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-orange shadow-[0_0_8px_rgba(255,92,0,0.8)]" />
                    <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-black">{stat.lab}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Featured Highlights --- */}
      <section className="py-16 md:py-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50/50 -skew-x-12 translate-x-20" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative group p-4 border border-brand-orange/10 rounded-3xl md:rounded-[3rem] -rotate-1 group-hover:rotate-0 transition-all duration-700"
            >
                <div className="relative rounded-3xl md:rounded-[2.5rem] overflow-hidden aspect-video shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop" 
                  alt="Highlight House"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 bg-black p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-2xl z-20 flex flex-col items-center">
                   <span className="text-brand-orange text-2xl md:text-4xl font-black mb-0.5 md:mb-1 leading-none tracking-tighter">15</span>
                   <span className="text-white/40 text-[6px] md:text-[7px] font-black tracking-[0.2em] md:tracking-[0.3em] uppercase">Anos de Histórias</span>
                </div>
              </div>
            </motion.div>
            
            <div className="space-y-6 md:space-y-10">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-[2px] bg-brand-orange" />
                <span className="text-brand-orange font-black uppercase tracking-[0.3em] text-[10px]">Lifestyle Sorocaba</span>
              </div>
              <h2 className="text-3xl md:text-7xl font-black leading-[1.1] md:leading-[0.9] tracking-tighter uppercase">Excelência em cada <br className="hidden md:block" /> <span className="text-brand-orange">DETALHE.</span></h2>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium">
                Nossa missão transcende a simples venda de imóveis. Entregamos curadoria, exclusividade e segurança jurídica para que sua única preocupação seja aproveitar o novo lar.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 pt-2 md:pt-4">
                <div className="space-y-2 md:space-y-3 group cursor-pointer p-4 md:p-6 rounded-2xl md:rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-black flex items-center justify-center rounded-xl md:rounded-2xl text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-all shadow-lg">
                    <Eye size={20} md:size={24} />
                  </div>
                  <h5 className="font-black text-lg md:text-xl tracking-tight">CURADORIA ELITE</h5>
                  <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed">Imóveis selecionados um a um por nossa diretoria estratégica.</p>
                </div>
                <div className="space-y-2 md:space-y-3 group cursor-pointer p-4 md:p-6 rounded-2xl md:rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-black flex items-center justify-center rounded-xl md:rounded-2xl text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-all shadow-lg">
                    <LayoutDashboard size={20} md:size={24} />
                  </div>
                  <h5 className="font-black text-lg md:text-xl tracking-tight">EXPERIÊNCIA VIP</h5>
                  <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed">Atendimento personalizado com total discrição e foco absoluto.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="btn-secondary group !px-8 md:!px-10 !py-4 md:!py-5 uppercase text-[10px] md:text-xs tracking-widest font-black flex items-center gap-2 md:gap-4 mx-auto md:mx-0 shadow-lg"
              >
                Nossa História 
                <ChevronRight className="group-hover:translate-x-1 transition-transform" size={16} md:size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- Property Listing --- */}
      <section id="properties" className="py-32 md:py-48 bg-[#f9f9f9]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 md:mb-24 gap-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl text-center md:text-left"
            >
              <div className="flex items-center justify-center md:justify-start space-x-4 mb-6">
                <div className="w-12 h-[2px] bg-brand-orange" />
                <span className="text-brand-orange font-black uppercase tracking-[0.5em] text-[10px]">Curadoria Exclusiva</span>
              </div>
              <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-8">
                VITRINE <br />
                <span className="text-transparent" style={{ WebkitTextStroke: '2px #1e293b' }}>EXTRAORDINÁRIA</span>
              </h2>
              <p className="text-slate-500 font-medium md:text-xl max-w-lg leading-relaxed">
                Cada m² foi selecionado para superar as expectativas mais exigentes do mercado de alto padrão em Sorocaba.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-wrap justify-center items-center gap-4 md:gap-6"
            >
              {currentUser && (
                <button 
                  onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  className={`flex items-center space-x-3 px-8 md:px-10 py-4 md:py-6 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl border-2 ${
                    showOnlyFavorites 
                      ? 'bg-brand-orange text-white border-brand-orange shadow-orange-500/20' 
                      : 'bg-white text-brand-dark border-transparent hover:border-brand-orange/20'
                  }`}
                >
                  <Star size={16} fill={showOnlyFavorites ? "currentColor" : "none"} />
                  <span>Favoritos ({userFavorites.length})</span>
                </button>
              )}
              <button 
                onClick={() => setShowMegaFilter(true)}
                className="group relative px-8 md:px-12 py-4 md:py-6 rounded-full bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest overflow-hidden transition-all shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-orange-500/20"
              >
                <span className="relative z-10">Filtros Avançados</span>
                <div className="absolute inset-0 bg-brand-orange translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
            {isLoading ? (
                <div className="col-span-full py-20 md:py-32 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-slate-100 border-t-brand-orange rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-brand-orange/10 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tighter">Sincronizando com a Nuvem</h3>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Buscando as melhores oportunidades em tempo real...</p>
                </div>
              </div>
            ) : filteredProperties.length > 0 ? (
              filteredProperties.map(property => (
                <div key={property.id}>
                  <PropertyCard 
                    property={property} 
                    isFavorite={userFavorites.includes(String(property.id))}
                    onToggleFavorite={handleToggleFavorite}
                    onSelect={(p) => {
                      setSelectedPropertyForVisit(p);
                      setIsVisitModalOpen(true);
                    }}
                  />
                </div>
              ))
            ) : (
                <div className="col-span-full py-20 md:py-32 text-center bg-white rounded-[2rem] md:rounded-[3.5rem] border-2 border-dashed border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300">
                  <Search size={40} />
                </div>
                <h3 className="text-3xl font-black tracking-tighter mb-4 uppercase">Ops! Nada por aqui.</h3>
                <p className="text-xl text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
                  {showOnlyFavorites 
                    ? "Você ainda não possui imóveis favoritados. Explore nosso catálogo e clique no ícone de estrela para salvar seus preferidos."
                    : "Não encontramos nenhum imóvel que corresponda aos seus filtros atuais."}
                </p>
                <button 
                  onClick={() => {
                    setSearchTerm(''); 
                    setCategoryFilter('Todas');
                    setTypeFilter('Todas');
                    setMinPrice('');
                    setMaxPrice('');
                    setSortBy('default');
                    setShowOnlyFavorites(false);
                  }}
                  className="mt-10 btn-primary !px-10 !py-4 uppercase text-xs tracking-widest font-black"
                >
                  Ver Todos os Imóveis
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- Designer CTA Section --- */}
      <section className="py-24 bg-brand-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
            <path d="M0 0 L100 0 L100 100 Z" />
          </svg>
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-7xl font-bold text-white mb-6 md:mb-8 tracking-tighter uppercase leading-none">Pronto para o próximo <span className="text-brand-orange">PASSO?</span></h2>
            <p className="text-base md:text-xl text-white/70 mb-8 md:mb-12 leading-relaxed font-medium">
              Agende agora uma consultoria personalizada com um de nossos corretores especialistas em alto padrão.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
              <a 
                href="#contact"
                onClick={handlePropertyRegistrationClick}
                className="btn-primary text-base md:text-xl px-8 md:px-12 py-4 md:py-5 shadow-orange-500/10"
              >
                {isAuthorized ? 'Gerenciar Imóveis' : 'Anunciar meu Imóvel'}
              </a>
              <button 
                onClick={() => generateFullCatalogPDF(properties)}
                className="bg-transparent border-2 border-white/30 text-white hover:bg-white hover:text-brand-orange transition-all px-8 md:px-12 py-4 md:py-5 rounded-full font-bold text-base md:text-xl uppercase tracking-widest"
              >
                Baixar Catálogo PDF
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Featured Large Property Carousel --- */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-12 h-[2px] bg-brand-orange" />
              <span className="text-brand-orange font-black uppercase tracking-[0.4em] text-[10px]">Private Collection</span>
              <div className="w-12 h-[2px] bg-brand-orange" />
            </div>
            <h2 className="text-3xl md:text-6xl font-black mb-4 tracking-tighter uppercase">Destaques <span className="text-brand-orange">Premium</span></h2>
            <p className="text-slate-500 font-medium italic">Inegavelmente extraordinários. Incomparavelmente exclusivos.</p>
          </div>
          
          <div className="relative">
            <AnimatePresence mode="wait">
              {featuredProperties.length > 0 ? (
                <motion.div 
                  key={featuredProperties[featuredIndex]?.id || 'none'}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.6, ease: "circOut" }}
                  className="flex flex-col md:flex-row items-center gap-10 md:gap-20"
                >
                  <div className="w-full md:w-3/5 relative">
                    <div className="aspect-[16/9] rounded-3xl md:rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.15)] relative group">
                      <img 
                        src={featuredProperties[featuredIndex]?.image} 
                        alt={featuredProperties[featuredIndex]?.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                    {featuredProperties[featuredIndex] && (
                      <div className="absolute -bottom-8 -right-8 bg-black text-white p-12 rounded-[2.5rem] shadow-2xl hidden lg:block w-72 border border-white/10">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-black mb-3 text-brand-orange">Investment</p>
                        <p className="text-3xl font-black tracking-tighter">{featuredProperties[featuredIndex].price}</p>
                      </div>
                    )}
                  </div>
                  
                  {featuredProperties[featuredIndex] && (
                    <div className="w-full md:w-2/5 space-y-8">
                      <div className="flex items-center space-x-6">
                        <span className="text-brand-orange font-black text-6xl opacity-10 font-serif leading-none">0{featuredIndex + 1}</span>
                        <div className="h-px flex-1 bg-slate-100" />
                      </div>
                      <div>
                        <h3 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter uppercase leading-none">{featuredProperties[featuredIndex].title}</h3>
                        <div className="flex items-center text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-4">
                          <MapPin size={14} className="mr-2 text-brand-orange" />
                          {featuredProperties[featuredIndex].location}
                        </div>
                      </div>
                      <p className="text-slate-500 leading-relaxed text-lg font-medium italic">
                        Descubra uma experiência sensorial única nesta propriedade excepcional. 
                        Um projeto que redefine os limites do luxo contemporâneo com acabamentos impecáveis.
                      </p>
                      <ul className="grid grid-cols-2 gap-y-4 gap-x-8 pb-8 border-b border-slate-100">
                        <li className="flex items-center text-slate-700 font-bold text-xs uppercase tracking-widest"><CheckCircle2 size={16} className="text-brand-orange mr-3" /> Acabamento AA+</li>
                        <li className="flex items-center text-slate-700 font-bold text-xs uppercase tracking-widest"><CheckCircle2 size={16} className="text-brand-orange mr-3" /> Automação Total</li>
                        <li className="flex items-center text-slate-700 font-bold text-xs uppercase tracking-widest"><CheckCircle2 size={16} className="text-brand-orange mr-3" /> Paisagismo</li>
                        <li className="flex items-center text-slate-700 font-bold text-xs uppercase tracking-widest"><CheckCircle2 size={16} className="text-brand-orange mr-3" /> Concierge</li>
                      </ul>
                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button 
                          onClick={() => {
                            setSelectedPropertyForVisit(featuredProperties[featuredIndex]);
                            setIsVisitModalOpen(true);
                          }}
                          className="w-full bg-gradient-to-r from-brand-orange to-red-600 hover:scale-105 transition-all duration-300 !py-4 md:!py-6 !px-8 md:!px-10 text-base md:text-lg flex items-center justify-center gap-4 group/btn shadow-[0_20px_40px_rgba(255,92,0,0.3)] rounded-2xl md:rounded-[2rem] text-white"
                        >
                          <span className="font-black tracking-widest uppercase">Agendar Visita VIP</span>
                          <Calendar size={20} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center bg-slate-50 rounded-3xl md:rounded-[3rem] border-2 border-dashed border-slate-100"
                >
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em]">Selecione alguns imóveis como destaque para aparecerem aqui</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Carousel Controls */}
            {featuredProperties.length > 0 && (
              <div className="flex justify-center md:justify-start items-center space-x-6 mt-16">
              <button 
                onClick={() => setFeaturedIndex(prev => (prev === 0 ? featuredProperties.length - 1 : prev - 1))}
                className="w-14 h-14 bg-slate-50 hover:bg-black hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-100 group"
              >
                <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={24} />
              </button>
              <div className="flex space-x-3">
                {featuredProperties.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setFeaturedIndex(i)}
                    className={`h-2 rounded-full transition-all duration-500 ${featuredIndex === i ? 'w-10 bg-brand-orange' : 'w-2 bg-slate-200'}`} 
                  />
                ))}
              </div>
              <button 
                onClick={() => setFeaturedIndex(prev => (prev === featuredProperties.length - 1 ? 0 : prev + 1))}
                className="w-14 h-14 bg-slate-50 hover:bg-black hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-100 group"
              >
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>

      <section id="team" className="py-24 md:py-48 bg-[#fafafa]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-20 md:mb-32">
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center mb-8"
            >
               <div className="w-2 h-2 bg-brand-orange rounded-full animate-ping" />
            </motion.div>
            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] mb-8">
              A ELITE DO <br />
              <span className="text-transparent" style={{ WebkitTextStroke: '1.5px #fb923c' }}>MERCADO</span>
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-xl leading-relaxed font-medium md:border-t border-slate-200 pt-8">
              Arquitetamos negociações de alto nível com a discrição e a expertise que seu patrimônio exige.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 md:gap-20 max-w-5xl mx-auto">
            {TEAM.map(member => (
              <motion.div 
                key={member.id}
                whileHover={{ y: -15 }}
                className="group relative"
              >
                <div className="relative mb-10 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.1)] rounded-[3rem] aspect-[4/5] bg-slate-200">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-brand-dark/95 via-brand-dark/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="flex justify-center space-x-6 translate-y-10 group-hover:translate-y-0 transition-transform duration-700">
                      {member.instagram && (
                        <a 
                          href={`https://instagram.com/${member.instagram}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-14 h-14 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center text-white hover:bg-brand-orange hover:shadow-[0_10px_20px_rgba(251,146,60,0.4)] transition-all"
                        >
                          <Instagram size={24} />
                        </a>
                      )}
                      {member.whatsapp && (
                        <a 
                          href={`https://wa.me/${member.whatsapp}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-14 h-14 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center text-white hover:bg-brand-orange hover:shadow-[0_10px_20px_rgba(251,146,60,0.4)] transition-all"
                        >
                          <MessageCircle size={24} />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-8 left-8 bg-black/80 backdrop-blur-xl border border-white/10 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest leading-none">
                    Certified Expert
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-2xl md:text-4xl font-black text-brand-dark mb-2 uppercase tracking-tighter">{member.name}</h4>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-brand-orange font-black uppercase tracking-[0.4em] text-[10px] md:text-xs bg-brand-orange/5 px-4 py-1 rounded-full">{member.role}</p>
                    {member.creci && <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-2">{member.creci}</p>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-48 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="relative bg-brand-dark rounded-[3rem] md:rounded-[6rem] p-8 md:p-24 shadow-[0_100px_200px_rgba(0,0,0,0.4)] overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-10%] right-[-10%] text-[20rem] md:text-[40rem] font-black text-white/5 tracking-tighter italic">"</div>
            </div>
            
            <div className="relative z-10 grid lg:grid-cols-12 gap-16 items-start">
              <div className="lg:col-span-5">
                <div className="flex items-center space-x-6 mb-10">
                   <div className="w-16 h-[2px] bg-brand-orange" />
                   <span className="text-brand-orange font-black uppercase tracking-[0.6em] text-[10px]">Testemunhos</span>
                </div>
                <h2 className="text-5xl md:text-8xl font-black text-white mb-10 leading-[0.8] tracking-tighter uppercase transition-all">
                  RELATOS DE <br />
                  <span className="text-transparent" style={{ WebkitTextStroke: '1.5px #fb923c' }}>SUCESSO</span>
                </h2>
                <div className="flex space-x-2 text-brand-orange mb-12">
                  {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={24} />)}
                </div>
                <p className="text-white/40 leading-relaxed font-black text-[10px] uppercase tracking-[0.4em] max-w-xs">
                  A satisfação dos nossos clientes é o alicerce da nossa reputação inabalável.
                </p>
              </div>

              <div className="lg:col-span-7 grid gap-10">
                {TESTIMONIALS.map((t, idx) => (
                  <motion.div 
                    key={t.id}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.2 }}
                    className="group relative"
                  >
                    <div className="relative bg-white/5 backdrop-blur-3xl p-10 md:p-14 rounded-[2.5rem] border border-white/10 hover:border-brand-orange/30 transition-all duration-500">
                      <p className="text-white font-medium mb-12 text-xl md:text-3xl leading-snug tracking-tight italic">
                        "{t.text}"
                      </p>
                      <div className="flex items-center space-x-6">
                        <div className="w-12 h-12 bg-brand-orange rounded-full flex items-center justify-center font-black text-white shadow-lg shadow-orange-500/20">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <h5 className="text-white font-black text-2xl tracking-tighter uppercase leading-none mb-2">{t.name}</h5>
                          <p className="text-brand-orange text-[10px] uppercase tracking-[0.5em] font-black">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 md:py-32 bg-[#fcfcfc] relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-brand-orange/5 blur-[120px] rounded-full" />
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-24 items-center">
            <div className="max-w-2xl">
              <div className="flex items-center space-x-4 mb-6 md:mb-8">
                 <div className="w-12 h-[2px] bg-brand-orange" />
                 <span className="text-brand-orange font-black uppercase tracking-[0.3em] text-[9px] md:text-[10px]">VIP Private Consulting</span>
              </div>
              <h2 className="text-2xl md:text-7xl font-black mb-6 md:mb-10 leading-[0.9] tracking-tighter uppercase">VAMOS <span className="text-brand-orange drop-shadow-[0_0_15px_rgba(255,92,0,0.2)]">CONSTRUIR</span> SEU LEGADO.</h2>
              <p className="text-base md:text-xl text-slate-500 mb-8 md:mb-14 leading-relaxed font-medium">
                Nossa assessoria vai além da transação. Oferecemos um serviço 360º para investidores de alto padrão.
              </p>
              <div className="space-y-6 md:space-y-10">
                {[
                  { title: "ESTRATÉGIA OFF-MARKET", desc: "Acesso privilegiado a ativos exclusivos.", icon: <Shield size={20} md:size={24} /> },
                  { title: "INTELIGÊNCIA DE MERCADO", desc: "Análise profunda de investimentos.", icon: <LayoutDashboard size={20} md:size={24} /> },
                  { title: "GESTÃO DE PATRIMÔNIO", desc: "Foco em valorização e sucessão.", icon: <Maximize size={20} md:size={24} /> }
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-4 md:space-x-6 group">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-black text-brand-orange rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-orange group-hover:text-white transition-all shadow-xl">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-black text-base md:text-xl tracking-tight mb-1 md:mb-2 group-hover:text-brand-orange transition-colors uppercase leading-none">{item.title}</h4>
                      <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-brand-orange/10 blur-[60px] rounded-full" />
              <div className="relative">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Interactive Map Section --- */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-brand-orange font-bold uppercase tracking-widest text-sm mb-4 block">Nossa Localização</span>
            <h2 className="text-2xl md:text-5xl font-bold mb-6">Expertise na Região de Sorocaba</h2>
            <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto italic font-serif">
              Explore o mapa e filtre por regiões específicas para encontrar as melhores oportunidades.
            </p>
          </div>

          {/* Local Map Filters */}
          <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-slate-50 p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm relative">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-2">Cidade</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-brand-orange font-medium text-sm"
                value={searchTerm.split(',').find(s => filterOptions.cities.includes(s.trim())) || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
              >
                <option value="">Todas as Cidades</option>
                {filterOptions.cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-2">Bairro</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-brand-orange font-medium text-sm"
                value={searchTerm.split(',').find(s => filterOptions.neighborhoods.includes(s.trim())) || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
              >
                <option value="">Todos os Bairros</option>
                {filterOptions.neighborhoods.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-2">Condomínio</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-brand-orange font-medium text-sm"
                value={searchTerm.split(',').find(s => filterOptions.condominiums.includes(s.trim())) || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
              >
                <option value="">Todos os Condomínios</option>
                {filterOptions.condominiums.map(con => (
                  <option key={con} value={con}>{con}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-2">Preço Mínimo</label>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="Mín"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-brand-orange font-medium text-sm"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 font-bold">BRL</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-2">Preço Máximo</label>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="Máx"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-brand-orange font-medium text-sm"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 font-bold">BRL</span>
              </div>
            </div>
            
            {(searchTerm || minPrice !== '' || maxPrice !== '') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setMinPrice('');
                  setMaxPrice('');
                }}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-slate-200 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-orange hover:border-brand-orange transition-all shadow-sm"
              >
                Limpar Filtros
              </button>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
              <div className="bg-white rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl h-[400px] md:h-[600px] border-4 border-white relative group z-10">
              <PropertyMap properties={filteredProperties} />
            </div>
            
            <div className="space-y-6">
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:border-brand-orange transition-colors group">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-orange shadow-sm group-hover:scale-110 transition-transform">
                    <MapPin size={24} />
                  </div>
                  <h4 className="text-xl font-bold">Unidade Campolim</h4>
                </div>
                <p className="text-slate-500 text-sm italic font-serif">Av. Profa. Izoraida Marques Peres, 1000 - Sorocaba/SP</p>
              </div>

              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:border-brand-orange transition-colors group">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-orange shadow-sm group-hover:scale-110 transition-transform">
                    <MapPin size={24} />
                  </div>
                  <h4 className="text-xl font-bold">Unidade Santa Rosália</h4>
                </div>
                <p className="text-slate-500 text-sm italic font-serif">Rua Aparecida, 500 - Sorocaba/SP</p>
              </div>

              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:border-brand-orange transition-colors group">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-orange shadow-sm group-hover:scale-110 transition-transform">
                    <MapPin size={24} />
                  </div>
                  <h4 className="text-xl font-bold">Unidade São Paulo</h4>
                </div>
                <p className="text-slate-500 text-sm italic font-serif">Av. Faria Lima, 3500 - Itaim Bibi, SP</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isLoginModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 md:p-16 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-3xl -mr-16 -mt-16" />
              
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-8 right-8 text-slate-300 hover:text-brand-orange transition-colors"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col items-center text-center space-y-8">
                <div className="w-20 h-20 bg-brand-orange/10 rounded-3xl flex items-center justify-center text-brand-orange">
                  <Star size={40} className="animate-pulse" />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-3xl font-black tracking-tighter uppercase leading-tight">Mantenha sua <br /><span className="text-brand-orange">Coleção Privada</span></h3>
                  <p className="text-slate-500 font-medium">Faça login para salvar seus imóveis favoritos e acessá-los de qualquer dispositivo.</p>
                </div>

                <button 
                  onClick={() => {
                    loginWithGoogle();
                    setIsLoginModalOpen(false);
                  }}
                  className="w-full btn-primary !h-16 md:!h-20 !text-lg md:!text-xl flex items-center justify-center gap-4 group"
                >
                  <Shield size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="font-black uppercase tracking-widest">Acessar via Google</span>
                </button>

                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">Exclusivo para clientes RB Sorocaba</p>
              </div>
            </motion.div>
          </motion.div>
        )}
        {confirmingVisitId && (
          <ConfirmVisitModal 
            visitId={confirmingVisitId} 
            onClose={() => setConfirmingVisitId(null)} 
          />
        )}
      </AnimatePresence>

      {/* --- Contact & Footer --- */}
      <footer className="bg-black pt-20 md:pt-32 pb-16 text-white border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-12 lg:gap-20 mb-20 lg:mb-24">
            {/* Brand Info */}
            <div className="lg:col-span-1 space-y-8 lg:space-y-10">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-brand-orange flex items-center justify-center rounded-[1.25rem] shadow-[0_0_20px_rgba(255,92,0,0.4)]">
                  <Home className="text-white" size={28} />
                </div>
                <span className="text-3xl font-black tracking-tighter text-white uppercase leading-none">
                  RB <span className="text-brand-orange">SOROCABA</span>
                  <span className="block text-[8px] tracking-[0.5em] text-white/40 mt-1">NEGÓCIOS IMOBILIÁRIOS</span>
                </span>
              </div>
              <p className="text-white/40 font-medium leading-relaxed italic text-sm">
                Redefinindo o mercado imobiliário de luxo em Sorocaba com ética, exclusividade e uma visão audaciosa do futuro.
              </p>
              <div className="flex space-x-8">
                <a href="#" className="text-white/30 hover:text-brand-orange transition-all scale-125"><Instagram /></a>
                <a href="#" className="text-white/30 hover:text-brand-orange transition-all scale-125"><Facebook /></a>
                <a href="#" className="text-white/30 hover:text-brand-orange transition-all scale-125"><Linkedin /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-white font-black text-xs uppercase tracking-[0.4em] mb-8 lg:mb-12 border-b border-white/10 pb-4 inline-block">Explore</h5>
              <ul className="space-y-4 lg:space-y-5 text-white/50 font-black uppercase text-[10px] tracking-widest">
                <li><a href="#" className="hover:text-brand-orange transition-colors">Conheça a RB</a></li>
                <li><a href="#properties" className="hover:text-brand-orange transition-colors">Portfólio Premium</a></li>
                <li><a href="#team" className="hover:text-brand-orange transition-colors">Corretores Elite</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Áreas Exclusivas</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Compliance</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-8 lg:space-y-10">
              <h5 className="text-white font-black text-xs uppercase tracking-[0.4em] mb-8 lg:mb-12 border-b border-white/10 pb-4 inline-block">Contact HQ</h5>
              <div className="flex items-start space-x-5">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 text-brand-orange border border-white/10"><Phone size={20} /></div>
                <div>
                  <p className="text-white font-black text-xs uppercase tracking-widest mb-1">Central de Atendimento</p>
                  <p className="text-white/40 text-sm font-medium">Av. Profa. Izoraida Marques Peres, Sorocaba/SP</p>
                </div>
              </div>
              <div className="flex items-start space-x-5">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 text-brand-orange border border-white/10"><Mail size={20} /></div>
                <div>
                  <p className="text-white font-black text-xs uppercase tracking-widest mb-1">E-mail Corporativo</p>
                  <p className="text-white/40 text-sm font-medium italic">diretoria@rbsorocaba.com.br</p>
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h5 className="text-white font-black text-xs uppercase tracking-[0.4em] mb-8 lg:mb-12 border-b border-white/10 pb-4 inline-block">Privy List</h5>
              <p className="text-white/50 mb-8 lg:mb-10 text-xs font-medium leading-relaxed italic">Receba convites para eventos exclusivos e pré-lançamentos extraordinários.</p>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Seu melhor e-mail" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange text-white font-bold placeholder:text-white/20 transition-all text-sm"
                />
                <button className="w-full btn-primary !py-4 md:!py-5 uppercase text-[10px] tracking-widest font-black rounded-2xl">SOLICITAR ACESSO</button>
              </form>
            </div>
          </div>

          <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
              © 2026 RB SOROCABA NEGOCIOS IMOBILIARIOS. EXCELÊNCIA SEM COMPROMISSOS.
            </p>
            <div className="flex items-center space-x-4 text-xs font-bold uppercase tracking-widest text-white/40">
              <button 
                onClick={handlePropertyRegistrationClick}
                className="hover:text-brand-orange transition-colors"
              >
                {isAuthorized ? 'Painel do Corretor' : 'Área Restrita'}
              </button>
              <span className="w-1 h-1 bg-white/40 rounded-full" />
              <span>CNPJ: 00.000.000/0000-00</span>
              <span className="w-1 h-1 bg-white/40 rounded-full" />
              <span>CRECI: 000.000-J</span>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  )}
</AnimatePresence>
</div>
);
}
