"use client";

import { useEffect, useRef, useState } from "react";

export default function AlarmSayuDetector() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAsleep, setIsAsleep] = useState(false);
  const [sensitivity, setSensitivity] = useState(25); // Standar sensitivitas mata sayu
  const [status, setStatus] = useState("Kamera Aktif. Menatap Layar... 👀");
  const baseBrightnessRef = useRef<number | null>(null);
  const consecutiveSayuCount = useRef<number>(0);

  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Gagal akses kamera:", err);
        setStatus("Gagal Akses Kamera! Berikan izin di browser.");
      }
    }
    initCamera();
  }, []);

  useEffect(() => {
    let animationId: number;

    const trackSayuEyes = () => {
      if (!videoRef.current || isAsleep) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx && videoRef.current.videoWidth > 0) {
        // Perkecil grid analisis ke 8x8 pixel tepat di area tengah (fokus ke area mata/wajah)
        canvas.width = 8;
        canvas.height = 8;
        ctx.drawImage(videoRef.current, 2, 2, 4, 4, 0, 0, 8, 8);

        const imgData = ctx.getImageData(0, 0, 8, 8).data;
        let currentBrightness = 0;

        // Hitung kecerahan rata-rata dari grid wajah
        for (let i = 0; i < imgData.length; i += 4) {
          currentBrightness += (imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3;
        }
        currentBrightness = currentBrightness / 64;

        // Ambil data kecerahan awal saat pengguna pertama kali melek sebagai acuan dasar (Baseline)
        if (baseBrightnessRef.current === null) {
          baseBrightnessRef.current = currentBrightness;
          return;
        }

        // Jika mata menyipit/sayu, bayangan kelopak mata membuat nilai kecerahan drop dari kondisi melek dasar
        const brightnessDrop = baseBrightnessRef.current - currentBrightness;

        if (brightnessDrop > sensitivity) {
          consecutiveSayuCount.current += 1;
          // Jika mata terdeteksi sayu berturut-turut selama ~1.5 detik (menghindari kedipan normal)
          if (consecutiveSayuCount.current > 8) {
            setIsAsleep(true);
            setStatus("🚨 MATA KAMU SAYU / NGANTUK!!! 🚨");
            if (audioRef.current) {
              audioRef.current.loop = true;
              audioRef.current.play().catch(() => console.log("Butuh klik user untuk audio"));
            }
          }
        } else {
          // Jika mata kembali segar/melek, reset hitungan sayu
          consecutiveSayuCount.current = 0;
          // Adaptasi perlahan terhadap perubahan cahaya ruangan yang alami
          baseBrightnessRef.current = baseBrightnessRef.current * 0.95 + currentBrightness * 0.05;
        }
      }
      animationId = requestAnimationFrame(trackSayuEyes);
    };

    const interval = setInterval(trackSayuEyes, 150);
    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationId);
    };
  }, [isAsleep, sensitivity]);

  const bangunkanUser = () => {
    setIsAsleep(false);
    consecutiveSayuCount.current = 0;
    setStatus("Kembali memantau... Buka mata lebar-lebar! 👁️👁️");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black text-white flex flex-col items-center justify-center font-mono p-4 overflow-hidden">
      <audio ref={audioRef} src="/ghost.mp3" preload="auto" />

      {isAsleep && (
        <div className="absolute inset-0 z-50 bg-red-950 flex flex-col items-center justify-center">
          <img src="/scary.png" alt="Jumpscare" className="w-full h-5/6 object-contain animate-bounce" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
          <h1 className="text-4xl font-black text-red-500 text-center animate-pulse mt-4">👻 AWAS JANGAN SAYU! BANGUN! 👻</h1>
          <button onClick={bangunkanUser} className="mt-6 px-8 py-3 bg-white text-black font-extrabold rounded-full hover:bg-red-500 hover:text-white transition shadow-lg border-4 border-red-600">Saya Sudah Melek! 👁️</button>
        </div>
      )}

      <div className="text-center max-w-lg z-10">
        <h1 className="text-2xl font-bold text-orange-400 mb-1">👁️ Ghost Sayu-Eyes Tracker</h1>
        <p className="text-zinc-500 text-xs mb-6">Mendeteksi mata menyipit atau redup sebelum kamu tertidur lelap.</p>

        <div className="bg-zinc-900 border-2 border-zinc-700 p-4 rounded-2xl relative inline-block">
          <video ref={videoRef} autoPlay playsInline muted className="w-72 h-54 bg-black rounded-lg object-cover scale-x-[-1] mb-2" />
          <p className="text-xs text-yellow-400 font-bold bg-black/60 py-1 rounded px-2">{status}</p>
        </div>

        <div className="mt-6 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Sensitivitas Mata Sayu: {sensitivity}</span>
            <button onClick={() => { baseBrightnessRef.current = null; setStatus("Kalibrasi Ulang Sukses! 🔄"); }} className="text-orange-400 underline text-[10px]">Set Ulang Posisi Melek</button>
          </div>
          <input type="range" min="10" max="50" value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))} className="w-full accent-orange-400" />
          <span className="text-[10px] text-zinc-500 block mt-1">*Makin kecil angkanya, makin sensitif mendeteksi mata yang menyipit sedikit.</span>
        </div>
      </div>
    </div>
  );
}
