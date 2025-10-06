// AI_VOICE_ASSISTANT_WEB/app/static/js/wakeword.js

class WakeWordDetector {
    constructor() {
        this.isActive = false;
        this.isListening = false;
        this.wakeWord = 'yara'; // Default wake word
        this.sensitivity = 0.6; // Default sensitivity
        this.audioContext = null;
        this.microphone = null;
        this.processor = null;
        this.bufferSize = 4096;
        this.sampleRate = 16000; // Vosk model expects 16kHz

        this.init();
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.sampleRate
            });
            console.log('Wake word detector initialized');
        } catch (error) {
            console.error('Failed to initialize wake word detector:', error);
            UIManager.showNotification('Wake word detection not available (AudioContext error).', 'error');
        }
    }

    async startDetection() {
        if (this.isListening || !this.audioContext) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: this.sampleRate,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.processor = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);

            this.processor.onaudioprocess = (event) => {
                if (this.isActive) {
                    this.processAudioBuffer(event.inputBuffer);
                }
            };

            this.microphone.connect(this.processor);
            this.processor.connect(this.audioContext.destination); // Connect to destination to keep it alive

            this.isListening = true;
            console.log('Wake word detection started');

        } catch (error) {
            console.error('Failed to start wake word detection:', error);
            UIManager.showNotification('Failed to start wake word detection (microphone access denied or error).', 'error');
            throw error;
        }
    }

    stopDetection() {
        if (!this.isListening) return;

        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }

        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }

        // Stop the media stream tracks
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().then(() => {
                console.log('AudioContext closed.');
            }).catch(e => console.error('Error closing AudioContext:', e));
        }


        this.isListening = false;
        console.log('Wake word detection stopped');
    }

    processAudioBuffer(inputBuffer) {
        const audioData = inputBuffer.getChannelData(0); // Float32Array

        if (this.shouldProcessOnServer()) {
            this.processOnServer(audioData);
        } else {
            this.processLocally(audioData);
        }
    }

    processLocally(audioData) {
        // A more sophisticated local detection could involve:
        // 1. Feature extraction (e.g., MFCCs)
        // 2. A small, pre-trained neural network (e.g., using TensorFlow.js)
        // 3. A keyword spotting library (e.g., Picovoice Porcupine)

        // For this example, we'll use a slightly improved energy-based detection
        // combined with a very basic "pattern" check (still not robust for production)
        const energy = this.calculateEnergy(audioData);
        const energyThreshold = 0.02 * this.sensitivity; // Adjust threshold by sensitivity

        if (energy > energyThreshold) {
            // Simulate a more complex pattern detection
            const isWakeWord = this.simulateWakeWordPattern(audioData, energy);

            if (isWakeWord) {
                this.onWakeWordDetected();
            }
        }
    }

    async processOnServer(audioData) {
        try {
            // Convert Float32Array to a regular Array for JSON serialization
            const audioArray = Array.from(audioData);
            const response = await fetch('/api/wakeword/detect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // Changed to JSON
                },
                body: JSON.stringify({ audio_data: audioArray }) // Send as JSON array
            });

            const result = await response.json();

            if (result.wake_word_detected) {
                this.onWakeWordDetected();
            }

        } catch (error) {
            console.error('Server wake word detection error:', error);
            UIManager.showNotification('Server wake word detection failed.', 'error');
        }
    }

    calculateEnergy(audioData) {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
        }
        return Math.sqrt(sum / audioData.length);
    }

    simulateWakeWordPattern(audioData, energy) {
        // This is still a placeholder. A real implementation would use ML.
        // For demonstration, let's say a "pattern" is detected if:
        // 1. Energy is above a certain level
        // 2. There's some variation in the audio (not flat silence)
        // 3. A random chance (to simulate imperfect detection)
        const variation = Math.max(...audioData) - Math.min(...audioData);
        const randomFactor = Math.random();

        // Adjust these values for more or less frequent "detection"
        const minEnergy = 0.03;
        const minVariation = 0.1;
        const detectionChance = 0.05 * this.sensitivity; // Higher sensitivity = higher chance

        return energy > minEnergy && variation > minVariation && randomFactor < detectionChance;
    }

    onWakeWordDetected() {
        console.log('Wake word detected!');

        // Prevent multiple detections in a short period
        if (this.detectionTimeout) {
            clearTimeout(this.detectionTimeout);
        }
        this.deactivate(); // Temporarily deactivate to avoid re-triggering immediately

        // Trigger voice assistant
        if (window.yaraAssistant && !window.yaraAssistant.isListening) {
            window.yaraAssistant.startListening();
        }

        this.showWakeWordFeedback();
        this.playConfirmationSound();

        // Reactivate detection after a cool-down period
        this.detectionTimeout = setTimeout(() => {
            if (this.isActive) { // Only reactivate if still globally active
                this.activate();
            }
        }, 3000); // 3-second cooldown
    }

    showWakeWordFeedback() {
        const avatar = document.getElementById('yara-avatar');
        if (avatar) {
            avatar.classList.add('avatar-listening');
            setTimeout(() => {
                avatar.classList.remove('avatar-listening');
            }, 2000);
        }
        UIManager.showNotification('Wake word detected! Listening...', 'success');
    }

    playConfirmationSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }

    shouldProcessOnServer() {
        // This can be a user setting or based on browser capabilities
        return false; // Default to local processing for now
    }

    activate() {
        this.isActive = true;
        if (!this.isListening) {
            this.startDetection();
        }
        console.log('Wake word detector activated.');
    }

    deactivate() {
        this.isActive = false;
        if (this.isListening) {
            this.stopDetection();
        }
        console.log('Wake word detector deactivated.');
    }

    setSensitivity(sensitivity) {
        this.sensitivity = Math.max(0.1, Math.min(1.0, sensitivity));
        console.log(`Wake word sensitivity set to: ${this.sensitivity}`);
    }

    setWakeWord(wakeWord) {
        this.wakeWord = wakeWord.toLowerCase();
        console.log(`Wake word changed to: ${this.wakeWord}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.wakeWordDetector = new WakeWordDetector();

    const toggleBtn = document.getElementById('toggle-wake-word');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            // The logic for activating/deactivating the detector is now handled
            // by the YaraAssistant's toggleWakeWord method, which calls
            // wakeWordDetector.activate() or .deactivate().
            // This button's click handler is primarily for UI state change.
        });
    }
});