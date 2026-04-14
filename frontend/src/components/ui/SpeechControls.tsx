'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './Button';
import { buildUtterance, isTtsSupported, TtsLanguage } from '../../lib/speech';

type Props = {
  text: string;
  language: TtsLanguage;
  label?: string;
};

type SpeechState = 'idle' | 'speaking' | 'paused';

export function SpeechControls({ text, language, label = 'Listen' }: Props) {
  const [state, setState] = useState<SpeechState>('idle');
  const [supported, setSupported] = useState(true);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(isTtsSupported());
  }, []);

  // Ensure voices are populated in some browsers
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;

    const onVoices = () => {
      // no-op, but calling getVoices in this callback helps populate
      window.speechSynthesis.getVoices();
    };

    window.speechSynthesis.addEventListener?.('voiceschanged', onVoices as any);
    onVoices();

    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', onVoices as any);
    };
  }, []);

  const canSpeak = useMemo(() => supported && Boolean(text?.trim()), [supported, text]);

  const stop = () => {
    if (typeof window === 'undefined') return;
    try {
      window.speechSynthesis.cancel();
    } finally {
      utteranceRef.current = null;
      setState('idle');
    }
  };

  const speak = () => {
    if (!canSpeak) return;
    if (typeof window === 'undefined') return;

    // Stop any existing speech first
    window.speechSynthesis.cancel();

    const { utterance } = buildUtterance(text, { lang: language, rate: 1 });

    utterance.onstart = () => setState('speaking');
    utterance.onend = () => setState('idle');
    utterance.onerror = () => setState('idle');
    utterance.onpause = () => setState('paused');
    utterance.onresume = () => setState('speaking');

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (typeof window === 'undefined') return;
    if (state !== 'speaking') return;
    window.speechSynthesis.pause();
    setState('paused');
  };

  const resume = () => {
    if (typeof window === 'undefined') return;
    if (state !== 'paused') return;
    window.speechSynthesis.resume();
    setState('speaking');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel?.();
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          className="h-9"
          onClick={speak}
          disabled={!canSpeak}
          aria-label="Listen to this content"
          type="button"
        >
          🔊 {label}
        </Button>

        <Button
          variant="outline"
          className="h-9"
          onClick={state === 'paused' ? resume : pause}
          disabled={state === 'idle'}
          aria-label={state === 'paused' ? 'Resume speech' : 'Pause speech'}
          type="button"
        >
          {state === 'paused' ? 'Resume' : 'Pause'}
        </Button>

        <Button
          variant="outline"
          className="h-9"
          onClick={stop}
          disabled={state === 'idle'}
          aria-label="Stop speech"
          type="button"
        >
          Stop
        </Button>

        <div className="text-xs text-gray-600">
          {supported ? (state === 'idle' ? 'Ready' : state === 'paused' ? 'Paused' : 'Speaking…') : 'TTS not supported in this browser'}
        </div>
      </div>
    </div>
  );
}
