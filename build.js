// Script de build: inyecta variables de entorno en el HTML antes del deploy
const fs = require('fs');
const path = require('path');

// Lee .env local si existe (para desarrollo; en Netlify usa las env vars del dashboard)
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
  } catch {
    // No .env file — se usan las env vars del sistema (Netlify dashboard)
  }
}

loadDotEnv();

const required = [
  'EMAILJS_PUBLIC_KEY', 'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID',
  'WSP_NUMBER_CAMI', 'WSP_NUMBER_PAOLO'
];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('ERROR: Faltan variables de entorno:', missing.join(', '));
  console.error('Crea un archivo .env o configura las variables en el dashboard de Netlify.');
  process.exit(1);
}

const WSP_MSG = encodeURIComponent('Hola! Vi su perfil en influencerstemuco.netlify.app y me gustaría proponerles una colaboración 🚀');
const wspUrlCami  = `https://wa.me/${process.env.WSP_NUMBER_CAMI}?text=${WSP_MSG}`;
const wspUrlPaolo = `https://wa.me/${process.env.WSP_NUMBER_PAOLO}?text=${WSP_MSG}`;

// Crea carpeta dist/
const dist = path.join(__dirname, 'dist');
if (!fs.existsSync(dist)) fs.mkdirSync(dist, { recursive: true });

// Procesa index.html — reemplaza los placeholders con los valores reales
let html = fs.readFileSync('index.html', 'utf8');
html = html
  .replace("'YOUR_PUBLIC_KEY'",  `'${process.env.EMAILJS_PUBLIC_KEY}'`)
  .replace("'YOUR_SERVICE_ID'",  `'${process.env.EMAILJS_SERVICE_ID}'`)
  .replace("'YOUR_TEMPLATE_ID'", `'${process.env.EMAILJS_TEMPLATE_ID}'`)
  .replace(/__WSP_URL_CAMI__/g,  wspUrlCami)
  .replace(/__WSP_URL_PAOLO__/g, wspUrlPaolo);

fs.writeFileSync(path.join(dist, 'index.html'), html);

// Copia qr.html tal cual
fs.copyFileSync('qr.html', path.join(dist, 'qr.html'));

console.log('Build OK → dist/');
console.log('  index.html  (EmailJS + WhatsApp inyectados)');
console.log('  qr.html');
