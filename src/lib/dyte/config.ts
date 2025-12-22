export function isDyteTranscriptionEnabled(): boolean {
  return process.env.DYTE_ENABLE_TRANSCRIPTION === 'true';
}

export function isDyteRecordingEnabled(): boolean {
  return process.env.DYTE_ENABLE_RECORDING === 'true';
}

export function getDyteTranscriptionLanguage(): string {
  return 'pt-BR';
}