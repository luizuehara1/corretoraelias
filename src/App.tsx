/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { 
  Home, 
  Search, 
  MapPin, 
  BedDouble, 
  Bath, 
  Maximize, 
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
  ChevronRight,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  Eye,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Firebase ---
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { auth, saveLead } from './lib/firebase';

const googleProvider = new GoogleAuthProvider();

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
  id: number;
  title: string;
  location: string; // Manter para exibição legível
  city: string;
  neighborhood: string;
  condominium?: string;
  price: string;
  type: 'Casa' | 'Apartamento' | 'Terreno';
  beds?: number;
  baths?: number;
  area: string;
  image: string;
  featured?: boolean;
  priceValue: number;
  coords: [number, number]; // [lat, lng]
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
}

// --- Data ---

const PROPERTIES: Property[] = [
  {
    id: 1,
    title: "Mansão Villa dos Lagos",
    location: "Condomínio Fazenda Alvorada, Região de Sorocaba",
    city: "Porto Feliz",
    neighborhood: "Fazenda Alvorada",
    condominium: "Fazenda Alvorada",
    price: "R$ 5.200.000",
    priceValue: 5200000,
    type: "Casa",
    beds: 5,
    baths: 7,
    area: "520m²",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop",
    featured: true,
    coords: [-23.2393, -47.5312]
  },
  {
    id: 2,
    title: "Penthouse Parque Campolim",
    location: "Campolim, Sorocaba",
    city: "Sorocaba",
    neighborhood: "Campolim",
    price: "R$ 3.800.000",
    priceValue: 3800000,
    type: "Apartamento",
    beds: 4,
    baths: 5,
    area: "280m²",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop",
    featured: true,
    coords: [-23.5350, -47.4640]
  },
  {
    id: 3,
    title: "Lote Imperial Giverny",
    location: "Residencial Giverny, Sorocaba",
    city: "Sorocaba",
    neighborhood: "Wanel Ville",
    condominium: "Giverny",
    price: "R$ 1.100.000",
    priceValue: 1100000,
    type: "Terreno",
    area: "800m²",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1932&auto=format&fit=crop",
    featured: true,
    coords: [-23.5040, -47.4890]
  },
  {
    id: 4,
    title: "Casa de Campo Contemporânea",
    location: "Condomínio Lago Azul, Araçoiaba da Serra",
    city: "Araçoiaba da Serra",
    neighborhood: "Lago Azul",
    condominium: "Lago Azul",
    price: "R$ 4.100.000",
    priceValue: 4100000,
    type: "Casa",
    beds: 4,
    baths: 5,
    area: "420m²",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
    coords: [-23.5048, -47.6144]
  },
  {
    id: 5,
    title: "Apartamento High-End Santa Rosália",
    location: "Santa Rosália, Sorocaba",
    city: "Sorocaba",
    neighborhood: "Santa Rosália",
    price: "R$ 1.950.000",
    priceValue: 1950000,
    type: "Apartamento",
    beds: 3,
    baths: 3,
    area: "185m²",
    image: "https://images.unsplash.com/photo-1600607687940-4e2a09615d2f?q=80&w=2070&auto=format&fit=crop",
    coords: [-23.4900, -47.4470]
  },
  {
    id: 6,
    title: "Mansão Alphaville Sorocaba",
    location: "Alphaville IV, Sorocaba",
    city: "Votorantim",
    neighborhood: "Alphaville",
    condominium: "Alphaville IV",
    price: "R$ 6.500.000",
    priceValue: 6500000,
    type: "Casa",
    beds: 5,
    baths: 8,
    area: "650m²",
    image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?q=80&w=2070&auto=format&fit=crop",
    coords: [-23.5650, -47.4680]
  }
];

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Ricardo Mendes",
    role: "Empresário",
    text: "O atendimento da Corretora Elias é fora de série. Encontraram o imóvel perfeito para minha família em tempo recorde.",
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
  { id: 1, name: "Lucas Silva", role: "Diretor Comercial", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop" },
  { id: 2, name: "Juliana Costa", role: "Consultora Senior", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop" },
  { id: 3, name: "Roberto Ramos", role: "Especialista em Luxo", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop" }
];

// --- Components ---

function AdminPortal({ 
  properties, 
  onAddProperty, 
  onDeleteProperty, 
  onClose 
}: { 
  properties: Property[], 
  onAddProperty: (p: Omit<Property, 'id'>) => void,
  onDeleteProperty: (id: number) => void,
  onClose: () => void 
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProperty, setNewProperty] = useState<Omit<Property, 'id'>>({
    title: '',
    location: '',
    city: 'Sorocaba',
    neighborhood: '',
    condominium: '',
    price: '',
    priceValue: 0,
    type: 'Casa',
    beds: 0,
    baths: 0,
    area: '',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
    coords: [-23.5018, -47.4581]
  });

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    onAddProperty(newProperty);
    
    // WhatsApp Notification Trigger
    const ownerPhone = '5515981504714';
    const message = `*Novo Imóvel Anunciado!*%0A%0A` + 
                    `*Título:* ${newProperty.title}%0A` +
                    `*Tipo:* ${newProperty.type}%0A` +
                    `*Valor:* ${newProperty.price}%0A` +
                    `*Local:* ${newProperty.neighborhood}, ${newProperty.city}%0A` +
                    `*Área:* ${newProperty.area}%0A%0A` +
                    `_Enviado via Portal Corretora Elias_`;
    
    window.open(`https://wa.me/${ownerPhone}?text=${message}`, '_blank');

    setShowAddForm(false);
    setNewProperty({
      title: '',
      location: '',
      city: 'Sorocaba',
      neighborhood: '',
      condominium: '',
      price: '',
      priceValue: 0,
      type: 'Casa',
      beds: 0,
      baths: 0,
      area: '',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
      coords: [-23.5018, -47.4581]
    });
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
            <h2 className="text-3xl font-bold text-white">Portal do Proprietário</h2>
            <p className="text-white/50 text-sm">Gerencie seu portfólio de luxo</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-10">
        {!auth.currentUser?.emailVerified && auth.currentUser?.providerId === 'firebase' && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex items-center gap-4 text-amber-500">
            <Clock size={24} />
            <div className="flex-1">
              <p className="font-bold">E-mail não verificado</p>
              <p className="text-sm opacity-80">Por favor, verifique seu e-mail para ativar todas as funcionalidades do portal.</p>
            </div>
            <button 
              onClick={() => auth.currentUser && sendEmailVerification(auth.currentUser)}
              className="bg-amber-500 text-brand-dark px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-400 transition-colors"
            >
              Reenviar Link
            </button>
          </div>
        )}
        
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Total de Imóveis', val: properties.length },
            { label: 'Valor em Carteira', val: 'R$ ' + (properties.reduce((acc, p) => acc + p.priceValue, 0) / 1000000).toFixed(1) + 'M' },
            { label: 'Status', val: 'Ativo' },
            { label: 'Leads Hoje', val: '12' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl">
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.val}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary py-4 px-8 flex items-center space-x-3"
          >
            <Plus size={20} />
            <span>Cadastrar Novo Imóvel</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <a href="#properties" onClick={onClose} className="text-white/70 hover:text-white font-bold flex items-center space-x-2 transition-colors">
              <Eye size={20} />
              <span>Ver Site Público</span>
            </a>
          </div>
        </div>

        {/* Add Form Overlay */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white rounded-[2.5rem] overflow-hidden"
            >
              <form onSubmit={handleAdd} className="p-8 md:p-12 space-y-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Título do Anúncio</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Mansão Alpha Luxury"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                      value={newProperty.title}
                      onChange={e => setNewProperty({...newProperty, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Tipo</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 appearance-none outline-none focus:border-brand-orange"
                      value={newProperty.type}
                      onChange={e => setNewProperty({...newProperty, type: e.target.value as any})}
                    >
                      <option value="Casa">Casa</option>
                      <option value="Apartamento">Apartamento</option>
                      <option value="Terreno">Terreno</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Valor Formatado</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: R$ 2.500.000"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                      value={newProperty.price}
                      onChange={e => setNewProperty({...newProperty, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Valor Numérico (para filtros)</label>
                    <input 
                      required
                      type="number" 
                      placeholder="Ex: 2500000"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                      value={newProperty.priceValue || ''}
                      onChange={e => setNewProperty({...newProperty, priceValue: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Área (m²)</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: 350m²"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                      value={newProperty.area}
                      onChange={e => setNewProperty({...newProperty, area: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Cidade</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Sorocaba"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                      value={newProperty.city}
                      onChange={e => setNewProperty({...newProperty, city: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Bairro</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Campolim"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                      value={newProperty.neighborhood}
                      onChange={e => setNewProperty({...newProperty, neighborhood: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Condomínio (Opcional)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Villa de Luxo"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                      value={newProperty.condominium || ''}
                      onChange={e => setNewProperty({...newProperty, condominium: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Localização Resumida</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Campolim, Sorocaba"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange"
                      value={newProperty.location}
                      onChange={e => setNewProperty({...newProperty, location: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-8 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                  <button type="submit" className="btn-primary px-12 py-4">Confirmar Cadastro</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Property List Table */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Suas Propriedades Cadastradas</h3>
            <span className="bg-brand-orange/20 text-brand-orange text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              {properties.length} Ativas
            </span>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">Imóvel</th>
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">Local</th>
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">Valor</th>
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {properties.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center space-x-4">
                        <img src={p.image} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <p className="text-white font-bold">{p.title}</p>
                          <p className="text-white/40 text-xs">{p.type} • {p.area}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-white/60 text-sm">{p.location}</td>
                    <td className="p-6 font-bold text-brand-orange">{p.price}</td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => onDeleteProperty(p.id)}
                        className="text-red-400/50 hover:text-red-400 hover:bg-red-400/10 p-3 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AuthModal({ 
  onClose 
}: { 
  onClose: () => void 
}) {
  const [isRegister, setIsRegister] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName: name });
          await sendEmailVerification(userCredential.user);
          setVerificationSent(true);
        } catch (err: any) {
          if (err.code === 'auth/email-already-in-use') {
            // Se já existe, tentamos logar para ver se está verificado
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
              await sendEmailVerification(userCredential.user);
              setVerificationSent(true);
            } else {
              setError('Este e-mail já está cadastrado e verificado. Por favor, faça login.');
              setIsRegister(false);
            }
          } else {
            throw err;
          }
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setVerificationSent(true);
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        setError('Erro de conexão. Verifique sua internet ou desative bloqueadores de anúncios (AdBlock) e tente novamente.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('O login por e-mail ainda não está ativado. Ative "Email/Password" no console do Firebase.');
      } else if (err.code === 'auth/api-key-not-valid' || err.message?.includes('api-key-not-valid')) {
        setError('Chave de API do Firebase inválida. Verifique se as configurações em /src/lib/firebase.ts estão corretas e se as variáveis de ambiente foram salvas sem aspas.');
      } else {
        setError(err.message || 'Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (auth.currentUser) {
      setLoading(true);
      try {
        await sendEmailVerification(auth.currentUser);
        alert('Link de verificação reenviado!');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (verificationSent) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="fixed inset-0 z-[110] bg-brand-dark/95 backdrop-blur-xl flex items-center justify-center p-6"
      >
        <div className="bg-white rounded-[3rem] p-12 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <Mail size={40} />
          </div>
          <h2 className="text-3xl font-bold">Verifique seu e-mail</h2>
          <p className="text-slate-600 italic">Enviamos um link de confirmação para <strong>{email}</strong>. Por favor, confirme para poder anunciar seu imóvel.</p>
          <div className="space-y-4">
            <button onClick={onClose} className="btn-primary w-full py-4 text-lg">Entendi</button>
            <button 
              onClick={handleResend}
              disabled={loading}
              className="text-brand-orange font-bold hover:underline py-2 block w-full text-sm uppercase tracking-widest disabled:opacity-50"
            >
              Não recebeu? Reenviar link
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[110] bg-brand-dark/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto"
    >
      <div className="bg-white rounded-[3rem] w-full max-w-xl relative overflow-hidden my-auto">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-brand-dark transition-colors"><X size={32} /></button>
        
        <div className="p-8 md:p-12 space-y-10">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-2">{isRegister ? 'Anunciar meu Imóvel' : 'Acesso ao Portal'}</h2>
            <p className="text-slate-500 italic">Cadastre-se para gerenciar seus ativos de alto padrão.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Nome Completo</label>
                  <input required type="text" placeholder="João Silva" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Telefone</label>
                  <input required type="tel" placeholder="(15) 99999-9999" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">E-mail</label>
              <input required type="email" placeholder="seu@email.com" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Senha</label>
              <input required type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

            <button disabled={loading} className="w-full btn-primary py-5 text-xl flex items-center justify-center space-x-3 disabled:opacity-50 shadow-xl overflow-hidden relative">
              {loading ? <Loader2 className="animate-spin" /> : <span>{isRegister ? 'Solicitar Cadastro' : 'Entrar no Portal'}</span>}
            </button>
          </form>

          <div className="text-center pt-6 border-t border-slate-100">
            <button onClick={() => setIsRegister(!isRegister)} className="text-slate-500 font-medium hover:text-brand-orange transition-colors">
              {isRegister ? 'Já tenho cadastro? Entrar agora' : 'Não tenho conta? Cadastrar imóvel'}
            </button>
            <div className="mt-8 pt-8 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 mb-4 tracking-[0.2em]">ou acesse com</span>
              <button 
                onClick={async () => {
                  try {
                    await signInWithPopup(auth, googleProvider);
                    onClose();
                  } catch (e) {}
                }}
                className="flex items-center space-x-3 bg-white border border-slate-200 px-8 py-3 rounded-2xl hover:border-brand-orange transition-all font-bold shadow-sm"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
                <span>Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group border border-slate-100"
    >
      <div className="relative h-64 overflow-hidden">
        <img 
          src={property.image} 
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 bg-brand-orange text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {property.type}
        </div>
        {property.featured && (
          <div className="absolute top-4 right-4 bg-brand-dark/80 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
            Destaque
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-brand-dark group-hover:text-brand-orange transition-colors">{property.title}</h3>
          <span className="text-brand-orange font-bold whitespace-nowrap">{property.price}</span>
        </div>
        <div className="flex items-center text-slate-500 text-sm mb-4">
          <MapPin size={14} className="mr-1" />
          {property.location}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex space-x-4">
            {property.beds && (
              <div className="flex items-center text-slate-600 text-sm">
                <BedDouble size={16} className="mr-1 text-brand-orange" />
                {property.beds}
              </div>
            )}
            {property.baths && (
              <div className="flex items-center text-slate-600 text-sm">
                <Bath size={16} className="mr-1 text-brand-orange" />
                {property.baths}
              </div>
            )}
            <div className="flex items-center text-slate-600 text-sm">
              <Maximize size={16} className="mr-1 text-brand-orange" />
              {property.area}
            </div>
          </div>
          <button className="text-brand-dark hover:text-brand-orange font-semibold text-sm flex items-center transition-colors">
            Detalhes <ChevronRight size={16} />
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
      setStatus('success');
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
        className="bg-white p-12 rounded-[3rem] shadow-2xl text-center"
      >
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h3 className="text-3xl font-bold mb-4">Mensagem Enviada!</h3>
        <p className="text-slate-600 mb-8 italic">Seu consultor entrará em contato em breve para realizar seu sonho.</p>
        <button 
          onClick={() => setStatus('idle')}
          className="btn-secondary"
        >
          Enviar Outra Mensagem
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl space-y-6 border border-slate-100">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Nome Completo</label>
          <input 
            required
            type="text" 
            placeholder="Ex: João Silva"
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange transition-all"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">E-mail Corporativo</label>
          <input 
            required
            type="email" 
            placeholder="contato@empresa.com"
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange transition-all"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">WhatsApp / Telefone</label>
          <input 
            required
            type="tel" 
            placeholder="(11) 99999-9999"
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange transition-all"
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Interesse Principal</label>
          <select 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-orange transition-all appearance-none"
            value={formData.interest}
            onChange={e => setFormData({...formData, interest: e.target.value})}
          >
            <option value="Comprar">Quero Comprar</option>
            <option value="Vender">Quero Vender</option>
            <option value="Investir">Quero Investir</option>
            <option value="Consultoria">Consultoria Personalizada</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest font-bold text-slate-400 ml-2">Como podemos ajudar?</label>
        <textarea 
          rows={4}
          placeholder="Descreva seu projeto ou imóvel de interesse..."
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 outline-none focus:border-brand-orange transition-all resize-none"
          value={formData.message}
          onChange={e => setFormData({...formData, message: e.target.value})}
        />
      </div>

      <button 
        disabled={status === 'loading'}
        className="w-full btn-primary py-5 text-xl flex items-center justify-center space-x-3 disabled:opacity-50"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="animate-spin" />
            <span>Processando...</span>
          </>
        ) : (
          <>
            <Send size={20} />
            <span>Solicitar Contato Exclusivo</span>
          </>
        )}
      </button>

      {status === 'error' && (
        <p className="text-red-500 text-sm text-center font-medium">Ocorreu um erro ao enviar. Por favor, tente novamente.</p>
      )}

      <p className="text-[10px] text-slate-400 text-center leading-tight mt-4">
        Ao enviar, você concorda com nossos termos de privacidade. Seus dados estão protegidos por criptografia de ponta a ponta.
      </p>
    </form>
  );
}

export default function App() {
  const [properties, setProperties] = useState<Property[]>(PROPERTIES);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Todas' | 'Casas' | 'Apartamentos' | 'Terrenos'>('Todas');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc'>('default');
  const [showSuggestions, setShowSuggestions] = useState(false);

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
      const matchesType = typeFilter === 'Todas' || 
                         (typeFilter === 'Casas' && p.type === 'Casa') ||
                         (typeFilter === 'Apartamentos' && p.type === 'Apartamento') ||
                         (typeFilter === 'Terrenos' && p.type === 'Terreno');
      
      const search = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
                           p.title.toLowerCase().includes(search) ||
                           p.city.toLowerCase().includes(search) ||
                           p.neighborhood.toLowerCase().includes(search) ||
                           (p.condominium && p.condominium.toLowerCase().includes(search));
      
      const matchesMin = minPrice === '' || p.priceValue >= minPrice;
      const matchesMax = maxPrice === '' || p.priceValue <= maxPrice;

      return matchesType && matchesSearch && matchesMin && matchesMax;
    });

    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.priceValue - b.priceValue);
    }

    return result;
  }, [searchTerm, typeFilter, minPrice, maxPrice, sortBy, properties]);

  const addProperty = (newP: Omit<Property, 'id'>) => {
    const id = Math.max(...properties.map(p => p.id), 0) + 1;
    setProperties([...properties, { ...newP, id }]);
  };

  const deleteProperty = (id: number) => {
    setProperties(properties.filter(p => p.id !== id));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login bias error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAdminOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-orange selection:text-white">
      {/* --- Auth Modal Overlay --- */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal onClose={() => setIsAuthModalOpen(false)} />
        )}
      </AnimatePresence>
      
      {/* --- Admin Portal Overlay --- */}
      <AnimatePresence>
        {isAdminOpen && (
          <AdminPortal 
            properties={properties} 
            onAddProperty={addProperty} 
            onDeleteProperty={deleteProperty}
            onClose={() => setIsAdminOpen(false)} 
          />
        )}
      </AnimatePresence>
      {/* --- Floating Action Button --- */}
      <a 
        href="https://wa.me/5500000000000" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 group"
      >
        <MessageCircle size={32} />
        <span className="absolute right-full mr-4 bg-white text-brand-dark px-4 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm font-bold border border-slate-100 pointer-events-none">
          Fale conosco agora!
        </span>
      </a>

      {/* --- Navbar --- */}
      <nav className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 ${isScrolled ? 'py-4 glass' : 'py-6 bg-transparent'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-brand-orange flex items-center justify-center rounded-xl shadow-lg shadow-orange-500/20 rotate-12 group hover:rotate-0 transition-transform">
              <Home className="text-white -rotate-12 group-hover:rotate-0 transition-transform" />
            </div>
            <span className={`text-2xl font-bold tracking-tight ${isScrolled ? 'text-brand-dark' : 'text-white'}`}>
              CORRETORA <span className="text-brand-orange">ELIAS</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className={`hidden md:flex items-center space-x-10 ${isScrolled ? 'text-brand-dark font-medium' : 'text-white/90 font-medium'}`}>
            <a href="#" className="hover:text-brand-orange transition-colors">Home</a>
            <a href="#properties" className="hover:text-brand-orange transition-colors">Propriedades</a>
            <a href="#team" className="hover:text-brand-orange transition-colors">Corretores</a>
            
            {!isAuthLoading && (
              user ? (
                <div className="flex items-center space-x-6">
                  <button 
                    onClick={() => setIsAdminOpen(true)}
                    className="flex items-center space-x-2 text-brand-orange font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-transform"
                  >
                    <Settings size={14} />
                    <span>Portal Proprietário</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="text-[10px] uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-opacity"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-8">
                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center space-x-2 text-brand-orange font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-transform underline underline-offset-4"
                  >
                    <Plus size={14} />
                    <span>Anunciar seu Imóvel</span>
                  </button>
                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center space-x-2 text-white/60 hover:text-white font-bold uppercase tracking-widest text-[10px] transition-colors"
                  >
                    <Settings size={14} />
                    <span>Acesso Restrito</span>
                  </button>
                </div>
              )
            )}
            
            <button className="btn-primary flex items-center">
              Fale Conosco
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className={`md:hidden p-2 rounded-lg ${isScrolled ? 'text-brand-dark' : 'text-white'}`}
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
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-brand-dark flex flex-col p-10 md:hidden"
          >
            <button 
              className="self-end text-white hover:text-brand-orange transition-colors mb-20"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={40} />
            </button>
            <div className="flex flex-col space-y-8 text-3xl font-serif text-white">
              <a href="#" onClick={() => setMobileMenuOpen(false)} className="hover:translate-x-4 transition-transform inline-block">Home</a>
              <a href="#properties" onClick={() => setMobileMenuOpen(false)} className="hover:translate-x-4 transition-transform inline-block">Propriedades</a>
              <a href="#team" onClick={() => setMobileMenuOpen(false)} className="hover:translate-x-4 transition-transform inline-block">Corretores</a>
              
              {!isAuthLoading && (
                user ? (
                  <>
                    <button 
                      onClick={() => { setIsAdminOpen(true); setMobileMenuOpen(false); }}
                      className="text-left hover:translate-x-4 transition-transform inline-block text-brand-orange"
                    >
                      Portal Proprietário
                    </button>
                    <button 
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="text-left text-sm uppercase font-bold text-white/40"
                    >
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => { setIsAuthModalOpen(true); setMobileMenuOpen(false); }}
                      className="text-left hover:translate-x-4 transition-transform inline-block text-brand-orange"
                    >
                      Anunciar seu Imóvel
                    </button>
                    <button 
                      onClick={() => { setIsAuthModalOpen(true); setMobileMenuOpen(false); }}
                      className="text-left hover:translate-x-4 transition-transform inline-block text-white/40"
                    >
                      Acesso Restrito
                    </button>
                  </>
                )
              )}
            </div>
            <div className="mt-auto">
              <button className="w-full btn-primary text-xl">Fale Conosco</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Hero Section --- */}
      <section className="relative h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-brand-dark/50 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" 
            alt="Luxury Home"
            className="w-full h-full object-cover scale-105 animate-[pulse_10s_ease-in-out_infinite]"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="container mx-auto px-6 relative z-20">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-brand-orange font-bold uppercase tracking-[0.3em] mb-4 block">Bem-vindo ao Extraordinário</span>
              <h1 className="text-5xl md:text-8xl text-white font-bold leading-[0.9] mb-8 drop-shadow-2xl">
                Encontre sua <br />
                <span className="text-brand-orange italic">casa dos sonhos</span>
              </h1>
              <p className="text-xl text-white/80 mb-10 max-w-2xl leading-relaxed">
                Descubra uma curadoria exclusiva dos imóveis mais desejados, onde cada detalhe foi pensado para elevar seu lifestyle.
              </p>
              <div className="flex space-x-6 mb-12">
                <a href="#properties" className="btn-primary px-8 py-4">Ver Imóveis</a>
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold transition-all border border-white/20"
                >
                  Anunciar meu Imóvel
                </button>
              </div>
            </motion.div>

            {/* Advanced Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="bg-white/95 backdrop-blur-md p-6 rounded-[2.5rem] shadow-2xl flex flex-col items-stretch gap-6 border border-white/20"
            >
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                <div className="flex-1 relative">
                  <div className="flex items-center px-4 bg-slate-50 rounded-2xl border border-slate-100 py-3">
                    <Search className="text-brand-orange mr-3 shrink-0" size={20} />
                    <input 
                      type="text" 
                      placeholder="Localização ou Condomínio..." 
                      className="w-full outline-none bg-transparent text-brand-dark font-medium placeholder:text-slate-400"
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
                        className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                      >
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors flex items-center space-x-3 group"
                            onClick={() => {
                              setSearchTerm(s);
                              setShowSuggestions(false);
                            }}
                          >
                            <MapPin size={16} className="text-slate-300 group-hover:text-brand-orange transition-colors" />
                            <span className="text-slate-600 group-hover:text-brand-dark font-medium">{s}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="md:w-48 bg-slate-50 rounded-2xl border border-slate-100 px-4 py-3 relative">
                  <select 
                    className="w-full bg-transparent outline-none text-brand-dark font-semibold cursor-pointer appearance-none"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                  >
                    <option value="Todas">Todos os Tipos</option>
                    <option value="Casas">Casas</option>
                    <option value="Apartamentos">Apartamentos</option>
                    <option value="Terrenos">Terrenos</option>
                  </select>
                </div>

                <div className="md:w-40 bg-slate-50 rounded-2xl border border-slate-100 px-4 py-3">
                  <select 
                    className="w-full bg-transparent outline-none text-brand-dark font-semibold cursor-pointer appearance-none"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="default">Relevância</option>
                    <option value="price-asc">Menor Preço</option>
                  </select>
                </div>

                <a href="#properties" className="btn-primary px-8 py-4 shadow-orange-500/20 text-center whitespace-nowrap hidden md:block">
                  Buscar Imóveis
                </a>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6 pt-4 border-t border-slate-100">
                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Faixa de Preço (R$)</span>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <input 
                      type="number" 
                      placeholder="Mínimo"
                      className="w-full md:w-32 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:border-brand-orange"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                    <span className="text-slate-300">a</span>
                    <input 
                      type="number" 
                      placeholder="Máximo"
                      className="w-full md:w-32 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:border-brand-orange"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="h-6 w-[1px] bg-slate-200 hidden md:block" />

                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {[
                    { label: 'Abaixo de 1M', min: '', max: 1000000 },
                    { label: '1M - 3M', min: 1000000, max: 3000000 },
                    { label: '3M - 5M', min: 3000000, max: 5000000 },
                    { label: 'Acima de 5M', min: 5000000, max: '' }
                  ].map((preset, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        setMinPrice(preset.min as any);
                        setMaxPrice(preset.max as any);
                      }}
                      className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 hover:bg-brand-orange/10 hover:text-brand-orange px-3 py-1.5 rounded-full transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button 
                    onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                    className="text-[10px] uppercase tracking-wider font-bold text-brand-orange hover:underline px-3 py-1.5"
                  >
                    Limpar
                  </button>
                </div>

                <a href="#properties" className="w-full btn-primary px-8 py-4 shadow-orange-500/20 text-center whitespace-nowrap block md:hidden mt-4">
                  Buscar Imóveis
                </a>
              </div>
            </motion.div>

            {/* Social Proof */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="mt-16 flex flex-wrap gap-12"
            >
              {[
                { val: '+20k', lab: 'Projetos Realizados' },
                { val: '+10k', lab: 'Casas Vendidas' },
                { val: '+20k', lab: 'Clientes Satisfeitos' }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-4xl font-bold text-white mb-1">{stat.val}</span>
                  <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">{stat.lab}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Featured Highlights --- */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-[40px] overflow-hidden aspect-video shadow-2xl group"
            >
              <img 
                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop" 
                alt="Highlight House"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 to-transparent flex items-end p-12">
                <div className="flex items-center text-white">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mr-6 border border-white/30 cursor-pointer hover:bg-white transition-colors group/play">
                    <ArrowRight className="text-white group-hover/play:text-brand-orange transition-colors" size={32} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold mb-1">O Próximo Nível do Luxo</h4>
                    <p className="text-white/70 italic font-serif">Veja por dentro da nossa obra prima atual.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <div className="space-y-8">
              <span className="text-brand-orange font-bold uppercase tracking-widest text-sm">Experiência Imobiliária</span>
              <h2 className="text-4xl md:text-6xl font-bold leading-tight">Excelência em cada metro quadrado.</h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                Nossa missão transcende a simples venda de imóveis. Entregamos curadoria, exclusividade e segurança jurídica para que sua única preocupação seja aproveitar o novo lar.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <div className="w-12 h-[2px] bg-brand-orange" />
                  <h5 className="font-bold text-xl">Curadoria Elite</h5>
                  <p className="text-sm text-slate-500 italic font-serif">Imóveis selecionados um a um por especialistas.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-[2px] bg-brand-orange" />
                  <h5 className="font-bold text-xl">Atendimento VIP</h5>
                  <p className="text-sm text-slate-500 italic font-serif">Disponibilidade total e foco absoluto no cliente.</p>
                </div>
              </div>
              <button className="btn-secondary group">
                Nossa História <ChevronRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- Property Listing --- */}
      <section id="properties" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <span className="text-brand-orange font-bold uppercase tracking-widest text-sm block mb-4">Catálogo Exclusivo</span>
              <h2 className="text-4xl md:text-5xl font-bold">Lançamentos & Oportunidades</h2>
            </div>
            <div className="flex space-x-4">
              <button className="px-6 py-2 rounded-full border border-slate-200 text-brand-dark font-semibold hover:border-brand-orange hover:text-brand-orange transition-all">Ver Todos</button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProperties.length > 0 ? (
              filteredProperties.map(property => (
                <div key={property.id}>
                  <PropertyCard property={property} />
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-2xl text-slate-400 italic">Nenhum imóvel encontrado com esses critérios.</p>
                <button 
                  onClick={() => {
                    setSearchTerm(''); 
                    setTypeFilter('Todas');
                    setMinPrice('');
                    setMaxPrice('');
                    setSortBy('default');
                  }}
                  className="mt-4 text-brand-orange font-bold hover:underline"
                >
                  Limpar todos os filtros
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
            <h2 className="text-4xl md:text-7xl font-bold text-white mb-8">Pronto para dar o próximo passo?</h2>
            <p className="text-xl text-white/70 mb-12 leading-relaxed">
              Agende agora uma consultoria personalizada com um de nossos corretores especialistas em alto padrão.
            </p>
            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="btn-primary text-xl px-12 py-5 shadow-orange-500/10"
              >
                Anunciar meu Imóvel
              </button>
              <button className="bg-transparent border-2 border-white/30 text-white hover:border-white transition-colors px-12 py-5 rounded-full font-bold text-xl">
                Baixar Catálogo PDF
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Featured Large Property Cards --- */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 italic font-serif">Destaques Premium</h2>
            <p className="text-slate-500">Inegavelmente extraordinários. Incomparavelmente exclusivos.</p>
          </div>
          
          <div className="flex flex-col space-y-16">
            {properties.slice(0, 3).map((property, i) => (
              <motion.div 
                key={property.id}
                initial={{ opacity: 0, x: i % 2 === 0 ? -100 : 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-10 md:gap-20`}
              >
                <div className="w-full md:w-3/5 relative">
                  <div className="aspect-[16/9] rounded-[3rem] overflow-hidden shadow-2xl">
                    <img src={property.image} alt={property.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className={`absolute -bottom-6 ${i % 2 === 0 ? '-right-6' : '-left-6'} bg-brand-orange text-white p-10 rounded-3xl shadow-2xl hidden md:block w-64`}>
                    <p className="text-xs uppercase tracking-widest font-bold mb-2 opacity-80 underline underline-offset-4">Investimento</p>
                    <p className="text-2xl font-bold">{property.price}</p>
                  </div>
                </div>
                <div className="w-full md:w-2/5 space-y-6">
                  <span className="text-brand-orange font-bold text-5xl opacity-20 font-serif">0{i+1}</span>
                  <h3 className="text-4xl font-bold">{property.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-lg italic">
                    Descubra uma experiência sensorial única nesta propriedade localizada no {property.location}. Um projeto que redefine os limites da arquitetura contemporânea.
                  </p>
                  <ul className="grid grid-cols-2 gap-4 pb-6">
                    <li className="flex items-center text-slate-700 font-medium"><ChevronRight size={16} className="text-brand-orange mr-2" /> Acabamento AA+</li>
                    <li className="flex items-center text-slate-700 font-medium"><ChevronRight size={16} className="text-brand-orange mr-2" /> Automação Total</li>
                    <li className="flex items-center text-slate-700 font-medium"><ChevronRight size={16} className="text-brand-orange mr-2" /> Paisagismo</li>
                    <li className="flex items-center text-slate-700 font-medium"><ChevronRight size={16} className="text-brand-orange mr-2" /> Concierge</li>
                  </ul>
                  <button className="group flex items-center font-bold text-lg text-brand-dark hover:text-brand-orange transition-colors">
                    Agendar Visita Exclusiva <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Team Section --- */}
      <section id="team" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-brand-orange font-bold uppercase tracking-widest text-sm mb-4 block">Nossa Equipe</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Mestres em Negociações</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed italic font-serif">
              Unimos expertise técnica, rede de contatos poderosa e paixão por realizar sonhos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {TEAM.map(member => (
              <motion.div 
                key={member.id}
                whileHover={{ y: -10 }}
                className="group text-center"
              >
                <div className="relative mb-8 mx-auto w-64 h-80 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-6">
                    <a href="#" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-dark hover:bg-brand-orange hover:text-white transition-colors shadow-lg"><Instagram size={20} /></a>
                    <a href="#" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-dark hover:bg-brand-orange hover:text-white transition-colors shadow-lg"><Linkedin size={20} /></a>
                  </div>
                </div>
                <h4 className="text-2xl font-bold text-brand-dark mb-1">{member.name}</h4>
                <p className="text-brand-orange font-semibold uppercase tracking-widest text-xs">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Testimonials --- */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-brand-dark rounded-[4rem] p-12 md:p-24 relative overflow-hidden">
            <div className="absolute top-10 right-10 opacity-5 text-[20rem] font-serif leading-none select-none">"</div>
            <div className="relative z-10 grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">O que dizem nossos <span className="text-brand-orange italic">clientes</span></h2>
                <div className="flex space-x-1 text-brand-orange mb-8 text-2xl">
                  <Star fill="currentColor" />
                  <Star fill="currentColor" />
                  <Star fill="currentColor" />
                  <Star fill="currentColor" />
                  <Star fill="currentColor" />
                </div>
                <p className="text-white/60 leading-relaxed italic font-serif">A confiança é o nosso maior patrimônio. Veja por que somos a escolha número um para o mercado de luxo.</p>
              </div>
              <div className="lg:col-span-2 grid md:grid-cols-2 gap-8">
                {TESTIMONIALS.map(t => (
                  <div key={t.id} className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                    <p className="text-white/80 mb-6 italic text-lg">"{t.text}"</p>
                    <div>
                      <h5 className="text-white font-bold text-xl">{t.name}</h5>
                      <p className="text-brand-orange text-sm uppercase tracking-widest font-semibold">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CRM Contact Section --- */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="text-brand-orange font-bold uppercase tracking-widest text-sm mb-4 block">Consultoria Premium</span>
              <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">Vamos construir seu <span className="italic font-serif">patrimônio</span> juntos.</h2>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed italic">
                Preencha o formulário ao lado para que nosso time de especialistas inicie uma busca personalizada baseada no seu perfil investidor ou familiar.
              </p>
              <div className="space-y-6">
                {[
                  { title: "Análise de Perfil", desc: "Consultoria técnica sobre regiões e potencial de valorização." },
                  { title: "Busca Off-Market", desc: "Acesso a imóveis exclusivos que ainda não entraram no mercado." },
                  { title: "Blindagem Jurídica", desc: "Segurança total em cada etapa do contrato e documentação." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <ChevronRight size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl">{item.title}</h4>
                      <p className="text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* --- Interactive Map Section --- */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-brand-orange font-bold uppercase tracking-widest text-sm mb-4 block">Nossa Localização</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Expertise na Região de Sorocaba</h2>
            <p className="text-slate-600 max-w-2xl mx-auto italic font-serif">
              Explore o mapa e filtre por regiões específicas para encontrar as melhores oportunidades.
            </p>
          </div>

          {/* Local Map Filters */}
          <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-2">Cidade</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-brand-orange font-medium"
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
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-brand-orange font-medium"
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
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-brand-orange font-medium"
                value={searchTerm.split(',').find(s => filterOptions.condominiums.includes(s.trim())) || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
              >
                <option value="">Todos os Condomínios</option>
                {filterOptions.condominiums.map(con => (
                  <option key={con} value={con}>{con}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 rounded-[3.5rem] overflow-hidden shadow-2xl h-[600px] border-4 border-white relative group z-10">
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

      {/* --- Contact & Footer --- */}
      <footer id="contact" className="bg-brand-dark pt-24 pb-12 text-white/90">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-16 mb-20">
            {/* Brand Info */}
            <div className="lg:col-span-1 space-y-8">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-brand-orange flex items-center justify-center rounded-xl">
                  <Home className="text-white" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-white">
                  CORRETORA <span className="text-brand-orange">ELIAS</span>
                </span>
              </div>
              <p className="text-white/50 italic font-serif">
                Sua porta de entrada para um mundo de exclusividade imobiliária. Onde seus sonhos encontram o endereço perfeito.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="hover:text-brand-orange transition-colors"><Instagram /></a>
                <a href="#" className="hover:text-brand-orange transition-colors"><Facebook /></a>
                <a href="#" className="hover:text-brand-orange transition-colors"><Linkedin /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-white font-bold text-xl mb-8 uppercase tracking-widest text-sm">Links Úteis</h5>
              <ul className="space-y-4 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Sobre Nós</a></li>
                <li><a href="#properties" className="hover:text-white transition-colors">Nossos Imóveis</a></li>
                <li><a href="#team" className="hover:text-white transition-colors">Time de Corretores</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog Imobiliário</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h5 className="text-white font-bold text-xl mb-8 uppercase tracking-widest text-sm">Contato</h5>
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 text-brand-orange"><Phone size={20} /></div>
                <div>
                  <p className="text-white font-bold">Endereço Principal</p>
                  <p className="text-white/60">Av. Profa. Izoraida Marques Peres - Campolim, Sorocaba/SP</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 text-brand-orange"><Mail size={20} /></div>
                <div>
                  <p className="text-white font-bold">E-mail</p>
                  <p className="text-white/60">contato@corretoraelias.com.br</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 text-brand-orange"><Clock size={20} /></div>
                <div>
                  <p className="text-white font-bold">Funcionamento</p>
                  <p className="text-white/60 italic font-serif leading-tight">Seg a Sex: 09h - 19h<br />Sáb: 09h - 13h</p>
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h5 className="text-white font-bold text-xl mb-8 uppercase tracking-widest text-sm">Newsletter</h5>
              <p className="text-white/60 mb-6 text-sm italic font-serif">Receba oportunidades exclusivas antes de todo o mercado diretamente no seu e-mail.</p>
              <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Seu melhor e-mail" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-orange transition-colors"
                />
                <button className="w-full btn-primary py-3 rounded-xl">Inscrever-se</button>
              </form>
            </div>
          </div>

          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-white/40 text-sm italic font-serif">
              © 2026 Corretora Elias Imóveis de Luxo. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-4 text-xs font-bold uppercase tracking-widest text-white/40">
              <span>CNPJ: 00.000.000/0000-00</span>
              <span className="w-1 h-1 bg-white/40 rounded-full" />
              <span>CRECI: 000.000-J</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
