import { useState } from 'react';
import { auth } from '../firebase/config';

/**
 * @typedef {Object} VisionResult
 * @property {string} [epic]
 * @property {boolean} [epicValid]
 * @property {string} [name]
 * @property {string} [gender]
 * @property {string} [address]
 * @property {string} [pollingStation]
 * @property {string} [pollingStationAddress]
 * @property {string} [constituency]
 * @property {string} [detectedRegion]
 * @property {string} [nearestBooth]
 * @property {any} [election]
 * @property {any} [meta]
 */

export const useVisionScanner = () => {
  const [loading, setLoading] = useState(false);
  /** @type {[VisionResult | null, import('react').Dispatch<import('react').SetStateAction<VisionResult | null>>]} */
  // @ts-ignore
  const [result, setResult] = useState(null);
  /** @type {[string | null, import('react').Dispatch<import('react').SetStateAction<string | null>>]} */
  // @ts-ignore
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
      // Best-effort token retrieval (fails gracefully if anonymous auth is restricted)
      let token = null;
      try {
        const user = auth.currentUser;
        if (user) {
          token = await user.getIdToken();
        }
      } catch (authErr) {
        console.warn('[Auth] Token retrieval failed, falling back to Origin-based security.');
      }

      const formData = new FormData();
      formData.append('image', file);

      // Call our secure Node.js backend
      const fetchOptions = {
        method: 'POST',
        headers: {},
        body: formData
      };

      if (token) {
        fetchOptions.headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/scan', fetchOptions);

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
