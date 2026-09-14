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
        throw new Error(`No se encontró el bloque esperado para: ${label}. Se aborta.`);
    }
    source = source.replace(before, after);
    changed = true;
    console.log(`✓ ${label}: aplicado`);
}

replaceOnce(
    'bloquear archivos internos',
    "const BLOCKED_FILES = new Set(['server.js', 'package.json', 'package-lock.json', '.env', '.gitignore', 'railway.json']);",
    "const BLOCKED_FILES = new Set(['server.js', 'security-bootstrap.js', 'project.html', 'package.json', 'package-lock.json', '.env', '.env.example', '.gitignore', 'railway.json']);"
);

replaceOnce(
    'bloquear directorios internos',
    "    if (reqPath.includes('/data/') || reqPath.includes('/node_modules/') || reqPath.includes('/.git/') || reqPath.includes('/backup_')) {",
    "    if (reqPath.includes('/data/') || reqPath.includes('/node_modules/') || reqPath.includes('/.git/') || reqPath.includes('/.github/') || reqPath.includes('/lib/') || reqPath.includes('/scripts/') || reqPath.includes('/backup_')) {"
);

if (changed) {
    fs.writeFileSync(serverPath, source, 'utf8');
    console.log('✅ Archivos internos excluidos del servidor estático.');
} else {
    console.log('ℹ️ No había cambios pendientes en archivos estáticos.');
}
