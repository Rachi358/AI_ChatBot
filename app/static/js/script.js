// Main JavaScript for Yara AI Assistant /script.js

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
            this.showNotification('Speech recognition is not supported in this browser', 'warning');
        }
    }
    
    setupEventListeners() {
        // Mic button
        const micButton = document.getElementById('mic-button');
        if (micButton) {
            micButton.addEventListener('click', () => this.toggleListening());
        }
        
        // Start voice button
        const startVoiceBtn = document.getElementById('start-voice');
        if (startVoiceBtn) {
            startVoiceBtn.addEventListener('click', () => this.startVoiceChat());
        }
        
        // Wake word toggle
        const wakeWordBtn = document.getElementById('toggle-wake-word');
        if (wakeWordBtn) {
            wakeWordBtn.addEventListener('click', () => this.toggleWakeWord());
        }
        
        // Text input
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
        
        // Voice input in chat
        const voiceInputBtn = document.getElementById('voice-input-btn');
        if (voiceInputBtn) {
            voiceInputBtn.addEventListener('click', () => this.toggleListening());
        }
    }
    
    toggleListening() {
        if (!this.recognition) {
            this.showNotification('Speech recognition not available', 'error');
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
            this.showNotification('Could not start voice recognition', 'error');
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
        
        // Update UI
        const micStatusText = document.getElementById('mic-status-text');
        if (micStatusText) {
            micStatusText.textContent = 'Listening... Speak now';
        }
        
        // Show voice recording indicator
        const voiceRecording = document.getElementById('voice-recording');
        if (voiceRecording) {
            voiceRecording.classList.remove('hidden');
        }
    }
    
    onListeningEnd() {
        this.isListening = false;
        this.updateMicButton();
        this.updateStatus('ready');
        
        // Update UI
        const micStatusText = document.getElementById('mic-status-text');
        if (micStatusText) {
            micStatusText.textContent = 'Click to speak';
        }
        
        // Hide voice recording indicator
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
        this.showNotification(`Voice recognition error: ${error}`, 'error');
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
        this.showTypingIndicator();
        
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
            
            // Play audio response
            if (data.audio) {
                await this.playAudioResponse(data.audio);
            }
            
        } catch (error) {
            console.error('Error processing voice input:', error);
            this.showNotification('Sorry, I had trouble processing that. Please try again.', 'error');
            this.showAIMessage('Sorry, I had trouble processing that. Please try again.');
        } finally {
            this.isProcessing = false;
            this.hideTypingIndicator();
            this.updateStatus('ready');
        }
    }
    
    async sendTextMessage() {
        const textInput = document.getElementById('text-input');
        const text = textInput.value.trim();
        
        if (!text) return;
        
        textInput.value = '';
        this.showUserMessage(text);
        this.showTypingIndicator();
        
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
            this.showNotification('Failed to send message. Please try again.', 'error');
            this.showAIMessage('Sorry, I had trouble processing that. Please try again.');
        } finally {
            this.hideTypingIndicator();
        }
    }
    
    showUserMessage(message) {
        const conversation = document.getElementById('conversation');
        const noConversation = document.getElementById('no-conversation');
        
        if (noConversation) {
            noConversation.style.display = 'none';
        }
        
        const messageEl = this.createMessageElement(message, true);
        conversation.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    showAIMessage(message) {
        const conversation = document.getElementById('conversation');
        const messageEl = this.createMessageElement(message, false);
        conversation.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    createMessageElement(message, isUser) {
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
                    <p class="text-white text-sm">${this.escapeHtml(message)}</p>
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
    }
    
    showTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.classList.remove('hidden');
        }
        
        const chatIndicator = document.getElementById('chat-typing-indicator');
        if (chatIndicator) {
            chatIndicator.classList.remove('hidden');
        }
    }
    
    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
        
        const chatIndicator = document.getElementById('chat-typing-indicator');
        if (chatIndicator) {
            chatIndicator.classList.add('hidden');
        }
    }
    
    async playAudioResponse(audioBase64) {
        try {
            // Stop any currently playing audio
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
            
            // Create audio element
            const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
            this.currentAudio = audio;
            
            // Update avatar state
            const avatar = document.getElementById('yara-avatar');
            if (avatar) {
                avatar.classList.add('avatar-speaking');
            }
            
            // Play audio
            await audio.play();
            
            // Remove avatar state when finished
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
        const micStatusText = document.getElementById('mic-status').querySelector('span');
        
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
        const statusText = document.getElementById('wake-word-status').querySelector('span');
        
        if (button && indicator && statusText) {
            if (this.wakeWordActive) {
                button.classList.remove('bg-gray-700');
                button.classList.add('bg-gradient-to-r', 'from-yara-blue', 'to-yara-purple');
                button.innerHTML = '<i class="fas fa-ear-listen mr-2"></i>Disable Wake Word';
                
                indicator.classList.remove('bg-gray-500');
                indicator.classList.add('status-active');
                statusText.textContent = 'Wake Word: Active';
                
                this.showNotification('Wake word "Hey Yara" is now active', 'success');
            } else {
                button.classList.add('bg-gray-700');
                button.classList.remove('bg-gradient-to-r', 'from-yara-blue', 'to-yara-purple');
                button.innerHTML = '<i class="fas fa-ear-listen mr-2"></i>Enable Wake Word';
                
                indicator.classList.add('bg-gray-500');
                indicator.classList.remove('status-active');
                statusText.textContent = 'Wake Word: Off';
                
                this.showNotification('Wake word detection disabled', 'info');
            }
        }
    }
    
    startVoiceChat() {
        this.startListening();
        this.showNotification('Voice chat started! Speak now.', 'success');
    }
    
    scrollToBottom() {
        const conversation = document.getElementById('conversation');
        if (conversation) {
            conversation.scrollTop = conversation.scrollHeight;
        }
        
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
        
        // Set notification style based on type
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
                <span>${this.escapeHtml(message)}</span>
                <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }
}

// Initialize Yara Assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.yaraAssistant = new YaraAssistant();
});