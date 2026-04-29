import { useState } from 'react';

export const useVisionScanner = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const scanImage = async (file) => {
    // Client-side validation: Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be under 2MB.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Call our secure Node.js backend instead of exposing the API key
      const response = await fetch('http://localhost:3000/api/scan', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setResult(data.result);
      
    } catch (err) {
      setError(err.message || 'Error processing image');
    } finally {
      setLoading(false);
    }
  };

  return { scanImage, loading, result, error };
};
