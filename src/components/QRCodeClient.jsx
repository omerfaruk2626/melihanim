"use client";
import { QRCodeCanvas } from "qrcode.react";

export default function QRCodeClient({ value, size = 180 }) {
  return <QRCodeCanvas value={value} size={size} />;
}
