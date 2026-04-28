'use client';

import { useState, useRef, useCallback } from 'react';

const BGM_URL = 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1758424375681_qdqqd_t01hdm.mp3';

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [showVolume, setShowVolume] = useState(false);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.volume = volume;
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [playing, volume]);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  return (
    <>
      <audio ref={audioRef} src={BGM_URL} loop preload="none" />
      <div
        className="fixed bottom-5 right-5 z-[1000] flex items-center gap-2.5 px-3.5 py-2.5 rounded-full transition-all duration-300 hover:scale-105 select-none"
        style={{
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
        onMouseEnter={() => setShowVolume(true)}
        onMouseLeave={() => setShowVolume(false)}
      >
        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold transition-all duration-300 hover:scale-110"
          style={{
            background: playing
              ? 'linear-gradient(135deg, #51cf66, #37b24d)'
              : 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
            boxShadow: playing
              ? '0 4px 15px rgba(81,207,102,0.4)'
              : '0 4px 15px rgba(255,107,107,0.4)',
          }}
        >
          {playing ? '⏸' : '▶'}
        </button>

        {/* Volume slider */}
        <div
          className="flex items-center gap-1.5 overflow-hidden transition-all duration-300"
          style={{
            width: showVolume ? '110px' : '0px',
            opacity: showVolume ? 1 : 0,
          }}
        >
          <span className="text-sm">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolume}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgba(201,168,76,0.8) ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%)`,
            }}
          />
        </div>
      </div>
    </>
  );
}
