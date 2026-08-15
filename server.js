const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app =express();
const PORT = process.env.PORT || 3000;

// Pastikan folder public/uploads tersedia
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Penyimpanan Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Batas maksimal 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Hanya file gambar (jpg, jpeg, png, webp) yang diperbolehkan!"));
    }
});

// Set View Engine
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Route Utama (Menampilkan Form & Daftar Foto)
app.get('/', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        let images = [];
        if (!err) {
            images = files.map(file => `/uploads/${file}`).reverse(); // Terbaru di atas
        }
        res.render('index', { images, error: null });
    });
});

// Route untuk Handle Upload Foto
app.post('/upload', (req, res) => {
    upload.single('photo')(req, res, (err) => {
        if (err) {
            fs.readdir(uploadDir, (readErr, files) => {
                let images = readErr ? [] : files.map(file => `/uploads/${file}`).reverse();
                return res.render('index', { images, error: err.message });
            });
        } else {
            res.redirect('/');
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di port ${PORT}`);
});
