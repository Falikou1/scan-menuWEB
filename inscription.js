/**
 * ============================================================================
 * MENUSCAN – PARCOURS COMMERCIAL D'INSCRIPTION & TARIFICATION OFFICIELLE
 * ============================================================================
 * Source de vérité tarifaire : Catalogue officiel MenuScan
 * Gestion dynamique des forfaits, calculs de remises, formulaires & WhatsApp
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. CONFIGURATION OFFICIELLE MENUSCAN
  // --------------------------------------------------------------------------
  window.MENUSCAN_CONFIG = {
    /**
     * Numéro WhatsApp officiel commercial de MenuScan (Côte d'Ivoire) :
     * 0777959848 -> Format international sans +, espaces ou tirets : 2250777959848
     */
    whatsappNumber: '2250777959848',
  };

  // --------------------------------------------------------------------------
  // 2. DONNÉES OFFICIELLES DU CATALOGUE
  // --------------------------------------------------------------------------
  const PRICING_CATALOG = {
    business: {
      id: 'business',
      name: 'Business',
      monthlyPrice: 15000,
      maxItems: 30,
      qrSupports: 3,
      modsPerMonth: 1,
      modItemsMax: 10,
      turnaround: '2 jours ouvrés',
      support: 'Standard',
      followUp: 'Aucun',
      audience: 'Pour les snacks, cafés et petits restaurants avec une carte courte et peu de changements.',
      badge: 'Forfait MenuScan',
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 25000,
      maxItems: 150,
      qrSupports: 6,
      modsPerMonth: 4,
      modItemsMax: 10,
      turnaround: '1 jour ouvré',
      support: 'Prioritaire',
      followUp: 'Trimestriel',
      audience: 'Pour les restaurants et brasseries avec une carte variée et des mises à jour régulières.',
      badge: 'Recommandé',
      isRecommended: true,
    },
    prestige: {
      id: 'prestige',
      name: 'Prestige',
      monthlyPrice: 50000,
      maxItems: 500,
      qrSupports: 15,
      modsPerMonth: 8,
      modItemsMax: 10,
      turnaround: '4 heures ouvrées',
      support: 'Interlocuteur référent',
      followUp: 'Mensuel',
      audience: 'Pour les grands restaurants et hôtels avec une carte étendue et un accompagnement fréquent.',
      badge: 'Forfait MenuScan',
    },
  };

  const PERIODS_CATALOG = {
    1: {
      months: 1,
      name: 'Mensuel',
      shortLabel: '1 mois',
      discountRate: 0,
      discountLabel: 'Plein tarif',
      description: 'Prix pour 1 mois, sans engagement long.',
    },
    3: {
      months: 3,
      name: 'Trimestriel',
      shortLabel: '3 mois',
      discountRate: 0.05,
      discountLabel: '−5 % d’économie',
      description: 'Prix pour 3 mois, payable en un seul règlement pour la période.',
    },
    6: {
      months: 6,
      name: 'Semestriel',
      shortLabel: '6 mois',
      discountRate: 0.10,
      discountLabel: '−10 % d’économie',
      description: 'Prix pour 6 mois, payable en un seul règlement pour la période.',
    },
    12: {
      months: 12,
      name: 'Annuel',
      shortLabel: '12 mois',
      discountRate: 0.15,
      discountLabel: '−15 % d’économie',
      description: 'Prix pour 12 mois, payable en un seul règlement pour la période.',
    },
  };

  // --------------------------------------------------------------------------
  // 3. ÉTAT LOCAL DE L'APPLICATION
  // --------------------------------------------------------------------------
  const STORAGE_KEY = 'menuscan_registration_state';

  let appState = {
    selectedPlan: 'pro', // 'business', 'pro', 'prestige'
    selectedMonths: 1,   // 1, 3, 6, 12
    formData: {
      restaurantName: '',
      ownerName: '',
      phone: '',
      city: '',
      restaurantType: '',
      notes: '',
    },
  };

  // --------------------------------------------------------------------------
  // 4. UTILITAIRES DE CALCUL ET FORMATION
  // --------------------------------------------------------------------------
  function formatFCFA(amount) {
    if (typeof amount !== 'number') return '0 FCFA';
    // Espaces insécables pour les milliers
    return amount.toLocaleString('fr-FR') + ' FCFA';
  }

  function computePricing(planKey, months) {
    const plan = PRICING_CATALOG[planKey] || PRICING_CATALOG.pro;
    const period = PERIODS_CATALOG[months] || PERIODS_CATALOG[1];

    const monthlyPrice = plan.monthlyPrice;
    const countMonths = period.months;
    const discountRate = period.discountRate;

    const baseTotal = monthlyPrice * countMonths;
    const discountAmount = Math.round(baseTotal * discountRate);
    const finalTotal = baseTotal - discountAmount;
    const discountPercent = Math.round(discountRate * 100);

    return {
      plan,
      period,
      monthlyPrice,
      countMonths,
      discountRate,
      discountPercent,
      baseTotal,
      discountAmount,
      finalTotal,
    };
  }

  // --------------------------------------------------------------------------
  // 5. SAUVEGARDE ET RESTAURATION DU FORMULAIRE
  // --------------------------------------------------------------------------
  function saveStateToStorage() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      // Ignore quota errors
    }
  }

  function restoreStateFromStorage() {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedPlan && PRICING_CATALOG[parsed.selectedPlan]) {
          appState.selectedPlan = parsed.selectedPlan;
        }
        if (parsed.selectedMonths && PERIODS_CATALOG[parsed.selectedMonths]) {
          appState.selectedMonths = Number(parsed.selectedMonths);
        }
        if (parsed.formData && typeof parsed.formData === 'object') {
          appState.formData = { ...appState.formData, ...parsed.formData };
        }
      }
    } catch (e) {
      console.warn('Erreur lecture session storage:', e);
    }

    // Gestion des paramètres d'URL (ex: ?plan=prestige&duration=3)
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan');
    const durationParam = urlParams.get('duration') || urlParams.get('period');

    if (planParam && PRICING_CATALOG[planParam.toLowerCase()]) {
      appState.selectedPlan = planParam.toLowerCase();
    }
    if (durationParam && PERIODS_CATALOG[Number(durationParam)]) {
      appState.selectedMonths = Number(durationParam);
    }
  }

  // --------------------------------------------------------------------------
  // 6. MISE À JOUR DE L'INTERFACE UTILISATEUR
  // --------------------------------------------------------------------------
  function updateUI() {
    const currentPeriod = PERIODS_CATALOG[appState.selectedMonths] || PERIODS_CATALOG[1];
    const currentCalculation = computePricing(appState.selectedPlan, appState.selectedMonths);

    // A. Mise à jour des boutons de durée (période)
    const periodButtons = document.querySelectorAll('[data-inscr-period]');
    periodButtons.forEach(btn => {
      const months = Number(btn.getAttribute('data-inscr-period'));
      const isActive = months === appState.selectedMonths;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // Légende de la période
    const captionEl = document.getElementById('inscrPeriodCaption');
    if (captionEl) {
      captionEl.textContent = currentPeriod.description;
    }

    // B. Mise à jour des cartes de forfaits
    ['business', 'pro', 'prestige'].forEach(planKey => {
      const card = document.getElementById(`planCard_${planKey}`);
      if (!card) return;

      const calc = computePricing(planKey, appState.selectedMonths);
      const isSelected = planKey === appState.selectedPlan;

      card.classList.toggle('is-selected', isSelected);
      card.setAttribute('aria-selected', isSelected ? 'true' : 'false');

      // Bouton de sélection
      const selectBtn = card.querySelector('.inscr-select-plan-btn');
      if (selectBtn) {
        selectBtn.innerHTML = isSelected
          ? `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> Forfait sélectionné`
          : `Choisir ${calc.plan.name}`;
      }

      // Prix total affiché
      const priceTotalEl = card.querySelector('[data-plan-total]');
      if (priceTotalEl) {
        priceTotalEl.textContent = formatFCFA(calc.finalTotal);
      }

      // Libellé de durée sur le prix
      const pricePeriodEl = card.querySelector('[data-plan-period-label]');
      if (pricePeriodEl) {
        pricePeriodEl.textContent = calc.countMonths === 1
          ? 'pour 1 mois'
          : `pour ${calc.countMonths} mois (règlement unique)`;
      }

      // Économie / Réduction
      const discountTag = card.querySelector('[data-plan-discount-tag]');
      if (discountTag) {
        if (calc.discountPercent > 0) {
          discountTag.style.display = 'inline-flex';
          discountTag.textContent = `−${calc.discountPercent} % · Vous économisez ${formatFCFA(calc.discountAmount)}`;
        } else {
          discountTag.style.display = 'none';
        }
      }

      // Base mensuelle
      const baseRateEl = card.querySelector('[data-plan-base-rate]');
      if (baseRateEl) {
        baseRateEl.textContent = `Tarif mensuel de base : ${formatFCFA(calc.monthlyPrice)} / mois`;
      }
    });

    // C. Mise à jour du récapitulatif (Sticky card)
    const summaryPlanName = document.getElementById('summaryPlanName');
    const summaryPlanBadge = document.getElementById('summaryPlanBadge');
    const summaryBaseMonthly = document.getElementById('summaryBaseMonthly');
    const summaryDuration = document.getElementById('summaryDuration');
    const summaryBaseTotal = document.getElementById('summaryBaseTotal');
    const summaryDiscountRow = document.getElementById('summaryDiscountRow');
    const summaryDiscountPercent = document.getElementById('summaryDiscountPercent');
    const summaryDiscountAmount = document.getElementById('summaryDiscountAmount');
    const summaryFinalTotal = document.getElementById('summaryFinalTotal');
    const summaryTotalNote = document.getElementById('summaryTotalNote');
    const summaryRestaurantInfo = document.getElementById('summaryRestaurantInfo');

    if (summaryPlanName) summaryPlanName.textContent = currentCalculation.plan.name;
    if (summaryPlanBadge) {
      summaryPlanBadge.textContent = currentCalculation.plan.isRecommended ? '★ Recommandé' : 'Forfait Officiel';
    }
    if (summaryBaseMonthly) summaryBaseMonthly.textContent = formatFCFA(currentCalculation.monthlyPrice) + ' / mois';
    if (summaryDuration) summaryDuration.textContent = `${currentCalculation.countMonths} mois (${currentCalculation.period.name})`;
    if (summaryBaseTotal) summaryBaseTotal.textContent = formatFCFA(currentCalculation.baseTotal);

    if (summaryDiscountRow) {
      if (currentCalculation.discountPercent > 0) {
        summaryDiscountRow.style.display = 'flex';
        if (summaryDiscountPercent) summaryDiscountPercent.textContent = `−${currentCalculation.discountPercent} %`;
        if (summaryDiscountAmount) summaryDiscountAmount.textContent = `−${formatFCFA(currentCalculation.discountAmount)}`;
      } else {
        summaryDiscountRow.style.display = 'none';
      }
    }

    if (summaryFinalTotal) summaryFinalTotal.textContent = formatFCFA(currentCalculation.finalTotal);
    if (summaryTotalNote) {
      summaryTotalNote.textContent = currentCalculation.countMonths === 1
        ? 'Montant pour 1 mois. Préparation et saisie du menu incluses.'
        : `Montant total pour toute la période de ${currentCalculation.countMonths} mois en un seul règlement. Préparation et saisie du menu incluses.`;
    }

    if (summaryRestaurantInfo) {
      const restName = appState.formData.restaurantName.trim();
      const city = appState.formData.city.trim();
      if (restName) {
        summaryRestaurantInfo.innerHTML = `<strong>${escapeHTML(restName)}</strong>${city ? ` · ${escapeHTML(city)}` : ''}`;
      } else {
        summaryRestaurantInfo.innerHTML = `<span style="color:var(--ink-muted);font-style:italic;">À renseigner ci-contre</span>`;
      }
    }

    saveStateToStorage();
  }

  // --------------------------------------------------------------------------
  // 7. GÉNÉRATION DU MESSAGE WHATSAPP OFFICIEL
  // --------------------------------------------------------------------------
  function generateWhatsAppMessage(forUrl = false) {
    const calc = computePricing(appState.selectedPlan, appState.selectedMonths);
    const data = appState.formData;

    const restName = data.restaurantName.trim() || '[Nom du restaurant]';
    const owner = data.ownerName.trim() || '[Nom du responsable]';
    const phone = data.phone.trim() || '[Numéro téléphone / WhatsApp]';
    const city = data.city.trim() || '[Ville / Commune]';
    const type = data.restaurantType.trim();
    const notes = data.notes.trim();

    let lines = [
      'Bonjour MenuScan !',
      'Je souhaite inscrire mon établissement à votre service de menu numérique par QR code.',
      '',
      'INFORMATIONS SUR MON ÉTABLISSEMENT',
      `Nom du restaurant : ${restName}`,
      `Responsable : ${owner}`,
      `Numéro de téléphone : ${phone}`,
      `Ville : ${city}`,
    ];

    if (type) {
      lines.push(`Type d’établissement : ${type}`);
    }

    lines.push(
      '',
      'MON ABONNEMENT',
      `Forfait choisi : ${calc.plan.name}`,
      `Durée choisie : ${calc.countMonths} mois`,
      `Tarif mensuel de base : ${formatFCFA(calc.monthlyPrice)}`,
      `Réduction appliquée : ${calc.discountPercent > 0 ? `−${calc.discountPercent} % (${formatFCFA(calc.discountAmount)} d’économie)` : 'Aucune (Plein tarif)'}`,
      `Montant total à payer pour la période : ${formatFCFA(calc.finalTotal)}`
    );

    if (notes) {
      lines.push(`Message complémentaire : ${notes}`);
    }

    lines.push(
      '',
      'Je souhaite obtenir des informations complémentaires et connaître les prochaines étapes pour l’inscription de mon établissement.',
      'Merci !'
    );

    const fullMessage = lines.join('\n');
    return forUrl ? encodeURIComponent(fullMessage) : fullMessage;
  }

  // --------------------------------------------------------------------------
  // 8. REDIRECTION VERS WHATSAPP (CLICK TO CHAT OFFICIEL)
  // --------------------------------------------------------------------------
  function handleContinueToWhatsApp(e) {
    if (e) e.preventDefault();

    // Validation des champs obligatoires
    const errors = validateForm();
    if (errors.length > 0) {
      const firstInvalidField = document.getElementById(errors[0].id);
      if (firstInvalidField) {
        firstInvalidField.focus();
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      showToast('⚠️ Veuillez renseigner tous les champs obligatoires du restaurant.');
      return;
    }

    // Vérification du numéro de destination
    let rawNumber = window.MENUSCAN_CONFIG.whatsappNumber || '';
    const cleanNumber = String(rawNumber).replace(/\D/g, '');

    if (!cleanNumber || cleanNumber.length < 8) {
      alert(
        "Configuration MenuScan :\nLe numéro WhatsApp officiel commercial n'a pas encore été configuré dans le projet.\n\nVeuillez définir window.MENUSCAN_CONFIG.whatsappNumber avec votre numéro officiel."
      );
      return;
    }

    const encodedText = generateWhatsAppMessage(true);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;

    // Notification utilisateur
    showToast('🚀 Redirection vers WhatsApp... Votre message est prérempli !');

    // Ouverture WhatsApp dans un nouvel onglet
    setTimeout(() => {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }, 400);
  }

  // --------------------------------------------------------------------------
  // 9. VALIDATION DU FORMULAIRE
  // --------------------------------------------------------------------------
  function validateForm() {
    const errors = [];

    const fields = [
      { id: 'inscrRestaurantName', key: 'restaurantName', name: 'Nom du restaurant' },
      { id: 'inscrOwnerName', key: 'ownerName', name: 'Nom du responsable' },
      { id: 'inscrPhone', key: 'phone', name: 'Téléphone ou WhatsApp' },
      { id: 'inscrCity', key: 'city', name: 'Ville ou commune' },
    ];

    fields.forEach(f => {
      const input = document.getElementById(f.id);
      const val = (appState.formData[f.key] || '').trim();
      const isValid = val.length >= 2;

      if (input) {
        input.classList.toggle('is-invalid', !isValid);
        input.setAttribute('aria-invalid', !isValid ? 'true' : 'false');
      }

      if (!isValid) {
        errors.push({ id: f.id, name: f.name });
      }
    });

    return errors;
  }

  // --------------------------------------------------------------------------
  // 10. NOTIFICATION TOAST
  // --------------------------------------------------------------------------
  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById('inscrToast');
    const toastMsg = document.getElementById('inscrToastMsg');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // --------------------------------------------------------------------------
  // 11. INITIALISATION DES ÉVÉNEMENTS
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    restoreStateFromStorage();

    // Remplir les champs du formulaire avec l'état restauré
    const nameInput = document.getElementById('inscrRestaurantName');
    const ownerInput = document.getElementById('inscrOwnerName');
    const phoneInput = document.getElementById('inscrPhone');
    const cityInput = document.getElementById('inscrCity');
    const typeSelect = document.getElementById('inscrRestaurantType');
    const notesTextarea = document.getElementById('inscrNotes');

    if (nameInput) nameInput.value = appState.formData.restaurantName;
    if (ownerInput) ownerInput.value = appState.formData.ownerName;
    if (phoneInput) phoneInput.value = appState.formData.phone;
    if (cityInput) cityInput.value = appState.formData.city;
    if (typeSelect) typeSelect.value = appState.formData.restaurantType;
    if (notesTextarea) notesTextarea.value = appState.formData.notes;

    // Écouteurs de formulaire (synchronisation en temps réel)
    const syncForm = (key, val) => {
      appState.formData[key] = val;
      updateUI();
    };

    if (nameInput) nameInput.addEventListener('input', e => syncForm('restaurantName', e.target.value));
    if (ownerInput) ownerInput.addEventListener('input', e => syncForm('ownerName', e.target.value));
    if (phoneInput) phoneInput.addEventListener('input', e => syncForm('phone', e.target.value));
    if (cityInput) cityInput.addEventListener('input', e => syncForm('city', e.target.value));
    if (typeSelect) typeSelect.addEventListener('change', e => syncForm('restaurantType', e.target.value));
    if (notesTextarea) notesTextarea.addEventListener('input', e => syncForm('notes', e.target.value));

    // Suppression de la classe d'erreur lors de la saisie
    [nameInput, ownerInput, phoneInput, cityInput].forEach(inp => {
      if (inp) {
        inp.addEventListener('input', () => {
          if (inp.value.trim().length >= 2) {
            inp.classList.remove('is-invalid');
          }
        });
      }
    });

    // Écouteurs sur les boutons de durée (période)
    document.querySelectorAll('[data-inscr-period]').forEach(btn => {
      btn.addEventListener('click', () => {
        const months = Number(btn.getAttribute('data-inscr-period'));
        if (months && PERIODS_CATALOG[months]) {
          appState.selectedMonths = months;
          updateUI();
        }
      });
    });

    // Écouteurs sur les cartes de forfaits (clic sur la carte ou sur le bouton)
    ['business', 'pro', 'prestige'].forEach(planKey => {
      const card = document.getElementById(`planCard_${planKey}`);
      if (!card) return;

      const btn = card.querySelector('.inscr-select-plan-btn');
      const selectAction = (e) => {
        // Empêcher d'interférer avec le summary des détails
        if (e.target.closest('.inscr-plan-details')) return;
        appState.selectedPlan = planKey;
        updateUI();
      };

      if (btn) btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectAction(e);
      });

      card.addEventListener('click', selectAction);
    });

    // Écouteur sur le bouton Continuer sur WhatsApp
    const submitBtn = document.getElementById('inscrSubmitWhatsApp');
    if (submitBtn) {
      submitBtn.addEventListener('click', handleContinueToWhatsApp);
    }

    // Premier rendu UI
    updateUI();
  });

})();
