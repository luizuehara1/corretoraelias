import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Check, AlertTriangle, X, Search, FileText, Trash2, Edit2, DollarSign, Receipt } from 'lucide-react';
import { ContractWizard } from './ContractWizard';

interface Rental {
  id: string;
  imovelId: string;
  codigoImovel: string;
  imovelTitulo: string;
  locatarioNome: string;
  locatarioTelefone: string;
  valorAluguel: number;
  diaVencimento: number;
  statusLocacao: 'Ativa' | 'Cancelada' | 'Finalizada';
  statusPagamento: 'Pago' | 'Pendente' | 'Atrasado';
  dataInicio: string;
  dataFim: string;
  ultimoPagamentoData?: string;
  ultimoPagamentoMes?: string;
}

const getStatusBadge = (status: Rental['statusPagamento']) => {
  const styles = {
    Pago: 'bg-emerald-100 text-emerald-800',
    Pendente: 'bg-amber-100 text-amber-800',
    Atrasado: 'bg-rose-100 text-rose-800',
  };
  return <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${styles[status]}`}>{status}</span>;
};

export const RentalDashboard: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ activeContracts: 0, paidThisMonth: 0, pendingOverdue: 0, projectedIncome: 0 });

  // Wizard hook state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDocType, setWizardDocType] = useState<'ReciboLocatario' | 'ReciboLocador' | 'ReciboEditavel'>('ReciboLocatario');
  const [selectedRental, setSelectedRental] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'locacoes'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rental));
      setRentals(data);
      const active = data.filter(r => r.statusLocacao === 'Ativa');
      const paid = data.filter(r => r.statusPagamento === 'Pago').length;
      const pending = data.filter(r => r.statusPagamento === 'Pendente' || r.statusPagamento === 'Atrasado').length;
      const projected = active.reduce((sum, r) => sum + (r.valorAluguel || 0), 0);
      setStats({ activeContracts: active.length, paidThisMonth: paid, pendingOverdue: pending, projectedIncome: projected });
      setLoading(false);
    });
    return unsub;
  }, []);

  const openReceiptWizard = (rental: Rental, type: 'ReciboLocatario' | 'ReciboLocador' | 'ReciboEditavel') => {
    setSelectedRental(rental);
    setWizardDocType(type);
    setWizardOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-stone-900">Gestão de Locações</h2>
        <button className="bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nova Locação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
            { label: 'Contratos Ativos', value: stats.activeContracts, color: 'text-stone-900' },
            { label: 'Pagos Este Mês', value: stats.paidThisMonth, color: 'text-stone-900' },
            { label: 'Pendentes / Atrasados', value: stats.pendingOverdue, color: 'text-rose-500' },
            { label: 'Receita Mensal Prevista', value: stats.projectedIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), color: 'text-stone-900' }
        ].map(s => (
            <div key={s.label} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                <div className="text-stone-500 text-xs font-bold uppercase">{s.label}</div>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            </div>
        ))}
      </div>
      
      <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 text-stone-600 uppercase font-black">
            <tr>
              <th className="p-4">Imóvel</th>
              <th className="p-4">Locatário</th>
              <th className="p-4">Valor / Vencimento</th>
              <th className="p-4">Status</th>
              <th className="p-4">Ações / Recibos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-700">
            {rentals.map(r => (
              <tr key={r.id} className="hover:bg-amber-500/5 transition">
                <td className="p-4 font-semibold">{r.imovelTitulo} ({r.codigoImovel})</td>
                <td className="p-4 font-medium">{r.locatarioNome}</td>
                <td className="p-4 font-semibold">{r.valorAluguel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {r.diaVencimento}</td>
                <td className="p-4">{getStatusBadge(r.statusPagamento)}</td>
                <td className="p-4 flex items-center gap-2">
                    {/* Receipts generation */}
                    <button 
                      onClick={() => openReceiptWizard(r, 'ReciboLocatario')}
                      className="px-2 py-1 bg-[#111111]/5 hover:bg-[#111111]/15 text-stone-800 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer transition"
                      title="Recibo do Locatário (Inquilino)"
                    >
                      <Receipt size={11} className="text-[#F5B400]" /> Inquilino
                    </button>
                    <button 
                      onClick={() => openReceiptWizard(r, 'ReciboLocador')}
                      className="px-2 py-1 bg-[#111111]/5 hover:bg-[#111111]/15 text-stone-800 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer transition"
                      title="Recibo do Locador"
                    >
                      <Receipt size={11} className="text-[#F5B400]" /> Locador
                    </button>
                    <button 
                      onClick={() => openReceiptWizard(r, 'ReciboEditavel')}
                      className="px-2 py-1 bg-[#111111]/5 hover:bg-[#111111]/15 text-stone-800 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer transition"
                      title="Recibo Editável"
                    >
                      <Receipt size={11} className="text-[#F5B400]" /> Editável
                    </button>

                    <div className="w-[1px] h-4 bg-stone-300 mx-1"></div>

                    <button className="p-1 hover:bg-stone-100 rounded" title="Visualizar ficha"><FileText size={15}/></button>
                    <button className="p-1 hover:bg-stone-100 rounded" title="Editar locação"><Edit2 size={15}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contract & Recibo Creation Wizard */}
      {wizardOpen && (
        <ContractWizard 
          onClose={() => setWizardOpen(false)}
          initialLocacao={selectedRental}
          initialDocType={wizardDocType}
        />
      )}
    </div>
  );
};
