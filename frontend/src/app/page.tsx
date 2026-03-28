"use client";

import { useState } from "react";
import { MicButton } from "@/components/MicButton";
import { ResultCard } from "@/components/ResultCard";
import { processRequest, ProcessResponse } from "@/services/api";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResponse | null>(null);

  const handleStart = () => {
    setResult(null);
  };

  const handleStop = async (text: string) => {
    setLoading(true);
    try {
      // Send text payload to standard POST process URL
      const res = await processRequest({
        type: "voice",
        payload: text,
        metadata: {
          location: { lat: 12.97, lng: 77.59 },
          language: "en",
        },
      });
      setResult(res);
    } catch (error) {
      console.error(error);
      alert("Failed to process request. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6 sm:p-24 relative overflow-hidden text-gray-900">
      
      {/* Dynamic Background Blurs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <div className="z-10 flex flex-col items-center w-full max-w-lg space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">
            Saathi
          </h1>
          <p className="text-xl text-gray-600 font-medium">Har decision mein saath</p>
        </header>

        <section className="flex flex-col items-center justify-center w-full h-48">
          {loading ? (
            <div className="flex flex-col items-center space-y-4 text-blue-600">
              <Loader2 className="w-16 h-16 animate-spin" />
              <p className="font-semibold text-lg animate-pulse">Processing your context...</p>
            </div>
          ) : (
            <MicButton onListeningStart={handleStart} onListeningStop={handleStop} />
          )}
        </section>

        {result && (
          <section className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-8 duration-500">
            <ResultCard summary={result.summary} steps={result.steps} />
            
            {/* Action buttons section */}
            <div className="flex gap-4 w-full justify-center px-4 mb-4 mt-6">
                 {result.actions.map((action, i) => (
                    <a key={i} title={action.type} href={action.url || `tel:${action.number}`}
                       className="px-6 py-2.5 bg-white text-blue-700 font-semibold rounded-full shadow hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-blue-100">
                       {action.type.toUpperCase()}
                    </a>
                 ))}
             </div>
          </section>
        )}
      </div>
    </main>
  );
}
