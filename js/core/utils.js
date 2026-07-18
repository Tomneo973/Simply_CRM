// js/core/utils.js
const K={cl:'crm_cl',dv:'crm_dv',fc:'crm_fc',pj:'crm_pj',rt:'crm_rt',vl:'crm_vl',sg:'crm_sg',st:'crm_st',ac:'crm_ac'};
const uid=()=>Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
const gd=k=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch(e){return[]}};
const sd=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const gs=k=>{try{return JSON.parse(localStorage.getItem(k))||{}}catch(e){return{}}};
const ss=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const gSt=()=>gs(K.st);
const fm=(n,c)=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:c||'EUR'}).format(n||0);
const fm2=n=>new Intl.NumberFormat('fr-CH',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);
const fd=d=>{if(!d)return'-';const p=d.split('-');return p[2]+'/'+p[1]+'/'+p[0]};
const td=()=>new Date().toISOString().split('T')[0];
const nn=(px,a,f)=>{const y=new Date().getFullYear();const mx=Math.max(0,...a.filter(i=>(i[f]||'').includes(px+y)).map(i=>{const m=(i[f]||'').split('-');return parseInt(m[m.length-1])||0}));return px+y+'-'+String(mx+1).padStart(3,'0')};
const bsg=(s,t)=>{const m={devis:{brouillon:'bdr',envoye:'bi',accepte:'bo',refuse:'bk'},facture:{brouillon:'bdr',envoyee:'bi',payee:'bo',retard:'bk'}};const l={brouillon:'Brouillon',envoye:'Envoye',envoyee:'Envoyee',accepte:'Accepte',refuse:'Refuse',payee:'Payee',retard:'En retard'};return'<span class="badge '+(m[t]?.[s]||'bdr')+'">'+(l[s]||s)+'</span>'};
const tvxOf=it=>{if(it.tauxTVA!=null&&it.tauxTVA!=='')return parseFloat(it.tauxTVA);if(it.totalHT)return Math.round(it.totalTVA/it.totalHT*10000)/100;return gSt().tva||20};
// ===== DÉBUT AJOUT =====

// --- Constantes TVA Suisse ---
var TAUX_TVA = {
  'standard': 8.1,
  'reduit': 3.8,
  'special': 2.5,
  'exempt': 0
};

// --- Clés de stockage supplémentaires ---
STORAGE_KEYS.relances      = 'relances';
STORAGE_KEYS.rechercheIndex = 'recherche_index';

// --- Calcul du solde restant d'une facture ---
function calculerSolde(facture) {
  if (!facture) return 0;
  var total = facture.total || 0;
  var paiements = facture.paiements || [];
  var totalPaye = paiements.reduce(function(acc, p) {
    return acc + (parseFloat(p.montant) || 0);
  }, 0);
  return Math.max(0, total - totalPaye);
}

// --- Statut de paiement dérivé ---
function getStatutPaiement(facture) {
  var solde = calculerSolde(facture);
  var total = facture.total || 0;
  if (total === 0) return 'zero';
  if (solde === 0) return 'payee';
  if (solde < total) return 'partielle';
  return 'impayee';
}

// --- Factures en retard ---
function getFacturesEnRetard() {
  var factures = getStored(STORAGE_KEYS.factures) || [];
  var aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  return factures.filter(function(f) {
    if (f.statut === 'Annulee') return false;
    var solde = calculerSolde(f);
    if (solde <= 0) return false;
    var echeance = f.date_echeance ? new Date(f.date_echeance) : null;
    if (!echeance) return false;
    echeance.setHours(0, 0, 0, 0);
    return echeance < aujourdhui;
  });
}

// --- TVA collectée sur une période ---
function getTVACollectee(dateDebut, dateFin) {
  var factures = getStored(STORAGE_KEYS.factures) || [];
  var d1 = new Date(dateDebut);
  var d2 = new Date(dateFin);
  d2.setHours(23, 59, 59, 999);

  var totalTVA = 0;
  factures.forEach(function(f) {
    if (f.statut === 'Annulee') return;
    var fDate = new Date(f.date);
    if (fDate >= d1 && fDate <= d2) {
      (f.lignes || []).forEach(function(l) {
        var taux = parseFloat(l.taux_tva) || 0;
        var ht = (parseFloat(l.quantite) || 0) * (parseFloat(l.prix_unitaire) || 0);
        // Appliquer remise ligne si présente
        if (l.remise_type === 'pourcentage' && l.remise_valeur) {
          ht = ht * (1 - (parseFloat(l.remise_valeur) || 0) / 100);
        } else if (l.remise_type === 'montant' && l.remise_valeur) {
          ht = Math.max(0, ht - (parseFloat(l.remise_valeur) || 0));
        }
        totalTVA += ht * (taux / 100);
      });
    }
  });
  return Math.round(totalTVA * 100) / 100;
}

// --- TVA déductible sur une période ---
function getTVADeductible(dateDebut, dateFin) {
  var achats = getStored(STORAGE_KEYS.achats) || [];
  var d1 = new Date(dateDebut);
  var d2 = new Date(dateFin);
  d2.setHours(23, 59, 59, 999);

  var totalTVA = 0;
  achats.forEach(function(a) {
    var aDate = new Date(a.date);
    if (aDate >= d1 && aDate <= d2) {
      (a.lignes || []).forEach(function(l) {
        var taux = parseFloat(l.taux_tva) || 0;
        var ht = (parseFloat(l.quantite) || 0) * (parseFloat(l.prix_unitaire) || 0);
        if (l.remise_type === 'pourcentage' && l.remise_valeur) {
          ht = ht * (1 - (parseFloat(l.remise_valeur) || 0) / 100);
        } else if (l.remise_type === 'montant' && l.remise_valeur) {
          ht = Math.max(0, ht - (parseFloat(l.remise_valeur) || 0));
        }
        totalTVA += ht * (taux / 100);
      });
    }
  });
  return Math.round(totalTVA * 100) / 100;
}

// --- TVA nette à reverser ---
function getTVAReverser(dateDebut, dateFin) {
  return Math.round((getTVACollectee(dateDebut, dateFin) - getTVADeductible(dateDebut, dateFin)) * 100) / 100;
}

// --- Migration automatique des données existantes ---
function migrerDonnees() {
  var version = getStored('data_version');
  if (version === '2') return; // Déjà migré

  // Migrer les factures : ajouter champ paiements + date_echeance
  var factures = getStored(STORAGE_KEYS.factures) || [];
  var modifie = false;
  factures.forEach(function(f) {
    if (!f.paiements) {
      f.paiements = [];
      modifie = true;
    }
    if (!f.date_echeance) {
      // Par défaut : 30 jours après la date de facture
      var d = new Date(f.date);
      d.setDate(d.getDate() + 30);
      f.date_echeance = d.toISOString().split('T')[0];
      modifie = true;
    }
  });
  if (modifie) setStored(STORAGE_KEYS.factures, factures);

  // Migrer les lignes : ajouter champs remise et taux_tva explicite
  [STORAGE_KEYS.factures, STORAGE_KEYS.devis, STORAGE_KEYS.achats].forEach(function(key) {
    var docs = getStored(key) || [];
    var m = false;
    docs.forEach(function(doc) {
      (doc.lignes || []).forEach(function(l) {
        if (l.remise_type === undefined) { l.remise_type = ''; m = true; }
        if (l.remise_valeur === undefined) { l.remise_valeur = ''; m = true; }
        if (l.taux_tva === undefined) { l.taux_tva = 'standard'; m = true; }
      });
    });
    if (m) setStored(key, docs);
  });

  setStored('data_version', '2');
}

// ===== FIN AJOUT =====
