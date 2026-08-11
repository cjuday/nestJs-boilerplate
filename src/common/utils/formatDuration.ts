export function formatDuration(duration: string): string {
    const regex = /(\d+)\s*(s|m|h|d)/gi;
    const parts: string[] = [];

    for (const match of duration.matchAll(regex)) {
        const value = Number(match[1]);
        const unit = match[2].toLowerCase();

        const labels: Record<string, string> = {
            s: value === 1 ? 'second' : 'seconds',
            m: value === 1 ? 'minute' : 'minutes',
            h: value === 1 ? 'hour' : 'hours',
            d: value === 1 ? 'day' : 'days',
        };

        parts.push(`${value} ${labels[unit]}`);
    }

    return parts.join(' ');
}