// js/modules/dashboard.js
/* === DASHBOARD === */
function rDash(C){
  const cl=gd(K.cl),dv=gd(K.dv),fc=gd(K.fc),pj=gd(K.pj);
  const ca=fc.filter(f=>f.statut==='payee').reduce((s,f)=>s+(f.totalTTC||0),0);
  const pts=pj.flatMap(p=>p.etapes).filter(e=>e.statut==='en_attente').length;
  if(!cl.length&&!dv.length&&!fc.length){C.innerHTML='<div class="max-w-lg mx-auto text-center py-20"><div class="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6"><i class="fas fa-bolt text-accent text-3xl"></i></div><h2 class="text-2xl font-bold mb-3">Bienvenue</h2><p class="text-muted mb-8">Creez votre premier client ou chargez des donnees existantes.</p><div class="flex flex-col sm:flex-row gap-3 justify-center"><button class="b bp" onclick="nav(\'clients\')"><i class="fas fa-plus"></i> Creer un client</button><button class="b bs" onclick="FS.load()"><i class="fas fa-folder-open"></i> Charger des donnees</button></div></div>';return}
  C.innerHTML='<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"><div class="sc a"><div class="text-muted text-xs font-semibold uppercase tracking-wider mb-1">Clients</div><div class="text-3xl font-bold text-fg">'+cl.length+'</div></div><div class="sc bl"><div class="text-muted text-xs font-semibold uppercase tracking-wider mb-1">Devis en attente</div><div class="text-3xl font-bold text-fg">'+dv.filter(d=>d.statut==='envoye').length+'</div></div><div class="sc r"><div class="text-muted text-xs font-semibold uppercase tracking-wider mb-1">Factures impayees</div><div class="text-3xl font-bold text-fg">'+fc.filter(f=>f.statut==='envoyee'||f.statut==='retard').length+'</div></div><div class="sc g"><div class="text-muted text-xs font-semibold uppercase tracking-wider mb-1">CA encaisse</div><div class="text-3xl font-bold text-fg">'+fm(ca)+'</div></div></div><div class="grid grid-cols-1 lg:grid-cols-2 gap-6"><div class="cd"><div class="flex items-center justify-between mb-4"><h3 class="font-semibold">Derniers devis</h3><button class="b bs sm" onclick="nav(\'devis\')"><i class="fas fa-plus"></i></button></div>'+(dv.length?'<table><thead><tr><th>Numero</th><th>Client</th><th>Montant</th><th>Statut</th></tr></thead><tbody>'+dv.slice(-5).reverse().map(d=>{const c=cl.find(x=>x.id===d.clientId);return'<tr class="cursor-pointer" onclick="nav(\'devis\',{id:\''+d.id+'\'})"><td class="font-mono text-accent text-xs">'+d.numero+'</td><td>'+(c?.nom||'-')+'</td><td>'+fm(d.totalTTC)+'</td><td>'+bsg(d.statut,'devis')+'</td></tr>'}).join('')+'</tbody></table>':'<div class="es"><i class="fas fa-file-invoice block"></i>Aucun devis</div>')+'</div><div class="cd"><div class="flex items-center justify-between mb-4"><h3 class="font-semibold">Etapes a valider</h3><button class="b bs sm" onclick="nav(\'projets\')"><i class="fas fa-eye"></i></button></div>'+(pts?'<div class="space-y-3">'+pj.flatMap(p=>p.etapes.filter(e=>e.statut==='en_attente').map(e=>({e,p}))).slice(0,5).map(({e,p})=>'<div class="flex items-center justify-between p-3 bg-surface2 rounded-lg"><div><div class="text-sm font-medium">'+e.nom+'</div><div class="text-xs text-muted">'+p.nom+'</div></div><span class="badge bw">A valider</span></div>').join('')+'</div>':'<div class="es"><i class="fas fa-check-double block"></i>Tout valide !</div>')+'</div></div>';
// ===== DÉBUT AJOUT =====

// --- Widget : Factures en retard ---
function renderWidgetRelances() {
  var enRetard = getFacturesEnRetard();
  var totalRetard = enRetard.reduce(function(acc, f) { return acc + calculerSolde(f); }, 0);
  totalRetard = Math.round(totalRetard * 100) / 100;

  var html = '<div class="dash-widget dash-relances" style="padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--card-bg)">' +
    '<h3 style="margin-top:0;display:flex;align-items:center;gap:8px">' +
      '<span style="font-size:1.3em">🔴</span> Factures en retard' +
      (enRetard.length > 0 ? '<span style="background:#e74c3c;color:#fff;border-radius:12px;padding:2px 10px;font-size:0.8em;margin-left:auto">' + enRetard.length + '</span>' : '') +
    '</h3>';

  if (enRetard.length === 0) {
    html += '<p style="color:var(--text-muted);margin:0">✅ Aucune facture en retard.</p>';
  } else {
    html += '<p style="margin:0 0 12px;color:#e74c3c;font-weight:700;font-size:1.1em">Total : ' + formatMoney(totalRetard) + '</p>';
    html += '<div style="max-height:200px;overflow-y:auto">';
    enRetard.sort(function(a, b) { return new Date(a.date_echeance) - new Date(b.date_echeance); });
    enRetard.slice(0, 10).forEach(function(f) {
      var client = (getStored(STORAGE_KEYS.clients) || []).find(function(c) { return c.id === f.client_id; });
      var nomClient = client ? (client.entreprise || client.prenom + ' ' + client.nom) : 'Client inconnu';
      var joursRetard = Math.floor((new Date() - new Date(f.date_echeance)) / 86400000);
      html += '<a href="#factures/' + f.id + '" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);text-decoration:none;color:inherit">' +
        '<div><strong>' + escapeHtml(f.numero) + '</strong><br><small style="color:var(--text-muted)">' + escapeHtml(nomClient) + '</small></div>' +
        '<div style="text-align:right"><strong style="color:#e74c3c">' + formatMoney(calculerSolde(f)) + '</strong><br><small style="color:#e74c3c">' + joursRetard + 'j de retard</small></div>' +
      '</a>';
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// --- Widget : Tâches et projets en cours ---
function renderWidgetTaches() {
  var projets = getStored(STORAGE_KEYS.retroplanning) || [];
  var devis = getStored(STORAGE_KEYS.devis) || [];

  // Projets en cours
  var projetsEnCours = projets.filter(function(p) {
    return p.statut === 'En cours' || p.statut === 'En attente';
  });

  // Devis en attente de validation
  var devisEnAttente = devis.filter(function(d) {
    return d.statut === 'Brouillon' || d.statut === 'Envoye';
  });

  var totalItems = projetsEnCours.length + devisEnAttente.length;

  var html = '<div class="dash-widget dash-taches" style="padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--card-bg)">' +
    '<h3 style="margin-top:0;display:flex;align-items:center;gap:8px">' +
      '<span style="font-size:1.3em">📋</span> En attente' +
      (totalItems > 0 ? '<span style="background:#f39c12;color:#fff;border-radius:12px;padding:2px 10px;font-size:0.8em;margin-left:auto">' + totalItems + '</span>' : '') +
    '</h3>';

  if (totalItems === 0) {
    html += '<p style="color:var(--text-muted);margin:0">✅ Rien en attente.</p>';
  } else {
    html += '<div style="max-height:250px;overflow-y:auto">';

    // Devis en attente
    if (devisEnAttente.length > 0) {
      html += '<div style="margin-bottom:12px"><strong style="font-size:0.85em;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Devis (' + devisEnAttente.length + ')</strong>';
      devisEnAttente.slice(0, 5).forEach(function(d) {
        var client = (getStored(STORAGE_KEYS.clients) || []).find(function(c) { return c.id === d.client_id; });
        var nomClient = client ? (client.entreprise || client.prenom + ' ' + client.nom) : '';
        var statutColor = d.statut === 'Envoye' ? '#f39c12' : '#95a5a6';
        html += '<a href="#devis/' + d.id + '" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);text-decoration:none;color:inherit">' +
          '<div><strong>' + escapeHtml(d.numero) + '</strong> <small style="color:var(--text-muted)">' + escapeHtml(nomClient) + '</small></div>' +
          '<span style="color:' + statutColor + ';font-size:0.8em;font-weight:600">' + escapeHtml(d.statut) + '</span>' +
        '</a>';
      });
      html += '</div>';
    }

    // Projets en cours
    if (projetsEnCours.length > 0) {
      html += '<div><strong style="font-size:0.85em;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Projets (' + projetsEnCours.length + ')</strong>';
      projetsEnCours.slice(0, 5).forEach(function(p) {
        var statutColor = p.statut === 'En cours' ? '#3498db' : '#f39c12';
        html += '<a href="#retroplanning" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);text-decoration:none;color:inherit">' +
          '<div><strong>' + escapeHtml(p.nom) + '</strong>' + (p.client_nom ? ' <small style="color:var(--text-muted)">' + escapeHtml(p.client_nom) + '</small>' : '') + '</div>' +
          '<span style="color:' + statutColor + ';font-size:0.8em;font-weight:600">' + escapeHtml(p.statut) + '</span>' +
        '</a>';
      });
      html += '</div>';
    }

    html += '</div>';
  }

  html += '</div>';
  return html;
}

// --- Widget : Prochaines échéances ---
function renderWidgetEcheances() {
  var factures = getStored(STORAGE_KEYS.factures) || [];
  var aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  var dans30jours = new Date(aujourdhui);
  dans30jours.setDate(dans30jours.getDate() + 30);

  var aEcheance = factures.filter(function(f) {
    if (f.statut === 'Annulee' || f.statut === 'Payee') return false;
    var solde = calculerSolde(f);
    if (solde <= 0) return false;
    var ech = new Date(f.date_echeance);
    return ech >= aujourdhui && ech <= dans30jours;
  }).sort(function(a, b) { return new Date(a.date_echeance) - new Date(b.date_echeance); });

  if (aEcheance.length === 0) return '';

  var html = '<div class="dash-widget dash-echeances" style="padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--card-bg)">' +
    '<h3 style="margin-top:0"><span style="font-size:1.3em">⏰</span> Échéances dans 30 jours</h3>' +
    '<div style="max-height:200px;overflow-y:auto">';

  aEcheance.forEach(function(f) {
    var client = (getStored(STORAGE_KEYS.clients) || []).find(function(c) { return c.id === f.client_id; });
    var nomClient = client ? (client.entreprise || client.prenom + ' ' + client.nom) : '';
    var joursRestants = Math.ceil((new Date(f.date_echeance) - aujourdhui) / 86400000);
    var urgence = joursRestants <= 7 ? '#e74c3c' : (joursRestants <= 14 ? '#f39c12' : '#27ae60');

    html += '<a href="#factures/' + f.id + '" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);text-decoration:none;color:inherit">' +
      '<div><strong>' + escapeHtml(f.numero) + '</strong><br><small style="color:var(--text-muted)">' + escapeHtml(nomClient) + '</small></div>' +
      '<div style="text-align:right"><strong>' + formatMoney(calculerSolde(f)) + '</strong><br><small style="color:' + urgence + ';font-weight:600">' + formatDate(f.date_echeance) + ' (' + joursRestants + 'j)</small></div>' +
    '</a>';
  });

  html += '</div></div>';
  return html;
}

// ===== FIN AJOUT =====

}

