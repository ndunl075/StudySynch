// Vercel serverless function entry point
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const CalendarConverter = require('../calendar-converter');

// Load environment variables
require('dotenv').config();

const app = express();

// Configure multer for file uploads (using memory storage for serverless)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (!res.headersSent) {
        res.status(500).json({ 
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
        });
    }
});

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('ERROR: GEMINI_API_KEY environment variable is required');
    // Don't create converter if API key is missing - will fail on first request
}

let converter;
try {
    if (API_KEY) {
        converter = new CalendarConverter(API_KEY);
    }
} catch (error) {
    console.error('Error initializing CalendarConverter:', error);
}

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

function isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.includes(path.extname(filename).toLowerCase());
}

// API Routes

app.post('/api/convert/text', async (req, res) => {
    try {
        if (!converter) {
            return res.status(500).json({ error: 'Calendar converter not initialized. GEMINI_API_KEY is required.' });
        }

        const { text } = req.body;
        
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text input is required' });
        }

        console.log('Processing text input...');
        const eventsData = await converter.extractCalendarInfo(text, false);
        
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

app.post('/api/convert/file', upload.single('file'), async (req, res) => {
    try {
        if (!converter) {
            return res.status(500).json({ error: 'Calendar converter not initialized. GEMINI_API_KEY is required.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'File is required' });
        }

        const originalName = req.file.originalname;
        const isImage = isImageFile(originalName);

        let eventsData;
        
        if (isImage) {
            console.log(`Processing image file: ${originalName}`);
            const mimeType = getMimeType(originalName);
            const imagePart = bufferToImagePart(req.file.buffer, mimeType);
            eventsData = await converter.extractCalendarInfo(imagePart, true);
        } else {
            console.log(`Processing text file: ${originalName}`);
            const text = req.file.buffer.toString('utf-8');
            eventsData = await converter.extractCalendarInfo(text, false);
        }

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
        console.error('Error processing file:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Calendar Converter API is running' });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Export for Vercel
// Note: Vercel expects the Express app to be exported directly
module.exports = app;

