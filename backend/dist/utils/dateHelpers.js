"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.getTodayRange = getTodayRange;
exports.getWeekRange = getWeekRange;
exports.getMonthRange = getMonthRange;
exports.getLastNDaysRange = getLastNDaysRange;
exports.parseDateRange = parseDateRange;
const date_fns_1 = require("date-fns");
function formatCurrency(amount, symbol = '$', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount).replace('$', symbol);
}
function formatDate(date, fmt = 'MMM dd, yyyy') {
    return (0, date_fns_1.format)(new Date(date), fmt);
}
function getTodayRange() {
    const now = new Date();
    return { from: (0, date_fns_1.startOfDay)(now), to: (0, date_fns_1.endOfDay)(now) };
}
function getWeekRange() {
    const now = new Date();
    return { from: (0, date_fns_1.startOfWeek)(now, { weekStartsOn: 1 }), to: (0, date_fns_1.endOfWeek)(now, { weekStartsOn: 1 }) };
}
function getMonthRange() {
    const now = new Date();
    return { from: (0, date_fns_1.startOfMonth)(now), to: (0, date_fns_1.endOfMonth)(now) };
}
function getLastNDaysRange(n) {
    return { from: (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(new Date(), n - 1)), to: (0, date_fns_1.endOfDay)(new Date()) };
}
function parseDateRange(from, to) {
    const now = new Date();
    return {
        from: from ? (0, date_fns_1.startOfDay)(new Date(from)) : (0, date_fns_1.startOfMonth)(now),
        to: to ? (0, date_fns_1.endOfDay)(new Date(to)) : (0, date_fns_1.endOfDay)(now),
    };
}
//# sourceMappingURL=dateHelpers.js.map