"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocument = exports.uploadImage = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const errorHandler_1 = require("./errorHandler");
const constants_1 = require("../config/constants");
const uploadDir = path_1.default.resolve(env_1.env.UPLOAD_DIR);
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowed = [...constants_1.CONSTANTS.ALLOWED_IMAGE_TYPES, ...constants_1.CONSTANTS.ALLOWED_DOC_TYPES];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errorHandler_1.AppError(`Invalid file type: ${file.mimetype}. Allowed: ${allowed.join(', ')}`, constants_1.HTTP_STATUS.BAD_REQUEST));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: env_1.env.UPLOAD_MAX_SIZE_MB * 1024 * 1024,
    },
});
exports.uploadImage = exports.upload.single('image');
exports.uploadDocument = exports.upload.single('document');
//# sourceMappingURL=upload.js.map