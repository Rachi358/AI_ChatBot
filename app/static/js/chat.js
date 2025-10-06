// AI_VOICE_ASSISTANT_WEB/app/static/js/chat.js

class ChatManager {
    constructor() {
        this.messages = [];
        this.isVoiceMode = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadChatHistory();
    }

    setupEventListeners() {
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-message');

        if (chatInput && sendButton) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            sendButton.addEventListener('click', () => this.sendMessage());
        }

        const voiceToggle = document.getElementById('voice-toggle');
        if (voiceToggle) {
            voiceToggle.addEventListener('click', () => this.toggleVoiceMode());
        }

        const clearChat = document.getElementById('clear-chat');
        if (clearChat) {
            clearChat.addEventListener('click', () => this.clearChat());
        }

        const voiceInputBtn = document.getElementById('voice-input-btn');
        if (voiceInputBtn) {
            voiceInputBtn.addEventListener('click', () => this.startVoiceInput());
        }
    }

    async sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();

        if (!message) return;

        chatInput.value = '';

        this.addMessage(message, true);

        UIManager.showTypingIndicator('chat-typing-indicator');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            this.addMessage(data.response, false);

            if (this.isVoiceMode) {
                this.speakMessage(data.response);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            UIManager.showNotification('Sorry, I had trouble processing that. Please try again.', 'error');
            this.addMessage('Sorry, I had trouble processing that. Please try again.', false);
        } finally {
            UIManager.hideTypingIndicator('chat-typing-indicator');
        }
    }

    addMessage(content, isUser) {
        const chatMessages = document.getElementById('chat-messages');
        const noMessages = document.getElementById('no-messages');

        if (noMessages) {
            noMessages.style.display = 'none';
        }

        const messageDiv = UIManager.createMessageElement(content, isUser); // Use UIManager
        chatMessages.appendChild(messageDiv);

        this.messages.push({
            content: content,
            isUser: isUser,
            timestamp: Date.now()
        });

        UIManager.scrollToBottom('chat-messages');
    }

    toggleVoiceMode() {
        this.isVoiceMode = !this.isVoiceMode;

        const button = document.getElementById('voice-toggle');
        const status = document.getElementById('chat-status');

        if (button && status) {
            if (this.isVoiceMode) {
                button.classList.remove('bg-gray-700');
                button.classList.add('bg-yara-blue');
                button.title = 'Disable Voice Mode';
                status.textContent = 'Voice mode enabled';
            } else {
                button.classList.add('bg-gray-700');
                button.classList.remove('bg-yara-blue');
                button.title = 'Enable Voice Mode';
                status.textContent = 'Ready to chat';
            }
        }
    }

    startVoiceInput() {
        if (window.yaraAssistant) {
            window.yaraAssistant.toggleListening();
        } else {
            UIManager.showNotification('Yara Assistant not initialized for voice input.', 'warning');
        }
    }

    async speakMessage(message) {
        try {
            const response = await fetch('/api/voice/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: message })
            });

            const data = await response.json();

            if (data.audio) {
                const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
                audio.play();
            }
        } catch (error) {
            console.error('Error playing audio from backend:', error);
            UIManager.showNotification('Could not play AI response audio.', 'error');
        }
    }

    clearChat() {
        const chatMessages = document.getElementById('chat-messages');
        const noMessages = document.getElementById('no-messages');

        if (chatMessages) {
            const messages = chatMessages.querySelectorAll('.chat-bubble-enter');
            messages.forEach(message => message.remove());

            if (noMessages) {
                noMessages.style.display = 'block';
            }
        }

        this.messages = [];
        UIManager.showNotification('Chat history cleared.', 'info');
    }

    async loadChatHistory() {
        try {
            const response = await fetch('/api/chat/history');
            const data = await response.json();

            if (data.history && data.history.length > 0) {
                data.history.forEach(chat => {
                    this.addMessage(chat.message, chat.is_user);
                });
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            UIManager.showNotification('Could not load chat history.', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatManager = new ChatManager();
});
