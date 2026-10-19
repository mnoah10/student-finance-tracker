const PATTERNS = {
    description: /^\S(?:.*\S)?$/,
    amount: /^(0|[1-9]\d*)$/,
    category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
};

export function clean(value) {
    return value.trim();
}

export function validate(name, value) {
    const input = String(value);
    if (!input.trim()) {
        return `${name[0].toUpperCase()}${name.slice(1)} is required.`;
    }
    if (name === 'date') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            return 'Enter a date in YYYY-MM-DD format.';
        }
        const date = new Date(`${input}T00:00:00Z`);
        if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input) {
            return 'Enter a real calendar date.';
        }
        return '';
    }
    if (!PATTERNS[name]?.test(input)) {
        if (name === 'amount') return 'Enter a non-negative whole number.';
        if (name === 'category') return 'Use letters, spaces, and hyphens only.';
        return 'Description cannot start or end with spaces.';
    }
    if (name === 'amount' && !Number.isSafeInteger(Number(input))) {
        return 'Amount is too large to store safely.';
    }
    return '';
}

export function hasDuplicateWord(value) {
    return /\b(\w+)\s+\1\b/i.test(value);
}