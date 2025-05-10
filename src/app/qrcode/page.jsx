"use client";
import { QRCode } from "qrcode.react";

export default function QRCodePage() {
  const uploadUrl = "https://melihanim.vercel.app/upload";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4 text-center">
        📸 Fotoğraf Yükleme Sayfası QR Kodu
      </h1>
      <QRCode value={uploadUrl} size={256} />
      <p className="mt-4 text-gray-600 text-center max-w-md">
        Aşağıdaki QR kodu telefonunuzla tarayarak fotoğraflarınızı kolayca
        yükleyebilirsiniz.
      </p>
    </div>
  );
}
