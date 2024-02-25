const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Route to serve photos by gender and number
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
// Path to the text file
const filePath = 'storedString.txt';

// POST route to save a string
app.post('/string', async (req, res) => {
    const { string } = req.body;
    try {
        await fs.writeFile(filePath, string);
        res.send('String saved successfully');
    } catch (err) {
        console.error('Error saving string:', err);
        res.status(500).send('Internal Server Error');
    }
});

// GET route to retrieve the stored string
app.get('/string', async (req, res) => {
    try {
        const storedString = await fs.readFile(filePath, 'utf-8');
        res.json({url:storedString});
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
