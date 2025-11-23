#!/usr/bin/env node

/**
 * Calendar Converter - Converts text, files, or images to ICS calendar files
 * using Google's Gemini API.
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createEvents } = require('ics');

class CalendarConverter {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error(
                'Gemini API key is required. Set GEMINI_API_KEY environment variable ' +
                'or pass it via --api-key argument.'
            );
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-2.5-flash (confirmed available with your API key)
        // This model supports both text and images
        // CRITICAL: Must use exact model name 'gemini-2.5-flash' - no defaults
        console.log('Initializing Gemini model: gemini-2.5-flash');
        this.model = this.genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash'
        });
        console.log('Model initialized successfully');
    }

    /**
     * Read image file and convert to base64
     */
    async readImage(imagePath) {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = this.getMimeType(imagePath);
        return {
            inlineData: {
                data: base64Image,
                mimeType: mimeType
            }
        };
    }

    /**
     * Get MIME type from file extension
     */
    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
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
     * Read text file content
     */
    readFile(filePath) {
        return fs.readFileSync(filePath, 'utf-8');
    }

    /**
     * Extract calendar information using Gemini API
     */
    async extractCalendarInfo(content, isImage = false) {
        const prompt = `Extract ALL calendar events from the following content. This may be a full schedule with multiple events, a class schedule, a meeting calendar, or any list of events.

Return a JSON object with the following structure:
{
    "events": [
        {
            "title": "Event title",
            "description": "Event description (optional)",
            "start_time": "YYYY-MM-DD HH:MM or YYYY-MM-DD",
            "end_time": "YYYY-MM-DD HH:MM or YYYY-MM-DD (optional, defaults to start_time + 1 hour)",
            "location": "Event location (optional)",
            "attendees": ["email1@example.com", "email2@example.com"] (optional)
        }
    ]
}

IMPORTANT:
- Extract EVERY event from the schedule, not just one
- If the content is a weekly schedule, extract all days and times
- If it's a class schedule, extract all classes with their times
- If it's a meeting calendar, extract all meetings
- Parse recurring events as separate instances if dates are specified
- If no specific time is mentioned for an event, use reasonable defaults (9:00 AM start time)
- If only a date is given without time, assume 9:00 AM start time
- For class schedules, extract each class session separately
- Look for patterns like "Monday 2pm", "MWF 10:00-11:00", "Every Tuesday at 3pm", etc.

Return ONLY valid JSON, no additional text or explanations.`;

        try {
            // Ensure we're using gemini-2.5-flash - create fresh model instance to be sure
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            console.log('Using model: gemini-2.5-flash for API call');
            
            let response;
            
            if (isImage) {
                // For images, use gemini-2.5-flash (supports both text and images)
                const parts = [prompt, content];
                response = await model.generateContent(parts);
            } else {
                // For text content, use gemini-2.5-flash
                const fullPrompt = `${prompt}\n\nContent:\n${content}`;
                response = await model.generateContent(fullPrompt);
            }

            let responseText = response.response.text().trim();

            // Try to extract JSON if wrapped in markdown code blocks
            if (responseText.includes('```json')) {
                responseText = responseText.split('```json')[1].split('```')[0].trim();
            } else if (responseText.includes('```')) {
                responseText = responseText.split('```')[1].split('```')[0].trim();
            }

            return JSON.parse(responseText);
        } catch (error) {
            console.error('Error calling Gemini API:', error.message);
            throw error;
        }
    }

    /**
     * Parse datetime string to Date object
     */
    parseDateTime(dateStr) {
        // Try different formats
        const formats = [
            /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/,
            /^(\d{4})-(\d{2})-(\d{2})$/,
            /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/,
            /^(\d{2})\/(\d{2})\/(\d{4})$/,
            /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/,
            /^(\d{2})\/(\d{2})\/(\d{4})$/
        ];

        // Try YYYY-MM-DD HH:MM
        let match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?$/);
        if (match) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]);
            const day = parseInt(match[3]);
            const hour = match[4] ? parseInt(match[4]) : 9;
            const minute = match[5] ? parseInt(match[5]) : 0;
            return new Date(year, month - 1, day, hour, minute);
        }

        // Try MM/DD/YYYY HH:MM
        match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
        if (match) {
            const month = parseInt(match[1]);
            const day = parseInt(match[2]);
            const year = parseInt(match[3]);
            const hour = match[4] ? parseInt(match[4]) : 9;
            const minute = match[5] ? parseInt(match[5]) : 0;
            return new Date(year, month - 1, day, hour, minute);
        }

        throw new Error(`Unable to parse date: ${dateStr}`);
    }

    /**
     * Convert Date to ICS format array [year, month, day, hour, minute]
     */
    dateToICSArray(date) {
        return [
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate(),
            date.getHours(),
            date.getMinutes()
        ];
    }

    /**
     * Create ICS file from events data
     */
    async createICSFile(eventsData, outputPath) {
        const events = [];

        for (const eventData of eventsData.events || []) {
            const startDate = this.parseDateTime(eventData.start_time);
            const endDate = eventData.end_time 
                ? this.parseDateTime(eventData.end_time)
                : new Date(startDate.getTime() + 60 * 60 * 1000); // Default to 1 hour later

            const event = {
                title: eventData.title || 'Untitled Event',
                start: this.dateToICSArray(startDate),
                end: this.dateToICSArray(endDate),
                description: eventData.description || '',
                location: eventData.location || '',
                attendees: eventData.attendees || []
            };

            events.push(event);
        }

        const { error, value } = createEvents(events);

        if (error) {
            throw new Error(`Error creating calendar: ${error}`);
        }

        fs.writeFileSync(outputPath, value, 'utf-8');
        console.log(`✓ Created ICS file: ${outputPath}`);
        console.log(`✓ Added ${events.length} event(s) to calendar`);
    }

    /**
     * Convert text input to ICS file
     */
    async convertText(text, outputPath = 'calendar.ics') {
        console.log('Processing text with Gemini API...');
        const eventsData = await this.extractCalendarInfo(text, false);
        await this.createICSFile(eventsData, outputPath);
    }

    /**
     * Convert file input to ICS file
     */
    async convertFile(filePath, outputPath = null) {
        if (!outputPath) {
            outputPath = path.basename(filePath, path.extname(filePath)) + '.ics';
        }

        const fileExt = path.extname(filePath).toLowerCase();
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

        if (imageExtensions.includes(fileExt)) {
            console.log(`Processing image file: ${filePath}`);
            const image = await this.readImage(filePath);
            const eventsData = await this.extractCalendarInfo(image, true);
            await this.createICSFile(eventsData, outputPath);
        } else {
            console.log(`Processing text file: ${filePath}`);
            const text = this.readFile(filePath);
            const eventsData = await this.extractCalendarInfo(text, false);
            await this.createICSFile(eventsData, outputPath);
        }
    }

    /**
     * Convert image input to ICS file
     */
    async convertImage(imagePath, outputPath = null) {
        if (!outputPath) {
            outputPath = path.basename(imagePath, path.extname(imagePath)) + '.ics';
        }

        console.log(`Processing image: ${imagePath}`);
        const image = await this.readImage(imagePath);
        const eventsData = await this.extractCalendarInfo(image, true);
        await this.createICSFile(eventsData, outputPath);
    }
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('ERROR: GEMINI_API_KEY environment variable is required');
        console.error('Please set it before running:');
        console.error('  Windows: set GEMINI_API_KEY=your-key-here');
        console.error('  Linux/Mac: export GEMINI_API_KEY=your-key-here');
        process.exit(1);
    }
    let textInput = null;
    let fileInput = null;
    let imageInput = null;
    let outputPath = 'calendar.ics';

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--api-key' && args[i + 1]) {
            apiKey = args[i + 1];
            i++;
        } else if (args[i] === '--text' && args[i + 1]) {
            textInput = args[i + 1];
            i++;
        } else if (args[i] === '--file' && args[i + 1]) {
            fileInput = args[i + 1];
            i++;
        } else if (args[i] === '--image' && args[i + 1]) {
            imageInput = args[i + 1];
            i++;
        } else if (args[i] === '--output' && args[i + 1]) {
            outputPath = args[i + 1];
            i++;
        } else if (args[i] === '--help' || args[i] === '-h') {
            console.log(`
Usage: node calendar-converter.js [options]

Options:
  --api-key <key>    Gemini API key (or set GEMINI_API_KEY env var)
  --text <text>      Text input to convert
  --file <path>      File path to convert (text or image)
  --image <path>     Image file path to convert
  --output <path>    Output ICS file path (default: calendar.ics)
  --help, -h         Show this help message

Examples:
  node calendar-converter.js --text "Meeting on March 15, 2024 at 2 PM"
  node calendar-converter.js --file events.txt
  node calendar-converter.js --image screenshot.png --output my-calendar.ics
            `);
            process.exit(0);
        }
    }

    // Validate input
    const inputCount = [textInput, fileInput, imageInput].filter(Boolean).length;
    if (inputCount === 0) {
        console.error('Error: Please provide one of: --text, --file, or --image');
        console.error('Use --help for usage information');
        process.exit(1);
    }
    if (inputCount > 1) {
        console.error('Error: Please provide only one input type: --text, --file, or --image');
        process.exit(1);
    }

    try {
        const converter = new CalendarConverter(apiKey);

        if (textInput) {
            await converter.convertText(textInput, outputPath);
        } else if (fileInput) {
            await converter.convertFile(fileInput, outputPath);
        } else if (imageInput) {
            await converter.convertImage(imageInput, outputPath);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = CalendarConverter;

