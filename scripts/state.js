import { DEFAULT_SETTINGS, loadRecords, loadSettings, saveRecords, saveSettings } from './storage.js';

let records = loadRecords();
let settings = loadSettings();

export function getAll() {
    return records.map((record) => ({ ...record }));
}

export function get(id) {
    const record = records.find((item) => item.id === id);
    return record ? { ...record } : undefined;
}

export function add(data) {
    const now = new Date().toISOString();
    const record = {
        ...data,
        id: globalThis.crypto?.randomUUID?.()
            || `txn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        createdAt: now,
        updatedAt: now,
    };
    const nextRecords = [...records, record];
    saveRecords(nextRecords);
    records = nextRecords;
    return { ...record };
}

export function update(id, data) {
    const existing = records.find((record) => record.id === id);
    if (!existing) throw new Error(`Record ${id} was not found.`);
    const nextRecords = records.map((record) => record.id === id
        ? { ...record, ...data, updatedAt: new Date().toISOString() }
        : record);
    saveRecords(nextRecords);
    records = nextRecords;
    return get(id);
}

export function remove(id) {
    if (!records.some((record) => record.id === id)) return false;
    const nextRecords = records.filter((record) => record.id !== id);
    saveRecords(nextRecords);
    records = nextRecords;
    return true;
}

export function replaceAll(nextRecords) {
    if (!Array.isArray(nextRecords)) throw new TypeError('Records must be an array.');
    const safeRecords = nextRecords.map((record) => ({ ...record }));
    saveRecords(safeRecords);
    records = safeRecords;
}

export function getSettings() {
    return {
        ...settings,
        otherCurrencies: settings.otherCurrencies.map((currency) => ({ ...currency })),
        categories: [...settings.categories],
    };
}

export function setSettings(nextSettings) {
    const safeSettings = {
        ...DEFAULT_SETTINGS,
        ...nextSettings,
        otherCurrencies: nextSettings.otherCurrencies.map((currency) => ({ ...currency })),
        categories: [...nextSettings.categories],
    };
    saveSettings(safeSettings);
    settings = safeSettings;
}