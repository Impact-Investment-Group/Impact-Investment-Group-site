export declare function useSpeechRecognition(options?: { lang?: string; onFinal?: (text: string) => void }): {
  supported: boolean;
  listening: boolean;
  transcript: string;
  interim: string;
  error: string | null;
  start: () => boolean;
  stop: () => void;
  cancel: () => void;
  reset: () => void;
};
