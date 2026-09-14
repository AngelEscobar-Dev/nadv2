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

function replaceExpectedCount(label, before, after, expectedCount) {
    if (source.includes(after)) {
        const afterCount = source.split(after).length - 1;
        if (afterCount >= expectedCount) {
            console.log(`✓ ${label}: ya aplicado`);
            return;
        }
    }
    const count = source.split(before).length - 1;
    if (count !== expectedCount) {
        throw new Error(`${label}: se esperaban ${expectedCount} coincidencias y se encontraron ${count}. Se aborta.`);
    }
    source = source.split(before).join(after);
    changed = true;
    console.log(`✓ ${label}: aplicado (${expectedCount})`);
}

const uploadBlockEnd = `const upload = multer({\n    storage,\n    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB máx\n    fileFilter: (req, file, cb) => {\n        const ext = path.extname(file.originalname).toLowerCase();\n        const allowedMimes = ALLOWED_UPLOAD_TYPES.get(ext);\n        if (allowedMimes && allowedMimes.has(file.mimetype)) {\n            return cb(null, true);\n        }\n        return cb(new Error('Formato o tipo MIME no admitido. Usá JPG, PNG, WEBP, GIF, AVIF, BMP, MP4, MOV o WEBM.'));\n    }\n});`;

const helperBlock = `${uploadBlockEnd}\n\nfunction hasUploadSignature(file) {\n    if (!file || !file.path) return false;\n    const ext = path.extname(file.filename || file.originalname || '').toLowerCase();\n    const fd = fs.openSync(file.path, 'r');\n    const buffer = Buffer.alloc(32);\n    let bytesRead = 0;\n    try {\n        bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);\n    } finally {\n        fs.closeSync(fd);\n    }\n    const b = buffer.subarray(0, bytesRead);\n    const starts = (...values) => values.every((v, i) => b[i] === v);\n    const ascii = b.toString('ascii');\n\n    if (['.jpg', '.jpeg', '.jfif'].includes(ext)) return starts(0xff, 0xd8, 0xff);\n    if (ext === '.png') return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);\n    if (ext === '.gif') return ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a');\n    if (ext === '.webp') return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP';\n    if (ext === '.bmp') return ascii.startsWith('BM');\n    if (ext === '.webm') return starts(0x1a, 0x45, 0xdf, 0xa3);\n    if (ext === '.avif') return ascii.slice(4, 8) === 'ftyp' && (ascii.includes('avif') || ascii.includes('avis'));\n    if (ext === '.mp4' || ext === '.mov') return ascii.slice(4, 8) === 'ftyp';\n    return false;\n}\n\nfunction validateUploadedFiles(req, res, next) {\n    const files = [];\n    if (req.file) files.push(req.file);\n    if (req.files) {\n        for (const value of Object.values(req.files)) {\n            if (Array.isArray(value)) files.push(...value);\n        }\n    }\n\n    try {\n        const invalid = files.find(file => !hasUploadSignature(file));\n        if (!invalid) return next();\n\n        for (const file of files) {\n            try { if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (err) { }\n        }\n        return res.status(400).json({ error: 'El contenido real del archivo no coincide con un formato permitido.' });\n    } catch (err) {\n        for (const file of files) {\n            try { if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (cleanupErr) { }\n        }\n        console.error('Error validando firma de archivo:', err);\n        return res.status(400).json({ error: 'No se pudo validar el archivo subido.' });\n    }\n}`;

replaceOnce('helper de firmas binarias', uploadBlockEnd, helperBlock);

const fieldsBefore = `    upload.fields([{ name: 'image', maxCount: 1 }, { name: 'extra_media', maxCount: 15 }])(req, res, err => {\n        if (err) return res.status(400).json({ error: err.message });\n        next();\n    });`;
const fieldsAfter = `    upload.fields([{ name: 'image', maxCount: 1 }, { name: 'extra_media', maxCount: 15 }])(req, res, err => {\n        if (err) return res.status(400).json({ error: err.message });\n        return validateUploadedFiles(req, res, next);\n    });`;
replaceExpectedCount('validar firmas en crear/editar proyecto', fieldsBefore, fieldsAfter, 2);

replaceOnce(
    'validar firma en upload de assets',
    `    upload.single('asset')(req, res, err => {\n        if (err) return res.status(400).json({ error: err.message });\n        next();\n    });`,
    `    upload.single('asset')(req, res, err => {\n        if (err) return res.status(400).json({ error: err.message });\n        return validateUploadedFiles(req, res, next);\n    });`
);

if (changed) {
    fs.writeFileSync(serverPath, source, 'utf8');
    console.log('✅ Validación de firmas binarias habilitada para uploads.');
} else {
    console.log('ℹ️ No había cambios pendientes en validación de firmas.');
}
