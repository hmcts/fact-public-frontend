import cookieManager from '@hmcts/cookie-manager';

let gtmInserted = false;
let dynatraceInserted = false;
let apmAllowed = false;

const updateDynatrace = () => {
  const dtrum = window.dtrum;
  if (!dtrum) {
    return;
  }

  if (apmAllowed) {
    dtrum.enable();
    dtrum.enableSessionReplay();
  } else {
    dtrum.disableSessionReplay();
    dtrum.disable();
  }
};

// The cookie manager calls this for saved preferences and for new choices.
const applyPreferences = (preferences: Record<string, string>) => {
  const analyticsAllowed = preferences.analytics === 'on';
  apmAllowed = preferences.apm === 'on';

  window.gtag('consent', 'update', {
    analytics_storage: analyticsAllowed ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.dataLayer.push({
    event: 'Cookie Preferences',
    cookiePreferences: preferences,
  });

  if (analyticsAllowed && !gtmInserted) {
    gtmInserted = true;
    // Queue GTM's start event after the consent update.
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-N7NMJDR';
    document.head.appendChild(script);
  }

  if (apmAllowed && !dynatraceInserted) {
    const jstag = document.querySelector('meta[name="dynatrace-jstag"]')?.getAttribute('content');
    if (jstag) {
      dynatraceInserted = true;
      const script = document.createElement('script');
      script.src = jstag;
      script.crossOrigin = 'anonymous';
      // Consent may change while the script is still loading.
      script.onload = updateDynatrace;
      document.head.appendChild(script);
    }
  }

  updateDynatrace();
};

cookieManager.on('PreferenceFormSubmitted', () => {
  const message = document.querySelector('.cookie-preference-success') as HTMLElement;
  if (message) {
    message.style.display = 'block';
    message.focus?.();
  }
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
});

cookieManager.on('UserPreferencesLoaded', applyPreferences);
cookieManager.on('UserPreferencesSaved', applyPreferences);

const config = {
  userPreferences: {
    cookieName: 'fact-cookie-preferences',
    cookieSecure: true,
  },
  cookieManifest: [
    {
      categoryName: 'essential',
      optional: false,
      cookies: ['i18next', 'formCookie', 'connect.sid'],
    },
    {
      categoryName: 'analytics',
      cookies: ['_ga', '_gid', '_gat_UA-', '_gat'],
    },
    {
      categoryName: 'apm',
      cookies: ['dtCookie', 'dtLatC', 'dtPC', 'dtSa', 'rxVisitor', 'rxvt'],
    },
  ],
};

cookieManager.init(config);
