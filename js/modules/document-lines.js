/* === LIGNES (devis/facture) === */
function lnH(l,i){return'<div class="lr" data-i="'+i+'"><input class="ip" name="d'+i+'" placeholder="Description" value="'+(l.description||'').replace(/"/g,'&quot;')+'" oninput="updT()"><input class="ip mh" name="q'+i+'" type="number" min="0" step="0.01" value="'+(l.quantite||1)+'" oninput="updT()"><input class="ip mh" name="p'+i+'" type="number" min="0" step="0.01" value="'+(l.prixUnitaire||0)+'" oninput="updT()"><div class="mh text-sm text-right font-medium" id="t'+i+'">'+fm((l.quantite||1)*(l.prixUnitaire||0))+'</div><button type="button" class="b bd sm" onclick="rmLn(this)"><i class="fas fa-times"></i></button></div>'}
function addLn(){const c=document.getElementById('lc');c.insertAdjacentHTML('beforeend',lnH({description:'',quantite:1,prixUnitaire:0},c.children.length));updT()}
function rmLn(b){const c=document.getElementById('lc');if(c.children.length<=1)return;b.closest('.lr').remove();c.querySelectorAll('.lr').forEach((r,i)=>{r.dataset.i=i;r.querySelectorAll('input').forEach((inp,j)=>{inp.name=['d','q','p'][j]+i});const lt=r.querySelector('[id^=t]');if(lt)lt.id='t'+i});updT()}
function getLn(){const a=[];let i=0;while(document.querySelector('[name="d'+i+'"]')){const q=parseFloat(document.querySelector('[name="q'+i+'"]').value)||0;const p=parseFloat(document.querySelector('[name="p'+i+'"]').value)||0;a.push({description:document.querySelector('[name="d'+i+'"]').value,quantite:q,prixUnitaire:p,total:q*p});i++}return a}
function updT(){const a=getLn();const h=a.reduce((s,l)=>s+l.total,0);const txEl=document.getElementById('tvxr');const tx=txEl?(parseFloat(txEl.value)||0):(gSt().tva||20);const tv=h*tx/100;const devEl=document.getElementById('dvsel');const dv=devEl?devEl.value:(gSt().devise||'CHF');a.forEach((l,i)=>{const e=document.getElementById('t'+i);if(e)e.textContent=fm(l.total,dv)});const d=document.getElementById('td');if(d)d.innerHTML='<div class="flex justify-between"><span class="text-muted">HT</span><span>'+fm(h,dv)+'</span></div><div class="flex justify-between"><span class="text-muted">TVA ('+tx+'%)</span><span>'+fm(tv,dv)+'</span></div><div class="flex justify-between text-lg font-bold border-t border-border pt-1 mt-1"><span>TTC</span><span class="text-accent">'+fm(h+tv,dv)+'</span></div>'}
function chSt(t,id,s){const k=t==='dv'?K.dv:K.fc;sd(k,gd(k).map(x=>x.id===id?{...x,statut:s}:x));toast('Statut mis a jour','success');render()}
// ===== DÉBUT AJOUT =====

// --- Générer le HTML d'une ligne avec champs remise ---
function renderLigneAvecRemise(ligne, index) {
  var remiseType = ligne.remise_type || '';
  var remiseVal  = ligne.remise_valeur || '';
  var tauxTVA    = ligne.taux_tva || 'standard';

  var htBrut = (parseFloat(ligne.quantite) || 0) * (parseFloat(ligne.prix_unitaire) || 0);
  var htNet  = calculerHTLigne(ligne);

  return '<tr data-index="' + index + '" class="doc-ligne">' +
    '<td><input type="text" class="ligne-desc" value="' + escapeHtml(ligne.description || '') + '" placeholder="Description"></td>' +
    '<td><input type="number" class="ligne-qty" value="' + (ligne.quantite || '') + '" min="0" step="1" style="width:60px"></td>' +
    '<td><input type="number" class="ligne-prix" value="' + (ligne.prix_unitaire || '') + '" min="0" step="0.01" style="width:90px"></td>' +
    '<td>' +
      '<select class="ligne-remise-type" style="width:70px">' +
        '<option value=""' + (remiseType === '' ? ' selected' : '') + '>—</option>' +
        '<option value="pourcentage"' + (remiseType === 'pourcentage' ? ' selected' : '') + '>%</option>' +
        '<option value="montant"' + (remiseType === 'montant' ? ' selected' : '') + '>CHF</option>' +
      '</select>' +
      '<input type="number" class="ligne-remise-val" value="' + remiseVal + '" min="0" step="0.01" style="width:70px;margin-left:4px" placeholder="0" ' + (remiseType === '' ? 'disabled' : '') + '>' +
    '</td>' +
    '<td>' +
      '<select class="ligne-tva" style="width:80px">' +
        '<option value="standard"' + (tauxTVA === 'standard' ? ' selected' : '') + '>8.1%</option>' +
        '<option value="reduit"' + (tauxTVA === 'reduit' ? ' selected' : '') + '>3.8%</option>' +
        '<option value="special"' + (tauxTVA === 'special' ? ' selected' : '') + '>2.5%</option>' +
        '<option value="exempt"' + (tauxTVA === 'exempt' ? ' selected' : '') + '>0% (exon.)</option>' +
      '</select>' +
    '</td>' +
    '<td class="ligne-ht" style="text-align:right;font-weight:600">' + formatMoney(htNet) + '</td>' +
    '<td><button class="btn-suppr-ligne" title="Supprimer cette ligne">✕</button></td>' +
  '</tr>';
}

// --- Calculer le HT d'une ligne avec remise ---
function calculerHTLigne(ligne) {
  var ht = (parseFloat(ligne.quantite) || 0) * (parseFloat(ligne.prix_unitaire) || 0);
  if (ligne.remise_type === 'pourcentage' && parseFloat(ligne.remise_valeur) > 0) {
    ht = ht * (1 - parseFloat(ligne.remise_valeur) / 100);
  } else if (ligne.remise_type === 'montant' && parseFloat(ligne.remise_valeur) > 0) {
    ht = Math.max(0, ht - parseFloat(ligne.remise_valeur));
  }
  return Math.round(ht * 100) / 100;
}

// --- Recalculer tous les totaux d'un document ---
function recalculerTotauxDocument(conteneur) {
  var lignes = containeur.querySelectorAll('tr.doc-ligne');
  var totalHT = 0;
  var totalTVA = 0;
  var detailsTVA = {};

  lignes.forEach(function(tr) {
    var ligne = lireLigneDepuisTR(tr);
    var ht = calculerHTLigne(ligne);
    var taux = parseFloat(TAUX_TVA[ligne.taux_tva || 'standard']) || 0;
    var tva = Math.round(ht * taux / 100 * 100) / 100;

    totalHT += ht;
    totalTVA += tva;

    var cle = (taux) + '%';
    if (!detailsTVA[cle]) detailsTVA[cle] = { ht: 0, tva: 0 };
    detailsTVA[cle].ht += ht;
    detailsTVA[cle].tva += tva;

    // Mettre à jour l'affichage HT de la ligne
    var cellHT = tr.querySelector('.ligne-ht');
    if (cellHT) cellHT.textContent = formatMoney(ht);
  });

  totalHT = Math.round(totalHT * 100) / 100;
  totalTVA = Math.round(totalTVA * 100) / 100;
  var totalTTC = Math.round((totalHT + totalTVA) * 100) / 100;

  // Mettre à jour les champs de totaux (IDs à adapter à ton HTML)
  var elTotalHT  = document.getElementById('total-ht');
  var elTotalTVA = document.getElementById('total-tva');
  var elTotalTTC = document.getElementById('total-ttc');
  var elDetailsTVA = document.getElementById('details-tva');

  if (elTotalHT)  elTotalHT.textContent  = formatMoney(totalHT);
  if (elTotalTVA) elTotalTVA.textContent = formatMoney(totalTVA);
  if (elTotalTTC) elTotalTTC.textContent = formatMoney(totalTTC);

  if (elDetailsTVA) {
    var htmlDetails = '';
    Object.keys(detailsTVA).sort().forEach(function(cle) {
      htmlDetails += '<div class="tva-detail-row"><span>TVA ' + cle + ' sur ' + formatMoney(detailsTVA[cle].ht) + ' HT</span><span>' + formatMoney(detailsTVA[cle].tva) + '</span></div>';
    });
    elDetailsTVA.innerHTML = htmlDetails;
  }

  return { totalHT: totalHT, totalTVA: totalTVA, totalTTC: totalTTC, detailsTVA: detailsTVA };
}

// --- Lire les données d'une ligne depuis le TR du DOM ---
function lireLigneDepuisTR(tr) {
  return {
    description:   (tr.querySelector('.ligne-desc') || {}).value || '',
    quantite:      parseFloat((tr.querySelector('.ligne-qty') || {}).value) || 0,
    prix_unitaire: parseFloat((tr.querySelector('.ligne-prix') || {}).value) || 0,
    remise_type:   (tr.querySelector('.ligne-remise-type') || {}).value || '',
    remise_valeur: parseFloat((tr.querySelector('.ligne-remise-val') || {}).value) || 0,
    taux_tva:      (tr.querySelector('.ligne-tva') || {}).value || 'standard'
  };
}

// --- Activer/désactiver le champ remise selon le type ---
function activerRemiseListeners(conteneur) {
  conteneur.addEventListener('change', function(e) {
    if (e.target.classList.contains('ligne-remise-type')) {
      var row = e.target.closest('tr');
      var valInput = row.querySelector('.ligne-remise-val');
      if (e.target.value === '') {
        valInput.value = '';
        valInput.disabled = true;
      } else {
        valInput.disabled = false;
        valInput.focus();
      }
      recalculerTotauxDocument(conteneur);
    }
    if (e.target.classList.contains('ligne-tva')) {
      recalculerTotauxDocument(conteneur);
    }
  });
  conteneur.addEventListener('input', function(e) {
    if (e.target.matches('.ligne-qty, .ligne-prix, .ligne-remise-val, .ligne-desc')) {
      recalculerTotauxDocument(conteneur);
    }
  });
}

// ===== FIN AJOUT =====
