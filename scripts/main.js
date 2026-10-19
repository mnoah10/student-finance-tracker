
import * as State from './state.js'
import * as UI from './ui.js'
import { exportJSON,parseImport } from './storage.js';
import {compileSearch} from './search.js';
import { clean,hasDuplicateWord } from './validators.js';


const FORM_FIELDS = ['description', 'amount', 'category', 'date'];
const $ = (selector) => document.querySelector(selector);

let editingId = null;
let sort = { field: 'date', direction: -1 };
let searchPattern = null;
let ignoreCase = true;
let searchInvalid = false;

const announce = (message) => {
    $('#status').textContent = message;
};

function checkField(name) {
    const input = $(`#${name}`);
    const error = validate(name, input.value);
    const warning = name === 'description' && hasDuplicateWord(input.value)
        ? 'Heads up: a word is repeated.'
        : '';
    $(`#e-${name}`).textContent = error || warning;
    input.setAttribute('aria-invalid', error ? 'true' : 'false');
    return !error;
}

function readForm() {
    return {
        description: clean($('#description').value),
        amount: Number($('#amount').value),
        category: clean($('#category').value),
        date: $('#date').value,
    };
}

function render() {
    UI.render(State.getAll(), State.getSettings(), {
        sort,
        searchPattern,
        ignoreCase,
        searchInvalid,
    });
}

function startEdit(record) {
    editingId = record.id;
    FORM_FIELDS.forEach((name) => {
        $(`#${name}`).value = record[name];
    });
    $('#save').textContent = 'Save changes';
    $('#cancel').hidden = false;
    $('#form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#description').focus();
    announce('Editing record. Change the fields and save.');
}

function resetForm() {
    editingId = null;
    $('#rec-form').reset();
    FORM_FIELDS.forEach((name) => {
        $(`#e-${name}`).textContent = '';
        $(`#${name}`).setAttribute('aria-invalid', 'false');
    });
    $('#save').textContent = 'Add record';
    $('#cancel').hidden = true;
}

function handleFormSubmit(event) {
    event.preventDefault();
    if (!FORM_FIELDS.map(checkField).every(Boolean)) {
        $('#rec-form [aria-invalid="true"]').focus();
        return;
    }

    const data = readForm();
    try {
        if (editingId) {
            State.update(editingId, data);
            announce('Record updated.');
        } else {
            State.add(data);
            announce('Record added.');
        }
        resetForm();
        render();
    } catch (error) {
        console.error('Could not save the record.', error);
        announce(`Could not save the record: ${error.message}`);
    }
}

function currencyOptions(settings) {
    const select = $('#view-cur');
    const selected = select.value || settings.baseCurrency;
    select.replaceChildren();
    [settings.baseCurrency, ...settings.otherCurrencies.map(({ code }) => code)]
        .forEach((code) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = code;
            select.append(option);
        });
    select.value = [...select.options].some((option) => option.value === selected)
        ? selected
        : settings.baseCurrency;
    UI.setDisplayCurrency(select.value);
}

function loadSettingsForm() {
    const settings = State.getSettings();
    $('#s-base').value = settings.baseCurrency;
    $('#s-cap-in').value = settings.cap ?? '';
    $('#c1-code').value = settings.otherCurrencies[0]?.code || '';
    $('#c1-rate').value = settings.otherCurrencies[0]?.rate ?? '';
    $('#c2-code').value = settings.otherCurrencies[1]?.code || '';
    $('#c2-rate').value = settings.otherCurrencies[1]?.rate ?? '';
    $('#s-cats').value = settings.categories.join(', ');
    currencyOptions(settings);
}

function settingsFromForm() {
    const baseCurrency = $('#s-base').value.trim().toUpperCase();
    const capText = $('#s-cap-in').value.trim();
    const categories = $('#s-cats').value.split(',').map(clean).filter(Boolean);
    const currencies = [];
    const errors = [];

    if (!/^[A-Z]{3}$/.test(baseCurrency)) {
        errors.push('Base currency must be a 3-letter code.');
    }
    if (capText && (!/^(0|[1-9]\d*)$/.test(capText)
        || !Number.isSafeInteger(Number(capText)))) {
        errors.push('Spending cap must be a non-negative whole number or blank.');
    }
    [1, 2].forEach((slot) => {
        const code = $(`#c${slot}-code`).value.trim().toUpperCase();
        const rateText = $(`#c${slot}-rate`).value.trim();
        if (!code && !rateText) return;
        if (!/^[A-Z]{3}$/.test(code) || code === baseCurrency) {
            errors.push(`Currency ${slot + 1} must be a different 3-letter code.`);
            return;
        }
        if (!/^(?:[1-9]\d*(?:\.\d{1,4})?|0\.\d{1,4})$/.test(rateText)
            || !Number.isFinite(Number(rateText))
            || Number(rateText) <= 0) {
            errors.push(`Currency ${slot + 1} rate must be a positive number with up to 4 decimals.`);
            return;
        }
        currencies.push({ code, rate: Number(rateText) });
    });
    if (new Set([baseCurrency, ...currencies.map(({ code }) => code)]).size !== currencies.length + 1) {
        errors.push('Currency codes must be unique.');
    }
    if (!categories.length || categories.some((category) => validate('category', category))) {
        errors.push('Add at least one valid category (letters, spaces, or hyphens).');
    }
    if (new Set(categories.map((category) => category.toLowerCase())).size !== categories.length) {
        errors.push('Categories must be unique.');
    }

    return {
        errors,
        settings: {
            baseCurrency,
            cap: capText ? Number(capText) : null,
            otherCurrencies: currencies,
            categories,
        },
    };
}

function handleSettingsSubmit(event) {
    event.preventDefault();
    const { errors, settings } = settingsFromForm();
    $('#s-err').textContent = errors.join(' ');
    if (errors.length) {
        announce('Settings were not saved. Check the highlighted error message.');
        return;
    }
    try {
        State.setSettings(settings);
        currencyOptions(settings);
        render();
        announce('Settings saved.');
    } catch (error) {
        console.error('Could not save settings.', error);
        $('#s-err').textContent = `Could not save settings: ${error.message}`;
    }
}

function handleSearch() {
    const { pattern, error } = compileSearch($('#q').value, ignoreCase);
    searchPattern = pattern;
    searchInvalid = Boolean(error);
    $('#re-err').textContent = error;
    render();
}

function init() {
    $('#rec-form').addEventListener('submit', handleFormSubmit);
    $('#cancel').addEventListener('click', () => {
        resetForm();
        announce('Edit cancelled.');
    });
    FORM_FIELDS.forEach((name) => {
        ['input', 'blur'].forEach((type) => {
            $(`#${name}`).addEventListener(type, () => checkField(name));
        });
    });

    $('#rows').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const record = State.get(button.dataset.id);
        if (!record) return;
        if (button.dataset.action === 'edit') {
            startEdit(record);
        } else if (button.dataset.action === 'delete') {
            if (window.confirm(`Delete "${record.description}"?`)) {
                try {
                    State.remove(record.id);
                    render();
                    announce('Record deleted.');
                } catch (error) {
                    console.error('Could not delete the record.', error);
                    announce(`Could not delete the record: ${error.message}`);
                }
            }
        }
    });

    $('#q').addEventListener('input', handleSearch);
    $('#ci').addEventListener('change', () => {
        ignoreCase = $('#ci').checked;
        handleSearch();
    });
    $('#sort').addEventListener('change', () => {
        const [field, direction] = $('#sort').value.split(':');
        sort = { field, direction: Number(direction) };
        render();
    });
    document.querySelectorAll('[data-sort]').forEach((button) => {
        button.addEventListener('click', () => {
            const field = button.dataset.sort;
            sort = {
                field,
                direction: sort.field === field ? -sort.direction : 1,
            };
            $('#sort').value = `${sort.field}:${sort.direction}`;
            render();
        });
    });
    $('#view-cur').addEventListener('change', () => {
        UI.setDisplayCurrency($('#view-cur').value);
        render();
    });
    $('#settings-form').addEventListener('submit', handleSettingsSubmit);
    $('#export').addEventListener('click', () => {
        exportJSON(State.getAll(), State.getSettings());
        announce('Data exported.');
    });
    $('#import').addEventListener('change', async (event) => {
        const [file] = event.target.files;
        if (!file) return;
        try {
            const imported = await parseImport(file);
            State.replaceAll(imported.records);
            if (imported.settings) State.setSettings(imported.settings);
            loadSettingsForm();
            render();
            announce('Data imported.');
        } catch (error) {
            $('#s-err').textContent = error.message;
            announce('Import failed. Check the data and storage, then try again.');
        } finally {
            event.target.value = '';
        }
    });
    $('#menu').addEventListener('click', () => {
        const nav = $('#nav');
        const isOpen = nav.classList.toggle('open');
        $('#menu').setAttribute('aria-expanded', String(isOpen));
    });

    loadSettingsForm();
    $('#sort').value = 'date:-1';
    render();
}

try {
    init();
} catch (error) {
    console.error('Could not start the finance tracker.', error);
    announce(`Could not start the finance tracker: ${error.message}`);
}
