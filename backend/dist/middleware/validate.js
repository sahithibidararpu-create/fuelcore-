"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const constants_1 = require("../config/constants");
const validate = (schema, target = 'body') => (req, res, next) => {
    try {
        const data = schema.parse(req[target]);
        req[target] = data;
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const errors = error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            res.status(constants_1.HTTP_STATUS.UNPROCESSABLE).json({
                success: false,
                message: 'Validation failed',
                errors,
            });
        }
        else {
            next(error);
        }
    }
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map