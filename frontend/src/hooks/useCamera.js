import { useState, useRef, useCallback, useEffect } from 'react';

export const useCamera = () => {
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('stopped');
  const [isCameraRestarting, setIsCameraRestarting] = useState(false);
  const videoRef = useRef(null);

  const initializeCamera = useCallback(async () => {
    try {
      setCameraStatus('initializing');
      
      // Check browser support first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      setCameraStream(stream);
      setCameraStatus('connected');
      
      return stream;
    } catch (error) {
      console.error('❌ Camera initialization failed:', error);
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
    const videoElement = videoRef.current;
    if (cameraStream && videoElement) {
      console.log('🔗 Connecting camera stream to video element...');
      
      // Stop any existing playback first
      if (videoElement.srcObject) {
        console.log('🛑 Stopping existing video stream...');
        videoElement.pause();
        videoElement.srcObject = null;
        // Wait a bit for the stream to fully stop
        setTimeout(() => {
          if (videoElement) {
            videoElement.srcObject = cameraStream;
          }
        }, 50);
      } else {
        // Set the new stream immediately if no existing stream
        videoElement.srcObject = cameraStream;
      }
      
      // Set up event listeners for video loading
      const handleLoadedMetadata = () => {
        console.log('📹 Video metadata loaded');
        // Use a longer delay to ensure the stream is fully ready
        setTimeout(() => {
          if (videoElement && videoElement.srcObject === cameraStream) {
            // Check if video is ready to play
            if (videoElement.readyState >= 2) {
              videoElement.play().then(() => {
                console.log('✅ Video element connected and playing');
                setCameraStatus('playing');
              }).catch((err) => {
                console.error('❌ Video play error:', err);
                // Handle play interruption gracefully
                if (err.name === 'AbortError' || err.message.includes('interrupted')) {
                  console.log('🔄 Play was interrupted, retrying...');
                  // Retry after a short delay
                  setTimeout(() => {
                    if (videoElement && videoElement.srcObject === cameraStream) {
                      videoElement.play().then(() => {
                        console.log('✅ Video retry successful');
                        setCameraStatus('playing');
                      }).catch((retryErr) => {
                        console.error('❌ Video retry failed:', retryErr);
                        setCameraStatus('error');
                      });
                    }
                  }, 200);
                } else {
                  setCameraStatus('error');
                }
              });
            }
          }
        }, 200);
      };

      const handleCanPlay = () => {
        console.log('📹 Video can play');
        setCameraStatus('playing');
      };

      const handleError = (err) => {
        console.error('❌ Video error:', err);
        setCameraStatus('error');
      };

      // Add event listeners
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      videoElement.addEventListener('canplay', handleCanPlay, { once: true });
      videoElement.addEventListener('error', handleError, { once: true });

      // If video is already ready, play immediately
      if (videoElement.readyState >= 2) {
        handleLoadedMetadata();
      }

      // Cleanup function
      return () => {
        if (videoElement) {
          videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoElement.removeEventListener('canplay', handleCanPlay);
          videoElement.removeEventListener('error', handleError);
        }
      };
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
