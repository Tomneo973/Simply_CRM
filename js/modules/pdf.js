/* === PDF === */
async function expPdf(type,id){
  const item=gd(type==='devis'?K.dv:K.fc).find(x=>x.id===id);if(!item)return;
  const cl=gd(K.cl).find(x=>x.id===item.clientId),sg=gs(K.sg),st=gSt();
  const lbl=type==='devis'?'DEVIS':'FACTURE';
  const extra=type==='devis'?'Valide jusqu\'au '+fd(item.dateValidite):'Echeance : '+fd(item.dateEcheance);
  const html='<div style="width:800px;padding:50px;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;background:#fff"><div style="display:flex;justify-content:space-between;margin-bottom:40px"><div>'+(st.logo?'<img src="'+st.logo+'" style="max-height:60px;max-width:220px;object-fit:contain;margin-bottom:10px;display:block">':'')+'<div style="font-size:24px;font-weight:700;color:#0C0E14">'+(st.nom||'')+'</div><div style="font-size:12px;color:#666;margin-top:6px;line-height:1.6">'+(st.adresse||'')+'<br>'+(st.email||'')+(st.tel?' - '+st.tel:'')+(st.siret?'<br>SIRET : '+st.siret:'')+'</div></div><div style="text-align:right"><div style="font-size:32px;font-weight:700;color:#E8A832;letter-spacing:2px">'+lbl+'</div><div style="font-size:14px;font-weight:600;margin-top:8px">'+item.numero+'</div><div style="font-size:12px;color:#666;margin-top:4px">'+fd(item.date)+'</div><div style="font-size:12px;color:#666">'+extra+'</div></div></div><div style="background:#f8f7f4;border-radius:10px;padding:20px;margin-bottom:30px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:6px">Client</div><div style="font-size:16px;font-weight:600">'+(cl?.nom||'-')+'</div><div style="font-size:12px;color:#666;line-height:1.6">'+(cl?.entreprise||'')+'<br>'+(cl?.adresse||'')+'<br>'+(cl?.email||'')+'</div></div><table style="width:100%;border-collapse:collapse;margin-bottom:24px"><thead><tr style="border-bottom:2px solid #E8A832"><th style="text-align:left;padding:10px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999">Description</th><th style="text-align:right;padding:10px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;width:60px">Qte</th><th style="text-align:right;padding:10px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;width:100px">Prix unit.</th><th style="text-align:right;padding:10px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;width:100px">Total</th></tr></thead><tbody>'+item.lignes.map(l=>'<tr style="border-bottom:1px solid #eee"><td style="padding:12px 0;font-size:13px">'+l.description+'</td><td style="padding:12px 0;font-size:13px;text-align:right">'+l.quantite+'</td><td style="padding:12px 0;font-size:13px;text-align:right">'+fm(l.prixUnitaire,item.devise)+'</td><td style="padding:12px 0;font-size:13px;text-align:right;font-weight:600">'+fm(l.total,item.devise)+'</td></tr>').join('')+'</tbody></table><div style="display:flex;justify-content:flex-end"><div style="width:250px"><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#666"><span>HT</span><span>'+fm(item.totalHT,item.devise)+'</span></div><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#666"><span>TVA ('+tvxOf(item)+'%)</span><span>'+fm(item.totalTVA,item.devise)+'</span></div><div style="display:flex;justify-content:space-between;padding:10px 0;font-size:18px;font-weight:700;border-top:2px solid #E8A832;margin-top:6px;color:#0C0E14"><span>Total TTC</span><span style="color:#E8A832">'+fm(item.totalTTC,item.devise)+'</span></div></div></div>'+(sg[item.clientId]?'<div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:10px">Signature</div><img src="'+sg[item.clientId]+'" style="height:70px;background:#f8f7f4;padding:8px;border-radius:6px"></div>':'')+(item.notes?'<div style="margin-top:20px;padding:14px;background:#f8f7f4;border-radius:8px;font-size:12px;color:#666">'+item.notes+'</div>':'')+'<div style="margin-top:40px;text-align:center;font-size:10px;color:#bbb">'+(st.nom||'')+'</div></div>';
  if(!window.html2canvas||!window.jspdf){toast('PDF indisponible : bibliotheques non chargees (verifiez la connexion internet)','error');return}
  const ct=document.createElement('div');ct.innerHTML=html;ct.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(ct);
  const qrOn=st.qrEnabled!==false;
  const qrHtml=(qrOn&&st.iban)?qrBillHTML(item,type,cl,st):null;
  let ctQr=null;
  if(qrHtml){ctQr=document.createElement('div');ctQr.innerHTML=qrHtml;ctQr.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(ctQr)}
  try{
    toast('Generation PDF...','info');
    const canvas=await html2canvas(ct.firstElementChild,{scale:2,useCORS:true,backgroundColor:'#fff'});
    const img=canvas.toDataURL('image/jpeg',0.95);
    const{jsPDF}=window.jspdf;const pdf=new jsPDF('p','mm','a4');
    const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();
    const iw=pw-20,ih=canvas.height*iw/canvas.width;
    let y=10,hl=ih;pdf.addImage(img,'JPEG',10,y,iw,ih);hl-=(ph-20);
    while(hl>0){y=hl-ih+10;pdf.addPage();pdf.addImage(img,'JPEG',10,y,iw,ih);hl-=(ph-20)}
    if(ctQr){
      const qrCanvas=await html2canvas(ctQr.firstElementChild,{scale:3,useCORS:true,backgroundColor:'#fff'});
      const qrImg=qrCanvas.toDataURL('image/jpeg',0.98);
      pdf.addPage();
      pdf.addImage(qrImg,'JPEG',0,ph-105,pw,105);
    }else if(type==='facture'&&qrOn&&!st.iban){
      toast('QR-facture non incluse : configurez vos coordonnees bancaires dans Parametres','info');
    }
    pdf.save(item.numero+'.pdf');
    toast('PDF exporte','success');
  }catch(e){toast('Erreur PDF','error');console.error(e)}
  finally{document.body.removeChild(ct);if(ctQr)document.body.removeChild(ctQr)}
}

// ===== DÉBUT AJOUT =====

// --- Export PDF du Bilan comptable ---
function exporterBilanPDF(dateDebut, dateFin) {
  // Récupérer les données du bilan
  var factures = getStored(STORAGE_KEYS.factures) || [];
  var achats = getStored(STORAGE_KEYS.achats) || [];
  var d1 = new Date(dateDebut);
  var d2 = new Date(dateFin);
  d2.setHours(23, 59, 59, 999);

  // Calculs
  var totalVentes = 0, totalAchats = 0;
  factures.forEach(function(f) {
    if (f.statut === 'Annulee') return;
    var fDate = new Date(f.date);
    if (fDate >= d1 && fDate <= d2) totalVentes += (f.total_ttc || f.total || 0);
  });
  achats.forEach(function(a) {
    var aDate = new Date(a.date);
    if (aDate >= d1 && aDate <= d2) totalAchats += (a.total_ttc || a.total || 0);
  });

  var tvaCollectee = getTVACollectee(dateDebut, dateFin);
  var tvaDeductible = getTVADeductible(dateDebut, dateFin);
  var tvaNette = Math.round((tvaCollectee - tvaDeductible) * 100) / 100;
  var resultat = Math.round((totalVentes - totalAchats) * 100) / 100;

  // Construire le contenu HTML pour le PDF
  // Adapter 'genererPDF' au nom de ta fonction existante dans ce fichier
  var contenu = '<div style="font-family:Helvetica,Arial,sans-serif;padding:40px;max-width:800px;margin:auto">' +
    '<h1 style="text-align:center;border-bottom:2px solid #333;padding-bottom:10px">Bilan Comptable</h1>' +
    '<p style="text-align:center;color:#666">Période du ' + formatDate(dateDebut) + ' au ' + formatDate(dateFin) + '</p>' +
    '<p style="text-align:right;color:#999;font-size:0.85em">Généré le ' + formatDate(new Date().toISOString().split('T')[0]) + '</p>' +

    '<h2 style="margin-top:30px;color:#333">Résumé</h2>' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
      '<tr style="border-bottom:1px solid #ddd"><td style="padding:10px;font-weight:bold">Total ventes (TTC)</td><td style="padding:10px;text-align:right;font-weight:bold">' + formatMoney(totalVentes) + '</td></tr>' +
      '<tr style="border-bottom:1px solid #ddd"><td style="padding:10px;font-weight:bold">Total achats (TTC)</td><td style="padding:10px;text-align:right;font-weight:bold;color:#e74c3c">- ' + formatMoney(totalAchats) + '</td></tr>' +
      '<tr style="background:#f5f5f5"><td style="padding:12px;font-weight:bold;font-size:1.1em">Résultat de la période</td><td style="padding:12px;text-align:right;font-weight:bold;font-size:1.2em;color:' + (resultat >= 0 ? '#27ae60' : '#e74c3c') + '">' + formatMoney(resultat) + '</td></tr>' +
    '</table>' +

    '<h2 style="margin-top:30px;color:#333">Déclaration TVA (AFC)</h2>' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
      '<tr style="border-bottom:1px solid #ddd"><td style="padding:10px">TVA collectée</td><td style="padding:10px;text-align:right">' + formatMoney(tvaCollectee) + '</td></tr>' +
      '<tr style="border-bottom:1px solid #ddd"><td style="padding:10px">TVA déductible</td><td style="padding:10px;text-align:right;color:#e74c3c">- ' + formatMoney(tvaDeductible) + '</td></tr>' +
      '<tr style="background:' + (tvaNette >= 0 ? '#e8f8e8' : '#fde8e8') + '"><td style="padding:12px;font-weight:bold">' + (tvaNette >= 0 ? 'TVA à reverser' : 'Crédit de TVA') + '</td><td style="padding:12px;text-align:right;font-weight:bold;font-size:1.2em;color:' + (tvaNette >= 0 ? '#27ae60' : '#e74c3c') + '">' + formatMoney(Math.abs(tvaNette)) + '</td></tr>' +
    '</table>' +

    // Détail par taux
    renderDetailTVAParTaux(dateDebut, dateFin) +

    '<p style="margin-top:40px;padding:12px;background:#fff3cd;border:1px solid #ffc107;border-radius:4px;font-size:0.85em">⚠️ Document indicatif généré par OnboardCRM. À vérifier avec votre comptable.</p>' +
  '</div>';

  // Adapter "genererPDF" à ta fonction existante
  if (typeof genererPDF === 'function') {
    genererPDF(contenu, 'bilan_' + dateDebut + '_' + dateFin + '.pdf');
  } else if (typeof exportPDF === 'function') {
    exportPDF(contenu, 'bilan_' + dateDebut + '_' + dateFin + '.pdf');
  } else {
    // Fallback : ouverture dans une nouvelle fenêtre pour impression PDF
    var win = window.open('', '_blank');
    win.document.write('<html><head><title>Bilan</title></head><body>' + contenu + '</body></html>');
    win.document.close();
    win.print();
  }
  toast('Bilan exporté en PDF', 'success');
}

// ===== FIN AJOUT =====
