import requests
import json

URLS = ["http://localhost:11434/api/generate", "http://127.0.0.1:11434/api/generate"]
MODEL = "llama2:latest"

for URL in URLS:
    try:
        print(f"Testing connection to {URL} with model {MODEL}...")
        response = requests.post(
            URL,
            json={"model": MODEL, "prompt": "Hi, are you ready?", "stream": False},
            timeout=5
        )
        if response.status_code == 200:
            print(f"SUCCESS on {URL}! Response: {response.json().get('response')[:50]}...")
            break
        else:
            print(f"FAILED on {URL}. Status: {response.status_code}")
    except Exception as e:
        print(f"ERROR on {URL}: {e}")
