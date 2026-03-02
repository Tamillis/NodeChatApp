export function getTime(date) {
    if(typeof date === 'string') date = new Date(date);

    return date.toLocaleString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }).replace(" ", "_");
}