import { validate } from './validators.js';

export const DEFAULT_SETTINGS = {
    baseCurrency: 'RWF',
    otherCurrencies: [
        { code: 'USD', rate: 1450 },
        { code: 'EUR', rate: 1680 },
    ],
    cap: 100000,
    categories: ['Food', 'Books', 'Transport', 'Airtime', 'Fees', 'Other'],
};

const RECORDS_KEY = 'sft:records';
const SETTINGS_KEY = 'sft:settings';

function cloneDefaults() {
    return {
        ...DEFAULT_SETTINGS,
        otherCurrencies: DEFAULT_SETTINGS.otherCurrencies.map((currency) => ({ ...currency })),
        categories: [...DEFAULT_SETTINGS.categories],
    };
}

function readJSON(key, fallback) {
    let raw;
    try {
        raw = localStorage.getItem(key);
    } catch (error) {
        if (!(error instanceof DOMException) || error.name !== 'SecurityError') throw error;
        console.error(`Browser storage is unavailable for ${key}.`, error);
        return fallback;
    }
    if (raw === null) return fallback;
    try {
        return JSON.parse(raw);
    } catch (error) {
        if (error instanceof SyntaxError) {
            console.error(`Stored data for ${key} is not valid JSON.`, error);
            return fallback;
        }
        throw error;
    }
}

export function loadRecords() {
    const records = readJSON(RECORDS_KEY, []);
    if (!Array.isArray(records)
        || !records.every(isValidRecord)
        || new Set(records.map(({ id }) => id)).size !== records.length) {
        console.error('Stored records are invalid; starting with an empty list.');
        return [];
    }
    return records;
}

function isValidRecord(record) {
    return Boolean(record)
        && typeof record === 'object'
        && typeof record.id === 'string'
        && record.id.length > 0
        && typeof record.description === 'string'
        && !validate('description', record.description)
        && Number.isSafeInteger(record.amount)
        && record.amount >= 0
        && typeof record.category === 'string'
        && !validate('category', record.category)
        && typeof record.date === 'string'
        && !validate('date', record.date);
}

export function saveRecords(records) {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function loadSettings() {
    const stored = readJSON(SETTINGS_KEY, {});
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
        console.error('Stored settings are invalid; using defaults.');
        return cloneDefaults();
    }
    const settings = {
        ...cloneDefaults(),
        ...stored,
        otherCurrencies: Array.isArray(stored.otherCurrencies)
            ? stored.otherCurrencies
            : cloneDefaults().otherCurrencies,
        categories: Array.isArray(stored.categories)
            ? stored.categories
            : [...DEFAULT_SETTINGS.categories],
    };
    if (!isValidSettings(settings)) {
        console.error('Stored settings are invalid; using defaults.');
        return cloneDefaults();
    }
    return settings;
}

export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function isValidSettings(settings) {
    return /^[A-Z]{3}$/.test(settings.baseCurrency)
        && (settings.cap === null || (Number.isSafeInteger(settings.cap) && settings.cap >= 0))
        && Array.isArray(settings.categories)
        && settings.categories.length > 0
        && settings.categories.every((category) => typeof category === 'string'
            && !validate('category', category))
        && new Set(settings.categories.map((category) => category.toLowerCase())).size
            === settings.categories.length
        && Array.isArray(settings.otherCurrencies)
        && settings.otherCurrencies.every((currency) => currency
            && /^[A-Z]{3}$/.test(currency.code)
            && currency.code !== settings.baseCurrency
            && Number.isFinite(currency.rate)
            && currency.rate > 0)
        && new Set([settings.baseCurrency, ...settings.otherCurrencies.map(({ code }) => code)]).size
            === settings.otherCurrencies.length + 1;
}

export function exportJSON(records, settings) {
    const blob = new Blob([JSON.stringify({ records, settings }, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student-finance-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function parseImport(file) {
    let data;
    try {
        data = JSON.parse(await file.text());
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error('The selected file is not valid JSON.');
        }
        throw error;
    }
    const records = Array.isArray(data) ? data : data?.records;
    if (!Array.isArray(records)) {
        throw new Error('Import file must contain a records array.');
    }
    const ids = new Set();
    const validRecords = records.every((record) => {
        if (!isValidRecord(record) || ids.has(record.id)) {
            return false;
        }
        ids.add(record.id);
        return true;
    });
    if (!validRecords) {
        throw new Error('Import contains an invalid or duplicate record.');
    }
    const settings = !Array.isArray(data) && data.settings ? data.settings : null;
    if (settings && !isValidSettings(settings)) {
        throw new Error('Import contains invalid settings.');
    }
    return { records, settings };
}