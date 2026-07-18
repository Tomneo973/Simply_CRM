// js/app.js
/* === INIT === */
migratePjData();
document.getElementById('nav').addEventListener('click',e=>{const ni=e.target.closest('.ni');if(ni&&ni.dataset.p)nav(ni.dataset.p)});
document.getElementById('mbtn').addEventListener('click',()=>{document.getElementById('sb').classList.toggle('-translate-x-full');document.getElementById('sov').classList.toggle('hidden')});
document.getElementById('sov').addEventListener('click',()=>{document.getElementById('sb').classList.add('-translate-x-full');document.getElementById('sov').classList.add('hidden')});
document.getElementById('mclose').addEventListener('click',closeM);
document.getElementById('mover').addEventListener('click',e=>{if(e.target.id==='mover')closeM()});
document.getElementById('thtg').addEventListener('click',()=>{const isLight=document.documentElement.classList.toggle('light');try{localStorage.setItem('crm_theme',isLight?'light':'dark')}catch(e){}});
window.addEventListener('hashchange',handleHash);
handleHash();
// ===== DÉBUT AJOUT =====

// --- 1. Migration des données au démarrage ---
migrerDonnees();

// --- 2. Initialisation de la recherche globale ---
document.addEventListener('DOMContentLoaded', function() {
  GlobalSearch.init();
});

// --- 3. Délégation d'événements pour les paiements ---
document.addEventListener('click', function(e) {
  // Bouton ajouter paiement
  if (e.target.id === 'btn-ajouter-paiement' || e.target.closest('#btn-ajouter-paiement')) {
    var btn = e.target.id === 'btn-ajouter-paiement' ? e.target : e.target.closest('#btn-ajouter-paiement');
    var factureId = btn.getAttribute('data-facture-id');
    var montant = parseFloat(document.getElementById('paiement-montant').value) || 0;
    var date = document.getElementById('paiement-date').value;
    var methode = document.getElementById('paiement-methode').value;
    var ref = document.getElementById('paiement-ref').value;

    if (montant <= 0) {
      toast('Veuillez saisir un montant valide', 'error');
      return;
    }

    var ok = enregistrerPaiement(factureId, {
      date: date,
      montant: montant,
      methode: methode,
      reference: ref
    });

    if (ok) {
      // Recharger la vue de la facture
      var factures = getStored(STORAGE_KEYS.factures) || [];
      var facture = factures.find(function(f) { return f.id === factureId; });
      if (facture) {
        var section = document.querySelector('.section-paiements');
        if (section) {
          section.outerHTML = renderSectionPaiements(facture);
        }
        // Mettre à jour le statut affiché ailleurs si nécessaire
        var statutEl = document.getElementById('facture-statut');
        if (statutEl) statutEl.textContent = facture.statut;
      }
    }
  }

  // Bouton supprimer paiement
  if (e.target.classList.contains('btn-del-paiement')) {
    if (!confirm('Supprimer ce paiement ?')) return;
    var factureId = e.target.getAttribute('data-facture-id');
    var paiementId = e.target.getAttribute('data-paiement-id');
    supprimerPaiement(factureId, paiementId);

    // Recharger
    var factures = getStored(STORAGE_KEYS.factures) || [];
    var facture = factures.find(function(f) { return f.id === factureId; });
    if (facture) {
      var section = document.querySelector('.section-paiements');
      if (section) {
        section.outerHTML = renderSectionPaiements(facture);
      }
    }
  }
});

// --- 4. Délégation pour suppression de lignes de document ---
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('btn-suppr-ligne')) {
    var row = e.target.closest('tr.doc-ligne');
    if (row) {
      var conteneur = row.closest('tbody') || row.closest('table');
      row.remove();
      recalculerTotauxDocument(conteneur);
    }
  }
});

// ===== FIN AJOUT =====
