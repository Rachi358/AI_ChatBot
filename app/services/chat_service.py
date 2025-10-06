class ChatService:
    def __init__(self, api_client):
        self.api_client = api_client
        self.context = []
    
    def get_response(self, message):
        """Get response from AI API"""
        try:
            # Add message to context
            self.context.append({"role": "user", "content": message})
            
            # Get response from API
            response = self.api_client.generate_response(message, self.context)
            
            # Add response to context
            self.context.append({"role": "assistant", "content": response})
            
            # Keep context limited to last 10 exchanges
            if len(self.context) > 20:
                self.context = self.context[-20:]
            
            return response
        except Exception as e:
            return f"I apologize, but I encountered an error: {str(e)}"
    
    def clear_context(self):
        """Clear conversation context"""
        self.context = []