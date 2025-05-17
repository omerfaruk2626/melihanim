"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import {
  ref,
  getBlob,
  uploadBytes,
  deleteObject,
  getDownloadURL,
} from "firebase/storage";
import { signOut } from "firebase/auth";
import { db, storage, auth } from "@/lib/firebaseConfig";

import Image from "next/image";
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

  const handleLogout = async () => {
    await signOut(auth);
    toast("Çıkış yapıldı");
    router.push("/login");
  };

  const handleSoftDeletePhoto = async (photo) => {
    const confirmed = window.confirm("Bu fotoğrafı silmek istiyor musunuz?");
    if (!confirmed) return;

    try {
      // 1. Firestore'a yedekle (yalnızca metadata)
      await addDoc(collection(db, "deletedPhotos"), {
        originalUrl: photo.url,
        deletedAt: new Date(),
        originalUploader: photo.uploaderName || "Bilinmiyor",
      });

      // 2. Firebase Storage'dan sil
      const path = decodeURIComponent(photo.url.split("/o/")[1].split("?")[0]);
      const photoRef = ref(storage, path);
      await deleteObject(photoRef);

      // 3. Firestore'dan sil
      await deleteDoc(doc(db, "photos", photo.docId));

      // 4. UI güncelle
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
    if (value === "all") {
      setFilteredPhotos(photos);
    } else {
      const filtered = photos.filter(
        (p) => (p.uploaderName || "Bilinmiyor") === value
      );
      setFilteredPhotos(filtered);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden before:absolute before:inset-0 before:bg-[url('/bg.png')] before:bg-cover before:bg-center before:blur-sm before:opacity-70 before:z-0">
      <div className="relative z-10 flex flex-col flex-1">
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
            className="absolute top-3 left-3 bg-white hover:bg-gray-100 text-blue-600 border border-gray-300 rounded-full w-12 h-12 shadow flex items-center justify-center"
            title="Anasayfa"
          >
            <HomeIcon fontSize="medium" />
          </button>
          <button
            onClick={handleLogout}
            className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 shadow flex items-center justify-center"
            title="Çıkış Yap"
          >
            <LogoutIcon fontSize="medium" />
          </button>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredPhotos.map((photo, idx) => (
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
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100"
                    title="Sil"
                  >
                    <DeleteIcon fontSize="small" />
                  </button>
                </div>
              ))}
            </div>
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
    </div>
  );
}
