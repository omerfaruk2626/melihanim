"use client";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useEffect, useState } from "react";
import GalleryClient from "./GalleryClient";
import DeletedGallery from "./DeletedGallery"; // Yeni bileşen eklenecek

export default function GalleryPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return null;
  if (!user) return null;

  return (
    <div>
      <GalleryClient />
    </div>
  );
}
