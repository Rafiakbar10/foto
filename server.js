const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Penentuan folder upload (Mendukung Railway Volume atau lokal)
const uploadDir = process.env.RAILWAY_VOLUME_MOUNT_PATH 
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'uploads') 
    : path.join(__dirname, 'public', 'uploads');

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
    limits: { fileSize: 100 * 1024 * 1024 }, // Batas maksimal 100MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|heic|mp4|mov|avi|m4v/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype || extname) {
            return cb(null, true);
        }
        cb(new Error("Hanya file gambar dan video yang diperbolehkan!"));
    }
});

// Set View Engine
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
    app.use('/uploads', express.static(uploadDir));
}

// Route Utama
app.get('/', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        let items = [];
        if (!err) {
            items = files.map(file => ({
                name: file,
                url: `/uploads/${file}`,
                isVideo: /\.(mp4|mov|avi|m4v)$/i.test(file)
            })).reverse();
        }
        res.render('index', { items, error: null });
    });
});

// Route Upload
app.post('/upload', (req, res) => {
    upload.single('media')(req, res, (err) => {
        if (err) {
            fs.readdir(uploadDir, (readErr, files) => {
                let items = readErr ? [] : files.map(file => ({
                    name: file,
                    url: `/uploads/${file}`,
                    isVideo: /\.(mp4|mov|avi|m4v)$/i.test(file)
                })).reverse();
                return res.render('index', { items, error: err.message });
            });
        } else {
            res.redirect('/');
        }
    });
});

// Route Hapus
app.post('/delete/:filename', (req, res) => {
    const filename = req.params.filename;
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadDir, safeFilename);

    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) console.error("Gagal menghapus file:", err);
            res.redirect('/');
        });
    } else {
        res.redirect('/');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di port ${PORT}`);
});
