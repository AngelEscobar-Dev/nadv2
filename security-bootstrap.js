'use strict';

/**
 * Production security guard loaded before server.js.
 *
 * The legacy server currently contains development fallbacks for the session
 * secret and the initial administrator password. Until those fallbacks are
 * removed from server.js, this bootstrap prevents a production/Railway deploy
 * from ever starting with missing or known-weak values.
 */

const isRailway = Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_ENVIRONMENT_ID ||
    process.env.RAILWAY_PROJECT_ID
);
const isProduction = process.env.NODE_ENV === 'production' || isRailway;

if (!isProduction) {
    // Development keeps the existing local setup for now.
    return;
}

const missing = [];
if (!process.env.SESSION_SECRET) missing.push('SESSION_SECRET');
if (!process.env.ADMIN_DEFAULT_PASS) missing.push('ADMIN_DEFAULT_PASS');

if (missing.length) {
    console.error(`\n❌ Configuración de seguridad incompleta: faltan ${missing.join(', ')}.`);
    console.error('El servidor no arrancará en producción hasta configurar estas variables.\n');
    process.exit(1);
}

const sessionSecret = process.env.SESSION_SECRET;
const adminPassword = process.env.ADMIN_DEFAULT_PASS;

const knownWeakSessionSecrets = new Set([
    'nad-secret-2026-xK9mP',
    'cambiar-este-secreto-en-produccion',
    'change-me',
    'secret'
]);

const knownWeakAdminPasswords = new Set([
    'nad2026',
    'admin',
    'password',
    '123456',
    'cambiar-esta-contrasena'
]);

if (sessionSecret.length < 32 || knownWeakSessionSecrets.has(sessionSecret)) {
    console.error('\n❌ SESSION_SECRET es demasiado corto o usa un valor conocido/inseguro.');
    console.error('Usá un secreto aleatorio de al menos 32 caracteres.\n');
    process.exit(1);
}

if (adminPassword.length < 12 || knownWeakAdminPasswords.has(adminPassword.toLowerCase())) {
    console.error('\n❌ ADMIN_DEFAULT_PASS es demasiado corto o usa un valor conocido/inseguro.');
    console.error('Usá una contraseña inicial única de al menos 12 caracteres.\n');
    process.exit(1);
}

if (!process.env.ADMIN_PATH || process.env.ADMIN_PATH === 'gestion-nad-2026') {
    console.warn('⚠️  Recomendación: configurá ADMIN_PATH con una ruta administrativa no predecible.');
}
