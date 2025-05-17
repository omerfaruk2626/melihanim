"use client";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useEffect, useState } from "react";
import GalleryClient from "./GalleryClient";
import { useRouter } from "next/navigation";

export default function GalleryPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.replace("/login"); // ❗ replace kullanırsak "geri" tuşuyla login'e geri dönemez
      }
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [router]);

  // Auth kontrolü tamamlanmadan hiçbir şey gösterme
  if (!authChecked) return null;

  // Kullanıcı varsa galeriyi göster
  return <GalleryClient />;
}
