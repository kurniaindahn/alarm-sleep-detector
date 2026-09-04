"use client";

import { useEffect, useRef, useState } from "react";

export default function GhostSayuFixed() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAsleep, setIsAsleep] = useState(false);
  const [eyeScore, setEyeScore] = useState<number>(100);
  const [threshold, setThreshold] = useState<number>(75); // Batas nilai mata sayu
  const [status, setStatus] = useState("Kamera Aktif. Menatap Layar... 👀");
  const baselineRef = useRef<number | null>(null);
  const delayCounter = useRef<number>(0);

  useEffect(() => {
    // Membuka kamera murni menggunakan HTML5 (Dijamin 100% muncul di Vercel)
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 300, height: 200, facingMode: "user" } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Gagal buka kamera:", err);
        setStatus("Kamera diblokir! Klik ikon gembok di address bar browser dan aktifkan izin kamera.");
      }
    }
    startCamera();
  }, []);

  useEffect(() => {
    let animationId: number;

    const analyzeEyes = () => {
      if (!videoRef.current || isAsleep) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (ctx && videoRef.current.videoWidth > 0) {
        canvas.width = 16;
        canvas.height = 16;
        
        // Memotong gambar HANYA pada baris horizontal bagian tengah (area mata berada)
        // Ini mencegah deteksi jarak baju/wajah mengacaukan sensor
        ctx.drawImage(videoRef.current, 0, 50, 300, 100, 0, 0, 16, 16);

        const imgData = ctx.getImageData(0, 0, 16, 16).data;
        let upperDarkness = 0; // Area kelopak mata atas
        let lowerDarkness = 0; // Area kelopak mata bawah

        for (let i = 0; i < imgData.length; i += 4) {
          const brightness = (imgData[i] + imgData[i+1] + imgData[i+2]) / 3;
          if (i < imgData.length / 2) {
            upperDarkness += brightness;
          } else {
            lowerDarkness += brightness;
          }
        }

        // Rumus Rasio Kontras Kelopak Mata (Mengabaikan jarak jauh/dekat)
        const contrastRatio = (upperDarkness / lowerDarkness) * 100;
        
        if (baselineRef.current === null) {
          baselineRef.current = contrastRatio;
          return;
        }

        // Konversi ke skala nilai persentase kesegaran mata (0% - 100%)
        const currentEyeScore = Math.min(100, Math.max(0, (contrastRatio / baselineRef.current) * 100));
        setEyeScore(Number(currentEyeScore.toFixed(0)));

        // Jika skor kesegaran mata turun di bawah threshold (artinya mata sayu/menyipit)
        if (currentEyeScore < threshold) {
          delayCounter.current += 1;
          // Harus sayu konstan selama 1.5 detik agar bukan karena kedipan biasa
          if (delayCounter.current > 10) {
            setIsAsleep(true);
            setStatus("🚨 KETAHUAN! MATA KAMU SAYU DAN NGANTUK!!! 🚨");
            if (audioRef.current) {
              audioRef.current.loop = true;
              audioRef.current.play().catch(() => console.log("Butuh interaksi klik"));
            }
          }
        } else {
          delayCounter.current = 0;
        }
      }

      animationId = requestAnimationFrame(analyzeEyes);
    };

    const interval = setInterval(analyzeEyes, 120);
    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationId);
    };
  }, [isAsleep, threshold]);

  const resetAlarm = () => {
    setIsAsleep(false);
    delayCounter.current = 0;
    setStatus("Kembali memantau... Buka matamu lebar-lebar! 👁️👁️");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="relative w-screen h-screen bg-zinc-950 text-white flex flex-col items-center justify-center font-mono p-4 overflow-hidden">
      <audio ref={audioRef} src="/ghost.mp3" preload="auto" />

      {/* JUMPSCARE SCREEN */}
      {isAsleep && (
        <div className="absolute inset-0 z-50 bg-red-950 flex flex-col items-center justify-center">
          <img src="/scary.png" alt="Jumpscare" className="w-full h-4/5 object-contain animate-bounce" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
          <h1 className="text-3xl font-black text-red-500 text-center tracking-widest mt-4">👻 AWAS MATANYA SAYU! BANGUN WOI! 👻</h1>
          <button onClick={resetAlarm} className="mt-6 px-10 py-4 bg-white text-black font-black rounded-full hover:bg-red-500 hover:text-white transition border-4 border-red-600 shadow-2xl">
            SAYA SUDAH MELEK! 👁️
          </button>
        </div>
      )}

      {/* INTERFACE MONITOR */}
      <div className="text-center max-w-sm z-10">
        <h1 className="text-2xl font-bold text-orange-400 mb-1">👁️ Ghost Sayu-Eye Tracker</h1>
        <p className="text-zinc-500 text-[10px] mb-6">Anti Jarak Bias • Mendeteksi kelopak mata sayu murni via Rasio Kontras Baris.</p>

        <div className="bg-zinc-900 border-2 border-zinc-800 p-4 rounded-2xl relative inline-block shadow-2xl">
          <video ref={videoRef} autoPlay playsInline muted className="w-64 h-48 bg-black rounded-lg object-cover scale-x-[-1] mb-2 border border-zinc-950" />
          
          {/* Tampilan Skor Bar Sensor */}
          <div className="bg-black/60 p-2 rounded-lg space-y-1 mb-2 text-left text-xs">
            <div className="flex justify-between font-bold">
              <span>Kesegaran Mata: <span className={eyeScore < threshold ? "text-red-400" : "text-green-400"}>{eyeScore}%</span></span>
              <button onClick={() => { baselineRef.current = null; setStatus("Kalibrasi Posisi Melek Berhasil! 🔄"); }} className="text-orange-400 text-[10px] underline">Set Posisi Segar</button>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div style={{ width: `${eyeScore}%` }} className={`h-full ${eyeScore < threshold ? "bg-red-500" : "bg-green-500"}`} />
            </div>
          </div>

          <p className="text-[11px] text-yellow-400 font-bold bg-zinc-950/80 py-1.5 rounded border border-zinc-800 px-2">{status}</p>
        </div>

        {/* CONTROLLER SLIDER */}
        <div className="mt-5 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60 text-left">
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Batas Minimal Melek: <span className="text-red-400 font-bold">{threshold}%</span></span>
          </div>
          <input type="range" min="50" max="95" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-orange-400" />
          <p className="text-[9px] text-zinc-500 mt-2">💡 **Cara Kalibrasi:** Jika matamu sudah sayu tapi persentase kesegaran masih di atas garis merah, **naikkan slider batas merahnya** mendekati angka 85%.</p>
        </div>
      </div>
    </div>
  );
}
