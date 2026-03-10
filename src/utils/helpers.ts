export function formatCurrency(amount: number, currency = 'ARS'): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(date: string): string {
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(date));
}

export function formatDateShort(date: string): string {
    return new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'short',
    }).format(new Date(date));
}

export function daysSince(date: string): number {
    const d = new Date(date);
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

export function whatsappUrl(phone: string, text?: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const base = `https://wa.me/${cleanPhone}`;
    return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
