
import React, { useState, useRef } from 'react';
import { analyzeVoiceSample } from './services/geminiService';
import { DetectionResult } from './types';
import ResultDisplay from './components/ResultDisplay';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'audio/mpeg' && selectedFile.type !== 'audio/mp3') {
        setError('Please upload an MP3 file.');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
      setCopied(false);
      
      // Immediately convert for the "Copy Base64" feature
      try {
        const b64 = await convertToBase64(selectedFile);
        setBase64Data(b64);
      } catch (err) {
        console.error("Error converting file:", err);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file || !base64Data) {
      setError('Please select an audio file first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await analyzeVoiceSample(base64Data);
      setResult(analysisResult);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Check your connection or API key.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyBase64ToClipboard = () => {
    if (base64Data) {
      navigator.clipboard.writeText(base64Data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-12 px-4 md:px-8">
      {/* Header */}
      <header className="w-full max-w-4xl mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
            <i className="fa-solid fa-microchip"></i>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">VoxVerify</h1>
        </div>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Enterprise-grade AI voice detection. Automatically identifies language and scans for synthetic artifacts.
        </p>
      </header>

      <main className="w-full max-w-3xl space-y-8">
        {/* Upload Area */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest">Audio Sample (.MP3)</h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Multi-Lingual Scanner</span>
          </div>
          <div 
            onClick={!isAnalyzing ? triggerFileInput : undefined}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all ${
              isAnalyzing ? 'opacity-50 cursor-not-allowed border-slate-300' : 'cursor-pointer border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 shadow-sm'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="audio/mp3, audio/mpeg" 
              className="hidden" 
            />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-colors ${file ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <i className={`fa-solid ${file ? 'fa-check' : 'fa-file-arrow-up'}`}></i>
            </div>
            {file ? (
              <div className="text-center">
                <p className="text-slate-800 font-bold">{file.name}</p>
                <div className="flex flex-col gap-2 items-center mt-2">
                   <p className="text-slate-400 text-sm italic">File ready for forensic scan</p>
                   {base64Data && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); copyBase64ToClipboard(); }}
                       className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold py-1 px-3 rounded flex items-center gap-2 transition-colors"
                     >
                       <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                       {copied ? 'COPIED!' : 'COPY BASE64 FOR SUBMISSION'}
                     </button>
                   )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-slate-800 font-semibold">Click to select voice sample</p>
                <p className="text-slate-400 text-sm mt-1">Tamil • English • Hindi • Malayalam • Telugu</p>
              </div>
            )}
          </div>
        </section>

        {/* Primary Action */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !file}
          className={`w-full py-4 rounded-2xl text-lg font-black tracking-wide transition-all transform active:scale-[0.98] shadow-lg ${
            isAnalyzing || !file
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-3">
              <i className="fa-solid fa-spinner fa-spin"></i>
              Extracting Phonation Patterns...
            </span>
          ) : (
            'START FORENSIC ANALYSIS'
          )}
        </button>

        {/* Feedback Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3 animate-pulse">
            <i className="fa-solid fa-circle-exclamation"></i>
            <p className="font-bold">{error}</p>
          </div>
        )}

        {/* Results Component */}
        {result && <ResultDisplay result={result} />}

        {/* Capability Tags */}
        <div className="flex flex-wrap justify-center gap-4 py-8 opacity-60">
          <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-tighter">Bitrate Analysis</span>
          <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-tighter">Spectral Flux</span>
          <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-tighter">Neural Signature Check</span>
          <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-tighter">Broadcast Filter</span>
        </div>
      </main>

      <footer className="mt-auto py-8 text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em]">
        VoxVerify // Secure Forensic Node // Ver 2.1
      </footer>
    </div>
  );
};

export default App;
