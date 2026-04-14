export type TtsLanguage = 'Shona' | 'Ndebele' | 'Tonga' | 'English';

type VoicePick = {
  voice: SpeechSynthesisVoice | null;
  reason: string;
};

function norm(s: string) {
  return s.toLowerCase();
}

function langHints(lang: TtsLanguage) {
  switch (lang) {
    case 'Shona':
      return ['sn', 'shona', 'sna'];
    case 'Ndebele':
      return ['nd', 'ndebele', 'nde'];
    case 'Tonga':
      return ['to', 'tonga'];
    default:
      return ['en', 'english'];
  }
}

export function pickVoiceForLanguage(lang: TtsLanguage, voices: SpeechSynthesisVoice[]): VoicePick {
  const hints = langHints(lang);

  const byLangCode = voices.find((v) => hints.some((h) => norm(v.lang).startsWith(h)));
  if (byLangCode) return { voice: byLangCode, reason: 'lang_code_match' };

  const byName = voices.find((v) => hints.some((h) => norm(v.name).includes(h) || norm(v.voiceURI).includes(h)));
  if (byName) return { voice: byName, reason: 'name_match' };

  const english = voices.find((v) => norm(v.lang).startsWith('en'));
  if (english) return { voice: english, reason: 'english_fallback' };

  return { voice: voices[0] || null, reason: 'first_voice_fallback' };
}

export function buildUtterance(text: string, opts: { lang: TtsLanguage; rate?: number; pitch?: number; volume?: number }) {
  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts.rate ?? 1;
  u.pitch = opts.pitch ?? 1;
  u.volume = opts.volume ?? 1;

  // Set language hint for the engine even if we don't find a perfect voice.
  u.lang = opts.lang === 'English' ? 'en' : opts.lang;

  const voices = typeof window !== 'undefined' ? window.speechSynthesis?.getVoices?.() || [] : [];
  const picked = pickVoiceForLanguage(opts.lang, voices);
  if (picked.voice) u.voice = picked.voice;

  return { utterance: u, picked };
}

export function isTtsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export function getSpeechRecognitionCtor(): any | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}
