import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Loader, Send, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

interface VoiceMemoProps {
  onClose: () => void;
  onMemoProcessed: (text: string) => Promise<void>;
}

export default function VoiceMemo({ onClose, onMemoProcessed }: VoiceMemoProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start duration timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setDuration(seconds);
      }, 1000);

      logger.info('Voice recording started');
    } catch (error) {
      logger.error({ error }, 'Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      logger.info('Voice recording stopped');
    }
  };

  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  const transcribeAudio = async () => {
    if (!audioUrl) return;

    setTranscribing(true);
    try {
      // Get the audio blob
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');

      // Send to OpenAI Whisper API
      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: formData
      });

      if (!transcriptionResponse.ok) {
        throw new Error('Transcription failed');
      }

      const data = await transcriptionResponse.json();
      setTranscription(data.text);
      logger.info('Audio transcription completed');

    } catch (error) {
      logger.error({ error }, 'Failed to transcribe audio');
    } finally {
      setTranscribing(false);
    }
  };

  const handleSubmit = async () => {
    if (!transcription) return;

    try {
      await onMemoProcessed(transcription);
      onClose();
    } catch (error) {
      logger.error({ error }, 'Failed to process voice memo');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Voice Memo</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Recording Controls */}
          <div className="flex flex-col items-center gap-6">
            {/* Record Button */}
            <div className="relative">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                  isRecording 
                    ? 'bg-red-100 hover:bg-red-200' 
                    : 'bg-blue-100 hover:bg-blue-200'
                }`}
              >
                {isRecording ? (
                  <Square className="w-8 h-8 text-red-600" />
                ) : (
                  <Mic className="w-8 h-8 text-blue-600" />
                )}
              </button>
              {isRecording && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-sm text-gray-500">{formatDuration(duration)}</span>
                </div>
              )}
            </div>

            {/* Playback Controls */}
            {audioUrl && !isRecording && (
              <div className="w-full">
                <audio src={audioUrl} controls className="w-full" />
              </div>
            )}

            {/* Transcription */}
            {audioUrl && !transcription && !transcribing && (
              <button
                onClick={transcribeAudio}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Transcribe Audio
              </button>
            )}

            {transcribing && (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Transcribing...</span>
              </div>
            )}

            {transcription && (
              <div className="w-full space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{transcription}</p>
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send className="w-5 h-5" />
                  Process Memo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}