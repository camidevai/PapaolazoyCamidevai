// Script de build: inyecta variables de entorno en el HTML antes del deploy
const fs   = require('fs');
const path = require('path');

// ── .env local ──────────────────────────────────────────────────────────────
function loadDotEnv() {
  try {
    const raw = fs.readFileSync('.env', 'utf8');
    raw.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) process.env[key] = val;
    });
  } catch { /* sin .env local */ }
}
loadDotEnv();

// ── Variables requeridas ─────────────────────────────────────────────────────
const required = [
  'EMAILJS_PUBLIC_KEY', 'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID',
  'WSP_NUMBER_CAMI', 'WSP_NUMBER_PAOLO'
];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('ERROR: Faltan variables de entorno:', missing.join(', '));
  process.exit(1);
}

const snapIdCami  = process.env.SNAP_ID_CAMI || '';
const snapIdPaolo = process.env.SNAP_ID_PAPA || '';
const WSP_MSG     = encodeURIComponent('Hola! Vi su perfil en influencerstemuco.netlify.app y me gustaría proponerles una colaboración 🚀');
const wspUrlCami  = `https://wa.me/${process.env.WSP_NUMBER_CAMI}?text=${WSP_MSG}`;
const wspUrlPaolo = `https://wa.me/${process.env.WSP_NUMBER_PAOLO}?text=${WSP_MSG}`;

// ── Carpetas ─────────────────────────────────────────────────────────────────
const dist    = path.join(__dirname, 'dist');
const imgDist = path.join(dist, 'img');
if (!fs.existsSync(dist))    fs.mkdirSync(dist, { recursive: true });
if (!fs.existsSync(imgDist)) fs.mkdirSync(imgDist, { recursive: true });

// Copia imágenes estáticas de public/img/ (recursivo)
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(file => {
    const s = path.join(src, file);
    const d = path.join(dest, file);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  });
}
copyDir(path.join(__dirname, 'public', 'img'), imgDist);

// ── HTML ─────────────────────────────────────────────────────────────────────
let html = fs.readFileSync('index.html', 'utf8');
html = html
  .replace("'YOUR_PUBLIC_KEY'",  `'${process.env.EMAILJS_PUBLIC_KEY}'`)
  .replace("'YOUR_SERVICE_ID'",  `'${process.env.EMAILJS_SERVICE_ID}'`)
  .replace("'YOUR_TEMPLATE_ID'", `'${process.env.EMAILJS_TEMPLATE_ID}'`)
  .replace(/__WSP_URL_CAMI__/g,  wspUrlCami)
  .replace(/__WSP_URL_PAOLO__/g, wspUrlPaolo)
  .replace(/__SNAP_ID_CAMI__/g,  snapIdCami)
  .replace(/__SNAP_ID_PAPA__/g,  snapIdPaolo);

fs.writeFileSync(path.join(dist, 'index.html'), html);
fs.copyFileSync('qr.html', path.join(dist, 'qr.html'));

console.log('Build OK → dist/');
console.log('  index.html  (EmailJS + WhatsApp inyectados)');
console.log('  qr.html');
console.log('  img/  (fotos de perfil)');
