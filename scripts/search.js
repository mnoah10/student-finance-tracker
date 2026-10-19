export function compileSearch(query, ignoreCase = true) {
    if (!query) return { pattern: null, error: '' };
    try {
        return { pattern: new RegExp(query, ignoreCase ? 'i' : ''), error: '' };
    } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        return { pattern: null, error: 'Enter a valid regular expression.' };
    }
}