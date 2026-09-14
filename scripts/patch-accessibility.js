'use strict';

const fs = require('fs');
const path = require('path');

function patchFile(relativePath, patches) {
    const filePath = path.join(__dirname, '..', relativePath);
    let source = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    for (const { label, before, after } of patches) {
        if (source.includes(after)) {
            console.log(`✓ ${relativePath} — ${label}: ya aplicado`);
            continue;
        }
        if (!source.includes(before)) {
            throw new Error(`${relativePath}: no se encontró el bloque esperado para ${label}. Se aborta.`);
        }
        source = source.replace(before, after);
        changed = true;
        console.log(`✓ ${relativePath} — ${label}: aplicado`);
    }

    if (changed) fs.writeFileSync(filePath, source, 'utf8');
}

patchFile('script.js', [
    {
        label: 'estado accesible del menú móvil',
        before: `    function toggleMenu() {\n        menuOpen = !menuOpen;\n        mobileNav.classList.toggle('open', menuOpen);\n        mobileMenuBtn.innerHTML = menuOpen\n            ? '<i data-lucide="x"></i>'\n            : '<i data-lucide="menu"></i>';\n        safeCreateIcons();\n    }\n\n    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMenu);`,
        after: `    function toggleMenu() {\n        menuOpen = !menuOpen;\n        mobileNav.classList.toggle('open', menuOpen);\n        mobileMenuBtn.setAttribute('aria-expanded', String(menuOpen));\n        mobileMenuBtn.setAttribute('aria-label', menuOpen ? 'Cerrar menú' : 'Abrir menú');\n        mobileMenuBtn.innerHTML = menuOpen\n            ? '<i data-lucide="x"></i>'\n            : '<i data-lucide="menu"></i>';\n        safeCreateIcons();\n    }\n\n    if (mobileMenuBtn) {\n        mobileMenuBtn.setAttribute('aria-expanded', 'false');\n        mobileMenuBtn.setAttribute('aria-controls', 'mobile-nav');\n        mobileMenuBtn.addEventListener('click', toggleMenu);\n    }`
    },
    {
        label: 'recordar foco antes de abrir modal',
        before: `    const modalCta   = document.getElementById('modal-cta-btn');`,
        after: `    const modalCta   = document.getElementById('modal-cta-btn');\n    let lastModalFocus = null;`
    },
    {
        label: 'mover foco al modal',
        before: `    function openModal(btn) {\n        if (!modal) return;\n        const mediaUrl = btn.dataset.image || '';`,
        after: `    function openModal(btn) {\n        if (!modal) return;\n        lastModalFocus = document.activeElement;\n        const mediaUrl = btn.dataset.image || '';`
    },
    {
        label: 'enfocar botón cerrar al abrir modal',
        before: `                document.body.style.overflow = 'hidden';\n                safeCreateIcons();`,
        after: `                document.body.style.overflow = 'hidden';\n                if (modalClose) modalClose.focus();\n                safeCreateIcons();`
    },
    {
        label: 'restaurar foco al cerrar modal',
        before: `                modal.style.display = 'none';\n            }\n        }, 400);`,
        after: `                modal.style.display = 'none';\n                if (lastModalFocus && typeof lastModalFocus.focus === 'function') lastModalFocus.focus();\n            }\n        }, 400);`
    },
    {
        label: 'trampa de foco del modal',
        before: `    document.addEventListener('keydown', e => {\n        if (e.key === 'Escape' && modal && modal.classList.contains('active')) closeModal();\n    });`,
        after: `    document.addEventListener('keydown', e => {\n        if (!modal || !modal.classList.contains('active')) return;\n        if (e.key === 'Escape') {\n            closeModal();\n            return;\n        }\n        if (e.key === 'Tab') {\n            const focusable = Array.from(modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))\n                .filter(el => !el.hasAttribute('hidden') && el.offsetParent !== null);\n            if (!focusable.length) return;\n            const first = focusable[0];\n            const last = focusable[focusable.length - 1];\n            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }\n            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }\n        }\n    });`
    }
]);

patchFile('proyectos.js', [
    {
        label: 'estado accesible del menú móvil',
        before: `    if (mobileMenuBtn) {\n        mobileMenuBtn.addEventListener('click', () => {\n            menuOpen = !menuOpen;\n            mobileNav.classList.toggle('open', menuOpen);\n            mobileMenuBtn.innerHTML = menuOpen ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';\n            safeCreateIcons();\n        });\n    }`,
        after: `    if (mobileMenuBtn) {\n        mobileMenuBtn.setAttribute('aria-expanded', 'false');\n        mobileMenuBtn.setAttribute('aria-controls', 'mobile-nav');\n        mobileMenuBtn.addEventListener('click', () => {\n            menuOpen = !menuOpen;\n            mobileNav.classList.toggle('open', menuOpen);\n            mobileMenuBtn.setAttribute('aria-expanded', String(menuOpen));\n            mobileMenuBtn.setAttribute('aria-label', menuOpen ? 'Cerrar menú' : 'Abrir menú');\n            mobileMenuBtn.innerHTML = menuOpen ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';\n            safeCreateIcons();\n        });\n    }`
    },
    {
        label: 'enlaces semánticos a cada proyecto',
        before: `                    <div class="project-info" onclick="openProjectModal(${ '${p.id}' })" style="cursor:pointer;">\n                        <div class="project-meta">`,
        after: `                    <a class="project-info project-info-link" href="/proyecto/${ '${p.id}' }">\n                        <div class="project-meta">`
    },
    {
        label: 'cierre semántico del enlace de proyecto',
        before: `                        <button type="button" class="btn btn-primary" style="align-self:flex-start;">\n                            <i data-lucide="layout-grid"></i> <span>Ver proyecto completo</span>\n                        </button>\n                    </div>`,
        after: `                        <span class="btn btn-primary" style="align-self:flex-start;">\n                            <i data-lucide="layout-grid"></i> <span>Ver proyecto completo</span>\n                        </span>\n                    </a>`
    },
    {
        label: 'respetar movimiento reducido en Swiper',
        before: `                            autoplay: {\n                                delay: 5000,\n                                disableOnInteraction: true,\n                            }`,
        after: `                            autoplay: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : {\n                                delay: 5000,\n                                disableOnInteraction: true,\n                            }`
    }
]);

const stylesPath = path.join(__dirname, '..', 'styles.css');
let styles = fs.readFileSync(stylesPath, 'utf8');
const marker = '/* Accessibility: reduced motion */';
if (!styles.includes(marker)) {
    styles += `\n\n${marker}\n.project-info-link{color:inherit;text-decoration:none}.project-info-link:focus-visible{outline:3px solid currentColor;outline-offset:4px;border-radius:8px}\n@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto!important}*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}\n`;
    fs.writeFileSync(stylesPath, styles, 'utf8');
    console.log('✓ styles.css — movimiento reducido y foco visible: aplicado');
} else {
    console.log('✓ styles.css — movimiento reducido y foco visible: ya aplicado');
}
