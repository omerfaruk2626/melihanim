"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LogoutIcon from "@mui/icons-material/Logout";

export default function HomePage() {
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

        <div className="flex flex-col sm:flex-row gap-6">
          <button
            onClick={() => router.push("/upload")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow transition"
          >
            📤 Fotoğraf Yükle
          </button>
          <button
            onClick={() => router.push("/gallery")}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow transition"
          >
            🖼️ Galeri
          </button>
        </div>
      </div>

      {isLoggedIn && (
        <button
          onClick={handleLogout}
          className="fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 shadow-lg flex items-center justify-center z-10"
          title="Çıkış Yap"
        >
          <LogoutIcon fontSize="large" />
        </button>
      )}
    </main>
  );
}
