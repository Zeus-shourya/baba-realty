/* ==========================================================================
   BABA — SITE CONFIG
   >>> THIS IS THE ONLY FILE YOU NEED TO EDIT TO GO LIVE. <<<
   ========================================================================== */

window.BABA = {

  /* ----------------------------------------------------------------------
     1. WHATSAPP  —  ***CHANGE THIS***
     Country code + number, digits only. No +, no spaces, no dashes.
     India example: 91 + 9876543210  ->  "919876543210"
     ---------------------------------------------------------------------- */
  whatsappNumber: '917015100152',          // 91 (India) + 7015100152
  whatsappName:   'Our Team',              // shown on the floating button
  whatsappText:   "Hello BABA Real Estate & Developers — I'd like to know more about your residences.",
  whatsappTextInvestor:
    "Hello BABA Real Estate & Developers — I'm writing about the investment opportunity.",

  /* ----------------------------------------------------------------------
     2. CONTACT DETAILS
     ---------------------------------------------------------------------- */
  founderName:  'Dinesh Garg',
  founderRole:  'Founder',

  phoneDisplay: '+91 70151 00152',
  phoneHref:    '+917015100152',
  email:        'babarealestatesonipat@gmail.com',
  investorEmail:'babarealestatesonipat@gmail.com',
  address:      'BABA Real Estate & Developers\nSonipat, Haryana, India',

  /* ----------------------------------------------------------------------
     3. FORM DELIVERY
     Leave endpoint empty ('') and every form falls back to opening WhatsApp
     with the enquiry pre-filled — works with zero backend.
     To use a form service (Formspree, Basin, Getform, your own API), paste
     the POST URL here.
     ---------------------------------------------------------------------- */
  formEndpoint: ''
};

/* --------------------------------------------------------------------------
   Helper: build a wa.me deep link.
   -------------------------------------------------------------------------- */
window.BABA.waLink = function (text) {
  var n = (window.BABA.whatsappNumber || '').replace(/\D/g, '');
  var t = encodeURIComponent(text || window.BABA.whatsappText);
  return 'https://wa.me/' + n + '?text=' + t;
};
