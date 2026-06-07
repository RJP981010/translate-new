export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function stopSpeaking(): void {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
}

export function speakWord(text: string, lang = 'en-US'): Promise<void> {
  if (!canSpeak()) {
    return Promise.reject(new Error('当前浏览器不支持发音播放'));
  }

  const word = text.trim();
  if (!word) {
    return Promise.reject(new Error('没有可播放的文本'));
  }

  stopSpeaking();

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = lang;
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error('发音播放失败'));
    window.speechSynthesis.speak(utterance);
  });
}
