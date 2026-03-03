function toCamel(obj) {
    if (Array.isArray(obj)) return obj.map(v => toCamel(v));
    if (obj instanceof Date) {
        // Check if it's a date only (no time)
        const iso = obj.toISOString();
        if (iso.includes('T00:00:00')) return iso.split('T')[0];
        return iso;
    }
    if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((acc, key) => {
            const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
            acc[camelKey] = toCamel(obj[key]);
            return acc;
        }, {});
    }
    return obj;
}

module.exports = { toCamel };
