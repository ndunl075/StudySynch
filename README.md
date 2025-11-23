# Calendar Converter

A full-stack web application that uses Google's Gemini API to convert schedules, text, files, or images into ICS calendar files that can be imported into Google Calendar or any calendar application.

## Features

- 🌐 **Web Interface**: Beautiful, modern UI for easy conversion
- 📝 **Text Input**: Paste your schedule descriptions
- 📄 **File Input**: Upload schedule files or images
- 🖼️ **Image Input**: Extract calendar information from images (screenshots, photos, etc.)
- 📅 **ICS Output**: Generate standard ICS files compatible with Google Calendar, Outlook, and other calendar apps
- 🚀 **REST API**: Backend API for programmatic access

## Prerequisites

- Node.js 14.0 or higher
- npm (comes with Node.js)
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## Installation

1. Clone or download this repository

2. Install the required dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Gemini API key:
   ```bash
   # Windows (PowerShell)
   $env:GEMINI_API_KEY="your-api-key-here"
   
   # Windows (Command Prompt)
   set GEMINI_API_KEY=your-api-key-here
   
   # Linux/Mac
   export GEMINI_API_KEY="your-api-key-here"
   ```
   
   Or create a `.env` file:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```

## Running the Application

### Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### Using the Web Interface

1. Open your browser and navigate to `http://localhost:3000`
2. Choose your input method:
   - **Text Tab**: Paste your schedule
   - **File Tab**: Upload a schedule file or image
   - **Image Tab**: Upload an image file
3. Click "Convert to ICS" and the file will download automatically

### Using the API

The backend provides REST API endpoints:

#### Convert Text
```bash
POST /api/convert/text
Content-Type: application/json

{
  "text": "Monday: Math 101, 9:00 AM - 10:30 AM, Room 205"
}
```

#### Convert File
```bash
POST /api/convert/file
Content-Type: multipart/form-data

file: [your file]
```

#### Health Check
```bash
GET /api/health
```

### Command Line Usage (Optional)

You can also use the command-line interface:

```bash
node calendar-converter.js --text "Meeting on March 15, 2024 at 2 PM"
node calendar-converter.js --file events.txt
node calendar-converter.js --image screenshot.png
```

## Project Structure

```
StudySynch/
├── server.js              # Express backend server
├── calendar-converter.js  # Core conversion logic (CLI)
├── package.json          # Dependencies
├── frontend/             # Frontend files
│   ├── index.html        # Main HTML page
│   ├── styles.css        # Styling
│   ├── script.js         # Frontend JavaScript
│   ├── favicon.png       # Favicon
│   └── favicon-32.png    # Small favicon
└── uploads/              # Temporary file uploads (auto-created)
```

## Deployment

See `DEPLOYMENT.md` for detailed instructions on deploying to Oracle Cloud Infrastructure or other platforms.

## Notes

- The Gemini API requires internet connectivity
- API key is already configured in the code
- API usage may be subject to rate limits and costs (check Google's pricing)
- For best results, provide clear and structured schedule information
- If times are not specified, events default to 9:00 AM
- If end times are not specified, events default to 1 hour duration
- Uploaded files are automatically cleaned up after processing

## Troubleshooting

**Error: "Gemini API key is required"**
- The API key is already configured in the code. If you see this error, check that the code hasn't been modified.

**Error: "Unable to parse date"**
- Try formatting dates more clearly (e.g., "2024-03-15 14:00" or "March 15, 2024 at 2 PM")

**Error: API rate limit exceeded**
- Wait a few minutes and try again, or check your API quota

**Error: Cannot find module**
- Make sure you've run `npm install` to install dependencies

## License

This project is provided as-is for educational and personal use.

## Author

Created by Nico Dunlap
