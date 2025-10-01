import { useState, useRef, useCallback, useEffect } from 'react';

export const useCamera = () => {
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('stopped');
  const [isCameraRestarting, setIsCameraRestarting] = useState(false);
  const videoRef = useRef(null);

  const initializeCamera = useCallback(async () => {
    try {
      setCameraStatus('initializing');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      setCameraStream(stream);
      setCameraStatus('connected');
      
      return stream;
    } catch (error) {
      setCameraStatus('error');
      throw error;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setCameraStatus('stopped');
    }
  }, [cameraStream]);

  const restartCamera = useCallback(async () => {
    try {
      setIsCameraRestarting(true);
      stopCamera();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await initializeCamera();
    } catch (error) {
      setCameraStatus('error');
    } finally {
      setIsCameraRestarting(false);
    }
  }, [stopCamera, initializeCamera]);

  // Connect video element to camera stream
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().then(() => {
        setCameraStatus('playing');
      }).catch(() => {
        setCameraStatus('error');
      });
    }
  }, [cameraStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    cameraStream,
    cameraStatus,
    isCameraRestarting,
    videoRef,
    initializeCamera,
    stopCamera,
    restartCamera
  };
};
