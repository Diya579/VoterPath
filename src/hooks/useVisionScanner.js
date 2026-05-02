import { useState } from 'react';
import { auth } from '../firebase/config';

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
      // Get Firebase ID Token for backend verification
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be signed in to use the ID scanner.');
      }
      const token = await user.getIdToken();

      const formData = new FormData();
      formData.append('image', file);

      // Call our secure Node.js backend with Authorization header
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
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
