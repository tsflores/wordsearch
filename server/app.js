const express = require('express');;
const path = require('node:path');


const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from the dist directory with proper MIME types
app.use(express.static(path.join(__dirname, '../dist'), {
    setHeaders: (res, filePath) => {
        // Set proper MIME types for JavaScript modules
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Catch-all handler: send back index.html for any non-API, non-static routes
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Don't serve index.html for static file requests (let them 404 properly)
    if (req.path.includes('.')) {
        return res.status(404).send('File not found');
    }
    
    // For everything else, serve index.html (SPA routing)
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});