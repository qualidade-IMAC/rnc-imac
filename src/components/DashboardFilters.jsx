import React, { useState, useEffect } from 'react';
import { Filter } from './Icons';
import { CustomDropdown } from './Modals';

export const DashboardFilters = ({ onFilterChange, fornecedores }) => {
  const [filters, setFilters] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return {
        periodo: params.get('periodo') || 'mes_atual',
        fornecedor: params.get('fornecedor') || '',
        tipo: params.get('tipo') || '',
        status: params.get('status') || ''
      };
    }
    return { periodo: 'mes_atual', fornecedor: '', tipo: '', status: '' };
  });

  useEffect(() => {
    onFilterChange(filters);
  }, []);

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (value) params.set(key, value);
      else params.delete(key);
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.pushState({}, '', newUrl);
    }
  };

  const optPeriodo = [
    { value: 'mes_atual', label: 'Mês Atual' },
    { value: 'mes_anterior', label: 'Mês Anterior' },
    { value: 'trimestre', label: 'Último Trimestre' },
    { value: 'ano', label: 'Este Ano' },
    { value: 'todos', label: 'Todo Período' }
  ];

  const optStatus = [
    { value: '', label: 'Todos os Status' },
    { value: 'Pendente', label: '⏳ Aguardando Avaliação' },
    { value: 'Liberado', label: '✅ Liberados' },
    { value: 'Não Liberado', label: '❌ Pendentes de Correção' }
  ];

  const optFornecedor = [
    { value: '', label: 'Todos Fornecedores' },
    ...(fornecedores || []).filter(f => typeof f === 'string').map(f => ({ value: f, label: f }))
  ];

  const optTipo = [
    { value: '', label: 'Todos os Tipos' },
    { value: 'Problema com Fornecedor', label: 'Problema com Fornecedor' },
    { value: 'Insumo ou Embalagem', label: 'Insumo ou Embalagem' },
    { value: 'Ocorrência Interna', label: 'Ocorrência Interna' },
    { value: 'Relatório de Não Conformidade - Cliente', label: 'Não Conformidade - Cliente' },
    { value: 'Teste de Produto', label: 'Teste de Produto' },
    { value: 'Teste de Equipamento', label: 'Teste de Equipamento' },
    { value: 'Comunicado / Parecer Livre', label: 'Comunicado / Parecer Livre' }
  ];

  return (
    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-200/60 flex flex-col md:flex-row gap-4 items-center animate-fade-in-up relative z-40">
      <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pl-1">
        <Filter size={20} className="text-[#5C3A21]" />
        <span className="font-black text-sm text-[#5C3A21] uppercase tracking-wider md:hidden lg:block">Filtros</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 w-full">
        <CustomDropdown value={filters.periodo} onChange={(val) => handleChange('periodo', val)} options={optPeriodo} />
        <CustomDropdown value={filters.status} onChange={(val) => handleChange('status', val)} options={optStatus} />
        <CustomDropdown value={filters.fornecedor} onChange={(val) => handleChange('fornecedor', val)} options={optFornecedor} />
        <CustomDropdown value={filters.tipo} onChange={(val) => handleChange('tipo', val)} options={optTipo} />
      </div>
    </div>
  );
};
