"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { signOut } from "firebase/auth";
import { db, storage, auth } from "@/lib/firebaseConfig";
import Swal from "sweetalert2";
import { useInView } from "react-intersection-observer";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteIcon from "@mui/icons-material/Delete";
import toast from "react-hot-toast";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function GalleryClient() {
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [uploaders, setUploaders] = useState([]);
  const [selectedUploader, setSelectedUploader] = useState("all");
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 👇 lazy loading için eklendi
  const [visibleCount, setVisibleCount] = useState(2);
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const photoData = snapshot.docs.map((docSnap) => ({
          ...docSnap.data(),
          docId: docSnap.id,
        }));

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

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (inView && visibleCount < filteredPhotos.length) {
      setVisibleCount((prev) => prev + 10);
    }
  }, [inView, visibleCount, filteredPhotos.length]);

  const visiblePhotos = useMemo(
    () => filteredPhotos.slice(0, visibleCount),
    [filteredPhotos, visibleCount]
  );

  const handleLogout = async () => {
    await signOut(auth);
    toast("Çıkış yapıldı");
    router.push("/login");
  };

  const handleSoftDeletePhoto = async (photo) => {
    // İlk onay: kullanıcıya "emin misin" sorusu
    const firstConfirm = await Swal.fire({
      title: "Emin misin?",
      text: "Bu fotoğraf silinecek.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Evet, devam et",
      cancelButtonText: "İptal",
      confirmButtonColor: "#d33",
    });

    if (!firstConfirm.isConfirmed) return;

    // İkinci onay: kullanıcıya son kez sor
    const secondConfirm = await Swal.fire({
      title: "Emin misin?",
      text: "Son kararın mı?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Evet, sil",
      cancelButtonText: "Vazgeç",
      confirmButtonColor: "#d33",
    });

    if (!secondConfirm.isConfirmed) return;

    try {
      await addDoc(collection(db, "deletedPhotos"), {
        originalUrl: photo.url,
        deletedAt: new Date(),
        originalUploader: photo.uploaderName || "Bilinmiyor",
      });

      const path = decodeURIComponent(photo.url.split("/o/")[1].split("?")[0]);
      const photoRef = ref(storage, path);
      await deleteObject(photoRef);
      await deleteDoc(doc(db, "photos", photo.docId));

      toast.success("Silindi (yedek alındı)");
      setPhotos((prev) => prev.filter((p) => p.docId !== photo.docId));
      setFilteredPhotos((prev) => prev.filter((p) => p.docId !== photo.docId));
    } catch (err) {
      console.error("❌ Silme hatası:", err);
      toast.error("Silme başarısız oldu");
    }
  };

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
    const filtered =
      value === "all"
        ? photos
        : photos.filter((p) => (p.uploaderName || "Bilinmiyor") === value);
    setFilteredPhotos(filtered);
    setVisibleCount(20); // filtre değiştiğinde yeniden başlat
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden before:absolute before:inset-0 before:bg-[url('/bg.png')] before:bg-cover before:bg-center before:blur-sm before:opacity-70 before:z-0">
      <div className="relative z-10 flex flex-col flex-1">
        {/* Üst bar ve filtreler */}
        <div className="sticky top-0 z-10 bg-gray-100/90 backdrop-blur p-4 shadow">
          <h1 className="text-2xl font-bold text-center text-gray-800">
            📸 Galerim
          </h1>
          <div className="mt-4 flex flex-col items-center">
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
            className="absolute top-3 left-3 bg-white hover:bg-gray-100 text-blue-600 border border-gray-300 rounded-full w-12 h-12 shadow flex items-center justify-center cursor-pointer transition"
            title="Anasayfa"
          >
            <HomeIcon fontSize="medium" className="text-purple-600" />
          </button>
          <button
            onClick={handleLogout}
            className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 shadow flex items-center justify-center cursor-pointer transition"
            title="Çıkış Yap"
          >
            <LogoutIcon fontSize="medium" />
          </button>
        </div>

        {/* Fotoğraf grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-gray-600">
              Fotoğraflar yükleniyor...
            </p>
          ) : visiblePhotos.length === 0 ? (
            <p className="text-center text-gray-500">
              Seçilen kişiye ait fotoğraf yok.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {visiblePhotos.map((photo, idx) => (
                  <div
                    key={photo.docId}
                    className="relative w-full aspect-square bg-white shadow rounded overflow-hidden hover:shadow-lg transition-shadow duration-200 group"
                  >
                    <img
                      src={photo.url}
                      alt={`Fotoğraf ${idx + 1}`}
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-200 cursor-pointer"
                      onClick={() => {
                        setLightboxIndex(idx);
                        setLightboxOpen(true);
                      }}
                    />
                    <button
                      onClick={() => handleSoftDeletePhoto(photo)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100 cursor-pointer transition"
                      title="Sil"
                    >
                      <DeleteIcon fontSize="small" />
                    </button>
                  </div>
                ))}
              </div>

              {/* yükleme tetikleyici */}
              <div ref={loadMoreRef} className="h-10" />
              {visibleCount < filteredPhotos.length && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Daha fazla fotoğraf yükleniyor...
                </p>
              )}
            </>
          )}

          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            index={lightboxIndex}
            slides={slides}
            on={{
              view: ({ index }) => setLightboxIndex(index),
            }}
            render={{
              slide: ({ slide }) => (
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
        </div>
      </div>
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2 shadow-lg z-50 cursor-pointer"
          title="Yukarı Çık"
        >
          <KeyboardArrowUpIcon fontSize="medium" className="text-white" />
        </button>
      )}
    </div>
  );
}
