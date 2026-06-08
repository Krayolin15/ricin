// Lovable Cloud (Supabase) browser client for the pure-HTML site
(function () {
  const SUPABASE_URL = "https://uvjetzuhmletfdpwtjne.supabase.co";
  const SUPABASE_KEY = "sb_publishable_XCtFDEzghRYg1hjN-DHSPg_KgIvQ8QR";

  function init() {
    if (!window.supabase || !window.supabase.createClient) {
      console.error("Supabase SDK not loaded");
      return;
    }
    window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  if (window.supabase) init();
  else window.addEventListener("load", init);
})();
