"use client";
import QRCode from "qrcode.react";

export default function QRCodePage() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-xl mb-4 font-bold">QR Kod ile Yükle</h1>
      <QRCode value="https://senin-site-urlin.com/upload" size={256} />
    </div>
  );
}
