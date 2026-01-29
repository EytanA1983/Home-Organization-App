import { useCallback } from 'react';

export const useVoice = (lang = 'he-IL') => {
  const speak = useCallback((text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    window.speechSynthesis.speak(utter);
  }, [lang]);

  return { speak };
};
