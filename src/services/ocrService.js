// src/services/ocrService.js
/**
 * Calls the local Ollama server (glm-ocr) to extract text from an image.
 * The function expects a File (image) and returns the extracted text string.
 * If the model returns an empty string or an error occurs, null is returned.
 */
export async function extractTextFromImage(file) {
  // Convert the file to a base64 string
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]); // remove data:...;base64,
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  const payload = {
    model: 'glm-ocr',
    prompt: 'Extract all text from this image',
    stream: false,
    images: [base64],
  };

  try {
    const response = await fetch('http://172.20.40.253:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('OCR request failed', response.status);
      return null;
    }
    const data = await response.json();
    // Ollama returns { response: 'text...' }
    const text = data.response ?? '';
    return text.trim() ? text.trim() : null;
  } catch (err) {
    console.error('OCR error', err);
    return null;
  }
}
