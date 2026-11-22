// Vilas Boas OS — entry point.
import { bus } from './core/util.js';
import { Settings } from './core/settings.js';
import { FS } from './core/fs.js';
import { WM } from './wm.js';
import { initTooltips } from './ui/tooltip.js';
import { errorBox } from './ui/dialogs.js';
import { Session } from './shell/session.js';
import { Desktop } from './shell/desktop.js';
import { Taskbar } from './shell/taskbar.js';
import { StartMenu } from './shell/startmenu.js';
import { Sidebar } from './shell/sidebar.js';
import { Screensaver } from './shell/screensaver.js';
import { Flip3D } from './shell/flip3d.js';
import { launch } from './apps/registry.js';

FS.init();
WM.init();
initTooltips();
Desktop.init();
Taskbar.init();
StartMenu.init();
Sidebar.init();
Screensaver.init();

bus.on('fs-error', msg => errorBox(msg, { title: 'Disco Cheio' }));

// The shell must never scroll, even when focus lands on something partly off-screen.
for (const el of [document.documentElement, document.body, document.getElementById('desktop')]) {
    el.addEventListener('scroll', () => { if (el.scrollLeft || el.scrollTop) { el.scrollLeft = 0; el.scrollTop = 0; } });
}

// Block the browser's own context menu everywhere except text fields.
document.addEventListener('contextmenu', e => {
    if (!e.target.closest('input, textarea, [contenteditable]')) e.preventDefault();
});

// Global shortcuts that a browser lets us capture.
document.addEventListener('keydown', e => {
    if (Session.state !== 'desktop') return;
    const k = e.key.toLowerCase();
    if (e.ctrlKey && e.shiftKey && k === 'escape') { e.preventDefault(); launch('taskmgr'); }
    else if (e.altKey && (k === '`' || k === "'" || k === 'q')) { e.preventDefault(); Flip3D.open(); }
    else if (e.altKey && k === 'd' && e.shiftKey) { e.preventDefault(); WM.showDesktop(); }
    else if (e.altKey && k === 'r' && e.shiftKey) { e.preventDefault(); launch('run'); }
    else if (e.key === 'F1' && !WM.active()) { e.preventDefault(); launch('help'); }
});

// Prevent text selection drags on chrome elements.
document.addEventListener('dragstart', e => {
    if (!e.target.closest?.('[draggable="true"]')) e.preventDefault();
});

Session.init({
    onReady() {
        if (Settings.get('welcomeOnStartup') || Settings.get('firstRun')) {
            setTimeout(() => launch('welcome'), 600);
            Settings.set('firstRun', false);
        }
    }
});
Session.boot();
