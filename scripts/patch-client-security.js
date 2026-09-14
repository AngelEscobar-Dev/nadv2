' strict';

const fs = require('fs');
const path = require('path');

const clientPath = path.join(__dirname, '..', 'script.js');
let source = fs.readFileSync(clientPath, 'utf8');
let changed = false;

function replaceOnce(label, before, after) {
    if (source.includes(after)) {
        console.log(`✓ ${label}: ya aplicado`);
        return;
    }
    if (!source.includes(before)) {
        throw new Error(`No se encontró el bloque esperado para: ${label}. Se aborta para no modificar el frontend inesperadamente.`);
    }
    source = source.replace(before, after);
    changed = true;
    console.log(`✓ ${label}: aplicado`);
}

replaceOnce(
    'sanitizador HTML y validadores de URL',
    `    function escapeHtml(str) {\n        if (!str) return '';\n        return String(str)\n            .replace(/&/g, '&amp;')\n            .replace(/</g, '&lt;')\n            .replace(/>/g, '&gt;')\n            .replace(/\"/g, '&quot;')\n            .replace(/'/g, '&#039;');\n    }`,
    `    function escapeHtml(str) {\n        if (!str) return '';\n        return String(str)\n            .replace(/&/g, '&amp;')\n            .replace(/</g, '&lt;')\n            .replace(/>/g, '&gt;')\n            .replace(/\"/g, '&quot;')\n            .replace(/'/g, '&#039;');\n    }\n\n    function sanitizeCmsHtml(html) {\n        const template = document.createElement('template');\n        template.innerHTML = String(html == null ? '' : html);\n        const allowedTags = new Set(['SPAN', 'BR', 'STRONG', 'EM', 'B', 'I']);\n\n        Array.from(template.content.querySelectorAll('*')).forEach(el => {\n            if (!allowedTags.has(el.tagName)) {\n                el.replaceWith(document.createTextNode(el.textContent || ''));\n                return;\n            }\n\n            Array.from(el.attributes).forEach(attr => {\n                const allowedGradientClass = el.tagName === 'SPAN' &&\n                    attr.name === 'class' &&\n                    attr.value.split(/\\s+/).filter(Boolean).every(c => c === 'text-gradient');\n                if (!allowedGradientClass) el.removeAttribute(attr.name);\n            });\n        });\n\n        return template.innerHTML;\n    }\n\n    function safeHttpUrl(value) {\n        if (!value) return null;\n        try {\n            const url = new URL(String(value), window.location.origin);\n            if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;\n            return url.href;\n        } catch (e) {\n            return null;\n        }\n    }\n\n    function safeMediaUrl(value) {\n        if (!value) return null;\n        try {\n            const url = new URL(String(value), window.location.origin);\n            if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;\n            return url.href;\n        } catch (e) {\n            return null;\n        }\n    }`
);

replaceOnce(
    'sanitizar campos CMS con HTML permitido',
    `                const setHtml = (id, html) => {\n                    const el = document.getElementById(id);\n                    if (el && html !== undefined) el.innerHTML = html;\n                };`,
    `                const setHtml = (id, html) => {\n                    const el = document.getElementById(id);\n                    if (el && html !== undefined) el.innerHTML = sanitizeCmsHtml(html);\n                };`
);

replaceOnce(
    'validar enlace de WhatsApp',
    `                        if (el) el.href = texts.contact_wsp_link;`,
    `                        if (el) {\n                            const safeUrl = safeHttpUrl(texts.contact_wsp_link);\n                            if (safeUrl) el.href = safeUrl;\n                        }`
);

replaceOnce(
    'validar enlace de Instagram',
    `                    const igUrl = texts.contact_instagram.startsWith('http') \n                        ? texts.contact_instagram \n                        : \`https://www.instagram.com/\${texts.contact_instagram.replace('@', '')}/\`;`,
    `                    const igCandidate = texts.contact_instagram.startsWith('http')\n                        ? texts.contact_instagram\n                        : \`https://www.instagram.com/\${texts.contact_instagram.replace('@', '')}/\`;\n                    const igUrl = safeHttpUrl(igCandidate);`
);

replaceOnce(
    'ignorar Instagram inválido',
    `                        if (el) el.href = igUrl;`,
    `                        if (el && igUrl) el.href = igUrl;`
);

replaceOnce(
    'validar URLs de video antes de renderizar',
    `            if (content.video && content.video.src && videoUrls.length === 0) {\n                videoUrls = [content.video.src];\n            }`,
    `            if (content.video && content.video.src && videoUrls.length === 0) {\n                videoUrls = [content.video.src];\n            }\n            videoUrls = videoUrls.map(safeMediaUrl).filter(Boolean);`
);

replaceOnce(
    'validar imágenes del slider hero',
    `                        images.hero_slider.forEach((imgSrc) => {`,
    `                        images.hero_slider.map(safeMediaUrl).filter(Boolean).forEach((imgSrc) => {`
);

replaceOnce(
    'validar logos del carrusel de clientes',
    `                        let logosToRender = images.clients_logos;`,
    `                        let logosToRender = images.clients_logos.map(safeMediaUrl).filter(Boolean);`
);

if (changed) {
    fs.writeFileSync(clientPath, source, 'utf8');
    console.log('✅ script.js actualizado con sanitización CMS y URLs seguras.');
} else {
    console.log('ℹ️ No había cambios pendientes en script.js.');
}
