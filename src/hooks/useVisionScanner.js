import { useState } from 'react';

export const useVisionScanner = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Scans a voter ID image.
   * @param {File} file 
   */
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
      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorMessage = 'Analysis failed. Please try again.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Fallback if response is not JSON
          errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setResult(data.result);
      
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj.message || 'Error processing image');
    } finally {
      setLoading(false);
    }
  };

  return { scanImage, loading, result, error };
};
