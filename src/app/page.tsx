"use client";

import { useEffect, useRef, useState } from "react";

export default function AlarmSleepDetector() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAsleep, setIsAsleep] = useState(false);
  const [sensitivity, setSensitivity] = useState(60); // Ambang batas deteksi ngantuk
  const lastBrightnessRef = useRef<number | null>(null);
  const [status, setStatus] = useState("Kamera Aktif. Jangan Tidur... 💀");

  useEffect(() => {
    // 1. Meminta izin akses webcam di browser
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Webcam diblokir!", err);
        setStatus("Gagal Akses Kamera! Berikan izin webcam di browser.");
      }
    }
    initCamera();
  }, []);

  // 2. Fungsi deteksi mata menyipit / kepala tertunduk (Ngantuk)
  useEffect(() => {
    let animationId: number;

    const trackDrowsiness = () => {
      if (!videoRef.current || isAsleep) {
        animationId = requestAnimationFrame(trackDrowsiness);
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx && videoRef.current.videoWidth > 0) {
        canvas.width = 20;
        canvas.height = 20;
        ctx.drawImage(videoRef.current, 0, 0, 20, 20);

        const imgData = ctx.getImageData(0, 0, 20, 20).data;
        let brightnessTotal = 0;

        // Membaca intensitas cahaya dari pixel wajah
        for (let i = 0; i < imgData.length; i += 4) {
          brightnessTotal += (imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3;
        }
        const avgBrightness = brightnessTotal / 400;

        if (lastBrightnessRef.current !== null) {
          const change = lastBrightnessRef.current - avgBrightness;

          // Jika mata tertutup lama atau kepala menunduk, tingkat kecerahan pixel wajah drop drastis
          if (change > sensitivity) {
            setIsAsleep(true);
            setStatus("🚨 KAMU KETAHUAN NGANTUK!!! 🚨");
            if (audioRef.current) {
              audioRef.current.loop = true;
              audioRef.current.play().catch(e => console.log("Izin audio browser dibutuhkan"));
            }
          }
        }
        lastBrightnessRef.current = avgBrightness;
      }

      animationId = requestAnimationFrame(trackDrowsiness);
    };

    const interval = setInterval(trackDrowsiness, 100);
    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationId);
    };
  }, [isAsleep, sensitivity]);

  // Fungsi untuk mematikan hantu dan mereset sistem
  const bangunkanUser = () => {
    setIsAsleep(false);
    setStatus("Sistem kembali memantau... Jangan merem lagi! 👁️👁️");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black text-white flex flex-col items-center justify-center font-mono p-4 overflow-hidden">
      
      {/* Audio Element Tersembunyi untuk Suara Hantu */}
      <audio ref={audioRef} src="/ghost.mp3" preload="auto" />

      {/* TAMPILAN JUMPSCARE HANTU SAAT USER NGANTUK */}
      {isAsleep && (
        <div className="absolute inset-0 z-50 bg-red-950 flex flex-col items-center justify-center animate-ping-once">
          <img 
            src="/scary.png" 
            alt="Jumpscare Hantu" 
            className="w-full h-5/6 object-contain animate-bounce"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
          />
          <h1 className="text-5xl font-black text-red-500 tracking-widest text-center animate-pulse mt-4">
            👻 BANGUN WOI!!! HAHAHAHA! 👻
          </h1>
          <button 
            onClick={bangunkanUser}
            className="mt-6 px-8 py-4 bg-white text-black font-extrabold text-xl rounded-full hover:bg-red-500 hover:text-white transition shadow-lg border-4 border-red-600 animate-pulse"
          >
            SAYA SUDAH BANGUN! (Ampun) 🙏
          </button>
        </div>
      )}

      {/* TAMPILAN MONITORING UTAMA */}
      <div className="text-center max-w-lg z-10">
        <h1 className="text-3xl font-bold text-emerald-400 mb-2">👁️ Anti-Sleep Ghost Tracker</h1>
        <p className="text-gray-400 text-xs mb-6">Aplikasi pendeteksi kantuk berbasis AI pixel tracking untuk ujian/kerja anti ngantuk.</p>

        {/* Kotak Kamera */}
        <div className="bg-zinc-900 border-2 border-zinc-700 p-4 rounded-2xl shadow-2xl relative inline-block">
          <div className="absolute top-6 left-6 bg-red-600 text-[10px] px-2 py-0.5 rounded font-bold animate-pulse">LIVE</div>
          <video ref={videoRef} autoPlay playsInline muted className="w-72 h-56 bg-black rounded-lg object-cover scale-x-[-1] mb-3 border border-zinc-800" />
          <p className="text-xs text-amber-400 font-bold bg-black/40 py-1 rounded">{status}</p>
        </div>

        {/* Pengaturan Sensitivitas (Bisa digeser biar pas deteksinya) */}
        <div className="mt-6 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
          <label className="text-xs text-gray-400 block mb-1">Sensitivitas Deteksi Kantuk: {sensitivity}</label>
          <input 
            type="range" min="30" max="90" value={sensitivity} 
            onChange={(e) => setSensitivity(Number(e.target.value))} 
            className="w-full accent-emerald-400"
          />
          <span className="text-[10px] text-zinc-500 block mt-1">*Makin kecil angkanya, makin sensitif mendeteksi mata sayu.</span>
        </div>
      </div>

      {/* Dekorasi Estetika ala Hacker */}
      <div className="absolute bottom-4 left-4 text-[10px] text-zinc-600">SYSTEM_STATUS: SECURE_RUNNING_NEXTJS</div>
      <div className="absolute bottom-4 right-4 text-[10px] text-zinc-600">ALARM_TYPE: GHOST_SOUND_ACTIVE</div>
    </div>
  );
}
