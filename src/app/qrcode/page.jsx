"use client";
import QRCode from "react-qr-code";

export default function QRCodePage() {
  const uploadUrl = "https://kadikuyusu.com/upload";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">
        📸 Yükleme Sayfası QR Kodu
      </h1>
      <div className="bg-white p-6 rounded shadow">
        <QRCode value={uploadUrl} size={256} />
      </div>
      <p className="mt-4 text-gray-700 max-w-md text-center">
        Telefonunuzla QR kodu tarayarak kolayca fotoğraf yükleyebilirsiniz.
      </p>
    </div>
  );
}
