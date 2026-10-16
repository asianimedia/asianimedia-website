(() => {
  'use strict';
  const form = document.getElementById('enquiry-form');
  if (!form) return;
  const opportunity = document.getElementById('enquiry-opportunity');
  const requested = new URLSearchParams(location.search).get('opportunity');
  const setOpportunity = () => {
    if (requested && Array.from(opportunity.options).some(option => option.value === requested)) opportunity.value = requested;
  };
  setOpportunity();

  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('enquiry-status');
  const idleLabel = button.textContent;
  let sending = false;
  window.aimCaptchaVerified = () => { if (!sending) status.textContent = ''; };
  window.aimCaptchaExpired = () => { if (!sending) status.textContent = 'Verification expired. Please tick the checkbox again.'; };
  window.aimCaptchaError = () => { if (!sending) status.textContent = 'Verification could not load. Please refresh this page or email enquiry@asianimedia.com.'; };
  const captchaScript = document.createElement('script');
  captchaScript.src = 'https://www.google.com/recaptcha/api.js';
  captchaScript.async = true;
  captchaScript.defer = true;
  captchaScript.onerror = window.aimCaptchaError;
  document.head.appendChild(captchaScript);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    if (!window.fetch || !window.AbortController) {
      status.textContent = 'Please use a current browser or email enquiry@asianimedia.com.';
      status.focus();
      return;
    }
    let token = '';
    try { token = window.grecaptcha && window.grecaptcha.getResponse(); } catch (_) {}
    if (!token) {
      status.textContent = 'Please complete the I’m not a robot checkbox before sending your enquiry.';
      status.focus();
      return;
    }
    sending = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your enquiry…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const data = new FormData(form);
      data.set('g-recaptcha-response', token);
      data.set('_subject', 'AIM media enquiry: ' + opportunity.value);
      const response = await fetch(form.action, {
        method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: controller.signal
      });
      if (!response.ok) throw new Error('Submission not confirmed');
      form.reset();
      setOpportunity();
      status.textContent = 'Thank you. Your enquiry has been submitted to AIM. We will be in touch to discuss your campaign.';
    } catch (error) {
      status.textContent = 'We couldn’t confirm your submission. Your details are still here. Please try again or email enquiry@asianimedia.com. If you received a confirmation already, you do not need to resend.';
    } finally {
      clearTimeout(timeout);
      try { window.grecaptcha.reset(); } catch (_) {}
      sending = false;
      button.disabled = false;
      button.textContent = idleLabel;
      form.removeAttribute('aria-busy');
      status.focus();
    }
  });
})();
