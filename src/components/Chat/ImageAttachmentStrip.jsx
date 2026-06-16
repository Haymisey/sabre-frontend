// src/components/Chat/ImageAttachmentStrip.jsx
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Renders a horizontal strip of image thumbnails with a remove button.
 * Props:
 *   images: array of { preview, status, file }
 *   onRemove(idx): callback to remove image at index
 */
export default function ImageAttachmentStrip({ images, onRemove }) {
  return (
    <div className="flex flex-wrap gap-2 p-2">
      {images.map((img, idx) => (
        <motion.div
          key={idx}
          className="relative rounded overflow-hidden border border-[var(--border)]"
          whileHover={{ scale: 1.02 }}
        >
          <img src={img.preview} alt="attachment" className="h-20 w-20 object-cover" />
          {img.status === 'no_text' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs text-white">
              No readable text
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute -top-2 -right-2 rounded-full bg-red-500/80 p-0.5 text-white"
            aria-label="Remove image"
          >
            <X size={12} />
          </button>
        </motion.div>
      ))}
    </div>
  );
}
