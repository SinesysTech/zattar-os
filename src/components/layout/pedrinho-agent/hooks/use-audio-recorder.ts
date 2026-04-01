'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AudioRecorderState } from '../types'

interface UseAudioRecorderReturn extends AudioRecorderState {
  start: () => Promise<void>
  stop: () => Promise<Blob>
  cancel: () => void
  isSupported: boolean
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [status, setStatus] = useState<AudioRecorderState['status']>('idle')
  const [duration, setDuration] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const resolveStopRef = useRef<((blob: Blob) => void) | null>(null)

  const isSupported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioContextRef.current?.close()
    }
  }, [])

  const updateWaveform = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteTimeDomainData(dataArray)

    const bars = 32
    const step = Math.floor(dataArray.length / bars)
    const normalized: number[] = []
    for (let i = 0; i < bars; i++) {
      const val = dataArray[i * step]
      normalized.push(Math.abs(val - 128) / 128)
    }
    setWaveformData(normalized)
    animFrameRef.current = requestAnimationFrame(updateWaveform)
  }, [])

  const start = useCallback(async () => {
    if (status === 'recording') return

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    const audioContext = new AudioContext()
    audioContextRef.current = audioContext
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
    const recorder = new MediaRecorder(stream, { mimeType })
    mediaRecorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      resolveStopRef.current?.(blob)
      resolveStopRef.current = null
    }

    recorder.start(250)
    setStatus('recording')
    setDuration(0)

    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000))
    }, 200)

    animFrameRef.current = requestAnimationFrame(updateWaveform)
  }, [status, updateWaveform])

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    audioContextRef.current?.close()
    audioContextRef.current = null
    analyserRef.current = null
    setStatus('idle')
    setDuration(0)
    setWaveformData([])
  }, [])

  const stop = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state !== 'recording') {
        resolve(new Blob())
        return
      }
      resolveStopRef.current = (blob) => {
        cleanup()
        resolve(blob)
      }
      recorder.stop()
    })
  }, [cleanup])

  const cancel = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
    }
    resolveStopRef.current = null
    cleanup()
  }, [cleanup])

  return { status, duration, waveformData, start, stop, cancel, isSupported }
}
