import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Key, Settings, Plus, Users, Trash2, X, User, Check, Clock } from './Icons';

export const CustomDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border ${isOpen ? 'border-[#F4B41A] ring-2 ring-[#F4B41A]/30' : 'border-gray-200'} hover:border-[#F4B41A] rounded-xl pl-4 pr-10 py-2.5 text-[13px] font-bold text-gray-700 text-left outline-none transition-all shadow-sm truncate flex items-center justify-between`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : ''}</span>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </button>

      {isOpen && (
          <div className="absolute z-[9999] w-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1.5 animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors flex items-center justify-between ${value === opt.value ? 'bg-[#F4B41A]/10 text-[#5C3A21] font-black' : 'text-gray-600 hover:bg-gray-50 font-medium hover:text-gray-900'}`}
            >
              <span className="truncate pr-2">{opt.label}</span>
              {value === opt.value && <Check size={14} className="text-[#5C3A21] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const GerenciarUsuariosModal = ({ isOpen, onClose, usersDirectory, currentUid, onAddUser, onRemoveUser, onResetPassword, onUpdatePermissions }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [isNewAdmin, setIsNewAdmin] = useState(false);
  const [isCanApprove, setIsCanApprove] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [modalMessage, setModalMessage] = useState('');
  const [userToRemove, setUserToRemove] = useState(null);
  const [userToReset, setUserToReset] = useState(null);
  const [newResetPassword, setNewResetPassword] = useState('');

  const [userToEdit, setUserToEdit] = useState(null);
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editCanApprove, setEditCanApprove] = useState(false);
  const [editIsManager, setEditIsManager] = useState(false);

  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setModalMessage('A senha deve ter pelo menos 6 caracteres.');
      setTimeout(() => setModalMessage(''), 3000);
      return;
    }
    setIsSubmitting(true);
    const success = await onAddUser(email, password, nome, cargo, isNewAdmin, isCanApprove, isManager);
    setIsSubmitting(false);
    if (success) {
      setEmail(''); setPassword(''); setNome(''); setCargo(''); setIsNewAdmin(false); setIsCanApprove(false); setIsManager(false);
    }
  };

  const handleConfirmReset = () => {
      if(newResetPassword.length < 6) {
          setModalMessage('A nova senha deve ter 6 caracteres no mínimo.');
          setTimeout(() => setModalMessage(''), 3000);
          return;
      }
      onResetPassword(userToReset.id, newResetPassword);
      setUserToReset(null);
      setNewResetPassword('');
      setModalMessage('Senha atualizada com sucesso!');
      setTimeout(() => setModalMessage(''), 3000);
  };
const handleConfirmEditPermissions = () => {
    onUpdatePermissions(userToEdit.id, editIsAdmin, editCanApprove, editIsManager);
    setUserToEdit(null);
    setModalMessage('Permissões atualizadas com sucesso!');
    setTimeout(() => setModalMessage(''), 3000);
  };
  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm no-print">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full animate-fade-in-up flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto relative">
        
        {userToRemove && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4 rounded-xl">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center animate-fade-in-up">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
              <p className="font-bold text-gray-800 text-lg mb-2">Revogar Acesso?</p>
              <p className="text-gray-600 text-sm mb-6">Tem certeza que deseja remover o acesso de <strong>{userToRemove.nome}</strong>?</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setUserToRemove(null)} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 transition">Cancelar</button>
                <button onClick={() => { onRemoveUser(userToRemove.id); setUserToRemove(null); }} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-white transition shadow-md">Sim, Revogar</button>
              </div>
            </div>
          </div>
        )}

        {userToReset && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4 rounded-xl">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center animate-fade-in-up">
              <Key size={40} className="text-blue-500 mx-auto mb-4" />
              <p className="font-bold text-gray-800 text-lg mb-2">Resetar Senha</p>
              <p className="text-gray-600 text-sm mb-4">Digite a nova senha para <strong>{userToReset.nome}</strong>:</p>
              <input type="password" value={newResetPassword} onChange={(e) => setNewResetPassword(e.target.value)} placeholder="Nova senha (min. 6)" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-6" />
              <div className="flex justify-center gap-3">
                <button onClick={() => {setUserToReset(null); setNewResetPassword('');}} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 transition">Cancelar</button>
                <button onClick={handleConfirmReset} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white transition shadow-md">Salvar Senha</button>
              </div>
            </div>
          </div>
        )}
{userToEdit && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4 rounded-xl">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center animate-fade-in-up">
              <Settings size={40} className="text-gray-600 mx-auto mb-4" />
              <p className="font-bold text-gray-800 text-lg mb-2">Editar Permissões</p>
              <p className="text-gray-600 text-sm mb-4">Configurar acesso para <strong>{userToEdit.nome}</strong>:</p>
              
              <div className="flex flex-col gap-3 text-left bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="editIsAdmin" checked={editIsAdmin} onChange={(e) => { setEditIsAdmin(e.target.checked); if(e.target.checked) setEditCanApprove(true); }} className="w-5 h-5 accent-[#5C3A21] cursor-pointer" />
                  <label htmlFor="editIsAdmin" className="font-bold text-gray-700 cursor-pointer text-sm">Administrador</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="editCanApprove" checked={editCanApprove} onChange={(e) => setEditCanApprove(e.target.checked)} disabled={editIsAdmin} className="w-5 h-5 accent-[#5C3A21] cursor-pointer disabled:opacity-50" />
                  <label htmlFor="editCanApprove" className={`font-bold cursor-pointer text-sm ${editIsAdmin ? 'text-gray-400' : 'text-gray-700'}`}>Pode Liberar Relatórios</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="editIsManager" checked={editIsManager} onChange={(e) => setEditIsManager(e.target.checked)} className="w-5 h-5 accent-pink-600 cursor-pointer" />
                  <label htmlFor="editIsManager" className="font-bold text-gray-700 cursor-pointer text-sm">É Gerente Industrial</label>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button onClick={() => setUserToEdit(null)} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 transition">Cancelar</button>
                <button onClick={handleConfirmEditPermissions} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 rounded-lg font-bold text-white transition shadow-md">Salvar</button>
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 border-r border-gray-200 pr-6">
          <div className="flex justify-between items-center mb-5 border-b border-gray-200 pb-3">
            <h3 className="text-xl font-black text-[#5C3A21] flex items-center gap-2"><Plus size={24}/> Criar Novo Usuário</h3>
          </div>
          
          {modalMessage && (
            <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded text-sm text-blue-700 animate-fade-in-up flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{modalMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João Silva" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Cargo / Setor</label>
                <input type="text" required value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex: Analista de Qualidade" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">E-mail de Acesso</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@empresa.com" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Senha Provisória</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength="6" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
              </div>
            </div>
            
            <div className="flex flex-col gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isAdmin" checked={isNewAdmin} onChange={(e) => { setIsNewAdmin(e.target.checked); if(e.target.checked) setIsCanApprove(true); }} className="w-5 h-5 accent-[#5C3A21] cursor-pointer" />
                <label htmlFor="isAdmin" className="font-bold text-gray-700 cursor-pointer">Acesso de Administrador</label>
                <span className="text-xs text-gray-500 ml-2 hidden sm:inline">(Pode gerenciar usuários e fornecedores)</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="canApprove" checked={isCanApprove} onChange={(e) => setIsCanApprove(e.target.checked)} disabled={isNewAdmin} className="w-5 h-5 accent-[#5C3A21] cursor-pointer disabled:opacity-50" />
                <label htmlFor="canApprove" className={`font-bold cursor-pointer ${isNewAdmin ? 'text-gray-400' : 'text-gray-700'}`}>Pode Liberar Relatórios</label>
                <span className="text-xs text-gray-500 ml-2 hidden sm:inline">(Muda status para Liberado/Pendente)</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input type="checkbox" id="isManager" checked={isManager} onChange={(e) => setIsManager(e.target.checked)} className="w-5 h-5 accent-pink-600 cursor-pointer" />
                <label htmlFor="isManager" className="font-bold text-gray-700 cursor-pointer">É Gerente Industrial</label>
                <span className="text-xs text-gray-500 ml-2 hidden sm:inline">(Pode adicionar Visto da Gerência)</span>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-[#5C3A21] text-[#F4B41A] font-bold py-3 px-4 rounded-xl shadow-sm hover:bg-[#4a2e1a] transition mt-4 disabled:opacity-50">
              {isSubmitting ? 'Criando Conta...' : 'Adicionar Usuário ao Sistema'}
            </button>
          </form>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-5 border-b border-gray-200 pb-3">
            <h3 className="text-xl font-black text-[#5C3A21] flex items-center gap-2"><Users size={24}/> Usuários Cadastrados</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 p-2 rounded-lg transition"><X size={20}/></button>
          </div>
          
          <div className="overflow-y-auto flex-1 bg-gray-50 rounded-lg p-2 border border-gray-200">
            <ul className="space-y-2">
              {usersDirectory.map(u => (
                <li key={u.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800 text-sm flex items-center gap-2 flex-wrap">
                      {u.nome} 
                      {u.isAdmin && <span className="bg-[#5C3A21] text-[#F4B41A] text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>}
                      {!u.isAdmin && u.canApprove && <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Aprovador</span>}
                      {u.isManager && <span className="bg-pink-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Gerente</span>}
                    </p>
                    <p className="text-xs text-gray-500">{u.email} • {u.cargo}</p>
                  </div>
                  <div className="flex gap-2">
                  <button onClick={() => setUserToReset(u)} className="text-blue-500 hover:text-white bg-blue-50 hover:bg-blue-600 p-2 rounded transition" title="Resetar Senha">
                    <Key size={16}/>
                  </button>
                  
                  <button onClick={() => { setUserToEdit(u); setEditIsAdmin(u.isAdmin || false); setEditCanApprove(u.canApprove || false); setEditIsManager(u.isManager || false); }} className="text-gray-500 hover:text-white bg-gray-100 hover:bg-gray-600 p-2 rounded transition" title="Editar Permissões">
                    <Settings size={16}/>
                  </button>

                  {u.id !== currentUid && (
                    <button onClick={() => setUserToRemove(u)} className="text-red-500 hover:text-white bg-red-50 hover:bg-red-600 p-2 rounded transition" title="Revogar Acesso">
                      <Trash2 size={16}/>
                    </button>
                  )}
                </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export const EditProfileModal = ({ isOpen, onClose, initialName, initialRole, onSave }) => {
  const [name, setName] = useState(initialName || '');
  const [role, setRole] = useState(initialRole || '');

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setRole(initialRole || '');
    }
  }, [isOpen, initialName, initialRole]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && role.trim()) {
      onSave(name.trim(), role.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm no-print">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-fade-in-up">
        <div className="flex justify-between items-center mb-5 border-b border-gray-200 pb-3">
          <h3 className="text-xl font-black text-[#5C3A21] flex items-center gap-2"><User size={24}/> Editar Perfil</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 p-2 rounded-lg transition"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Setor ou Cargo</label>
            <input type="text" required value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
           </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold transition text-sm">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 bg-[#5C3A21] text-[#F4B41A] rounded-lg hover:bg-[#4a2e1a] font-bold transition text-sm flex items-center gap-2 shadow-md"><Check size={18}/> Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const StatusModal = ({ registro, onClose, onSave, avaliadorAtual, canApprove }) => {
  const [status, setStatus] = useState(registro?.status || 'Pendente');
  const [obs, setObs] = useState(registro?.observacoesStatus || '');
  const [enviado, setEnviado] = useState(registro?.enviado || false);
  const [dataEnvio, setDataEnvio] = useState(registro?.dataEnvio || new Date().toISOString().split('T')[0]);
  const [arquivado, setArquivado] = useState(registro?.arquivado || false);

  const optStatus = [
    { value: 'Pendente', label: '⏳ Aguardando / Pendente' },
    { value: 'Liberado', label: '✅ Liberado (Aprovado)' },
    { value: 'Não Liberado', label: '❌ Não Liberado (Com Pendências)' }
  ];

  const optEnvio = [
    { value: 'nao', label: '📥 Não Enviado' },
    { value: 'sim', label: '📤 Enviado' }
  ];

  const optArquivamento = [
    { value: 'nao', label: '📁 Ativo' },
    { value: 'sim', label: '🗄️ Arquivado' }
  ];

  const dateInputClass = "w-full bg-white border border-gray-200 hover:border-[#F4B41A] rounded-xl px-4 py-2.5 text-[13px] font-bold text-gray-700 outline-none transition-all shadow-sm";

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm no-print">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border-t-4 border-purple-500 animate-fade-in-up">
        <h3 className="text-xl font-black text-gray-900 mb-1">{canApprove ? 'Avaliar RNC' : 'Registrar Envio'}</h3>
        <p className="text-gray-500 text-sm mb-6 font-medium">Ação realizada por: <span className="font-bold">{avaliadorAtual}</span></p>
        
        <div className="space-y-5">
          {canApprove && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Situação do Relatório</label>
              <CustomDropdown value={status} onChange={setStatus} options={optStatus} />
            </div>
          )}

          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">Status de Envio</label>
              <CustomDropdown value={enviado ? 'sim' : 'nao'} onChange={(v) => setEnviado(v === 'sim')} options={optEnvio} />
            </div>
            {enviado && (
              <div className="flex-1 animate-fade-in-up">
                <label className="block text-sm font-bold text-gray-700 mb-2">Data do Envio</label>
                <input type="date" value={dataEnvio} onChange={(e) => setDataEnvio(e.target.value)} className={dateInputClass} />
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Arquivamento</label>
            <CustomDropdown value={arquivado ? 'sim' : 'nao'} onChange={(v) => setArquivado(v === 'sim')} options={optArquivamento} />
          </div>
          
          {canApprove && status === 'Não Liberado' && (
            <div className="animate-fade-in-up">
              <label className="block text-sm font-bold text-gray-700 mb-2">Motivo / Observações para Correção</label>
              <textarea 
                rows="4" 
                value={obs} 
                onChange={(e) => setObs(e.target.value)} 
                placeholder="Explique o que o emissor precisa corrigir ou adicionar no relatório..."
                className="w-full border border-red-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-y text-sm bg-red-50 shadow-sm"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold transition text-sm">Cancelar</button>
          <button onClick={() => onSave(registro?.id, status, status === 'Não Liberado' ? obs : '', enviado, dataEnvio, arquivado)} className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold transition text-sm flex items-center gap-2 shadow-md"><Check size={18}/> Salvar {canApprove ? 'Avaliação' : 'Envio'}</button>
        </div>
      </div>
    </div>
  );
};

export const HistoricoModal = ({ isOpen, onClose, solicitante, urgencia }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4 backdrop-blur-sm no-print">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-fade-in-up">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-black text-blue-800 flex items-center gap-2"><Clock size={20}/> Origem da Solicitação</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={20}/></button>
        </div>
        <div className="space-y-3 text-sm text-gray-700">
          <p><strong>Solicitante Original:</strong> {solicitante || 'Não informado'}</p>
          <p><strong>Nível de Urgência:</strong> <span className={`px-2 py-0.5 rounded font-bold ${urgencia === 'Alta' ? 'bg-red-100 text-red-700' : urgencia === 'Baixa' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{urgencia || 'Normal'}</span></p>
        </div>
        <button onClick={onClose} className="mt-6 w-full bg-gray-200 text-gray-800 font-bold py-2 rounded-lg hover:bg-gray-300 transition">Fechar</button>
      </div>
    </div>
  );
};
