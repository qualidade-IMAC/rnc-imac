export const saveToLocalStorage = (key, data) => {
  setTimeout(() => {
    try { 
      let dataToSave = data;
      if (key === 'imac_registros' && Array.isArray(data)) {
        dataToSave = data.map(r => ({
          ...r, 
          imagens: [], imagensDescricao: [], imagensConsideracoes: [], 
          imagensInvestigacao: [], imagensAcaoCorretiva: [], imagensConclusao: [], logo: null
        }));
      }
      localStorage.setItem(key, JSON.stringify(dataToSave)); 
    } catch (error) { console.warn(`[Aviso] Armazenamento local cheio para a chave: ${key}.`); }
  }, 10);
};

export const safeDate = (dateString) => {
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

export const getShareText = (registro) => {
  const id = String(registro?.id || '').substring(0, 8);
  const title = registro?.tipoRelatorio || 'Ocorrência';
  const prod = registro?.produto || 'Não informado';
  const prob = registro?.ocorrencia || 'Sem descrição';
  const baseUrl = window.location.href.split('?')[0];
  const linkAvaliacao = `${baseUrl}?rnc=${registro?.id}`;
  
  return `*Aviso de Relatório RNC*\n\n*ID:* ${id}\n*Tipo:* ${title}\n*Produto:* ${prod}\n*Problema:* ${prob}\n\n*Acesse o relatório diretamente no sistema para avaliar:* \n${linkAvaliacao}`;
};

export const shareViaWhatsApp = (registro, phone = '') => {
  const text = encodeURIComponent(getShareText(registro));
  const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(url, '_blank');
};

export const shareViaEmail = (registro) => {
  const text = encodeURIComponent(getShareText(registro).replace(/\*/g, ''));
  const subject = encodeURIComponent(`Relatório RNC Pendente - ${String(registro?.id || '').substring(0,8)}`);
  window.open(`mailto:?subject=${subject}&body=${text}`, '_blank');
};

export const shareViaGmail = (registro) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  
  const id = String(registro?.id || '').substring(0, 8);
  const title = registro?.customTituloRelatorio || registro?.tipoRelatorio || 'Relatório de Ocorrência';
  const prod = registro?.produto || 'Não informado';
  const baseUrl = window.location.href.split('?')[0];
  const linkAvaliacao = `${baseUrl}?rnc=${registro?.id}`;

  const subject = encodeURIComponent(`Relatório RNC - ${prod} - ID: ${id}`);
  const body = encodeURIComponent(`${greeting}!\n\nSegue o link para acesso ao ${title} referente ao produto ${prod}.\n\nAcesse o relatório completo e atualizado no sistema através do link abaixo:\n${linkAvaliacao}\n\nAtenciosamente,`);

  window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
};

export const getPendingDays = (dateString) => {
  if (!dateString) return 0;
  const diffTime = Math.abs(new Date() - new Date(dateString));
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const compressImage = (file, isLogo = false) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = isLogo ? 400 : 800;
        const MAX_HEIGHT = isLogo ? 400 : 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        if (file.type === 'image/png') {
          resolve(canvas.toDataURL('image/png')); 
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.6)); 
        }
      };
    };
    reader.onerror = error => reject(error);
  });
};

export const getReportTheme = (tipo, corTemaManual) => {
  const paleta = {
    'Amarelo': { main: '#F4B41A', light: 'rgba(244, 180, 26, 0.15)', text: '#5C3A21' },
    'Azul': { main: '#0054A6', light: 'rgba(0, 84, 166, 0.1)', text: '#FFFFFF' },
    'Marrom': { main: '#5C3A21', light: 'rgba(92, 58, 33, 0.1)', text: '#FFFFFF' },
    'Creme': { main: '#E1C28F', light: 'rgba(225, 194, 143, 0.3)', text: '#5C3A21' },
    'Cinza': { main: '#64748B', light: 'rgba(100, 116, 139, 0.1)', text: '#FFFFFF' }
  };
  
  if (corTemaManual && paleta[corTemaManual]) return paleta[corTemaManual];

  const t = String(tipo || '');
  if (t.includes('Teste')) return paleta['Azul']; 
  if (t === 'Relatório de Não Conformidade - Cliente') return paleta['Marrom']; 
  if (t === 'Ocorrência Interna') return paleta['Creme']; 
  if (t === 'Comunicado / Parecer Livre') return paleta['Cinza']; 
  return paleta['Amarelo']; 
};
