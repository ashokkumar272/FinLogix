import React, { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onAudioRecorded: (audioBlob: Blob) => void;
  onAudioDeleted: () => void;
  initialAudioUrl?: string;
  disabled?: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioRecorded,
  onAudioDeleted,
  initialAudioUrl,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialAudioUrl) {
      setAudioUrl(initialAudioUrl);
    }
  }, [initialAudioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onAudioRecorded(blob);
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      setError('Error accessing microphone. Please check permissions.');
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setIsPlaying(false);
      onAudioDeleted();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-recorder bg-gray-700 p-4 rounded-lg border border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-200">Voice Memo</span>
        {error && (
          <span className="text-xs text-red-400">{error}</span>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        {!audioUrl ? (
          // Recording controls
          <div className="flex items-center space-x-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={disabled}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-2 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Record</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={stopRecording}
                  className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md transition-colors"
                >
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                  <span className="text-sm">Stop</span>
                </button>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-mono text-gray-200">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Playback controls
          <div className="flex items-center space-x-3">
            <button
              onClick={isPlaying ? pauseAudio : playAudio}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md transition-colors"
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1zm6 0a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5V7a1 1 0 011.707-.708l3 3a1 1 0 010 1.414l-3 3A1 1 0 019 13z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            
            <button
              onClick={deleteAudio}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm3 4a1 1 0 100 2v3a1 1 0 11-2 0v-3a1 1 0 100-2z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Delete</span>
            </button>
          </div>
        )}
      </div>
      
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
};

export default AudioRecorder;
