"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import LogoutIcon from "@mui/icons-material/Logout";
import dynamic from "next/dynamic";
const QRCodeClient = dynamic(() => import("@/components/QRCodeClient"), {
  ssr: false,
});

export default function HomePage() {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const qrRef = useRef(null);
  const uploadUrl = "https://melihanim.vercel.app/upload";
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const access = localStorage.getItem("galleryAccess");
    setIsLoggedIn(access === "true");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("galleryAccess");
    toast("Çıkış yapıldı");
    setIsLoggedIn(false);
  };

  return (
    <main
      className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-gray-50
             before:absolute before:inset-0 before:bg-[url('/bg.png')] 
             before:bg-cover before:bg-center before:blur-sm before:opacity-80 before:z-0"
    >
      <div className="relative z-10 flex flex-col items-center">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center mt-8 w-full max-w-4xl px-4">
          <button
            onClick={() => router.push("/upload")}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer whitespace-nowrap text-center"
          >
            📤 Fotoğraf Yükle
          </button>
          <button
            onClick={() => router.push("/gallery")}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer whitespace-nowrap text-center"
          >
            🖼️ Galeri
          </button>
          <button
            onClick={() => setQrModalOpen(true)}
            className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer whitespace-nowrap text-center"
          >
            📱 QR Kod ile Paylaş
          </button>
        </div>
      </div>

      {isLoggedIn && (
        <button
          onClick={handleLogout}
          className="fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-16 cursor-pointer h-16 shadow-lg flex items-center justify-center z-10"
          title="Çıkış Yap"
        >
          <LogoutIcon fontSize="large" />
        </button>
      )}
      {qrModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 shadow-xl text-center relative max-w-xs w-full border-4 border-yellow-400 "
          >
            <h2 className="text-lg font-bold mb-4">Yükleme QR Kodu</h2>

            <div ref={qrRef} className="mb-4 w-full justify-center flex">
              <QRCodeClient value={uploadUrl} size={256} />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() =>
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(uploadUrl)}`,
                    "_blank"
                  )
                }
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                WhatsApp ile Paylaş
              </button>
              <button
                onClick={() => {
                  const canvas = qrRef.current?.querySelector("canvas");
                  if (!canvas) return;
                  const url = canvas.toDataURL("image/png");
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "melihanim-qr.png";
                  a.click();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              >
                QR Kodu İndir
              </button>
            </div>

            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-xl"
              title="Kapat"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
