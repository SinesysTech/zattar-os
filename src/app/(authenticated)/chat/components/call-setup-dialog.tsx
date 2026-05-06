import {
  cn } from '@/lib/utils';
import { useEffect,
  useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Video, Mic, Volume2, VideoOff } from 'lucide-react';
import { useMediaDevices } from '../hooks/use-media-devices';
import { useDeviceTest } from '../hooks/use-device-test';
import { TipoChamada, SelectedDevices } from '../domain';
import { Skeleton } from '@/components/ui/skeleton';

interface CallSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: TipoChamada;
  onJoinCall: (selectedDevices: SelectedDevices) => void;
  salaNome: string;
}

export function CallSetupDialog({
  open,
  onOpenChange,
  tipo,
  onJoinCall,
  salaNome: _salaNome,
}: CallSetupDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    videoDevices,
    audioInputDevices,
    audioOutputDevices,
    selectedVideoDevice,
    selectedAudioInput,
    selectedAudioOutput,
    setSelectedVideoDevice,
    setSelectedAudioInput,
    setSelectedAudioOutput,
    isLoading: devicesLoading,
    error: devicesError,
    refreshDevices
  } = useMediaDevices({ enabled: open });

  const {
    videoStream,
    audioLevel,
    isTestingVideo,
    isTestingAudio,
    startVideoTest,
    stopVideoTest,
    startAudioTest,
    stopAudioTest,
    error: testError
  } = useDeviceTest();

  // Iniciar preview de vídeo e áudio quando o dialog abrir
  useEffect(() => {
    if (open) {
      refreshDevices();
    } else {
      stopVideoTest();
      stopAudioTest();
    }
  }, [open, refreshDevices, stopVideoTest, stopAudioTest]);

  // Gerenciar teste de vídeo quando dispositivo selecionado muda
  useEffect(() => {
    if (open && selectedVideoDevice && tipo === TipoChamada.Video) {
      startVideoTest(selectedVideoDevice);
    }
  }, [open, selectedVideoDevice, tipo, startVideoTest]);

  // Gerenciar teste de áudio quando dispositivo selecionado muda
  useEffect(() => {
    if (open && selectedAudioInput) {
      startAudioTest(selectedAudioInput);
    }
  }, [open, selectedAudioInput, startAudioTest]);

  // Anexar stream de vídeo ao elemento video
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  const handleJoin = () => {
    onJoinCall({
      videoDevice: selectedVideoDevice || undefined,
      audioInput: selectedAudioInput || undefined,
      audioOutput: selectedAudioOutput || undefined,
    });
    onOpenChange(false);
  };

  const getDeviceLabel = (device: MediaDeviceInfo, index: number) => {
    return device.label || `${device.kind} ${index + 1}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>Configurar Chamada</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
      <div className={cn("flex flex-col inline-loose inset-dialog")}>
        {/* Video Preview Area */}
        {tipo === TipoChamada.Video && (
          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border">
            {isTestingVideo && videoStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
                <VideoOff className="w-12 h-12 mb-2 opacity-50" />
                <p>Câmera desligada ou indisponível</p>
              </div>
            )}
          </div>
        )}

        {/* Device Selection Controls */}
        <div className={cn("flex flex-col stack-default")}>
          {/* Camera Selection */}
          {tipo === TipoChamada.Video && (
            <div className={cn("grid inline-tight")}>
              <Label htmlFor="camera-select" className={cn("flex items-center inline-tight")}>
                <Video className="w-4 h-4" /> Câmera
              </Label>
              {devicesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedVideoDevice || ''}
                  onValueChange={setSelectedVideoDevice}
                  disabled={videoDevices.length === 0}
                >
                  <SelectTrigger id="camera-select">
                    <SelectValue placeholder="Selecione uma câmera" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoDevices.map((device, idx) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {getDeviceLabel(device, idx)}
                      </SelectItem>
                    ))}
                    {videoDevices.length === 0 && (
                      <SelectItem value="none" disabled>Nenhuma câmera encontrada</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Microphone Selection */}
          <div className={cn("grid inline-tight")}>
            <div className="flex items-center justify-between">
              <Label htmlFor="mic-select" className={cn("flex items-center inline-tight")}>
                <Mic className="w-4 h-4" /> Microfone
              </Label>
              {isTestingAudio && (
                <div className={cn("flex items-center inline-tight w-32")}>
                  <Mic className={`w-3 h-3 ${audioLevel > 5 ? 'text-success' : 'text-muted-foreground'}`} />
                  <Progress value={audioLevel} className="h-1.5" />
                </div>
              )}
            </div>

            {devicesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedAudioInput || ''}
                onValueChange={setSelectedAudioInput}
                disabled={audioInputDevices.length === 0}
              >
                <SelectTrigger id="mic-select">
                  <SelectValue placeholder="Selecione um microfone" />
                </SelectTrigger>
                <SelectContent>
                  {audioInputDevices.map((device, idx) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {getDeviceLabel(device, idx)}
                    </SelectItem>
                  ))}
                  {audioInputDevices.length === 0 && (
                    <SelectItem value="none" disabled>Nenhum microfone encontrado</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Speaker Selection */}
          {audioOutputDevices.length > 0 && (
            <div className={cn("grid inline-tight")}>
              <Label htmlFor="speaker-select" className={cn("flex items-center inline-tight")}>
                <Volume2 className="w-4 h-4" /> Alto-falante
              </Label>
              <Select
                value={selectedAudioOutput || ''}
                onValueChange={setSelectedAudioOutput}
                disabled={audioOutputDevices.length === 0}
              >
                <SelectTrigger id="speaker-select">
                  <SelectValue placeholder="Selecione um alto-falante" />
                </SelectTrigger>
                <SelectContent>
                  {audioOutputDevices.map((device, idx) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {getDeviceLabel(device, idx)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[0.8rem] text-muted-foreground">
                Nota: A saída de áudio pode ser controlada pelo sistema operacional em alguns navegadores.
              </p>
            </div>
          )}
        </div>

        {(devicesError || testError) && (
          <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "inset-medium text-body-sm text-destructive bg-destructive/10 rounded-md")}>
            {devicesError || testError}
          </div>
        )}
      </div>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button onClick={handleJoin}>Entrar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
