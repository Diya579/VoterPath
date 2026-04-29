import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVisionScanner } from '../hooks/useVisionScanner';
import { Upload, FileImage, Loader2, FileText, MapPin, Calendar, Info, User, ExternalLink, ChevronRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { storage, auth } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Converts the first page of a PDF file to a JPEG image.
 * Used for processing e-EPIC digital voter ID cards.
 * @param {File} file - The PDF file object.
 * @returns {Promise<File>} - A JPEG image file object.
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
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(new File([blob], 'voter_id.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.95);
  });
}

/**
 * IDScanner Component: Handles uploading, PDF-to-image conversion, and AI-powered OCR
 * extraction of Voter ID details. Integrates with the Groq Vision API via a custom hook.
 */
export default function IDScanner() {
  const { t, i18n } = useTranslation();
  const { scanImage, loading, result, error } = useVisionScanner();
  const [dragActive, setDragActive] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (!file) return;
    setDragActive(false);
    setUploading(true);

    try {
      let imageFile = file;
      if (file.type === 'application/pdf') {
        setIsPdf(true);
        imageFile = await pdfToImage(file);
      }

      // Meaningful Google Services Integration: Upload to Firebase Storage
      const user = auth.currentUser;
      const storageRef = ref(storage, `voter-ids/${user?.uid || 'anon'}/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Image uploaded to Firebase Storage:', downloadURL);

      await scanImage(imageFile);
    } catch (err) {
      console.error('Scan/Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const suggestLanguage = (region, code, label) => {
    if (result?.detectedRegion === region && i18n.language !== code) {
      return (
        <div className="brutal-card p-6 bg-secondary text-white">
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
        className={`brutal-card p-12 text-center transition-all ${dragActive ? 'bg-primary border-dashed' : 'bg-white border-solid'}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleFile}
      >
        <div className="flex justify-center gap-4 mb-6">
          <Upload className="w-16 h-16 stroke-[3]" />
          <FileText className="w-16 h-16 stroke-[3] text-secondary" />
        </div>
        <p className="text-2xl font-bold mb-4 uppercase">{t('uploadID')}</p>
        <p className="text-lg font-semibold text-gray-500 mb-8">Supports: JPG, PNG, WEBP, and PDF (e-EPIC) files</p>
        <label className="brutal-btn bg-tertiary text-black inline-block cursor-pointer">
          Browse Files
          <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFile} />
        </label>
      </div>

      {/* How to get e-Voter ID */}
      <div className="brutal-card bg-white p-8">
        <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-3">
          <span className="bg-primary p-2 brutal-border"><ExternalLink className="w-6 h-6 stroke-[3]" /></span>
          {t('eVoterGuideTitle')}
        </h3>
        <ol className="space-y-4">
          {[
            { num: '1', text: t('eVoterStep1'), link: 'https://voters.eci.gov.in', linkLabel: 'voters.eci.gov.in' },
            { num: '2', text: t('eVoterStep2') },
            { num: '3', text: t('eVoterStep3') },
            { num: '4', text: t('eVoterStep4') },
            { num: '5', text: t('eVoterStep5') },
          ].map((s) => (
            <li key={s.num} className="flex items-start gap-4">
              <span className="bg-secondary text-white font-black text-lg w-9 h-9 flex items-center justify-center brutal-border shrink-0">{s.num}</span>
              <span className="text-lg font-semibold pt-1">
                {s.text}{' '}
                {s.link && (
                  <a href={s.link} target="_blank" rel="noopener noreferrer"
                    className="text-secondary underline font-black inline-flex items-center gap-1">
                    {s.linkLabel} <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-6 brutal-card bg-primary">
          <Loader2 className="w-10 h-10 animate-spin mr-4 stroke-[3]" />
          <span className="text-2xl font-bold uppercase">
            {isPdf ? 'Converting PDF & Scanning...' : 'Extracting details from your Voter ID...'}
          </span>
        </div>
      )}

      {error && (
        <div className="p-6 brutal-card bg-secondary text-white">
          <p className="text-xl font-bold uppercase">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Voter Details Card */}
          <div className="brutal-card bg-white p-8">
            <h3 className="text-3xl font-black mb-6 flex items-center gap-3">
              <span className="bg-accent text-white p-2 brutal-border"><User className="w-8 h-8 stroke-[3] text-white" /></span>
              {t('voterDetails') || 'Voter Details'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 brutal-border">
                <p className="text-sm font-black uppercase text-gray-500 mb-1">{t('epicExtracted')}</p>
                <p className="text-2xl font-black text-accent tracking-widest">{result.epic || 'NOT_FOUND'}</p>
              </div>
              {result.name && result.name !== 'NOT_FOUND' && (
                <div className="bg-gray-50 p-4 brutal-border">
                  <p className="text-sm font-black uppercase text-gray-500 mb-1">Name</p>
                  <p className="text-2xl font-black">{result.name}</p>
                </div>
              )}
              {result.gender && result.gender !== 'NOT_FOUND' && (
                <div className="bg-gray-50 p-4 brutal-border">
                  <p className="text-sm font-black uppercase text-gray-500 mb-1">Gender</p>
                  <p className="text-xl font-bold">{result.gender}</p>
                </div>
              )}
              {result.address && result.address !== 'NOT_FOUND' && (
                <div className="bg-gray-50 p-4 brutal-border md:col-span-2">
                  <p className="text-sm font-black uppercase text-gray-500 mb-1">Residential Address</p>
                  <p className="text-lg font-bold">📍 {result.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Detected Region & Polling Station */}
          <div className="brutal-card bg-tertiary p-8">
            <h3 className="text-3xl font-black mb-6 flex items-center gap-3">
              <span className="bg-white p-2 brutal-border"><MapPin className="w-8 h-8 stroke-[3]" /></span>
              {t('detectedRegion')}
            </h3>
            <div className="space-y-4">
              <div className="bg-white p-4 brutal-border shadow-brutal-sm">
                <p className="text-sm font-black uppercase text-gray-500 mb-1">State / Region</p>
                <p className="text-2xl font-black">{result.detectedRegion || 'Unknown'}</p>
              </div>
              {result.constituency && result.constituency !== 'NOT_FOUND' && (
                <div className="bg-white p-4 brutal-border shadow-brutal-sm">
                  <p className="text-sm font-black uppercase text-gray-500 mb-1">{t('constituency') || 'Assembly Constituency'}</p>
                  <p className="text-2xl font-black">{result.constituency}</p>
                </div>
              )}
              {result.pollingStation && result.pollingStation !== 'NOT_FOUND' && (
                <div className="bg-white p-4 brutal-border shadow-brutal-sm">
                  <p className="text-sm font-black uppercase text-gray-500 mb-1">Your Polling Station</p>
                  <p className="text-xl font-bold">🏫 {result.pollingStation}</p>
                </div>
              )}
              {result.pollingStationAddress && result.pollingStationAddress !== 'NOT_FOUND' && (
                <div className="bg-white p-4 brutal-border shadow-brutal-sm">
                  <p className="text-sm font-black uppercase text-gray-500 mb-1">Polling Station Address</p>
                  <p className="text-lg font-bold">📍 {result.pollingStationAddress}</p>
                </div>
              )}
              {!result.pollingStation && result.nearestBooth && (
                <div className="bg-white p-4 brutal-border shadow-brutal-sm">
                  <p className="text-sm font-black uppercase text-gray-500 mb-1">Nearest Polling Booth</p>
                  <p className="text-xl font-bold">📍 {result.nearestBooth}</p>
                </div>
              )}
            </div>
          </div>

          {/* Election Info */}
          {result.election && (
            <div className="brutal-card bg-primary p-8 -rotate-1">
              <h3 className="text-3xl font-black mb-6 flex items-center gap-3">
                <span className="bg-brutalBlack text-white p-2 brutal-border"><Calendar className="w-8 h-8 stroke-[3]" /></span>
                Upcoming Election
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 brutal-border shadow-brutal-sm">
                  <p className="text-sm font-black uppercase text-gray-500 mb-1">Phase</p>
                  <p className="text-2xl font-black">{result.election.phase}</p>
                </div>
                <div className="bg-white p-4 brutal-border shadow-brutal-sm">
                  <p className="text-sm font-black uppercase text-gray-500 mb-1">Polling Date</p>
                  <p className="text-2xl font-black text-secondary">{result.election.date}</p>
                </div>
                <div className="bg-white p-4 brutal-border shadow-brutal-sm">
                  <p className="text-sm font-black uppercase text-gray-500 mb-1">Assembly Seats</p>
                  <p className="text-2xl font-black">{result.election.seats}</p>
                </div>
                <div className="bg-white p-4 brutal-border shadow-brutal-sm">
                  <p className="text-sm font-black uppercase text-gray-500 mb-1">{t('countingDate')}</p>
                  <p className="text-2xl font-black text-accent">{result.election.countingDate}</p>
                </div>
              </div>
              <div className="mt-4 bg-white p-4 brutal-border shadow-brutal-sm">
                <p className="text-sm font-black uppercase text-gray-500 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 stroke-[3]" /> What You Should Know
                </p>
                <p className="text-lg font-bold">{result.election.notes}</p>
              </div>
            </div>
          )}

          {/* Language Suggestions */}
          {suggestLanguage('Tamil Nadu', 'ta', 'Tamil')}
          {suggestLanguage('Gujarat', 'gu', 'Gujarati')}
          {suggestLanguage('West Bengal', 'bn', 'Bengali')}
          {suggestLanguage('Kerala', 'ml', 'Malayalam')}
          {suggestLanguage('Karnataka', 'kn', 'Kannada')}
          {suggestLanguage('Assam', 'as', 'Assamese')}
          {suggestLanguage('Andhra Pradesh', 'te', 'Telugu')}
          {suggestLanguage('Telangana', 'te', 'Telugu')}
          {suggestLanguage('Maharashtra', 'mr', 'Marathi')}
          {suggestLanguage('Punjab', 'pa', 'Punjabi')}
          {suggestLanguage('Odisha', 'or', 'Odia')}
        </div>
      )}
    </div>
  );
}
