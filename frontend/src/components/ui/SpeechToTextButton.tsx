'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import { getSpeechRecognitionCtor } from '../../lib/speech';

type Props = {
  onResult: (text: string) => void;
};

type SttState = 'idle' | 'listening' | 'error';

export function SpeechToTextButton({ onResult }: Props) {
  const [state, setState] = useState<SttState>('idle');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    setSupported(Boolean(Ctor));
  }, []);

  const stop = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // no-op
    }
    recognitionRef.current = null;
    setState('idle');
  };

  const start = () => {
    if (!supported) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setState('error');
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }

    const recognition = new Ctor();
    recognitionRef.current = recognition;

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setState('listening');
    recognition.onerror = () => {
      setState('error');
      stop();
    };
    recognition.onend = () => {
      setState('idle');
      recognitionRef.current = null;
    };

    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript;
      if (transcript && typeof transcript === 'string') {
        onResult(transcript);
      }
    };

    try {
      recognition.start();
    } catch {
      setState('error');
      stop();
    }
  };

  return (
    <Button
      variant="outline"
      className="h-10"
      type="button"
      onClick={state === 'listening' ? stop : start}
      disabled={!supported}
      aria-label={state === 'listening' ? 'Stop microphone' : 'Start microphone'}
    >
      {state === 'listening' ? '🎤 Listening…' : '🎤'}
    </Button>
  );
}
