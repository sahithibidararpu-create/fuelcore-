"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const env_1 = require("./env");
// Fix BigInt JSON serialization (Prisma $queryRaw returns bigints)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
BigInt.prototype.toJSON = function () { return Number(this); };
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: env_1.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
if (env_1.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
async function connectDatabase() {
    await exports.prisma.$connect();
}
async function disconnectDatabase() {
    await exports.prisma.$disconnect();
}
//# sourceMappingURL=database.js.map