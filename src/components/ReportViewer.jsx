import React, { useState } from 'react';
import { Eye, Clock, X, PenTool, Check, Send, Archive } from './Icons';
import { CustomDropdown, HistoricoModal } from './Modals';
import { getReportTheme } from '../utils/helpers';

export const RelatorioViewModal = ({ registro, onClose, onSaveStatus, canApprove, avaliadorAtual, isManager, userName, onDarVisto, onSolicitarCorrecao }) => {
  const [status, setStatus] = useState(registro?.status || 'Pendente');
  const [obs, setObs] = useState(registro?.observacoesStatus || '');
  const [enviado, setEnviado] = useState(registro?.enviado || false);
  const [dataEnvio, setDataEnvio] = useState(registro?.dataEnvio || new Date().toISOString().split('T')[0]);
  const [arquivado, setArquivado] = useState(registro?.arquivado || false);
  const [showHistorico, setShowHistorico] = useState(false);
  
  const [obsGerencia, setObsGerencia] = useState('');

  if (!registro) return null;

  const safeDate = (dateString) => {
    if (!dateString) return '';
    try {
      if (typeof dateString === 'string' && dateString.length === 10 && dateString.includes('-')) {
        const [y, m, d] = dateString.split('-');
        return `${d}/${m}/${y}`;
      }
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('pt-BR');
    } catch (error) { return ''; }
  };

  const currentAssinaturas = Array.isArray(registro?.assinaturas) ? registro.assinaturas : [];
  const jaAssinou = currentAssinaturas.some(a => a.nome === userName);

  let tituloRelatorio = registro.customTituloRelatorio || "RELATÓRIO DE OCORRÊNCIA PRODUTO";
  let tituloSecao1 = registro.customTitulo1 || "1. INFORMAÇÕES GERAIS E RASTREABILIDADE"; 
  let tituloSecao2 = registro.customTitulo2 || "2. DESCRIÇÃO DA OCORRÊNCIA"; 
  let tituloSecao3 = registro.customTitulo3 || "3. PARECER TÉCNICO";
  
  const tipoStr = String(registro.tipoRelatorio || '');
  
  if (tipoStr === 'Relatório de Não Conformidade - Cliente') { 
    if (!registro.customTituloRelatorio) tituloRelatorio = "RELATÓRIO DE DESVIO PADRÃO"; 
    if (!registro.customTitulo1) tituloSecao1 = "DADOS DA OCORRÊNCIA"; 
  }
  if (tipoStr === 'Insumo ou Embalagem' && !registro.customTituloRelatorio) tituloRelatorio = "RELATÓRIO DE OCORRÊNCIA INSUMO";
  if (tipoStr === 'Ocorrência Interna' && !registro.customTituloRelatorio) tituloRelatorio = "RELATÓRIO INTERNO DE OCORRÊNCIA";
  if (tipoStr.includes('Teste')) { 
    if (!registro.customTituloRelatorio) tituloRelatorio = "RELATÓRIO DE TESTES"; 
    if (!registro.customTitulo1) tituloSecao1 = "1. DADOS DO ESTUDO"; 
    if (!registro.customTitulo2) tituloSecao2 = "2. METODOLOGIA E RESULTADOS"; 
    if (!registro.customTitulo3) tituloSecao3 = "3. CONCLUSÃO E RECOMENDAÇÕES"; 
  }
  const isLivre = tipoStr === 'Comunicado / Parecer Livre';
  if (isLivre && !registro.customTituloRelatorio) tituloRelatorio = "COMUNICADO OFICIAL";

  const isFornecedor = tipoStr === 'Problema com Fornecedor' || tipoStr === 'Insumo ou Embalagem';
  const requiresHorario = tipoStr.includes('Teste') || tipoStr === 'Ocorrência Interna';
  const showValidade = !tipoStr.includes('Insumo') && !tipoStr.includes('Equipamento');
  const theme = getReportTheme(tipoStr, registro?.corTema);

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm no-print">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl animate-fade-in-up flex flex-col h-[95vh] overflow-hidden">
        
        <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-xl font-black text-[#5C3A21] flex items-center gap-2">
            <Eye size={24}/> Visualização do Relatório
            {registro.solicitante && (
              <>
                <button onClick={() => setShowHistorico(true)} className="ml-3 flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-lg text-sm font-bold border border-blue-200 transition">
                  <Clock size={16} /> Origem
                </button>
                <HistoricoModal isOpen={showHistorico} onClose={() => setShowHistorico(false)} solicitante={registro.solicitante} urgencia={registro.urgencia} />
              </>
            )}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 bg-gray-200 hover:bg-red-100 p-2 rounded-lg transition">
            <X size={20}/>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 bg-gray-200 p-4 sm:p-8">
          <div className="max-w-4xl mx-auto bg-white shadow-md border border-gray-300 rounded-sm text-black text-[14px] leading-relaxed relative flex flex-col">
            <div className="h-[8px] w-full" style={{ backgroundColor: theme.main, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></div>
            <div className="px-6 py-8 sm:px-12 sm:py-10">
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b-2 border-gray-100 pb-4 mb-6">
                <div>
                  {registro.logo ? <img src={registro.logo} alt="Logo IMAC" className="h-[40px] object-contain mb-1" /> : <h1 className="text-[32px] font-black text-[#5C3A21] tracking-tighter leading-none mb-1">IMAC</h1>}
                  <p className="font-bold text-black text-[13px]">Controle de Qualidade</p>
                </div>
                <div className="text-left sm:text-right mt-4 sm:mt-0">
                  <p className="font-bold uppercase tracking-wide text-[15px] text-[#5C3A21]">{tituloRelatorio}</p>
                  <p className="font-bold text-[13px] text-gray-500 mt-1">Emissão: {registro.dataRelatorio || safeDate(registro.dataCriacao)}</p>
                </div>
              </div>

              {!isLivre && (
                <div className="mb-6">
                  <div className="border-l-4 pl-2 mb-3 py-1" style={{ borderLeftColor: theme.main, backgroundColor: theme.light, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                    <p className="font-bold uppercase text-[#5C3A21] text-[16px]">{tituloSecao1}</p>
                  </div>
                  
                  {tipoStr === 'Relatório de Não Conformidade - Cliente' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 ml-1">
                      <p><strong>Loja(s) / Cliente(s):</strong> {(registro.lojasLocais && registro.lojasLocais.length > 0) ? registro.lojasLocais.join(', ') : (registro.lojaLocal || 'Não informado')}</p>
                      <p><strong>Supervisor:</strong> {registro.supervisor}</p>
                      <p><strong>Produto:</strong> {registro.produto}</p>
                      <p><strong>Lote:</strong> {registro.lote}</p>
                      <p><strong>Fabricação:</strong> {registro.dataFabricacao}</p>
                      <p><strong>Validade:</strong> {registro.validade}</p>
                      <p className="col-span-1 md:col-span-2"><strong>Qtd. Não Conforme:</strong> {registro.quantidade}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 ml-1">
                      <p><strong>{registro.labelProduto || 'Produto / Material'}:</strong> {registro.produto}</p>
                      <p><strong>{registro.labelOcorrencia || 'Resumo do Problema'}:</strong> {registro.ocorrencia}</p>
                      {registro.dataOcorrencia && <p><strong>{registro.labelDataOcorrencia || 'Data da ocorrência'}:</strong> {registro.dataOcorrencia}</p>}
                      {registro.lote && <p><strong>{registro.labelLote || 'Lote'}:</strong> {registro.lote}</p>}
                      {registro.quantidade && <p><strong>{registro.labelQuantidade || 'Quantidade Afetada'}:</strong> {registro.quantidade}</p>}
                      {registro.fornecedor && isFornecedor && <p><strong>Fornecedor:</strong> {registro.fornecedor}</p>}
                      {registro.validade && showValidade && <p><strong>{registro.labelValidade || 'Data de Validade'}:</strong> {registro.validade}</p>}
                      {registro.dataRecebimento && isFornecedor && <p><strong>{registro.labelDataRecebimento || 'Data de Recebimento'}:</strong> {registro.dataRecebimento}</p>}
                      {registro.nf && isFornecedor && <p><strong>{registro.labelNf || 'Nota Fiscal'}:</strong> {registro.nf}</p>}
                      {registro.horarioEmbalamento && requiresHorario && <p><strong>{registro.labelHorario || 'Horário / Turno'}:</strong> {registro.horarioEmbalamento}</p>}
                    </div>
                  )}
                </div>
              )}

              {registro.descricao && (
                <div className="mb-6 w-full overflow-hidden">
                  {!isLivre && (
                  <div className="border-l-4 pl-2 mb-3 py-1" style={{ borderLeftColor: theme.main, backgroundColor: theme.light, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                    <p className="font-bold uppercase text-[#5C3A21] text-[15px]">{tituloSecao2}</p>
                  </div>
                  )}
                  
                  <div className="text-justify text-black ml-1 rich-text-content break-words" dangerouslySetInnerHTML={{ __html: registro.descricao }} />
                  
                  {registro.imagensDescricao && registro.imagensDescricao.length > 0 && (
                    <div className={`grid gap-4 ml-1 mt-3 ${registro.imagensDescricao.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {registro.imagensDescricao.map((img, idx) => (
                        <div key={idx} className="border border-gray-300 shadow-sm rounded bg-white overflow-hidden">
                          <img src={typeof img === 'string' ? img : (img.displaySrc || img.baseSrc)} className="w-full h-auto max-h-[400px] object-contain p-1" alt="Evidência Descrição" />
                        </div>
                      ))}
                    </div>
                  )}
                  {tipoStr === 'Relatório de Não Conformidade - Cliente' && (
                    <div className="mt-4">
                      <p className="font-bold text-[14px] ml-1 mb-2">CARACTERÍSTICAS DO PRODUTO:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 ml-1 mb-2">
                        <div className="border border-gray-200 p-2 rounded bg-gray-50 text-center"><span className="block text-[11px] font-bold text-gray-500 uppercase">Sabor</span><span className="text-[14px] font-semibold">{registro.sabor || 'Não informado'}</span></div>
                        <div className="border border-gray-200 p-2 rounded bg-gray-50 text-center"><span className="block text-[11px] font-bold text-gray-500 uppercase">Odor</span><span className="text-[14px] font-semibold">{registro.odor || 'Não informado'}</span></div>
                        <div className="border border-gray-200 p-2 rounded bg-gray-50 text-center"><span className="block text-[11px] font-bold text-gray-500 uppercase">Cor</span><span className="text-[14px] font-semibold">{registro.cor || 'Não informado'}</span></div>
                        <div className="border border-gray-200 p-2 rounded bg-gray-50 text-center"><span className="block text-[11px] font-bold text-gray-500 uppercase">Temp. °C</span><span className="text-[14px] font-semibold">{registro.temperatura || 'Não informado'}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {Array.isArray(registro.imagens) && registro.imagens.length > 0 && (
                <div className="mb-6 mt-4">
                  <p className="font-bold text-[14px] ml-1 mb-2 uppercase">Registro Fotográfico:</p>
                  <div className="flex flex-wrap gap-4">
                    {registro.imagens.map((img, index) => {
                      const src = typeof img === 'string' ? img : img?.displaySrc;
                      const legenda = typeof img === 'string' ? '' : (img?.legenda || '');
                      const tamanho = img?.tamanho || 'pequeno';
                      let widthClass = 'w-[calc(50%-0.5rem)]';
                      if (tamanho === 'grande') widthClass = 'w-full';
                      if (tamanho === 'pequeno' && registro.imagens.length >= 3) widthClass = 'w-[calc(33.333%-0.7rem)]';

                      return (
                        <div key={index} className={`border border-gray-300 shadow-sm rounded bg-white overflow-hidden flex flex-col ${widthClass}`}>
                          <img src={src} alt={`Evidência ${index + 1}`} className="w-full h-auto max-h-[800px] object-contain p-1" />
                          {legenda.trim() !== '' && <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 mt-auto"><p className="text-[12px] text-center text-gray-700 italic">{legenda}</p></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(registro.consideracoes || registro.statusParecer) && (
                <div className="mb-6 w-full overflow-hidden">
                  <div className="border-l-4 pl-2 mb-3 py-1" style={{ borderLeftColor: theme.main, backgroundColor: theme.light, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                    <p className="font-bold uppercase text-[#5C3A21] text-[15px]">{tituloSecao3}</p>
                  </div>

                  {tipoStr === 'Relatório de Não Conformidade - Cliente' ? (
                    <>
                      <div className="flex flex-wrap gap-x-6 gap-y-2 ml-1 mb-5">
                        <p className="font-bold text-[14px] w-full sm:w-auto">STATUS:</p>
                        <p className="text-[14px] font-semibold">({registro.statusParecer === 'PROCEDENTE' ? 'X' : '  '}) PROCEDENTE</p>
                        <p className="text-[14px] font-semibold">({registro.statusParecer === 'NÃO PROCEDENTE' ? 'X' : '  '}) NÃO PROCEDENTE</p>
                        <p className="text-[14px] font-semibold">({registro.statusParecer === 'NÃO APLICADO' ? 'X' : '  '}) NÃO APLICADO</p>
                      </div>

                      <p className="font-bold text-[14px] ml-1 mb-1">DESCRITIVO DE INVESTIGAÇÃO:</p>
                      <div className="text-justify text-black ml-1 rich-text-content break-words mb-2" dangerouslySetInnerHTML={{ __html: registro.consideracoes || '-' }} />
                      
                      {registro.imagensInvestigacao && registro.imagensInvestigacao.length > 0 && (
                        <div className={`grid gap-4 ml-1 mb-5 ${registro.imagensInvestigacao.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {registro.imagensInvestigacao.map((img, idx) => (
                            <div key={idx} className="border border-gray-300 shadow-sm rounded bg-white overflow-hidden">
                              <img src={typeof img === 'string' ? img : (img.displaySrc || img.baseSrc)} className="w-full h-auto max-h-[400px] object-contain p-1" alt="Investigação" />
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="font-bold text-[14px] ml-1 mb-1 mt-4">AÇÃO CORRETIVA:</p>
                      <div className="text-justify text-black ml-1 rich-text-content break-words mb-2" dangerouslySetInnerHTML={{ __html: registro.acaoCorretiva || '-' }} />
                      
                      {registro.imagensAcaoCorretiva && registro.imagensAcaoCorretiva.length > 0 && (
                        <div className={`grid gap-4 ml-1 mb-5 ${registro.imagensAcaoCorretiva.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {registro.imagensAcaoCorretiva.map((img, idx) => (
                            <div key={idx} className="border border-gray-300 shadow-sm rounded bg-white overflow-hidden">
                              <img src={typeof img === 'string' ? img : (img.displaySrc || img.baseSrc)} className="w-full h-auto max-h-[400px] object-contain p-1" alt="Ação Corretiva" />
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="font-bold text-[14px] ml-1 mb-1 mt-4">CONCLUSÃO:</p>
                      <div className="text-justify text-black ml-1 rich-text-content break-words mb-2" dangerouslySetInnerHTML={{ __html: registro.conclusaoParecer || '-' }} />
                      
                      {registro.imagensConclusao && registro.imagensConclusao.length > 0 && (
                        <div className={`grid gap-4 ml-1 mb-5 ${registro.imagensConclusao.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {registro.imagensConclusao.map((img, idx) => (
                            <div key={idx} className="border border-gray-300 shadow-sm rounded bg-white overflow-hidden">
                              <img src={typeof img === 'string' ? img : (img.displaySrc || img.baseSrc)} className="w-full h-auto max-h-[400px] object-contain p-1" alt="Conclusão" />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-justify text-black ml-1 rich-text-content break-words" dangerouslySetInnerHTML={{ __html: registro.consideracoes }} />
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* BARRA INFERIOR DE OPÇÕES / AVALIAÇÃO */}
        <div className="bg-white border-t-2 border-gray-200 p-4 sm:px-6 sm:py-5 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          
          {/* CAIXA DE TEXTO DA GERENTE (Oculta se ela já assinou) */}
          {isManager && !jaAssinou && (
            <div className="w-full bg-pink-50 p-4 rounded-lg border border-pink-200 mb-5 animate-fade-in-up">
              <label className="block text-[13px] font-bold text-pink-800 mb-2">Área da Gerência - Solicitar Ajuste (Opcional)</label>
              <textarea 
                rows="2" 
                value={obsGerencia} 
                onChange={(e) => setObsGerencia(e.target.value)} 
                placeholder="Se precisar que a Qualidade corrija algo, digite aqui e clique em Devolver. Caso contrário, apenas Assine abaixo..."
                className="w-full border border-pink-300 p-3 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none resize-y text-sm bg-white text-gray-800"
              />
              {obsGerencia.trim() && (
                <div className="flex justify-end mt-3">
                  <button onClick={() => onSolicitarCorrecao(registro.id, obsGerencia)} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition flex items-center gap-2 shadow-md text-sm">
                    <X size={16}/> Devolver Relatório para Qualidade
                  </button>
                </div>
              )}
            </div>
          )}

          {canApprove ? (
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">Situação do Relatório</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold text-gray-800 bg-gray-50">
                    <option value="Pendente">⏳ Aguardando / Pendente</option>
                    <option value="Liberado">✅ Liberado (Aprovado)</option>
                    <option value="Não Liberado">❌ Não Liberado (Com Pendências)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[13px] font-bold text-gray-700 mb-1">Status de Envio</label>
                    <select value={enviado ? 'sim' : 'nao'} onChange={(e) => setEnviado(e.target.value === 'sim')} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 bg-gray-50">
                      <option value="nao">📥 Não Enviado</option>
                      <option value="sim">📤 Enviado</option>
                    </select>
                  </div>
                  {enviado && (
                    <div className="flex-1 animate-fade-in-up">
                      <label className="block text-[13px] font-bold text-gray-700 mb-1">Data</label>
                      <input type="date" value={dataEnvio} onChange={(e) => setDataEnvio(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800 bg-gray-50" />
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">Arquivamento</label>
                  <select value={arquivado ? 'sim' : 'nao'} onChange={(e) => setArquivado(e.target.value === 'sim')} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none text-sm font-bold text-gray-800 bg-gray-50">
                    <option value="nao">📁 Ativo</option>
                    <option value="sim">🗄️ Arquivado</option>
                  </select>
                </div>
                
                {status === 'Não Liberado' && (
                  <div className="md:col-span-2 animate-fade-in-up">
                    <label className="block text-[13px] font-bold text-red-700 mb-1">Motivo / Observações para Correção</label>
                    <textarea 
                      rows="2" 
                      value={obs} 
                      onChange={(e) => setObs(e.target.value)} 
                      placeholder="Explique detalhadamente o que precisa ser corrigido..."
                      className="w-full border border-red-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-y text-sm bg-red-50 text-red-900 placeholder-red-300"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={onClose} className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold transition w-full md:w-auto">
                  Fechar
                </button>
                {isManager && !jaAssinou && obsGerencia.trim() === '' && (
                  <button onClick={() => onDarVisto(registro)} className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-bold transition flex items-center justify-center gap-2 shadow-md w-full md:w-auto whitespace-nowrap">
                    <PenTool size={20}/> Assinar
                  </button>
                )}
                <button onClick={() => onSaveStatus(registro.id, status, status === 'Não Liberado' ? obs : '', enviado, dataEnvio, arquivado)} className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold transition flex items-center justify-center gap-2 shadow-md w-full md:w-auto whitespace-nowrap">
                  <Check size={20}/> Salvar Avaliação
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-700">Avaliação Atual:</span>
                <span className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase border tracking-wide ${(!registro.status || registro.status === 'Pendente') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : registro.status === 'Liberado' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {registro.status || 'Pendente'}
                </span>
                <span className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase border tracking-wide flex items-center gap-1 ${registro.enviado ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  <Send size={14} /> {registro.enviado ? `Enviado: ${safeDate(registro.dataEnvio)}` : 'Não Enviado'}
                  {registro.arquivado && (
                  <span className="px-3 py-1.5 rounded-md text-xs font-bold uppercase border tracking-wide flex items-center gap-1 bg-gray-200 text-gray-700 border-gray-300">
                    <Archive size={14} /> Arquivado
                  </span>
                )}
                </span>
              </div>
              <div className="flex gap-2">
                {isManager && !jaAssinou && obsGerencia.trim() === '' && (
                  <button onClick={() => onDarVisto(registro)} className="px-6 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-bold transition flex items-center gap-2 shadow-md">
                    <PenTool size={18}/> Assinar Relatório
                  </button>
                )}
                <button onClick={onClose} className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-bold transition">Fechar Janela</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
