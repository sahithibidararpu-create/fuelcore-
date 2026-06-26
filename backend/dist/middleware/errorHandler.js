"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("../config/logger");
const constants_1 = require("../config/constants");
class AppError extends Error {
    statusCode;
    isOperational;
    details;
    constructor(message, statusCode = constants_1.HTTP_STATUS.INTERNAL, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, _next) => {
    let statusCode = constants_1.HTTP_STATUS.INTERNAL;
    let message = 'Internal Server Error';
    let details = undefined;
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        details = err.details;
    }
    else if (err.name === 'ValidationError') {
        statusCode = constants_1.HTTP_STATUS.BAD_REQUEST;
        message = err.message;
    }
    else if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err;
        if (prismaError.code === 'P2002') {
            statusCode = constants_1.HTTP_STATUS.CONFLICT;
            message = `A record with this ${prismaError.meta?.target?.join(', ')} already exists`;
        }
        else if (prismaError.code === 'P2025') {
            statusCode = constants_1.HTTP_STATUS.NOT_FOUND;
            message = 'Record not found';
        }
    }
    else if (err.name === 'ZodError') {
        statusCode = constants_1.HTTP_STATUS.UNPROCESSABLE;
        message = 'Validation failed';
        details = err;
    }
    // Log server errors
    if (statusCode >= 500) {
        logger_1.logger.error('Server Error', {
            statusCode,
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            userId: req.user?.id,
        });
    }
    else {
        logger_1.logger.warn('Client Error', {
            statusCode,
            message,
            path: req.path,
            method: req.method,
        });
    }
    const responseBody = {
        success: false,
        message,
    };
    if (details)
        responseBody.details = details;
    if (process.env.NODE_ENV === 'development')
        responseBody.stack = err.stack;
    res.status(statusCode).json(responseBody);
};
exports.errorHandler = errorHandler;
const notFound = (req, _res, next) => {
    next(new AppError(`Route not found: ${req.method} ${req.path}`, constants_1.HTTP_STATUS.NOT_FOUND));
};
exports.notFound = notFound;
//# sourceMappingURL=errorHandler.js.map