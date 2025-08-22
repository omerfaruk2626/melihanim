"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { where } from "firebase/firestore";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  addDoc,
  limit,
  startAfter,
} from "firebase/firestore";
import { updateDoc } from "firebase/firestore";

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
  const [items, setItems] = useState([]); // Fotoğraf ve video birlikte
  const [lastPhotoDoc, setLastPhotoDoc] = useState(null);
  const [hasMorePhotos, setHasMorePhotos] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploaders, setUploaders] = useState([]);
  const [selectedUploader, setSelectedUploader] = useState("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  // Fotoğraf ve video birlikte fetch
  const fetchItems = useCallback(async (reset = false, uploader = null) => {
    setLoadingMore(true);
    try {
      // Fotoğraflar
      let qPhotos;
      if (reset) {
        qPhotos = query(
          collection(db, "photos"),
          where("isDeleted", "==", false),
          orderBy("createdAt", "desc"),
          limit(10)
        );
      } else if (!reset && lastPhotoDoc) {
        qPhotos = query(
          collection(db, "photos"),
          where("isDeleted", "==", false),
          orderBy("createdAt", "desc"),
          startAfter(lastPhotoDoc),
          limit(10)
        );
      } else if (uploader && uploader !== "all") {
        qPhotos = query(
          collection(db, "photos"),
          where("isDeleted", "==", false),
          where("uploaderName", "==", uploader),
          orderBy("createdAt", "desc"),
          ...(reset ? [] : [startAfter(lastPhotoDoc)]),
          limit(10)
        );
      } else {
        qPhotos = query(
          collection(db, "photos"),
          where("isDeleted", "==", false),
          orderBy("createdAt", "desc"),
          limit(10)
        );
      }
      const snapshotPhotos = await getDocs(qPhotos);
      const photoData = snapshotPhotos.docs.map((docSnap) => ({
        ...docSnap.data(),
        docId: docSnap.id,
        type: "photo"
      }));

      let qVideos = query(
        collection(db, "videos"),
        where("isDeleted", "==", false),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      const snapshotVideos = await getDocs(qVideos);
      const videoData = snapshotVideos.docs.map((docSnap) => ({
        ...docSnap.data(),
        docId: docSnap.id,
        type: "video"
      }));

      // Birleştir ve tarihe göre sırala
      let allItems = [...photoData, ...videoData];
      allItems.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

      if (reset) {
        setItems(allItems);
      } else {
        setItems((prev) => [...prev, ...allItems]);
      }
      setLastPhotoDoc(snapshotPhotos.docs[snapshotPhotos.docs.length - 1] || null);
      setHasMorePhotos(snapshotPhotos.docs.length === 10);
      if (reset) {
        const uniqueUploaders = [
          ...new Set(allItems.map((p) => p.uploaderName || "Bilinmiyor")),
        ];
        setUploaders(uniqueUploaders);
      }
    } catch (err) {
      console.error("Veri alım hatası:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [lastPhotoDoc, loading, loadingMore]);

  // İlk açılışta
  useEffect(() => {
    setItems([]);
    setLastPhotoDoc(null);
    setHasMorePhotos(true);
    setLoading(true);
    fetchItems(true);
  }, []);

  // Scroll ile yeni batch
  useEffect(() => {
    if (inView && hasMorePhotos && !loading && !loadingMore) {
      fetchItems();
    }
  }, [inView, hasMorePhotos, loading, loadingMore, fetchItems]);

  // Filtreli gösterim için (uploader değişirse resetle)
  useEffect(() => {
    setItems([]);
    setLastPhotoDoc(null);
    setHasMorePhotos(true);
    setLoading(true);
    fetchItems(true, selectedUploader);
  }, [selectedUploader]);

  // Lightbox'ta son fotoğrafa gelince yeni batch çek
  useEffect(() => {
    if (
      lightboxOpen &&
      hasMorePhotos &&
      lightboxIndex >= items.length - 1 &&
      !loadingMore &&
      !loading
    ) {
      fetchItems();
    }
  }, [lightboxOpen, lightboxIndex, items.length, hasMorePhotos, loadingMore, loading, fetchItems]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    toast("Çıkış yapıldı");
    router.push("/login");
  };

  const handleSoftDeletePhoto = async (item) => {
    // 1. Onay
    const firstConfirm = await Swal.fire({
      title: item.type === "video" ? "Videoyu silmek istiyor musun?" : "Fotoğrafı silmek istiyor musun?",
      text: item.type === "video" ? "Bu video silinecek." : "Bu fotoğraf silinecek.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Evet, devam et",
      cancelButtonText: "İptal",
      confirmButtonColor: "#d33",
    });
    if (!firstConfirm.isConfirmed) return;
    // 2. Onay
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
      const collectionName = item.type === "video" ? "videos" : "photos";
      await updateDoc(doc(db, collectionName, item.docId), {
        isDeleted: true,
        deletedAt: new Date(),
      });
      toast.success(item.type === "video" ? "Video silindi." : "Fotoğraf silindi.");
      setItems((prev) => prev.filter((p) => p.docId !== item.docId));
    } catch (err) {
      console.error("Silme hatası:", err);
      toast.error("Silme başarısız oldu");
    }
  };

  const slides = useMemo(
    () =>
      items.map((item) =>
        item.type === "photo"
          ? { src: item.url, alt: item.uploaderName || "Fotoğraf", type: "photo" }
          : { src: item.url, alt: item.uploaderName || "Video", type: "video" }
      ),
    [items]
  );

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setSelectedUploader(value);
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden before:absolute before:inset-0 before:bg-[url('/bg.png')] before:bg-cover before:bg-center before:blur-sm before:opacity-70 before:z-0">
      <div className="relative z-10 flex flex-col flex-1">
        {/* Üst bar ve filtreler */}
        <div className="sticky top-0 z-10 bg-gray-100/90 backdrop-blur p-4 shadow">
          <h1 className="text-2xl font-bold text-center text-gray-800">📸 Galerim</h1>
          <div className="mt-4 flex flex-col items-center">
            <select
              value={selectedUploader}
              onChange={handleFilterChange}
              className="border px-3 py-2 rounded w-64 text-gray-700"
            >
              <option value="all">🌐 Tüm Katılımcılar</option>
              {uploaders.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
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
        {/* Fotoğraf ve video grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-gray-600">Fotoğraflar ve videolar yükleniyor...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-500">Seçilen kişiye ait içerik yok.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {items.map((item, idx) => (
                  <div
                    key={`${item.type}-${item.docId}`}
                    className="relative w-full aspect-square bg-white shadow rounded overflow-hidden hover:shadow-lg transition-shadow duration-200 group"
                  >
                    {item.type === "photo" ? (
                      <img
                        src={item.url}
                        alt={`Fotoğraf ${idx + 1}`}
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-200 cursor-pointer"
                        onClick={() => {
                          setLightboxIndex(idx);
                          setLightboxOpen(true);
                        }}
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
                        className="object-cover w-full h-full cursor-pointer"
                        onClick={() => {
                          setLightboxIndex(idx);
                          setLightboxOpen(true);
                        }}
                      />
                    )}
                    <button
                      onClick={() => handleSoftDeletePhoto(item)}
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
              {loadingMore && hasMorePhotos && (
                <p className="text-center text-sm text-gray-500 mt-4">Daha fazla içerik yükleniyor...</p>
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
                slide.type === "photo" ? (
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
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <video
                      src={slide.src}
                      controls
                      autoPlay
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
                )
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

