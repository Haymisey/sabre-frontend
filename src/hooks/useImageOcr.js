// src/hooks/useImageOcr.js
import { useState, useCallback, useRef } from 'react';
import { extractTextFromImage } from '../services/ocrService';
import { extractTextFromPdf } from '../services/pdfService';

/**
 * Hook to manage image and PDF uploads with text extraction.
 * Each file goes through statuses: 'pending' → 'done' | 'no_text'
 *
 * Returns:
 *   images        - array of { file, preview, status, text }
 *   addFiles(files: FileList) - adds files as 'pending', runs extraction in background.
 *   removeImage(index)        - removes an image from the list.
 *   clearImages()             - clears all images and revokes object URLs.
 */
export function useImageOcr() {
  const [images, setImages] = useState([]);
  // Use a ref to assign stable per-image IDs so we can update the right entry
  const idCounter = useRef(0);

  const addFiles = useCallback((fileList) => {
    const newFiles = Array.from(fileList).filter((f) =>
      f.type.startsWith('image/') || f.type === 'application/pdf'
    );

    if (!newFiles.length) return;

    // 1️⃣ Immediately add all files with status 'pending' so thumbnails appear right away
    const entries = newFiles.map((file) => {
      const isPdf = file.type === 'application/pdf';
      return {
        id: ++idCounter.current,
        file,
        preview: isPdf ? null : URL.createObjectURL(file),
        status: 'pending',
        text: null,
      };
    });

    setImages((prev) => [...prev, ...entries]);

    // 2️⃣ Run extraction for each file in parallel and update its entry in-place
    entries.forEach(async (entry) => {
      const isPdf = entry.file.type === 'application/pdf';
      const text = isPdf
        ? await extractTextFromPdf(entry.file)
        : await extractTextFromImage(entry.file);
      const status = text ? 'done' : 'no_text';

      setImages((prev) =>
        prev.map((img) =>
          img.id === entry.id ? { ...img, status, text: text ?? null } : img
        )
      );
    });
  }, []);

  const removeImage = useCallback((idx) => {
    setImages((prev) => {
      const copy = [...prev];
      const removed = copy.splice(idx, 1)[0];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  }, []);

  const clearImages = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
      return [];
    });
  }, []);

  return { images, addFiles, removeImage, clearImages };
}
