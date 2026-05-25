import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, onSnapshot, deleteDoc, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';

let firebaseConfig;
let isConfigured = false;

if (typeof __firebase_config !== 'undefined') {
  firebaseConfig = JSON.parse(__firebase_config);
  isConfigured = true;
} else {
  firebaseConfig = {
    apiKey: "AIzaSyAomEpViVLeoDdILS88SjjozJNr4BtjjNU",
    authDomain: "rnc-imac-51124.firebaseapp.com",
    projectId: "rnc-imac-51124",
    storageBucket: "rnc-imac-51124.firebasestorage.app",
    messagingSenderId: "858158161408",
    appId: "1:858158161408:web:68df68b9aafe57e4b142e5"
  };
  if (firebaseConfig.apiKey !== "") {
    isConfigured = true;
  }
}

const app = isConfigured ? initializeApp(firebaseConfig) : null;
const auth = isConfigured ? getAuth(app) : null;
const db = isConfigured ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'rnc-imac-app';

if (typeof document !== 'undefined' && !document.getElementById('imac-global-styles')) {
  const style = document.createElement('style');
  style.id = 'imac-global-styles';
  style.innerHTML = `
    .rich-text-content:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; display: block; }
    .rich-text-content b, .rich-text-content strong { font-weight: 900 !important; color: inherit; }
    .rich-text-content i, .rich-text-content em { font-style: italic !important; }
    .rich-text-content u { text-decoration: underline !important; }
    .rich-text-content { white-space: pre-wrap; word-break: break-word !important; overflow-wrap: break-word !important; word-wrap: break-word !important; }
    .rich-text-content div { min-height: 1.5rem; }
    .rich-text-content ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
    .rich-text-content li { margin-bottom: 0.25rem; }

    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
    
    @keyframes pulseSoft { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; transform: scale(0.98); } }
    .animate-pulse-soft { animation: pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

    @media print {
      @page { margin: 10mm 10mm 10mm 10mm !important; size: A4; }
      body, html { height: auto !important; overflow: visible !important; background-color: white !important; }
      
      .modal-overlay-print {
        position: absolute !important; top: 0 !important; left: 0 !important; min-height: 100vh !important;
        height: auto !important; width: 100% !important; background: white !important; padding: 0 !important; margin: 0 !important;
        overflow: visible !important; display: block !important; z-index: 9999 !important;
      }
      .modal-overlay-print > div { max-width: 100% !important; width: 100% !important; box-shadow: none !important; margin: 0 !important; transform: none !important; }
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      .print-no-padding { padding: 0 !important; }
      .break-inside-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }
      .print-grid-signatures { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 15px 40px !important; }
      .print-bg-yellow { background-color: #F4B41A !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .print-border-yellow { border-left-color: #F4B41A !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .print-bg-yellow-light { background-color: rgba(244, 180, 26, 0.15) !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    @media screen { .print-only { display: none !important; } }
  `;
  document.head.appendChild(style);
}

const saveToLocalStorage = (key, data) => {
  // O setTimeout tira essa tarefa da fila principal, destravando a tela imediatamente
  setTimeout(() => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (error) { console.warn(`[Aviso] Armazenamento local cheio para a chave: ${key}.`); }
  }, 10);
};

const safeDate = (dateString) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR');
  } catch (error) { return ''; }
};

const getShareText = (registro) => {
  const id = String(registro?.id || '').substring(0, 8);
  const title = registro?.tipoRelatorio || 'Ocorrência';
  const prod = registro?.produto || 'Não informado';
  const prob = registro?.ocorrencia || 'Sem descrição';
  return `*Aviso de Relatório RNC*\n\n*ID:* ${id}\n*Tipo:* ${title}\n*Produto:* ${prod}\n*Problema:* ${prob}\n\nPor favor, verifique este relatório no sistema IMAC.`;
};

const shareViaWhatsApp = (registro) => {
  const text = encodeURIComponent(getShareText(registro));
  window.open(`https://wa.me/?text=${text}`, '_blank');
};

const shareViaEmail = (registro) => {
  const text = encodeURIComponent(getShareText(registro).replace(/\*/g, ''));
  const subject = encodeURIComponent(`Relatório RNC Pendente - ${String(registro?.id || '').substring(0,8)}`);
  window.open(`mailto:?subject=${subject}&body=${text}`, '_blank');
};

const getPendingDays = (dateString) => {
  if (!dateString) return 0;
  const diffTime = Math.abs(new Date() - new Date(dateString));
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const SvgIcon = ({ children, size = 24, className = "", strokeWidth = 2, title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {title && <title>{title}</title>}
    {children}
  </svg>
);

const Printer = (p) => <SvgIcon {...p}><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" /></SvgIcon>;
const Edit3 = (p) => <SvgIcon {...p}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></SvgIcon>;
const Copy = (p) => <SvgIcon {...p}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></SvgIcon>;
const ImagePlus = (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v4M21 9h-6M18 6v6M3 16l5-5c.928-.893 2.072-.893 3 0l5 5M14 14l1-1c.928-.893 2.072-.893 3 0l3 3" /></SvgIcon>;
const Trash2 = (p) => <SvgIcon {...p}><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></SvgIcon>;
const FileText = (p) => <SvgIcon {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" /></SvgIcon>;
const Users = (p) => <SvgIcon {...p}><path d="M17 21v-2a4 4 0 00-4-4H5c-1.1 0-2 .9-2 2v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></SvgIcon>;
const ClipboardList = (p) => <SvgIcon {...p}><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1zM12 11h4M12 16h4M8 11h.01M8 16h.01" /></SvgIcon>;
const Upload = (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h4M17 8l-5-5-5 5M12 3v12" /></SvgIcon>;
const Plus = (p) => <SvgIcon {...p}><path d="M12 5v14M5 12h14" /></SvgIcon>;
const Minus = (p) => <SvgIcon {...p}><line x1="5" y1="12" x2="19" y2="12" /></SvgIcon>;
const UserX = (p) => <SvgIcon {...p}><path d="M16 21v-2a4 4 0 00-4-4H5c-1.1 0-2 .9-2 2v2M8 7a4 4 0 100 8 4 4 0 000-8zM18 8l4 4M22 8l-4 4" /></SvgIcon>;
const ArrowUpRight = (p) => <SvgIcon {...p}><path d="M7 17L17 7M7 7h10v10" /></SvgIcon>;
const Circle = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10" /></SvgIcon>;
const Undo = (p) => <SvgIcon {...p}><path d="M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" /></SvgIcon>;
const Send = (p) => <SvgIcon {...p}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></SvgIcon>;
const Check = (p) => <SvgIcon {...p}><path d="M20 6L9 17l-5-5" /></SvgIcon>;
const X = (p) => <SvgIcon {...p}><path d="M18 6L6 18M6 6l12 12" /></SvgIcon>;
const PenTool = (p) => <SvgIcon {...p}><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586M11 11l2 2" /></SvgIcon>;
const Move = (p) => <SvgIcon {...p}><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M9 19l3 3-3 3M19 9l3 3-3 3M2 12h20M12 2v20" /></SvgIcon>;
const TypeIcon = (p) => <SvgIcon {...p}><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" x2="15" y1="20" y2="20" /><line x1="12" x2="12" y1="4" y2="20" /></SvgIcon>;
const BarChart2 = (p) => <SvgIcon {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></SvgIcon>;
const BoldIcon = (p) => <SvgIcon {...p} strokeWidth={3}><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></SvgIcon>;
const ItalicIcon = (p) => <SvgIcon {...p}><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></SvgIcon>;
const UnderlineIcon = (p) => <SvgIcon {...p}><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></SvgIcon>;
const Truck = (p) => <SvgIcon {...p}><path d="M16 3H1v13h15M8 16h7v4H8zM21 16h-2v4H5"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></SvgIcon>;
const ShoppingBag = (p) => <SvgIcon {...p}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></SvgIcon>;
const Store = (p) => <SvgIcon {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></SvgIcon>;
const Eye = (p) => <SvgIcon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></SvgIcon>;
const Download = (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-5M7 10l5 5 5-5M12 15V3"/></SvgIcon>;
const Filter = (p) => <SvgIcon {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></SvgIcon>;
const RefreshCw = (p) => <SvgIcon {...p}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></SvgIcon>;
const Scissors = (p) => <SvgIcon {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></SvgIcon>;
const AlertCircle = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></SvgIcon>;
const CheckCircle = (p) => <SvgIcon {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></SvgIcon>;
const Palette = (p) => <SvgIcon {...p}><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></SvgIcon>;
const LogOut = (p) => <SvgIcon {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></SvgIcon>;
const ChevronLeft = (p) => <SvgIcon {...p}><polyline points="15 18 9 12 15 6" /></SvgIcon>;
const ChevronRight = (p) => <SvgIcon {...p}><polyline points="9 18 15 12 9 6" /></SvgIcon>;
const MessageCircle = (p) => <SvgIcon {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></SvgIcon>;
const Mail = (p) => <SvgIcon {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></SvgIcon>;
const Clock = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></SvgIcon>;
const Lock = (p) => <SvgIcon {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></SvgIcon>;
const User = (p) => <SvgIcon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></SvgIcon>;
const Key = (p) => <SvgIcon {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></SvgIcon>;
const Settings = (p) => <SvgIcon {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.5a2 2 0 0 1-1 1.72l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0-.73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></SvgIcon>;
const compressImage = (file, isLogo = false) => {
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
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      };
    };
    reader.onerror = error => reject(error);
  });
};

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (!editorRef.current) return;
    let html = editorRef.current.innerHTML;
    if (html === '<br>' || html === '<div><br></div>') html = '';
    if (typeof onChange === 'function') onChange(html);
  };

  const execCommand = (command, val = null) => {
    try {
      document.execCommand(command, false, val);
      if(editorRef.current) editorRef.current.focus();
      handleInput();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full relative">
      <div className="w-full border border-gray-300 rounded focus-within:ring-2 focus-within:ring-[#F4B41A] shadow-sm bg-white overflow-hidden flex flex-col">
        <div className="flex bg-gray-50 border-b border-gray-200 p-1.5 gap-2 items-center flex-wrap">
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <button type="button" onClick={(e) => { e.preventDefault(); execCommand('bold'); }} className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition" title="Negrito"><BoldIcon size={18} /></button>
            <button type="button" onClick={(e) => { e.preventDefault(); execCommand('italic'); }} className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition" title="Itálico"><ItalicIcon size={18} /></button>
            <button type="button" onClick={(e) => { e.preventDefault(); execCommand('underline'); }} className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition" title="Sublinhado"><UnderlineIcon size={18} /></button>
          </div>
          
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            <span className="text-xs text-gray-500 font-bold ml-1" title="Cor do Texto"><Palette size={16}/></span>
            <input 
               type="color" 
               className="w-6 h-6 p-0 border-0 rounded cursor-pointer" 
               title="Mudar Cor"
               onChange={(e) => execCommand('foreColor', e.target.value)} 
               defaultValue="#000000"
            />
          </div>

          <div className="flex items-center gap-1">
            <select 
               className="text-sm bg-transparent border border-gray-300 rounded p-1 outline-none text-gray-700" 
               title="Tamanho do Texto"
               onChange={(e) => execCommand('fontSize', e.target.value)}
               defaultValue="3"
            >
              <option value="1">Muito Pequeno</option>
              <option value="2">Pequeno</option>
              <option value="3">Normal</option>
              <option value="4">Médio</option>
              <option value="5">Grande</option>
              <option value="6">Muito Grande</option>
              <option value="7">Gigante</option>
            </select>
          </div>
        </div>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          className="p-3 min-h-[100px] outline-none cursor-text rich-text-content"
          data-placeholder={placeholder}
        />
      </div>
    </div>
  );
};

const ImageAnnotator = ({ baseImageSrc, initialShapes = [], onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('arrow'); 
  const [color, setColor] = useState('#FF0000');
  const [textSize, setTextSize] = useState(28); 
  const [selectedShapeIndex, setSelectedShapeIndex] = useState(null);
  const [textInput, setTextInput] = useState(null);
  const [forceRender, setForceRender] = useState(0); 
  const [cropRect, setCropRect] = useState(null);
  const [cropRatio, setCropRatio] = useState(null); 
  
  const shapesRef = useRef(Array.isArray(initialShapes) ? JSON.parse(JSON.stringify(initialShapes)) : []);
  const imageRef = useRef(null);
  const isDrawing = useRef(false);
  const draggedShapeIndex = useRef(null);
  
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!baseImageSrc) return;
    const img = new Image();
    img.src = baseImageSrc;
    img.onload = () => {
      imageRef.current = img;
      if(canvasRef.current) {
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
        redraw(null);
      }
    };
  }, [baseImageSrc]);

  useEffect(() => {
    if (selectedShapeIndex !== null && shapesRef.current[selectedShapeIndex]) {
      const shape = shapesRef.current[selectedShapeIndex];
      setColor(shape.color || '#FF0000');
      if (shape.type === 'text') setTextSize(shape.size || 28);
    }
  }, [selectedShapeIndex]);

  const changeColor = (newColor) => {
    setColor(newColor);
    if (selectedShapeIndex !== null && shapesRef.current[selectedShapeIndex]) {
      shapesRef.current[selectedShapeIndex].color = newColor;
      redraw();
    }
  };

  const changeTextSize = (delta) => {
    setTextSize(s => {
      const newSize = Math.max(12, Math.min(72, s + delta));
      if (selectedShapeIndex !== null && shapesRef.current[selectedShapeIndex]?.type === 'text' && canvasRef.current) {
        shapesRef.current[selectedShapeIndex].size = newSize;
        const ctx = canvasRef.current.getContext('2d');
        ctx.font = `bold ${newSize}px sans-serif`;
        shapesRef.current[selectedShapeIndex].width = ctx.measureText(shapesRef.current[selectedShapeIndex].text || '').width;
        redraw();
      }
      return newSize;
    });
  };

  const getShapeCenter = (shape) => {
    if (shape.type === 'circle') return { x: shape.x1 || 0, y: shape.y1 || 0 };
    if (shape.type === 'arrow') return { x: ((shape.x1 || 0) + (shape.x2 || 0))/2, y: ((shape.y1 || 0) + (shape.y2 || 0))/2 };
    if (shape.type === 'text') {
      const w = shape.width || ((shape.text || '').length * ((shape.size || 28) * 0.6));
      return { x: (shape.x || 0) + w/2, y: shape.y || 0 };
    }
    return { x: 0, y: 0 };
  };

  const drawArrow = (ctx, fromx, fromy, tox, toy, color) => {
    const headlen = 25; 
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(tox, toy);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const drawCircle = (ctx, x1, y1, x2, y2, color) => {
    const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    ctx.beginPath();
    ctx.arc(x1, y1, radius, 0, 2 * Math.PI, false);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.stroke();
  };

  const drawText = (ctx, text, x, y, color, size) => {
    ctx.font = `bold ${size}px sans-serif`;
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = size > 24 ? 6 : 4;
    ctx.strokeText(text || '', x, y);
    ctx.fillStyle = color;
    ctx.fillText(text || '', x, y);
  };

  const drawSelectionBox = (ctx, shape) => {
    let minX, minY, maxX, maxY;
    const pad = 15;
    
    if (shape.type === 'circle') {
      const r = Math.sqrt(Math.pow((shape.x2 || 0) - (shape.x1 || 0), 2) + Math.pow((shape.y2 || 0) - (shape.y1 || 0), 2));
      minX = shape.x1 - r; maxX = shape.x1 + r; minY = shape.y1 - r; maxY = shape.y1 + r;
    } else if (shape.type === 'arrow') {
      minX = Math.min(shape.x1 || 0, shape.x2 || 0); maxX = Math.max(shape.x1 || 0, shape.x2 || 0);
      minY = Math.min(shape.y1 || 0, shape.y2 || 0); maxY = Math.max(shape.y1 || 0, shape.y2 || 0);
    } else if (shape.type === 'text') {
      const w = shape.width || ((shape.text || '').length * ((shape.size || 28) * 0.6));
      minX = shape.x || 0; maxX = (shape.x || 0) + w; minY = (shape.y || 0) - ((shape.size || 28) / 2); maxY = (shape.y || 0) + ((shape.size || 28) / 2);
    } else return;
    
    ctx.beginPath();
    ctx.setLineDash([8, 8]); ctx.strokeStyle = '#00BFFF'; ctx.lineWidth = 3;
    ctx.rect(minX - pad, minY - pad, (maxX - minX) + pad * 2, (maxY - minY) + pad * 2);
    ctx.stroke(); ctx.setLineDash([]); 
  };

  const drawCropOverlay = (ctx, start, current, ratio = null) => {
    let w = current.x - start.x;
    let h = current.y - start.y;

    if (ratio) {
      const absW = Math.abs(w);
      const absH = Math.abs(h);
      if (absW / ratio > absH) {
        h = (Math.sign(h) || 1) * (absW / ratio);
      } else {
        w = (Math.sign(w) || 1) * (absH * ratio);
      }
    }

    const minX = Math.min(start.x, start.x + w);
    const minY = Math.min(start.y, start.y + h);
    const finalW = Math.abs(w);
    const finalH = Math.abs(h);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvasRef.current.width, minY);
    ctx.fillRect(0, minY, minX, finalH);
    ctx.fillRect(minX + finalW, minY, canvasRef.current.width - (minX + finalW), finalH);
    ctx.fillRect(0, minY + finalH, canvasRef.current.width, canvasRef.current.height - (minY + finalH));

    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(minX, minY, finalW, finalH);
    ctx.setLineDash([]);
  };

  const redraw = (overrideSelectedIndex) => {
    if (!canvasRef.current || !imageRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(imageRef.current, 0, 0);
    
    const activeIndex = overrideSelectedIndex !== undefined ? overrideSelectedIndex : selectedShapeIndex;

    shapesRef.current.forEach((shape, index) => {
      ctx.save(); 
      const center = getShapeCenter(shape);
      const angle = shape.rotation || 0;
      
      if (angle !== 0) {
        ctx.translate(center.x, center.y);
        ctx.rotate(angle);
        ctx.translate(-center.x, -center.y);
      }
      
      if (shape.type === 'arrow') drawArrow(ctx, shape.x1, shape.y1, shape.x2, shape.y2, shape.color);
      else if (shape.type === 'circle') drawCircle(ctx, shape.x1, shape.y1, shape.x2, shape.y2, shape.color);
      else if (shape.type === 'text') drawText(ctx, shape.text, shape.x, shape.y, shape.color, shape.size);
      
      if (index === activeIndex) {
        drawSelectionBox(ctx, shape);
      }
      ctx.restore();
    });
    
    if (isDrawing.current && tool !== 'move' && tool !== 'text' && tool !== 'crop') {
      if (tool === 'arrow') drawArrow(ctx, startPos.current.x, startPos.current.y, currentPos.current.x, currentPos.current.y, color);
      else if (tool === 'circle') drawCircle(ctx, startPos.current.x, startPos.current.y, currentPos.current.x, currentPos.current.y, color);
    }

    if (tool === 'crop' && isDrawing.current) {
      drawCropOverlay(ctx, startPos.current, currentPos.current, cropRatio);
    } else if (cropRect) {
      drawCropOverlay(ctx, {x: cropRect.x, y: cropRect.y}, {x: cropRect.x + cropRect.w, y: cropRect.y + cropRect.h}, null);
    }
  };

  const getPointerPos = (e) => {
    if(!canvasRef.current) return {x:0, y:0};
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const isPointInShape = (px, py, shape) => {
    const center = getShapeCenter(shape);
    const angle = shape.rotation || 0;
    
    let rpx = px, rpy = py;
    if (angle !== 0) {
      const dx = px - center.x, dy = py - center.y;
      const cos = Math.cos(-angle), sin = Math.sin(-angle);
      rpx = dx * cos - dy * sin + center.x; rpy = dx * sin + dy * cos + center.y;
    }

    const pad = 25; 
    if (shape.type === 'circle') {
      const r = Math.sqrt(Math.pow((shape.x2||0) - (shape.x1||0), 2) + Math.pow((shape.y2||0) - (shape.y1||0), 2));
      return Math.sqrt(Math.pow(rpx - (shape.x1||0), 2) + Math.pow(rpy - (shape.y1||0), 2)) <= r + pad;
    } else if (shape.type === 'arrow') {
      const minX = Math.min(shape.x1||0, shape.x2||0) - pad, maxX = Math.max(shape.x1||0, shape.x2||0) + pad;
      const minY = Math.min(shape.y1||0, shape.y2||0) - pad, maxY = Math.max(shape.y1||0, shape.y2||0) + pad;
      if (rpx >= minX && rpx <= maxX && rpy >= minY && rpy <= maxY) {
        const l2 = Math.pow((shape.x2||0) - (shape.x1||0), 2) + Math.pow((shape.y2||0) - (shape.y1||0), 2);
        if (l2 === 0) return false;
        let t = Math.max(0, Math.min(1, ((rpx - (shape.x1||0)) * ((shape.x2||0) - (shape.x1||0)) + (rpy - (shape.y1||0)) * ((shape.y2||0) - (shape.y1||0))) / l2));
        const projX = (shape.x1||0) + t * ((shape.x2||0) - (shape.x1||0)), projY = (shape.y1||0) + t * ((shape.y2||0) - (shape.y1||0));
        return Math.sqrt(Math.pow(rpx - projX, 2) + Math.pow(rpy - projY, 2)) <= pad;
      }
    } else if (shape.type === 'text') {
      const w = shape.width || ((shape.text||'').length * ((shape.size||28) * 0.6));
      return rpx >= (shape.x||0) - pad && rpx <= (shape.x||0) + w + pad && rpy >= (shape.y||0) - ((shape.size||28) / 2) - pad && rpy <= (shape.y||0) + ((shape.size||28) / 2) + pad;
    }
    return false;
  };

  const handlePointerDown = (e) => {
    if (textInput) return;
    e.preventDefault();
    const pos = getPointerPos(e);
    startPos.current = pos; currentPos.current = pos; lastMousePos.current = pos;

    if (tool === 'text') {
      setTextInput({ canvasX: pos.x, canvasY: pos.y, screenX: e.clientX, screenY: e.clientY });
      setSelectedShapeIndex(null); redraw(null);
      return;
    }

    if (tool === 'crop') {
      isDrawing.current = true;
      setCropRect(null);
      redraw(null);
      return;
    }

    if (tool === 'move') {
      let foundIndex = null;
      for (let i = shapesRef.current.length - 1; i >= 0; i--) {
        if (isPointInShape(pos.x, pos.y, shapesRef.current[i])) { foundIndex = i; break; }
      }
      setSelectedShapeIndex(foundIndex); draggedShapeIndex.current = foundIndex; redraw(foundIndex);
    } else {
      isDrawing.current = true; setSelectedShapeIndex(null); redraw(null);
    }
  };

  const handlePointerMove = (e) => {
    if (textInput) return; 
    e.preventDefault();
    const pos = getPointerPos(e);
    currentPos.current = pos;

    if (tool === 'crop' && isDrawing.current) {
      redraw(null);
      return;
    }

    if (tool === 'move' && draggedShapeIndex.current !== null) {
      const shape = shapesRef.current[draggedShapeIndex.current];
      const dx = pos.x - lastMousePos.current.x, dy = pos.y - lastMousePos.current.y;
      
      if (shape.type === 'text') { shape.x += dx; shape.y += dy; } 
      else { shape.x1 += dx; shape.y1 += dy; shape.x2 += dx; shape.y2 += dy; }
      
      lastMousePos.current = pos; redraw();
    } else if (isDrawing.current) {
      redraw();
    }
  };

  const handlePointerUp = () => {
    if (textInput) return;

    if (tool === 'crop' && isDrawing.current) {
      isDrawing.current = false;
      let w = currentPos.current.x - startPos.current.x;
      let h = currentPos.current.y - startPos.current.y;
      
      if (cropRatio) {
        const absW = Math.abs(w);
        const absH = Math.abs(h);
        if (absW / cropRatio > absH) {
          h = (Math.sign(h) || 1) * (absW / cropRatio);
        } else {
          w = (Math.sign(w) || 1) * (absH * cropRatio);
        }
      }

      const finalW = Math.abs(w);
      const finalH = Math.abs(h);

      if (finalW > 20 && finalH > 20) {
        setCropRect({
          x: Math.min(startPos.current.x, startPos.current.x + w),
          y: Math.min(startPos.current.y, startPos.current.y + h),
          w: finalW, h: finalH
        });
      }
      redraw(null);
      return;
    }

    if (tool === 'move') {
      draggedShapeIndex.current = null;
    } else if (isDrawing.current) {
      isDrawing.current = false;
      const dist = Math.sqrt(Math.pow(currentPos.current.x - startPos.current.x, 2) + Math.pow(currentPos.current.y - startPos.current.y, 2));
      if (dist > 10) {
        shapesRef.current.push({
          type: tool, x1: startPos.current.x, y1: startPos.current.y, x2: currentPos.current.x, y2: currentPos.current.y, color: color, rotation: 0, size: textSize
        });
      }
      redraw();
    }
  };

  const handleWheel = (e) => {
    if (selectedShapeIndex !== null) {
      const shape = shapesRef.current[selectedShapeIndex];
      const delta = e.deltaY > 0 ? 5 : -5; 
      const currentDeg = (shape.rotation || 0) * (180/Math.PI);
      shape.rotation = (currentDeg + delta) * (Math.PI / 180);
      setForceRender(prev => prev + 1); redraw();
    }
  };

  const confirmText = () => {
    const inputEl = document.getElementById('floating-text-input');
    if (!inputEl) return;
    const val = inputEl.value;
    if (val && val.trim() !== '' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.font = `bold ${textSize}px sans-serif`;
      shapesRef.current.push({ 
        type: 'text', text: val.trim(), x: textInput.canvasX, y: textInput.canvasY, color: color, size: textSize, width: ctx.measureText(val.trim()).width, rotation: 0
      });
      redraw(null);
    }
    setTextInput(null);
  };

  const applyCrop = () => {
    if (!cropRect || !imageRef.current || !canvasRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = cropRect.w;
    canvas.height = cropRect.h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageRef.current, cropRect.x, cropRect.y, cropRect.w, cropRect.h, 0, 0, cropRect.w, cropRect.h);

    const newImageSrc = canvas.toDataURL('image/jpeg', 0.6);
    const img = new Image();
    img.src = newImageSrc;
    img.onload = () => {
      imageRef.current = img; 
      if(canvasRef.current) {
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
      }
      shapesRef.current = shapesRef.current.map(s => {
        if (s.type === 'circle' || s.type === 'arrow') {
          return { ...s, x1: s.x1 - cropRect.x, y1: s.y1 - cropRect.y, x2: s.x2 - cropRect.x, y2: s.y2 - cropRect.y };
        } else if (s.type === 'text') {
          return { ...s, x: s.x - cropRect.x, y: s.y - cropRect.y };
        }
        return s;
      });
      setCropRect(null);
      setTool('arrow');
      redraw(null);
    };
  };

  const handleUndo = () => { shapesRef.current.pop(); setSelectedShapeIndex(null); redraw(null); };
  const handleDeleteSelected = () => {
    if (selectedShapeIndex !== null) { shapesRef.current.splice(selectedShapeIndex, 1); setSelectedShapeIndex(null); redraw(null); }
  };

  const handleSave = () => {
    setSelectedShapeIndex(null); setTextInput(null); setCropRect(null); redraw(null);
    setTimeout(() => { 
      if (canvasRef.current && imageRef.current) {
        onSave(canvasRef.current.toDataURL('image/jpeg', 0.6), imageRef.current.src, shapesRef.current); 
      }
    }, 50);
  };

  const handleRatioChange = (ratio) => {
    setCropRatio(ratio);
    setCropRect(null); 
    redraw(null);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-gray-900 p-4 rounded-xl shadow-2xl flex flex-col h-full max-h-[90vh] relative">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-800 p-3 rounded-lg">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-gray-700 p-1 rounded-lg items-center">
              <button onClick={() => {setTool('move'); setSelectedShapeIndex(null); setTextInput(null); setCropRect(null); redraw(null);}} className={`p-2 rounded flex items-center gap-1 ${tool === 'move' ? 'bg-[#F4B41A] text-[#5C3A21]' : 'text-white hover:bg-gray-600'}`} title="Mover Seleção"><Move size={20} strokeWidth={3} /></button>
              <div className="w-px h-6 bg-gray-500 mx-1"></div>
              <button onClick={() => {setTool('crop'); setSelectedShapeIndex(null); setTextInput(null); setCropRect(null); redraw(null);}} className={`p-2 rounded ${tool === 'crop' ? 'bg-[#F4B41A] text-[#5C3A21]' : 'text-white hover:bg-gray-600'}`} title="Cortar Imagem"><Scissors size={20} strokeWidth={3} /></button>
              <div className="w-px h-6 bg-gray-500 mx-1"></div>
              <button onClick={() => {setTool('arrow'); setSelectedShapeIndex(null); setTextInput(null); setCropRect(null); redraw(null);}} className={`p-2 rounded ${tool === 'arrow' ? 'bg-[#F4B41A] text-[#5C3A21]' : 'text-white hover:bg-gray-600'}`} title="Desenhar Seta"><ArrowUpRight size={20} strokeWidth={3} /></button>
              <button onClick={() => {setTool('circle'); setSelectedShapeIndex(null); setTextInput(null); setCropRect(null); redraw(null);}} className={`p-2 rounded ${tool === 'circle' ? 'bg-[#F4B41A] text-[#5C3A21]' : 'text-white hover:bg-gray-600'}`} title="Desenhar Círculo"><Circle size={20} strokeWidth={3} /></button>
              <button onClick={() => {setTool('text'); setSelectedShapeIndex(null); setCropRect(null); redraw(null);}} className={`p-2 rounded ${tool === 'text' ? 'bg-[#F4B41A] text-[#5C3A21]' : 'text-white hover:bg-gray-600'}`} title="Escrever Texto"><TypeIcon size={20} strokeWidth={3} /></button>
            </div>

            {tool === 'crop' && (
              <div className="flex items-center gap-1 bg-gray-700 px-2 py-1.5 rounded-lg border border-gray-600">
                <span className="text-gray-400 text-[10px] font-bold mr-1 uppercase tracking-wider hidden sm:inline">Proporção:</span>
                <button onClick={() => handleRatioChange(null)} className={`px-2 py-1 text-xs font-bold rounded transition ${cropRatio === null ? 'bg-[#F4B41A] text-[#5C3A21]' : 'text-white hover:bg-gray-600'}`}>Livre</button>
                <button onClick={() => handleRatioChange(1)} className={`px-2 py-1 text-xs font-bold rounded transition ${cropRatio === 1 ? 'bg-[#F4B41A] text-[#5C3A21]' : 'text-white hover:bg-gray-600'}`}>1:1</button>
                <button onClick={() => handleRatioChange(4/3)} className={`px-2 py-1 text-xs font-bold rounded transition ${cropRatio === 4/3 ? 'bg-[#F4B41A] text-[#5C3A21]' : 'text-white hover:bg-gray-600'}`}>4:3</button>
                <button onClick={() => handleRatioChange(16/9)} className={`px-2 py-1 text-xs font-bold rounded transition ${cropRatio === 16/9 ? 'bg-[#F4B41A] text-[#5C3A21]' : 'text-white hover:bg-gray-600'}`}>16:9</button>
              </div>
            )}

            {cropRect && (
              <button onClick={applyCrop} className="ml-2 px-3 py-1.5 bg-green-500 text-white font-bold rounded hover:bg-green-600 transition flex items-center gap-1 animate-pulse">
                <Check size={16}/> Aplicar Corte
              </button>
            )}

            {(tool === 'text' || (tool === 'move' && selectedShapeIndex !== null && shapesRef.current[selectedShapeIndex]?.type === 'text')) && (
              <div className="flex items-center gap-2 bg-gray-700 px-2 py-1.5 rounded-lg border border-gray-600">
                <button onClick={() => changeTextSize(-4)} className="text-white hover:text-[#F4B41A] transition p-1"><Minus size={16} /></button>
                <span className="text-white text-sm font-bold w-6 text-center">{textSize}</span>
                <button onClick={() => changeTextSize(4)} className="text-white hover:text-[#F4B41A] transition p-1"><Plus size={16} /></button>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => changeColor('#FF0000')} className={`w-8 h-8 rounded-full bg-red-500 border-2 ${color === '#FF0000' ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-70'}`} title="Vermelho" />
              <button onClick={() => changeColor('#F4B41A')} className={`w-8 h-8 rounded-full bg-[#F4B41A] border-2 ${color === '#F4B41A' ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-70'}`} title="Amarelo" />
              <button onClick={() => changeColor('#FFFFFF')} className={`w-8 h-8 rounded-full bg-white border-2 ${color === '#FFFFFF' ? 'border-gray-400 scale-110 shadow-md' : 'border-transparent opacity-70'}`} title="Branco" />
            </div>

            <div className="flex gap-2 ml-2 items-center">
              {tool === 'move' && selectedShapeIndex !== null && shapesRef.current[selectedShapeIndex]?.type === 'text' && (
                <div className="flex items-center" title="Editar Texto Selecionado">
                  <input 
                    type="text" 
                    value={shapesRef.current[selectedShapeIndex].text || ''} 
                    onChange={(e) => { 
                      shapesRef.current[selectedShapeIndex].text = e.target.value; 
                      if(canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        ctx.font = `bold ${shapesRef.current[selectedShapeIndex].size || 28}px sans-serif`;
                        shapesRef.current[selectedShapeIndex].width = ctx.measureText(e.target.value).width;
                        setForceRender(prev => prev + 1); 
                        redraw(); 
                      }
                    }} 
                    className="ml-2 w-32 sm:w-48 px-2 py-1 rounded text-black font-bold outline-none border-2 border-[#F4B41A]" 
                  />
                </div>
              )}

              {selectedShapeIndex !== null && shapesRef.current[selectedShapeIndex] && (
                <div className="flex items-center gap-1.5 bg-[#F4B41A]/20 px-2 py-1 rounded-lg border border-[#F4B41A]/50" title="Girar (ou use o scroll do mouse)">
                  <RefreshCw size={16} className="text-[#F4B41A]" />
                  <input type="range" min="-180" max="180" step="1" value={Math.round((shapesRef.current[selectedShapeIndex].rotation || 0) * (180/Math.PI)) || 0} onChange={(e) => { shapesRef.current[selectedShapeIndex].rotation = parseFloat(e.target.value) * (Math.PI / 180); setForceRender(prev => prev + 1); redraw(); }} className="w-16 sm:w-24 cursor-pointer accent-[#F4B41A]" />
                </div>
              )}
              <button onClick={handleUndo} className="p-2 text-white hover:bg-gray-700 bg-gray-700/50 border border-gray-600 rounded-lg flex items-center gap-1" title="Desfazer último"><Undo size={18} /></button>
              {selectedShapeIndex !== null && <button onClick={handleDeleteSelected} className="p-2 text-white hover:bg-red-600 bg-red-500 rounded-lg flex items-center gap-1 animate-pulse" title="Apagar Selecionado"><Trash2 size={18} /></button>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="flex items-center gap-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-bold transition"><X size={18} /> <span className="hidden sm:inline">Cancelar</span></button>
            <button onClick={handleSave} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-50 font-bold transition"><Check size={18} /> <span className="hidden sm:inline">Salvar Edição</span></button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex items-center justify-center bg-black/50 rounded-lg relative border border-gray-700">
          <canvas ref={canvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerOut={handlePointerUp} onWheel={handleWheel} className={`max-w-full max-h-full object-contain shadow-md ${tool === 'move' ? 'cursor-move' : (tool === 'text' ? 'cursor-text' : (tool === 'crop' ? 'cursor-crosshair' : 'cursor-crosshair'))}`} style={{ touchAction: 'none' }} />
          {textInput && (
            <div style={{ position: 'fixed', top: textInput.screenY - 20, left: textInput.screenX, zIndex: 60 }} className="flex items-center gap-2 bg-gray-800 p-2 rounded shadow-2xl border border-gray-600">
              <input autoFocus type="text" id="floating-text-input" placeholder="Escreva a anotação..." className="px-2 py-1.5 rounded text-black font-bold outline-none min-w-[200px] border-2 focus:border-[#F4B41A]" onKeyDown={(e) => { if (e.key === 'Enter') confirmText(); if (e.key === 'Escape') setTextInput(null); }} />
              <button onClick={confirmText} className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded transition"><Check size={18}/></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FornecedorSelect = ({ value, onChange, fornecedores, onAddFornecedor }) => {
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

const ClienteSelect = ({ value, onChange, clientes, onAddCliente }) => {
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

const GerenciarFornecedoresModal = ({ isOpen, onClose, fornecedores, onAdd, onEdit, onRemove }) => {
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

const GerenciarClientesModal = ({ isOpen, onClose, clientes, onAdd, onEdit, onRemove }) => {
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

const GerenciarUsuariosModal = ({ isOpen, onClose, usersDirectory, currentUid, onAddUser, onRemoveUser, onResetPassword, onUpdatePermissions }) => {
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

  // === NOVOS ESTADOS PARA EDIÇÃO ===
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

const EditProfileModal = ({ isOpen, onClose, initialName, initialRole, onSave }) => {
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

const StatusModal = ({ registro, onClose, onSave, avaliadorAtual, canApprove }) => {
  const [status, setStatus] = useState(registro?.status || 'Pendente');
  const [obs, setObs] = useState(registro?.observacoesStatus || '');
  const [enviado, setEnviado] = useState(registro?.enviado || false);

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm no-print">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border-t-4 border-purple-500 animate-fade-in-up">
        <h3 className="text-xl font-black text-gray-900 mb-1">{canApprove ? 'Avaliar RNC' : 'Registrar Envio'}</h3>
        <p className="text-gray-500 text-sm mb-6 font-medium">Ação realizada por: <span className="font-bold">{avaliadorAtual}</span></p>
        
        <div className="space-y-5">
          {canApprove && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Situação do Relatório</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-bold text-gray-700 bg-gray-50 shadow-sm">
                <option value="Pendente">⏳ Aguardando / Pendente</option>
                <option value="Liberado">✅ Liberado (Aprovado)</option>
                <option value="Não Liberado">❌ Não Liberado (Com Pendências)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Status de Envio (WhatsApp/Email)</label>
            <select value={enviado ? 'sim' : 'nao'} onChange={(e) => setEnviado(e.target.value === 'sim')} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 bg-gray-50 shadow-sm">
              <option value="nao">📥 Não Enviado</option>
              <option value="sim">📤 Enviado</option>
            </select>
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
          <button onClick={() => onSave(registro?.id, status, status === 'Não Liberado' ? obs : '', enviado)} className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold transition text-sm flex items-center gap-2 shadow-md"><Check size={18}/> Salvar {canApprove ? 'Avaliação' : 'Envio'}</button>
        </div>
      </div>
    </div>
  );
};

const DashboardFilters = ({ onFilterChange, fornecedores }) => {
  const [filters, setFilters] = useState({ periodo: 'mes_atual', fornecedor: '', tipo: '', status: '' });
  const handleChange = (key, value) => { const newFilters = { ...filters, [key]: value }; setFilters(newFilters); onFilterChange(newFilters); };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-3 items-center">
      <Filter size={18} className="text-gray-500" />
      <select value={filters.periodo} onChange={(e) => handleChange('periodo', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#F4B41A] outline-none">
        <option value="mes_atual">Mês Atual</option><option value="mes_anterior">Mês Anterior</option>
        <option value="trimestre">Último Trimestre</option><option value="ano">Este Ano</option><option value="todos">Todo Período</option>
      </select>
      <select value={filters.status} onChange={(e) => handleChange('status', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#F4B41A] outline-none">
        <option value="">Todos os Status</option><option value="Pendente">Aguardando Avaliação</option><option value="Liberado">Liberados (✅)</option><option value="Não Liberado">Pendentes (❌)</option>
      </select>
      <select value={filters.fornecedor} onChange={(e) => handleChange('fornecedor', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#F4B41A] outline-none">
        <option value="">Todos Fornecedores</option>
        {(fornecedores || []).filter(f => typeof f === 'string').map((f, i) => <option key={i} value={f}>{f}</option>)}
      </select>
      <select value={filters.tipo} onChange={(e) => handleChange('tipo', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#F4B41A] outline-none">
        <option value="">Todos os Tipos</option><option value="Problema com Fornecedor">Problema com Fornecedor</option>
        <option value="Insumo ou Embalagem">Insumo ou Embalagem</option><option value="Ocorrência Interna">Ocorrência Interna</option>
        <option value="Relatório de Não Conformidade - Cliente">Não Conformidade - Cliente</option>
        <option value="Teste de Produto">Teste de Produto</option><option value="Teste de Equipamento">Teste de Equipamento</option>
      </select>
    </div>
  );
};

const BarChart = ({ data, title, color = '#F4B41A' }) => {
  if (!data || data.length === 0) return null;
  const maxValue = Math.max(...(data || []).map(d => d.value || 0), 1);
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-sm font-bold text-gray-700 mb-4">{title}</h3>
      <div className="space-y-3">
        {(data || []).map((item, index) => {
          const percentage = ((item.value || 0) / maxValue) * 100;
          return (
            <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-600 truncate mr-2" title={item.label}>{item.label}</span>
                <span className="font-bold text-gray-800">{item.value || 0}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 ease-out flex items-center" style={{ width: `${Math.max(percentage, 2)}%`, backgroundColor: item.color || color }}>
                  {percentage > 10 && <span className="text-white text-xs font-bold ml-2">{percentage.toFixed(0)}%</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PieChartComponent = ({ data, title }) => {
  if (!data || data.length === 0) return null;
  const total = (data || []).reduce((sum, item) => sum + (item.value || 0), 0);
  if (total === 0) return null;
  
  const colors = ['#F4B41A', '#ED7D31', '#5C3A21', '#22C55E', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];
  let currentAngle = 0;
  const slices = (data || []).map((item, index) => {
    const percentage = ((item.value || 0) / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle; currentAngle += angle;
    const startRad = ((startAngle - 90) * Math.PI) / 180, endRad = ((startAngle + angle - 90) * Math.PI) / 180;
    const cx = 50, cy = 50, r = 40;
    const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad), y2 = cy + r * Math.sin(endRad);
    return { ...item, percentage, color: item.color || colors[index % colors.length], path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z` };
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-sm font-bold text-gray-700 mb-4">{title}</h3>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 100 100" className="w-48 h-48">
          {slices.map((slice, index) => <path key={index} d={slice.path} fill={slice.color} stroke="white" strokeWidth="1" className="transition-all duration-500 hover:opacity-80 cursor-pointer"><title>{`${slice.label}: ${slice.value} (${slice.percentage.toFixed(1)}%)`}</title></path>)}
          <circle cx="50" cy="50" r="25" fill="white" />
          <text x="50" y="48" textAnchor="middle" className="text-lg font-bold" fill="#1f2937">{total}</text>
          <text x="50" y="60" textAnchor="middle" className="text-xs" fill="#6b7280">Total</text>
        </svg>
        <div className="mt-4 grid grid-cols-2 gap-2 w-full">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }}></div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-700 truncate" title={slice.label}>{slice.label}</div>
                <div className="text-xs text-gray-500">{slice.value} ({slice.percentage.toFixed(1)}%)</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
const RelatorioViewModal = ({ registro, onClose }) => {
  if (!registro) return null;

  const safeDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('pt-BR');
    } catch (error) { return ''; }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm no-print">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full animate-fade-in-up flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-5 border-b border-gray-200 pb-3">
          <h3 className="text-xl font-black text-[#5C3A21] flex items-center gap-2">
            <FileText size={24}/> Visão Rápida do Relatório
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 p-2 rounded-lg transition">
            <X size={20}/>
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="overflow-y-auto pr-2 space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Tipo</p>
              <p className="font-semibold text-gray-800">{registro.tipoRelatorio || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Data de Emissão</p>
              <p className="font-semibold text-gray-800">{registro.dataRelatorio || safeDate(registro.dataCriacao)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Produto / Material</p>
              <p className="font-semibold text-gray-800">{registro.produto || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Autor</p>
              <p className="font-semibold text-gray-800">{registro.autorNome || 'Desconhecido'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-bold text-gray-500 uppercase">Resumo da Ocorrência</p>
              <p className="font-semibold text-gray-800">{registro.ocorrencia || 'Nenhum resumo'}</p>
            </div>
          </div>

          {registro.descricao && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Descrição</p>
              <div className="bg-white p-3 border border-gray-200 rounded-lg text-sm text-gray-700 rich-text-content" dangerouslySetInnerHTML={{ __html: registro.descricao }} />
            </div>
          )}

          {/* Status Atual */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm font-bold text-gray-700">Status da Avaliação:</span>
            <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase border tracking-wide ${
                (!registro.status || registro.status === 'Pendente') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                registro.status === 'Liberado' ? 'bg-green-50 text-green-700 border-green-200' :
                'bg-red-50 text-red-700 border-red-200'
              }`}>
                {registro.status || 'Pendente'}
            </span>
            <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase border tracking-wide flex items-center gap-1 ${
                registro.enviado ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                <Send size={12} /> {registro.enviado ? 'Enviado' : 'Não Enviado'}
            </span>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
          <button onClick={onClose} className="px-6 py-2.5 bg-[#5C3A21] text-[#F4B41A] rounded-lg hover:bg-[#4a2e1a] font-bold transition shadow-md">
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
function App() {
  const [view, setView] = useState('loading'); 
  const [authLoading, setAuthLoading] = useState(true);
  
  const [editingImageIndex, setEditingImageIndex] = useState(null); 
  const [registros, setRegistros] = useState([]); 
  const [registroToDelete, setRegistroToDelete] = useState(null); 
  const [registroToView, setRegistroToView] = useState(null);
  const [evaluatingRegistro, setEvaluatingRegistro] = useState(null);
  const [editingReportId, setEditingReportId] = useState(null);
  const [isFornecedoresModalOpen, setFornecedoresModalOpen] = useState(false);
  const [isClientesModalOpen, setClientesModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

  const [dbError, setDbError] = useState(false); 
  const [fornecedores, setFornecedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  const [appMessage, setAppMessage] = useState(null);
  const [user, setUser] = useState(null);
  const [dashboardFilters, setDashboardFilters] = useState({ periodo: 'mes_atual', fornecedor: '', tipo: '', status: '' });
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(20);
  // Users Directory & Custom App Auth
  const [usersDirectory, setUsersDirectory] = useState([]);
  const [checkingDirectory, setCheckingDirectory] = useState(true);
  const [isDbConfirmedEmpty, setIsDbConfirmedEmpty] = useState(false);
  const [dbSyncError, setDbSyncError] = useState(false);
  const [appUser, setAppUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginNome, setLoginNome] = useState('');
  const [loginCargo, setLoginCargo] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  
  // Login e Solicitação Pública (Welcome Screen)
  const [welcomeMode, setWelcomeMode] = useState('choice'); // choice, login, solicitar
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [solicitacaoForm, setSolicitacaoForm] = useState({
    tipoRelatorio: 'Problema com Fornecedor', solicitante: '', urgencia: 'Média', produto: '', lote: '', nf: '', dataRecebimento: '', validade: '', dataFabricacao: '', descricao: '', imagens: []
  });

  // User Profile
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [authError, setAuthError] = useState('');

  const defaultAssinaturas = [
    { nome: 'Ellen Costa', cargo: 'Supervisora de Qualidade\nControle de Qualidade\nIMAC Congelados' },
    { nome: 'Nathália Viana de Carvalho', cargo: 'Nutricionista - CRN 13435\nControle de Qualidade\nIMAC Congelados' },
    { nome: 'Cristiamberg Coimbra', cargo: 'Estagiário de Qualidade\nControle de Qualidade\nIMAC Congelados' }
  ];
const defaultTopicos = [
    { id: 'default_1', titulo: '1. Descrição Detalhada', texto: '' },
    { id: 'default_2', titulo: '2. Considerações Finais', texto: '' }
  ];

  const getEmptyForm = () => ({
    logo: localStorage.getItem('imac_logo_oficial') || null,
    tipoRelatorio: 'Problema com Fornecedor',
    topicos: [...defaultTopicos],
    dataRelatorio: new Date().toLocaleDateString('pt-BR'),
    dataOcorrencia: '', produto: '', ocorrencia: '', lote: '', quantidade: '', validade: '',
    dataRecebimento: '', nf: '', horarioEmbalamento: '', descricao: '', consideracoes: '',
    lojasLocais: [], dataFabricacao: '', supervisor: '', sabor: '', odor: '', cor: '', temperatura: '', statusParecer: '', acaoCorretiva: '', conclusaoParecer: '',
    localData: `Aquiraz, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`,
    imagens: [], fornecedor: '', assinaturas: [...defaultAssinaturas]
  });

  const [formData, setFormData] = useState(getEmptyForm());

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth); 
        }
      } catch (error) { 
        console.error("Auth Init Error:", error);
        setAuthLoading(false); 
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    const sessionUserStr = localStorage.getItem('imac_app_session_user');
    if (sessionUserStr) {
      try {
        const sessionUser = JSON.parse(sessionUserStr);
        setAppUser(sessionUser);
        setUserName(sessionUser.nome);
        setUserRole(sessionUser.cargo);
        setIsAdmin(sessionUser.isAdmin === true);
        setCanApprove(sessionUser.canApprove === true || sessionUser.isAdmin === true);
        setView('dashboard');
      } catch (e) {
        setView('welcome');
      }
    } else {
      setView('welcome');
    }

    const savedDir = localStorage.getItem('imac_users_directory');
    if (savedDir) {
      try { setUsersDirectory(JSON.parse(savedDir)); } catch(e) {}
    }
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setCheckingDirectory(false);
      return;
    }

    const timeout = setTimeout(() => {
      setCheckingDirectory(false);
      setDbSyncError(true);
    }, 12000); 

    if (!db || !user) return;
    
    const unsubscribeUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users_directory'), 
      (snapshot) => {
        clearTimeout(timeout);
        const cloudData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (cloudData.length === 0) {
          setIsDbConfirmedEmpty(true);
        } else {
          setIsDbConfirmedEmpty(false);
        }
        setDbSyncError(false);

        setUsersDirectory(prev => {
          const cloudIds = new Set(cloudData.map(u => u.id));
          const localOnly = (prev || []).filter(u => !cloudIds.has(u.id) && u._isUnsynced);
          const merged = [...cloudData, ...localOnly];
          localStorage.setItem('imac_users_directory', JSON.stringify(merged));

          const sessionUserStr = localStorage.getItem('imac_app_session_user');
          if (sessionUserStr && cloudData.length > 0) {
             try {
               const currentUser = JSON.parse(sessionUserStr);
               const stillExists = merged.find(u => u.id === currentUser.id);
               if (!stillExists) {
                  localStorage.removeItem('imac_app_session_user');
                  window.location.reload(); 
               } else {
                  localStorage.setItem('imac_app_session_user', JSON.stringify(stillExists));
               }
             } catch(e){}
          }
          return merged;
        });
        setCheckingDirectory(false); 
      },
      (error) => {
        clearTimeout(timeout);
        setCheckingDirectory(false);
        setDbSyncError(true);
      }
    );

    return () => {
      clearTimeout(timeout);
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [db, isConfigured, user]);

  const loginUser = (userObj) => {
    localStorage.setItem('imac_app_session_user', JSON.stringify(userObj));
    setAppUser(userObj);
    setUserName(userObj.nome);
    setUserRole(userObj.cargo);
    setIsAdmin(userObj.isAdmin === true);
    setCanApprove(userObj.canApprove === true || userObj.isAdmin === true);
    setView('dashboard');
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const foundUser = usersDirectory.find(u => u.email === loginEmail && u.password === loginPassword);
    
    if (foundUser) {
      loginUser(foundUser);
    } else {
      setAuthError("E-mail ou senha incorretos. Verifique suas credenciais.");
    }
  };

  const handleBootstrapAdmin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (loginPassword.length < 6) {
      setAuthError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    try {
      const newId = "admin_" + Date.now();
      const newUser = {
        id: newId,
        nome: loginNome.trim(),
        cargo: loginCargo.trim(),
        email: loginEmail.trim(),
        password: loginPassword,
        isAdmin: true,
        canApprove: true,
        isManager: true,
        dataCriacao: new Date().toISOString(),
        _isUnsynced: true
      };
      
      const newDirectory = [...usersDirectory, newUser];
      setUsersDirectory(newDirectory);
      localStorage.setItem('imac_users_directory', JSON.stringify(newDirectory));
      
      if (db && isConfigured) {
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users_directory', newId), newUser).catch(()=>{});
      }
      
      loginUser(newUser);
    } catch (error) {
      setAuthError("Erro ao configurar a conta mestre: " + error.message);
    }
  };

  const handleCreateNewUser = async (newEmail, newPassword, newNome, newCargo, newIsAdmin, newCanApprove, newIsManager) => {
    try {
      const existingUser = usersDirectory.find(u => u.email === newEmail);
      if (existingUser) {
        setAppMessage("❌ E-mail já está em uso.");
        return false;
      }
      
      const newId = "user_" + Date.now();
      const newUser = {
        id: newId,
        nome: newNome,
        cargo: newCargo,
        email: newEmail,
        password: newPassword,
        isAdmin: newIsAdmin,
        canApprove: newCanApprove,
        isManager: newIsManager || false,
        dataCriacao: new Date().toISOString(),
        _isUnsynced: true
      };

      setUsersDirectory(prev => {
        const newList = [...prev, newUser];
        localStorage.setItem('imac_users_directory', JSON.stringify(newList));
        return newList;
      });

      if (db && isConfigured) {
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users_directory', newId), newUser).catch(()=>{});
      }

      setAppMessage("✅ Usuário criado com sucesso!");
      return true;
    } catch (error) {
      setAppMessage("❌ Erro ao criar usuário: " + error.message);
      return false;
    }
  };
const handleUpdatePermissions = async (uid, newIsAdmin, newCanApprove, newIsManager) => {
    try {
      setUsersDirectory(prev => {
        const newList = prev.map(u => u.id === uid ? { ...u, isAdmin: newIsAdmin, canApprove: newCanApprove, isManager: newIsManager } : u);
        localStorage.setItem('imac_users_directory', JSON.stringify(newList));
        return newList;
      });

      if (db && isConfigured) {
        updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users_directory', uid), { 
          isAdmin: newIsAdmin, 
          canApprove: newCanApprove, 
          isManager: newIsManager 
        }).catch(()=>{});
      }
    } catch (e) {
      setAppMessage("❌ Erro ao atualizar permissões.");
    }
  };
  const handleResetPassword = async (uid, newPass) => {
    try {
      setUsersDirectory(prev => {
        const newList = prev.map(u => u.id === uid ? { ...u, password: newPass } : u);
        localStorage.setItem('imac_users_directory', JSON.stringify(newList));
        return newList;
      });

      if (db && isConfigured) {
        updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users_directory', uid), { password: newPass }).catch(()=>{});
      }
    } catch (e) {}
  };

  const handleRemoveUser = async (uidToRemove) => {
    try {
      setUsersDirectory(prev => {
        const newList = prev.filter(u => u.id !== uidToRemove);
        localStorage.setItem('imac_users_directory', JSON.stringify(newList));
        return newList;
      });

      if (db && isConfigured) {
        deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users_directory', uidToRemove)).catch(()=>{});
      }
      setAppMessage("✅ Usuário revogado do sistema.");
    } catch (e) {
      setAppMessage("❌ Erro ao remover acesso do usuário.");
    }
  };

  const handleLogout = async () => {
    setAppUser(null);
    setUserName('');
    setUserRole('');
    setIsAdmin(false);
    setCanApprove(false);
    setLoginEmail('');
    setLoginPassword('');
    localStorage.removeItem('imac_app_session_user');
    setView('welcome');
  };

  const handleUpdateProfile = async (newName, newRole) => {
    setUserName(newName);
    setUserRole(newRole);

    if (appUser) {
      const updatedUser = { ...appUser, nome: newName, cargo: newRole };
      loginUser(updatedUser);

      setUsersDirectory(prev => {
        const newList = prev.map(u => u.id === appUser.id ? updatedUser : u);
        localStorage.setItem('imac_users_directory', JSON.stringify(newList));
        return newList;
      });

      if (db && isConfigured) {
        updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users_directory', appUser.id), {
          nome: newName,
          cargo: newRole
        }).then(() => setAppMessage("✅ Perfil atualizado com sucesso!"))
          .catch(() => setAppMessage("💾 Perfil salvo localmente."));
      } else {
        setAppMessage("💾 Perfil salvo localmente.");
      }
    }
    setIsProfileModalOpen(false);
    setTimeout(() => setAppMessage(null), 3000);
  };

  useEffect(() => {
    const savedFornecedores = localStorage.getItem('imac_fornecedores');
    if (!savedFornecedores) {
      const defaultFornecedores = ['Aurora Alimentos', 'Brasil Foods', 'Seara', 'JBS', 'Marfrig'];
      saveToLocalStorage('imac_fornecedores', defaultFornecedores);
      setFornecedores(defaultFornecedores);
    } else {
      try {
        const parsed = JSON.parse(savedFornecedores);
        if (Array.isArray(parsed)) setFornecedores(parsed);
      } catch (e) {}
    }

    const savedClientes = localStorage.getItem('imac_clientes');
    if (!savedClientes) {
      const defaultClientes = ['Loja Matriz', 'Filial Centro', 'Distribuidora ABC', 'Mercado São Luiz'];
      saveToLocalStorage('imac_clientes', defaultClientes);
      setClientes(defaultClientes);
    } else {
      try {
        const parsed = JSON.parse(savedClientes);
        if (Array.isArray(parsed)) setClientes(parsed);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!db || !isConfigured || !user) return;
    
    const unsubscribeFornecedores = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'fornecedores'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data().nome);
      if (data.length > 0) { 
        setFornecedores(data); 
        saveToLocalStorage('imac_fornecedores', data); 
      }
    }, (error) => {});

    const unsubscribeClientes = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'clientes'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data().nome);
      if (data.length > 0) { 
        setClientes(data); 
        saveToLocalStorage('imac_clientes', data); 
      }
    }, (error) => {});

    return () => {
      unsubscribeFornecedores();
      unsubscribeClientes();
    };
  }, [db, isConfigured, user]);

  const addFornecedor = async (nome) => {
    const nomeLimpo = nome.trim();
    if (!(fornecedores || []).includes(nomeLimpo)) {
      setFornecedores(prev => { const newList = [...(prev || []), nomeLimpo]; saveToLocalStorage('imac_fornecedores', newList); return newList; });
      if (db && isConfigured) {
        addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'fornecedores'), { nome: nomeLimpo, dataCriacao: new Date().toISOString() }).catch(()=>{});
      }
    }
  };

  const editFornecedorObj = async (oldName, newName) => {
    if(!newName.trim() || oldName === newName) return;
    const cleanNew = newName.trim();
    const newList = (fornecedores || []).map(f => f === oldName ? cleanNew : f);
    setFornecedores(newList);
    saveToLocalStorage('imac_fornecedores', newList);

    if (db && isConfigured) {
        getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'fornecedores')).then(qDocs => {
            const docToEdit = qDocs.docs.find(d => d.data().nome === oldName);
            if (docToEdit) updateDoc(docToEdit.ref, { nome: cleanNew }).catch(()=>{});
            else addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'fornecedores'), { nome: cleanNew, dataCriacao: new Date().toISOString() }).catch(()=>{});
        }).catch(()=>{});
    }
  };

  const removeFornecedorObj = async (nomeToRemove) => {
    const newList = (fornecedores || []).filter(f => f !== nomeToRemove);
    setFornecedores(newList);
    saveToLocalStorage('imac_fornecedores', newList);

    if (db && isConfigured) {
        getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'fornecedores')).then(qDocs => {
            const docToDel = qDocs.docs.find(d => d.data().nome === nomeToRemove);
            if (docToDel) deleteDoc(docToDel.ref).catch(()=>{});
        }).catch(()=>{});
    }
  };

  const addCliente = async (nome) => {
    const nomeLimpo = nome.trim();
    if (!(clientes || []).includes(nomeLimpo)) {
      setClientes(prev => { const newList = [...(prev || []), nomeLimpo]; saveToLocalStorage('imac_clientes', newList); return newList; });
      if (db && isConfigured) {
        addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'clientes'), { nome: nomeLimpo, dataCriacao: new Date().toISOString() }).catch(()=>{});
      }
    }
  };

  const editClienteObj = async (oldName, newName) => {
    if(!newName.trim() || oldName === newName) return;
    const cleanNew = newName.trim();
    const newList = (clientes || []).map(c => c === oldName ? cleanNew : c);
    setClientes(newList);
    saveToLocalStorage('imac_clientes', newList);

    if (db && isConfigured) {
        getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'clientes')).then(qDocs => {
            const docToEdit = qDocs.docs.find(d => d.data().nome === oldName);
            if (docToEdit) updateDoc(docToEdit.ref, { nome: cleanNew }).catch(()=>{});
            else addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'clientes'), { nome: cleanNew, dataCriacao: new Date().toISOString() }).catch(()=>{});
        }).catch(()=>{});
    }
  };

  const removeClienteObj = async (nomeToRemove) => {
    const newList = (clientes || []).filter(c => c !== nomeToRemove);
    setClientes(newList);
    saveToLocalStorage('imac_clientes', newList);

    if (db && isConfigured) {
        getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'clientes')).then(qDocs => {
            const docToDel = qDocs.docs.find(d => d.data().nome === nomeToRemove);
            if (docToDel) deleteDoc(docToDel.ref).catch(()=>{});
        }).catch(()=>{});
    }
  };

  useEffect(() => {
    const savedSolicitacoes = localStorage.getItem('imac_solicitacoes');
    if (savedSolicitacoes) {
        try { setSolicitacoes(JSON.parse(savedSolicitacoes)); } catch (e) {}
    }
    
    if (!db || !isConfigured || !user) return; 
    
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'solicitacoes'), (snapshot) => {
        const cloudData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setSolicitacoes(cloudData.sort((a,b) => new Date(b.dataCriacao) - new Date(a.dataCriacao)));
        saveToLocalStorage('imac_solicitacoes', cloudData);
    }, (error) => {});
    return () => unsub();
  }, [db, isConfigured, user]);

  const submitSolicitacao = async (e) => {
    e.preventDefault();
    try {
      const newSol = { 
        ...solicitacaoForm, 
        id: 'sol_' + Date.now(), 
        dataCriacao: new Date().toISOString(),
        status: 'Pendente' 
      };
      
      setSolicitacoes(prev => {
        const list = [newSol, ...prev];
        saveToLocalStorage('imac_solicitacoes', list);
        return list;
      });

      if (db && isConfigured) {
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'solicitacoes', newSol.id), newSol).catch(()=>{});
      }
      
      setAppMessage("✅ Solicitação enviada com sucesso!");
      setSolicitacaoForm({ tipoRelatorio: 'Problema com Fornecedor', solicitante: '', urgencia: 'Média', produto: '', lote: '', nf: '', dataRecebimento: '', validade: '', dataFabricacao: '', descricao: '', imagens: [] });
      setWelcomeMode('choice');
      setTimeout(() => setAppMessage(null), 3000);
    } catch(e) {
      setAppMessage("❌ Erro ao enviar solicitação.");
    }
  };

  useEffect(() => {
    const savedLocal = localStorage.getItem('imac_registros');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0));
          setRegistros(parsed);
        }
      } catch (e) {}
    }
    
    if (!db || !isConfigured || !user) return; 
    
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registros'), (snapshot) => {
      const cloudData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setRegistros(prev => {
        const existingIds = new Set(cloudData.map(r => String(r.id)));
        const localOnly = (prev || []).filter(r => r && r.id && !existingIds.has(String(r.id)) && r._isUnsynced);
        const merged = [...cloudData, ...localOnly];
        merged.sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0));
        saveToLocalStorage('imac_registros', merged);
        return merged;
      });
      setDbError(false);
    }, (error) => {
      if (error.code === 'permission-denied') setDbError(true);
    });
    return () => unsubscribe();
  }, [db, isConfigured, user]);

  const handleChange = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };

  const handleImageUpload = async (e, isLogo = false) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (isLogo) {
      try {
        const compressedLogo = await compressImage(files[0], true);
        setFormData(prev => ({ ...prev, logo: compressedLogo }));
        try { localStorage.setItem('imac_logo_oficial', compressedLogo); } catch(e){}
      } catch (error) {}
      return;
    }

    try {
      const compressedImages = await Promise.all(files.map(file => compressImage(file, false)));
      const newImageObjects = compressedImages.map(base64 => ({
        isObject: true,
        id: Date.now() + Math.random(),
        baseSrc: base64, 
        displaySrc: base64,
        shapes: [] 
      }));
      setFormData(prev => ({ ...prev, imagens: [...(prev.imagens || []), ...newImageObjects] }));
    } catch (error) {}
  };

  const removeImage = (indexToRemove) => setFormData((prev) => ({ ...prev, imagens: (prev.imagens || []).filter((_, index) => index !== indexToRemove) }));
  
  const moveImage = (index, step) => {
    setFormData(prev => {
      const novasImagens = [...(prev.imagens || [])];
      const newIndex = index + step;
      if (newIndex >= 0 && newIndex < novasImagens.length) {
        const temp = novasImagens[newIndex];
        novasImagens[newIndex] = novasImagens[index];
        novasImagens[index] = temp;
      }
      return { ...prev, imagens: novasImagens };
    });
  };

  const updateAnnotatedImage = (flattenedSrc, newBaseSrc, newShapes) => {
    setFormData(prev => { 
      const novasImagens = [...(prev.imagens || [])];
      const item = novasImagens[editingImageIndex];
      if (typeof item === 'string') {
        novasImagens[editingImageIndex] = { isObject: true, id: Date.now(), baseSrc: newBaseSrc, displaySrc: flattenedSrc, shapes: newShapes };
      } else if (item) {
        novasImagens[editingImageIndex] = { ...item, baseSrc: newBaseSrc, displaySrc: flattenedSrc, shapes: newShapes };
      }
      return { ...prev, imagens: novasImagens }; 
    });
    setEditingImageIndex(null); 
  };
  
  const removeLogo = () => { setFormData(prev => ({ ...prev, logo: null })); localStorage.removeItem('imac_logo_oficial'); };
  
  const handleAssinaturaChange = (index, field, value) => {
    const novasAssinaturas = [...(formData.assinaturas || [])]; 
    if(novasAssinaturas[index]) {
      novasAssinaturas[index][field] = value;
      setFormData(prev => ({ ...prev, assinaturas: novasAssinaturas }));
    }
  };
  const addAssinatura = () => setFormData(prev => ({ ...prev, assinaturas: [...(prev.assinaturas || []), { nome: '', cargo: '' }] }));
  const removeAssinatura = (indexToRemove) => setFormData(prev => ({ ...prev, assinaturas: (prev.assinaturas || []).filter((_, index) => index !== indexToRemove) }));
const handleTopicoChange = (index, field, value) => {
    const novosTopicos = [...(formData.topicos || [])]; 
    if(novosTopicos[index]) {
      novosTopicos[index][field] = value;
      setFormData(prev => ({ ...prev, topicos: novosTopicos }));
    }
  };
  const addTopico = () => setFormData(prev => ({ ...prev, topicos: [...(prev.topicos || []), { id: Date.now().toString(), titulo: 'Novo Tópico', texto: '' }] }));
  const removeTopico = (indexToRemove) => setFormData(prev => ({ ...prev, topicos: (prev.topicos || []).filter((_, index) => index !== indexToRemove) }));
  const startEditingReport = (registro) => {
    if(!registro) return;
    
    let loadedTopicos = Array.isArray(registro.topicos) ? registro.topicos : [];
    
    // Migração de dados antigos para o novo formato de tópicos
    if (loadedTopicos.length === 0) {
      if (registro.tipoRelatorio === 'Relatório de Não Conformidade - Cliente') {
        if (registro.descricao) loadedTopicos.push({ id: 't1', titulo: 'Descrição da Não Conformidade', texto: registro.descricao });
        if (registro.consideracoes) loadedTopicos.push({ id: 't2', titulo: 'Descritivo de Investigação', texto: registro.consideracoes });
        if (registro.acaoCorretiva) loadedTopicos.push({ id: 't3', titulo: 'Ação Corretiva', texto: registro.acaoCorretiva });
        if (registro.conclusaoParecer) loadedTopicos.push({ id: 't4', titulo: 'Conclusão', texto: registro.conclusaoParecer });
      } else {
        if (registro.descricao) loadedTopicos.push({ id: 't1', titulo: 'Descrição Detalhada', texto: registro.descricao });
        if (registro.consideracoes) loadedTopicos.push({ id: 't2', titulo: 'Considerações Finais', texto: registro.consideracoes });
      }
    }
    if (loadedTopicos.length === 0) loadedTopicos = [...defaultTopicos];

    setFormData({
      logo: registro.logo || localStorage.getItem('imac_logo_oficial') || null,
      tipoRelatorio: registro.tipoRelatorio || 'Problema com Fornecedor',
      dataRelatorio: registro.dataRelatorio || safeDate(registro.dataCriacao),
      dataOcorrencia: registro.dataOcorrencia || '',
      produto: registro.produto || '',
      ocorrencia: registro.ocorrencia || '',
      lote: registro.lote || '',
      quantidade: registro.quantidade || '',
      validade: registro.validade || '',
      dataRecebimento: registro.dataRecebimento || '',
      nf: registro.nf || '',
      horarioEmbalamento: registro.horarioEmbalamento || '',
      lojasLocais: registro.lojasLocais || (registro.lojaLocal ? [registro.lojaLocal] : []),
      dataFabricacao: registro.dataFabricacao || '',
      supervisor: registro.supervisor || '',
      sabor: registro.sabor || '',
      odor: registro.odor || '',
      cor: registro.cor || '',
      temperatura: registro.temperatura || '',
      statusParecer: registro.statusParecer || '',
      topicos: loadedTopicos,
      localData: registro.localData || (registro.dataCriacao ? `Aquiraz, ${safeDate(registro.dataCriacao)}.` : ''),
      imagens: Array.isArray(registro.imagens) ? registro.imagens : [],
      fornecedor: registro.fornecedor || '',
      assinaturas: Array.isArray(registro.assinaturas) ? registro.assinaturas : [...defaultAssinaturas]
    });
    setEditingReportId(registro.id);
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
const duplicateReport = (registro) => {
    if(!registro) return;
    // Puxa os dados para o formulário
    startEditingReport(registro);
    // Limpa o ID de edição para que o sistema salve como um NOVO relatório
    setEditingReportId(null);
    setAppMessage("📝 Relatório duplicado! Altere as informações necessárias (como a loja) e salve.");
    setTimeout(() => setAppMessage(null), 4000);
  };
  const cancelEditing = () => {
    setEditingReportId(null);
    setFormData(getEmptyForm());
    setView('dashboard');
  };

  const handleDarVisto = (reg) => {
    if (!appUser?.isManager) return;
    const currentAssinaturas = Array.isArray(reg.assinaturas) ? reg.assinaturas : [];
    const jaAssinou = currentAssinaturas.some(a => a.nome === userName);
    if (jaAssinou) {
       setAppMessage("⚠️ Você já assinou este relatório.");
       setTimeout(() => setAppMessage(null), 3000);
       return;
    }

    const newAssinaturas = [...currentAssinaturas, { nome: userName, cargo: 'Gerente Industrial\nResponsável Técnica\nIMAC Congelados' }];
    const payload = { assinaturas: newAssinaturas, dataModificacao: new Date().toISOString() };
    
    setRegistros(prev => {
      const updatedList = (prev || []).map(r => r && r.id === reg.id ? { ...r, ...payload } : r);
      saveToLocalStorage('imac_registros', updatedList);
      return updatedList;
    });
    
    if (db && isConfigured) {
      updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registros', String(reg.id)), payload)
        .then(() => setAppMessage("✅ Visto adicionado com sucesso!"))
        .catch(() => setAppMessage("💾 Visto adicionado localmente"));
    } else { setAppMessage("💾 Visto adicionado localmente"); }
    setTimeout(() => setAppMessage(null), 3000);
  };

  const handleUpdateStatus = (id, newStatus, newObs, newEnviado) => {
    const payload = { 
      status: newStatus, 
      observacoesStatus: newObs, 
      enviado: newEnviado,
      dataModificacao: new Date().toISOString(),
      avaliadorNome: userName
    };
    
    setRegistros(prev => {
      const updatedList = (prev || []).map(r => r && r.id === id ? { ...r, ...payload } : r);
      saveToLocalStorage('imac_registros', updatedList);
      return updatedList;
    });
    
    if (db && isConfigured) {
      const safePayload = JSON.parse(JSON.stringify(payload));
      updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registros', String(id)), safePayload)
        .then(() => setAppMessage("✅ Avaliação salva com sucesso e sincronizada!"))
        .catch(() => setAppMessage("💾 Avaliação salva localmente (offline)"));
    } else { setAppMessage("💾 Avaliação salva localmente"); }
    
    setEvaluatingRegistro(null);
    setTimeout(() => setAppMessage(null), 3000);
  };

  const handleSaveReport = (action = 'save_and_preview') => {
    const registroData = {
      tipoRelatorio: String(formData.tipoRelatorio || 'Problema com Fornecedor'),
      dataRelatorio: formData.dataRelatorio || '',
      produto: formData.produto || 'Não especificado',
      ocorrencia: formData.ocorrencia || 'Sem descrição',
      fornecedor: formData.fornecedor || '',
      lote: formData.lote || '', quantidade: formData.quantidade || '', validade: formData.validade || '',
      dataRecebimento: formData.dataRecebimento || '', nf: formData.nf || '', horarioEmbalamento: formData.horarioEmbalamento || '',
      dataOcorrencia: formData.dataOcorrencia || '', descricao: formData.descricao || '', consideracoes: formData.consideracoes || '',
      lojasLocais: formData.lojasLocais || [], dataFabricacao: formData.dataFabricacao || '', supervisor: formData.supervisor || '',
      sabor: formData.sabor || '', odor: formData.odor || '', cor: formData.cor || '', temperatura: formData.temperatura || '',
      statusParecer: formData.statusParecer || '',
      topicos: Array.isArray(formData.topicos) ? formData.topicos : [],
      imagens: Array.isArray(formData.imagens) ? formData.imagens : [], 
      assinaturas: Array.isArray(formData.assinaturas) ? formData.assinaturas : [],
      logo: formData.logo || null, localData: formData.localData || '',
      userId: appUser?.id || 'anonimo',
      autorNome: userName || 'Desconhecido',
      autorCargo: userRole || '',
      enviado: false
    };

    let currentId = editingReportId;

    if (editingReportId) {
      const updatedAt = new Date().toISOString();
      const payloadEdicao = { ...registroData, dataModificacao: updatedAt };
      const existingReport = registros.find(r => r.id === editingReportId);
      if (existingReport && typeof existingReport.enviado !== 'undefined') {
         payloadEdicao.enviado = existingReport.enviado;
      }
      
      setRegistros(prev => {
        const updatedList = (prev || []).map(r => r && r.id === editingReportId ? { ...r, ...payloadEdicao } : r);
        saveToLocalStorage('imac_registros', updatedList);
        return updatedList;
      });

      if (db && isConfigured) {
        const safePayload = JSON.parse(JSON.stringify(payloadEdicao));
        updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registros', String(editingReportId)), safePayload)
          .then(() => setAppMessage("✅ Relatório atualizado na nuvem!"))
          .catch(() => setAppMessage("💾 Atualização salva localmente"));
      } else { setAppMessage("💾 Edição salva localmente"); }
      
    } else {
      const tempId = Date.now().toString();
      const novoRegistro = { ...registroData, id: tempId, dataCriacao: new Date().toISOString(), _isUnsynced: true };
      currentId = tempId;

      setRegistros(prev => { const newList = [novoRegistro, ...(prev || [])]; saveToLocalStorage('imac_registros', newList); return newList; });
      
      if (db && isConfigured) {
        const { id, _isUnsynced, ...registroParaNuvem } = novoRegistro;
        const safePayload = JSON.parse(JSON.stringify(registroParaNuvem));
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registros', tempId), safePayload)
          .then(() => setAppMessage("✅ Relatório salvo na nuvem!"))
          .catch(() => setAppMessage("💾 Salvo localmente (offline)"));
      } else { setAppMessage("💾 Relatório salvo localmente"); }
    }
    
    if (action === 'save_and_preview') {
      setEditingReportId(currentId);
      setView('preview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFormData(getEmptyForm());
      setEditingReportId(null);
      setView('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setTimeout(() => setAppMessage(null), 3000);
  };

  const handlePrintAndSave = () => window.print();

  const confirmDeleteRegistro = (id) => {
    setRegistros(prev => { 
      const newList = (prev || []).filter(r => r && r.id !== id); 
      saveToLocalStorage('imac_registros', newList); 
      return newList; 
    });
    if (db && isConfigured) {
      deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registros', String(id))).catch(()=>{});
    }
    setRegistroToDelete(null);
  };

  const getFilteredRecords = () => {
    return (registros || []).filter(r => {
      if(!r || !r.dataCriacao) return false;
      const d = new Date(r.dataCriacao); 
      if (isNaN(d.getTime())) return false;

      const now = new Date();
      if (dashboardFilters.periodo === 'mes_atual') { if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false; } 
      else if (dashboardFilters.periodo === 'mes_anterior') { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); if (d.getMonth() !== lm.getMonth() || d.getFullYear() !== lm.getFullYear()) return false; } 
      else if (dashboardFilters.periodo === 'trimestre') { const t = new Date(); t.setMonth(t.getMonth() - 3); if (d < t) return false; } 
      else if (dashboardFilters.periodo === 'ano') { if (d.getFullYear() !== now.getFullYear()) return false; }
      if (dashboardFilters.fornecedor && r.fornecedor !== dashboardFilters.fornecedor) return false;
      if (dashboardFilters.tipo && r.tipoRelatorio !== dashboardFilters.tipo) return false;
      
      const recordStatus = r.status || 'Pendente';
      if (dashboardFilters.status && recordStatus !== dashboardFilters.status && !(dashboardFilters.status === 'Pendente' && !r.status)) return false;

      return true;
    });
  };

  const exportToCSV = () => {
    const records = getFilteredRecords();
    const rows = records.map(r => [safeDate(r.dataCriacao), r.tipoRelatorio || '', r.produto || '', r.fornecedor || '', r.ocorrencia || '', r.lote || '', r.quantidade || '', r.autorNome || '']);
    const csv = [['Data', 'Tipo', 'Produto', 'Fornecedor', 'Ocorrência', 'Lote', 'Quantidade', 'Autor'].join(';'), ...rows.map(row => row.join(';'))].join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })); link.download = `relatorios_rnc.csv`; link.click();
  };

  const tipoRelAtual = String(formData.tipoRelatorio || 'Problema com Fornecedor');
  const isFornecedor = tipoRelAtual === 'Problema com Fornecedor' || tipoRelAtual === 'Insumo ou Embalagem';
  const isCliente = tipoRelAtual === 'Relatório de Não Conformidade - Cliente';
  const requiresHorario = tipoRelAtual.includes('Teste') || tipoRelAtual === 'Ocorrência Interna';
  const showValidade = !tipoRelAtual.includes('Insumo') && !tipoRelAtual.includes('Equipamento');

  const getPlaceholders = () => {
    const p = {
      'Problema com Fornecedor': { produto: "Ex: Salsicha Hot Dog - Aurora", ocorrencia: "Ex: Desvio de padrão físico", lote: "Ex: 0426011411", quantidade: "Ex: 12 kg", descricao: "Durante o processo de abertura da embalagem, foi identificada uma não conformidade...", consideracoes: "A presença dessas avarias compromete a integridade do insumo..." },
      'Insumo ou Embalagem': { produto: "Ex: Embalagens plásticas", ocorrencia: "Ex: Fragilidade", lote: "Ex: LOTE 4.1", quantidade: "Ex: 1.562 unidades", descricao: "Durante a rotina de operação...", consideracoes: "O rompimento inviabiliza o acondicionamento..." },
      'Ocorrência Interna': { produto: "Ex: Pão Hot Dog", ocorrencia: "Ex: Presença de corpo estranho", lote: "Ex: A 0103", quantidade: "Ex: 1 pacote (5kg)", descricao: "Durante a rotina de operação...", consideracoes: "Solicitamos que a equipe reforce a atenção..." },
      'Relatório de Não Conformidade - Cliente': { produto: "Ex: Pão de Queijo 400g", ocorrencia: "A loja relatou que...", lote: "Ex: 213094", quantidade: "Ex: 2 pacotes", lojaLocal: "Ex: São Luiz - Cambeba", descricao: "Cliente reportou que...", consideracoes: "Após o recebimento da reclamação..." },
      'Teste de Produto': { produto: "Ex: Pão de Queijo", ocorrencia: "Ex: Teste de formulação", lote: "Ex: Lote Teste 01", quantidade: "Ex: Escala reduzida", descricao: "A avaliação foi realizada após...", consideracoes: "Os resultados obtidos..." },
      'Teste de Equipamento': { produto: "Ex: Seladora Automática", ocorrencia: "Ex: Oscilação na temperatura", lote: "Ex: N/A", quantidade: "Ex: N/A", descricao: "Durante o processamento...", consideracoes: "Como medida de contingência..." }
    };
    return p[tipoRelAtual] || p['Problema com Fornecedor'];
  };
  const placeholders = getPlaceholders();

  const editingReport = editingReportId ? (registros || []).find(r => r && r.id === editingReportId) : null;

  if (authLoading || view === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-[#F4B41A] border-t-[#5C3A21] rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-bold animate-pulse">Carregando sistema seguro...</p>
      </div>
    );
  }

  if (view === 'welcome') {
    const isFirstSetup = usersDirectory.length === 0 && isDbConfirmedEmpty;
    const isOfflineEmpty = usersDirectory.length === 0 && dbSyncError;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
        {appMessage && <div className="fixed top-4 right-4 z-[100] animate-fade-in-up"><div className="bg-white rounded-xl shadow-lg p-4 border-t-4 border-[#F4B41A] max-w-sm"><p className="text-sm font-medium text-gray-800">{appMessage}</p></div></div>}
        
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#F4B41A] opacity-20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-soft"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#5C3A21] opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-soft" style={{animationDelay: '1s'}}></div>
        
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10 border-t-[8px] border-[#5C3A21] animate-fade-in-up">
          <div className="bg-gray-50 p-8 text-center border-b border-gray-100">
            {localStorage.getItem('imac_logo_oficial') ? (
              <img src={localStorage.getItem('imac_logo_oficial')} alt="IMAC" className="max-h-20 object-contain mx-auto mb-4" />
            ) : (
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md border border-gray-200">
                <h1 className="text-3xl font-black text-[#5C3A21]">IMAC</h1>
              </div>
            )}
            <h2 className="text-2xl font-black text-gray-800">Controle de Qualidade</h2>
            {welcomeMode === 'login' && <p className="text-gray-500 mt-2 text-sm flex items-center justify-center gap-1"><Lock size={14}/> Acesso Restrito Corporativo</p>}
            {welcomeMode === 'solicitar' && <p className="text-gray-500 mt-2 text-sm">Solicitação de Relatório de Não Conformidade</p>}
          </div>

          <div className="p-8 text-center">
            {authError && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-3 rounded text-sm text-red-700 animate-fade-in-up flex items-start gap-2 text-left">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {checkingDirectory ? (
              <div className="flex flex-col items-center justify-center py-6 animate-fade-in-up">
                <div className="w-12 h-12 border-4 border-[#F4B41A] border-t-[#5C3A21] rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 font-bold">Sincronizando segurança...</p>
                <p className="text-gray-400 text-xs mt-2">Verificando banco de dados na nuvem</p>
              </div>
            ) : isOfflineEmpty ? (
              <div className="flex flex-col items-center justify-center py-6 animate-fade-in-up text-center">
                <AlertCircle size={40} className="text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Conexão Lenta</h3>
                <p className="text-gray-600 text-sm mb-6">O banco de dados demorou muito a responder. Por segurança, o acesso foi temporariamente bloqueado.</p>
                <button onClick={() => window.location.reload()} className="bg-[#5C3A21] text-[#F4B41A] font-bold py-3 px-6 rounded-xl shadow-md hover:bg-[#4a2e1a] transition w-full">
                  Tentar Novamente
                </button>
              </div>
            ) : isFirstSetup ? (
              <form onSubmit={handleBootstrapAdmin} className="space-y-4 text-left animate-fade-in-up">
                <div className="bg-[#F4B41A]/20 p-3 rounded-lg border border-[#F4B41A] mb-4 text-sm font-bold text-[#5C3A21] text-center flex items-center justify-center gap-2">
                  <AlertCircle size={18} /> Configuração Inicial do Sistema
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Seu Nome Completo</label>
                  <input type="text" required value={loginNome} onChange={(e) => setLoginNome(e.target.value)} placeholder="Ex: Maria Administradora" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Seu Cargo</label>
                  <input type="text" required value={loginCargo} onChange={(e) => setLoginCargo(e.target.value)} placeholder="Ex: Gerente de Qualidade" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">E-mail para Login</label>
                  <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="email@empresa.com" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Crie uma Senha Forte</label>
                  <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength="6" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                </div>
                <button type="submit" className="w-full bg-[#5C3A21] text-[#F4B41A] font-bold py-3.5 px-4 rounded-xl shadow-md hover:bg-[#4a2e1a] transition mt-2">Criar Conta Mestre</button>
              </form>
            ) : welcomeMode === 'choice' ? (
              <div className="space-y-4 animate-fade-in-up">
                <button onClick={() => setWelcomeMode('solicitar')} className="w-full bg-white border-2 border-[#F4B41A] text-[#5C3A21] font-bold py-4 px-4 rounded-xl shadow-sm hover:bg-[#F4B41A]/10 transition flex items-center justify-center gap-2">
                  <FileText size={20}/> Solicitar Relatório (Público)
                </button>
                <button onClick={() => setWelcomeMode('login')} className="w-full bg-[#5C3A21] text-[#F4B41A] font-bold py-4 px-4 rounded-xl shadow-md hover:bg-[#4a2e1a] transition flex items-center justify-center gap-2">
                  <Lock size={20}/> Entrar no Sistema Restrito
                </button>
              </div>
            ) : welcomeMode === 'solicitar' ? (
              <form onSubmit={submitSolicitacao} className="space-y-4 text-left animate-fade-in-up text-sm max-h-[50vh] overflow-y-auto p-2">
                
                {/* NOVO: Solicitante e Urgência */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Quem está solicitando?</label>
                    <input type="text" required value={solicitacaoForm.solicitante} onChange={(e) => setSolicitacaoForm({...solicitacaoForm, solicitante: e.target.value})} placeholder="Seu nome / Setor" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nível de Urgência</label>
                    <select required value={solicitacaoForm.urgencia} onChange={(e) => setSolicitacaoForm({...solicitacaoForm, urgencia: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none font-bold">
                      <option value="Baixa">🟢 Baixa (Pode aguardar)</option>
                      <option value="Média">🟡 Média (Atenção em breve)</option>
                      <option value="Alta">🔴 Alta (Ação imediata)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tipo de Problema</label>
                  <select required value={solicitacaoForm.tipoRelatorio} onChange={(e) => setSolicitacaoForm({...solicitacaoForm, tipoRelatorio: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none">
                    <option value="Problema com Fornecedor">Problema com Fornecedor / Matéria-prima</option>
                    <option value="Relatório de Não Conformidade - Cliente">Reclamação de Cliente / Loja</option>
                    <option value="Ocorrência Interna">Problema Interno</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Produto / Material Afetado</label>
                  <input type="text" required value={solicitacaoForm.produto} onChange={(e) => setSolicitacaoForm({...solicitacaoForm, produto: e.target.value})} placeholder="Qual o produto?" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                </div>

                {solicitacaoForm.tipoRelatorio === 'Relatório de Não Conformidade - Cliente' && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Loja / Cliente Afetado</label>
                    <input type="text" required value={solicitacaoForm.lojaLocal || ''} onChange={(e) => setSolicitacaoForm({...solicitacaoForm, lojaLocal: e.target.value})} placeholder="Ex: Matriz, Loja 02..." className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                  </div>
                )}

                {solicitacaoForm.tipoRelatorio === 'Problema com Fornecedor' && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nome do Fornecedor</label>
                    <input type="text" required value={solicitacaoForm.fornecedor || ''} onChange={(e) => setSolicitacaoForm({...solicitacaoForm, fornecedor: e.target.value})} placeholder="Ex: Aurora, Seara..." className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Lote</label>
                    <input type="text" required value={solicitacaoForm.lote} onChange={(e) => setSolicitacaoForm({...solicitacaoForm, lote: e.target.value})} placeholder="Obrigatório" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                  </div>
                  
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Quantidade</label>
                    <input type="text" required value={solicitacaoForm.quantidade || ''} onChange={(e) => setSolicitacaoForm({...solicitacaoForm, quantidade: e.target.value})} placeholder="Ex: 5 kg, 2 caixas" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                  </div>

                  {(solicitacaoForm.tipoRelatorio === 'Problema com Fornecedor' || solicitacaoForm.tipoRelatorio === 'Relatório de Não Conformidade - Cliente' || solicitacaoForm.tipoRelatorio === 'Ocorrência Interna') && (
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Validade</label>
                      <input type="text" required={solicitacaoForm.tipoRelatorio !== 'Ocorrência Interna'} value={solicitacaoForm.validade || ''} onChange={(e) => setSolicitacaoForm({...solicitacaoForm, validade: e.target.value})} placeholder="Ex: 10/12/2026" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                    </div>
                  )}

                  {solicitacaoForm.tipoRelatorio === 'Problema com Fornecedor' && (
                    <>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Nota Fiscal</label>
                        <input type="text" required value={solicitacaoForm.nf || ''} onChange={(e) => setSolicitacaoForm({...solicitacaoForm, nf: e.target.value})} placeholder="Obrigatório" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Recebimento</label>
                        <input type="text" required value={solicitacaoForm.dataRecebimento || ''} onChange={(e) => setSolicitacaoForm({...solicitacaoForm, dataRecebimento: e.target.value})} placeholder="Ex: 10/05/2026" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                      </div>
                    </>
                  )}

                  {solicitacaoForm.tipoRelatorio === 'Relatório de Não Conformidade - Cliente' && (
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Fabricação</label>
                      <input type="text" required value={solicitacaoForm.dataFabricacao || ''} onChange={(e) => setSolicitacaoForm({...solicitacaoForm, dataFabricacao: e.target.value})} placeholder="Ex: 01/05/2026" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                    </div>
                  )}

                  {solicitacaoForm.tipoRelatorio === 'Ocorrência Interna' && (
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Ocorrência</label>
                      <input type="text" required value={solicitacaoForm.dataOcorrencia || ''} onChange={(e) => setSolicitacaoForm({...solicitacaoForm, dataOcorrencia: e.target.value})} placeholder="Ex: 20/05/2026" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Descreva o problema</label>
                  <textarea required rows="3" value={solicitacaoForm.descricao} onChange={(e) => setSolicitacaoForm({...solicitacaoForm, descricao: e.target.value})} placeholder="Detalhe o que aconteceu..." className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none resize-y"></textarea>
                </div>
                <div className="bg-gray-50 border border-dashed border-gray-300 p-4 rounded-lg text-center cursor-pointer hover:bg-gray-100 transition">
                   <label className="cursor-pointer flex flex-col items-center justify-center">
                      <ImagePlus size={24} className="text-[#5C3A21] mb-2" />
                      <span className="font-bold text-sm text-[#5C3A21]">Anexar Fotos ({solicitacaoForm.imagens?.length || 0})</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={async (e) => {
                         const files = Array.from(e.target.files);
                         if (files.length === 0) return;
                         try {
                           const compressedImages = await Promise.all(files.map(f => compressImage(f, false)));
                           setSolicitacaoForm(prev => ({...prev, imagens: [...prev.imagens, ...compressedImages]}));
                         } catch(err){}
                      }} />
                   </label>
                </div>
                <div className="flex gap-2 pt-2">
                   <button type="button" onClick={() => setWelcomeMode('choice')} className="flex-1 bg-gray-200 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-300 transition">Voltar</button>
                   <button type="submit" className="flex-1 bg-[#F4B41A] text-[#5C3A21] font-bold py-3 rounded-xl hover:bg-[#e0a210] transition shadow-md">Enviar</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4 text-left animate-fade-in-up">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">E-mail corporativo</label>
                  <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Digite seu e-mail" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
                  <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Sua senha de acesso" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#F4B41A] outline-none" />
                </div>
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => setWelcomeMode('choice')} className="px-4 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition"><ChevronLeft size={20}/></button>
                  <button type="submit" className="flex-1 bg-[#5C3A21] text-[#F4B41A] font-bold py-3.5 px-4 rounded-xl shadow-md hover:bg-[#4a2e1a] transition flex items-center justify-center gap-2"><Check size={20}/> Entrar no Sistema</button>
                </div>
              </form>
            )}

            <p className="text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100">Controle de Qualidade • IMAC</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    const filteredRecords = getFilteredRecords();
    const countsPorTipo = { 'Problema com Fornecedor': 0, 'Insumo ou Embalagem': 0, 'Ocorrência Interna': 0, 'Teste de Produto': 0, 'Teste de Equipamento': 0 };
    const fornecedorCounts = {};
    const clienteCounts = {};
    const produtoCounts = {};
    const statusCounts = { 'Pendente': 0, 'Liberado': 0, 'Não Liberado': 0 };
    
    filteredRecords.forEach(r => {
      const tipo = r.tipoRelatorio || 'Problema com Fornecedor';
      if (countsPorTipo[tipo] !== undefined) countsPorTipo[tipo]++;
      if (r.fornecedor) fornecedorCounts[r.fornecedor] = (fornecedorCounts[r.fornecedor] || 0) + 1;
      
      const st = r.status || 'Pendente';
      if (statusCounts[st] !== undefined) statusCounts[st]++;

      if (r.tipoRelatorio === 'Relatório de Não Conformidade - Cliente') {
          if(r.lojasLocais && r.lojasLocais.length > 0) {
              r.lojasLocais.forEach(l => clienteCounts[l] = (clienteCounts[l] || 0) + 1);
          } else if (r.lojaLocal) {
              clienteCounts[r.lojaLocal] = (clienteCounts[r.lojaLocal] || 0) + 1;
          }
      }

      if (r.produto && r.produto !== 'Não especificado') {
         produtoCounts[r.produto] = (produtoCounts[r.produto] || 0) + 1;
      }
    });

    const pieData = Object.entries(countsPorTipo).filter(([_, v]) => v > 0).map(([label, value]) => ({ label, value }));
    const barData = Object.entries(fornecedorCounts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10);
    const tipoBarras = Object.entries(countsPorTipo).map(([nome, valor]) => ({ label: nome, value: valor, color: nome.includes('Fornecedor') ? '#EF4444' : nome.includes('Insumo') ? '#F59E0B' : nome.includes('Interna') ? '#3B82F6' : nome.includes('Produto') ? '#22C55E' : '#8B5CF6' }));

    const pieStatusData = Object.entries(statusCounts).filter(([_, v]) => v > 0).map(([label, value]) => ({ 
      label, value, color: label === 'Liberado' ? '#22C55E' : label === 'Não Liberado' ? '#EF4444' : '#F59E0B' 
    }));
    const clienteBarData = Object.entries(clienteCounts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10);
    const produtoBarData = Object.entries(produtoCounts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);

    const pendingRecords = (registros || []).filter(r => r.status === 'Pendente' || !r.status);

    return (
      <div className="min-h-screen bg-[#f8f9fa] py-8 px-4 font-sans text-gray-800 print:bg-white print:py-0 print:px-0">
        {registroToView && <RelatorioViewModal registro={registroToView} onClose={() => setRegistroToView(null)} />}
        {evaluatingRegistro && <StatusModal registro={evaluatingRegistro} onClose={() => setEvaluatingRegistro(null)} onSave={handleUpdateStatus} avaliadorAtual={userName} canApprove={canApprove} />}
        
        <EditProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
          initialName={userName} 
          initialRole={userRole} 
          onSave={handleUpdateProfile} 
        />

        <GerenciarUsuariosModal
          isOpen={isUsersModalOpen}
          onClose={() => setIsUsersModalOpen(false)}
          usersDirectory={usersDirectory}
          currentUid={appUser?.id}
          onAddUser={handleCreateNewUser}
          onRemoveUser={handleRemoveUser}
          onResetPassword={handleResetPassword}
          onUpdatePermissions={handleUpdatePermissions}
        />

        {isFornecedoresModalOpen && (
           <GerenciarFornecedoresModal 
             isOpen={isFornecedoresModalOpen} 
             onClose={() => setFornecedoresModalOpen(false)} 
             fornecedores={fornecedores}
             onAdd={addFornecedor}
             onEdit={editFornecedorObj}
             onRemove={removeFornecedorObj}
           />
        )}

        {isClientesModalOpen && (
           <GerenciarClientesModal 
             isOpen={isClientesModalOpen} 
             onClose={() => setClientesModalOpen(false)} 
             clientes={clientes}
             onAdd={addCliente}
             onEdit={editClienteObj}
             onRemove={removeClienteObj}
           />
        )}

        {registroToDelete && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-fade-in-up text-center">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Apagar Registro?</h3>
              <p className="text-gray-600 text-sm mb-6">Esta ação removerá o registro permanentemente.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setRegistroToDelete(null)} className="px-5 py-2.5 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold transition text-sm">Cancelar</button>
                <button onClick={() => confirmDeleteRegistro(registroToDelete)} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition text-sm flex items-center gap-1"><Trash2 size={16}/> Sim, Apagar</button>
              </div>
            </div>
          </div>
        )}
        
        {appMessage && <div className="fixed top-4 right-4 z-[100] animate-fade-in-up no-print"><div className="bg-white rounded-xl shadow-lg p-4 border-t-4 border-[#F4B41A] max-w-sm"><p className="text-sm font-medium text-gray-800">{appMessage}</p></div></div>}

        <div className={`max-w-7xl mx-auto ${registroToView ? 'no-print' : ''}`}>
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-[#F4B41A] p-3 rounded-xl shadow-sm hidden md:block"><BarChart2 size={32} className="text-[#5C3A21]" /></div>
              <div>
                <h1 className="text-2xl font-black text-[#5C3A21]">Painel de Qualidade</h1>
                <p className="text-gray-500 font-medium">Olá, <span className="text-[#5C3A21] font-bold">{userName}</span> ({userRole})</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setFormData(getEmptyForm()); setEditingReportId(null); setView('form'); window.scrollTo(0, 0); }} className="bg-[#5C3A21] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-[#4a2e1a] transition flex items-center gap-2"><Plus size={18} /> Novo Relatório</button>
              {isAdmin && (
                <button onClick={() => setIsUsersModalOpen(true)} className="bg-purple-50 text-purple-700 px-4 py-2.5 rounded-lg font-bold hover:bg-purple-100 hover:text-purple-800 transition flex items-center gap-2 text-sm border border-purple-200" title="Gerenciar Usuários"><Users size={16} /><span className="hidden md:inline">Usuários</span></button>
              )}
              <button onClick={() => setFornecedoresModalOpen(true)} className="bg-blue-50 text-blue-700 px-4 py-2.5 rounded-lg font-bold hover:bg-blue-100 hover:text-blue-800 transition flex items-center gap-2 text-sm border border-blue-200" title="Gerenciar Fornecedores"><Truck size={16} /><span className="hidden md:inline">Fornecedores</span></button>
              <button onClick={() => setClientesModalOpen(true)} className="bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-lg font-bold hover:bg-indigo-100 hover:text-indigo-800 transition flex items-center gap-2 text-sm border border-indigo-200" title="Gerenciar Clientes"><ShoppingBag size={16} /><span className="hidden md:inline">Clientes</span></button>
              <button onClick={exportToCSV} className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2 text-sm" title="Exportar para Excel"><Download size={16} /></button>
              <button onClick={() => setIsProfileModalOpen(true)} className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition flex items-center gap-2 text-sm border border-gray-300" title="Editar Perfil"><User size={16} /><span className="hidden md:inline">Perfil</span></button>
              <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-2.5 rounded-lg font-bold hover:bg-red-100 hover:text-red-700 transition flex items-center gap-2 text-sm border border-red-200" title="Sair do Sistema"><LogOut size={16} /></button>
            </div>
          </div>

          <div className="mb-6"><DashboardFilters onFilterChange={setDashboardFilters} fornecedores={fornecedores} /></div>

          {solicitacoes.filter(s => s.status === 'Pendente').length > 0 && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm animate-fade-in-up">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={20} className="text-blue-600" />
                <h2 className="text-lg font-bold text-blue-800">Solicitações Recebidas ({solicitacoes.filter(s => s.status === 'Pendente').length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {solicitacoes.filter(s => s.status === 'Pendente').map(sol => (
                  <div key={sol.id} className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm flex flex-col gap-2 relative overflow-hidden">
  {/* Faixa de Urgência colorida na lateral */}
  {sol.urgencia === 'Alta' && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
  {sol.urgencia === 'Média' && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>}
  {sol.urgencia === 'Baixa' && <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>}

  <div className="flex justify-between items-start pl-2">
    <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-100 text-blue-800">{safeDate(sol.dataCriacao)}</span>
    <span className={`text-[10px] font-bold px-2 py-1 rounded ${sol.urgencia === 'Alta' ? 'bg-red-100 text-red-700' : sol.urgencia === 'Média' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
      {sol.urgencia ? `Urgência: ${sol.urgencia}` : 'Urgência: Média'}
    </span>
  </div>
  
  <div className="pl-2">
    <p className="text-sm font-bold text-gray-800 truncate" title={sol.produto}>{sol.produto}</p>
    <p className="text-xs font-semibold text-indigo-600 mt-0.5">Solicitante: {sol.solicitante || 'Não informado'}</p>
    <p className="text-[11px] text-gray-500 mt-0.5">{sol.tipoRelatorio}</p>
  </div>

  <p className="text-xs text-gray-600 line-clamp-2 pl-2 border-t border-gray-100 pt-1 mt-1">{sol.descricao}</p>
                    <button onClick={() => {
                       const formImages = (sol.imagens || []).map(b64 => ({ isObject: true, id: Date.now() + Math.random(), baseSrc: b64, displaySrc: b64, shapes: [] }));
                       setFormData({ ...getEmptyForm(), ...sol, imagens: formImages });
                       setEditingReportId(null);
                       setView('form');
                       window.scrollTo(0, 0);
                       if(db && isConfigured) updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'solicitacoes', sol.id), { status: 'Atendido' }).catch(()=>{});
                       setSolicitacoes(prev => { const n = prev.map(s => s.id === sol.id ? {...s, status: 'Atendido'} : s); saveToLocalStorage('imac_solicitacoes', n); return n;});
                    }} className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs font-bold transition flex items-center justify-center gap-1"><Plus size={14}/> Criar Relatório</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingRecords.length > 0 && (
            <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl shadow-sm animate-fade-in-up">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={20} className="text-orange-600" />
                <h2 className="text-lg font-bold text-orange-800">Atenção: Relatórios Pendentes de Avaliação ({pendingRecords.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingRecords.map(reg => {
                  const dias = getPendingDays(reg.dataCriacao);
                  return (
                    <div key={reg.id} className="bg-white p-3 rounded-lg border border-orange-200 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2 py-1 rounded">ID: {String(reg.id).substring(0, 6)}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border ${reg.enviado ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                            <Send size={10} /> {reg.enviado ? 'Enviado' : 'Não Enviado'}
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${dias > 3 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {dias === 0 ? 'Criado hoje' : `${dias} dia${dias > 1 ? 's' : ''} parado`}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 truncate mt-1" title={reg.produto}>{reg.produto || 'Produto não informado'}</p>
                      <p className="text-xs text-gray-600 truncate" title={reg.ocorrencia}>{reg.ocorrencia}</p>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => setEvaluatingRegistro(reg)} className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 py-1.5 rounded text-xs font-bold transition flex justify-center items-center gap-1"><CheckCircle size={14}/> Avaliar</button>
                        <button onClick={() => shareViaWhatsApp(reg)} className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1.5 rounded text-xs transition flex justify-center items-center" title="Cobrar por WhatsApp"><MessageCircle size={14}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-[#5C3A21]"><p className="text-xs font-bold text-gray-500 uppercase">Total no Período</p><p className="text-3xl font-black text-[#5C3A21] mt-1">{filteredRecords.length}</p></div>
            <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-[#EF4444]"><p className="text-xs font-bold text-gray-500 uppercase">Fornecedores</p><p className="text-3xl font-black text-[#5C3A21] mt-1">{Object.keys(fornecedorCounts).length}</p></div>
            <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-[#F4B41A]"><p className="text-xs font-bold text-gray-500 uppercase">Tipos</p><p className="text-3xl font-black text-[#5C3A21] mt-1">{pieData.length}</p></div>
            <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-[#22C55E]"><p className="text-xs font-bold text-gray-500 uppercase">Período</p><p className="text-sm font-black text-[#5C3A21] mt-1">{dashboardFilters.periodo.replace('_', ' ').toUpperCase()}</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {pieData.length > 0 && <PieChartComponent data={pieData} title="Distribuição por Tipo" />}
            {tipoBarras.some(t => t.value > 0) && <BarChart data={tipoBarras} title="Ocorrências por Tipo" />}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {pieStatusData.length > 0 && <PieChartComponent data={pieStatusData} title="Status dos Relatórios" />}
            {produtoBarData.length > 0 && <BarChart data={produtoBarData} title="Top 5 Produtos Problemáticos" color="#8B5CF6" />}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {barData.length > 0 && <BarChart data={barData} title="Top 10 Fornecedores" color="#EF4444" />}
            {clienteBarData.length > 0 && <BarChart data={clienteBarData} title="Top 10 Clientes" color="#4F46E5" />}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold text-gray-700">Histórico de Emissões <span className="text-gray-400 font-normal ml-2">({filteredRecords.length} registros)</span></h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500"><tr><th className="px-4 py-3 font-bold">Data</th><th className="px-4 py-3 font-bold">Tipo</th><th className="px-4 py-3 font-bold">Produto</th><th className="px-4 py-3 font-bold">Autor</th><th className="px-4 py-3 font-bold">Ocorrência</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 font-bold text-center">Ações</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.length === 0 ? <tr><td colSpan="7" className="text-center py-8 text-gray-400">Nenhum registro encontrado.</td></tr> : 
                    filteredRecords.map(reg => (
                      <tr key={reg.id || Math.random()} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap text-xs">{safeDate(reg.dataCriacao)}</td>
                        <td className="px-4 py-3"><span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap">{reg.tipoRelatorio === 'Relatório de Não Conformidade - Cliente' ? 'Cliente' : (reg.tipoRelatorio || 'Desconhecido')}</span></td>
                        <td className="px-4 py-3 font-medium text-gray-800 max-w-[150px] truncate" title={reg.produto || ''}>{reg.produto || ''}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate text-xs" title={reg.autorNome || ''}>{typeof reg.autorNome === 'string' ? reg.autorNome.split(' ')[0] : 'Desconhecido'}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={reg.ocorrencia || ''}>{reg.ocorrencia || ''}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap border tracking-wide uppercase ${
                              (!reg.status || reg.status === 'Pendente') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              reg.status === 'Liberado' ? 'bg-green-50 text-green-700 border-green-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {reg.status || 'Pendente'}
                            </span>
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap border tracking-wide uppercase flex items-center gap-1 ${
                              reg.enviado ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                              <Send size={10} /> {reg.enviado ? 'Enviado' : 'Não Enviado'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {appUser?.isManager && (
                               <button onClick={() => handleDarVisto(reg)} className="text-pink-600 hover:text-pink-800 bg-pink-50 hover:bg-pink-100 p-2 rounded-lg transition" title="Dar Visto (Assinar)"><PenTool size={16} /></button>
                            )}
                            <button onClick={() => setEvaluatingRegistro(reg)} className="text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 p-2 rounded-lg transition" title="Avaliar / Marcar Envio"><CheckCircle size={16} /></button>
                            <button onClick={() => shareViaWhatsApp(reg)} className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition" title="Cobrar por WhatsApp"><MessageCircle size={16} /></button>
                            <button onClick={() => { startEditingReport(reg); setView('preview'); }} className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition" title="Visualizar Documento"><Eye size={16} /></button>
                            <button onClick={() => startEditingReport(reg)} className="text-yellow-600 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100 p-2 rounded-lg transition" title="Editar este Relatório"><Edit3 size={16} /></button>
                            <button onClick={() => duplicateReport(reg)} className="text-cyan-600 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 p-2 rounded-lg transition" title="Duplicar Relatório"><Copy size={16} /></button>
                            <button onClick={() => setRegistroToDelete(reg.id)} className="text-gray-400 hover:text-red-600 bg-gray-100 hover:bg-red-50 p-2 rounded-lg transition" title="Apagar"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-center mt-8 text-xs text-gray-400 no-print">Desenvolvido por: Cristiamberg</div>
        </div>
      </div>
    );
}
  
  if (view === 'form') {
    return (
      <div className="min-h-screen bg-[#f8f9fa] py-8 px-4 font-sans text-gray-800 relative">
        {appMessage && <div className="fixed top-4 right-4 z-[100] animate-fade-in-up"><div className="bg-white rounded-xl shadow-lg p-4 border-t-4 border-[#F4B41A] max-w-sm"><p className="text-sm font-medium text-gray-800">{appMessage}</p></div></div>}
        
        {editingImageIndex !== null && (() => {
          const imgObj = formData.imagens && formData.imagens[editingImageIndex];
          if(!imgObj) return null;
          const baseSrc = typeof imgObj === 'string' ? imgObj : imgObj.baseSrc;
          const initialShapes = typeof imgObj === 'string' ? [] : imgObj.shapes;
          
          return (
            <ImageAnnotator 
              baseImageSrc={baseSrc} 
              initialShapes={initialShapes}
              onSave={updateAnnotatedImage} 
              onCancel={() => setEditingImageIndex(null)} 
            />
          );
        })()}

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border-t-[10px] border-[#5C3A21]">
          <div className="bg-white px-8 py-6 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#F4B41A] p-2.5 rounded-lg shadow-sm"><ClipboardList size={28} className="text-[#5C3A21]" /></div>
              <div>
                <h1 className="text-2xl font-black tracking-wide text-[#5C3A21]">
                  {editingReportId ? 'EDIÇÃO DE RNC' : 'SISTEMA DE EMISSÃO DE RNC'}
                </h1>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {editingReportId ? `Editando registro ${String(editingReportId).substring(0,6)}...` : `Operador Atual: ${userName}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {editingReportId && (
                 <button onClick={cancelEditing} className="flex items-center justify-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-bold border border-red-200 transition">Cancelar Edição</button>
              )}
              <button onClick={() => { setView('dashboard'); window.scrollTo(0, 0); }} className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold border border-gray-300 transition"><BarChart2 size={18} /> Painel de Registros</button>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {editingReport && editingReport.status === 'Não Liberado' && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm animate-fade-in-up">
                <div className="flex items-start">
                  <AlertCircle className="text-red-500 mr-3 shrink-0 mt-0.5" size={24} />
                  <div>
                    <h3 className="text-red-800 font-bold text-sm">Relatório não liberado (Com Pendências)</h3>
                    <p className="text-red-700 text-sm mt-1 whitespace-pre-wrap">{editingReport.observacoesStatus}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-[#F4B41A] pb-2 gap-3">
                <h2 className="text-lg font-bold text-[#5C3A21]">Configurações do Relatório</h2>
                <div className="flex items-center gap-2">
                  {formData.logo && <button onClick={removeLogo} className="text-xs font-bold text-red-500 hover:text-red-700 underline px-2 transition">Remover Logo</button>}
                  <label className="cursor-pointer text-[13px] font-bold text-[#5C3A21] bg-[#F4B41A] hover:bg-[#e0a210] flex items-center gap-2 px-4 py-2 rounded-md shadow-sm transition uppercase"><Upload size={16} />{formData.logo ? 'Substituir Logo' : 'Anexar Logo'}<input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" /></label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Origem da Ocorrência</label>
                  <select name="tipoRelatorio" value={formData.tipoRelatorio || ''} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none bg-white font-medium shadow-sm">
                    <option value="Problema com Fornecedor">Problema com Fornecedor</option><option value="Insumo ou Embalagem">Insumo ou Embalagem</option>
                    <option value="Ocorrência Interna">Ocorrência Interna</option>
                    <option value="Relatório de Não Conformidade - Cliente">Relatório de Não Conformidade - Cliente</option>
                    <option value="Teste de Produto">Teste de Produto</option><option value="Teste de Equipamento">Teste de Equipamento</option>
                  </select>
                </div>
                <div><label className="block text-sm font-bold mb-1 text-gray-700">Data de Emissão</label><input type="text" name="dataRelatorio" value={formData.dataRelatorio || ''} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
              </div>

              {isFornecedor && (
                <div><label className="block text-sm font-bold mb-1 text-gray-700 flex items-center gap-2"><Truck size={16} className="text-[#5C3A21]" />Fornecedor</label><FornecedorSelect value={formData.fornecedor || ''} onChange={(f) => setFormData(prev => ({ ...prev, fornecedor: f }))} fornecedores={fornecedores} onAddFornecedor={addFornecedor} /></div>
              )}
            </div>

            {isCliente ? (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold border-b-2 border-[#F4B41A] pb-2 text-[#5C3A21] mt-6">Dados do Produto</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                         <label className="block text-sm font-bold mb-1 text-gray-700 flex items-center gap-2">
                           <Store size={16} className="text-[#5C3A21]" /> Clientes Afetados (Multipla Seleção)
                         </label>
                         <div className="flex flex-wrap items-center gap-2 mb-2 min-h-[32px]">
                           {(!formData.lojasLocais || formData.lojasLocais.length === 0) && <span className="text-sm text-gray-400">Nenhum selecionado...</span>}
                           {(formData.lojasLocais || []).map((loja, idx) => (
                             <div key={idx} className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-1">
                               <span className="font-bold text-indigo-800 text-xs">{loja}</span>
                               <button type="button" onClick={() => setFormData(p => ({ ...p, lojasLocais: p.lojasLocais.filter((_, i) => i !== idx) }))} className="text-indigo-400 hover:text-red-500 ml-1"><X size={14}/></button>
                             </div>
                           ))}
                         </div>
                         <ClienteSelect
                           value={formData.lojasLocais || []}
                           onChange={(novasLojas) => {
                             if (Array.isArray(novasLojas)) {
                                 setFormData(prev => ({ ...prev, lojasLocais: novasLojas }));
                             } else if (typeof novasLojas === 'string' && novasLojas !== '') {
                                 setFormData(prev => ({ ...prev, lojasLocais: [...(prev.lojasLocais || []), novasLojas] }));
                             }
                           }}
                           clientes={clientes}
                           onAddCliente={addCliente}
                         />
                      </div>
                      <div><label className="block text-sm font-bold mb-1 text-gray-700">Supervisor / Responsável</label><input type="text" maxLength={80} name="supervisor" value={formData.supervisor || ''} onChange={handleChange} placeholder="Ex: Rhadassa" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
                      <div><label className="block text-sm font-bold mb-1 text-gray-700">Produto ou Material</label><input type="text" maxLength={80} name="produto" value={formData.produto || ''} onChange={handleChange} placeholder={placeholders.produto} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
                      <div><label className="block text-sm font-bold mb-1 text-gray-700">Data de Fabricação</label><input type="text" maxLength={40} name="dataFabricacao" value={formData.dataFabricacao || ''} onChange={handleChange} placeholder="Ex: 14/08/25" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
                      <div><label className="block text-sm font-bold mb-1 text-gray-700">Lote</label><input type="text" maxLength={40} name="lote" value={formData.lote || ''} onChange={handleChange} placeholder={placeholders.lote} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
                      <div><label className="block text-sm font-bold mb-1 text-gray-700">Data de Validade</label><input type="text" maxLength={40} name="validade" value={formData.validade || ''} onChange={handleChange} placeholder="Ex: 14/10/25" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
                      <div className="md:col-span-2"><label className="block text-sm font-bold mb-1 text-gray-700">Quantidade Não Conforme</label><input type="text" maxLength={40} name="quantidade" value={formData.quantidade || ''} onChange={handleChange} placeholder="Ex: Não informado" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold border-b-2 border-[#F4B41A] pb-2 text-[#5C3A21]">1. Informações e Rastreabilidade</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-3 print:gap-x-12 print:gap-y-2 ml-1">
                      <div><label className="block text-sm font-bold mb-1 text-gray-700">Produto ou Material</label><input type="text" maxLength={80} name="produto" value={formData.produto || ''} onChange={handleChange} placeholder={placeholders.produto} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
                      <div><label className="block text-sm font-bold mb-1 text-gray-700">Resumo do Problema</label><input type="text" maxLength={80} name="ocorrencia" value={formData.ocorrencia || ''} onChange={handleChange} placeholder={placeholders.ocorrencia} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
                      <div><label className="block text-sm font-bold mb-1 text-gray-700">Data da Ocorrência</label><input type="text" maxLength={40} name="dataOcorrencia" value={formData.dataOcorrencia || ''} onChange={handleChange} placeholder="Ex: 13/04/2026" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
                      <div><label className="block text-sm font-bold mb-1 text-gray-700">Lote</label><input type="text" maxLength={40} name="lote" value={formData.lote || ''} onChange={handleChange} placeholder={placeholders.lote} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
                      <div><label className="block text-sm font-bold mb-1 text-gray-700">Quantidade</label><input type="text" maxLength={40} name="quantidade" value={formData.quantidade || ''} onChange={handleChange} placeholder={placeholders.quantidade} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
                      {showValidade && <div><label className="block text-sm font-bold mb-1 text-gray-700">Data de Validade</label><input type="text" maxLength={40} name="validade" value={formData.validade || ''} onChange={handleChange} placeholder="Ex: 21/06/2026" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>}
                      {isFornecedor && <><div><label className="block text-sm font-bold mb-1 text-gray-700">Data de Recebimento</label><input type="text" maxLength={40} name="dataRecebimento" value={formData.dataRecebimento || ''} onChange={handleChange} placeholder="Ex: 22/04/2026" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div><div><label className="block text-sm font-bold mb-1 text-gray-700">Nota Fiscal</label><input type="text" maxLength={40} name="nf" value={formData.nf || ''} onChange={handleChange} placeholder="Ex: 14612" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div></>}
                      {requiresHorario && <div><label className="block text-sm font-bold mb-1 text-gray-700">Horário / Turno</label><input type="text" maxLength={40} name="horarioEmbalamento" value={formData.horarioEmbalamento || ''} onChange={handleChange} placeholder="Ex: 14:30h" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>}
                    </div>
                  </div>
                )}

                <div className="space-y-4 mt-8">
                  <h2 className="text-lg font-bold border-b-2 border-[#F4B41A] pb-2 text-[#5C3A21]">Características do Produto & Parecer</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="block text-xs font-bold mb-1 text-gray-500 uppercase">Sabor</label><input type="text" maxLength={40} name="sabor" value={formData.sabor || ''} onChange={handleChange} placeholder="Ex: Não informado" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm text-sm font-semibold" /></div>
                    <div><label className="block text-xs font-bold mb-1 text-gray-500 uppercase">Odor</label><input type="text" maxLength={40} name="odor" value={formData.odor || ''} onChange={handleChange} placeholder="Ex: Não informado" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm text-sm font-semibold" /></div>
                    <div><label className="block text-xs font-bold mb-1 text-gray-500 uppercase">Cor</label><input type="text" maxLength={40} name="cor" value={formData.cor || ''} onChange={handleChange} placeholder="Ex: Não informado" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm text-sm font-semibold" /></div>
                    <div><label className="block text-xs font-bold mb-1 text-gray-500 uppercase">Temp. °C</label><input type="text" maxLength={40} name="temperatura" value={formData.temperatura || ''} onChange={handleChange} placeholder="Ex: Não informado" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm text-sm font-semibold" /></div>
                  </div>
                  <div className="mt-4">
                     <label className="block text-sm font-bold mb-2 text-gray-700">Status do Parecer Técnico</label>
                     <select name="statusParecer" value={formData.statusParecer || ''} onChange={handleChange} className="w-full md:w-1/2 border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm font-bold text-gray-700">
                        <option value="">Selecione uma opção...</option>
                        <option value="PROCEDENTE">Procedente</option>
                        <option value="NÃO PROCEDENTE">Não Procedente</option>
                        <option value="NÃO APLICADO">Não Aplicado</option>
                     </select>
                  </div>
                </div>

                <div className="space-y-4 mt-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-[#F4B41A] pb-2 gap-3 mt-6">
                    <h2 className="text-lg font-bold text-[#5C3A21]">Descrição, Análises e Considerações</h2>
                    <button type="button" onClick={addTopico} className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded flex items-center gap-1 transition"><Plus size={14} /> ADICIONAR TÓPICO</button>
                  </div>
                  
                  {(Array.isArray(formData.topicos) ? formData.topicos : []).map((topico, index) => (
                    <div key={topico.id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative shadow-sm">
                       <button type="button" onClick={() => removeTopico(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition" title="Remover Tópico"><X size={18} /></button>
                       <div className="mb-2 pr-8">
                         <input type="text" value={topico.titulo} onChange={(e) => handleTopicoChange(index, 'titulo', e.target.value)} className="w-full border-b border-dashed border-gray-400 text-sm font-bold text-[#5C3A21] pb-1 outline-none focus:border-[#F4B41A] bg-transparent uppercase tracking-wider" placeholder="TÍTULO DO TÓPICO (ex: Metodologia)" />
                       </div>
                       <RichTextEditor value={topico.texto || ''} onChange={(val) => handleTopicoChange(index, 'texto', val)} placeholder="Descreva os detalhes aqui..." />
                    </div>
                  ))}
                </div>

                <div className="space-y-4 mt-8">
                  <h2 className="text-lg font-bold border-b-2 border-[#F4B41A] pb-2 text-[#5C3A21]">Fotos e Evidências</h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer bg-gray-50/50">
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                      <div className="bg-white p-3 rounded-full shadow-sm mb-3 border border-gray-200"><ImagePlus size={28} className="text-[#5C3A21]" /></div>
                      <span className="text-[14px] font-bold text-[#5C3A21]">Clique para anexar fotos</span>
                      <span className="text-xs text-gray-500 mt-1 font-medium">Depois você pode cortar a imagem e colocar setas</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                  {Array.isArray(formData.imagens) && formData.imagens.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {formData.imagens.map((img, index) => {
                        const src = typeof img === 'string' ? img : img?.displaySrc;
                        return (
                          <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100 flex flex-col">
                            <img src={src} alt="Preview" className="w-full h-32 object-contain bg-white flex-1" />
                            <div className="absolute top-1 right-1 flex gap-1">
                              <button type="button" onClick={() => setEditingImageIndex(index)} className="bg-blue-600 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-blue-700" title="Anotar ou Cortar Imagem"><PenTool size={16} /></button>
                              <button type="button" onClick={() => removeImage(index)} className="bg-red-600 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-700" title="Remover Foto"><Trash2 size={16} /></button>
                            </div>
                            <div className="absolute bottom-1 left-1 right-1 flex justify-between px-1 opacity-0 group-hover:opacity-100 transition">
                              {index > 0 ? (
                                <button type="button" onClick={() => moveImage(index, -1)} className="bg-gray-800/80 text-white p-1 rounded hover:bg-gray-900 shadow" title="Mover para esquerda"><ChevronLeft size={16}/></button>
                              ) : <div/>}
                              {index < formData.imagens.length - 1 ? (
                                <button type="button" onClick={() => moveImage(index, 1)} className="bg-gray-800/80 text-white p-1 rounded hover:bg-gray-900 shadow" title="Mover para direita"><ChevronRight size={16}/></button>
                              ) : <div/>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-[#F4B41A] pb-2 gap-3">
                <h2 className="text-lg font-bold text-[#5C3A21]">Assinaturas / Responsável</h2>
                <button onClick={addAssinatura} className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded flex items-center gap-1 transition"><Plus size={14} /> ADICIONAR</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Array.isArray(formData.assinaturas) ? formData.assinaturas : []).map((assinatura, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 p-4 rounded-lg relative">
                    <button onClick={() => removeAssinatura(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition"><UserX size={18} /></button>
                    <div className="mb-2 pr-6"><label className="block text-xs font-bold mb-1 text-gray-600">Nome</label><input type="text" value={assinatura?.nome || ''} onChange={(e) => handleAssinaturaChange(index, 'nome', e.target.value)} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-1 focus:ring-[#F4B41A] outline-none" /></div>
                    <div><label className="block text-xs font-bold mb-1 text-gray-600">Cargo</label><textarea rows="2" value={assinatura?.cargo || ''} onChange={(e) => handleAssinaturaChange(index, 'cargo', e.target.value)} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-1 focus:ring-[#F4B41A] outline-none resize-y min-h-[50px]" /></div>
                  </div>
                ))}
              </div>
            </div>

            {!isCliente && (
              <div className="pt-4"><label className="block text-sm font-bold mb-1 text-gray-700">Data e Local</label><input type="text" name="localData" value={formData.localData || ''} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none text-gray-600 shadow-sm" /></div>
            )}
          </div>

          <div className="bg-[#f8f9fa] p-6 border-t border-gray-200 flex justify-between items-center rounded-b-xl no-print">
            {editingReportId ? <span className="font-bold text-[#5C3A21]">Editando {String(editingReportId).substring(0, 8)}...</span> : <span />}
            <button onClick={() => handleSaveReport('save_and_preview')} className="bg-[#5C3A21] hover:bg-[#4a2e1a] text-[#F4B41A] font-black py-4 px-10 rounded-lg shadow-lg transition flex items-center gap-3 text-lg uppercase tracking-wide"><FileText size={24} />VISUALIZAR DOCUMENTO</button>
        </div>
        <div className="text-center mt-6 text-xs text-gray-400 no-print">Desenvolvido por: Cristiamberg</div>
      </div>
    );
  }

  if (view === 'preview') {
    let tituloRelatorio = "RELATÓRIO DE OCORRÊNCIA PRODUTO";
    let tituloSecao1 = "1. INFORMAÇÕES GERAIS E RASTREABILIDADE"; let tituloSecao2 = "2. DESCRIÇÃO DA OCORRÊNCIA"; let tituloSecao3 = "3. CONSIDERAÇÕES FINAIS";
    
    const tipoStr = String(formData.tipoRelatorio || '');
    
    if (tipoStr === 'Relatório de Não Conformidade - Cliente') { tituloRelatorio = "RELATÓRIO DE DESVIO PADRÃO"; tituloSecao1 = "DADOS DA OCORRÊNCIA"; }
    if (tipoStr === 'Insumo ou Embalagem') tituloRelatorio = "RELATÓRIO DE OCORRÊNCIA INSUMO";
    if (tipoStr === 'Ocorrência Interna') tituloRelatorio = "RELATÓRIO INTERNO DE OCORRÊNCIA";
    if (tipoStr.includes('Teste')) { tituloRelatorio = "RELATÓRIO DE TESTES"; tituloSecao1 = "1. DADOS DO ESTUDO"; tituloSecao2 = "2. METODOLOGIA E RESULTADOS"; tituloSecao3 = "3. CONCLUSÃO E RECOMENDAÇÕES"; }

    return (
      <div className="min-h-screen bg-gray-200 p-4 md:p-8 font-sans print:bg-white print:p-0">
        <div className="max-w-4xl mx-auto mb-6 flex flex-wrap justify-between items-center gap-3 no-print">
          <button onClick={() => { setView('form'); window.scrollTo(0, 0); }} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition shadow"><Edit3 size={18} /> Voltar para Edição</button>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => shareViaWhatsApp(formData)} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded font-bold shadow hover:bg-green-600 transition"><MessageCircle size={18} /> WhatsApp</button>
            <button onClick={() => { setFormData(getEmptyForm()); setEditingReportId(null); setView('dashboard'); window.scrollTo(0, 0); }} className="flex items-center gap-2 px-5 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-bold shadow transition"><ClipboardList size={18} /> Painel de Registros</button>
            <button onClick={handlePrintAndSave} className="flex items-center gap-2 px-6 py-2 bg-[#5C3A21] text-[#F4B41A] rounded hover:bg-[#4a2e1a] font-black shadow-md transition"><Printer size={18} /> Imprimir / PDF</button>
          </div>
        </div>

        <div id="relatorio-preview-conteudo" className="max-w-[210mm] min-h-[297mm] print:min-h-0 mx-auto bg-white shadow-2xl print:shadow-none print:w-full print:h-full print:p-0 print-no-padding text-black text-[15px] leading-relaxed relative flex flex-col">
          <div className="h-[12px] w-full bg-[#F4B41A] print-bg-yellow"></div>
          <div className="px-[12mm] py-[10mm] print:px-[8mm] print:py-[10mm] print-no-padding flex-1">
            
            <div className="flex justify-between items-end border-b-2 border-gray-100 pb-4 mb-6 print:mb-4">
              <div>
                {formData.logo ? <img src={formData.logo} alt="Logo IMAC" className="h-[50px] object-contain mb-1" /> : <h1 className="text-[38px] font-black text-[#5C3A21] tracking-tighter leading-none mb-1">IMAC</h1>}
                <p className="font-bold text-black text-[14px]">Controle de Qualidade</p>
              </div>
              <div className="text-right">
                <p className="font-bold uppercase tracking-wide text-[16px] text-[#5C3A21]">{tituloRelatorio}</p>
                <p className="font-bold text-[14px] text-gray-500 mt-1">Emissão: {formData.dataRelatorio}</p>
              </div>
            </div>

            {tipoStr === 'Relatório de Não Conformidade - Cliente' ? (
              <>
                <div className="mb-5 print:mb-3 break-inside-avoid">
                  <div className="border-l-4 border-[#F4B41A] print-border-yellow pl-2 mb-3 print:mb-2 bg-[#F4B41A]/10 print-bg-yellow-light py-1"><p className="font-bold uppercase text-[#5C3A21] text-[16px]">{tituloSecao1}</p></div>
                  <div className="grid grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-3 print:gap-x-12 print:gap-y-2 ml-1">
                    <p className="text-[14px]"><strong>CLIENTE(S):</strong> {(formData.lojasLocais && formData.lojasLocais.length > 0) ? formData.lojasLocais.join(', ') : (formData.lojaLocal || 'Não informado')}</p>
                    <p className="text-[14px]"><strong>SUPERVISOR:</strong> {formData.supervisor}</p>
                    <p className="text-[14px]"><strong>PRODUTO:</strong> {formData.produto}</p>
                    <p className="text-[14px]"><strong>LOTE:</strong> {formData.lote}</p>
                    <p className="text-[14px]"><strong>DATA DE FABRICAÇÃO:</strong> {formData.dataFabricacao}</p>
                    <p className="text-[14px]"><strong>DATA VALIDADE:</strong> {formData.validade}</p>
                    <p className="text-[14px] col-span-2"><strong>QUANTIDADE NÃO CONFORME:</strong> {formData.quantidade}</p>
                  </div>
                </div>

                <div className="mb-5 print:mb-3 w-full overflow-hidden break-inside-avoid">
                  <div className="border-l-4 border-[#F4B41A] print-border-yellow pl-2 mb-3 print:mb-2 bg-[#F4B41A]/10 print-bg-yellow-light py-1"><p className="font-bold uppercase text-[#5C3A21] text-[16px]">{tituloSecao2}</p></div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 ml-1 mb-5">
  <p className="text-[14px] font-semibold">({formData.statusParecer === 'PROCEDENTE' ? 'X' : '  '}) PROCEDENTE</p>
<p className="text-[14px] font-semibold">({formData.statusParecer === 'NÃO PROCEDENTE' ? 'X' : '  '}) NÃO PROCEDENTE</p>
<p className="text-[14px] font-semibold">({formData.statusParecer === 'NÃO APLICADO' ? 'X' : '  '}) NÃO APLICADO</p>
</div>
                  {(Array.isArray(formData.topicos) ? formData.topicos : []).map((topico, index) => {
  if (!topico.texto || topico.texto.trim() === '' || topico.texto === '<br>') return null;
  return (
    <div key={topico.id || index} className="mb-5 w-full overflow-hidden break-inside-avoid">
      <div className="border-l-4 border-[#F4B41A] print-border-yellow pl-2 mb-2 bg-[#F4B41A]/10 print-bg-yellow-light py-1">
  <p className="font-bold uppercase text-[#5C3A21] text-[16px]">{topico.titulo}</p>
</div>
      <div className="text-justify text-black ml-1 rich-text-content text-[14px] leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: topico.texto }} />
    </div>
  );
})}

                  <p className="font-bold text-[14px] ml-1 mb-2">CARACTERÍSTICAS DO PRODUTO:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-4 ml-1 mb-2">
                     <div className="border border-gray-200 p-2 rounded bg-gray-50 text-center"><span className="block text-[11px] font-bold text-gray-500 uppercase">Sabor</span><span className="text-[14px] font-semibold">{formData.sabor || 'Não informado'}</span></div>
                     <div className="border border-gray-200 p-2 rounded bg-gray-50 text-center"><span className="block text-[11px] font-bold text-gray-500 uppercase">Odor</span><span className="text-[14px] font-semibold">{formData.odor || 'Não informado'}</span></div>
                     <div className="border border-gray-200 p-2 rounded bg-gray-50 text-center"><span className="block text-[11px] font-bold text-gray-500 uppercase">Cor</span><span className="text-[14px] font-semibold">{formData.cor || 'Não informado'}</span></div>
                     <div className="border border-gray-200 p-2 rounded bg-gray-50 text-center"><span className="block text-[11px] font-bold text-gray-500 uppercase">Temp. °C</span><span className="text-[14px] font-semibold">{formData.temperatura || 'Não informado'}</span></div>
                  </div>
                </div>

                {Array.isArray(formData.imagens) && formData.imagens.length > 0 && (
                  <div className="mb-6 mt-6 print:mt-4">
                    <p className="font-bold text-[14px] ml-1 mb-2 uppercase">Registro Fotográfico:</p>
                    <div className={`grid gap-4 ${formData.imagens.length === 1 ? 'grid-cols-1' : 'grid-cols-2 print:grid-cols-2'}`}>
                      {formData.imagens.map((img, index) => {
                        const src = typeof img === 'string' ? img : img?.displaySrc;
                        return <img key={index} src={src} alt={`Evidência ${index + 1}`} className="w-full h-auto max-h-[800px] object-contain border border-gray-300 shadow-sm rounded break-inside-avoid bg-white p-1" />;
                      })}
                    </div>
                  </div>
                )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-6 text-[14px] mt-6 mb-4 print:mt-3 print:mb-2 break-inside-avoid print-grid-signatures">
                    {(Array.isArray(formData.assinaturas) ? formData.assinaturas : []).filter(Boolean).map((assinatura, index) => (
                      <div key={index} className={(formData.assinaturas || []).length % 2 !== 0 && index === (formData.assinaturas || []).length - 1 ? "md:col-span-2 print:col-span-2" : ""}>
                        <p className="font-bold uppercase">Responsável: {assinatura?.nome}</p>
                        <p className="leading-snug whitespace-pre-line text-gray-600">{assinatura?.cargo}</p>
                      </div>
                    ))}
                  </div>
              </>
            ) : (
              <>
                <div className="mb-5 print:mb-3 break-inside-avoid">
                  <div className="border-l-4 border-[#F4B41A] print-border-yellow pl-2 mb-3 print:mb-2"><p className="font-bold uppercase text-[#5C3A21] text-[16px]">{tituloSecao1}</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-3 print:gap-x-12 print:gap-y-2 ml-1">
                    <p><strong>Produto / Material:</strong> {formData.produto}</p><p><strong>Resumo do Problema:</strong> {formData.ocorrencia}</p>
                    {formData.dataOcorrencia && <p><strong>Data da ocorrência:</strong> {formData.dataOcorrencia}</p>}
                    {formData.lote && <p><strong>Lote:</strong> {formData.lote}</p>}
                    {formData.quantidade && <p><strong>Quantidade Afetada:</strong> {formData.quantidade}</p>}
                    {formData.fornecedor && isFornecedor && <p><strong>Fornecedor:</strong> {formData.fornecedor}</p>}
                    {formData.validade && showValidade && <p><strong>Data de Validade:</strong> {formData.validade}</p>}
                    {formData.dataRecebimento && isFornecedor && <p><strong>Data de Recebimento:</strong> {formData.dataRecebimento}</p>}
                    {formData.nf && isFornecedor && <p><strong>Nota Fiscal:</strong> {formData.nf}</p>}
                    {formData.horarioEmbalamento && requiresHorario && <p><strong>Horário / Turno:</strong> {formData.horarioEmbalamento}</p>}
                  </div>
                </div>

                {(Array.isArray(formData.topicos) ? formData.topicos : []).map((topico, index) => {
                  if (!topico.texto || topico.texto.trim() === '' || topico.texto === '<br>') return null;
                  return (
                    <div key={topico.id || index} className="mb-5 print:mb-3 w-full overflow-hidden break-inside-avoid">
                      <div className="border-l-4 border-[#F4B41A] print-border-yellow pl-2 mb-2 print:mb-1.5">
                        <p className="font-bold uppercase text-[#5C3A21]">{topico.titulo || `Tópico ${index + 1}`}</p>
                      </div>
                      <div className="text-justify text-black ml-1 rich-text-content break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: topico.texto }} />
                    </div>
                  );
                })}

                {Array.isArray(formData.imagens) && formData.imagens.length > 0 && (
                  <div className="mb-6 mt-6 print:mt-4">
                    <div className="bg-[#F4B41A] text-black text-center py-1.5 mb-3 print-bg-yellow break-inside-avoid"><p className="text-[15px] font-bold">Seguem registros fotográficos</p></div>
                    <div className={`grid gap-4 ${formData.imagens.length === 1 ? 'grid-cols-1' : 'grid-cols-2 print:grid-cols-2'}`}>
                      {formData.imagens.map((img, index) => {
                        const src = typeof img === 'string' ? img : img?.displaySrc;
                        return <img key={index} src={src} alt={`Evidência ${index + 1}`} className="w-full h-auto max-h-[800px] object-contain border border-gray-300 shadow-sm rounded break-inside-avoid bg-white p-1" />;
                      })}
                    </div>
                  </div>
                )}

                <div className="print:pt-4">

                  <div className="mb-8 print:mb-5 ml-1 break-inside-avoid"><p>{formData.localData}</p></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-6 text-[14px] mt-6 mb-4 print:mt-3 print:mb-2 break-inside-avoid print-grid-signatures">
                    {(Array.isArray(formData.assinaturas) ? formData.assinaturas : []).filter(Boolean).map((assinatura, index) => (
                      <div key={index} className={(formData.assinaturas || []).length % 2 !== 0 && index === (formData.assinaturas || []).length - 1 ? "md:col-span-2 print:col-span-2" : ""}>
                        <p className="font-bold">{assinatura?.nome}</p>
                        <p className="leading-snug whitespace-pre-line">{assinatura?.cargo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default class AppWithBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("App Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border-t-8 border-red-500">
            <h1 className="text-2xl font-black text-gray-800 mb-2">Algo deu errado 😔</h1>
            <p className="text-gray-600 mb-6">A tela tentou ficar branca, mas capturamos o erro. Isso ocorreu devido a um dado corrompido no seu navegador.</p>
            <div className="bg-gray-100 p-4 rounded text-left overflow-auto text-xs text-red-600 mb-6 h-32 border border-gray-200">
              {this.state.error?.toString()}
            </div>
            <button 
              onClick={() => { 
                localStorage.removeItem('imac_registros'); 
                window.location.reload(); 
              }} 
              className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-red-700 transition"
            >
              Limpar Erros e Reiniciar
            </button>
          </div>
        </div>
      );
    }
    return <App />;
  }
}
