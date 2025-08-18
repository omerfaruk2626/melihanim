"use client";
import { useState, useRef } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { storage, db } from "@/lib/firebaseConfig";
import toast from "react-hot-toast";
import HomeIcon from "@mui/icons-material/Home";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [progresses, setProgresses] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [uploadFinished, setUploadFinished] = useState(false);
  const [uploaderName, setUploaderName] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const inputRef = useRef();
  const MAX_FILES = 50;
  const router = useRouter();

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const MAX_SIZE_MB = 10;

    const validFiles = selected.filter((file) => {
      const isValidType = allowedTypes.includes(file.type);
      const isValidSize = file.size <= MAX_SIZE_MB * 1024 * 1024;
      return isValidType && isValidSize;
    });

    if (validFiles.length !== selected.length) {
      toast.error(
        `Geçersiz dosya(lar) tespit edildi. Sadece JPG, PNG, WEBP formatında olmalı ve her bir dosya 10MB altında olmalı.`
      );
    }

    if (validFiles.length > MAX_FILES) {
      toast(
        `🔢 ${validFiles.length} fotoğraf seçtiniz. Sadece ilk ${MAX_FILES} tanesi yüklenecek.`,
        { icon: "⚠️" }
      );
    }

    const limitedFiles = validFiles.slice(0, MAX_FILES);

    setFiles(limitedFiles);
    setProgresses(new Array(limitedFiles.length).fill(0));
    setCompleted(new Array(limitedFiles.length).fill(false));
    setUploadFinished(false);
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = [...files];
    const updatedProgresses = [...progresses];
    const updatedCompleted = [...completed];

    updatedFiles.splice(index, 1);
    updatedProgresses.splice(index, 1);
    updatedCompleted.splice(index, 1);

    setFiles(updatedFiles);
    setProgresses(updatedProgresses);
    setCompleted(updatedCompleted);
  };

  const handleUploadAll = async () => {
    if (!uploaderName.trim()) {
      toast.error("Lütfen isminizi girin.");
      return;
    }

    toast("Yükleme başlatıldı...");
    const newProgresses = [...progresses];
    const newCompleted = [...completed];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `photos/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const percent = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            newProgresses[i] = percent;
            setProgresses([...newProgresses]);
          },
          (error) => {
            toast.error(`"${file.name}" yüklenemedi`);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("📤 getDownloadURL tamamlandı:", downloadURL);

              const docData = {
                url: downloadURL,
                createdAt: Timestamp.now(),
                uploaderName: uploaderName.trim(),
                isDeleted: false,
              };

              console.log("🧪 Firestore'a yazılacak:", docData);

              const docRef = await addDoc(collection(db, "photos"), docData);
              console.log("📸 Firestore'a eklendi:", docRef.id);

              newCompleted[i] = true;
              setCompleted([...newCompleted]);
              resolve();
            } catch (error) {
              console.error("❌ Firestore yazma hatası:", error);
              toast.error("Firestore kaydı başarısız");
              reject(error);
            }
          }
        );
      });
    }

    toast.success("Tüm fotoğraflar yüklendi!");
    setUploadFinished(true);
  };

  const resetAll = () => {
    setFiles([]);
    setProgresses([]);
    setCompleted([]);
    setUploaderName("");
    setUploadFinished(false);
    if (inputRef.current) inputRef.current.value = null;
  };

  return (
    <main
      className="relative min-h-screen p-6 text-purple-800 font-bold flex flex-col items-center overflow-hidden
             before:absolute before:inset-0 before:bg-[url('/bg.png')] 
             before:bg-cover before:bg-center before:blur-sm before:opacity-60 before:z-0"
    >
      <div className="relative z-10 flex flex-col items-center w-full">
        <h1 className="text-2xl text-gray-700 font-bold mb-4 text-center ">
          📤 Fotoğraf Yükle
        </h1>

        <button
          onClick={() => router.push("/")}
          className="fixed top-3 cursor-pointer left-3 bg-white hover:bg-gray-100 text-blue-600 border border-gray-300 rounded-full w-12 h-12 shadow flex items-center justify-center transition"
          title="Anasayfa"
        >
          <HomeIcon fontSize="medium" className="text-purple-600" />
        </button>
        <input
          type="text"
          placeholder="Adınız (zorunlu)"
          value={uploaderName}
          onChange={(e) => setUploaderName(e.target.value)}
          className="mb-4 text-xl bg-gray-300 border-4 border-purple-600  px-3 py-2 rounded w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-black"
        />

        {!uploadFinished && (
          <label
            htmlFor="photoInput"
            className="border-4 border-dashed border-purple-700 rounded-lg p-8 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 hover:text-gray-700 transition w-full max-w-2xl mb-6"
          >
            <p className=" font-medium text-black ">
              📂 Fotoğraf seçmek için tıklayın (en fazla {MAX_FILES} fotoğraf) 
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              id="photoInput"
              ref={inputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {files.length > 0 && !uploadFinished && (
          <>
            <button
              onClick={handleUploadAll}
              className="bg-purple-600 cursor-pointer hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              Fotoğrafları Kaydet
            </button>
            <p className="mt-2 text-sm text-purple-700 font-semibold">
              📷 Seçilen fotoğraf sayısı: {files.length} / {MAX_FILES}
            </p>
          </>
        )}

        {files.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 w-full mt-3 max-w-6xl">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="relative border rounded shadow-sm p-2 bg-white flex flex-col items-center"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`preview-${idx}`}
                  onClick={() => setSelectedImage(URL.createObjectURL(file))}
                  className="w-full h-32 object-cover rounded cursor-pointer"
                />
                <p className="mt-2 text-[10px] text-black text-center break-all">
                  {file.name}
                </p>

                <div className="w-full bg-gray-200 h-2 rounded mt-1">
                  <div
                    className={`h-2 rounded ${
                      completed[idx]
                        ? "bg-green-500"
                        : "bg-blue-500 animate-pulse"
                    }`}
                    style={{ width: `${progresses[idx]}%` }}
                  ></div>
                </div>
                {completed[idx] && (
                  <div className="text-green-600 font-bold text-sm mt-1 flex items-center gap-1">
                    ✔️ <span>Yüklendi</span>
                  </div>
                )}

                {!uploadFinished && (
                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute cursor-pointer top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
                    title="Sil"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {uploadFinished && (
          <button
            onClick={resetAll}
            className="bg-green-600 cursor-pointer hover:bg-green-700 text-white px-6 py-2 rounded"
          >
            🔄 Yeni Fotoğraf Yükle
          </button>
        )}
        {selectedImage && (
          <div
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-zoom-out"
          >
            <img
              src={selectedImage}
              alt="preview"
              className="max-w-full max-h-full rounded shadow-xl"
            />
          </div>
        )}
      </div>
    </main>
  );
}
