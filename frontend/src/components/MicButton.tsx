"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MicButtonProps {
  onListeningStart: () => void;
  onListeningStop: (text: string) => void;
}

export function MicButton({ onListeningStart, onListeningStop }: MicButtonProps) {
  const [isListening, setIsListening] = useState(false);

  const toggleListening = () => {
    if (isListening) {
      // Mock Speech recognition stop
      setIsListening(false);
      onListeningStop("I need to go home"); // Mock extracted text
    } else {
      // Mock Speech recognition start
      setIsListening(true);
      onListeningStart();
      
      // Auto stop and mock output after 3 seconds
      setTimeout(() => {
        setIsListening(false);
        onListeningStop("I need to go home, avoiding heavy traffic");
      }, 3000);
    }
  };

  return (
    <Button 
      onClick={toggleListening} 
      className={`rounded-full h-24 w-24 text-lg font-bold shadow-lg transition-all ${
        isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {isListening ? "Listening..." : "Tap to Speak"}
    </Button>
  );
}
