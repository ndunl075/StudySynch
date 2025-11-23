import google.generativeai as genai
import os

# Get API key from environment variable
API_KEY = os.environ.get("GEMINI_API_KEY")

if not API_KEY:
    print("ERROR: GEMINI_API_KEY environment variable not set")
    print("\nSet it with:")
    print("  Windows PowerShell: $env:GEMINI_API_KEY='your-api-key-here'")
    print("  Windows CMD: set GEMINI_API_KEY=your-api-key-here")
    print("  Linux/Mac: export GEMINI_API_KEY='your-api-key-here'")
    exit(1)

genai.configure(api_key=API_KEY)

print("=" * 70)
print("Available Gemini Models (with generateContent support)")
print("=" * 70)
print()

models_list = []
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        model_name = m.name.replace('models/', '')
        models_list.append({
            'name': model_name,
            'full_name': m.name,
            'display_name': m.display_name,
            'methods': list(m.supported_generation_methods)
        })

# Sort by name
models_list.sort(key=lambda x: x['name'])

print(f"Found {len(models_list)} models:\n")
for model in models_list:
    print(f"✅ {model['name']}")
    print(f"   Display: {model['display_name']}")
    print(f"   Methods: {', '.join(model['methods'])}")
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
        print(f"✅ {check_model} - AVAILABLE")
    else:
        print(f"❌ {check_model} - NOT AVAILABLE")

print()
print("=" * 70)
print("Recommended for this project:")
print("  - Text: gemini-pro or gemini-1.5-flash")
print("  - Images: gemini-pro-vision or gemini-1.5-flash")
print("=" * 70)