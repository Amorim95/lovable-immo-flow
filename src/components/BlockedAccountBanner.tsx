import { Lock, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlockedAccountBannerProps {
  onClose: () => void;
}

export function BlockedAccountBanner({ onClose }: BlockedAccountBannerProps) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Selos de "FECHADA" no fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.08]">
        <div className="absolute top-10 -left-10 text-[120px] font-black text-red-500 -rotate-12 tracking-tighter select-none">
          FECHADA
        </div>
        <div className="absolute bottom-20 -right-10 text-[120px] font-black text-red-500 rotate-12 tracking-tighter select-none">
          FECHADA
        </div>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg animate-scale-in"
      >
        {/* Fita diagonal "BLOQUEADO" */}
        <div className="absolute -top-3 -right-3 z-20 rotate-12">
          <div className="bg-red-600 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 shadow-lg border-2 border-red-900">
            Bloqueado
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-red-600 bg-gradient-to-br from-red-950 via-red-900 to-black">
          {/* Faixa listrada topo */}
          <div
            className="h-3 w-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #facc15 0 12px, #000 12px 24px)",
            }}
          />

          {/* Botão fechar */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-5 right-5 z-10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="px-8 py-10 text-center text-white">
            {/* Ícone com pulse */}
            <div className="relative mx-auto mb-6 w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-red-600 flex items-center justify-center shadow-lg ring-4 ring-red-950">
                <Lock className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 text-xs font-semibold uppercase tracking-widest">
              <AlertTriangle className="w-3.5 h-3.5" />
              Acesso Suspenso
            </div>

            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-2">
              Conta{" "}
              <span className="inline-block text-red-400 [text-shadow:0_0_20px_rgba(248,113,113,0.6)]">
                FECHADA
              </span>
            </h2>

            <div className="my-5 h-px w-16 mx-auto bg-gradient-to-r from-transparent via-red-400 to-transparent" />

            <p className="text-base md:text-lg text-red-100/90 leading-relaxed max-w-sm mx-auto">
              Por favor, entre em contato com o{" "}
              <span className="font-bold text-white">responsável da sua empresa</span>.
            </p>

            <Button
              onClick={onClose}
              variant="outline"
              className="mt-8 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur"
            >
              Entendi
            </Button>
          </div>

          {/* Faixa listrada base */}
          <div
            className="h-3 w-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #facc15 0 12px, #000 12px 24px)",
            }}
          />
        </div>
      </div>
    </div>
  );
}