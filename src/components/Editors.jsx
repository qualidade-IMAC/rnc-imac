import React, { useState, useEffect, useRef } from 'react';
import { 
  BoldIcon, ItalicIcon, UnderlineIcon, Palette, 
  Move, Scissors, ArrowUpRight, Circle, TypeIcon, 
  Check, Minus, Plus, RefreshCw, Undo, Trash2, X 
} from './Icons';

export const RichTextEditor = ({ value, onChange, placeholder }) => {
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
const handlePaste = (e) => {
    e.preventDefault();
    // Pega apenas o texto puro da área de transferência
    const text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
    document.execCommand('insertText', false, text);
    handleInput();
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
          onPaste={handlePaste}
          className="p-3 min-h-[100px] outline-none cursor-text rich-text-content"
          data-placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export const ImageAnnotator = ({ baseImageSrc, initialShapes = [], onSave, onCancel }) => {
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
