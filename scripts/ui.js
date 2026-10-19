import { formatAmount } from './currency.js';

let displayCurrency = 'RWF';
const $ = (selector) => document.querySelector(selector);

function textCell(value, label, pattern) {
    const cell = document.createElement('td');
    cell.dataset.label = label;
    if (pattern) {
        appendHighlightedText(cell, value, pattern);
    } else {
        cell.textContent = value;
    }
    return cell;
}

function appendHighlightedText(parent, text, pattern) {
    if (!pattern) {
        parent.textContent = text;
        return;
    }
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    const matcher = new RegExp(pattern.source, flags);
    let offset = 0;
    let match;
    while ((match = matcher.exec(text)) !== null) {
        if (match[0].length === 0) {
            matcher.lastIndex += 1;
            continue;
        }
        parent.append(document.createTextNode(text.slice(offset, match.index)));
        const mark = document.createElement('mark');
        mark.textContent = match[0];
        parent.append(mark);
        offset = match.index + match[0].length;
    }
    parent.append(document.createTextNode(text.slice(offset)));
}

function matchesSearch(record, pattern, ignoreCase) {
    if (!pattern) return true;
    const flags = ignoreCase
        ? [...new Set(`${pattern.flags}i`.split(''))].join('')
        : pattern.flags.replace('i', '');
    const matcher = new RegExp(pattern.source, flags.replace('g', '').replace('y', ''));
    return [record.description, record.category, record.date, String(record.amount)]
        .some((value) => matcher.test(value));
}

function sortedRecords(records, sort) {
    return [...records].sort((left, right) => {
        const a = left[sort.field];
        const b = right[sort.field];
        const comparison = typeof a === 'number'
            ? a - b
            : String(a).localeCompare(String(b));
        return comparison * sort.direction;
    });
}

function renderRows(records, settings, { sort, searchPattern, ignoreCase, searchInvalid }) {
    const rows = $('#rows');
    rows.replaceChildren();
    const filtered = sortedRecords(
        records.filter((record) => !searchInvalid && matchesSearch(record, searchPattern, ignoreCase)),
        sort,
    );
    filtered.forEach((record) => {
        const row = document.createElement('tr');
        row.append(textCell(record.date, 'Date', searchPattern));
        row.append(textCell(record.description, 'Description', searchPattern));
        row.append(textCell(formatAmount(record.amount, settings, displayCurrency), `Amount (${displayCurrency})`, searchPattern));
        row.append(textCell(record.category, 'Category', searchPattern));

        const actions = document.createElement('td');
        actions.dataset.label = 'Actions';
        [
            ['edit', 'Edit'],
            ['delete', 'Delete'],
        ].forEach(([action, label]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.action = action;
            button.dataset.id = record.id;
            button.textContent = label;
            button.setAttribute('aria-label', `${label} ${record.description}`);
            if (action === 'delete') button.className = 'alt';
            actions.append(button);
        });
        row.append(actions);
        rows.append(row);
    });
    $('#empty').hidden = filtered.length !== 0;
}

function renderStats(records, settings) {
    const total = records.reduce((sum, record) => sum + record.amount, 0);
    const categoryTotals = new Map();
    records.forEach(({ category, amount }) => {
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
    });
    const topCategory = [...categoryTotals.entries()]
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    $('#s-total').textContent = String(records.length);
    $('#s-sum').textContent = formatAmount(total, settings, displayCurrency);
    $('#s-top').textContent = topCategory;
    $('#s-cap').textContent = settings.cap === null
        ? 'No cap'
        : formatAmount(settings.cap, settings, displayCurrency);
    const remaining = settings.cap === null ? null : settings.cap - total;
    $('#cap-polite').textContent = remaining !== null && remaining >= 0
        ? `${formatAmount(remaining, settings, displayCurrency)} remaining under your cap.`
        : '';
    $('#cap-assertive').textContent = remaining !== null && remaining < 0
        ? `You are ${formatAmount(Math.abs(remaining), settings, displayCurrency)} over your spending cap.`
        : '';
}

function dateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

function renderBars(records, settings) {
    const list = $('#bars');
    list.replaceChildren();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        const key = dateKey(date);
        const amount = records
            .filter((record) => record.date === key)
            .reduce((sum, record) => sum + record.amount, 0);
        days.push({ date, amount });
    }
    const max = Math.max(...days.map((day) => day.amount), 1);
    days.forEach(({ date, amount }) => {
        const item = document.createElement('li');
        const bar = document.createElement('span');
        bar.className = 'bar';
        bar.style.height = `${Math.max(amount / max * 100, 2)}%`;
        bar.setAttribute('aria-label', formatAmount(amount, settings, displayCurrency));
        const label = document.createElement('span');
        label.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
        item.append(bar, label);
        item.title = `${dateKey(date)}: ${formatAmount(amount, settings, displayCurrency)}`;
        list.append(item);
    });
}

function renderCategories(settings) {
    const list = $('#cats');
    list.replaceChildren();
    settings.categories.forEach((category) => {
        const option = document.createElement('option');
        option.value = category;
        list.append(option);
    });
}

export function setDisplayCurrency(code) {
    displayCurrency = code;
}

export function render(records, settings, searchOptions) {
    renderRows(records, settings, searchOptions);
    renderStats(records, settings);
    renderBars(records, settings);
    renderCategories(settings);
}