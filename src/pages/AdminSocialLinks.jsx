import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";

/**
 * PVC Card Designer — 88.55mm × 54mm
 * - Precise physical sizing (preview at 96dpi; export at 300dpi)
 * - Add/drag text & small icons, change fonts/colors/sizes
 * - Optional background color or uploaded background image (existing card)
 * - Grid & snap toggle
 * - Export PNG (300dpi, print-ready)
 * - Single-file component
 */

/* ====== Sizing helpers (mm -> px) ====== */
const MM_PER_INCH = 25.4;
const PREVIEW_DPI = 96;   // screen preview
const EXPORT_DPI  = 300;  // high-res export
const CARD_MM = { w: 88.55, h: 54 };
const mmToPx = (mm, dpi) => Math.round((mm * dpi) / MM_PER_INCH);

const PREVIEW = {
  w: mmToPx(CARD_MM.w, PREVIEW_DPI),
  h: mmToPx(CARD_MM.h, PREVIEW_DPI)
};
const EXPORT = {
  w: mmToPx(CARD_MM.w, EXPORT_DPI),
  h: mmToPx(CARD_MM.h, EXPORT_DPI)
};

/* ====== Icons (monochrome SVGs) ====== */
const ICONS = {
  phone: "M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2 1 .4 2.2.7 3.4.7.7 0 1.2.5 1.2 1.2V20c0 1.1-.9 2-2 2C9.7 22 2 14.3 2 4c0-1.1.9-2 2-2h3.1c.7 0 1.2.5 1.2 1.2 0 1.2.2 2.4.7 3.4.2.4.1.9-.2 1.2L6.6 10.8Z",
  mail:  "M20 4H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z",
  web:   "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 9H15c-.1-2.1-.7-4-1.6-5.6A8 8 0 0 1 18.9 11ZM9 11H5.1A8 8 0 0 1 10.6 5.4C9.7 7 9.1 8.9 9 11Zm0 2c.1 2.1.7 4 1.6 5.6A8 8 0 0 1 5.1 13H9Zm2 0h2c-.1 1.9-.6 3.6-1 4.7-.4-1.1-.9-2.8-1-4.7Zm0-2c.1-1.9.6-3.6 1-4.7.4 1.1.9 2.8 1 4.7h-2Zm2.4 7.6c.9-1.6 1.5-3.5 1.6-5.6h3.9a8 8 0 0 1-5.5 5.6ZM14.9 11c-.1-2.1-.7-4-1.6-5.6A8 8 0 0 1 18.9 11h-4Z",
  map:   "M15 6 9 3 3 6v15l6-3 6 3 6-3V3l-6 3Zm0 13-6-3V5l6 3v11Z",
  user:  "M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.3 0-8 2.2-8 5v3h16v-3c0-2.8-3.7-5-8-5Z",
  star:  "M12 2 9.5 8H3l5.2 3.8L6.6 18 12 14.4 17.4 18l-1.6-6.2L21 8h-6.5L12 2Z"
};

/* ====== Styled UI ====== */
const Wrap = styled.div`
  max-width: 1200px; margin: 0 auto; padding: 20px 16px 60px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
`;
const Header = styled.div`
  display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px;
  h1{margin:0; font-size:22px}
`;
const Actions = styled.div`display:flex; gap:8px; flex-wrap:wrap;`;
const Btn = styled.button`
  padding: 8px 12px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer;
  &:hover{box-shadow:0 2px 10px rgba(0,0,0,.08)}
`;
const Grid = styled.div`
  display:grid; grid-template-columns: minmax(300px, 0.9fr) 1.1fr; gap:18px; align-items:start;
  @media (max-width: 980px){ grid-template-columns: 1fr; }
`;
const Panel = styled.div`
  border:1px solid #e5e7eb; border-radius:18px; background:#fff; overflow:hidden;
  box-shadow: 0 6px 22px rgba(0,0,0,.06);
`;
const PanelHeader = styled.div`
  padding:12px 14px; background:#f8fafc; border-bottom:1px solid #eef2f7; font-weight:600;
`;
const PanelBody = styled.div`
  padding:12px; display:grid; gap:10px;
`;
const Row = styled.div`
  display:flex; gap:8px; align-items:center; flex-wrap:wrap;
  label{ font-size:13px; color:#374151; }
`;
const Field = styled.div` display:grid; gap:6px; min-width: 160px; flex:1; `;
const TextInput = styled.input`
  width:100%; padding:10px 12px; border-radius:12px; border:1px solid #e2e8f0; background:#f8fafc;
  &:focus{ outline:none; box-shadow:0 0 0 3px rgba(14,165,233,.25); border-color:#38bdf8; background:#fff; }
`;
const NumberInput = styled.input`
  width:100%; padding:8px 10px; border-radius:10px; border:1px solid #e2e8f0; background:#f8fafc;
`;
const Select = styled.select`
  width:100%; padding:8px 10px; border-radius:10px; border:1px solid #e2e8f0; background:#f8fafc;
`;
const CanvasWrap = styled.div`
  display:flex; justify-content:center; align-items:center; background:#f1f5f9; border:1px dashed #cbd5e1; border-radius:16px; padding:16px;
`;
const CardStage = styled.div`
  position:relative; width:${PREVIEW.w}px; height:${PREVIEW.h}px; background:#fff; overflow:hidden; border-radius:8px;
  background-size:cover; background-position:center; background-repeat:no-repeat;
`;
const Draggable = styled.div`
  position:absolute; cursor:move; user-select:none; transform: ${p=>`translate(${p.$x}px, ${p.$y}px) rotate(${p.$rot||0}deg)`};
  outline: ${p=>p.$selected? '2px dashed #38bdf8' : 'none'};
  padding: ${p=>p.$type==='text'? '0' : '0'};
`;

/* ====== Types ====== */
// item: { id, type: 'text'|'icon'|'image', x, y, rot, w, h, text, fontSize, fontFamily, bold, italic, color, iconKey, opacity }

export default function CardDesigner(){
  const [bgColor, setBgColor] = useState("#0f172a");
  const [bgImage, setBgImage] = useState("");
  const [gridOn, setGridOn] = useState(true);
  const [snap, setSnap] = useState(true);
  const [items, setItems] = useState([]);
  const [selId, setSelId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const stageRef = useRef(null);

  const selected = useMemo(()=> items.find(i=>i.id===selId) || null, [items, selId]);

  /* ====== Adders ====== */
  const addText = () => {
    const id = crypto.randomUUID();
    setItems(prev=>[
      ...prev,
      { id, type:'text', x: 20, y: 20, rot:0, text:'Nuevo título', fontSize:18, fontFamily:'Inter, system-ui', bold:false, italic:false, color:'#ffffff', opacity:1 }
    ]);
    setSelId(id);
  };
  const addIcon = (iconKey) => {
    const id = crypto.randomUUID();
    setItems(prev=>[
      ...prev,
      { id, type:'icon', iconKey, x: 24, y: 24, rot:0, w:26, h:26, color:'#ffffff', opacity:1 }
    ]);
    setSelId(id);
  };
  const addImageAsOverlay = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const id = crypto.randomUUID();
      setItems(prev=>[
        ...prev,
        { id, type:'image', x: 0, y: 0, rot:0, w: PREVIEW.w, h: PREVIEW.h, src: reader.result, opacity:1 }
      ]);
      setSelId(id);
    };
    reader.readAsDataURL(file);
  };
  const onUploadBg = (file) => {
    const r = new FileReader();
    r.onload = ()=> setBgImage(r.result);
    r.readAsDataURL(file);
  };

  /* ====== Drag/Select ====== */
  const dragState = useRef({ dragging:false, offX:0, offY:0, id:null });
  const onMouseDown = (e, id) => {
    e.stopPropagation();
    const rect = stageRef.current.getBoundingClientRect();
    const itm = items.find(i=>i.id===id);
    if(!itm) return;
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    dragState.current = { dragging:true, offX: x - itm.x, offY: y - itm.y, id };
    setSelId(id);
  };
  const onMouseMove = (e) => {
    if(!dragState.current.dragging) return;
    const rect = stageRef.current.getBoundingClientRect();
    let nx = (e.clientX - rect.left)/zoom - dragState.current.offX;
    let ny = (e.clientY - rect.top)/zoom - dragState.current.offY;
    if(snap){ nx = Math.round(nx/4)*4; ny = Math.round(ny/4)*4; }
    setItems(prev=> prev.map(it=> it.id===dragState.current.id ? { ...it, x: Math.min(Math.max(nx, -200), PREVIEW.w+200), y: Math.min(Math.max(ny, -200), PREVIEW.h+200) } : it));
  };
  const onMouseUp = () => { dragState.current.dragging=false; };
  const deselect = ()=> setSelId(null);

  /* ====== Update selected ====== */
  const updSel = (patch) => setItems(prev => prev.map(it => it.id===selId ? { ...it, ...patch } : it));
  const removeSel = () => { setItems(prev => prev.filter(it=>it.id!==selId)); setSelId(null); };
  const bringForward = () => {
    setItems(prev=>{
      const idx = prev.findIndex(i=>i.id===selId); if(idx<0) return prev;
      const arr=[...prev]; const [itm] = arr.splice(idx,1); arr.splice(Math.min(idx+1,arr.length),0,itm); return arr;
    });
  };
  const sendBackward = () => {
    setItems(prev=>{
      const idx = prev.findIndex(i=>i.id===selId); if(idx<0) return prev;
      const arr=[...prev]; const [itm] = arr.splice(idx,1); arr.splice(Math.max(idx-1,0),0,itm); return arr;
    });
  };

  /* ====== Export (canvas, 300dpi) ====== */
  const exportPNG = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT.w; canvas.height = EXPORT.h;
    const ctx = canvas.getContext('2d');

    // background
    if(bgImage){
      await drawImageFit(ctx, bgImage, EXPORT.w, EXPORT.h);
    } else {
      ctx.fillStyle = bgColor; ctx.fillRect(0,0,EXPORT.w,EXPORT.h);
    }

    // scale factor from preview->export
    const scale = EXPORT.w / PREVIEW.w;

    for(const it of items){
      ctx.save();
      ctx.globalAlpha = it.opacity ?? 1;
      ctx.translate(it.x*scale, it.y*scale);
      ctx.rotate((it.rot||0) * Math.PI/180);
      if(it.type==='text'){
        const fs = Math.max(8, (it.fontSize||16) * scale);
        const weight = it.bold? '700' : '400';
        const style  = it.italic? 'italic' : 'normal';
        ctx.font = `${style} ${weight} ${fs}px ${canvasFont(it.fontFamily)}`;
        ctx.fillStyle = it.color || '#fff';
        ctx.textBaseline = 'top';
        wrapFillText(ctx, it.text || '', 0, 0, (EXPORT.w-16), fs*1.2);
      }
      else if(it.type==='icon'){
        const path = ICONS[it.iconKey] || ICONS.star;
        const w = (it.w||24)*scale, h=(it.h||24)*scale;
        const p = new Path2D(`M0 0 ${svgPathToPath2D(path)}`); // simple conversion shim
        // scale path into box
        ctx.translate(0,0);
        ctx.scale(w/24, h/24);
        ctx.fillStyle = it.color || '#fff';
        ctx.fill(p);
      }
      else if(it.type==='image'){
        await drawImageAt(ctx, it.src, 0, 0, (it.w||100)*scale, (it.h||100)*scale);
      }
      ctx.restore();
    }

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = 'tarjeta_300dpi.png'; a.click();
  };

  /* ====== Helpers (canvas draw) ====== */
  function canvasFont(ff){ return (ff||'Inter, system-ui').split(',')[0]; }
  function wrapFillText(ctx, text, x, y, maxWidth, lineHeight){
    const words = (text||'').split(/\s+/); let line=''; let yy=y; const pad=6;
    for(let n=0;n<words.length;n++){
      const test = line? line+" "+words[n] : words[n];
      const w = ctx.measureText(test).width;
      if(w > maxWidth && n>0){ ctx.fillText(line, x, yy); line=words[n]; yy+=lineHeight; }
      else line=test;
    }
    ctx.fillText(line, x, yy+0);
  }
  function svgPathToPath2D(path){ return path; }
  function drawImageFit(ctx, src, W, H){
    return new Promise(res=>{ const img = new Image(); img.onload=()=>{
      const r = Math.max(W/img.width, H/img.height);
      const nw = img.width*r, nh = img.height*r;
      const ox = (W-nw)/2, oy=(H-nh)/2;
      ctx.drawImage(img, ox, oy, nw, nh); res(); };
      img.src=src; });
  }
  function drawImageAt(ctx, src, x,y,w,h){
    return new Promise(res=>{ const img = new Image(); img.onload=()=>{ ctx.drawImage(img,x,y,w,h); res(); }; img.src=src; });
  }

  /* ====== Background grid ====== */
  const gridBg = useMemo(()=>{
    if(!gridOn) return undefined;
    const s = 8; // px grid
    const c = document.createElement('canvas');
    c.width=c.height=s; const ctx=c.getContext('2d');
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,s,s);
    ctx.fillStyle='#f1f5f9'; ctx.fillRect(0,0,1,s); ctx.fillRect(0,0,s,1);
    return c.toDataURL();
  }, [gridOn]);

  return (
    <Wrap>
      <Header>
        <h1>Diseña tu tarjeta PVC (88.55×54 mm)</h1>
        <Actions>
          <Btn type="button" onClick={addText}>+ Texto</Btn>
          <Select onChange={(e)=> e.target.value && (addIcon(e.target.value), (e.target.value=''))}>
            <option value="">+ Icono…</option>
            {Object.keys(ICONS).map(k=> <option key={k} value={k}>{k}</option>)}
          </Select>
          <label style={{display:'inline-block'}}>
            <input type="file" accept="image/*" style={{display:'none'}} onChange={(e)=> e.target.files?.[0] && addImageAsOverlay(e.target.files[0])} />
            <Btn type="button">+ Imagen encima</Btn>
          </label>
          <Btn type="button" onClick={exportPNG}>Exportar PNG (300dpi)</Btn>
        </Actions>
      </Header>

      <Grid>
        {/* Left: Controls */}
        <Panel>
          <PanelHeader>Apariencia de la tarjeta</PanelHeader>
          <PanelBody>
            <Row>
              <Field>
                <label>Color de fondo</label>
                <input type="color" value={bgColor} onChange={e=> setBgColor(e.target.value)} />
              </Field>
              <Field>
                <label>Subir fondo (tu tarjeta actual)</label>
                <input type="file" accept="image/*" onChange={(e)=> e.target.files?.[0] && onUploadBg(e.target.files[0])} />
              </Field>
            </Row>
            <Row>
              <label><input type="checkbox" checked={gridOn} onChange={e=>setGridOn(e.target.checked)} /> Mostrar cuadrícula</label>
              <label><input type="checkbox" checked={snap} onChange={e=>setSnap(e.target.checked)} /> Ajustar a cuadrícula</label>
              <Field>
                <label>Zoom</label>
                <input type="range" min="0.8" max="2" step="0.05" value={zoom} onChange={(e)=> setZoom(Number(e.target.value))} />
              </Field>
            </Row>
          </PanelBody>
        </Panel>

        {/* Right: Stage */}
        <CanvasWrap onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
          <div style={{ transform:`scale(${zoom})`, transformOrigin:'top left' }}>
            <CardStage
              ref={stageRef}
              onMouseDown={deselect}
              style={{
                backgroundColor: bgImage? undefined : bgColor,
                backgroundImage: gridOn ? `url(${gridBg})${bgImage? ', url('+bgImage+')' : ''}` : (bgImage? `url(${bgImage})` : undefined),
                backgroundBlendMode: bgImage && gridOn ? 'normal, multiply' : 'normal'
              }}
            >
              {items.map(it=> (
                <Draggable key={it.id} $x={it.x} $y={it.y} $rot={it.rot} $selected={selId===it.id} $type={it.type}
                  onMouseDown={(e)=> onMouseDown(e, it.id)}
                >
                  {it.type==='text' && (
                    <div style={{
                      padding:'0', color: it.color, fontSize: it.fontSize, lineHeight:1.2,
                      fontFamily: it.fontFamily, fontWeight: it.bold?700:400, fontStyle: it.italic?'italic':'normal',
                      textShadow:'0 1px 2px rgba(0,0,0,.12)'
                    }}>{it.text}</div>
                  )}
                  {it.type==='icon' && (
                    <svg width={it.w} height={it.h} viewBox="0 0 24 24">
                      <path d={ICONS[it.iconKey]||ICONS.star} fill={it.color} />
                    </svg>
                  )}
                  {it.type==='image' && (
                    <img src={it.src} alt="overlay" style={{display:'block', width:it.w, height:it.h, objectFit:'cover'}} />
                  )}
                </Draggable>
              ))}
            </CardStage>
          </div>
        </CanvasWrap>
      </Grid>

      {/* Properties of selected item */}
      {selected && (
        <Panel style={{marginTop:16}}>
          <PanelHeader>Propiedades del elemento seleccionado</PanelHeader>
          <PanelBody>
            <Row>
              <Btn type="button" onClick={bringForward}>Adelante</Btn>
              <Btn type="button" onClick={sendBackward}>Atrás</Btn>
              <Btn type="button" onClick={removeSel} style={{color:'#dc2626'}}>Eliminar</Btn>
            </Row>

            <Row>
              <Field>
                <label>Posición X (px)</label>
                <NumberInput type="number" value={Math.round(selected.x)} onChange={e=> updSel({ x: Number(e.target.value) })} />
              </Field>
              <Field>
                <label>Posición Y (px)</label>
                <NumberInput type="number" value={Math.round(selected.y)} onChange={e=> updSel({ y: Number(e.target.value) })} />
              </Field>
              <Field>
                <label>Rotación (°)</label>
                <NumberInput type="number" value={selected.rot||0} onChange={e=> updSel({ rot: Number(e.target.value) })} />
              </Field>
              <Field>
                <label>Opacidad</label>
                <input type="range" min="0.1" max="1" step="0.05" value={selected.opacity??1} onChange={e=> updSel({ opacity: Number(e.target.value) })} />
              </Field>
            </Row>

            {selected.type==='text' && (
              <>
                <Row>
                  <Field style={{flex:2}}>
                    <label>Texto</label>
                    <TextInput value={selected.text} onChange={e=> updSel({ text: e.target.value })} />
                  </Field>
                </Row>
                <Row>
                  <Field>
                    <label>Tamaño</label>
                    <input type="range" min="10" max="48" value={selected.fontSize} onChange={e=> updSel({ fontSize: Number(e.target.value) })} />
                  </Field>
                  <Field>
                    <label>Fuente (CSS)</label>
                    <TextInput value={selected.fontFamily} onChange={e=> updSel({ fontFamily: e.target.value })} />
                  </Field>
                  <Field>
                    <label>Color</label>
                    <input type="color" value={selected.color} onChange={e=> updSel({ color: e.target.value })} />
                  </Field>
                </Row>
                <Row>
                  <label><input type="checkbox" checked={!!selected.bold} onChange={e=> updSel({ bold: e.target.checked })} /> Negrita</label>
                  <label><input type="checkbox" checked={!!selected.italic} onChange={e=> updSel({ italic: e.target.checked })} /> Itálica</label>
                </Row>
              </>
            )}

            {selected.type==='icon' && (
              <Row>
                <Field>
                  <label>Icono</label>
                  <Select value={selected.iconKey} onChange={e=> updSel({ iconKey: e.target.value })}>
                    {Object.keys(ICONS).map(k=> <option key={k} value={k}>{k}</option>)}
                  </Select>
                </Field>
                <Field>
                  <label>Ancho (px)</label>
                  <NumberInput type="number" value={selected.w||24} onChange={e=> updSel({ w: Number(e.target.value) })} />
                </Field>
                <Field>
                  <label>Alto (px)</label>
                  <NumberInput type="number" value={selected.h||24} onChange={e=> updSel({ h: Number(e.target.value) })} />
                </Field>
                <Field>
                  <label>Color</label>
                  <input type="color" value={selected.color||'#000000'} onChange={e=> updSel({ color: e.target.value })} />
                </Field>
              </Row>
            )}

            {selected.type==='image' && (
              <Row>
                <Field>
                  <label>Ancho (px)</label>
                  <NumberInput type="number" value={selected.w||100} onChange={e=> updSel({ w: Number(e.target.value) })} />
                </Field>
                <Field>
                  <label>Alto (px)</label>
                  <NumberInput type="number" value={selected.h||100} onChange={e=> updSel({ h: Number(e.target.value) })} />
                </Field>
              </Row>
            )}
          </PanelBody>
        </Panel>
      )}

      <div style={{marginTop:12, fontSize:12, color:'#64748b'}}>
        Consejo: activa la cuadrícula y el ajuste para alinear; sube una foto de tu tarjeta actual como fondo y escribe encima. El PNG exportado sale al tamaño real (300dpi: {EXPORT.w}×{EXPORT.h} px).
      </div>
    </Wrap>
  );
}
