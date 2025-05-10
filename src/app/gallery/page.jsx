"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import Image from "next/image";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import toast from "react-hot-toast";
import { useMemo } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function GalleryPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [uploaders, setUploaders] = useState([]);
  const [selectedUploader, setSelectedUploader] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const access = localStorage.getItem("galleryAccess");
    setIsLoggedIn(access === "true");
    if (!access) router.push("/login");
  }, []);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const photoData = snapshot.docs.map((doc) => doc.data());

        setPhotos(photoData);
        setFilteredPhotos(photoData);

        const uniqueUploaders = [
          ...new Set(photoData.map((p) => p.uploaderName || "Bilinmiyor")),
        ];
        setUploaders(uniqueUploaders);
      } catch (err) {
        console.error("Fotoğraf verileri alınamadı:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  const slides = useMemo(
    () =>
      filteredPhotos.map((photo) => ({
        src: photo.url,
        alt: photo.uploaderName || "Fotoğraf",
      })),
    [filteredPhotos]
  );

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setSelectedUploader(value);
    if (value === "all") {
      setFilteredPhotos(photos);
    } else {
      const filtered = photos.filter(
        (p) => (p.uploaderName || "Bilinmiyor") === value
      );
      setFilteredPhotos(filtered);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("galleryAccess");
    toast("Çıkış yapıldı");
    setIsLoggedIn(false);
    router.push("/");
  };

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden
      before:absolute before:inset-0 before:bg-[url('/bg.png')] 
      before:bg-cover before:bg-center before:blur-sm before:opacity-70 before:z-0"
    >
      <div className="relative z-10 flex flex-col flex-1">
        <div className="sticky top-0 z-10 bg-gray-100/90 backdrop-blur p-4 shadow">
          <h1 className="text-2xl font-bold text-center text-gray-800">
            📸 Galerim
          </h1>
          <div className="mt-4 flex flex-col items-center">
            <label className="mb-2 font-semibold text-gray-700"></label>
            <select
              value={selectedUploader}
              onChange={handleFilterChange}
              className="border px-3 py-2 rounded w-64 text-gray-700"
            >
              <option value="all">🌐 Tüm Katılımcılar</option>
              {uploaders.map((name, idx) => (
                <option key={idx} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => router.push("/")}
            className="absolute top-3 left-3 cursor-pointer bg-white hover:bg-gray-100 text-blue-600 border border-gray-300 rounded-full w-12 h-12 shadow flex items-center justify-center"
            title="Anasayfa"
          >
            <HomeIcon fontSize="medium" />
          </button>
          {isLoggedIn && (
            <>
              <button
                onClick={handleLogout}
                className="absolute top-3 right-3 cursor-pointer bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 shadow flex items-center justify-center"
                title="Çıkış Yap"
              >
                <LogoutIcon fontSize="medium" />
              </button>
            </>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-gray-600">
              Fotoğraflar yükleniyor...
            </p>
          ) : filteredPhotos.length === 0 ? (
            <p className="text-center text-gray-500">
              Seçilen kişiye ait fotoğraf yok.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative w-full aspect-square bg-white shadow rounded overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                    onClick={() => {
                      setLightboxIndex(idx);
                      setLightboxOpen(true);
                    }}
                  >
                    <Image
                      src={photo.url}
                      alt={`Fotoğraf ${idx + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
              <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                index={lightboxIndex}
                slides={slides}
                on={{
                  view: ({ index }) => setLightboxIndex(index),
                }}
                render={{
                  slide: ({ slide, rect }) => (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={slide.src}
                        alt={slide.alt}
                        style={{
                          maxHeight: "90vh",
                          maxWidth: "100%",
                          objectFit: "contain",
                        }}
                      />
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-1 rounded-full text-sm">
                        {lightboxIndex + 1} / {slides.length} • @{slide.alt}
                      </div>
                    </div>
                  ),
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
