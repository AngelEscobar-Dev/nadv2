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
    'sesiones persistentes y secreto seguro',
    `app.use(session({\n    secret: process.env.SESSION_SECRET || 'nad-secret-2026-xK9mP',\n    resave: false,\n    saveUninitialized: false,\n    cookie: {\n        maxAge: 8 * 60 * 60 * 1000,\n        httpOnly: true,\n        sameSite: 'lax',\n        // En producción (Railway, etc.) forzar cookie segura automáticamente\n        secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true'\n    }\n}));`,
    `app.use(session({\n    name: 'nad.sid',\n    store: new SQLiteSessionStore(db),\n    secret: getSessionSecret(),\n    resave: false,\n    saveUninitialized: false,\n    rolling: true,\n    cookie: {\n        maxAge: 8 * 60 * 60 * 1000,\n        httpOnly: true,\n        sameSite: 'lax',\n        secure: isProductionEnvironment() || process.env.COOKIE_SECURE === 'true'\n    }\n}));`
);

replaceOnce(
    'regenerar sesión después del login',
    `        await resetAttempts(ip);\n        req.session.admin = { id: admin.id, username: admin.username };\n        res.redirect(\`/\${ADMIN_PATH}\`);`,
    `        await resetAttempts(ip);\n        await new Promise((resolve, reject) => {\n            req.session.regenerate(err => err ? reject(err) : resolve());\n        });\n        req.session.admin = { id: admin.id, username: admin.username };\n        await new Promise((resolve, reject) => {\n            req.session.save(err => err ? reject(err) : resolve());\n        });\n        return res.redirect(\`/\${ADMIN_PATH}\`);`
);

if (changed) {
    fs.writeFileSync(serverPath, source, 'utf8');
    console.log('✅ server.js actualizado de forma segura.');
} else {
    console.log('ℹ️ No había cambios pendientes en server.js.');
}
