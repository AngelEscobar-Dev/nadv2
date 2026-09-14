'use strict';

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'server.js');
let source = fs.readFileSync(serverPath, 'utf8');
let changed = false;

function replaceOnce(label, before, after) {
    if (source.includes(after)) {
        console.log(`✓ ${label}: ya aplicado`);
        return;
    }
    if (!source.includes(before)) {
        throw new Error(`No se encontró el bloque esperado para: ${label}. Se aborta para no modificar código inesperado.`);
    }
    source = source.replace(before, after);
    changed = true;
    console.log(`✓ ${label}: aplicado`);
}

replaceOnce(
    'validar extensión y MIME de uploads',
    `const upload = multer({\n    storage,\n    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB máx\n    fileFilter: (req, file, cb) => {\n        const ok = /\\.(jpe?g|png|webp|gif|svg|mp4|mov|webm|jfif|avif|bmp)$/i.test(path.extname(file.originalname));\n        if (ok) {\n            cb(null, true);\n        } else {\n            cb(new Error('Formato de archivo no admitido. Usá JPG, PNG, WEBP, GIF, SVG o MP4.'));\n        }\n    }\n});`,
    `const ALLOWED_UPLOAD_TYPES = new Map([\n    ['.jpg', new Set(['image/jpeg'])],\n    ['.jpeg', new Set(['image/jpeg'])],\n    ['.jfif', new Set(['image/jpeg'])],\n    ['.png', new Set(['image/png'])],\n    ['.webp', new Set(['image/webp'])],\n    ['.gif', new Set(['image/gif'])],\n    ['.avif', new Set(['image/avif'])],\n    ['.bmp', new Set(['image/bmp', 'image/x-ms-bmp'])],\n    ['.mp4', new Set(['video/mp4'])],\n    ['.mov', new Set(['video/quicktime'])],\n    ['.webm', new Set(['video/webm'])]\n]);\n\nconst upload = multer({\n    storage,\n    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB máx\n    fileFilter: (req, file, cb) => {\n        const ext = path.extname(file.originalname).toLowerCase();\n        const allowedMimes = ALLOWED_UPLOAD_TYPES.get(ext);\n        if (allowedMimes && allowedMimes.has(file.mimetype)) {\n            return cb(null, true);\n        }\n        return cb(new Error('Formato o tipo MIME no admitido. Usá JPG, PNG, WEBP, GIF, AVIF, BMP, MP4, MOV o WEBM.'));\n    }\n});`
);

replaceOnce(
    'helper para escapar metadatos HTML',
    `const defaultMeta = {\n    title: 'NAD Constructora | Arquitectura, Diseño y Construcción',\n    desc: 'NAD Constructora ofrece servicios integrales de estudio de factibilidad, proyecto arquitectónico y construcción en Paraguay. Calidad, compromiso y excelencia técnica en cada obra.',\n    image: '/nad.png',\n    url: '/'\n};`,
    `const defaultMeta = {\n    title: 'NAD Constructora | Arquitectura, Diseño y Construcción',\n    desc: 'NAD Constructora ofrece servicios integrales de estudio de factibilidad, proyecto arquitectónico y construcción en Paraguay. Calidad, compromiso y excelencia técnica en cada obra.',\n    image: '/nad.png',\n    url: '/'\n};\n\nfunction escapeHtml(value) {\n    return String(value == null ? '' : value)\n        .replace(/&/g, '&amp;')\n        .replace(/</g, '&lt;')\n        .replace(/>/g, '&gt;')\n        .replace(/\"/g, '&quot;')\n        .replace(/'/g, '&#39;');\n}`
);

const metaReplacements = [
    ['escapar título SEO', "                html = html.replace(/<title>[^<]*<\\/title>/i, `<title>${meta.title}</title>`);", "                html = html.replace(/<title>[^<]*<\\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);"],
    ['escapar OpenGraph title', "                html = html.replace(/<meta property=\"og:title\" content=\"[^\"]*\"/i, `<meta property=\"og:title\" content=\"${meta.title}\"`);", "                html = html.replace(/<meta property=\"og:title\" content=\"[^\"]*\"/i, `<meta property=\"og:title\" content=\"${escapeHtml(meta.title)}\"`);"],
    ['escapar Twitter title', "                html = html.replace(/<meta name=\"twitter:title\" content=\"[^\"]*\"/i, `<meta name=\"twitter:title\" content=\"${meta.title}\"`);", "                html = html.replace(/<meta name=\"twitter:title\" content=\"[^\"]*\"/i, `<meta name=\"twitter:title\" content=\"${escapeHtml(meta.title)}\"`);"],
    ['escapar meta description', "                html = html.replace(/<meta name=\"description\" content=\"[^\"]*\"/i, `<meta name=\"description\" content=\"${meta.desc}\"`);", "                html = html.replace(/<meta name=\"description\" content=\"[^\"]*\"/i, `<meta name=\"description\" content=\"${escapeHtml(meta.desc)}\"`);"],
    ['escapar OpenGraph description', "                html = html.replace(/<meta property=\"og:description\" content=\"[^\"]*\"/i, `<meta property=\"og:description\" content=\"${meta.desc}\"`);", "                html = html.replace(/<meta property=\"og:description\" content=\"[^\"]*\"/i, `<meta property=\"og:description\" content=\"${escapeHtml(meta.desc)}\"`);"],
    ['escapar Twitter description', "                html = html.replace(/<meta name=\"twitter:description\" content=\"[^\"]*\"/i, `<meta name=\"twitter:description\" content=\"${meta.desc}\"`);", "                html = html.replace(/<meta name=\"twitter:description\" content=\"[^\"]*\"/i, `<meta name=\"twitter:description\" content=\"${escapeHtml(meta.desc)}\"`);"],
    ['escapar OpenGraph image', "                html = html.replace(/<meta property=\"og:image\" content=\"[^\"]*\"/i, `<meta property=\"og:image\" content=\"${img}\"`);", "                html = html.replace(/<meta property=\"og:image\" content=\"[^\"]*\"/i, `<meta property=\"og:image\" content=\"${escapeHtml(img)}\"`);"],
    ['escapar Twitter image', "                html = html.replace(/<meta name=\"twitter:image\" content=\"[^\"]*\"/i, `<meta name=\"twitter:image\" content=\"${img}\"`);", "                html = html.replace(/<meta name=\"twitter:image\" content=\"[^\"]*\"/i, `<meta name=\"twitter:image\" content=\"${escapeHtml(img)}\"`);"],
    ['escapar OpenGraph URL', "                html = html.replace(/<meta property=\"og:url\" content=\"[^\"]*\"/i, `<meta property=\"og:url\" content=\"${u}\"`);", "                html = html.replace(/<meta property=\"og:url\" content=\"[^\"]*\"/i, `<meta property=\"og:url\" content=\"${escapeHtml(u)}\"`);"]
];
for (const [label, before, after] of metaReplacements) replaceOnce(label, before, after);

replaceOnce(
    '404 real para proyectos inexistentes',
    `app.get('/proyecto/:id', (req, res) => {\n    db.get('SELECT * FROM projects WHERE id = ?', [req.params.id], (err, row) => {\n        if (err || !row) return renderPageWithMeta('index.html', req, res); // fallback\n        const meta = {`,
    `app.get('/proyecto/:id', (req, res) => {\n    db.get('SELECT * FROM projects WHERE id = ?', [req.params.id], (err, row) => {\n        if (err) {\n            console.error('Error cargando proyecto:', err);\n            return res.status(500).send('Error interno');\n        }\n        if (!row) return res.status(404).send('Proyecto no encontrado');\n        const meta = {`
);

replaceOnce(
    'cookies SameSite strict',
    `app.use(session({\n    name: 'nad.sid',\n    store: new SQLiteSessionStore(db),\n    secret: getSessionSecret(),\n    resave: false,\n    saveUninitialized: false,\n    rolling: true,\n    cookie: {\n        maxAge: 8 * 60 * 60 * 1000,\n        httpOnly: true,\n        sameSite: 'lax',\n        secure: isProductionEnvironment() || process.env.COOKIE_SECURE === 'true'\n    }\n}));`,
    `app.use(session({\n    name: 'nad.sid',\n    store: new SQLiteSessionStore(db),\n    secret: getSessionSecret(),\n    resave: false,\n    saveUninitialized: false,\n    rolling: true,\n    cookie: {\n        maxAge: 8 * 60 * 60 * 1000,\n        httpOnly: true,\n        sameSite: 'strict',\n        secure: isProductionEnvironment() || process.env.COOKIE_SECURE === 'true'\n    }\n}));`
);

replaceOnce(
    'protección same-origin contra CSRF',
    `function requireAuth(req, res, next) {\n    if (req.session && req.session.admin) return next();\n    return res.redirect(\`/\${ADMIN_PATH}/login\`);\n}`,
    `function requireAuth(req, res, next) {\n    if (req.session && req.session.admin) return next();\n    return res.redirect(\`/\${ADMIN_PATH}/login\`);\n}\n\nfunction requireSameOrigin(req, res, next) {\n    const expectedOrigin = req.protocol + '://' + req.get('host');\n    const origin = req.get('origin');\n    const referer = req.get('referer');\n\n    try {\n        if (origin && new URL(origin).origin === expectedOrigin) return next();\n        if (!origin && referer && new URL(referer).origin === expectedOrigin) return next();\n    } catch (err) { }\n\n    return res.status(403).json({ error: 'Origen de solicitud no permitido' });\n}`
);

replaceOnce(
    'proteger login contra CSRF',
    "app.post(`/${ADMIN_PATH}/login`, async (req, res) => {",
    "app.post(`/${ADMIN_PATH}/login`, requireSameOrigin, async (req, res) => {"
);

replaceOnce(
    'logout solo por POST',
    `app.get(\`/\${ADMIN_PATH}/logout\`, (req, res) => {\n    req.session.destroy(() => res.redirect(\`/\${ADMIN_PATH}/login\`));\n});`,
    `app.post(\`/\${ADMIN_PATH}/logout\`, requireAuth, requireSameOrigin, (req, res) => {\n    req.session.destroy(err => {\n        if (err) return res.status(500).json({ error: 'No se pudo cerrar la sesión' });\n        res.clearCookie('nad.sid');\n        return res.status(204).end();\n    });\n});`
);

replaceOnce(
    'proteger mutaciones de API admin contra CSRF',
    `app.get(\`/\${ADMIN_PATH}\`, requireAuth, (req, res) => {\n    res.sendFile(path.join(__dirname, 'admin', 'index.html'));\n});\n\n// ── API admin: Proyectos`,
    `app.get(\`/\${ADMIN_PATH}\`, requireAuth, (req, res) => {\n    res.sendFile(path.join(__dirname, 'admin', 'index.html'));\n});\n\napp.use(\`/\${ADMIN_PATH}/api\`, (req, res, next) => {\n    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();\n    return requireSameOrigin(req, res, next);\n});\n\n// ── API admin: Proyectos`
);

if (changed) {
    fs.writeFileSync(serverPath, source, 'utf8');
    console.log('✅ server.js actualizado desde el estado endurecido v1 al v2.');
} else {
    console.log('ℹ️ No había cambios pendientes en server.js.');
}
