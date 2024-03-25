const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const PORT = process.env.PORT || 3000;
const https = require('https');
// const morgan = require("morgan");

// Middleware
// app.use(morgan("dev"));///////////////
// Serve static files from the public directory
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


// Route to serve photos by gender and number
app.use((req, res, next) => {
    if (req.secure) {
        next();
    } else {
        res.redirect('https://' + req.headers.host + req.url);
    }
});

app.get('/photos/:gender/:photoName', (req, res, next) => {
    const gender = req.params.gender;
    const photoName = req.params.photoName;
    const photoPath = path.join(__dirname, 'public', 'photos', gender, photoName);
    res.sendFile(photoPath, (err) => {
        if (err) {
            next(err); // Pass error to the error handling middleware
        }
    });
});
const photoDatafilePath = 'photosData.json';
// Middleware to parse JSON bodies
app.get('/photos', async (req, res) => {
    try {
        const photoDirectory = path.join(__dirname, 'public', 'photos');
        const genders = await fs.readdir(photoDirectory);
        const photoDatafile = await fs.readFile(photoDatafilePath, 'utf-8');
        const photoDatafileData = JSON.parse(photoDatafile);
        const photoInfo = photoDatafileData;

        for (const gender of genders) {
            const genderPath = path.join(photoDirectory, gender);
            const photos = await fs.readdir(genderPath);
            photoInfo[gender] = photos;
        }

        res.json(photoInfo);
    } catch (err) {
        console.error('Error retrieving photo information:', err);
        res.status(500).send('Internal Server Error');
    }
});
// Serve JSON file with Access-Control-Allow-Origin header
app.get('/locales/:lng', async (req, res, next) => {
    const lng = req.params.lng;
    const filePath = path.join(__dirname, 'locales', lng, 'common.json');
    try {
        const data = await fs.readFile(filePath, 'utf8');
        res.header('Access-Control-Allow-Origin', '*');
        res.json(JSON.parse(data));
    } catch (err) {
        next(err); // Pass error to the error handling middleware
    }
});
app.get('/locales', async (req, res, next) => {
    const lng = req.params.lng;
    const filePath = path.join(__dirname, 'locales', 'all', 'all.json');
    try {
        const data = await fs.readFile(filePath, 'utf8');
        res.header('Access-Control-Allow-Origin', '*');
        res.json(JSON.parse(data));
    } catch (err) {
        next(err); // Pass error to the error handling middleware
    }
});
// Update key-value pair in JSON file with PUT request
app.put('/locales/:lng', async (req, res, next) => {
    const lng = req.params.lng;
    const filePath = path.join(__dirname, 'locales', lng, 'common.json');
    try {
        // Read the existing JSON data
        let jsonData = await fs.readFile(filePath, 'utf8');
        jsonData = JSON.parse(jsonData);

        // Update the value for the specified key
        const { key, value } = req.body;
        jsonData[key] = value;

        // Write the updated JSON data back to the file
        await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));

        // Set Access-Control-Allow-Origin header
        res.header('Access-Control-Allow-Origin', '*');

        res.status(200).send('Key-Value pair updated successfully');
    } catch (err) {
        next(err); // Pass error to the error handling middleware
    }
});
// Path to the text file
const webVieWUrl = 'storedString.txt';
const redirectConditions = 'redirectConditions.json';

// POST route to save a string
app.post('/string', async (req, res) => {
    const { string } = req.body;
    try {
        await fs.writeFile(webVieWUrl, string);
        res.send('String saved successfully');
    } catch (err) {
        console.error('Error saving string:', err);
        res.status(500).send('Internal Server Error');
    }
});

// GET route to retrieve the stored string
app.get('/string', async (req, res) => {
    try {
        const storedString = await fs.readFile(webVieWUrl, 'utf-8');
        res.json({url:storedString});
    } catch (err) {
        console.error('Error retrieving string:', err);
        res.status(500).send('Internal Server Error');
    }
});
// GET route to retrieve the stored string
app.get('/country', async (req, res) => {
    try {
        const redirectCond = await fs.readFile(redirectConditions, 'utf-8');
        const redirectParsed= JSON.parse(redirectCond);
        res.json(redirectParsed);
    } catch (err) {
        console.error('Error retrieving string:', err);
        res.status(500).send('Internal Server Error');
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

// HTTPS options
let options = {};

// Read SSL certificate and key files asynchronously
Promise.all([
    fs.readFile('server.key'),
    fs.readFile('server.cert')
])
    .then(([key, cert]) => {
        options = {
            key: key,
            cert: cert
        };

        // Create HTTPS server
        const server = https.createServer(options, app);

        // Start the server
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error('Error reading SSL certificate or key file:', error);
        process.exit(1); // Terminate the process
    });
