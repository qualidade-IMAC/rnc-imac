import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

// --- CONFIGURAÇÃO DO BANCO DE DADOS FIREBASE ---
let firebaseConfig;
let isConfigured = false;

if (typeof __firebase_config !== 'undefined') {
  firebaseConfig = JSON.parse(__firebase_config);
  isConfigured = true;
} else {
  // Chaves originais restauradas para conectar todos os computadores
  firebaseConfig = {
    apiKey: "AIzaSyBY4QKYASFglPpLFt4CgUsrXsy1mrf28w4",
    authDomain: "rnc-imac.firebaseapp.com",
    projectId: "rnc-imac",
    storageBucket: "rnc-imac.firebasestorage.app",
    messagingSenderId: "815248770345",
    appId: "1:815248770345:web:5d0aaaadb547cb17cca338"
  };
  
  if (firebaseConfig.apiKey !== "") {
    isConfigured = true;
  }
}

const app = isConfigured ? initializeApp(firebaseConfig) : null;
const auth = isConfigured ? getAuth(app) : null;
const db = isConfigured ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'rnc-imac-app';

// --- ESTILOS GLOBAIS ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .rich-text-content:empty:before {
      content: attr(data-placeholder);
      color: #9ca3af;
      pointer-events: none;
      display: block;
    }
    .rich-text-content b, .rich-text-content strong { font-weight: 900 !important; color: inherit; }
    .rich-text-content i, .rich-text-content em { font-style: italic !important; }
    .rich-text-content u { text-decoration: underline !important; }
    .rich-text-content { 
      white-space: pre-wrap; 
      word-break: break-word !important; 
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
    }
    .rich-text-content div { min-height: 1.5rem; }
    .rich-text-content ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
    .rich-text-content li { margin-bottom: 0.25rem; }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.4s ease-out forwards;
    }

    @media print {
      @page { margin: 10mm 15mm 10mm 15mm !important; size: A4; }
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
      .print-bg-orange { background-color: #ED7D31 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .print-border-yellow { border-left-color: #F4B41A !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    @media screen { .print-only { display: none !important; } }
  `;
  document.head.appendChild(style);
}

// --- ÍCONES SVG ---
const SvgIcon = ({ children, size = 24, className = "", strokeWidth = 2, title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {title && <title>{title}</title>}
    {children}
  </svg>
);
const Printer = (p) => <SvgIcon {...p}><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" /></SvgIcon>;
const Edit3 = (p) => <SvgIcon {...p}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></SvgIcon>;
const ImagePlus = (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v4M21 9h-6M18 6v6M3 16l5-5c.928-.893 2.072-.893 3 0l5 5M14 14l1-1c.928-.893 2.072-.893 3 0l3 3" /></SvgIcon>;
const Trash2 = (p) => <SvgIcon {...p}><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></SvgIcon>;
const FileText = (p) => <SvgIcon {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" /></SvgIcon>;
const ClipboardList = (p) => <SvgIcon {...p}><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1zM12 11h4M12 16h4M8 11h.01M8 16h.01" /></SvgIcon>;
const Upload = (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h4M17 8l-5-5-5 5M12 3v12" /></SvgIcon>;
const Plus = (p) => <SvgIcon {...p}><path d="M12 5v14M5 12h14" /></SvgIcon>;
const Minus = (p) => <SvgIcon {...p}><line x1="5" y1="12" x2="19" y2="12" /></SvgIcon>;
const UserX = (p) => <SvgIcon {...p}><path d="M16 21v-2a4 4 0 00-4-4H5c-1.1 0-2 .9-2 2v2M8 7a4 4 0 100 8 4 4 0 000-8zM18 8l4 4M22 8l-4 4" /></SvgIcon>;
const ArrowUpRight = (p) => <SvgIcon {...p}><path d="M7 17L17 7M7 7h10v10" /></SvgIcon>;
const Circle = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10" /></SvgIcon>;
const Undo = (p) => <SvgIcon {...p}><path d="M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" /></SvgIcon>;
const Check = (p) => <SvgIcon {...p}><path d="M20 6L9 17l-5-5" /></SvgIcon>;
const X = (p) => <SvgIcon {...p}><path d="M18 6L6 18M6 6l12 12" /></SvgIcon>;
const PenTool = (p) => <SvgIcon {...p}><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586M11 11l2 2" /></SvgIcon>;
const Move = (p) => <SvgIcon {...p}><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M9 19l3 3-3 3M19 9l3 3-3 3M2 12h20M12 2v20" /></SvgIcon>;
const TypeIcon = (p) => <SvgIcon {...p}><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" x2="15" y1="20" y2="20" /><line x1="12" x2="12" y1="4" y2="20" /></SvgIcon>;
const BarChart2 = (p) => <SvgIcon {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></SvgIcon>;
const BoldIcon = (p) => <SvgIcon {...p} strokeWidth={3}><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></SvgIcon>;
const ItalicIcon = (p) => <SvgIcon {...p}><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></SvgIcon>;
const UnderlineIcon = (p) => <SvgIcon {...p}><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></SvgIcon>;
const Save = (p) => <SvgIcon {...p}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8" /></SvgIcon>;
const Truck = (p) => <SvgIcon {...p}><path d="M16 3H1v13h15M8 16h7v4H8zM21 16h-2v4H5"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></SvgIcon>;
const Eye = (p) => <SvgIcon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></SvgIcon>;
const Download = (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-5M7 10l5 5 5-5M12 15V3"/></SvgIcon>;
const Filter = (p) => <SvgIcon {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></SvgIcon>;
const RefreshCw = (p) => <SvgIcon {...p}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></SvgIcon>;
const Scissors = (p) => <SvgIcon {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></SvgIcon>;
const AlertCircle = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></SvgIcon>;
const CheckCircle = (p) => <SvgIcon {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></SvgIcon>;

// --- COMPONENTE DE TEXTO RICO (SEM LIMITES DE CARACTERES) ---
const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    let html = editorRef.current.innerHTML;
    if (html === '<br>' || html === '<div><br></div>') html = '';
    onChange(html);
  };

  const execCommand = (command) => {
    document.execCommand(command, false, null);
    editorRef.current.focus();
    handleInput();
  };

  return (
    <div className="w-full relative">
      <div className="w-full border border-gray-300 rounded focus-within:ring-2 focus-within:ring-[#F4B41A] shadow-sm bg-white overflow-hidden flex flex-col">
        <div className="flex bg-gray-50 border-b border-gray-200 p-1.5 justify-between items-center">
          <div className="flex gap-1">
            <button type="button" onClick={(e) => { e.preventDefault(); execCommand('bold'); }} className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition" title="Negrito (Ctrl+B)"><BoldIcon size={18} /></button>
            <button type="button" onClick={(e) => { e.preventDefault(); execCommand('italic'); }} className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition" title="Itálico (Ctrl+I)"><ItalicIcon size={18} /></button>
            <button type="button" onClick={(e) => { e.preventDefault(); execCommand('underline'); }} className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition" title="Sublinhado (Ctrl+U)"><UnderlineIcon size={18} /></button>
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

// --- COMPONENTE DE EDIÇÃO DE IMAGEM (COM FERRAMENTA CROP) ---
const ImageAnnotator = ({ imageSrc, onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('arrow'); 
  const [color, setColor] = useState('#FF0000');
  const [textSize, setTextSize] = useState(28); 
  const [selectedShapeIndex, setSelectedShapeIndex] = useState(null);
  const [textInput, setTextInput] = useState(null);
  const [forceRender, setForceRender] = useState(0); 
  const [cropRect, setCropRect] = useState(null);
  
  const shapesRef = useRef([]);
  const imageRef = useRef(null);
  const isDrawing = useRef(false);
  const draggedShapeIndex = useRef(null);
  
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      canvasRef.current.width = img.width;
      canvasRef.current.height = img.height;
      redraw(null);
    };
  }, [imageSrc]);

  const getShapeCenter = (shape) => {
    if (shape.type === 'circle') return { x: shape.x1, y: shape.y1 };
    if (shape.type === 'arrow') return { x: (shape.x1 + shape.x2)/2, y: (shape.y1 + shape.y2)/2 };
    if (shape.type === 'text') {
      const w = shape.width || (shape.text.length * (shape.size * 0.6));
      return { x: shape.x + w/2, y: shape.y };
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
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  };

  const drawSelectionBox = (ctx, shape) => {
    let minX, minY, maxX, maxY;
    const pad = 15;
    
    if (shape.type === 'circle') {
      const r = Math.sqrt(Math.pow(shape.x2 - shape.x1, 2) + Math.pow(shape.y2 - shape.y1, 2));
      minX = shape.x1 - r; maxX = shape.x1 + r; minY = shape.y1 - r; maxY = shape.y1 + r;
    } else if (shape.type === 'arrow') {
      minX = Math.min(shape.x1, shape.x2); maxX = Math.max(shape.x1, shape.x2);
      minY = Math.min(shape.y1, shape.y2); maxY = Math.max(shape.y1, shape.y2);
    } else if (shape.type === 'text') {
      const w = shape.width || (shape.text.length * (shape.size * 0.6));
      minX = shape.x; maxX = shape.x + w; minY = shape.y - (shape.size / 2); maxY = shape.y + (shape.size / 2);
    }
    
    ctx.beginPath();
    ctx.setLineDash([8, 8]); ctx.strokeStyle = '#00BFFF'; ctx.lineWidth = 3;
    ctx.rect(minX - pad, minY - pad, (maxX - minX) + pad * 2, (maxY - minY) + pad * 2);
    ctx.stroke(); ctx.setLineDash([]); 
  };

  const drawCropOverlay = (ctx, start, current) => {
    const minX = Math.min(start.x, current.x);
    const minY = Math.min(start.y, current.y);
    const w = Math.abs(current.x - start.x);
    const h = Math.abs(current.y - start.y);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvasRef.current.width, minY);
    ctx.fillRect(0, minY, minX, h);
    ctx.fillRect(minX + w, minY, canvasRef.current.width - (minX + w), h);
    ctx.fillRect(0, minY + h, canvasRef.current.width, canvasRef.current.height - (minY + h));

    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(minX, minY, w, h);
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
      drawCropOverlay(ctx, startPos.current, currentPos.current);
    } else if (cropRect) {
      drawCropOverlay(ctx, {x: cropRect.x, y: cropRect.y}, {x: cropRect.x + cropRect.w, y: cropRect.y + cropRect.h});
    }
  };

  const getPointerPos = (e) => {
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
      const r = Math.sqrt(Math.pow(shape.x2 - shape.x1, 2) + Math.pow(shape.y2 - shape.y1, 2));
      return Math.sqrt(Math.pow(rpx - shape.x1, 2) + Math.pow(rpy - shape.y1, 2)) <= r + pad;
    } else if (shape.type === 'arrow') {
      const minX = Math.min(shape.x1, shape.x2) - pad, maxX = Math.max(shape.x1, shape.x2) + pad;
      const minY = Math.min(shape.y1, shape.y2) - pad, maxY = Math.max(shape.y1, shape.y2) + pad;
      if (rpx >= minX && rpx <= maxX && rpy >= minY && rpy <= maxY) {
        const l2 = Math.pow(shape.x2 - shape.x1, 2) + Math.pow(shape.y2 - shape.y1, 2);
        if (l2 === 0) return false;
        let t = Math.max(0, Math.min(1, ((rpx - shape.x1) * (shape.x2 - shape.x1) + (rpy - shape.y1) * (shape.y2 - shape.y1)) / l2));
        const projX = shape.x1 + t * (shape.x2 - shape.x1), projY = shape.y1 + t * (shape.y2 - shape.y1);
        return Math.sqrt(Math.pow(rpx - projX, 2) + Math.pow(rpy - projY, 2)) <= pad;
      }
    } else if (shape.type === 'text') {
      const w = shape.width || (shape.text.length * (shape.size * 0.6));
      return rpx >= shape.x - pad && rpx <= shape.x + w + pad && rpy >= shape.y - (shape.size / 2) - pad && rpy <= shape.y + (shape.size / 2) + pad;
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
      const w = Math.abs(currentPos.current.x - startPos.current.x);
      const h = Math.abs(currentPos.current.y - startPos.current.y);
      if (w > 20 && h > 20) {
        setCropRect({
          x: Math.min(startPos.current.x, currentPos.current.x),
          y: Math.min(startPos.current.y, currentPos.current.y),
          w, h
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
          type: tool, x1: startPos.current.x, y1: startPos.current.y, x2: currentPos.current.x, y2: currentPos.current.y, color: color, rotation: 0
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
    const val = document.getElementById('floating-text-input').value;
    if (val && val.trim() !== '') {
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
    if (!cropRect) return;
    const canvas = document.createElement('canvas');
    canvas.width = cropRect.w;
    canvas.height = cropRect.h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageRef.current, cropRect.x, cropRect.y, cropRect.w, cropRect.h, 0, 0, cropRect.w, cropRect.h);

    const newImageSrc = canvas.toDataURL('image/jpeg', 0.95);
    const img = new Image();
    img.src = newImageSrc;
    img.onload = () => {
      imageRef.current = img;
      canvasRef.current.width = img.width;
      canvasRef.current.height = img.height;
      // Atualiza a posição dos desenhos já feitos
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
    setTimeout(() => { onSave(canvasRef.current.toDataURL('image/jpeg', 0.95)); }, 50);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-gray-900 p-4 rounded-xl shadow-2xl flex flex-col h-full max-h-[90vh] relative">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-800 p-3 rounded-lg">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-gray-700 p-1 rounded-lg">
              <button onClick={() => {setTool('move'); setSelectedShapeIndex(null); setTextInput(null); setCropRect(null); redraw(null);}} className={`p-2 rounded flex items-center gap-1 ${tool === 'move' ? 'bg-[#F4B41A] text-[#5C3A21]' : 'text-white hover:bg-gray-600'}`} title="Mover Seleção"><Move size={20} strokeWidth={3} /></button>
              <div className="w-px bg-gray-500 mx-1"></div>
              <button onClick={() => {setTool('crop'); setSelectedShapeIndex(null); setTextInput(null); setCropRect(null); redraw(null);}} className={`p-2 rounded ${tool === 'crop' ? 'bg-[#F4B41A] text-[#5C3A21]' : 'text-white hover:bg-gray-600'}`} title="Cortar Imagem"><Scissors size={20} strokeWidth={3} /></button>
              <div className="w-px bg-gray-500 mx-1"></div>
              <button onClick={() => {setTool('arrow'); setSelectedShapeIndex(null); setTextInput(null); setCropRect(null); redraw(null);}} className={`p-2 rounded ${tool === 'arrow' ? 'bg-[#F4B41A] text-[#5C3A21]' : 'text-white hover:bg-gray-600'}`} title="Desenhar Seta"><ArrowUpRight size={20} strokeWidth={3} /></button>
              <button onClick={() => {setTool('circle'); setSelectedShapeIndex(null); setTextInput(null); setCropRect(null); redraw(null);}} className={`p-2 rounded ${tool === 'circle' ? 'bg-[#F4B41A] text-[#5C3A21]' : 'text-white hover:bg-gray-600'}`} title="Desenhar Círculo"><Circle size={20} strokeWidth={3} /></button>
              <button onClick={() => {setTool('text'); setSelectedShapeIndex(null); setCropRect(null); redraw(null);}} className={`p-2 rounded ${tool === 'text' ? 'bg-[#F4B41A] text-[#5C3A21]' : 'text-white hover:bg-gray-600'}`} title="Escrever Texto"><TypeIcon size={20} strokeWidth={3} /></button>
            </div>

            {cropRect && (
              <button onClick={applyCrop} className="ml-2 px-3 py-1.5 bg-green-500 text-white font-bold rounded hover:bg-green-600 transition flex items-center gap-1 animate-pulse">
                <Check size={16}/> Aplicar Corte
              </button>
            )}

            {tool === 'text' && (
              <div className="flex items-center gap-2 bg-gray-700 px-2 py-1.5 rounded-lg border border-gray-600">
                <button onClick={() => setTextSize(s => Math.max(12, s - 4))} className="text-white hover:text-[#F4B41A] transition p-1"><Minus size={16} /></button>
                <span className="text-white text-sm font-bold w-6 text-center">{textSize}</span>
                <button onClick={() => setTextSize(s => Math.min(72, s + 4))} className="text-white hover:text-[#F4B41A] transition p-1"><Plus size={16} /></button>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setColor('#FF0000')} className={`w-8 h-8 rounded-full bg-red-500 border-2 ${color === '#FF0000' ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-70'}`} title="Vermelho" />
              <button onClick={() => setColor('#F4B41A')} className={`w-8 h-8 rounded-full bg-[#F4B41A] border-2 ${color === '#F4B41A' ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-70'}`} title="Amarelo" />
              <button onClick={() => setColor('#FFFFFF')} className={`w-8 h-8 rounded-full bg-white border-2 ${color === '#FFFFFF' ? 'border-gray-400 scale-110 shadow-md' : 'border-transparent opacity-70'}`} title="Branco" />
            </div>

            <div className="flex gap-2 ml-2 items-center">
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
            <button onClick={handleSave} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 font-bold transition"><Check size={18} /> <span className="hidden sm:inline">Salvar Edição</span></button>
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

// --- COMPONENTE DE SELEÇÃO DE FORNECEDOR ---
const FornecedorSelect = ({ value, onChange, fornecedores, onAddFornecedor }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [novoFornecedor, setNovoFornecedor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fornecedoresFiltrados = fornecedores.filter(f => f.toLowerCase().includes(searchTerm.toLowerCase()));

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

// --- COMPONENTE DO GRÁFICO DE BARRAS ---
const BarChart = ({ data, title, color = '#F4B41A' }) => {
  if (!data || data.length === 0) return null;
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-sm font-bold text-gray-700 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-600 truncate mr-2" title={item.label}>{item.label}</span>
                <span className="font-bold text-gray-800">{item.value}</span>
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

// --- COMPONENTE DO GRÁFICO DE PIZZA ---
const PieChartComponent = ({ data, title }) => {
  if (!data || data.length === 0) return null;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;
  
  const colors = ['#F4B41A', '#ED7D31', '#5C3A21', '#22C55E', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];
  let currentAngle = 0;
  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
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

// --- MODAL DE AVALIAÇÃO DE STATUS ---
const StatusModal = ({ registro, onClose, onSave }) => {
  const [status, setStatus] = useState(registro.status || 'Pendente');
  const [obs, setObs] = useState(registro.observacoesStatus || '');

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm no-print">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border-t-4 border-purple-500 animate-fade-in-up">
        <h3 className="text-xl font-black text-gray-900 mb-1">Avaliar RNC</h3>
        <p className="text-gray-500 text-sm mb-6 font-medium">Controle de qualidade e liberação do relatório.</p>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Situação do Relatório</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-bold text-gray-700 bg-gray-50 shadow-sm">
              <option value="Pendente">⏳ Aguardando / Pendente</option>
              <option value="Liberado">✅ Liberado (Aprovado)</option>
              <option value="Não Liberado">❌ Não Liberado (Com Pendências)</option>
            </select>
          </div>
          
          {status === 'Não Liberado' && (
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
          <button onClick={() => onSave(registro.id, status, status === 'Não Liberado' ? obs : '')} className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold transition text-sm flex items-center gap-2 shadow-md"><Check size={18}/> Salvar Avaliação</button>
        </div>
      </div>
    </div>
  );
};

// --- MODAL DE VISUALIZAÇÃO DO RELATÓRIO ---
const RelatorioViewModal = ({ registro, onClose }) => {
  if (!registro) return null;

  const getTituloRelatorio = () => {
    if (registro.tipoRelatorio === 'Insumo ou Embalagem') return "RELATÓRIO DE OCORRÊNCIA INSUMO";
    if (registro.tipoRelatorio === 'Ocorrência Interna') return "RELATÓRIO INTERNO DE OCORRÊNCIA";
    if (registro.tipoRelatorio.includes('Teste')) return "RELATÓRIO DE TESTES";
    return "RELATÓRIO DE OCORRÊNCIA PRODUTO";
  };
  const getTituloSecao1 = () => registro.tipoRelatorio.includes('Teste') ? "1. DADOS DO ESTUDO" : "1. INFORMAÇÕES GERAIS E RASTREABILIDADE";
  const getTituloSecao2 = () => registro.tipoRelatorio.includes('Teste') ? "2. METODOLOGIA E RESULTADOS" : "2. DESCRIÇÃO DA OCORRÊNCIA";
  const getTituloSecao3 = () => registro.tipoRelatorio.includes('Teste') ? "3. CONCLUSÃO E RECOMENDAÇÕES" : "3. CONSIDERAÇÕES FINAIS";

  const dataFormatada = new Date(registro.dataCriacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const assinaturasRender = registro.assinaturas || [
    { nome: 'Ellen Costa', cargo: 'Supervisora de Qualidade\nControle de Qualidade\nIMAC Congelados' },
    { nome: 'Thalita Maria Lima Lelis', cargo: 'Gerente Industrial\nResponsável Técnica\nIMAC Congelados' },
    { nome: 'Nathália Viana de Carvalho', cargo: 'Nutricionista - CRN 13435\nControle de Qualidade\nIMAC Congelados' },
    { nome: 'Cristiamberg Coimbra', cargo: 'Estagiário de Qualidade\nControle de Qualidade\nIMAC Congelados' }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-start justify-center p-4 pt-10 backdrop-blur-sm overflow-y-auto modal-overlay-print">
      <div className="max-w-[210mm] w-full bg-white shadow-2xl print:shadow-none mb-10 print:mb-0 animate-fade-in-up relative">
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-4 flex justify-between items-center z-10 rounded-t-lg no-print">
          <div><h2 className="text-lg font-black text-[#5C3A21]">Visualização do Relatório</h2><p className="text-xs text-gray-500">Emitido em {dataFormatada}</p></div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-1 px-5 py-2 bg-[#5C3A21] text-[#F4B41A] rounded-lg font-bold hover:bg-[#4a2e1a] transition text-sm"><Printer size={16} /> Imprimir</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition"><X size={20} /></button>
          </div>
        </div>

        <div className="text-black text-[15px] leading-relaxed">
          <div className="h-[12px] w-full bg-[#F4B41A] print-bg-yellow"></div>
          <div className="px-[20mm] py-[10mm] print:px-[15mm] print:py-[10mm]">
            
            {/* --- PÁGINA 1: CABEÇALHO, DESCRIÇÃO E IMAGENS --- */}
            <div className="flex justify-between items-end border-b-2 border-gray-100 pb-4 mb-6 print:mb-4">
              <div>
                {registro.logo ? <img src={registro.logo} alt="Logo IMAC" className="h-[50px] object-contain mb-1" /> : <h1 className="text-[38px] font-black text-[#5C3A21] tracking-tighter leading-none mb-1">IMAC</h1>}
                <p className="font-bold text-black text-[14px]">Controle de Qualidade</p>
              </div>
              <div className="text-right">
                <p className="font-bold uppercase tracking-wide text-[16px] text-[#5C3A21]">{getTituloRelatorio()}</p>
                <p className="font-bold text-[14px] text-gray-500 mt-1">Emissão: {dataFormatada}</p>
              </div>
            </div>

            <div className="mb-5 print:mb-3 break-inside-avoid">
              <div className="border-l-4 border-[#F4B41A] print-border-yellow pl-2 mb-3 print:mb-2"><p className="font-bold uppercase text-[#5C3A21] text-[16px]">{getTituloSecao1()}</p></div>
              <div className="grid grid-cols-2 print:grid-cols-2 gap-2 print:gap-1.5 ml-1">
                <p className="text-[14px]"><strong>Produto / Material:</strong> {registro.produto || 'Não especificado'}</p>
                <p className="text-[14px]"><strong>Resumo do Problema:</strong> {registro.ocorrencia || 'Não informado'}</p>
                {registro.dataOcorrencia && <p className="text-[14px]"><strong>Data da Ocorrência:</strong> {registro.dataOcorrencia}</p>}
                {registro.lote && <p className="text-[14px]"><strong>Lote:</strong> {registro.lote}</p>}
                {registro.quantidade && <p className="text-[14px]"><strong>Quantidade Afetada:</strong> {registro.quantidade}</p>}
                {registro.fornecedor && <p className="text-[14px]"><strong>Fornecedor:</strong> {registro.fornecedor}</p>}
                {registro.validade && <p className="text-[14px]"><strong>Data de Validade:</strong> {registro.validade}</p>}
                {registro.dataRecebimento && <p className="text-[14px]"><strong>Data de Recebimento:</strong> {registro.dataRecebimento}</p>}
                {registro.nf && <p className="text-[14px]"><strong>Nota Fiscal:</strong> {registro.nf}</p>}
                {registro.horarioEmbalamento && <p className="text-[14px]"><strong>Horário / Turno:</strong> {registro.horarioEmbalamento}</p>}
              </div>
            </div>

            {registro.descricao && (
              <div className="mb-5 print:mb-3 w-full overflow-hidden">
                <div className="border-l-4 border-[#F4B41A] print-border-yellow pl-2 mb-2 print:mb-1.5"><p className="font-bold uppercase text-[#5C3A21] text-[16px]">{getTituloSecao2()}</p></div>
                <div className="text-justify text-black ml-1 rich-text-content text-[14px] leading-relaxed break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: registro.descricao }} />
              </div>
            )}

            {registro.imagens && registro.imagens.length > 0 && (
              <div className="mb-6 mt-6 print:mt-4">
                <div className="bg-[#ED7D31] text-white text-center py-1.5 mb-3 print-bg-orange break-inside-avoid"><p className="text-[15px] font-bold">Seguem registros fotográficos</p></div>
                <div className="grid grid-cols-2 print:grid-cols-2 gap-4">
                  {registro.imagens.map((img, index) => <img key={index} src={img} alt={`Evidência ${index + 1}`} className="w-full h-56 print:h-64 object-cover border border-gray-300 shadow-sm rounded break-inside-avoid" />)}
                </div>
              </div>
            )}

            {/* --- CONTINUAÇÃO DO RELATÓRIO (FLUXO NATURAL) --- */}
            <div className="print:pt-4">
              {registro.consideracoes && (
                <div className="mb-6 mt-6 print:mt-0 w-full overflow-hidden">
                  <div className="border-l-4 border-[#F4B41A] print-border-yellow pl-2 mb-2 print:mb-1.5 break-after-avoid"><p className="font-bold uppercase text-[#5C3A21] text-[16px]">{getTituloSecao3()}</p></div>
                  <div className="text-justify text-black ml-1 rich-text-content text-[14px] leading-relaxed break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: registro.consideracoes }} />
                </div>
              )}

              <div className="mb-8 print:mb-5 ml-1 break-inside-avoid"><p className="text-[14px]">{registro.localData || `Aquiraz, ${dataFormatada}.`}</p></div>

              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-6 text-[14px] mt-6 mb-4 print:mt-3 print:mb-2 break-inside-avoid print-grid-signatures">
                {assinaturasRender.map((assinatura, index) => (
                  <div key={index} className={assinaturasRender.length % 2 !== 0 && index === assinaturasRender.length - 1 ? "md:col-span-2 print:col-span-2" : ""}>
                    <p className="font-bold">{assinatura.nome}</p>
                    <p className="leading-snug whitespace-pre-line">{assinatura.cargo}</p>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>

        <div className="border-t-2 border-gray-200 p-4 flex justify-between items-center bg-gray-50 no-print rounded-b-lg">
          <span className="text-xs text-gray-400">ID: {registro.id}</span>
          <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition text-sm">Fechar</button>
        </div>
      </div>
    </div>
  );
};

// --- FILTROS DO DASHBOARD ---
const DashboardFilters = ({ onFilterChange, fornecedores }) => {
  const [filters, setFilters] = useState({ periodo: 'mes_atual', fornecedor: '', tipo: '' });
  const handleChange = (key, value) => { const newFilters = { ...filters, [key]: value }; setFilters(newFilters); onFilterChange(newFilters); };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-3 items-center">
      <Filter size={18} className="text-gray-500" />
      <select value={filters.periodo} onChange={(e) => handleChange('periodo', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#F4B41A] outline-none">
        <option value="mes_atual">Mês Atual</option><option value="mes_anterior">Mês Anterior</option>
        <option value="trimestre">Último Trimestre</option><option value="ano">Este Ano</option><option value="todos">Todo Período</option>
      </select>
      <select value={filters.fornecedor} onChange={(e) => handleChange('fornecedor', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#F4B41A] outline-none">
        <option value="">Todos Fornecedores</option>{fornecedores.map((f, i) => <option key={i} value={f}>{f}</option>)}
      </select>
      <select value={filters.tipo} onChange={(e) => handleChange('tipo', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#F4B41A] outline-none">
        <option value="">Todos os Tipos</option><option value="Problema com Fornecedor">Problema com Fornecedor</option>
        <option value="Insumo ou Embalagem">Insumo ou Embalagem</option><option value="Ocorrência Interna">Ocorrência Interna</option>
        <option value="Teste de Produto">Teste de Produto</option><option value="Teste de Equipamento">Teste de Equipamento</option>
      </select>
    </div>
  );
};

// --- SISTEMA PRINCIPAL ---
export default function App() {
  const [view, setView] = useState('form'); 
  const [editingImageIndex, setEditingImageIndex] = useState(null); 
  const [registros, setRegistros] = useState([]); 
  const [registroToDelete, setRegistroToDelete] = useState(null); 
  const [registroToView, setRegistroToView] = useState(null);
  const [evaluatingRegistro, setEvaluatingRegistro] = useState(null);
  
  // NOVO ESTADO: Guarda o ID do relatório que está sendo editado
  const [editingReportId, setEditingReportId] = useState(null);

  const [dbError, setDbError] = useState(false); 
  const [fornecedores, setFornecedores] = useState([]);
  
  const [appMessage, setAppMessage] = useState(null);
  const [user, setUser] = useState(null);
  const [dashboardFilters, setDashboardFilters] = useState({ periodo: 'mes_atual', fornecedor: '', tipo: '' });

  const defaultAssinaturas = [
    { nome: 'Ellen Costa', cargo: 'Supervisora de Qualidade\nControle de Qualidade\nIMAC Congelados' },
    { nome: 'Thalita Maria Lima Lelis', cargo: 'Gerente Industrial\nResponsável Técnica\nIMAC Congelados' },
    { nome: 'Nathália Viana de Carvalho', cargo: 'Nutricionista - CRN 13435\nControle de Qualidade\nIMAC Congelados' },
    { nome: 'Cristiamberg Coimbra', cargo: 'Estagiário de Qualidade\nControle de Qualidade\nIMAC Congelados' }
  ];

  const getEmptyForm = () => ({
    logo: localStorage.getItem('imac_logo_oficial') || null,
    tipoRelatorio: 'Problema com Fornecedor',
    dataRelatorio: new Date().toLocaleDateString('pt-BR'),
    dataOcorrencia: '', produto: '', ocorrencia: '', lote: '', quantidade: '', validade: '',
    dataRecebimento: '', nf: '', horarioEmbalamento: '', descricao: '', consideracoes: '',
    localData: `Aquiraz, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`,
    imagens: [], fornecedor: '', assinaturas: [...defaultAssinaturas]
  });

  const [formData, setFormData] = useState(getEmptyForm());

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else { await signInAnonymously(auth); }
      } catch (error) { console.error("Erro de Autenticação.", error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedFornecedores = localStorage.getItem('imac_fornecedores');
    if (!savedFornecedores) {
      const defaultFornecedores = ['Aurora Alimentos', 'Brasil Foods', 'Seara', 'JBS', 'Marfrig'];
      localStorage.setItem('imac_fornecedores', JSON.stringify(defaultFornecedores));
      setFornecedores(defaultFornecedores);
    }
  }, []);

  useEffect(() => {
    const savedLocal = localStorage.getItem('imac_fornecedores');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) setFornecedores(parsed);
      } catch (e) { console.error('Erro local:', e); }
    }
    
    if (!user || !db || !isConfigured) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'fornecedores'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data().nome);
      if (data.length > 0) { setFornecedores(data); localStorage.setItem('imac_fornecedores', JSON.stringify(data)); }
    }, (error) => console.error('Erro na nuvem:', error));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const savedLocal = localStorage.getItem('imac_registros');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
          setRegistros(parsed);
        }
      } catch (e) { console.error('Erro local:', e); }
    }
    
    if (!user || !db || !isConfigured) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registros'), (snapshot) => {
      const cloudData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegistros(prev => {
        const existingIds = new Set(cloudData.map(r => r.id));
        const localOnly = prev.filter(r => !existingIds.has(r.id) && r.id.toString().length < 15);
        const merged = [...cloudData, ...localOnly];
        merged.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
        localStorage.setItem('imac_registros', JSON.stringify(merged));
        return merged;
      });
      setDbError(false);
    }, (error) => {
      if (error.code === 'permission-denied') setDbError(true);
    });
    return () => unsubscribe();
  }, [user]);

  const addFornecedor = async (nome) => {
    const nomeLimpo = nome.trim();
    if (!fornecedores.includes(nomeLimpo)) {
      setFornecedores(prev => { const newList = [...prev, nomeLimpo]; localStorage.setItem('imac_fornecedores', JSON.stringify(newList)); return newList; });
    }
    if (user && db && isConfigured) {
      try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'fornecedores'), { nome: nomeLimpo, dataCriacao: new Date().toISOString() }); } catch (error) {}
    }
  };

  const handleChange = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };

  const handleImageUpload = (e, isLogo = false) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (isLogo) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, logo: event.target.result }));
        localStorage.setItem('imac_logo_oficial', event.target.result);
      };
      reader.readAsDataURL(files[0]);
      return;
    }

    Promise.all(files.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = reject; reader.readAsDataURL(file);
    }))).then((base64Images) => {
      setFormData((prev) => ({ ...prev, imagens: [...prev.imagens, ...base64Images] }));
    });
  };

  const removeImage = (indexToRemove) => setFormData((prev) => ({ ...prev, imagens: prev.imagens.filter((_, index) => index !== indexToRemove) }));
  const updateAnnotatedImage = (newImageBase64) => {
    setFormData(prev => { const novasImagens = [...prev.imagens]; novasImagens[editingImageIndex] = newImageBase64; return { ...prev, imagens: novasImagens }; });
    setEditingImageIndex(null); 
  };
  const removeLogo = () => { setFormData(prev => ({ ...prev, logo: null })); localStorage.removeItem('imac_logo_oficial'); };
  
  const handleAssinaturaChange = (index, field, value) => {
    const novasAssinaturas = [...formData.assinaturas]; novasAssinaturas[index][field] = value;
    setFormData(prev => ({ ...prev, assinaturas: novasAssinaturas }));
  };
  const addAssinatura = () => setFormData(prev => ({ ...prev, assinaturas: [...prev.assinaturas, { nome: '', cargo: '' }] }));
  const removeAssinatura = (indexToRemove) => setFormData(prev => ({ ...prev, assinaturas: prev.assinaturas.filter((_, index) => index !== indexToRemove) }));

  // --- FUNÇÃO PARA EDITAR UM RELATÓRIO DO HISTÓRICO ---
  const startEditingReport = (registro) => {
    setFormData({
      logo: registro.logo || localStorage.getItem('imac_logo_oficial') || null,
      tipoRelatorio: registro.tipoRelatorio || 'Problema com Fornecedor',
      dataRelatorio: registro.dataRelatorio || new Date(registro.dataCriacao).toLocaleDateString('pt-BR'),
      dataOcorrencia: registro.dataOcorrencia || '',
      produto: registro.produto || '',
      ocorrencia: registro.ocorrencia || '',
      lote: registro.lote || '',
      quantidade: registro.quantidade || '',
      validade: registro.validade || '',
      dataRecebimento: registro.dataRecebimento || '',
      nf: registro.nf || '',
      horarioEmbalamento: registro.horarioEmbalamento || '',
      descricao: registro.descricao || '',
      consideracoes: registro.consideracoes || '',
      localData: registro.localData || `Aquiraz, ${new Date(registro.dataCriacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`,
      imagens: registro.imagens || [],
      fornecedor: registro.fornecedor || '',
      assinaturas: registro.assinaturas || [...defaultAssinaturas]
    });
    setEditingReportId(registro.id);
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingReportId(null);
    setFormData(getEmptyForm());
    setView('dashboard');
  };

  const handleUpdateStatus = async (id, newStatus, newObs) => {
    const payload = { status: newStatus, observacoesStatus: newObs, dataModificacao: new Date().toISOString() };
    
    setRegistros(prev => {
      const updatedList = prev.map(r => r.id === id ? { ...r, ...payload } : r);
      localStorage.setItem('imac_registros', JSON.stringify(updatedList));
      return updatedList;
    });

    if (user && db && isConfigured && id.length > 15) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registros', id), payload);
        setAppMessage("✅ Avaliação salva com sucesso!");
      } catch (error) { 
        console.error('Erro ao atualizar status:', error); 
        setAppMessage("💾 Avaliação salva localmente (offline)"); 
      }
    } else { 
      setAppMessage("💾 Avaliação salva localmente"); 
    }
    
    setEvaluatingRegistro(null);
    setTimeout(() => setAppMessage(null), 3000);
  };

  const handleSaveReport = async () => {
    const registroData = {
      tipoRelatorio: formData.tipoRelatorio,
      dataRelatorio: formData.dataRelatorio,
      produto: formData.produto || 'Não especificado',
      ocorrencia: formData.ocorrencia || 'Sem descrição',
      fornecedor: formData.fornecedor || '',
      lote: formData.lote || '', quantidade: formData.quantidade || '', validade: formData.validade || '',
      dataRecebimento: formData.dataRecebimento || '', nf: formData.nf || '', horarioEmbalamento: formData.horarioEmbalamento || '',
      dataOcorrencia: formData.dataOcorrencia || '', descricao: formData.descricao || '', consideracoes: formData.consideracoes || '',
      imagens: formData.imagens || [], assinaturas: formData.assinaturas || [],
      logo: formData.logo || null, localData: formData.localData || '',
      userId: user?.uid || 'anonimo'
    };

    if (editingReportId) {
      // MODO EDIÇÃO - ATUALIZA O EXISTENTE
      const updatedAt = new Date().toISOString();
      const payloadEdicao = { ...registroData, dataModificacao: updatedAt };
      
      setRegistros(prev => {
        const updatedList = prev.map(r => r.id === editingReportId ? { ...r, ...payloadEdicao } : r);
        localStorage.setItem('imac_registros', JSON.stringify(updatedList));
        return updatedList;
      });

      if (user && db && isConfigured && editingReportId.length > 15) {
        try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registros', editingReportId), payloadEdicao);
          setAppMessage("✅ Relatório editado com sucesso!");
        } catch (error) { console.error('Erro ao editar:', error); setAppMessage("💾 Edição salva localmente (offline)"); }
      } else { setAppMessage("💾 Edição salva localmente"); }
      
      setEditingReportId(null); // Limpa o estado de edição
    } else {
      // MODO CRIAÇÃO - NOVO REGISTRO
      const novoRegistro = { ...registroData, id: Date.now().toString(), dataCriacao: new Date().toISOString() };
      setRegistros(prev => { const newList = [novoRegistro, ...prev]; localStorage.setItem('imac_registros', JSON.stringify(newList)); return newList; });
      
      if (user && db && isConfigured) {
        try {
          const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'registros'), novoRegistro);
          setRegistros(prev => {
            const updated = prev.map(r => r.id === novoRegistro.id ? { ...r, id: docRef.id } : r);
            localStorage.setItem('imac_registros', JSON.stringify(updated));
            return updated;
          });
          setAppMessage("✅ Relatório salvo com sucesso!");
        } catch (error) { setAppMessage("💾 Salvo localmente (offline)"); }
      } else { setAppMessage("💾 Relatório salvo localmente"); }
    }
    
    // Reseta o formulário
    setFormData(getEmptyForm());
    setView('dashboard'); // Volta pro painel
    setTimeout(() => setAppMessage(null), 3000);
  };

  const handlePrintAndSave = async () => {
    window.print();
  };

  const confirmDeleteRegistro = async (id) => {
    if (user && db && isConfigured && id.length > 15) {
      try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registros', id)); } catch (error) {}
    } else {
      setRegistros(prev => { const newList = prev.filter(r => r.id !== id); localStorage.setItem('imac_registros', JSON.stringify(newList)); return newList; });
    }
    setRegistroToDelete(null);
  };

  const getFilteredRecords = () => {
    return registros.filter(r => {
      const d = new Date(r.dataCriacao); const now = new Date();
      if (dashboardFilters.periodo === 'mes_atual') { if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false; } 
      else if (dashboardFilters.periodo === 'mes_anterior') { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); if (d.getMonth() !== lm.getMonth() || d.getFullYear() !== lm.getFullYear()) return false; } 
      else if (dashboardFilters.periodo === 'trimestre') { const t = new Date(); t.setMonth(t.getMonth() - 3); if (d < t) return false; } 
      else if (dashboardFilters.periodo === 'ano') { if (d.getFullYear() !== now.getFullYear()) return false; }
      if (dashboardFilters.fornecedor && r.fornecedor !== dashboardFilters.fornecedor) return false;
      if (dashboardFilters.tipo && r.tipoRelatorio !== dashboardFilters.tipo) return false;
      return true;
    });
  };

  const exportToCSV = () => {
    const records = getFilteredRecords();
    const rows = records.map(r => [new Date(r.dataCriacao).toLocaleDateString('pt-BR'), r.tipoRelatorio, r.produto || '', r.fornecedor || '', r.ocorrencia || '', r.lote || '', r.quantidade || '']);
    const csv = [['Data', 'Tipo', 'Produto', 'Fornecedor', 'Ocorrência', 'Lote', 'Quantidade'].join(';'), ...rows.map(row => row.join(';'))].join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })); link.download = `relatorios_rnc.csv`; link.click();
  };

  const isFornecedor = formData.tipoRelatorio === 'Problema com Fornecedor' || formData.tipoRelatorio === 'Insumo ou Embalagem';
  const requiresHorario = formData.tipoRelatorio.includes('Teste') || formData.tipoRelatorio === 'Ocorrência Interna';
  const showValidade = !formData.tipoRelatorio.includes('Insumo') && !formData.tipoRelatorio.includes('Equipamento');

  const getPlaceholders = () => {
    const p = {
      'Problema com Fornecedor': { produto: "Ex: Salsicha Hot Dog - Aurora", ocorrencia: "Ex: Desvio de padrão físico", lote: "Ex: 0426011411", quantidade: "Ex: 12 kg", descricao: "Durante o processo de abertura da embalagem, foi identificada uma não conformidade...", consideracoes: "A presença dessas avarias compromete a integridade do insumo..." },
      'Insumo ou Embalagem': { produto: "Ex: Embalagens plásticas", ocorrencia: "Ex: Fragilidade", lote: "Ex: LOTE 4.1", quantidade: "Ex: 1.562 unidades", descricao: "Durante a rotina de operação...", consideracoes: "O rompimento inviabiliza o acondicionamento..." },
      'Ocorrência Interna': { produto: "Ex: Pão Hot Dog", ocorrencia: "Ex: Presença de corpo estranho", lote: "Ex: A 0103", quantidade: "Ex: 1 pacote (5kg)", descricao: "Durante a rotina de operação...", consideracoes: "Solicitamos que a equipe reforce a atenção..." },
      'Teste de Produto': { produto: "Ex: Pão de Queijo", ocorrencia: "Ex: Teste de formulação", lote: "Ex: Lote Teste 01", quantidade: "Ex: Escala reduzida", descricao: "A avaliação foi realizada após...", consideracoes: "Os resultados obtidos..." },
      'Teste de Equipamento': { produto: "Ex: Seladora Automática", ocorrencia: "Ex: Oscilação na temperatura", lote: "Ex: N/A", quantidade: "Ex: N/A", descricao: "Durante o processamento...", consideracoes: "Como medida de contingência..." }
    };
    return p[formData.tipoRelatorio] || p['Problema com Fornecedor'];
  };
  const placeholders = getPlaceholders();

  // ==================== DASHBOARD ====================
  if (view === 'dashboard') {
    const filteredRecords = getFilteredRecords();
    const countsPorTipo = { 'Problema com Fornecedor': 0, 'Insumo ou Embalagem': 0, 'Ocorrência Interna': 0, 'Teste de Produto': 0, 'Teste de Equipamento': 0 };
    const fornecedorCounts = {};
    
    filteredRecords.forEach(r => {
      if (countsPorTipo[r.tipoRelatorio] !== undefined) countsPorTipo[r.tipoRelatorio]++;
      if (r.fornecedor) fornecedorCounts[r.fornecedor] = (fornecedorCounts[r.fornecedor] || 0) + 1;
    });

    const pieData = Object.entries(countsPorTipo).filter(([_, v]) => v > 0).map(([label, value]) => ({ label, value }));
    const barData = Object.entries(fornecedorCounts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10);
    const tipoBarras = Object.entries(countsPorTipo).map(([nome, valor]) => ({ label: nome, value: valor, color: nome.includes('Fornecedor') ? '#EF4444' : nome.includes('Insumo') ? '#F59E0B' : nome.includes('Interna') ? '#3B82F6' : nome.includes('Produto') ? '#22C55E' : '#8B5CF6' }));

    return (
      <div className="min-h-screen bg-[#f8f9fa] py-8 px-4 font-sans text-gray-800 print:bg-white print:py-0 print:px-0">
        {registroToView && <RelatorioViewModal registro={registroToView} onClose={() => setRegistroToView(null)} />}
        {evaluatingRegistro && <StatusModal registro={evaluatingRegistro} onClose={() => setEvaluatingRegistro(null)} onSave={handleUpdateStatus} />}
        {registroToDelete && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border-t-4 border-red-500">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Apagar Registro?</h3>
              <p className="text-gray-600 text-sm mb-6">Esta ação removerá o registro permanentemente.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setRegistroToDelete(null)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold transition text-sm">Cancelar</button>
                <button onClick={() => confirmDeleteRegistro(registroToDelete)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition text-sm flex items-center gap-1"><Trash2 size={16}/> Apagar</button>
              </div>
            </div>
          </div>
        )}
        {appMessage && <div className="fixed top-4 right-4 z-[100] animate-fade-in-up no-print"><div className="bg-white rounded-xl shadow-lg p-4 border-t-4 border-[#F4B41A] max-w-sm"><p className="text-sm font-medium text-gray-800">{appMessage}</p></div></div>}

        <div className={`max-w-7xl mx-auto ${registroToView ? 'no-print' : ''}`}>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <div><h1 className="text-3xl font-black text-[#5C3A21] flex items-center gap-2"><BarChart2 size={28} className="text-[#F4B41A]" />Painel de Qualidade</h1><p className="text-gray-600">Análise de Não Conformidades</p></div>
            <div className="flex gap-2">
              <button onClick={exportToCSV} className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2 text-sm"><Download size={16} /> Exportar CSV</button>
              <button onClick={() => { setFormData(getEmptyForm()); setEditingReportId(null); setView('form'); }} className="bg-[#5C3A21] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-[#4a2e1a] transition flex items-center gap-2"><Plus size={18} /> Novo Relatório</button>
            </div>
          </div>

          <div className="mb-6"><DashboardFilters onFilterChange={setDashboardFilters} fornecedores={fornecedores} /></div>

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
          {barData.length > 0 && <div className="mb-6"><BarChart data={barData} title="Top 10 Fornecedores" color="#EF4444" /></div>}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold text-gray-700">Histórico de Emissões <span className="text-gray-400 font-normal ml-2">({filteredRecords.length} registros)</span></h2>
              <span className={`text-xs px-3 py-1 rounded-full border font-bold ${isConfigured && !dbError ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>{isConfigured && !dbError ? '✔ Nuvem' : '💾 Local'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500"><tr><th className="px-4 py-3 font-bold">Data</th><th className="px-4 py-3 font-bold">Tipo</th><th className="px-4 py-3 font-bold">Produto</th><th className="px-4 py-3 font-bold">Fornecedor</th><th className="px-4 py-3 font-bold">Ocorrência</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 font-bold text-center">Ações</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.length === 0 ? <tr><td colSpan="7" className="text-center py-8 text-gray-400">Nenhum registro encontrado.</td></tr> : 
                    filteredRecords.map(reg => (
                      <tr key={reg.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap text-xs">{new Date(reg.dataCriacao).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3"><span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap">{reg.tipoRelatorio}</span></td>
                        <td className="px-4 py-3 font-medium text-gray-800 max-w-[150px] truncate" title={reg.produto}>{reg.produto}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate" title={reg.fornecedor}>{reg.fornecedor || '-'}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={reg.ocorrencia}>{reg.ocorrencia}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap border tracking-wide uppercase ${
                            (!reg.status || reg.status === 'Pendente') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            reg.status === 'Liberado' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {reg.status || 'Pendente'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setEvaluatingRegistro(reg)} className="text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 p-2 rounded-lg transition" title="Avaliar / Liberar"><CheckCircle size={16} /></button>
                            <button onClick={() => setRegistroToView(reg)} className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition" title="Visualizar"><Eye size={16} /></button>
                            <button onClick={() => startEditingReport(reg)} className="text-yellow-600 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100 p-2 rounded-lg transition" title="Editar este Relatório"><Edit3 size={16} /></button>
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

  // ==================== PREVIEW DO DOCUMENTO ====================
  if (view === 'preview') {
    let tituloRelatorio = "RELATÓRIO DE OCORRÊNCIA PRODUTO";
    let tituloSecao1 = "1. INFORMAÇÕES GERAIS E RASTREABILIDADE"; let tituloSecao2 = "2. DESCRIÇÃO DA OCORRÊNCIA"; let tituloSecao3 = "3. CONSIDERAÇÕES FINAIS";
    if (formData.tipoRelatorio === 'Insumo ou Embalagem') tituloRelatorio = "RELATÓRIO DE OCORRÊNCIA INSUMO";
    if (formData.tipoRelatorio === 'Ocorrência Interna') tituloRelatorio = "RELATÓRIO INTERNO DE OCORRÊNCIA";
    if (formData.tipoRelatorio.includes('Teste')) { tituloRelatorio = "RELATÓRIO DE TESTES"; tituloSecao1 = "1. DADOS DO ESTUDO"; tituloSecao2 = "2. METODOLOGIA E RESULTADOS"; tituloSecao3 = "3. CONCLUSÃO E RECOMENDAÇÕES"; }

    return (
      <div className="min-h-screen bg-gray-200 p-4 md:p-8 font-sans print:bg-white print:p-0">
        <div className="max-w-4xl mx-auto mb-6 flex flex-wrap justify-between items-center gap-3 no-print">
          <button onClick={() => setView('form')} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition shadow"><Edit3 size={18} /> Voltar para Edição</button>
          <div className="flex gap-3">
            <button onClick={handleSaveReport} className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold shadow transition"><Save size={18} /> {editingReportId ? 'SALVAR EDIÇÃO' : 'SALVAR NOVO'}</button>
            <button onClick={handlePrintAndSave} className="flex items-center gap-2 px-6 py-2 bg-[#5C3A21] text-[#F4B41A] rounded hover:bg-[#4a2e1a] font-black shadow-md transition"><Printer size={18} /> IMPRIMIR</button>
          </div>
        </div>

        <div className="max-w-[210mm] min-h-[297mm] print:min-h-0 mx-auto bg-white shadow-2xl print:shadow-none print:w-full print:h-full print:p-0 print-no-padding text-black text-[15px] leading-relaxed relative flex flex-col">
          <div className="h-[12px] w-full bg-[#F4B41A] print-bg-yellow"></div>
          <div className="px-[20mm] py-[10mm] print:px-[15mm] print:py-[10mm] print-no-padding flex-1">
            
            {/* --- PÁGINA 1: CABEÇALHO, DESCRIÇÃO E IMAGENS --- */}
            <div className="flex justify-between items-end border-b-2 border-gray-100 pb-4 mb-6 print:mb-4">
              <div>{formData.logo ? <img src={formData.logo} alt="Logo IMAC" className="h-[50px] object-contain mb-1" /> : <h1 className="text-[38px] font-black text-[#5C3A21] tracking-tighter leading-none mb-1">IMAC</h1>} <p className="font-bold text-black text-[14px]">Controle de Qualidade</p></div>
              <div className="text-right"><p className="font-bold uppercase tracking-wide text-[16px] text-[#5C3A21]">{tituloRelatorio}</p><p className="font-bold text-[14px] text-gray-500 mt-1">Emissão: {formData.dataRelatorio}</p></div>
            </div>

            <div className="mb-5 print:mb-3 break-inside-avoid">
              <div className="border-l-4 border-[#F4B41A] print-border-yellow pl-2 mb-3 print:mb-2"><p className="font-bold uppercase text-[#5C3A21]">{tituloSecao1}</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2 print:gap-1.5 ml-1">
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

            {formData.descricao && (
              <div className="mb-5 print:mb-3 w-full overflow-hidden">
                <div className="border-l-4 border-[#F4B41A] print-border-yellow pl-2 mb-2 print:mb-1.5"><p className="font-bold uppercase text-[#5C3A21]">{tituloSecao2}</p></div>
                <div className="text-justify text-black ml-1 rich-text-content break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: formData.descricao || '' }} />
              </div>
            )}

            {formData.imagens.length > 0 && (
              <div className="mb-6 mt-6 print:mt-4">
                <div className="bg-[#ED7D31] text-white text-center py-1.5 mb-3 print-bg-orange break-inside-avoid"><p className="text-[15px] font-bold">Seguem registros fotográficos</p></div>
                <div className="grid grid-cols-2 print:grid-cols-2 gap-4">
                  {formData.imagens.map((img, index) => <img key={index} src={img} alt={`Evidência ${index + 1}`} className="w-full h-56 print:h-64 object-cover border border-gray-300 shadow-sm rounded break-inside-avoid" />)}
                </div>
              </div>
            )}

            {/* --- CONTINUAÇÃO DO RELATÓRIO (FLUXO NATURAL) --- */}
            <div className="print:pt-4">
              {formData.consideracoes && (
                <div className="mb-6 mt-6 print:mt-0 w-full overflow-hidden">
                  <div className="border-l-4 border-[#F4B41A] print-border-yellow pl-2 mb-2 print:mb-1.5 break-after-avoid"><p className="font-bold uppercase text-[#5C3A21]">{tituloSecao3}</p></div>
                  <div className="text-justify text-black ml-1 rich-text-content break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: formData.consideracoes || '' }} />
                </div>
              )}

              <div className="mb-8 print:mb-5 ml-1 break-inside-avoid"><p>{formData.localData}</p></div>

              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-6 text-[14px] mt-6 mb-4 print:mt-3 print:mb-2 break-inside-avoid print-grid-signatures">
                {formData.assinaturas.map((assinatura, index) => (
                  <div key={index} className={formData.assinaturas.length % 2 !== 0 && index === formData.assinaturas.length - 1 ? "md:col-span-2 print:col-span-2" : ""}>
                    <p className="font-bold">{assinatura.nome}</p><p className="leading-snug whitespace-pre-line">{assinatura.cargo}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ==================== FORMULÁRIO PRINCIPAL ====================
  const editingReport = editingReportId ? registros.find(r => r.id === editingReportId) : null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-8 px-4 font-sans text-gray-800 relative">
      {appMessage && <div className="fixed top-4 right-4 z-[100] animate-fade-in-up"><div className="bg-white rounded-xl shadow-lg p-4 border-t-4 border-[#F4B41A] max-w-sm"><p className="text-sm font-medium text-gray-800">{appMessage}</p></div></div>}
      {editingImageIndex !== null && <ImageAnnotator imageSrc={formData.imagens[editingImageIndex]} onSave={updateAnnotatedImage} onCancel={() => setEditingImageIndex(null)} />}

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border-t-[10px] border-[#5C3A21]">
        <div className="bg-white px-8 py-6 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-[#F4B41A] p-2.5 rounded-lg shadow-sm"><ClipboardList size={28} className="text-[#5C3A21]" /></div>
            <div>
              <h1 className="text-2xl font-black tracking-wide text-[#5C3A21]">
                {editingReportId ? 'EDIÇÃO DE RNC' : 'SISTEMA DE EMISSÃO DE RNC'}
              </h1>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {editingReportId ? `Editando registro ${editingReportId.substring(0,6)}...` : 'Controle de Qualidade IMAC'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {editingReportId && (
               <button onClick={cancelEditing} className="flex items-center justify-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-bold border border-red-200 transition">Cancelar Edição</button>
            )}
            <button onClick={() => setView('dashboard')} className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold border border-gray-300 transition"><BarChart2 size={18} /> Painel de Registros</button>
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
                <select name="tipoRelatorio" value={formData.tipoRelatorio} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none bg-white font-medium shadow-sm">
                  <option value="Problema com Fornecedor">Problema com Fornecedor</option><option value="Insumo ou Embalagem">Insumo ou Embalagem</option>
                  <option value="Ocorrência Interna">Ocorrência Interna</option><option value="Teste de Produto">Teste de Produto</option><option value="Teste de Equipamento">Teste de Equipamento</option>
                </select>
              </div>
              <div><label className="block text-sm font-bold mb-1 text-gray-700">Data de Emissão</label><input type="text" name="dataRelatorio" value={formData.dataRelatorio} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
            </div>

            {isFornecedor && (
              <div><label className="block text-sm font-bold mb-1 text-gray-700 flex items-center gap-2"><Truck size={16} className="text-[#5C3A21]" />Fornecedor</label><FornecedorSelect value={formData.fornecedor} onChange={(f) => setFormData(prev => ({ ...prev, fornecedor: f }))} fornecedores={fornecedores} onAddFornecedor={addFornecedor} /></div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b-2 border-[#F4B41A] pb-2 text-[#5C3A21]">1. Informações e Rastreabilidade</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-sm font-bold mb-1 text-gray-700">Produto ou Material</label><input type="text" maxLength={80} name="produto" value={formData.produto} onChange={handleChange} placeholder={placeholders.produto} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
              <div><label className="block text-sm font-bold mb-1 text-gray-700">Resumo do Problema</label><input type="text" maxLength={80} name="ocorrencia" value={formData.ocorrencia} onChange={handleChange} placeholder={placeholders.ocorrencia} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
              <div><label className="block text-sm font-bold mb-1 text-gray-700">Data da Ocorrência</label><input type="text" maxLength={40} name="dataOcorrencia" value={formData.dataOcorrencia} onChange={handleChange} placeholder="Ex: 13/04/2026" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
              <div><label className="block text-sm font-bold mb-1 text-gray-700">Lote</label><input type="text" maxLength={40} name="lote" value={formData.lote} onChange={handleChange} placeholder={placeholders.lote} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
              <div><label className="block text-sm font-bold mb-1 text-gray-700">Quantidade</label><input type="text" maxLength={40} name="quantidade" value={formData.quantidade} onChange={handleChange} placeholder={placeholders.quantidade} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>
              {showValidade && <div><label className="block text-sm font-bold mb-1 text-gray-700">Data de Validade</label><input type="text" maxLength={40} name="validade" value={formData.validade} onChange={handleChange} placeholder="Ex: 21/06/2026" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>}
              {isFornecedor && <><div><label className="block text-sm font-bold mb-1 text-gray-700">Data de Recebimento</label><input type="text" maxLength={40} name="dataRecebimento" value={formData.dataRecebimento} onChange={handleChange} placeholder="Ex: 22/04/2026" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div><div><label className="block text-sm font-bold mb-1 text-gray-700">Nota Fiscal</label><input type="text" maxLength={40} name="nf" value={formData.nf} onChange={handleChange} placeholder="Ex: 14612" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div></>}
              {requiresHorario && <div><label className="block text-sm font-bold mb-1 text-gray-700">Horário / Turno</label><input type="text" maxLength={40} name="horarioEmbalamento" value={formData.horarioEmbalamento} onChange={handleChange} placeholder="Ex: 14:30h" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none shadow-sm" /></div>}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-bold border-b-2 border-[#F4B41A] pb-2 text-[#5C3A21]">Descrição e Considerações</h2>
            <div>
              <div className="mb-1">
                <label className="block text-sm font-bold text-gray-700">2. Descrição Detalhada</label>
              </div>
              <RichTextEditor value={formData.descricao} onChange={(val) => setFormData(prev => ({ ...prev, descricao: val }))} placeholder={placeholders.descricao} />
            </div>
            <div>
              <div className="mb-1">
                <label className="block text-sm font-bold text-gray-700">3. Considerações Finais</label>
              </div>
              <RichTextEditor value={formData.consideracoes} onChange={(val) => setFormData(prev => ({ ...prev, consideracoes: val }))} placeholder={placeholders.consideracoes} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b-2 border-[#F4B41A] pb-2 text-[#5C3A21]">Fotos e Evidências</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer bg-gray-50/50">
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                <div className="bg-white p-3 rounded-full shadow-sm mb-3 border border-gray-200"><ImagePlus size={28} className="text-[#5C3A21]" /></div>
                <span className="text-[14px] font-bold text-[#5C3A21]">Clique para anexar fotos</span>
                <span className="text-xs text-gray-500 mt-1 font-medium">Depois você pode cortar a imagem e colocar setas</span>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            {formData.imagens.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {formData.imagens.map((img, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
                    <img src={img} alt="Preview" className="w-full h-32 object-cover" />
                    <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-700" title="Remover Foto"><Trash2 size={16} /></button>
                    <button onClick={() => setEditingImageIndex(index)} className="absolute top-1 right-10 bg-blue-600 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-blue-700" title="Anotar ou Cortar Imagem"><PenTool size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-[#F4B41A] pb-2 gap-3">
              <h2 className="text-lg font-bold text-[#5C3A21]">Assinaturas</h2>
              <button onClick={addAssinatura} className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded flex items-center gap-1 transition"><Plus size={14} /> ADICIONAR</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.assinaturas.map((assinatura, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 p-4 rounded-lg relative">
                  <button onClick={() => removeAssinatura(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition"><UserX size={18} /></button>
                  <div className="mb-2 pr-6"><label className="block text-xs font-bold mb-1 text-gray-600">Nome</label><input type="text" value={assinatura.nome} onChange={(e) => handleAssinaturaChange(index, 'nome', e.target.value)} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-1 focus:ring-[#F4B41A] outline-none" /></div>
                  <div><label className="block text-xs font-bold mb-1 text-gray-600">Cargo</label><textarea rows="2" value={assinatura.cargo} onChange={(e) => handleAssinaturaChange(index, 'cargo', e.target.value)} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-1 focus:ring-[#F4B41A] outline-none resize-y min-h-[50px]" /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4"><label className="block text-sm font-bold mb-1 text-gray-700">Data e Local</label><input type="text" name="localData" value={formData.localData} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-[#F4B41A] outline-none text-gray-600 shadow-sm" /></div>
        </div>

        <div className="bg-[#f8f9fa] p-6 border-t border-gray-200 flex justify-between items-center rounded-b-xl no-print">
           {editingReportId ? (
             <span className="font-bold text-[#5C3A21]">Editando {editingReportId.substring(0, 8)}...</span>
           ) : <span />}
          <button onClick={() => setView('preview')} className="bg-[#5C3A21] hover:bg-[#4a2e1a] text-[#F4B41A] font-black py-4 px-10 rounded-lg shadow-lg transition flex items-center gap-3 text-lg uppercase tracking-wide"><FileText size={24} />VISUALIZAR DOCUMENTO</button>
        </div>
      </div>
      <div className="text-center mt-6 text-xs text-gray-400 no-print">Desenvolvido por: Cristiamberg</div>
    </div>
  );
}
