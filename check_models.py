#!/usr/bin/env python3
"""
Check available Gemini models using the Google Generative AI API
Works without installing google-generativeai library
"""

import os
import sys
import requests
import json

# Get API key from environment variable
API_KEY = os.environ.get("GEMINI_API_KEY")

if not API_KEY:
    print("ERROR: GEMINI_API_KEY environment variable not set")
    print("\nSet it with:")
    print("  Windows PowerShell: $env:GEMINI_API_KEY='your-api-key-here'")
    print("  Windows CMD: set GEMINI_API_KEY=your-api-key-here")
    print("  Linux/Mac: export GEMINI_API_KEY='your-api-key-here'")
    sys.exit(1)

# API endpoint to list models
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

print("=" * 70)
print("Fetching available Gemini models...")
print("=" * 70)
print()

try:
    response = requests.get(url)
    response.raise_for_status()
    
    data = response.json()
    
    if 'models' in data:
        print(f"Found {len(data['models'])} available models:\n")
        
        # Process and sort models
        models_list = []
        for model in data['models']:
            model_name = model.get('name', 'Unknown').replace('models/', '')
            models_list.append({
                'name': model_name,
                'full_name': model.get('name', ''),
                'display_name': model.get('displayName', 'N/A'),
                'version': model.get('version', 'N/A'),
                'methods': model.get('supportedGenerationMethods', [])
            })
        
        # Sort by name
        models_list.sort(key=lambda x: x['name'])
        
        # Display all models
        for model in models_list:
            print(f"[*] {model['name']}")
            print(f"    Display: {model['display_name']}")
            print(f"    Version: {model['version']}")
            if model['methods']:
                print(f"    Methods: {', '.join(model['methods'])}")
            print()
        
        # Check specific models we're interested in
        print("=" * 70)
        print("Model Availability for Calendar Converter:")
        print("=" * 70)
        
        check_models = [
            'gemini-pro',
            'gemini-pro-vision',
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-2.5-flash',
            'gemini-2.5-pro'
        ]
        
        available_names = [m['name'] for m in models_list]
        for check_model in check_models:
            if check_model in available_names:
                print(f"[OK] {check_model} - AVAILABLE")
            else:
                print(f"[NO] {check_model} - NOT AVAILABLE")
        
        print()
        print("=" * 70)
        print("Recommended for this project:")
        print("  - Text: gemini-pro or gemini-1.5-flash")
        print("  - Images: gemini-pro-vision or gemini-1.5-flash")
        print("=" * 70)
        
    else:
        print("No models found in response")
        print("Response:", json.dumps(data, indent=2))
        
except requests.exceptions.HTTPError as e:
    print(f"HTTP Error: {e}")
    if hasattr(e, 'response') and e.response is not None:
        try:
            error_data = e.response.json()
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Response: {e.response.text}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
