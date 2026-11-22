import { bus, store } from './util.js';

const KEY = 'vbos.settings.v1';

export const GLASS_COLORS = [
    { id: 'default', name: 'Padrão', rgb: [116, 184, 252] },
    { id: 'graphite', name: 'Grafite', rgb: [40, 40, 40] },
    { id: 'blue', name: 'Azul', rgb: [36, 108, 214] },
    { id: 'teal', name: 'Verde-azulado', rgb: [0, 140, 140] },
    { id: 'red', name: 'Vermelho', rgb: [180, 30, 40] },
    { id: 'orange', name: 'Laranja', rgb: [230, 120, 20] },
    { id: 'pink', name: 'Rosa', rgb: [230, 90, 170] },
    { id: 'frost', name: 'Fosco', rgb: [235, 240, 245] },
];

export const WALLPAPERS = [
    { id: 'aurora-verde', name: 'Aurora Verde', src: 'assets/wallpapers/wallpaper.png' },
    { id: 'aurora-azul', name: 'Aurora Azul', src: 'assets/wallpapers/aurora_azul.svg' },
    { id: 'horizonte', name: 'Horizonte', src: 'assets/wallpapers/horizonte.svg' },
    { id: 'crepusculo', name: 'Crepúsculo', src: 'assets/wallpapers/crepusculo_vista.svg' },
    { id: 'aurora-noturna', name: 'Aurora Noturna', src: 'assets/wallpapers/aurora_noturna.svg' },
    { id: 'solid-blue', name: 'Azul Sólido', color: '#3a6ea5' },
    { id: 'solid-teal', name: 'Verde-azulado Sólido', color: '#00807f' },
    { id: 'solid-black', name: 'Preto', color: '#000000' },
];

const DEFAULTS = {
    userName: 'Vilas Boas',
    password: '',
    passwordHint: '',
    avatar: 'flor',
    computerName: 'VILASBOAS-PC',
    wallpaper: 'aurora-verde',
    wallpaperFit: 'cover',
    glassColor: 'default',
    glassIntensity: 45,
    transparency: true,
    volume: 70,
    muted: false,
    sidebar: true,
    desktopIconSize: 'medium',
    showDesktopIcons: true,
    autoArrange: false,
    alignToGrid: true,
    iconPositions: {},
    showExtensions: false,
    hour24: true,
    timeOffset: 0,
    reduceMotion: false,
    screensaver: 'bubbles',
    screensaverWait: 5,
    welcomeOnStartup: true,
    lockTaskbar: true,
    showQuickLaunch: true,
    recentPrograms: ['notepad', 'calculator', 'paint', 'photos', 'cmd', 'mines'],
    recentDocs: [],
    firstRun: true,
};

let data = { ...DEFAULTS, ...store.get(KEY, {}) };

export const Settings = {
    get(key) { return data[key]; },
    all() { return { ...data }; },
    set(key, value) {
        if (data[key] === value && typeof value !== 'object') return;
        data[key] = value;
        store.set(KEY, data);
        bus.emit('settings', key, value);
    },
    patch(obj) {
        Object.assign(data, obj);
        store.set(KEY, data);
        Object.keys(obj).forEach(k => bus.emit('settings', k, obj[k]));
    },
    reset() {
        data = { ...DEFAULTS };
        store.set(KEY, data);
        Object.keys(data).forEach(k => bus.emit('settings', k, data[k]));
    },
    /** Track a program in the "recent programs" list of the Start menu. */
    touchProgram(appId) {
        const list = (data.recentPrograms || []).filter(id => id !== appId);
        list.unshift(appId);
        this.set('recentPrograms', list.slice(0, 8));
    },
    touchDoc(fileId) {
        const list = (data.recentDocs || []).filter(id => id !== fileId);
        list.unshift(fileId);
        this.set('recentDocs', list.slice(0, 12));
    }
};

/** System clock that honours the user's "change date/time" offset. */
export const now = () => new Date(Date.now() + (data.timeOffset || 0));
