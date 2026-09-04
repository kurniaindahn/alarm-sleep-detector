"use client";

import { useEffect, useRef, useState } from "react";

export default function AlarmAIEyeTracker() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAsleep, setIsAsleep] = useState(false);
  const [eyeDistance, setEyeDistance] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(12); // Batas mata sayu (dalam pixel)
  const [status, setStatus] = useState("Memuat AI Tracker Google... Mohon tunggu 💀");
  const [aiLoaded, setAiLoaded] = useState(false);

  useEffect(() => {
    // 1. Memuat Script MediaPipe Face Mesh Secara Dinamis langsung ke Browser
    const scriptFaceMesh = document.createElement("script");
    scriptFaceMesh.src = "https://jsdelivr.net";
    scriptFaceMesh.async = true;
    document.head.appendChild(scriptFaceMesh);

    const scriptCamera = document.createElement("script");
    scriptCamera.src = "https://jsdelivr.net";
    scriptCamera.async = true;
    document.head.appendChild(scriptCamera);

    scriptCamera.onload = () => {
      setAiLoaded(true);
      setStatus("AI Siap! Berikan izin webcam... 👀");
      initAI();
    };

    let camera: any = null;

    function initAI() {
      if (typeof (window as any).FaceMesh === "undefined") {
        setTimeout(initAI, 500);
        return;
      }

      // 2. Konfigurasi Detektor Wajah & Mata
      const faceMesh = new (window as any).FaceMesh({
        locateFile: (file: string) => `https://jsdelivr.net{file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true, // WAJIB TRUE untuk melacak koordinat pupil & kelopak mata detail
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results: any) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
          setStatus("Wajah tidak terdeteksi! Hadapkan wajah ke kamera.");
          return;
        }

        setStatus("AI Aktif. Menatap Layar... Safe! ✅");
        const landmarks = results.multiFaceLandmarks[0];

        // Titik Koordinat Kelopak Mata Atas & Bawah (Standard MediaPipe Index)
        // Mata Kanan: Atas (159), Bawah (145)
        const pTop = landmarks[159];
        const pBottom = landmarks[145];

        if (pTop && pBottom) {
          // Menghitung jarak vertikal murni kelopak mata (dikali 300 untuk konversi skala pixel layar)
          const distance = Math.abs(pTop.y - pBottom.y) * 300;
          setEyeDistance(Number(distance.toFixed(1)));

          // JIKA JARAK KELOPAK MATA LEBIH KECIL DARI THRESHOLD = MATA SAYU/NGANTUK!
          if (distance < threshold) {
            setIsAsleep(true);
            setStatus("🚨 MATA KAMU SAYU / MEREM!!! BANGUN!!! 🚨");
            if (audioRef.current) {
              audioRef.current.loop = true;
              audioRef.current.play().catch(() => console.log("Izin audio browser dibutuhkan"));
            }
          }
        }
      });

      // 3. Menyalakan Webcam Laptop
      if (videoRef.current) {
        camera = new (window as any).Camera(videoRef.current, {
          onFrame: async () => {
            await faceMesh.send({ image: videoRef.current! });
          },
          width: 320,
          height: 240,
        });
        camera.start().catch(() => setStatus("Gagal akses kamera! Centang izin browser."));
      }
    }

    return () => {
      if (camera) camera.stop();
    };
  }, [threshold, isAsleep]);

  const bangunkanUser = () => {
    setIsAsleep(false);
    setStatus("Kembali memantau... Buka mata lebar-lebar! 👁️👁️");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black text-white flex flex-col items-center justify-center font-mono p-4 overflow-hidden">
      <audio ref={audioRef} src="/ghost.mp3" preload="auto" />

      {/* JUMPSCARE SCREEN */}
      {isAsleep && (
        <div className="absolute inset-0 z-50 bg-red-950 flex flex-col items-center justify-center animate-pulse">
          <img src="/scary.png" alt="Jumpscare" className="w-full h-5/6 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
          <h1 className="text-4xl font-black text-red-500 text-center mt-4">👻 AWAS JANGAN SAYU! BANGUN! 👻</h1>
          <button onClick={bangunkanUser} className="mt-6 px-10 py-4 bg-white text-black font-black rounded-full hover:bg-red-500 hover:text-white transition-all shadow-2xl border-4 border-red-600 text-lg">
            SAYA SUDAH MELEK! 👁️
          </button>
        </div>
      )}

      {/* MAIN MONITOR INTERFACE */}
      <div className="text-center max-w-lg z-10">
        <h1 className="text-2xl font-bold text-teal-400 mb-1">🤖 AI Ghost Eye-Sayu Tracker</h1>
        <p className="text-zinc-500 text-xs mb-6">Mendeteksi kerenggangan kelopak mata secara real-time via Google MediaPipe.</p>

        <div className="bg-zinc-900 border-2 border-zinc-700 p-4 rounded-2xl relative inline-block">
          <video ref={videoRef} autoPlay playsInline muted className="w-72 h-54 bg-black rounded-lg object-cover scale-x-[-1] mb-2" />
          
          {/* Nilai Sensor Jarak Kelopak Mata */}
          <div className="flex justify-between bg-black/80 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 mb-2">
            <span>Bukaan Kelopak Mata: <span className="text-yellow-400">{eyeDistance} px</span></span>
            <span>Batas Sayu: <span className="text-red-400">{threshold} px</span></span>
          </div>
          
          <p className="text-xs text-teal-300 font-bold bg-zinc-950 py-1 rounded px-2 border border-zinc-800">{status}</p>
        </div>

        {/* SETTING AMBANG BATAS SAYU */}
        <div className="mt-6 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 text-left">
          <label className="text-xs text-zinc-400 block mb-1 font-bold">Atur Batas Toleransi Sayu (Threshold):</label>
          <input type="range" min="6" max="20" step="0.5" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-teal-400" />
          
          <div className="text-[10px] text-zinc-500 mt-2 space-y-1">
            <p>💡 **Cara Kalibrasi saat Demo Hackathon:**</p>
            <p>1. Lihat angka <span className="text-yellow-400">"Bukaan Kelopak Mata"</span> saat kamu melek segar (misal muncul angka 15).</p>
            <p>2. Coba buat mata sayu/ngantuk, lihat angkanya turun jadi berapa (misal turun ke 11).</p>
            <p>3. Geser slider ke angka **12** (di antara nilai melek dan nilai sayumu).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
