import { useState, useRef, useEffect, useCallback } from "react";

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null, type: "draw" | "typed") => void;
}

const SignaturePad = ({ onSignatureChange }: SignaturePadProps) => {
  const [mode, setMode] = useState<"draw" | "typed">("draw");
  const [typedName, setTypedName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const getCanvas = () => canvasRef.current;
  const getCtx = () => getCanvas()?.getContext("2d") || null;

  const clearCanvas = useCallback(() => {
    const canvas = getCanvas();
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignatureChange(null, "draw");
  }, [onSignatureChange]);

  useEffect(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(2, 2);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = getCanvas();
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPoint.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx || !lastPoint.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPoint.current = pos;
  };

  const endDraw = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPoint.current = null;
    const canvas = getCanvas();
    if (canvas) {
      onSignatureChange(canvas.toDataURL("image/png"), "draw");
    }
  };

  useEffect(() => {
    if (mode === "typed" && typedName.trim()) {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 120;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.font = "italic 48px 'Dancing Script', 'Brush Script MT', cursive";
        ctx.fillStyle = "#1a1a1a";
        ctx.textBaseline = "middle";
        ctx.fillText(typedName, 20, 60);
        onSignatureChange(canvas.toDataURL("image/png"), "typed");
      }
    } else if (mode === "typed") {
      onSignatureChange(null, "typed");
    }
  }, [typedName, mode, onSignatureChange]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("draw")}
          className={`px-4 py-1.5 text-xs font-body uppercase tracking-wider border transition-colors ${
            mode === "draw"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-transparent text-foreground border-border hover:border-primary"
          }`}
        >
          Draw
        </button>
        <button
          type="button"
          onClick={() => setMode("typed")}
          className={`px-4 py-1.5 text-xs font-body uppercase tracking-wider border transition-colors ${
            mode === "typed"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-transparent text-foreground border-border hover:border-primary"
          }`}
        >
          Type
        </button>
      </div>

      {mode === "draw" ? (
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-[120px] border border-border bg-white cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          <button
            type="button"
            onClick={clearCanvas}
            className="absolute top-1 right-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground bg-white/80 px-2 py-0.5 border border-border"
          >
            Clear
          </button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Type your full legal name"
            className="w-full px-3 py-2 border border-border bg-white text-foreground font-body text-sm"
          />
          {typedName && (
            <div
              className="mt-2 p-4 border border-dashed border-border bg-white"
              style={{ fontFamily: "'Brush Script MT', cursive", fontSize: "36px", color: "#1a1a1a" }}
            >
              {typedName}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SignaturePad;
