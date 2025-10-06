import google.generativeai as genai

# ---- Step 1: Use API key directly ----
API_KEY = ""  # Replace with your real key
genai.configure(api_key=API_KEY)

# ---- Step 2: List available models ----
try:
    models = list(genai.list_models())
    print("Available Gemini models:")
    for m in models:
        print("-", m.name)  # Use attribute .name instead of dictionary
except Exception as e:
    print("Error listing models:", e)

# ---- Step 3: Generate a simple response ----
try:
    # Replace with a model from the list above that supports generateContent
    model_name = "chat-bison-001"  
    model = genai.GenerativeModel(model_name)
    
    prompt = "Hello! Introduce yourself briefly."
    response = model.generate_content(prompt)
    print("\nResponse from Gemini:")
    print(response.text.strip())
except Exception as e:
    print("Error generating content:", e)
