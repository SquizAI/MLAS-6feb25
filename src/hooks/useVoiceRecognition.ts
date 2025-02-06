import { useState, useEffect, useCallback } from 'react';
import { logger } from '../lib/logger';

interface VoiceRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

export function useVoiceRecognition(options: VoiceRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<Error | null>(null);

  // Initialize speech recognition
  const recognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported');
    }

    const instance = new SpeechRecognition();
    instance.continuous = options.continuous ?? true;
    instance.interimResults = options.interimResults ?? true;
    instance.lang = options.language ?? 'en-US';

    return instance;
  }, [options.continuous, options.interimResults, options.language]);

  const startListening = useCallback(() => {
    try {
      const recognitionInstance = recognition();
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
        logger.info('Voice recognition started');
      };

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let interimText = '';
        let finalText = '';

        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        setInterimTranscript(interimText);
        if (finalText) {
          setTranscript(prev => prev + ' ' + finalText);
        }
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(new Error(event.error));
        logger.error({ error: event.error }, 'Voice recognition error');
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        logger.info('Voice recognition ended');
      };

      recognitionInstance.start();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start voice recognition'));
      logger.error({ error: err }, 'Failed to start voice recognition');
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    try {
      const recognitionInstance = recognition();
      recognitionInstance.stop();
      setIsListening(false);
    } catch (err) {
      logger.error({ error: err }, 'Failed to stop voice recognition');
    }
  }, [recognition]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [isListening, stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}