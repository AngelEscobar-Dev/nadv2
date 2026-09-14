'use strict';

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'server.js');
let source = fs.readFileSync(serverPath, 'utf8');

const before = `    if (newPass.length < 6) {\n        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });\n    }`;
const after = `    if (newPass.length < 12) {\n        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 12 caracteres' });\n    }`;

if (source.includes(after)) {
    console.log('✓ Política de contraseña: ya aplicada');
} else if (source.includes(before)) {
    source = source.replace(before, after);
    fs.writeFileSync(serverPath, source, 'utf8');
    console.log('✓ Política de contraseña: mínimo elevado a 12 caracteres');
} else {
    throw new Error('No se encontró el bloque esperado de política de contraseña. Se aborta.');
}
