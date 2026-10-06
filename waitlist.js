// Warteliste (Brevo, Double-Opt-in) – gemeinsam für Startseite und hestiahome.app/warteliste.
// Erwartet im HTML: #waitForm (mit #waitEmail, #waitError, button), #waitDone, optional #warteliste als Sprungziel.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const buzz = () => navigator.userActivation?.hasBeenActive && navigator.vibrate && navigator.vibrate(8);
  // Formular-Adresse aus Brevo (Formular → Einbetten → HTML, Wert von action=…). Leer = Formular noch nicht verbunden.
  const BREVO_FORM_URL = 'https://8e390c8a.sibforms.com/serve/MUIFAMtYSBRwGu1jkQIpB1sB5qUObH8JyFQhlqn1UNo0vskB6FKZlB3j-PuCnvsaPLLY_RNdqQXv4TPQEAAkWqgWm9irUgAGRJhnS7E3nB284m3tC5oWMLdCPU55rtUB5CD3gx1EvJTBV8Dc5Gs_ba500Iaap5pETBOqujyzp1Pz3ZU9RPUNZB4DmECqKHuKFcvCSjjxIjNBiolpJA==';
  // Quelle merken (z. B. ?q=tiktok aus dem Link in der Profilbeschreibung), damit Brevo sieht, woher Anmeldungen kommen.
  const params = new URLSearchParams(location.search);
  let source = params.get('q') || params.get('utm_source') || '';
  try {
    if (source) sessionStorage.setItem('hestia-quelle', source);
    else source = sessionStorage.getItem('hestia-quelle') || '';
  } catch (e) { /* ohne Speicher einfach ohne Quelle */ }
  if (!source && document.referrer) { try { source = new URL(document.referrer).hostname.replace(/^www\./, ''); } catch (e) {} }
  const form = $('#waitForm');
  // Rückkehr aus der Bestätigungs-Mail (Brevo leitet auf ?bestaetigt=1 weiter)
  if (form && params.has('bestaetigt')) {
    form.hidden = true;
    const done = $('#waitDone');
    $('b', done).textContent = 'Du stehst auf der Liste.';
    $('span:last-child', done).textContent = 'Danke! Wir melden uns, sobald Hestia im App Store ist – mit deinem ersten Monat gratis.';
    done.hidden = false;
    const anchor = $('#warteliste'); if (anchor) requestAnimationFrame(() => anchor.scrollIntoView({ block: 'center' }));
  }
  if (form && !form.hidden) {
    const input = $('#waitEmail'), err = $('#waitError'), btn = $('button', form);
    const fail = (msg) => { err.textContent = msg; err.hidden = false; input.setAttribute('aria-invalid', 'true'); input.focus(); };
    input.addEventListener('input', () => { err.hidden = true; input.removeAttribute('aria-invalid'); });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.email_address_check.value) return;                     // Bot
      const email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail('Bitte gib eine gültige E-Mail-Adresse ein.');
      if (!BREVO_FORM_URL) return fail('Die Warteliste öffnet in Kürze. Schau bald wieder vorbei.');
      btn.disabled = true; btn.textContent = 'Einen Moment …';
      const body = new FormData();
      body.append('EMAIL', email);
      body.append('QUELLE', source || 'web');
      body.append('email_address_check', '');
      body.append('locale', 'de');
      try {
        // Brevo antwortet ohne CORS-Freigabe; die Antwort ist nicht lesbar, ein Netzfehler aber schon.
        await fetch(BREVO_FORM_URL, { method: 'POST', body, mode: 'no-cors' });
        form.hidden = true;
        $('#waitDone').hidden = false;
        buzz();
      } catch (x) {
        btn.disabled = false; btn.textContent = 'Auf die Warteliste';
        fail('Das hat nicht geklappt. Prüf deine Verbindung und versuch es noch einmal.');
      }
    });
  }
})();
