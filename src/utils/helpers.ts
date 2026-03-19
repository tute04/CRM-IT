export function formatCurrency(amount: number | null | undefined, currency = 'ARS'): string {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0';
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(d);
}

export function formatDateShort(date: string | null | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'short',
    }).format(d);
}

export function daysSince(date: string | null | undefined): number {
    if (!date) return 0;
    const d = new Date(date);
    if (isNaN(d.getTime())) return 0;
    const now = new Date();
    return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function getWeekStart(d: Date): string {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
}

export function getMonthStart(d: Date): string {
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

export function getYearStart(d: Date): string {
    return new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0];
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}

export function whatsappUrl(phone: string | null | undefined, text?: string): string {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return '#';
    const base = `https://wa.me/${cleanPhone}`;
    return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
