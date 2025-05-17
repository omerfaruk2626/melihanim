"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export default function DeletedGallery() {
  const [deletedPhotos, setDeletedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeleted = async () => {
      try {
        const q = query(
          collection(db, "deletedPhotos"),
          orderBy("deletedAt", "desc")
        );
        const snapshot = await getDocs(q);
        const photoData = snapshot.docs.map((doc) => doc.data());
        setDeletedPhotos(photoData);
      } catch (err) {
        console.error("Silinen fotoğraflar alınamadı:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeleted();
  }, []);

  return (
    <div className="mt-12 border-t pt-6">
      <h2 className="text-xl font-bold text-center text-gray-700 mb-4">
        📍 Silinmiş Fotoğraflar (Yedek)
      </h2>
      {loading ? (
        <p className="text-center text-gray-500">Yedekler yükleniyor...</p>
      ) : deletedPhotos.length === 0 ? (
        <p className="text-center text-gray-400">Hiç silinmiş fotoğraf yok.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {deletedPhotos.map((photo, idx) => (
            <div
              key={idx}
              className="w-full aspect-square bg-white shadow rounded overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              <img
                src={photo.url || photo.originalUrl}
                alt={`Silinmis ${idx + 1}`}
                className="object-cover w-full h-full"
              />
              <div className="text-center text-xs text-gray-600 py-1">
                @{photo.originalUploader} •{" "}
                {new Date(photo.deletedAt?.seconds * 1000).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
