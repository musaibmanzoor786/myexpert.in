'use client';

import React, { useState } from 'react';
import { compressImage } from '../lib/image-compressor';

export default function ImageCompressorDemo() {
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setOriginalSize(file.size);

    try {
      const compressedBlob = await compressImage(file, 0.7);
      setCompressedSize(compressedBlob.size);
      console.log('Compressed:', compressedBlob);
    } catch (error) {
      console.error('Compression error:', error);
    }
  };

  return (
    <div className="p-4 border rounded shadow-sm max-w-sm">
      <h2 className="text-lg font-semibold mb-4">Compress Image</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" />
      {originalSize !== null && (
        <p>Original: {(originalSize / 1024).toFixed(2)} KB</p>
      )}
      {compressedSize !== null && (
        <p>Compressed: {(compressedSize / 1024).toFixed(2)} KB</p>
      )}
    </div>
  );
}
