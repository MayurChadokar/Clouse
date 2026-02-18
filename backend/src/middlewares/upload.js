import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.'), false);
    }
};

// Single image upload
export const uploadSingle = (fieldName) =>
    multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } }).single(fieldName);

// Multiple images upload (max 5)
export const uploadMultiple = (fieldName, maxCount = 5) =>
    multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } }).array(fieldName, maxCount);

// CSV upload for bulk operations
export const uploadCSV = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new ApiError(400, 'Only CSV files are allowed for bulk upload.'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for CSV
}).single('file');
