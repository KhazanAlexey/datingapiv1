const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');
const PORT = process.env.PORT || 3000;
const secretKey = 'yourSecretKey'; // This should ideally be stored in a secure environment
const photoDatafilePath = 'photosData.json';
// Path to the text file
const filePath = 'storedString.txt';
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
// Load users from file or initialize empty array
let users = [];
fs.readFile('users.json', 'utf-8')
    .then(data => {
        users = JSON.parse(data) ;
    })
    .catch(error => {
        console.error('Error reading file:', error);
    });

// Save users to file function
function saveUsersToFile() {
    fs.writeFile('users.json', JSON.stringify(users), err => {
        if (err) {
            console.error('Error writing users to file:', err);
        }
    });
}
// Middleware for verifying token
function verifyToken(req, res, next) {
    // console.log('req', req.headers);
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'Token not provided' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            console.error('Error verifying token:', err);
            return res.status(401).json({ message: 'Failed to authenticate token' });
        }
        req.user = decoded;
        next();
    });
}
// Endpoint for user registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Check if the username is already taken
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
    }

    // Add the new user to the list
    users.push({ username, password });
    saveUsersToFile(); // Save users to file
    res.status(201).json({ message: 'User registered successfully' });
});
// Endpoint for generating a token
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Dummy authentication logic (replace with your actual authentication logic)
    const user = users.find(u => u.username === username && u.password === password);
// console.log(req.body)
// console.log('users', users)
// console.log(user)
    if (user) {
        // Generate token
        const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '22h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});
// Route for serving photos with token verification
app.get('/photos/:gender/:photoName', verifyToken, (req, res, next) => {
    const gender = req.params.gender;
    const photoName = req.params.photoName;
    const photoPath = path.join(__dirname, 'public', 'photos', gender, photoName);
    res.sendFile(photoPath, (err) => {
        if (err) {
            next(err); // Pass error to the error handling middleware
        }
    });
});
// Middleware to parse JSON bodies
// Route for retrieving photo information
app.get('/photos', verifyToken, async (req, res) => {
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
