require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'data', 'messages.json');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase configuration. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY in your .env file.');
    process.exit(1);
}

if (/sb_publishable_|publishable/i.test(SUPABASE_SERVICE_ROLE_KEY)) {
    console.error('❌ Supabase key appears to be publishable. Use your Supabase secret/service-role key from Project Settings -> API.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for local development
    methods: ['GET', 'POST'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(__dirname));

// Contact Form Route
app.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    // Server-side validation (double check even though frontend validates)
    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            error: 'All fields are required.'
        });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid email address.'
        });
    }

    const nameTrimmed = name.trim();
    const emailTrimmed = email.trim();
    const messageTrimmed = message.trim();

    // Insert into Supabase and return the actual saved row.
    let inserted, insertError;

    const insertResponse = await supabase
        .from('contacts')
        .insert([{ name: nameTrimmed, email: emailTrimmed, message: messageTrimmed }])
        .select('*')
        .single();

    inserted = insertResponse.data;
    insertError = insertResponse.error;

    if (insertError) {
        console.error('❌ Supabase insert failed:', insertError.message || insertError);
        if (insertError.message && insertError.message.toLowerCase().includes('row-level security')) {
            console.error('❌ This usually means the Supabase key cannot bypass RLS. Verify SUPABASE_SERVICE_ROLE_KEY is a valid service role key.');
        }
        return res.status(500).json({
            success: false,
            error: insertError.message || 'Unable to save your message to the database. Please check the Supabase configuration and try again later.'
        });
    }

    if (inserted) {
        inserted.submitted_at = inserted.submitted_at || inserted.created_at || new Date().toISOString();
    }

    console.log(`📩 New message saved! From: ${inserted.name} <${inserted.email}>`);
    console.log('📩 Inserted row:', inserted);

    return res.status(200).json({
        success: true,
        message: 'Message received successfully!',
        inserted
    });
});

// Messages list route
// This route returns saved contact messages from the backend.
// It is the backend-safe way to review messages, instead of exposing direct public DB access.
app.get('/messages', async (req, res) => {
    let response = await supabase
        .from('contacts')
        .select('*')
        .order('submitted_at', { ascending: false });

    if (response.error && response.error.message && response.error.message.includes('submitted_at')) {
        response = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false });
    }

    if (response.error) {
        console.error('❌ Failed to fetch messages:', response.error.message || response.error);
        return res.status(500).json({
            success: false,
            error: 'Failed to load messages from backend.'
        });
    }

    const data = response.data.map(item => ({
        ...item,
        submitted_at: item.submitted_at || item.created_at || null
    }));

    return res.status(200).json({
        success: true,
        messages: data
    });
});

// Health Check Route
app.get('/', (req, res) => {
    res.send('✅ Mari Kaipeng Portfolio Backend is running.');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
