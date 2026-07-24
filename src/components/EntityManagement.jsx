import React, { useState } from 'react';
import { Plus, X, Check, Truck, ShoppingBag, Edit3, Trash2, AlertCircle } from './Icons';

export const FornecedorSelect = ({ value, onChange, fornecedores, onAddFornecedor }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [novoFornecedor, setNovoFornecedor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fornecedoresFiltrados = (fornecedores || []).filter(f => f && typeof f === 'string' && f.toLowerCase().includes((searchTerm || '').toLowerCase()));

  const handleSelect = (fornecedor) => { onChange(fornecedor); setIsAdding(false); setSearchTerm(''); };
  const handleAddNew = () => { if (novoFornecedor.trim()) { onAddFornecedor(novoFornecedor.trim()); onChange(novoFornecedor.trim()); setNovoFornecedor(''); setIsAdding(false); setSearchTerm(''); } };

  return (
    <div className="relative">
      {!isAdding ? (
        <div>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar fornecedor..." className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm pr-8" />
              {value && <button onClick={() => { onChange(''); setSearchTerm(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X size={16} /></button>}
            </div>
            <button type="button" onClick={() => setIsAdding(true)} className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition font-bold text-sm flex items-center gap-1" title="Cadastrar novo fornecedor"><Plus size={16} /> Novo</button>
          </div>
          {searchTerm && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {fornecedoresFiltrados.length > 0 ? (
                fornecedoresFiltrados.map((fornecedor, idx) => (
                  <button key={idx} type="button" onClick={() => handleSelect(fornecedor)} className={`w-full text-left px-4 py-2 hover:bg-[#F4B41A]/20 transition flex items-center gap-2 ${value === fornecedor ? 'bg-[#F4B41A]/30 font-bold' : ''}`}>
                    <Truck size={16} className="text-gray-500" /> {fornecedor} {value === fornecedor && <Check size={16} className="text-green-600 ml-auto" />}
                  </button>
                ))
              ) : <div className="px-4 py-3 text-gray-500 text-sm">Nenhum fornecedor encontrado</div>}
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input type="text" value={novoFornecedor} onChange={(e) => setNovoFornecedor(e.target.value)} placeholder="Nome do novo fornecedor" className="flex-1 border border-[#F4B41A] p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm font-medium" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleAddNew(); if (e.key === 'Escape') setIsAdding(false); }} />
          <button type="button" onClick={handleAddNew} className="bg-[#F4B41A] text-[#5C3A21] px-4 py-2 rounded hover:bg-[#e0a210] transition font-bold"><Check size={18} /></button>
          <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-400 transition"><X size={18} /></button>
        </div>
      )}
      {value && !isAdding && (
        <div className="mt-2 flex items-center gap-2 bg-[#F4B41A]/10 border border-[#F4B41A]/30 rounded-lg px-3 py-2">
          <Truck size={16} className="text-[#5C3A21]" /> <span className="font-bold text-[#5C3A21] text-sm">Fornecedor: {value}</span>
        </div>
      )}
    </div>
  );
};

export const ClienteSelect = ({ value, onChange, clientes, onAddCliente }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [novoCliente, setNovoCliente] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedList = Array.isArray(value) ? value : (value ? [value] : []);
  const clientesFiltrados = (clientes || []).filter(c => c && typeof c === 'string' && c.toLowerCase().includes((searchTerm || '').toLowerCase()));

  const handleSelect = (cliente) => { 
    onChange(cliente); // No formulário nós interceptamos para adicionar à lista
    setIsAdding(false); 
    setSearchTerm(''); 
  };
  
  const handleAddNew = () => { 
    if (novoCliente.trim()) { 
        const n = novoCliente.trim();
        onAddCliente(n); 
        onChange(n); 
        setNovoCliente(''); 
        setIsAdding(false); 
        setSearchTerm(''); 
    } 
  };

  return (
    <div className="relative">
      {!isAdding ? (
        <div>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar cliente/loja..." className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm pr-8" />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X size={16} /></button>}
            </div>
            <button type="button" onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 transition font-bold text-sm flex items-center gap-1" title="Cadastrar novo cliente"><Plus size={16} /> Novo</button>
          </div>
          {searchTerm && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((cliente, idx) => (
                  <button key={idx} type="button" onClick={() => handleSelect(cliente)} className={`w-full text-left px-4 py-2 hover:bg-indigo-50 transition flex items-center gap-2 ${selectedList.includes(cliente) ? 'bg-indigo-100 font-bold' : ''}`}>
                    <ShoppingBag size={16} className="text-gray-500" /> {cliente} {selectedList.includes(cliente) && <Check size={16} className="text-indigo-600 ml-auto" />}
                  </button>
                ))
              ) : <div className="px-4 py-3 text-gray-500 text-sm">Nenhum cliente encontrado</div>}
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input type="text" value={novoCliente} onChange={(e) => setNovoCliente(e.target.value)} placeholder="Nome do novo cliente" className="flex-1 border border-indigo-500 p-2.5 rounded focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-medium" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleAddNew(); if (e.key === 'Escape') setIsAdding(false); }} />
          <button type="button" onClick={handleAddNew} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition font-bold"><Check size={18} /></button>
          <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-400 transition"><X size={18} /></button>
        </div>
      )}
    </div>
  );
};

export const GerenciarFornecedoresModal = ({ isOpen, onClose, fornecedores, onAdd, onEdit, onRemove }) => {
  const [editingName, setEditingName] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newFornecedor, setNewFornecedor] = useState('');
  const [fornecedorToDelete, setFornecedorToDelete] = useState(null);

  if (!isOpen) return null;

  const handleSaveEdit = (oldName) => {
    onEdit(oldName, editValue);
    setEditingName(null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm no-print">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-fade-in-up flex flex-col max-h-[85vh] relative">
        
        {fornecedorToDelete && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4 rounded-xl">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center animate-fade-in-up">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
              <p className="font-bold text-gray-800 text-lg mb-2">Excluir Fornecedor?</p>
              <p className="text-gray-600 text-sm mb-6">Tem certeza que deseja apagar "{fornecedorToDelete}" da lista?</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setFornecedorToDelete(null)} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 transition">Cancelar</button>
                <button onClick={() => { onRemove(fornecedorToDelete); setFornecedorToDelete(null); }} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-white transition shadow-md">Sim, Apagar</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-5 border-b border-gray-200 pb-3">
          <h3 className="text-xl font-black text-[#5C3A21] flex items-center gap-2"><Truck size={24}/> Gerenciar Fornecedores</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 p-2 rounded-lg transition"><X size={20}/></button>
        </div>

        <div className="flex gap-2 mb-5">
          <input type="text" value={newFornecedor} onChange={(e) => setNewFornecedor(e.target.value)} placeholder="Nome do novo fornecedor..." className="flex-1 border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none shadow-sm font-medium" onKeyDown={(e) => { if (e.key === 'Enter') { onAdd(newFornecedor.trim()); setNewFornecedor(''); } }} />
          <button onClick={() => { if(newFornecedor.trim()) { onAdd(newFornecedor.trim()); setNewFornecedor(''); } }} className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition font-bold flex items-center gap-1 shadow-sm"><Plus size={18}/><span className="hidden sm:inline">Adicionar</span></button>
        </div>

        <div className="overflow-y-auto flex-1 border border-gray-200 rounded-lg p-2 bg-gray-50">
          {(fornecedores || []).length === 0 ? <p className="text-center text-gray-500 py-6 text-sm font-medium">Nenhum fornecedor cadastrado.</p> :
            <ul className="space-y-2">
              {(fornecedores || []).filter(f => typeof f === 'string').sort().map((f, idx) => (
                <li key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm transition hover:shadow-md">
                  {editingName === f ? (
                    <div className="flex flex-1 gap-2 items-center">
                      <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus className="flex-1 border-b-2 border-[#F4B41A] outline-none px-1 text-sm font-bold bg-yellow-50" onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(f); if (e.key === 'Escape') setEditingName(null); }} />
                      <button onClick={() => handleSaveEdit(f)} className="text-white bg-green-500 hover:bg-green-600 p-1.5 rounded transition"><Check size={16}/></button>
                      <button onClick={() => setEditingName(null)} className="text-gray-500 bg-gray-200 hover:bg-gray-300 p-1.5 rounded transition"><X size={16}/></button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-gray-700 text-sm truncate pr-2" title={f}>{f}</span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setEditingName(f); setEditValue(f); }} className="text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 p-1.5 rounded transition" title="Editar nome"><Edit3 size={16}/></button>
                        <button onClick={() => setFornecedorToDelete(f)} className="text-red-500 hover:text-white bg-red-50 hover:bg-red-600 p-1.5 rounded transition" title="Excluir"><Trash2 size={16}/></button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          }
        </div>
      </div>
    </div>
  );
};

export const GerenciarClientesModal = ({ isOpen, onClose, clientes, onAdd, onEdit, onRemove }) => {
  const [editingName, setEditingName] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newCliente, setNewCliente] = useState('');
  const [clienteToDelete, setClienteToDelete] = useState(null);

  if (!isOpen) return null;

  const handleSaveEdit = (oldName) => {
    onEdit(oldName, editValue);
    setEditingName(null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm no-print">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-fade-in-up flex flex-col max-h-[85vh] relative">
        
        {clienteToDelete && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4 rounded-xl">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center animate-fade-in-up">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
              <p className="font-bold text-gray-800 text-lg mb-2">Excluir Cliente?</p>
              <p className="text-gray-600 text-sm mb-6">Tem certeza que deseja apagar "{clienteToDelete}" da lista?</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setClienteToDelete(null)} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 transition">Cancelar</button>
                <button onClick={() => { onRemove(clienteToDelete); setClienteToDelete(null); }} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-white transition shadow-md">Sim, Apagar</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-5 border-b border-gray-200 pb-3">
          <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2"><ShoppingBag size={24}/> Gerenciar Clientes</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 p-2 rounded-lg transition"><X size={20}/></button>
        </div>

        <div className="flex gap-2 mb-5">
          <input type="text" value={newCliente} onChange={(e) => setNewCliente(e.target.value)} placeholder="Nome do novo cliente..." className="flex-1 border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-medium" onKeyDown={(e) => { if (e.key === 'Enter') { onAdd(newCliente.trim()); setNewCliente(''); } }} />
          <button onClick={() => { if(newCliente.trim()) { onAdd(newCliente.trim()); setNewCliente(''); } }} className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition font-bold flex items-center gap-1 shadow-sm"><Plus size={18}/><span className="hidden sm:inline">Adicionar</span></button>
        </div>

        <div className="overflow-y-auto flex-1 border border-gray-200 rounded-lg p-2 bg-gray-50">
          {(clientes || []).length === 0 ? <p className="text-center text-gray-500 py-6 text-sm font-medium">Nenhum cliente cadastrado.</p> :
            <ul className="space-y-2">
              {(clientes || []).filter(c => typeof c === 'string').sort().map((c, idx) => (
                <li key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm transition hover:shadow-md">
                  {editingName === c ? (
                    <div className="flex flex-1 gap-2 items-center">
                      <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus className="flex-1 border-b-2 border-indigo-500 outline-none px-1 text-sm font-bold bg-indigo-50" onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(c); if (e.key === 'Escape') setEditingName(null); }} />
                      <button onClick={() => handleSaveEdit(c)} className="text-white bg-green-500 hover:bg-green-600 p-1.5 rounded transition"><Check size={16}/></button>
                      <button onClick={() => setEditingName(null)} className="text-gray-500 bg-gray-200 hover:bg-gray-300 p-1.5 rounded transition"><X size={16}/></button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-gray-700 text-sm truncate pr-2" title={c}>{c}</span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setEditingName(c); setEditValue(c); }} className="text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 p-1.5 rounded transition" title="Editar nome"><Edit3 size={16}/></button>
                        <button onClick={() => setClienteToDelete(c)} className="text-red-500 hover:text-white bg-red-50 hover:bg-red-600 p-1.5 rounded transition" title="Excluir"><Trash2 size={16}/></button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          }
        </div>
      </div>
    </div>
  );
};
