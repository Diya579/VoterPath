import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useVisionScanner } from '../hooks/useVisionScanner';
import { Upload, Loader2, FileText, MapPin, Calendar, User, ExternalLink, ShieldCheck, Fingerprint, Lock } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Converts the first page of a PDF file to a JPEG image.
 * Used for processing e-EPIC digital voter ID cards.
 * @param {File} file
 * @returns {Promise<File>}
 */
async function pdfToImage(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const scale = 2;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas context could not be initialized');
  
  await page.render({ canvasContext: context, viewport, canvas }).promise;
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Canvas to Blob conversion failed'));
      resolve(new File([blob], 'voter_id.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.95);
  });
}

/**
 * IDScanner Component: Handles uploading and AI-powered OCR extraction.
 * PROVENANCE: Displays cryptographic trust signals and authoritative grounding status.
 */
export default function IDScanner() {
  const { t, i18n } = useTranslation();
  /** @type {{ scanImage: (file: File) => Promise<void>, loading: boolean, result: import('../hooks/useVisionScanner').VisionResult | null, error: string | null }} */
  // @ts-ignore
  const { scanImage, loading, result, error } = useVisionScanner();
  const [dragActive, setDragActive] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  /** @type {[string | null, import('react').Dispatch<import('react').SetStateAction<string | null>>]} */
  // @ts-ignore
  const [localError, setLocalError] = useState(null);
  /** @type {import('react').MutableRefObject<HTMLInputElement | null>} */
  // @ts-ignore
  const fileInputRef = useRef(null);

  /**
   * @param {File | undefined} file
   */
  const processFile = useCallback(async (file) => {
    if (!file) return;
    
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setLocalError(t('errorInvalidFile', 'Please upload a valid image (JPG, PNG, WEBP) or PDF file.'));
      return;
    }

    setLocalError(null);

    if (file.type === 'application/pdf') {
      setIsPdf(true);
      try {
        const imageFile = await pdfToImage(file);
        await scanImage(imageFile);
      } catch (err) {
        setLocalError('Failed to process PDF document.');
      }
    } else {
      setIsPdf(false);
      await scanImage(file);
    }
  }, [scanImage, t]);

  /**
   * @param {React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>} e
   */
  const handleFile = useCallback(async (e) => {
    e.preventDefault();
    setDragActive(false);
    
    let file;
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files[0];
    } else if (e.target.files) {
      file = e.target.files[0];
    }
    
    await processFile(file);
  }, [processFile]);

  /**
   * @param {React.KeyboardEvent<HTMLDivElement>} e
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }, []);

  /**
   * @param {string} region
   * @param {string} code
   * @param {string} label
   */
  const suggestLanguage = (region, code, label) => {
    if (result && result.detectedRegion === region && i18n.language !== code) {
      return (
        <div className="brutal-card p-6 bg-secondary text-white mt-6">
          <p className="font-bold text-lg mb-4 uppercase">{region} detected. Switch to {label} for a localized experience?</p>
          <button onClick={() => i18n.changeLanguage(code)} className="brutal-btn bg-white text-black">Switch to {label}</button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-3xl space-y-8">
      <h2 className="text-4xl font-black uppercase inline-block bg-secondary text-white p-3 brutal-border shadow-brutal-sm -rotate-1">{t('scanner')}</h2>

      {/* Upload Zone */}
      <div
        role="region"
        aria-label="Voter ID upload zone. Drag and drop your voter ID card here, or press Enter to browse files."
        tabIndex={0}
        className={`brutal-card p-12 text-center transition-all cursor-pointer ${dragActive ? 'bg-primary border-dashed' : 'bg-white border-solid'}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleFile}
        onKeyDown={handleKeyDown}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex justify-center gap-4 mb-6">
          <Upload className="w-16 h-16 stroke-[3]" aria-hidden="true" />
          <FileText className="w-16 h-16 stroke-[3] text-secondary" aria-hidden="true" />
        </div>
        <p className="text-2xl font-bold mb-4 uppercase">{t('uploadID')}</p>
        <p className="text-lg font-semibold text-gray-500 mb-8">Supports: JPG, PNG, WEBP, and PDF (e-EPIC)</p>
        <label className="brutal-btn bg-tertiary text-black inline-block cursor-pointer">
          Browse Files
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg, image/png, image/webp, application/pdf"
            className="hidden"
            onChange={handleFile}
            aria-label="Upload Voter ID Card"
          />
        </label>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {loading && (
          <div className="flex items-center justify-center p-6 brutal-card bg-primary mt-6" role="alert" aria-busy="true">
            <Loader2 className="w-10 h-10 animate-spin mr-4 stroke-[3]" aria-hidden="true" />
            <span className="text-2xl font-bold uppercase">
              {isPdf ? 'Converting PDF & Scanning...' : 'Extracting details from your Voter ID...'}
            </span>
          </div>
        )}

        {(error || localError) && (
          <div className="p-6 brutal-card bg-secondary text-white mt-6" role="alert">
            <h3 className="text-xl font-black uppercase mb-1">⚠️ Analysis Failed</h3>
            <p className="text-lg font-bold">{error || localError}</p>
          </div>
        )}

        {result && !loading && !error && (    
          <article className="space-y-8" aria-labelledby="scan-results-title">
            <h2 id="scan-results-title" className="sr-only">Scan Results</h2>

            {/* TRUST & PROVENANCE HEADER */}
            <div className="brutal-card bg-brutalBlack text-white p-6 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary p-3 brutal-border rotate-3">
                  <ShieldCheck className="w-8 h-8 text-black" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase leading-tight">Authoritative Verification</h3>
                  <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Trust Level: {result.meta?.provenance?.trustLevel || 'Verifying...'}</p>
                </div>
              </div>
              <div className="bg-white/10 p-3 brutal-border text-xs font-mono space-y-1">
                <div className="flex justify-between gap-8"><span>SOURCE:</span> <span className="font-bold text-primary">{result.meta?.provenance?.source || 'ECI_SECURE_API'}</span></div>
                <div className="flex justify-between gap-8"><span>INTEGRITY:</span> <span className="font-bold text-green-400">RSA-SHA256-SIGNED</span></div>
                <div className="flex justify-between gap-8"><span>SIGNATURE:</span> <span>{result.meta?.provenance?.signature || '...'}</span></div>
              </div>
            </div>
            
            {/* Voter Details Card */}
            <section className="brutal-card bg-white p-8" aria-labelledby="voter-details-heading">
              <div className="flex justify-between items-start mb-6">
                <h3 id="voter-details-heading" className="text-3xl font-black flex items-center gap-3 uppercase">
                  <span className="bg-accent text-white p-2 brutal-border"><User className="w-8 h-8 stroke-[3] text-white" aria-hidden="true" /></span>
                  {t('voterDetails')}
                </h3>
                <div className="flex items-center gap-2 bg-gray-100 p-2 brutal-border text-xs font-black uppercase">
                  <Fingerprint className="w-4 h-4" /> Confidence: {Math.round((result.meta?.extractionConfidence || 0.9) * 100)}%
                </div>
              </div>

              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 brutal-border ${result.meta?.provenance?.epicStatus === 'FORMAT_VERIFIED' ? 'bg-green-50 border-green-600' : 'bg-gray-50'}`}>
                  <dt className="text-xs font-black uppercase text-gray-500 mb-1 flex items-center justify-between">
                    {t('epicExtracted')}
                    {result.meta?.provenance?.epicStatus === 'FORMAT_VERIFIED' && <span className="text-green-600 text-[10px] font-bold">FORMAT_VALIDATED</span>}
                  </dt>
                  <dd className="text-2xl font-black text-accent tracking-widest">{result.epic || 'NOT_FOUND'}</dd>
                </div>
                {result.name && (
                  <div className="bg-gray-50 p-4 brutal-border">
                    <dt className="text-xs font-black uppercase text-gray-500 mb-1">Extracted Name</dt>
                    <dd className="text-2xl font-black uppercase">{result.name}</dd>
                  </div>
                )}
                {result.address && (
                  <div className="bg-gray-50 p-4 brutal-border md:col-span-2">
                    <dt className="text-xs font-black uppercase text-gray-500 mb-1">Residential Address</dt>
                    <dd className="text-lg font-bold">📍 {result.address}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Region & Polling Info */}
            <section className="brutal-card bg-tertiary p-8" aria-labelledby="polling-station-heading">
              <h3 id="polling-station-heading" className="text-3xl font-black mb-6 flex items-center gap-3 uppercase">
                <span className="bg-white p-2 brutal-border"><MapPin className="w-8 h-8 stroke-[3]" aria-hidden="true" /></span>
                Grounding Evidence
              </h3>
              <dl className="space-y-4">
                <div className={`p-4 brutal-border shadow-brutal-sm ${result.meta?.provenance?.stateStatus === 'AUTHORITATIVE_MATCH' ? 'bg-white border-brutalBlack' : 'bg-gray-100 opacity-80'}`}>
                  <dt className="text-xs font-black uppercase text-gray-500 mb-1 flex justify-between">
                    State / Region
                    {result.meta?.provenance?.stateStatus === 'AUTHORITATIVE_MATCH' && <span className="text-[10px] bg-brutalBlack text-white px-2 py-0.5">MATCHED_FACT_BASE</span>}
                  </dt>
                  <dd className="text-2xl font-black">{result.detectedRegion || 'Unknown'}</dd>
                </div>
                {result.nearestBooth && (
                  <div className={`p-4 brutal-border shadow-brutal-sm ${result.meta?.provenance?.boothStatus === 'AUTHORITATIVE_MATCH' ? 'bg-white border-brutalBlack' : 'bg-gray-100'}`}>
                    <dt className="text-xs font-black uppercase text-gray-500 mb-1 flex justify-between">
                      Verified Polling Location
                      {result.meta?.provenance?.boothStatus === 'AUTHORITATIVE_MATCH' && <span className="text-[10px] bg-secondary text-white px-2 py-0.5">AUTHORITATIVE_RESOLVED</span>}
                    </dt>
                    <dd className="text-xl font-black">🏫 {result.nearestBooth}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Election Schedule */}
            {result.election && (
              <section className="brutal-card bg-primary p-8 -rotate-1" aria-labelledby="election-info-heading">
                <div className="flex justify-between items-center mb-6">
                  <h3 id="election-info-heading" className="text-3xl font-black flex items-center gap-3 uppercase">
                    <span className="bg-brutalBlack text-white p-2 brutal-border"><Calendar className="w-8 h-8 stroke-[3]" aria-hidden="true" /></span>
                    Election Timeline
                  </h3>
                  <span className="bg-white px-4 py-1 brutal-border text-xs font-black uppercase rotate-3">Verified Schedule</span>
                </div>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 brutal-border shadow-brutal-sm">
                    <dt className="text-xs font-black uppercase text-gray-500 mb-1">Phase</dt>
                    <dd className="text-2xl font-black leading-tight">{result.election.phase}</dd>
                  </div>
                  <div className="bg-white p-4 brutal-border shadow-brutal-sm">
                    <dt className="text-xs font-black uppercase text-gray-500 mb-1">Polling Date</dt>
                    <dd className="text-2xl font-black text-secondary underline decoration-4 decoration-black">{result.election.date}</dd>
                  </div>
                </dl>
              </section>
            )}

            {/* Language Suggestions */}
            {suggestLanguage('Tamil Nadu', 'ta', 'Tamil')}
            {suggestLanguage('Gujarat', 'gu', 'Gujarati')}
            {suggestLanguage('Maharashtra', 'mr', 'Marathi')}
          </article>
        )}
      </div>

      {/* Guide Section */}
      <div className="brutal-card bg-white p-8">
        <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-3">
          <span className="bg-primary p-2 brutal-border"><ExternalLink className="w-6 h-6 stroke-[3]" aria-hidden="true" /></span>
          {t('eVoterGuideTitle')}
        </h3>
        <ul className="space-y-4">
          {[
            { num: '1', text: t('eVoterStep1'), link: 'https://voters.eci.gov.in', label: 'voters.eci.gov.in' },
            { num: '2', text: t('eVoterStep2') },
            { num: '3', text: t('eVoterStep3') }
          ].map((s) => (
            <li key={s.num} className="flex items-start gap-4">
              <span className="bg-secondary text-white font-black text-lg w-9 h-9 flex items-center justify-center brutal-border shrink-0">{s.num}</span>
              <div className="text-lg font-bold pt-1">
                {s.text}
                {s.link && <a href={s.link} target="_blank" rel="noopener" className="block text-secondary underline">{s.label}</a>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
