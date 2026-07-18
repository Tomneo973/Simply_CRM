/* === BILAN ANNUEL === */
function yrOf(d){return d?d.split('-')[0]:null}
function sumByDev(list,field){const o={};list.forEach(x=>{const d=x.devise||'CHF';o[d]=(o[d]||0)+(x[field]||0)});return o}
function fmMulti(o){const k=Object.keys(o);if(!k.length)return fm(0,gSt().devise||'CHF');return k.map(c=>fm(o[c],c)).join(' + ')}
function rBil(C){
  const fc=gd(K.fc),ac=gd(K.ac);
  const yrs=Array.from(new Set([...fc.map(f=>yrOf(f.date)),...ac.map(x=>yrOf(x.date))].filter(Boolean))).sort((a,b)=>b-a);
  if(!yrs.length){C.innerHTML='<div class="es"><i class="fas fa-chart-pie block"></i>Aucune donnee. Creez une facture ou un achat pour voir apparaitre un bilan annuel.</div>';return}
  C.innerHTML='<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">'+yrs.map(y=>{
    const fy=fc.filter(f=>yrOf(f.date)===y),ay=ac.filter(x=>yrOf(x.date)===y);
    const caByDev=sumByDev(fy,'totalTTC'),encByDev=sumByDev(fy.filter(f=>f.statut==='payee'),'totalTTC');
    const acht=ay.reduce((s,x)=>s+(parseFloat(x.montant)||0),0);
    const devDef=gSt().devise||'CHF';
    const netSingle=Object.keys(encByDev).length<=1?fm((encByDev[devDef]||Object.values(encByDev)[0]||0)-acht,Object.keys(encByDev)[0]||devDef):null;
    return'<div class="cd cursor-pointer hover:border-accent/30 transition-colors" onclick="nav(\'bilan\',{id:\''+y+'\'})"><div class="flex items-center justify-between mb-3"><h3 class="text-xl font-bold">'+y+'</h3><i class="fas fa-chevron-right text-muted"></i></div><div class="space-y-2 text-sm"><div class="flex justify-between gap-3"><span class="text-muted">Facture ('+fy.length+')</span><span class="font-medium text-right">'+fmMulti(caByDev)+'</span></div><div class="flex justify-between gap-3"><span class="text-muted">Encaisse</span><span class="font-medium text-success text-right">'+fmMulti(encByDev)+'</span></div><div class="flex justify-between"><span class="text-muted">Achats ('+ay.length+')</span><span class="font-medium text-danger">'+fm(acht,devDef)+'</span></div><div class="flex justify-between pt-2 border-t border-border"><span class="font-semibold">Resultat</span>'+(netSingle?'<span class="font-bold '+((encByDev[devDef]||0)-acht>=0?'text-success':'text-danger')+'">'+netSingle+'</span>':'<span class="text-xs text-muted">voir detail</span>')+'</div></div></div>';
  }).join('')+'</div>';
}
function rBilV(C,year){
  const fc=gd(K.fc).filter(f=>yrOf(f.date)===year),ac=gd(K.ac).filter(x=>yrOf(x.date)===year),cl=gd(K.cl);
  document.getElementById('ptitle').textContent='Bilan '+year;
  const htByDev=sumByDev(fc,'totalHT'),tvaByDev=sumByDev(fc,'totalTVA'),ttcByDev=sumByDev(fc,'totalTTC');
  const encByDev=sumByDev(fc.filter(f=>f.statut==='payee'),'totalTTC');
  const attByDev=sumByDev(fc.filter(f=>f.statut==='envoyee'||f.statut==='retard'),'totalTTC');
  const totAch=ac.reduce((s,x)=>s+(parseFloat(x.montant)||0),0),devDef=gSt().devise||'CHF';
  const multiDev=Object.keys(ttcByDev).length>1;
  const byCat={};ac.forEach(x=>{byCat[x.categorie]=(byCat[x.categorie]||0)+(parseFloat(x.montant)||0)});
  C.innerHTML='<button class="b bs mb-4" onclick="nav(\'bilan\')"><i class="fas fa-arrow-left"></i> Retour</button><div class="flex flex-wrap gap-2 mb-4"><button class="b bs" onclick="expFacturesCSV(\''+year+'-01-01\',\''+year+'-12-31\')"><i class="fas fa-file-csv"></i> Export factures '+year+'</button><button class="b bs" onclick="expAchatsCSV(\''+year+'-01-01\',\''+year+'-12-31\')"><i class="fas fa-file-csv"></i> Export achats '+year+'</button></div>'
    +(multiDev?'<div class="cd mb-4 text-sm text-muted"><i class="fas fa-circle-info mr-1"></i>Plusieurs devises detectees cette annee : les totaux sont detailles par devise (aucun mélange CHF/EUR).</div>':'')
    +'<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"><div class="sc bl"><div class="text-muted text-xs font-semibold uppercase tracking-wider mb-1">CA facture HT</div><div class="text-xl font-bold text-fg">'+fmMulti(htByDev)+'</div></div><div class="sc g"><div class="text-muted text-xs font-semibold uppercase tracking-wider mb-1">Encaisse</div><div class="text-xl font-bold text-fg">'+fmMulti(encByDev)+'</div></div><div class="sc r"><div class="text-muted text-xs font-semibold uppercase tracking-wider mb-1">Achats / charges</div><div class="text-xl font-bold text-fg">'+fm(totAch,devDef)+'</div></div><div class="sc a"><div class="text-muted text-xs font-semibold uppercase tracking-wider mb-1">Resultat (encaisse - achats)</div><div class="text-xl font-bold '+((encByDev[devDef]||0)-totAch>=0?'text-success':'text-danger')+'">'+fm((encByDev[devDef]||Object.values(encByDev)[0]||0)-totAch,Object.keys(encByDev)[0]||devDef)+(multiDev?' <span class="text-xs font-normal text-muted">(devise principale uniquement)</span>':'')+'</div></div></div><div class="grid grid-cols-1 lg:grid-cols-2 gap-6"><div class="cd"><h3 class="font-semibold mb-4">Factures '+year+' ('+fc.length+')</h3>'+(fc.length?'<table><thead><tr><th>Numero</th><th>Client</th><th>Date</th><th class="text-right">TTC</th><th>Statut</th></tr></thead><tbody>'+fc.map(f=>{const c=cl.find(x=>x.id===f.clientId);return'<tr class="cursor-pointer" onclick="nav(\'factures\',{id:\''+f.id+'\'})"><td class="font-mono text-accent text-xs">'+f.numero+'</td><td>'+(c?.nom||'-')+'</td><td class="text-muted text-sm">'+fd(f.date)+'</td><td class="text-right">'+fm(f.totalTTC,f.devise)+'</td><td>'+bsg(f.statut,'facture')+'</td></tr>'}).join('')+'</tbody></table>':'<p class="text-muted text-sm">Aucune facture cette annee</p>')+'<div class="mt-4 pt-4 border-t border-border text-sm space-y-1"><div class="flex justify-between gap-3"><span class="text-muted">Total TVA</span><span class="text-right">'+fmMulti(tvaByDev)+'</span></div><div class="flex justify-between gap-3"><span class="text-muted">Total TTC</span><span class="text-right">'+fmMulti(ttcByDev)+'</span></div><div class="flex justify-between gap-3"><span class="text-muted">Encaisse</span><span class="text-right">'+fmMulti(encByDev)+'</span></div><div class="flex justify-between gap-3"><span class="text-muted">En attente</span><span class="text-right">'+fmMulti(attByDev)+'</span></div></div></div><div class="cd"><h3 class="font-semibold mb-4">Achats '+year+' ('+ac.length+')</h3>'+(ac.length?'<table><thead><tr><th>Date</th><th>Categorie</th><th>Libelle</th><th class="text-right">Montant</th></tr></thead><tbody>'+ac.map(x=>'<tr><td class="text-muted text-sm">'+fd(x.date)+'</td><td><span class="badge bdr">'+(acCat[x.categorie]||x.categorie)+'</span></td><td>'+(x.libelle||'-')+'</td><td class="text-right">'+fm(x.montant,devDef)+'</td></tr>').join('')+'</tbody></table>':'<p class="text-muted text-sm">Aucun achat cette annee</p>')+'<div class="mt-4 pt-4 border-t border-border text-sm space-y-1">'+Object.entries(byCat).map(([k,v])=>'<div class="flex justify-between"><span class="text-muted">'+(acCat[k]||k)+'</span><span>'+fm(v,devDef)+'</span></div>').join('')+'<div class="flex justify-between font-semibold pt-1"><span>Total</span><span>'+fm(totAch,devDef)+'</span></div></div></div></div>';
}
// ===== DÉBUT AJOUT =====

// --- HTML de la section TVA AFC ---
function renderSectionTVA(dateDebut, dateFin) {
  var collectee = getTVACollectee(dateDebut, dateFin);
  var deductible = getTVADeductible(dateDebut, dateFin);
  var nette = Math.round((collectee - deductible) * 100) / 100;

  var couleur = nette >= 0 ? '#27ae60' : '#e74c3c';
  var label = nette >= 0 ? 'TVA à reverser à l\'AFC' : 'Crédit de TVA';

  return '<div class="section-tva" style="margin-top:24px;padding:20px;border:2px solid ' + couleur + ';border-radius:8px;background:var(--card-bg)">' +
    '<h3 style="margin-top:0;color:' + couleur + '">🏛️ Déclaration TVA — Période du ' + formatDate(dateDebut) + ' au ' + formatDate(dateFin) + '</h3>' +
    '<table style="width:100%;border-collapse:collapse">' +
      '<tr style="border-bottom:1px solid var(--border)">' +
        '<td style="padding:10px"><strong>TVA collectée (ventes)</strong></td>' +
        '<td style="padding:10px;text-align:right;font-weight:600">' + formatMoney(collectee) + '</td>' +
      '</tr>' +
      '<tr style="border-bottom:1px solid var(--border)">' +
        '<td style="padding:10px"><strong>TVA déductible (achats)</strong></td>' +
        '<td style="padding:10px;text-align:right;font-weight:600;color:#e74c3c">- ' + formatMoney(deductible) + '</td>' +
      '</tr>' +
      '<tr>' +
        '<td style="padding:12px;font-size:1.1em"><strong>' + label + '</strong></td>' +
        '<td style="padding:12px;text-align:right;font-size:1.3em;font-weight:700;color:' + couleur + '">' + formatMoney(Math.abs(nette)) + '</td>' +
      '</tr>' +
    '</table>' +
    '<p style="margin:12px 0 0;font-size:0.85em;color:var(--text-muted)">⚠️ Ce calcul est indicatif. Vérifiez avec votre comptable ou votre décompte AFC officiel.</p>' +
  '</div>';
}

// --- Détail TVA par taux ---
function renderDetailTVAParTaux(dateDebut, dateFin) {
  var factures = getStored(STORAGE_KEYS.factures) || [];
  var achats = getStored(STORAGE_KEYS.achats) || [];
  var d1 = new Date(dateDebut);
  var d2 = new Date(dateFin);
  d2.setHours(23, 59, 59, 999);

  var details = {};

  // Collectée
  factures.forEach(function(f) {
    if (f.statut === 'Annulee') return;
    var fDate = new Date(f.date);
    if (fDate < d1 || fDate > d2) return;
    (f.lignes || []).forEach(function(l) {
      var taux = parseFloat(TAUX_TVA[l.taux_tva || 'standard']) || 0;
      var ht = calculerHTLigne(l);
      var cle = taux + '%';
      if (!details[cle]) details[cle] = { collectee_ht: 0, collectee_tva: 0, deductible_ht: 0, deductible_tva: 0 };
      details[cle].collectee_ht += ht;
      details[cle].collectee_tva += ht * taux / 100;
    });
  });

  // Déductible
  achats.forEach(function(a) {
    var aDate = new Date(a.date);
    if (aDate < d1 || aDate > d2) return;
    (a.lignes || []).forEach(function(l) {
      var taux = parseFloat(TAUX_TVA[l.taux_tva || 'standard']) || 0;
      var ht = calculerHTLigne(l);
      var cle = taux + '%';
      if (!details[cle]) details[cle] = { collectee_ht: 0, collectee_tva: 0, deductible_ht: 0, deductible_tva: 0 };
      details[cle].deductible_ht += ht;
      details[cle].deductible_tva += ht * taux / 100;
    });
  });

  var html = '<div class="detail-tva-taux" style="margin-top:16px">' +
    '<h4>Détail par taux de TVA</h4>' +
    '<table style="width:100%;border-collapse:collapse;font-size:0.9em">' +
    '<thead><tr style="border-bottom:2px solid var(--border);text-align:right">' +
      '<th style="text-align:left;padding:8px">Taux</th>' +
      '<th style="padding:8px">HT Collectée</th><th style="padding:8px">TVA Collectée</th>' +
      '<th style="padding:8px">HT Déductible</th><th style="padding:8px">TVA Déductible</th>' +
      '<th style="padding:8px">Solde TVA</th>' +
    '</tr></thead><tbody>';

  Object.keys(details).sort(function(a, b) { return parseFloat(b) - parseFloat(a); }).forEach(function(cle) {
    var d = details[cle];
    d.collectee_ht  = Math.round(d.collectee_ht  * 100) / 100;
    d.collectee_tva = Math.round(d.collectee_tva * 100) / 100;
    d.deductible_ht  = Math.round(d.deductible_ht  * 100) / 100;
    d.deductible_tva = Math.round(d.deductible_t
