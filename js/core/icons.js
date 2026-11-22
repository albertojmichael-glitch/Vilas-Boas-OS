// Icon library. PNG icons come from assets/icons, the rest are hand-drawn SVGs.
import { extOf } from './util.js';

const svg = body => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'>${body}</svg>`);

const PNG = {
    computer: 'assets/icons/computer.png',
    folder: 'assets/icons/pasta.png',
    trash: 'assets/icons/lixeiravazia.png',
    notepad: 'assets/icons/blocodenotas.png',
    mail: 'assets/icons/email.png',
};

const page = (inner = '', fold = '#e8eef6') => `
<defs><linearGradient id='pg' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#ffffff'/><stop offset='1' stop-color='#dde5ef'/></linearGradient>
<filter id='sh' x='-20%' y='-20%' width='140%' height='140%'><feDropShadow dx='0' dy='1' stdDeviation='0.8' flood-opacity='.35'/></filter></defs>
<g filter='url(#sh)'><path d='M10 3.5h20.5l8.5 8.5v32.5H10z' fill='url(#pg)' stroke='#8193aa'/>
<path d='M30.5 3.5V12H39' fill='${fold}' stroke='#8193aa' stroke-linejoin='round'/></g>${inner}`;

const S = {
    textFile: svg(page(`<g stroke='#7d97bd' stroke-width='1.4'><path d='M15 18h19M15 22.5h19M15 27h19M15 31.5h19M15 36h13'/></g>`)),
    file: svg(page()),
    imageFile: svg(page(`<defs><linearGradient id='sk' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4aa3ff'/><stop offset='1' stop-color='#bfe3ff'/></linearGradient></defs>
        <rect x='14' y='16' width='21' height='22' fill='url(#sk)' stroke='#5a6f8c'/><circle cx='29' cy='21.5' r='2.6' fill='#ffe866'/>
        <path d='M14 38l7-10 5 6 3-3 6 7z' fill='#3e9a3a'/>`)),
    drive: svg(`<defs><linearGradient id='d1' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f4f6f8'/><stop offset='1' stop-color='#a9b2bc'/></linearGradient>
        <linearGradient id='d2' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8d97a3'/><stop offset='1' stop-color='#4f5964'/></linearGradient></defs>
        <path d='M6 22l6-8h24l6 8z' fill='url(#d1)' stroke='#6b7580'/>
        <rect x='6' y='22' width='36' height='12' rx='2' fill='url(#d2)' stroke='#3c444d'/>
        <rect x='9' y='26' width='20' height='3' rx='1.5' fill='#2a3036'/><circle cx='37' cy='28' r='1.8' fill='#6dff6d'/>
        <rect x='15' y='16' width='18' height='4' rx='1' fill='#3c8ddc' opacity='.85'/>`),
    network: svg(`<defs><radialGradient id='g' cx='.35' cy='.3' r='.8'><stop offset='0' stop-color='#9fe0ff'/><stop offset='.6' stop-color='#1f7fd6'/><stop offset='1' stop-color='#0a3e7c'/></radialGradient>
        <linearGradient id='m' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#eef2f6'/><stop offset='1' stop-color='#9aa6b2'/></linearGradient></defs>
        <circle cx='30' cy='18' r='14' fill='url(#g)'/><path d='M22 10c4 2 3 6 7 7s3 6 0 9M34 6c-2 4 2 6 5 7' stroke='#4fc35a' stroke-width='3' fill='none' stroke-linecap='round' opacity='.9'/>
        <ellipse cx='26' cy='11' rx='6' ry='3' fill='#fff' opacity='.35'/>
        <rect x='3' y='24' width='22' height='16' rx='1.5' fill='url(#m)' stroke='#5c6670'/><rect x='5.5' y='26.5' width='17' height='11' fill='#2c7fd0'/>
        <path d='M10 40h8l1.5 4h-11z' fill='#9aa6b2' stroke='#5c6670'/>`),
    controlPanel: svg(`<defs><linearGradient id='m' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f2f5f8'/><stop offset='1' stop-color='#a5b0bb'/></linearGradient>
        <linearGradient id='s' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#58b7ff'/><stop offset='1' stop-color='#0b55b0'/></linearGradient></defs>
        <rect x='4' y='6' width='34' height='26' rx='2' fill='url(#m)' stroke='#5c6670'/><rect x='7' y='9' width='28' height='20' fill='url(#s)'/>
        <rect x='10' y='13' width='6' height='12' fill='#7ee36b'/><rect x='18' y='17' width='6' height='8' fill='#ffd84a'/><rect x='26' y='11' width='6' height='14' fill='#ff7b54'/>
        <path d='M16 32h10l2 5H14z' fill='#9aa6b2' stroke='#5c6670'/>
        <g transform='translate(36 34)'><circle r='9' fill='#d7dde3' stroke='#4b5560' stroke-width='1.5'/><circle r='3.5' fill='#5b6773'/>
        <g stroke='#4b5560' stroke-width='3'><path d='M0-11v4M0 7v4M-11 0h4M7 0h4M-8-8l3 3M5 5l3 3M8-8l-3 3M-5 5l-3 3'/></g></g>`),
    calculator: svg(`<defs><linearGradient id='b' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#e9edf1'/><stop offset='1' stop-color='#8e99a5'/></linearGradient></defs>
        <rect x='9' y='3' width='30' height='42' rx='3' fill='url(#b)' stroke='#4d5761'/>
        <rect x='12.5' y='7' width='23' height='9' rx='1' fill='#c9dcc0' stroke='#57654f'/><path d='M29 14h4' stroke='#2e3a2a' stroke-width='2'/>
        <g fill='#fdfdfd' stroke='#6a7580'>${[0, 1, 2, 3].map(r => [0, 1, 2, 3].map(c => `<rect x='${12.5 + c * 6}' y='${19.5 + r * 6}' width='4.5' height='4' rx='.8' ${c === 3 ? "fill='#ff9a6b'" : ''}/>`).join('')).join('')}</g>`),
    paint: svg(`<defs><linearGradient id='p' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#f7e1b5'/><stop offset='1' stop-color='#c79a52'/></linearGradient></defs>
        <path d='M24 6C11 6 4 14 4 23c0 8 6 12 11 11 4-1 3-5 6-6 3-1 5 4 9 5 8 2 14-5 14-12C44 13 36 6 24 6z' fill='url(#p)' stroke='#8a6328'/>
        <circle cx='14' cy='19' r='3.2' fill='#e8312c'/><circle cx='22' cy='13' r='3.2' fill='#2f7de0'/><circle cx='31' cy='14' r='3.2' fill='#36b24a'/><circle cx='36' cy='22' r='3.2' fill='#f5c518'/>
        <circle cx='13' cy='27' r='3' fill='#fff' stroke='#a07a3c'/>
        <path d='M44 4L26 28l-3 1 1-3L42 2z' fill='#8b5a2b' stroke='#4b2e12'/><path d='M23 29c-3 1-5 4-8 4 2-2 2-6 5-7z' fill='#1f63c4'/>`),
    browser: svg(`<defs><radialGradient id='g' cx='.35' cy='.3' r='.85'><stop offset='0' stop-color='#bdf0ff'/><stop offset='.55' stop-color='#2a8ee8'/><stop offset='1' stop-color='#0a3a85'/></radialGradient>
        <linearGradient id='o' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#ffe38a'/><stop offset='1' stop-color='#e59a16'/></linearGradient></defs>
        <circle cx='24' cy='24' r='16' fill='url(#g)' stroke='#0b3e86'/>
        <path d='M14 14c5 3 3 8 9 9s4 8 0 12M30 9c-2 5 3 7 7 8M32 29c3 1 4 4 2 7' stroke='#58c95f' stroke-width='3.2' fill='none' stroke-linecap='round' opacity='.85'/>
        <ellipse cx='19' cy='14' rx='8' ry='4' fill='#fff' opacity='.35'/>
        <ellipse cx='24' cy='26' rx='22' ry='7' fill='none' stroke='url(#o)' stroke-width='3' transform='rotate(-20 24 26)'/>`),
    photos: svg(`<defs><linearGradient id='sk' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3b94f0'/><stop offset='1' stop-color='#c4e6ff'/></linearGradient></defs>
        <g transform='rotate(-10 20 24)'><rect x='5' y='10' width='28' height='24' fill='#fff' stroke='#7a8899'/><rect x='8' y='13' width='22' height='15' fill='#f0b24a'/></g>
        <rect x='15' y='14' width='29' height='25' fill='#fff' stroke='#6b7a8b'/><rect x='18' y='17' width='23' height='16' fill='url(#sk)'/>
        <circle cx='36' cy='21' r='2.5' fill='#fff26b'/><path d='M18 33l7-8 5 5 3-3 8 6z' fill='#3d9a3c'/>`),
    mines: svg(`<defs><radialGradient id='b' cx='.35' cy='.35' r='.7'><stop offset='0' stop-color='#8a8f99'/><stop offset='.5' stop-color='#22262d'/><stop offset='1' stop-color='#050608'/></radialGradient>
        <linearGradient id='t' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#a7d4ff'/><stop offset='1' stop-color='#3c78c8'/></linearGradient></defs>
        <rect x='3' y='3' width='42' height='42' rx='5' fill='url(#t)' stroke='#1f4f8f'/>
        <g stroke='#111' stroke-width='3' stroke-linecap='round'><path d='M24 8v32M8 24h32M12.5 12.5l23 23M35.5 12.5l-23 23'/></g>
        <circle cx='24' cy='24' r='11' fill='url(#b)'/><circle cx='20' cy='20' r='3' fill='#fff' opacity='.85'/>`),
    taskmgr: svg(`<defs><linearGradient id='m' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#eef2f6'/><stop offset='1' stop-color='#97a3af'/></linearGradient></defs>
        <rect x='4' y='6' width='40' height='29' rx='2' fill='url(#m)' stroke='#56606b'/><rect x='7' y='9' width='34' height='23' fill='#08130a'/>
        <g stroke='#1a5c22' stroke-width='.7'><path d='M7 15h34M7 21h34M7 27h34M14 9v23M21 9v23M28 9v23M35 9v23'/></g>
        <path d='M7 28l5-4 4 2 5-9 4 6 5-10 4 7 5-3' stroke='#48ff4f' stroke-width='1.8' fill='none'/>
        <path d='M18 35h12l2 6H16z' fill='#97a3af' stroke='#56606b'/>`),
    cmd: svg(`<defs><linearGradient id='t' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#bcd3ee'/><stop offset='1' stop-color='#6c8fbb'/></linearGradient></defs>
        <rect x='3' y='7' width='42' height='34' rx='2' fill='url(#t)' stroke='#2c4a73'/><rect x='5.5' y='13' width='37' height='25.5' fill='#0b0b0b'/>
        <text x='8' y='25' font-family='Consolas,monospace' font-size='9' fill='#d8d8d8'>C:\\&gt;</text><rect x='30' y='23' width='6' height='2' fill='#d8d8d8'/>`),
    run: svg(`<defs><linearGradient id='t' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#c9dcf2'/><stop offset='1' stop-color='#7c9cc6'/></linearGradient>
        <linearGradient id='a' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7fe06f'/><stop offset='1' stop-color='#1f8f28'/></linearGradient></defs>
        <rect x='3' y='9' width='34' height='28' rx='2' fill='url(#t)' stroke='#2c4a73'/><rect x='5.5' y='14' width='29' height='20.5' fill='#fff'/>
        <path d='M24 30h10v-6l11 10-11 10v-6H24z' fill='url(#a)' stroke='#13621a'/>`),
    search: svg(`<defs><radialGradient id='l' cx='.35' cy='.3' r='.8'><stop offset='0' stop-color='#e6f7ff'/><stop offset='1' stop-color='#58a9e8'/></radialGradient></defs>
        <path d='M29 29l12 12' stroke='#3b2a14' stroke-width='7' stroke-linecap='round'/><path d='M29 29l12 12' stroke='#9b6a2f' stroke-width='4' stroke-linecap='round'/>
        <circle cx='20' cy='20' r='13' fill='url(#l)' stroke='#5b6b7c' stroke-width='3'/><path d='M12 17a9 9 0 0 1 8-6' stroke='#fff' stroke-width='2.5' fill='none' stroke-linecap='round'/>`),
    help: svg(`<defs><radialGradient id='g' cx='.4' cy='.3' r='.8'><stop offset='0' stop-color='#8fd3ff'/><stop offset='1' stop-color='#0d5fc4'/></radialGradient></defs>
        <circle cx='24' cy='24' r='19' fill='url(#g)' stroke='#0a4796'/><ellipse cx='24' cy='14' rx='13' ry='7' fill='#fff' opacity='.3'/>
        <text x='24' y='33' text-anchor='middle' font-family='Segoe UI,Arial' font-weight='bold' font-size='24' fill='#fff'>?</text>`),
    games: svg(`<defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#6b7480'/><stop offset='1' stop-color='#1d2329'/></linearGradient></defs>
        <path d='M10 15h28c6 0 9 6 9 14 0 7-3 10-6 10-4 0-6-6-9-6H16c-3 0-5 6-9 6-3 0-6-3-6-10 0-8 3-14 9-14z' fill='url(#g)' stroke='#0d1014'/>
        <path d='M12 21v8M8 25h8' stroke='#e6e9ec' stroke-width='2.6'/>
        <circle cx='34' cy='22' r='2.3' fill='#ff5a4f'/><circle cx='39' cy='26' r='2.3' fill='#43c24f'/><circle cx='29' cy='26' r='2.3' fill='#3d8eea'/><circle cx='34' cy='30' r='2.3' fill='#f7c934'/>
        <ellipse cx='24' cy='18' rx='12' ry='2' fill='#fff' opacity='.2'/>`),
    recent: svg(page(`<g stroke='#7d97bd' stroke-width='1.4'><path d='M15 18h19M15 22.5h12'/></g>
        <circle cx='31' cy='33' r='10' fill='#fff' stroke='#2f72c4' stroke-width='2'/><path d='M31 26v7l4 3' stroke='#1d3d6b' stroke-width='2' fill='none' stroke-linecap='round'/>`)),
    connect: svg(`<defs><linearGradient id='m' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#eef2f6'/><stop offset='1' stop-color='#97a3af'/></linearGradient></defs>
        <rect x='2' y='6' width='20' height='15' rx='1.5' fill='url(#m)' stroke='#56606b'/><rect x='4.5' y='8.5' width='15' height='10' fill='#2c7fd0'/>
        <rect x='26' y='24' width='20' height='15' rx='1.5' fill='url(#m)' stroke='#56606b'/><rect x='28.5' y='26.5' width='15' height='10' fill='#2c7fd0'/>
        <path d='M12 21v10h24v-7' stroke='#3fae46' stroke-width='3' fill='none'/><circle cx='24' cy='31' r='4' fill='#3fae46' stroke='#1d6d22'/>`),
    defaultPrograms: svg(`<defs><linearGradient id='m' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#eef2f6'/><stop offset='1' stop-color='#97a3af'/></linearGradient></defs>
        <rect x='4' y='6' width='34' height='26' rx='2' fill='url(#m)' stroke='#56606b'/><rect x='7' y='9' width='28' height='20' fill='#2c7fd0'/>
        <path d='M16 32h10l2 5H14z' fill='#97a3af' stroke='#56606b'/>
        <path d='M22 30l7 8 15-18' stroke='#1d7a24' stroke-width='6' fill='none' stroke-linecap='round' stroke-linejoin='round'/>
        <path d='M22 30l7 8 15-18' stroke='#63d86b' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`),
    personalize: svg(`<defs><linearGradient id='m' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#eef2f6'/><stop offset='1' stop-color='#97a3af'/></linearGradient>
        <linearGradient id='w' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#bdf05f'/><stop offset='.5' stop-color='#28a36a'/><stop offset='1' stop-color='#1c66b8'/></linearGradient></defs>
        <rect x='3' y='5' width='38' height='29' rx='2' fill='url(#m)' stroke='#56606b'/><rect x='6' y='8' width='32' height='23' fill='url(#w)'/>
        <path d='M17 34h10l2 6H15z' fill='#97a3af' stroke='#56606b'/>
        <path d='M46 14L32 34l-3 1 1-3L44 12z' fill='#c9772b' stroke='#5a3410'/><path d='M29 35c-2 1-3 4-6 4 1-2 1-5 4-6z' fill='#e8312c'/>`),
    users: svg(`<defs><radialGradient id='a' cx='.4' cy='.3' r='.8'><stop offset='0' stop-color='#9be38f'/><stop offset='1' stop-color='#2c8a2a'/></radialGradient>
        <radialGradient id='b' cx='.4' cy='.3' r='.8'><stop offset='0' stop-color='#9cd2ff'/><stop offset='1' stop-color='#1f64be'/></radialGradient></defs>
        <circle cx='17' cy='15' r='7' fill='#f2c9a0' stroke='#9b6f45'/><path d='M4 40c0-10 6-15 13-15s13 5 13 15z' fill='url(#a)' stroke='#1e6420'/>
        <circle cx='32' cy='19' r='7' fill='#f0c59b' stroke='#9b6f45'/><path d='M19 44c0-10 6-15 13-15s13 5 13 15z' fill='url(#b)' stroke='#164c94'/>`),
    datetime: svg(`<defs><radialGradient id='f' cx='.4' cy='.3' r='.8'><stop offset='0' stop-color='#ffffff'/><stop offset='1' stop-color='#cfd8e3'/></radialGradient></defs>
        <circle cx='24' cy='24' r='19' fill='url(#f)' stroke='#4b5866' stroke-width='3'/>
        <g stroke='#4b5866' stroke-width='1.5'>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d='M${24 + Math.sin(a) * 14} ${24 - Math.cos(a) * 14}L${24 + Math.sin(a) * 16.5} ${24 - Math.cos(a) * 16.5}'/>`; }).join('')}</g>
        <path d='M24 24V12M24 24l8 5' stroke='#1d2833' stroke-width='2.6' stroke-linecap='round'/><circle cx='24' cy='24' r='2' fill='#c0392b'/>`),
    sound: svg(`<defs><linearGradient id='s' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#d7dee6'/><stop offset='1' stop-color='#5d6a78'/></linearGradient></defs>
        <path d='M6 18h8l11-9v30l-11-9H6z' fill='url(#s)' stroke='#333d47'/>
        <path d='M30 17c3 3 3 11 0 14M34 13c5 5 5 17 0 22M38 9c7 7 7 23 0 30' stroke='#2f7fd8' stroke-width='2.6' fill='none' stroke-linecap='round'/>`),
    programs: svg(`<defs><linearGradient id='b' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#f6dc9a'/><stop offset='1' stop-color='#c48a33'/></linearGradient></defs>
        <path d='M6 16l18-8 18 8v22l-18 8-18-8z' fill='url(#b)' stroke='#7a5216'/><path d='M6 16l18 8 18-8M24 24v22' stroke='#7a5216' fill='none'/>
        <path d='M15 12l18 8v6' stroke='#fff' stroke-width='3' fill='none' opacity='.7'/>
        <rect x='11' y='26' width='9' height='9' fill='#2f7fd8' transform='skewY(24)' opacity='.85'/>`),
    accessibility: svg(`<defs><radialGradient id='g' cx='.4' cy='.3' r='.8'><stop offset='0' stop-color='#8fd3ff'/><stop offset='1' stop-color='#0d5fc4'/></radialGradient></defs>
        <circle cx='24' cy='24' r='20' fill='url(#g)' stroke='#0a4796'/><circle cx='24' cy='12.5' r='3.5' fill='#fff'/>
        <path d='M12 18l12 3 12-3M24 21v9l-6 10M24 30l6 10' stroke='#fff' stroke-width='3.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`),
    security: svg(`<defs><linearGradient id='a' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#79b8ff'/><stop offset='1' stop-color='#0d4ea8'/></linearGradient>
        <linearGradient id='b' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#ffe680'/><stop offset='1' stop-color='#d89a00'/></linearGradient></defs>
        <path d='M24 3l17 6v13c0 11-7 19-17 23C14 41 7 33 7 22V9z' fill='url(#a)' stroke='#0a3474' stroke-width='1.5'/>
        <path d='M24 3v42C14 41 7 33 7 22V9z' fill='url(#b)' opacity='.95'/><path d='M7 22h34' stroke='#0a3474' stroke-width='1.2' opacity='.5'/>`),
    sidebar: svg(`<defs><linearGradient id='p' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#2b3a4a'/><stop offset='1' stop-color='#0c141c'/></linearGradient></defs>
        <rect x='14' y='3' width='22' height='42' rx='2' fill='url(#p)' stroke='#000'/><circle cx='25' cy='14' r='7' fill='#fff' stroke='#8b96a1' stroke-width='1.5'/>
        <path d='M25 14v-4M25 14l3 2' stroke='#333' stroke-width='1.4'/><rect x='18' y='25' width='14' height='9' rx='1' fill='#e5f0fa'/><rect x='18' y='36' width='14' height='6' rx='1' fill='#79c06b'/>`),
    taskbarSettings: svg(`<rect x='3' y='8' width='42' height='30' rx='2' fill='#e8eff7' stroke='#56606b'/><rect x='3' y='32' width='42' height='6' fill='#1b2530'/>
        <circle cx='8' cy='35' r='3.4' fill='#3d8eea' stroke='#9bd0ff'/><rect x='13' y='33.5' width='10' height='3' rx='1' fill='#5c6d80'/><rect x='38' y='33.5' width='5' height='3' fill='#c5d3e2'/>`),
    folderOptions: svg(`<path d='M4 12h14l4 4h22v24H4z' fill='#f0c56b' stroke='#a77822'/><path d='M4 20h40v20H4z' fill='#f7d887' stroke='#a77822'/>
        <g transform='translate(34 34)'><circle r='8' fill='#d7dde3' stroke='#4b5560' stroke-width='1.5'/><circle r='3' fill='#5b6773'/>
        <g stroke='#4b5560' stroke-width='2.6'><path d='M0-10v3M0 7v3M-10 0h3M7 0h3'/></g></g>`),
    welcome: svg(`<defs><radialGradient id='g' cx='.4' cy='.3' r='.8'><stop offset='0' stop-color='#fff59b'/><stop offset='1' stop-color='#f2a200'/></radialGradient></defs>
        <path d='M24 3l6 13 14 1-11 9 4 14-13-8-13 8 4-14L4 17l14-1z' fill='url(#g)' stroke='#a96d00'/>`),
    info: svg(`<defs><radialGradient id='g' cx='.4' cy='.3' r='.8'><stop offset='0' stop-color='#a8dcff'/><stop offset='1' stop-color='#1364c6'/></radialGradient></defs>
        <circle cx='24' cy='24' r='20' fill='url(#g)' stroke='#0d4a96' stroke-width='1.5'/><ellipse cx='24' cy='13' rx='13' ry='7' fill='#fff' opacity='.35'/>
        <circle cx='24' cy='14' r='3' fill='#fff'/><rect x='21' y='20' width='6' height='16' rx='1.5' fill='#fff'/>`),
    warning: svg(`<defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff08a'/><stop offset='1' stop-color='#f2b300'/></linearGradient></defs>
        <path d='M24 4L45 42H3z' fill='url(#g)' stroke='#9c6b00' stroke-width='1.5' stroke-linejoin='round'/>
        <rect x='21.5' y='16' width='5' height='14' rx='1.5' fill='#1b1b1b'/><circle cx='24' cy='35.5' r='2.8' fill='#1b1b1b'/>`),
    error: svg(`<defs><radialGradient id='g' cx='.4' cy='.3' r='.8'><stop offset='0' stop-color='#ffa293'/><stop offset='1' stop-color='#c41a0b'/></radialGradient></defs>
        <circle cx='24' cy='24' r='20' fill='url(#g)' stroke='#7f0c03' stroke-width='1.5'/><ellipse cx='24' cy='13' rx='13' ry='7' fill='#fff' opacity='.3'/>
        <path d='M16 16l16 16M32 16L16 32' stroke='#fff' stroke-width='5' stroke-linecap='round'/>`),
    question: svg(`<defs><radialGradient id='g' cx='.4' cy='.3' r='.8'><stop offset='0' stop-color='#a8dcff'/><stop offset='1' stop-color='#1364c6'/></radialGradient></defs>
        <circle cx='24' cy='24' r='20' fill='url(#g)' stroke='#0d4a96' stroke-width='1.5'/><ellipse cx='24' cy='13' rx='13' ry='7' fill='#fff' opacity='.35'/>
        <text x='24' y='33' text-anchor='middle' font-family='Segoe UI,Arial' font-weight='bold' font-size='24' fill='#fff'>?</text>`),
    shield: svg(`<defs><linearGradient id='a' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#79b8ff'/><stop offset='1' stop-color='#0d4ea8'/></linearGradient>
        <linearGradient id='b' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#ffe680'/><stop offset='1' stop-color='#d89a00'/></linearGradient></defs>
        <path d='M24 3l17 6v13c0 11-7 19-17 23C14 41 7 33 7 22V9z' fill='url(#a)' stroke='#0a3474' stroke-width='1.5'/>
        <path d='M24 3v20H7V9zM24 23h17c0 11-7 19-17 22z' fill='url(#b)'/>`),
    user: svg(`<defs><radialGradient id='a' cx='.4' cy='.3' r='.8'><stop offset='0' stop-color='#9cd2ff'/><stop offset='1' stop-color='#1f64be'/></radialGradient></defs>
        <circle cx='24' cy='15' r='9' fill='#f2c9a0' stroke='#9b6f45'/><path d='M7 45c0-13 8-19 17-19s17 6 17 19z' fill='url(#a)' stroke='#164c94'/>`),
    showDesktop: svg(`<rect x='4' y='6' width='40' height='30' rx='2' fill='#2c7fd0' stroke='#1c3c66'/><path d='M4 28c10-6 20-2 40-8v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z' fill='#3ea74b'/>
        <rect x='8' y='10' width='14' height='9' fill='#fff' stroke='#556' opacity='.9'/><rect x='24' y='14' width='14' height='9' fill='#fff' stroke='#556' opacity='.9'/>
        <rect x='4' y='36' width='40' height='5' fill='#1b2530'/>`),
    flip: svg(`<g transform='skewY(-12)'><rect x='16' y='14' width='26' height='20' fill='#bcd6f2' stroke='#2c4a73' opacity='.8'/><rect x='11' y='18' width='26' height='20' fill='#d9e8f8' stroke='#2c4a73' opacity='.9'/><rect x='6' y='22' width='26' height='20' fill='#fff' stroke='#2c4a73'/><rect x='6' y='22' width='26' height='4' fill='#4f86c6'/></g>`),
    volume: svg(`<path d='M6 18h8l11-9v30l-11-9H6z' fill='#e8eef4' stroke='#1e2a36' stroke-width='2'/><path d='M31 17c3 3 3 11 0 14M36 12c5 5 5 19 0 24' stroke='#e8eef4' stroke-width='3' fill='none' stroke-linecap='round'/>`),
    volumeMute: svg(`<path d='M6 18h8l11-9v30l-11-9H6z' fill='#e8eef4' stroke='#1e2a36' stroke-width='2'/><circle cx='37' cy='24' r='8' fill='#d9301f' stroke='#fff' stroke-width='1.5'/><path d='M33 20l8 8M41 20l-8 8' stroke='#fff' stroke-width='2.6'/>`),
    netTray: svg(`<rect x='4' y='8' width='20' height='15' rx='1' fill='#e8eef4' stroke='#1e2a36' stroke-width='2'/><rect x='24' y='20' width='20' height='15' rx='1' fill='#e8eef4' stroke='#1e2a36' stroke-width='2'/>
        <path d='M14 23v12h10' stroke='#e8eef4' stroke-width='3' fill='none'/><rect x='7' y='11' width='14' height='9' fill='#3a8ee0'/><rect x='27' y='23' width='14' height='9' fill='#3a8ee0'/>`),
    lock: svg(`<path d='M15 21v-6a9 9 0 0 1 18 0v6' stroke='#c9a640' stroke-width='5' fill='none'/><rect x='9' y='20' width='30' height='22' rx='3' fill='#f2cf55' stroke='#8a6a10' stroke-width='1.5'/><circle cx='24' cy='30' r='3' fill='#7a5a08'/><rect x='23' y='31' width='2' height='6' fill='#7a5a08'/>`),
    gadget: svg(`<rect x='6' y='6' width='36' height='36' rx='6' fill='#3d8eea' stroke='#1c4f8f'/><circle cx='24' cy='24' r='10' fill='#fff'/><path d='M24 24v-7M24 24l5 3' stroke='#333' stroke-width='2'/>`),
    screensaver: svg(`<rect x='4' y='6' width='40' height='30' rx='2' fill='#0b1830' stroke='#56606b'/><circle cx='16' cy='18' r='6' fill='none' stroke='#7fd3ff' stroke-width='1.5'/><circle cx='30' cy='24' r='8' fill='none' stroke='#ff9be8' stroke-width='1.5'/><circle cx='34' cy='14' r='3' fill='none' stroke='#bfff8f'/><path d='M18 36h12l2 6H16z' fill='#97a3af' stroke='#56606b'/>`),
};

// Overlay badges drawn on top of the folder icon for special folders.
const badge = body => svg(body);
const B = {
    documents: badge(`<rect x='14' y='12' width='22' height='26' fill='#fff' stroke='#7a8ca3'/><g stroke='#7d97bd' stroke-width='1.6'><path d='M18 19h14M18 24h14M18 29h14M18 34h9'/></g>`),
    pictures: badge(`<rect x='12' y='14' width='26' height='22' fill='#fff' stroke='#6b7a8b'/><rect x='14.5' y='16.5' width='21' height='15' fill='#4aa3ff'/><circle cx='31' cy='21' r='2.3' fill='#fff26b'/><path d='M14.5 31.5l6-7 5 5 3-3 7 5z' fill='#3d9a3c'/>`),
    music: badge(`<path d='M22 14l14-3v19' stroke='#1b3f78' stroke-width='3' fill='none'/><path d='M22 14v20' stroke='#1b3f78' stroke-width='3'/><ellipse cx='18.5' cy='34' rx='5' ry='3.8' fill='#2a68c7' stroke='#123a73'/><ellipse cx='32.5' cy='30' rx='5' ry='3.8' fill='#2a68c7' stroke='#123a73'/>`),
    videos: badge(`<rect x='12' y='15' width='26' height='19' rx='1.5' fill='#222' stroke='#000'/><rect x='16' y='18' width='18' height='13' fill='#4f9be6'/><g fill='#fff'>${[0, 1, 2, 3, 4].map(i => `<rect x='${13 + i * 5}' y='15.8' width='2.4' height='1.6'/><rect x='${13 + i * 5}' y='31.8' width='2.4' height='1.6'/>`).join('')}</g>`),
    downloads: badge(`<path d='M19 12h10v12h7L24 38 12 24h7z' fill='#3fbf4a' stroke='#16661c' stroke-width='1.5' stroke-linejoin='round'/>`),
    favorites: badge(`<path d='M25 10l4.5 9.5 10.5 1-8 7 2.5 10-9.5-5.5-9.5 5.5 2.5-10-8-7 10.5-1z' fill='#ffd23a' stroke='#a9770a' stroke-width='1.2'/>`),
    home: badge(`<circle cx='25' cy='19' r='6' fill='#f2c9a0' stroke='#9b6f45'/><path d='M14 38c0-8 5-12 11-12s11 4 11 12z' fill='#3d8eea' stroke='#164c94'/>`),
    desktop: badge(`<rect x='12' y='14' width='26' height='18' rx='1' fill='#cfd8e2' stroke='#56606b'/><rect x='14' y='16' width='22' height='14' fill='#3aa66a'/><path d='M21 32h8l1 4h-10z' fill='#97a3af'/>`),
    gear: badge(`<g transform='translate(30 30)'><circle r='8' fill='#d7dde3' stroke='#4b5560' stroke-width='1.5'/><circle r='3' fill='#5b6773'/><g stroke='#4b5560' stroke-width='2.6'><path d='M0-10v3M0 7v3M-10 0h3M7 0h3'/></g></g>`),
    trashFull: badge(`<g opacity='.95'><path d='M15 12c2-5 6-6 9-4 2-4 7-3 8 1 3 0 4 3 2 5-4 2-15 2-19-2z' fill='#fbfbf5' stroke='#9aa3ad' stroke-width='.8'/>
        <path d='M19 9l5 4M27 8l-2 5M31 11l-5 2' stroke='#b8c0c8' stroke-width='.7'/><rect x='17' y='13' width='8' height='12' fill='#eef3ff' opacity='.7' transform='rotate(-8 21 19)'/><rect x='25' y='14' width='8' height='10' fill='#fff8e6' opacity='.7' transform='rotate(10 29 19)'/></g>`),
    shortcut: badge(`<rect x='1' y='31' width='16' height='16' rx='2' fill='#fff' stroke='#6d7f95'/><path d='M5 43c0-6 3-9 8-9v-3l4 5-4 5v-3c-3 0-6 1-8 5z' fill='#1a5fc0'/>`),
};

export const FOLDER_BADGE = {
    documents: 'documents', pictures: 'pictures', music: 'music', videos: 'videos',
    downloads: 'downloads', favorites: 'favorites', home: 'home', desktop: 'desktop',
};

/** Avatars for user accounts. */
export const AVATARS = {
    flor: svg(`<defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#5bb8ff'/><stop offset='1' stop-color='#d8f1ff'/></linearGradient></defs>
        <rect width='48' height='48' fill='url(#s)'/><path d='M0 40c10-6 30-6 48 0v8H0z' fill='#4fb34a'/><path d='M24 30v18' stroke='#2f7f2a' stroke-width='2.5'/>
        <g fill='#ff6fae'>${[0, 72, 144, 216, 288].map(a => `<ellipse cx='24' cy='13' rx='5' ry='8' transform='rotate(${a} 24 21)'/>`).join('')}</g><circle cx='24' cy='21' r='4.5' fill='#ffd43b'/>`),
    peixe: svg(`<defs><linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#1aa6d8'/><stop offset='1' stop-color='#043d7a'/></linearGradient></defs>
        <rect width='48' height='48' fill='url(#w)'/><path d='M8 24c6-9 20-11 28 0-8 11-22 9-28 0z' fill='#ff8c1a' stroke='#b35400'/><path d='M36 24l9-7v14z' fill='#ff8c1a' stroke='#b35400'/>
        <circle cx='15' cy='22' r='2' fill='#fff'/><circle cx='15' cy='22' r='1' fill='#000'/><path d='M22 17v14M27 18v12' stroke='#fff' stroke-width='2' opacity='.8'/>
        <circle cx='10' cy='9' r='2' fill='none' stroke='#bdf' /><circle cx='6' cy='14' r='1.3' fill='none' stroke='#bdf'/>`),
    bola: svg(`<defs><radialGradient id='b' cx='.35' cy='.3' r='.8'><stop offset='0' stop-color='#fff'/><stop offset='1' stop-color='#c7cfd8'/></radialGradient></defs>
        <rect width='48' height='48' fill='#39a845'/><path d='M0 30h48v18H0z' fill='#2f8f3a'/><circle cx='24' cy='24' r='14' fill='url(#b)' stroke='#555'/>
        <path d='M24 17l6 4-2 7h-8l-2-7z' fill='#222'/><path d='M24 10v7M30 21l7-3M28 28l4 6M20 28l-4 6M18 21l-7-3' stroke='#444' stroke-width='1.2'/>`),
    montanha: svg(`<defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ff9a3c'/><stop offset='1' stop-color='#ffe2a8'/></linearGradient></defs>
        <rect width='48' height='48' fill='url(#s)'/><circle cx='34' cy='16' r='6' fill='#fff3b0'/><path d='M0 40L14 18l9 12 7-8 18 18v8H0z' fill='#5a4a7a'/><path d='M14 18l4 6-4-1-3 2z' fill='#fff'/>`),
    gato: svg(`<rect width='48' height='48' fill='#b7a3e6'/><path d='M10 14l6 8h16l6-8 2 16c0 9-7 14-16 14S8 39 8 30z' fill='#f39a3d' stroke='#9a5a12'/>
        <circle cx='18' cy='29' r='2.5' fill='#222'/><circle cx='30' cy='29' r='2.5' fill='#222'/><path d='M22 34l2 2 2-2' stroke='#222' fill='none'/><path d='M8 33l8 1M8 37l8-1M40 33l-8 1M40 37l-8-1' stroke='#fff'/>`),
    robo: svg(`<rect width='48' height='48' fill='#2b3d55'/><rect x='11' y='14' width='26' height='22' rx='4' fill='#c4d0dc' stroke='#5b6774'/><path d='M24 14V8' stroke='#c4d0dc' stroke-width='2'/><circle cx='24' cy='7' r='2.5' fill='#ff5a4f'/>
        <circle cx='18' cy='24' r='4' fill='#3df0ff' stroke='#167480'/><circle cx='30' cy='24' r='4' fill='#3df0ff' stroke='#167480'/><rect x='17' y='30' width='14' height='3' rx='1.5' fill='#5b6774'/>`),
};

export function avatarSrc(id) { return AVATARS[id] || (id && id.startsWith('data:') ? id : AVATARS.flor); }

/** Resolve an icon name into {src, badge}. */
export function iconSrc(name) {
    if (!name) return { src: S.file };
    if (name.startsWith('data:') || name.includes('/')) return { src: name };
    if (PNG[name]) return { src: PNG[name] };
    if (S[name]) return { src: S[name] };
    if (name === 'trashFull') return { src: PNG.trash, badge: B.trashFull, badgeFull: true };
    if (name.startsWith('folder:')) {
        const b = name.slice(7);
        return { src: PNG.folder, badge: B[b] };
    }
    return { src: S.file };
}

/** HTML for an icon at a given size. Extra: 'shortcut' to add the link arrow. */
export function ico(name, size = 16, { shortcut = false, cls = '' } = {}) {
    const i = iconSrc(name);
    const b = i.badge ? `<img class="ico-badge${i.badgeFull ? ' full' : ''}" src="${i.badge}" alt="" draggable="false">` : '';
    const sc = shortcut ? `<img class="ico-shortcut" src="${B.shortcut}" alt="" draggable="false">` : '';
    return `<span class="ico ${cls}" style="width:${size}px;height:${size}px"><img src="${i.src}" alt="" draggable="false">${b}${sc}</span>`;
}

/** Icon name for a file system node. */
export function iconForNode(n, FS) {
    if (!n) return 'file';
    if (n.id === 'root') return 'drive';
    if (n.id === 'recycle') return FS && FS.children('recycle').length ? 'trashFull' : 'trash';
    if (n.type === 'folder') return FOLDER_BADGE[n.id] ? `folder:${FOLDER_BADGE[n.id]}` : 'folder';
    if (n.type === 'link') return null; // resolved by caller via the app registry
    const e = extOf(n.name);
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].includes(e)) return 'imageFile';
    if (['txt', 'log', 'ini', 'md', 'json', 'csv', 'bat'].includes(e)) return 'textFile';
    return 'file';
}

export const ICONS = { ...S, ...PNG };
