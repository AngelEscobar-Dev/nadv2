'use strict';

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'server.js');
let source = fs.readFileSync(serverPath, 'utf8');

const before = "app.use(helmet({ contentSecurityPolicy: false }));";
const after = `app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://unpkg.com',
                'https://cdn.jsdelivr.net',
                'https://cdn.plyr.io',
                'https://www.instagram.com'
            ],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://cdn.plyr.io',
                'https://cdn.jsdelivr.net',
                'https://cdnjs.cloudflare.com',
                'https://fonts.googleapis.com'
            ],
            fontSrc: [
                "'self'",
                'data:',
                'https://fonts.gstatic.com',
                'https://cdnjs.cloudflare.com'
            ],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            mediaSrc: ["'self'", 'blob:', 'https:'],
            frameSrc: [
                "'self'",
                'https://www.youtube.com',
                'https://youtube.com',
                'https://www.youtube-nocookie.com',
                'https://www.instagram.com',
                'https://www.google.com'
            ],
            connectSrc: [
                "'self'",
                'https://www.instagram.com',
                'https://graph.instagram.com'
            ],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            upgradeInsecureRequests: null
        }
    }
}));`;

if (source.includes(after)) {
    console.log('✓ CSP: ya habilitada');
} else if (source.includes(before)) {
    source = source.replace(before, after);
    fs.writeFileSync(serverPath, source, 'utf8');
    console.log('✓ CSP: habilitada con allowlist de recursos usados por el sitio');
} else {
    throw new Error('No se encontró la configuración esperada de Helmet/CSP. Se aborta.');
}
