import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  addConfigOption, 
  updateConfigOption, 
  deleteConfigOption, 
  toggleConfigOption, 
  reorderConfigOptions 
} from '../lib/firebase';
import { 
  ArrowUp, 
  ArrowDown, 
  Edit2, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  Loader2, 
  Eye, 
  EyeOff, 
  FolderPlus,
  MapPin
} from 'lucide-react';

interface ConfigOptionManagerProps {
  collectionName: string;
  title: string;
  description: string;
  citiesList?: any[]; // For bairros association
}

export default function ConfigOptionManager({ 
  collectionName, 
  title, 
  description,
  citiesList = []
}: ConfigOptionManagerProps) {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  // Specific for bairros association
  const [selectedCityId, setSelectedCityId] = useState<string>('all');
  const [associatedCityId, setAssociatedCityId] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    const q = collection(db, collectionName);
    
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const items = snapshot.docs
        .filter((docItem: any) => docItem.id !== "init" && docItem.data()?.init !== true)
        .map((docItem: any) => ({
          id: docItem.id,
          ...docItem.data()
        }));
        
      // Sort: ordem asc
      items.sort((a: any, b: any) => {
        const orderA = a.ordem !== undefined ? Number(a.ordem) : 9999;
        const orderB = b.ordem !== undefined ? Number(b.ordem) : 9999;
        return orderA - orderB;
      });
      
      setOptions(items);
      setLoading(false);
    }, (error: any) => {
      console.error(`Error loading options for ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName]);

  // Set default associated city when citiesList loads
  useEffect(() => {
    if (citiesList.length > 0 && !associatedCityId) {
      setAssociatedCityId(citiesList[0].id || '');
    }
  }, [citiesList]);

  // Filter options if we are displaying bairros and selectedCityId !== 'all'
  const filteredOptions = options.filter(opt => {
    if (collectionName !== 'bairros' || selectedCityId === 'all') return true;
    return opt.cidadeId === selectedCityId || opt.cidade === selectedCityId || opt.cidadeNome === selectedCityId;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      setLoading(true);
      const nextOrdem = options.length > 0 ? Math.max(...options.map(o => o.ordem ?? 0)) + 1 : 0;
      
      const payload: any = {
        nome: newItemName.trim(),
        label: newItemName.trim(),
        value: newItemName.trim(),
        ativo: true,
        ordem: nextOrdem
      };

      if (collectionName === 'bairros') {
        const selectedCity = citiesList.find(c => c.id === associatedCityId);
        payload.cidadeId = associatedCityId;
        payload.cidadeNome = selectedCity ? selectedCity.nome : 'Sorocaba';
        payload.cidade = selectedCity ? selectedCity.nome : 'Sorocaba'; // Fallback compatibility
        payload.estado = 'SP';
      }

      await addConfigOption(collectionName, payload);
      setNewItemName('');
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar item.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditingName(item.nome || item.label || '');
    if (collectionName === 'bairros') {
      setAssociatedCityId(item.cidadeId || citiesList[0]?.id || '');
    }
  };

  const handleSaveEdit = async (item: any) => {
    if (!editingName.trim()) return;
    try {
      setLoading(true);
      const payload: any = {
        nome: editingName.trim(),
        label: editingName.trim(),
        value: editingName.trim()
      };

      if (collectionName === 'bairros') {
        const selectedCity = citiesList.find(c => c.id === associatedCityId);
        payload.cidadeId = associatedCityId;
        payload.cidadeNome = selectedCity ? selectedCity.nome : item.cidadeNome || 'Sorocaba';
        payload.cidade = selectedCity ? selectedCity.nome : item.cidadeNome || 'Sorocaba';
      }

      await updateConfigOption(collectionName, item.id, payload);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar alteração.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleConfigOption(collectionName, id, !currentStatus);
    } catch (err) {
      console.error(err);
      alert('Erro ao alterar status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir definitivamente esta opção?')) return;
    try {
      setLoading(true);
      await deleteConfigOption(collectionName, id);
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir item.');
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredOptions.length) return;

    // Create a copy of the options array
    const updated = [...options];
    
    // Find absolute positions in original list
    const itemA = filteredOptions[index];
    const itemB = filteredOptions[targetIndex];
    
    const absIndexA = updated.findIndex(o => o.id === itemA.id);
    const absIndexB = updated.findIndex(o => o.id === itemB.id);

    // Swap orders
    const tempOrdem = updated[absIndexA].ordem;
    updated[absIndexA].ordem = updated[absIndexB].ordem;
    updated[absIndexB].ordem = tempOrdem;

    try {
      setLoading(true);
      await reorderConfigOptions(collectionName, [updated[absIndexA], updated[absIndexB]]);
    } catch (err) {
      console.error(err);
      alert('Erro ao reordenar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div>
        <h4 className="text-sm font-black text-[#050505] uppercase tracking-wider">{title}</h4>
        <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest mt-0.5">{description}</p>
      </div>

      {/* FILTER IF BAIRROS */}
      {collectionName === 'bairros' && citiesList.length > 0 && (
        <div className="bg-[#F6F6F4] p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <label className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest block mb-1">Filtrar por Cidade</label>
            <select 
              className="bg-white border border-[#EFEFEA] focus:outline-none rounded-lg px-3 py-1.5 text-xs font-bold text-stone-900 transition-all"
              value={selectedCityId}
              onChange={e => setSelectedCityId(e.target.value)}
            >
              <option value="all">Exibir todos os bairros</option>
              {citiesList.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div className="text-[9px] text-[#A1A1AA] font-black uppercase tracking-widest">
            {filteredOptions.length} Bairros encontrados nesta visualização
          </div>
        </div>
      )}

      {/* ADD NEW OPTION FORM */}
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row items-end gap-3.5 bg-[#FCFCFB] p-5 border border-[#EFEFEA] rounded-2xl">
        <div className="flex-1 w-full space-y-1.5">
          <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">
            Novo item para {title}
          </label>
          <input 
            type="text" 
            placeholder="Ex: Novo item, Condomínio, Região Central, etc."
            className="w-full bg-white border border-[#EFEFEA] focus:ring-4 focus:ring-amber-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-[#050505] transition-all"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
          />
        </div>

        {collectionName === 'bairros' && citiesList.length > 0 && (
          <div className="w-full sm:w-48 space-y-1.5">
            <label className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest pl-1">
              Cidade Pertencente
            </label>
            <select 
              className="w-full bg-white border border-[#EFEFEA] outline-none rounded-xl px-3 py-3 text-xs font-bold text-[#050505]"
              value={associatedCityId}
              onChange={e => setAssociatedCityId(e.target.value)}
            >
              {citiesList.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          className="bg-[#050505] hover:bg-stone-900 text-[#FFD700] hover:text-[#FFE033] px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm shrink-0 w-full sm:w-auto h-[46px] transition-all"
        >
          <Plus size={14} />
          Adicionar
        </button>
      </form>

      {/* LIST OPTIONS */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 bg-[#FCFCFC] border border-[#EFEFEA] rounded-2xl">
          <Loader2 size={24} className="text-amber-500 animate-spin" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sincronizando opções...</span>
        </div>
      ) : filteredOptions.length === 0 ? (
        <div className="py-12 text-center bg-[#FCFCFC] border border-[#EFEFEA] rounded-2xl">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Não existem registros adicionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredOptions.map((item, idx) => {
            const isEditing = editingId === item.id;
            return (
              <div 
                key={item.id} 
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border ${isEditing ? 'border-amber-500 bg-amber-500/[0.01]' : 'border-[#EFEFEA] hover:border-zinc-300'} rounded-2xl transition-all duration-200 gap-4`}
              >
                {/* NAME & INFO STATE */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="font-mono text-[10px] text-stone-400 font-bold shrink-0">
                    #{(item.ordem ?? idx) + 1}
                  </div>
                  {isEditing ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
                      <input 
                        type="text"
                        className="flex-1 bg-white border border-amber-400 focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-stone-900"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                      />
                      {collectionName === 'bairros' && citiesList.length > 0 && (
                        <select 
                          className="w-full sm:w-44 bg-white border border-[#EFEFEA] outline-none rounded-xl px-3 py-2 text-xs font-bold text-stone-900"
                          value={associatedCityId}
                          onChange={e => setAssociatedCityId(e.target.value)}
                        >
                          {citiesList.map(c => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-[#050505] block">
                        {item.nome || item.label}
                      </span>
                      {collectionName === 'bairros' && item.cidadeNome && (
                        <span className="text-[8px] bg-stone-100 px-1.5 py-0.5 rounded-md font-bold text-stone-500 uppercase tracking-wider inline-flex items-center gap-1 mt-1">
                          <MapPin size={8} /> {item.cidadeNome}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* CONTROLS */}
                <div className="flex items-center justify-end gap-2.5">
                  {/* Status Switch if NOT editing */}
                  {!isEditing && (
                    <button 
                      onClick={() => handleToggleActive(item.id, item.ativo)}
                      className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 transition-all ${
                        item.ativo !== false 
                          ? 'bg-amber-100 text-amber-600 border border-amber-200' 
                          : 'bg-stone-100 text-stone-400 border border-stone-200'
                      }`}
                    >
                      {item.ativo !== false ? (
                        <>
                          <Eye size={10} /> Active
                        </>
                      ) : (
                        <>
                          <EyeOff size={10} /> Inactive
                        </>
                      )}
                    </button>
                  )}

                  {/* Reorder actions */}
                  {!isEditing && (
                    <div className="flex items-center border border-stone-100 rounded-lg overflow-hidden">
                      <button 
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 hover:bg-stone-50 text-stone-400 hover:text-stone-700 disabled:opacity-30 transition-all"
                        title="Subir ordem"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <div className="w-[1px] h-3 bg-stone-100" />
                      <button 
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === filteredOptions.length - 1}
                        className="p-1.5 hover:bg-stone-50 text-stone-400 hover:text-stone-700 disabled:opacity-30 transition-all"
                        title="Descer ordem"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  )}

                  {/* Action buttons */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSaveEdit(item)}
                        className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
                        title="Salvar"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                        title="Cancelar"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 hover:bg-stone-100 text-stone-400 hover:text-[#050505] rounded-lg transition-all border border-stone-100"
                        title="Editar"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition-all border border-stone-100"
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
