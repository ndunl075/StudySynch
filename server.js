// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const CalendarConverter = require('./calendar-converter');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('ERROR: GEMINI_API_KEY environment variable is required');
    console.error('Please set it before starting the server:');
    console.error('  Create a .env file with: GEMINI_API_KEY=your-key-here');
    console.error('  Or set it as an environment variable:');
    console.error('    Windows: set GEMINI_API_KEY=your-key-here');
    console.error('    Linux/Mac: export GEMINI_API_KEY=your-key-here');
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Initialize converter
const converter = new CalendarConverter(API_KEY);

/**
 * Helper function to convert buffer to image format for Gemini
 */
function bufferToImagePart(buffer, mimeType) {
    const base64Image = buffer.toString('base64');
    return {
        inlineData: {
            data: base64Image,
            mimeType: mimeType
        }
    };
}

/**
 * Helper function to get MIME type from file extension
 */
function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
}

/**
 * Helper function to check if file is an image
 */
function isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.includes(path.extname(filename).toLowerCase());
}

// API Routes

/**
 * POST /api/convert/text
 * Convert text input to ICS file
 */
app.post('/api/convert/text', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text input is required' });
        }

        console.log('Processing text input...');
        const eventsData = await converter.extractCalendarInfo(text, false);
        
        // Generate ICS content
        const events = [];
        for (const eventData of eventsData.events || []) {
            const startDate = converter.parseDateTime(eventData.start_time);
            const endDate = eventData.end_time 
                ? converter.parseDateTime(eventData.end_time)
                : new Date(startDate.getTime() + 60 * 60 * 1000);

            events.push({
                title: eventData.title || 'Untitled Event',
                start: converter.dateToICSArray(startDate),
                end: converter.dateToICSArray(endDate),
                description: eventData.description || '',
                location: eventData.location || '',
                attendees: eventData.attendees || []
            });
        }

        const { createEvents } = require('ics');
        const { error, value } = createEvents(events);

        if (error) {
            throw new Error(`Error creating calendar: ${error}`);
        }

        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
        res.send(value);
    } catch (error) {
        console.error('Error processing text:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/convert/file
 * Convert uploaded file to ICS
 */
app.post('/api/convert/file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'File is required' });
        }

        const filePath = req.file.path;
        const originalName = req.file.originalname;
        const isImage = isImageFile(originalName);

        let eventsData;
        
        if (isImage) {
            console.log(`Processing image file: ${originalName}`);
            const imageBuffer = fs.readFileSync(filePath);
            const mimeType = getMimeType(originalName);
            const imagePart = bufferToImagePart(imageBuffer, mimeType);
            eventsData = await converter.extractCalendarInfo(imagePart, true);
        } else {
            console.log(`Processing text file: ${originalName}`);
            const text = fs.readFileSync(filePath, 'utf-8');
            eventsData = await converter.extractCalendarInfo(text, false);
        }

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        // Generate ICS content
        const events = [];
        for (const eventData of eventsData.events || []) {
            const startDate = converter.parseDateTime(eventData.start_time);
            const endDate = eventData.end_time 
                ? converter.parseDateTime(eventData.end_time)
                : new Date(startDate.getTime() + 60 * 60 * 1000);

            events.push({
                title: eventData.title || 'Untitled Event',
                start: converter.dateToICSArray(startDate),
                end: converter.dateToICSArray(endDate),
                description: eventData.description || '',
                location: eventData.location || '',
                attendees: eventData.attendees || []
            });
        }

        const { createEvents } = require('ics');
        const { error, value } = createEvents(events);

        if (error) {
            throw new Error(`Error creating calendar: ${error}`);
        }

        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
        res.send(value);
    } catch (error) {
        // Clean up file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Error processing file:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Calendar Converter API is running' });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📅 Calendar Converter API ready`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

