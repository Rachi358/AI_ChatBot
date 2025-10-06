// AI_VOICE_ASSISTANT_WEB/app/static/js/main.js

// Utility functions for UI interactions
const UIManager = {
    escapeHtml: function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    },

    scrollToBottom: function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    },

    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;

        switch (type) {
            case 'success':
                notification.classList.add('bg-green-600', 'text-white');
                break;
            case 'error':
                notification.classList.add('bg-red-600', 'text-white');
                break;
            case 'warning':
                notification.classList.add('bg-yellow-600', 'text-white');
                break;
            default:
                notification.classList.add('bg-blue-600', 'text-white');
        }

        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${UIManager.escapeHtml(message)}</span>
                <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    },

    // Generic message display for main page conversation
    createMessageElement: function(message, isUser) {
        const div = document.createElement('div');
        div.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 chat-bubble-enter`;

        div.innerHTML = `
            <div class="flex items-start space-x-3 max-w-xs lg:max-w-md">
                ${!isUser ? `
                    <div class="w-8 h-8 bg-gradient-to-r from-yara-blue to-yara-purple rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-robot text-sm text-white"></i>
                    </div>
                ` : ''}
                <div class="${isUser ? 'bg-gradient-to-r from-yara-blue to-yara-purple' : 'bg-gray-700'} rounded-2xl px-4 py-2 ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}">
                    <p class="text-white text-sm">${UIManager.escapeHtml(message)}</p>
                    <div class="text-xs ${isUser ? 'text-blue-100' : 'text-gray-300'} mt-1">
                        ${new Date().toLocaleTimeString()}
                    </div>
                </div>
                ${isUser ? `
                    <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-user text-sm text-white"></i>
                    </div>
                ` : ''}
            </div>
        `;
        return div;
    },

    showTypingIndicator: function(elementId) {
        const indicator = document.getElementById(elementId);
        if (indicator) {
            indicator.classList.remove('hidden');
        }
    },

    hideTypingIndicator: function(elementId) {
        const indicator = document.getElementById(elementId);
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }
};


class YaraAssistant {
    constructor() {
        this.isListening = false;
        this.isProcessing = false;
        this.wakeWordActive = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentAudio = null;

        this.init();
    }

    init() {
        this.setupSpeechRecognition();
        this.setupEventListeners();
        this.updateStatus();
        this.setupNavigationEffects(); // Moved from original main.js
        this.setupDarkModeToggle(); // Moved from original main.js
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();

            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.onListeningStart();
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.onSpeechResult(transcript);
            };

            this.recognition.onerror = (event) => {
                this.onSpeechError(event.error);
            };

            this.recognition.onend = () => {
                this.onListeningEnd();
            };
        } else {
            console.warn('Speech recognition not supported');
            UIManager.showNotification('Speech recognition is not supported in this browser', 'warning');
        }
    }

    setupEventListeners() {
        const micButton = document.getElementById('mic-button');
        if (micButton) {
            micButton.addEventListener('click', () => this.toggleListening());
        }

        const startVoiceBtn = document.getElementById('start-voice');
        if (startVoiceBtn) {
            startVoiceBtn.addEventListener('click', () => this.startVoiceChat());
        }

        const wakeWordBtn = document.getElementById('toggle-wake-word');
        if (wakeWordBtn) {
            wakeWordBtn.addEventListener('click', () => this.toggleWakeWord());
        }

        const textInput = document.getElementById('text-input');
        const sendTextBtn = document.getElementById('send-text');

        if (textInput && sendTextBtn) {
            textInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendTextMessage();
                }
            });

            sendTextBtn.addEventListener('click', () => this.sendTextMessage());
        }

        // Voice input button in chat (if this script is loaded on chat.html)
        const voiceInputBtn = document.getElementById('voice-input-btn');
        if (voiceInputBtn) {
            voiceInputBtn.addEventListener('click', () => this.toggleListening());
        }
    }

    setupNavigationEffects() {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('mouseenter', function() {
                this.classList.add('text-yara-blue');
            });
            link.addEventListener('mouseleave', function() {
                this.classList.remove('text-yara-blue');
            });
        });
    }

    setupDarkModeToggle() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.documentElement.classList.add('dark');
        }

        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
                localStorage.setItem(
                    'darkMode',
                    document.documentElement.classList.contains('dark')
                );
            });
        }
    }

    toggleListening() {
        if (!this.recognition) {
            UIManager.showNotification('Speech recognition not available', 'error');
            return;
        }

        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    startListening() {
        if (this.isProcessing) return;

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            UIManager.showNotification('Could not start voice recognition', 'error');
        }
    }

    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    onListeningStart() {
        this.isListening = true;
        this.updateMicButton();
        this.updateStatus('listening');

        const micStatusText = document.getElementById('mic-status-text');
        if (micStatusText) {
            micStatusText.textContent = 'Listening... Speak now';
        }

        const voiceRecording = document.getElementById('voice-recording');
        if (voiceRecording) {
            voiceRecording.classList.remove('hidden');
        }
    }

    onListeningEnd() {
        this.isListening = false;
        this.updateMicButton();
        this.updateStatus('ready');

        const micStatusText = document.getElementById('mic-status-text');
        if (micStatusText) {
            micStatusText.textContent = 'Click to speak';
        }

        const voiceRecording = document.getElementById('voice-recording');
        if (voiceRecording) {
            voiceRecording.classList.add('hidden');
        }
    }

    onSpeechResult(transcript) {
        console.log('Speech result:', transcript);
        this.processVoiceInput(transcript);
    }

    onSpeechError(error) {
        console.error('Speech recognition error:', error);
        UIManager.showNotification(`Voice recognition error: ${error}`, 'error');
        this.updateStatus('error');

        setTimeout(() => {
            this.updateStatus('ready');
        }, 3000);
    }

    async processVoiceInput(text) {
        if (!text.trim()) return;

        this.showUserMessage(text);
        this.isProcessing = true;
        this.updateStatus('processing');
        UIManager.showTypingIndicator('typing-indicator');

        try {
            const response = await fetch('/api/voice/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            this.showAIMessage(data.response);

            if (data.audio) {
                await this.playAudioResponse(data.audio);
            }

        } catch (error) {
            console.error('Error processing voice input:', error);
            UIManager.showNotification('Sorry, I had trouble processing that. Please try again.', 'error');
            this.showAIMessage('Sorry, I had trouble processing that. Please try again.');
        } finally {
            this.isProcessing = false;
            UIManager.hideTypingIndicator('typing-indicator');
            this.updateStatus('ready');
        }
    }

    async sendTextMessage() {
        const textInput = document.getElementById('text-input');
        const text = textInput.value.trim();

        if (!text) return;

        textInput.value = '';
        this.showUserMessage(text);
        UIManager.showTypingIndicator('typing-indicator');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            this.showAIMessage(data.response);

        } catch (error) {
            console.error('Error sending message:', error);
            UIManager.showNotification('Failed to send message. Please try again.', 'error');
            this.showAIMessage('Sorry, I had trouble processing that. Please try again.');
        } finally {
            UIManager.hideTypingIndicator('typing-indicator');
        }
    }

    showUserMessage(message) {
        const conversation = document.getElementById('conversation');
        const noConversation = document.getElementById('no-conversation');

        if (noConversation) {
            noConversation.style.display = 'none';
        }

        const messageEl = UIManager.createMessageElement(message, true);
        conversation.appendChild(messageEl);
        UIManager.scrollToBottom('conversation');
    }

    showAIMessage(message) {
        const conversation = document.getElementById('conversation');
        const messageEl = UIManager.createMessageElement(message, false);
        conversation.appendChild(messageEl);
        UIManager.scrollToBottom('conversation');
    }

    async playAudioResponse(audioBase64) {
        try {
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }

            const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
            this.currentAudio = audio;

            const avatar = document.getElementById('yara-avatar');
            if (avatar) {
                avatar.classList.add('avatar-speaking');
            }

            await audio.play();

            audio.addEventListener('ended', () => {
                if (avatar) {
                    avatar.classList.remove('avatar-speaking');
                }
                this.currentAudio = null;
            });

        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    updateMicButton() {
        const micButton = document.getElementById('mic-button');
        if (!micButton) return;

        micButton.className = 'w-24 h-24 bg-gradient-to-r rounded-full flex items-center justify-center text-3xl text-white transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed mx-auto';

        if (this.isListening) {
            micButton.classList.add('mic-button-listening');
            micButton.innerHTML = '<i class="fas fa-stop"></i>';
        } else if (this.isProcessing) {
            micButton.classList.add('mic-button-processing');
            micButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
            micButton.classList.add('from-yara-blue', 'to-yara-purple');
            micButton.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }

    updateStatus(status = 'ready') {
        const micIndicator = document.getElementById('mic-indicator');
        const micStatusText = document.getElementById('mic-status')?.querySelector('span'); // Use optional chaining

        if (micIndicator && micStatusText) {
            micIndicator.className = 'w-3 h-3 rounded-full';

            switch (status) {
                case 'listening':
                    micIndicator.classList.add('status-listening');
                    micStatusText.textContent = 'Microphone: Listening';
                    break;
                case 'processing':
                    micIndicator.classList.add('status-active');
                    micStatusText.textContent = 'Microphone: Processing';
                    break;
                case 'error':
                    micIndicator.classList.add('status-error');
                    micStatusText.textContent = 'Microphone: Error';
                    break;
                default:
                    micIndicator.classList.add('bg-gray-500');
                    micStatusText.textContent = 'Microphone: Ready';
            }
        }
    }

    toggleWakeWord() {
        this.wakeWordActive = !this.wakeWordActive;

        const button = document.getElementById('toggle-wake-word');
        const indicator = document.getElementById('wake-word-indicator');
        const statusText = document.getElementById('wake-word-status')?.querySelector('span'); // Use optional chaining

        if (button && indicator && statusText) {
            if (this.wakeWordActive) {
                button.classList.remove('bg-gray-700');
                button.classList.add('bg-gradient-to-r', 'from-yara-blue', 'to-yara-purple');
                button.innerHTML = '<i class="fas fa-ear-listen mr-2"></i>Disable Wake Word';

                indicator.classList.remove('bg-gray-500');
                indicator.classList.add('status-active');
                statusText.textContent = 'Wake Word: Active';

                UIManager.showNotification('Wake word "Hey Yara" is now active', 'success');
                if (window.wakeWordDetector) {
                    window.wakeWordDetector.activate();
                }
            } else {
                button.classList.add('bg-gray-700');
                button.classList.remove('bg-gradient-to-r', 'from-yara-blue', 'to-yara-purple');
                button.innerHTML = '<i class="fas fa-ear-listen mr-2"></i>Enable Wake Word';

                indicator.classList.add('bg-gray-500');
                indicator.classList.remove('status-active');
                statusText.textContent = 'Wake Word: Off';

                UIManager.showNotification('Wake word detection disabled', 'info');
                if (window.wakeWordDetector) {
                    window.wakeWordDetector.deactivate();
                }
            }
        }
    }

    startVoiceChat() {
        this.startListening();
        UIManager.showNotification('Voice chat started! Speak now.', 'success');
    }
}

// Initialize Yara Assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.yaraAssistant = new YaraAssistant();
});
