"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyToken = verifyToken;
exports.decodeToken = decodeToken;
exports.getTokenExpiry = getTokenExpiry;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const errorHandler_1 = require("../middleware/errorHandler");
const constants_1 = require("../config/constants");
let privateKey;
let publicKey;
function getKeys() {
    if (!privateKey) {
        const privPath = path_1.default.resolve(env_1.env.JWT_PRIVATE_KEY_PATH);
        const pubPath = path_1.default.resolve(env_1.env.JWT_PUBLIC_KEY_PATH);
        if (!fs_1.default.existsSync(privPath) || !fs_1.default.existsSync(pubPath)) {
            throw new errorHandler_1.AppError('JWT keys not found. Run: npm run keys:generate', constants_1.HTTP_STATUS.INTERNAL);
        }
        privateKey = fs_1.default.readFileSync(privPath, 'utf-8');
        publicKey = fs_1.default.readFileSync(pubPath, 'utf-8');
    }
    return { privateKey, publicKey };
}
function signAccessToken(payload) {
    const { privateKey } = getKeys();
    return jsonwebtoken_1.default.sign(payload, privateKey, {
        algorithm: 'RS256',
        expiresIn: env_1.env.JWT_ACCESS_EXPIRES,
        jwtid: (0, uuid_1.v4)(),
    });
}
function signRefreshToken(payload) {
    const { privateKey } = getKeys();
    return jsonwebtoken_1.default.sign(payload, privateKey, {
        algorithm: 'RS256',
        expiresIn: env_1.env.JWT_REFRESH_EXPIRES,
        jwtid: (0, uuid_1.v4)(),
    });
}
function verifyToken(token) {
    const { publicKey } = getKeys();
    return jsonwebtoken_1.default.verify(token, publicKey, {
        algorithms: ['RS256'],
    });
}
function decodeToken(token) {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch {
        return null;
    }
}
function getTokenExpiry(expiresIn) {
    const units = { s: 1, m: 60, h: 3600, d: 86400 };
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match)
        throw new Error(`Invalid token expiry: ${expiresIn}`);
    const [, amount, unit] = match;
    return new Date(Date.now() + parseInt(amount) * (units[unit] ?? 1) * 1000);
}
//# sourceMappingURL=jwt.js.map