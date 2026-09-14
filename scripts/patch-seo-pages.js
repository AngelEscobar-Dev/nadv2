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
    'helper upsert de metadata',
    `function escapeHtml(value) {\n    return String(value == null ? '' : value)\n        .replace(/&/g, '&amp;')\n        .replace(/</g, '&lt;')\n        .replace(/>/g, '&gt;')\n        .replace(/\"/g, '&quot;')\n        .replace(/'/g, '&#39;');\n}`,
    `function escapeHtml(value) {\n    return String(value == null ? '' : value)\n        .replace(/&/g, '&amp;')\n        .replace(/</g, '&lt;')\n        .replace(/>/g, '&gt;')\n        .replace(/\"/g, '&quot;')\n        .replace(/'/g, '&#39;');\n}\n\nfunction upsertMetaTag(html, attribute, name, content) {\n    const safeContent = escapeHtml(content);\n    const prefix = '<meta ' + attribute + '=\"' + name + '\" content=\"';\n    const lowerHtml = html.toLowerCase();\n    const start = lowerHtml.indexOf(prefix.toLowerCase());\n    if (start !== -1) {\n        const contentStart = start + prefix.length;\n        const contentEnd = html.indexOf('\"', contentStart);\n        if (contentEnd !== -1) {\n            return html.slice(0, contentStart) + safeContent + html.slice(contentEnd);\n        }\n    }\n    const tag = prefix + safeContent + '\">';\n    return html.replace('</head>', '    ' + tag + '\\n</head>');\n}`
);

replaceOnce(
    'metadata canónica y social uniforme',
    `            res.send(html);`,
    `            const canonicalPath = metaOverride.url || (req.path === '/index.html' ? '/' : req.path);\n            const canonicalUrl = canonicalPath.startsWith('http') ? canonicalPath : DOMAIN + canonicalPath;\n            const socialImage = meta.image && meta.image.startsWith('http') ? meta.image : DOMAIN + (meta.image || '/nad.png');\n\n            html = upsertMetaTag(html, 'property', 'og:title', meta.title);\n            html = upsertMetaTag(html, 'property', 'og:description', meta.desc);\n            html = upsertMetaTag(html, 'property', 'og:image', socialImage);\n            html = upsertMetaTag(html, 'property', 'og:url', canonicalUrl);\n            html = upsertMetaTag(html, 'name', 'twitter:card', 'summary_large_image');\n            html = upsertMetaTag(html, 'name', 'twitter:title', meta.title);\n            html = upsertMetaTag(html, 'name', 'twitter:description', meta.desc);\n            html = upsertMetaTag(html, 'name', 'twitter:image', socialImage);\n\n            const canonicalTag = '<link rel=\"canonical\" href=\"' + escapeHtml(canonicalUrl) + '\">';\n            if (/<link\\s+rel=[\"']canonical[\"'][^>]*>/i.test(html)) {\n                html = html.replace(/<link\\s+rel=[\"']canonical[\"'][^>]*>/i, canonicalTag);\n            } else {\n                html = html.replace('</head>', '    ' + canonicalTag + '\\n</head>');\n            }\n\n            res.send(html);`
);

replaceOnce(
    'metadata específica de proyectos',
    `app.get('/proyectos', (req, res) => renderPageWithMeta('proyectos.html', req, res));`,
    `app.get('/proyectos', (req, res) => renderPageWithMeta('proyectos.html', req, res, {\n    title: 'Proyectos | NAD Constructora',\n    desc: 'Conocé proyectos de arquitectura, diseño estructural y construcción desarrollados por NAD Constructora en Paraguay.',\n    image: '/nad.png',\n    url: '/proyectos'\n}));`
);

if (changed) {
    fs.writeFileSync(serverPath, source, 'utf8');
    console.log('✅ Metadata SEO canónica y social habilitada.');
} else {
    console.log('ℹ️ No había cambios pendientes de SEO.');
}
