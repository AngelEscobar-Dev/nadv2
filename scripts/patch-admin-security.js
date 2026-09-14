'use strict';

const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'admin', 'index.html');
let source = fs.readFileSync(adminPath, 'utf8');
let changed = false;

function replaceOnce(label, before, after) {
    if (source.includes(after)) {
        console.log(`✓ ${label}: ya aplicado`);
        return;
    }
    if (!source.includes(before)) {
        throw new Error(`No se encontró el bloque esperado para: ${label}. Se aborta para no modificar el panel inesperadamente.`);
    }
    source = source.replace(before, after);
    changed = true;
    console.log(`✓ ${label}: aplicado`);
}

replaceOnce(
    'logout administrativo por POST',
    "const le=document.getElementById('logout-btn');if(le)le.href=PANEL+'/logout';",
    "const le=document.getElementById('logout-btn');if(le){le.href='#';le.addEventListener('click',async e=>{e.preventDefault();try{const r=await fetch(PANEL+'/logout',{method:'POST'});if(!r.ok)throw new Error('No se pudo cerrar la sesión');window.location.href=PANEL+'/login';}catch(err){showToast(err.message||'Error al cerrar sesión','error');}});}"
);

replaceOnce(
    'contraseña administrativa mínima de 12 caracteres',
    "if(np.length<6){err.textContent='La contraseña debe tener al menos 6 caracteres';err.classList.add('show');return;}",
    "if(np.length<12){err.textContent='La contraseña debe tener al menos 12 caracteres';err.classList.add('show');return;}"
);

if (changed) {
    fs.writeFileSync(adminPath, source, 'utf8');
    console.log('✅ admin/index.html actualizado de forma segura.');
} else {
    console.log('ℹ️ No había cambios pendientes en admin/index.html.');
}
