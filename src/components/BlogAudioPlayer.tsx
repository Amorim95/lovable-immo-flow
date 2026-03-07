import { useState, useRef, useCallback, useEffect } from "react";
import { Headphones, Pause, Play, Loader2, Volume2 } from "lucide-react";

interface BlogAudioPlayerProps {
  audioUrl?: string | null;
  content?: string;
  title?: string;
}

export default function BlogAudioPlayer({ audioUrl, content, title }: BlogAudioPlayerProps) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanupInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupInterval();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startPlayback = useCallback(async (url: string) => {
    setState("loading");
    try {
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("ended", () => {
        setState("idle");
        setProgress(0);
        cleanupInterval();
      });

      audio.addEventListener("error", () => {
        setState("error");
      });

      await audio.play();
      setState("playing");

      intervalRef.current = setInterval(() => {
        if (audio.currentTime && audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      }, 200);
    } catch (err) {
      console.error("Audio playback error:", err);
      setState("error");
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (state === "playing") {
      audioRef.current.pause();
      setState("paused");
      cleanupInterval();
    } else if (state === "paused") {
      audioRef.current.play();
      setState("playing");
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      }, 200);
    }
  }, [state]);

  const handleClick = () => {
    if (state === "idle" || state === "error") {
      if (audioUrl) {
        startPlayback(audioUrl);
      }
    } else {
      togglePlayPause();
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // No audio available
  if (!audioUrl) {
    return (
      <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gray-50 text-gray-400 text-sm font-medium border border-gray-200">
        <Headphones className="w-4 h-4" />
        Áudio em breve...
      </div>
    );
  }

  const currentTime = audioRef.current?.currentTime || 0;

  if (state === "idle") {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors border border-blue-200"
      >
        <Headphones className="w-4 h-4" />
        Ouvir este artigo
      </button>
    );
  }

  if (state === "loading") {
    return (
      <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando áudio...
      </div>
    );
  }

  if (state === "error") {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors border border-red-200"
      >
        <Headphones className="w-4 h-4" />
        Erro — Tentar novamente
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 max-w-md">
      <button
        onClick={togglePlayPause}
        className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shrink-0"
      >
        {state === "playing" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="w-full bg-blue-200 rounded-full h-1.5 mb-1">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-blue-600 font-medium">
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
        </div>
      </div>
      <Volume2 className="w-4 h-4 text-blue-400 shrink-0" />
    </div>
  );
}
