import React, { useState, useEffect } from 'react';
import { Mic, Square, Loader, Brain, List, CheckCircle2, X } from 'lucide-react';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

interface VoiceProcessorProps {
  onClose: () => void;
  onProcessed: (results: ProcessedResults) => void;
}

interface ProcessedResults {
  transcript: string;
  summary: string;
  tasks: string[];
  keyPoints: string[];
  nextSteps: string[];
}

export default function VoiceProcessor({ onClose, onProcessed }: VoiceProcessorProps) {
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition();

  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedResults | null>(null);

  const processTranscript = async () => {
    if (!transcript) return;
    
    setIsProcessing(true);
    try {
      // Process with OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an AI assistant that processes voice memos. Extract key information and organize it into a summary, tasks, key points, and next steps."
            },
            {
              role: "user",
              content: transcript
            }
          ],
          functions: [
            {
              name: "process_voice_memo",
              description: "Process a voice memo transcript",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "A concise summary of the voice memo"
                  },
                  tasks: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of tasks extracted from the memo"
                  },
                  keyPoints: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key points mentioned in the memo"
                  },
                  nextSteps: {
                    type: "array",
                    items: { type: "string" },
                    description: "Suggested next steps based on the memo"
                  }
                },
                required: ["summary", "tasks", "keyPoints", "nextSteps"]
              }
            }
          ]
        })
      });

      const data = await response.json();
      const processedData = JSON.parse(data.choices[0].message.function_call.arguments);

      const results = {
        transcript,
        ...processedData
      };

      setResults(results);
      onProcessed(results);

      // Store in Supabase
      await supabase.from('voice_memos').insert({
        transcript,
        processed_data: processedData,
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

      logger.info('Voice memo processed successfully');

    } catch (error) {
      logger.error({ error }, 'Failed to process voice memo');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mic className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Voice Memo</h2>
                <p className="text-sm text-gray-500">Speak your thoughts, I'll organize them</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Recording Controls */}
          <div className="flex justify-center mb-6">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                isListening 
                  ? 'bg-red-100 hover:bg-red-200' 
                  : 'bg-blue-100 hover:bg-blue-200'
              }`}
            >
              {isListening ? (
                <Square className="w-6 h-6 text-red-600" />
              ) : (
                <Mic className="w-6 h-6 text-blue-600" />
              )}
            </button>
          </div>

          {/* Transcription Display */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">
                {transcript}
                <span className="text-gray-400">{interimTranscript}</span>
              </p>
            </div>
          </div>

          {/* Process Button */}
          {transcript && !isProcessing && !results && (
            <button
              onClick={processTranscript}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Brain className="w-5 h-5" />
              Process Memo
            </button>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Processing your memo...</span>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
                <p className="text-gray-600">{results.summary}</p>
              </div>

              {/* Tasks */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tasks</h3>
                <ul className="space-y-2">
                  {results.tasks.map((task, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-gray-600">{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Points */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Key Points</h3>
                <ul className="space-y-2">
                  {results.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <List className="w-5 h-5 text-blue-500 mt-0.5" />
                      <span className="text-gray-600">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Next Steps</h3>
                <ul className="space-y-2">
                  {results.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Brain className="w-5 h-5 text-purple-500 mt-0.5" />
                      <span className="text-gray-600">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
              {error.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}