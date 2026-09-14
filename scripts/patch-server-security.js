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
    'imports de configuración segura y store SQLite',
    "const helmet = require('helmet');\n",
    "const helmet = require('helmet');\nconst { getSessionSecret, getInitialAdminPassword, isProductionEnvironment } = require('./lib/security-config');\nconst SQLiteSessionStore = require('./lib/sqlite-session-store');\n"
);

replaceOnce(
    'eliminar contraseña administrativa hardcodeada',
    `        if (!row) {\n            const defaultPass = process.env.ADMIN_DEFAULT_PASS || 'nad2026';\n            const hashed = bcrypt.hashSync(defaultPass, 10);\n            db.run(\"INSERT INTO admin (username, password) VALUES ('admin', ?)\", [hashed]);\n            console.log(\`✅ Admin inicial verificado (usuario: admin)\`);\n        }`,
    `        if (!row) {\n            const defaultPass = getInitialAdminPassword();\n            if (!defaultPass) {\n                console.warn('⚠️ ADMIN_DEFAULT_PASS no configurado: no se creará un administrador inicial.');\n                return;\n            }\n            const hashed = bcrypt.hashSync(defaultPass, 12);\n            db.run(\"INSERT INTO admin (username, password) VALUES ('admin', ?)\", [hashed]);\n            console.log('✅ Admin inicial creado (usuario: admin)');\n        }`
);

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

replaceOnce(
    'escapar título SEO',
    "                html = html.replace(/<title>[^<]*<\\/title>/i, `<title>${meta.title}</title>`);",
    "                html = html.replace(/<title>[^<]*<\\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);"
);
replaceOnce(
    'escapar OpenGraph title',
    "                html = html.replace(/<meta property=\"og:title\" content=\"[^\"]*\"/i, `<meta property=\"og:title\" content=\"${meta.title}\"`);",
    "                html = html.replace(/<meta property=\"og:title\" content=\"[^\"]*\"/i, `<meta property=\"og:title\" content=\"${escapeHtml(meta.title)}\"`);"
);
replaceOnce(
    'escapar Twitter title',
    "                html = html.replace(/<meta name=\"twitter:title\" content=\"[^\"]*\"/i, `<meta name=\"twitter:title\" content=\"${meta.title}\"`);",
    "                html = html.replace(/<meta name=\"twitter:title\" content=\"[^\"]*\"/i, `<meta name=\"twitter:title\" content=\"${escapeHtml(meta.title)}\"`);"
);
replaceOnce(
    'escapar meta description',
    "                html = html.replace(/<meta name=\"description\" content=\"[^\"]*\"/i, `<meta name=\"description\" content=\"${meta.desc}\"`);",
    "                html = html.replace(/<meta name=\"description\" content=\"[^\"]*\"/i, `<meta name=\"description\" content=\"${escapeHtml(meta.desc)}\"`);"
);
replaceOnce(
    'escapar OpenGraph description',
    "                html = html.replace(/<meta property=\"og:description\" content=\"[^\"]*\"/i, `<meta property=\"og:description\" content=\"${meta.desc}\"`);",
    "                html = html.replace(/<meta property=\"og:description\" content=\"[^\"]*\"/i, `<meta property=\"og:description\" content=\"${escapeHtml(meta.desc)}\"`);"
);
replaceOnce(
    'escapar Twitter description',
    "                html = html.replace(/<meta name=\"twitter:description\" content=\"[^\"]*\"/i, `<meta name=\"twitter:description\" content=\"${meta.desc}\"`);",
    "                html = html.replace(/<meta name=\"twitter:description\" content=\"[^\"]*\"/i, `<meta name=\"twitter:description\" content=\"${escapeHtml(meta.desc)}\"`);"
);
replaceOnce(
    'escapar OpenGraph image',
    "                html = html.replace(/<meta property=\"og:image\" content=\"[^\"]*\"/i, `<meta property=\"og:image\" content=\"${img}\"`);",
    "                html = html.replace(/<meta property=\"og:image\" content=\"[^\"]*\"/i, `<meta property=\"og:image\" content=\"${escapeHtml(img)}\"`);"
);
replaceOnce(
    'escapar Twitter image',
    "                html = html.replace(/<meta name=\"twitter:image\" content=\"[^\"]*\"/i, `<meta name=\"twitter:image\" content=\"${img}\"`);",
    "                html = html.replace(/<meta name=\"twitter:image\" content=\"[^\"]*\"/i, `<meta name=\"twitter:image\" content=\"${escapeHtml(img)}\"`);"
);
replaceOnce(
    'escapar OpenGraph URL',
    "                html = html.replace(/<meta property=\"og:url\" content=\"[^\"]*\"/i, `<meta property=\"og:url\" content=\"${u}\"`);",
    "                html = html.replace(/<meta property=\"og:url\" content=\"[^\"]*\"/i, `<meta property=\"og:url\" content=\"${escapeHtml(u)}\"`);"
);

replaceOnce(
    '404 real para proyectos inexistentes',
    `app.get('/proyecto/:id', (req, res) => {\n    db.get('SELECT * FROM projects WHERE id = ?', [req.params.id], (err, row) => {\n        if (err || !row) return renderPageWithMeta('index.html', req, res); // fallback\n        const meta = {`,
    `app.get('/proyecto/:id', (req, res) => {\n    db.get('SELECT * FROM projects WHERE id = ?', [req.params.id], (err, row) => {\n        if (err) {\n            console.error('Error cargando proyecto:', err);\n            return res.status(500).send('Error interno');\n        }\n        if (!row) return res.status(404).send('Proyecto no encontrado');\n        const meta = {`
);

replaceOnce(
    'sesiones persistentes y secreto seguro',
    `app.use(session({\n    secret: process.env.SESSION_SECRET || 'nad-secret-2026-xK9mP',\n    resave: false,\n    saveUninitialized: false,\n    cookie: {\n        maxAge: 8 * 60 * 60 * 1000,\n        httpOnly: true,\n        sameSite: 'lax',\n        // En producción (Railway, etc.) forzar cookie segura automáticamente\n        secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true'\n    }\n}));`,
    `app.use(session({\n    name: 'nad.sid',\n    store: new SQLiteSessionStore(db),\n    secret: getSessionSecret(),\n    resave: false,\n    saveUninitialized: false,\n    rolling: true,\n    cookie: {\n        maxAge: 8 * 60 * 60 * 1000,\n        httpOnly: true,\n        sameSite: 'strict',\n        secure: isProductionEnvironment() || process.env.COOKIE_SECURE === 'true'\n    }\n}));`
);

replaceOnce(
    'protección same-origin contra CSRF',
    `function requireAuth(req, res, next) {\n    if (req.session && req.session.admin) return next();\n    return res.redirect(\`/\${ADMIN_PATH}/login\`);\n}`,
    `function requireAuth(req, res, next) {\n    if (req.session && req.session.admin) return next();\n    return res.redirect(\`/\${ADMIN_PATH}/login\`);\n}\n\nfunction requireSameOrigin(req, res, next) {\n    const expectedOrigin = \`${'${req.protocol}'}://${'${req.get(\'host\')}' }\`;\n    const origin = req.get('origin');\n    const referer = req.get('referer');\n\n    try {\n        if (origin && new URL(origin).origin === expectedOrigin) return next();\n        if (!origin && referer && new URL(referer).origin === expectedOrigin) return next();\n    } catch (err) {\n        // URL inválida: se rechaza abajo.\n    }\n\n    return res.status(403).json({ error: 'Origen de solicitud no permitido' });\n}`
);

replaceOnce(
    'proteger login contra CSRF',
    "app.post(`/${ADMIN_PATH}/login`, async (req, res) => {",
    "app.post(`/${ADMIN_PATH}/login`, requireSameOrigin, async (req, res) => {"
);

replaceOnce(
    'regenerar sesión después del login',
    `        await resetAttempts(ip);\n        req.session.admin = { id: admin.id, username: admin.username };\n        res.redirect(\`/\${ADMIN_PATH}\`);`,
    `        await resetAttempts(ip);\n        await new Promise((resolve, reject) => {\n            req.session.regenerate(err => err ? reject(err) : resolve());\n        });\n        req.session.admin = { id: admin.id, username: admin.username };\n        await new Promise((resolve, reject) => {\n            req.session.save(err => err ? reject(err) : resolve());\n        });\n        return res.redirect(\`/\${ADMIN_PATH}\`);`
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
    console.log('✅ server.js actualizado de forma segura.');
} else {
    console.log('ℹ️ No había cambios pendientes en server.js.');
}
