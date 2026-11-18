export const speechAvailable = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
let stopActive = () => {};

export function stopSpeech() {
  stopActive('canceled');
  if (speechAvailable) speechSynthesis.cancel();
}

export function speak(text, rate = 1, lang = 'en-US') {
  if (!speechAvailable || !text) return Promise.resolve('unavailable');
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  const localEnglish = speechSynthesis.getVoices().find((voice) => voice.localService && voice.lang === lang);
  if (localEnglish) utterance.voice = localEnglish;
  return new Promise((resolve) => {
    const finish = (result) => {
      clearTimeout(watchdog);
      stopActive = () => {};
      resolve(result);
    };
    const watchdog = setTimeout(() => {
      finish('unavailable');
      speechSynthesis.cancel();
    }, Math.max(7000, text.length * 140 / rate));
    stopActive = finish;
    utterance.onend = () => { if (stopActive === finish) finish('spoken'); };
    utterance.onerror = () => { if (stopActive === finish) finish('unavailable'); };
    try {
      speechSynthesis.speak(utterance);
    } catch {
      finish('unavailable');
    }
  });
}
