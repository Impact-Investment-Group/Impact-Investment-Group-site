/* Browser Web Speech API adapter. Recognition availability varies by browser;
 * some browsers send audio to their recognition provider and require a network.
 * This hook adds no speech service or credential. Callers keep typed input.
 * stop() may deliver a final result; cancel() aborts and ignores late callbacks.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  try { return window.SpeechRecognition || window.webkitSpeechRecognition || null; }
  catch { return null; }
}

function detach(rec) {
  rec.onresult = rec.onerror = rec.onend = null;
}

export function useSpeechRecognition({ lang = 'en-GB', onFinal } = {}) {
  const Ctor = getRecognitionCtor();
  const supported = typeof Ctor === 'function';
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const stoppingRef = useRef(false);
  const mountedRef = useRef(true);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const cancel = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    stoppingRef.current = false;
    if (rec) {
      detach(rec);
      try { rec.abort(); } catch { /* Already ended. */ }
    }
    if (mountedRef.current) {
      setListening(false);
      setInterim('');
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; cancel(); };
  }, [cancel]);
  useEffect(() => { cancel(); }, [Ctor, lang, cancel]);

  const start = useCallback(() => {
    if (!mountedRef.current) return false;
    if (recognitionRef.current) {
      if (!stoppingRef.current) return false;
      // Stop may still be awaiting its final/end events. An explicit restart
      // replaces that attempt, while an incidental start cannot interrupt capture.
      cancel();
    }
    if (!supported) { setError('unsupported'); return false; }
    setError(null);
    setTranscript('');
    setInterim('');
    let rec;
    try {
      // One instance per attempt isolates aborted sessions from a later start.
      rec = new Ctor();
      rec.lang = lang;
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      recognitionRef.current = rec;
      let finalDelivered = false;
      const current = () => mountedRef.current && recognitionRef.current === rec;
      rec.onresult = (event) => {
        if (!current() || finalDelivered) return;
        let finalText = '';
        let interimText = '';
        for (let i = event.resultIndex || 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) finalText += result[0]?.transcript || '';
          else interimText += result[0]?.transcript || '';
        }
        setInterim(interimText);
        const cleaned = finalText.trim();
        if (cleaned) {
          finalDelivered = true;
          setTranscript(cleaned);
          setInterim('');
          onFinalRef.current?.(cleaned);
        }
      };
      rec.onerror = (event) => {
        if (!current()) return;
        const code = event?.error || 'error';
        cancel();
        if (code !== 'aborted') setError(code);
      };
      rec.onend = () => {
        if (!current()) return;
        recognitionRef.current = null;
        stoppingRef.current = false;
        detach(rec);
        setListening(false);
        setInterim('');
      };
      rec.start();
      if (current()) setListening(true);
      return current();
    } catch (failure) {
      cancel();
      setError(failure?.name === 'NotAllowedError' ? 'not-allowed' : 'error');
      return false;
    }
  }, [Ctor, lang, supported, cancel]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    stoppingRef.current = true;
    setListening(false);
    try { rec.stop(); }
    catch { cancel(); }
  }, [cancel]);

  const reset = useCallback(() => {
    cancel();
    setTranscript('');
    setInterim('');
    setError(null);
  }, [cancel]);

  return { supported, listening, transcript, interim, error, start, stop, cancel, reset };
}

export default useSpeechRecognition;
