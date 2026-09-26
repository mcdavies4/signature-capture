'use client';

import { useRef, useState, useEffect } from 'react';

export default function SignaturePad({
  onSave,
  saving,
}: {
  onSave: (dataUrl: string) => void;
  saving: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a1a1a';
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    hasDrawn.current = true;
    setIsEmpty(false);
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    setIsEmpty(true);
  };

  const submit = () => {
    if (isEmpty) return;
    // Export on a clean white background so the PNG isn't transparent
    const src = canvasRef.current!;
    const out = document.createElement('canvas');
    out.width = src.width;
    out.height = src.height;
    const octx = out.getContext('2d')!;
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(src, 0, 0);
    onSave(out.toDataURL('image/png'));
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        style={{
          width: '100%',
          height: 220,
          border: '2px dashed #ccc',
          borderRadius: 8,
          touchAction: 'none',
          background: '#fff',
        }}
      />
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button
          onClick={clear}
          type="button"
          style={{
            padding: '10px 18px',
            borderRadius: 6,
            border: '1px solid #ccc',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
        <button
          onClick={submit}
          type="button"
          disabled={isEmpty || saving}
          style={{
            padding: '10px 18px',
            borderRadius: 6,
            border: 'none',
            background: isEmpty || saving ? '#999' : '#111',
            color: '#fff',
            cursor: isEmpty || saving ? 'not-allowed' : 'pointer',
            flex: 1,
          }}
        >
          {saving ? 'Saving…' : 'Submit signature'}
        </button>
      </div>
    </div>
  );
}
