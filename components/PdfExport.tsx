"use client";

import { useEffect } from "react";

export default function PdfExport() {
  useEffect(() => {
    const handleExport = async () => {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("pdf-content");
      if (element) {
        html2pdf().from(element).save();
      }
    };

    const button = document.getElementById("export-btn");
    if (button) {
      button.addEventListener("click", handleExport);
    }

    return () => {
      if (button) {
        button.removeEventListener("click", handleExport);
      }
    };
  }, []);

  return null;
}
