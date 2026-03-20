import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv("backend/.env")
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("No API Key found")
else:
    try:
        genai.configure(api_key=api_key)
        # Try a few common models
        for model_name in ["gemini-1.5-flash", "gemini-2.0-flash"]:
            try:
                print(f"Testing {model_name}...")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content("Hi")
                print(f"SUCCESS on {model_name}!")
                break
            except Exception as e:
                print(f"FAILED on {model_name}: {e}")
    except Exception as e:
        print(f"Config error: {e}")
