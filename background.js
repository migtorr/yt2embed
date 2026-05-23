const B = typeof browser !== 'undefined' ? browser : chrome;

let settings = { enabled: true, nocookie: true };

function loadSettings() {
  B.storage.local.get(['enabled', 'nocookie'], (result) => {
    settings = {
      enabled: result.enabled !== false,
      nocookie: result.nocookie !== false,
    };
  });
}

loadSettings();

B.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if ('enabled' in changes) settings.enabled = changes.enabled.newValue !== false;
  if ('nocookie' in changes) settings.nocookie = changes.nocookie.newValue !== false;
});

// Redirect youtube.com/watch and /shorts → embed URL, with timestamp conversion
B.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!settings.enabled) return {};

    const url = new URL(details.url);
    const domain = settings.nocookie ? 'youtube-nocookie.com' : 'youtube.com';

    if (url.pathname === '/watch') {
      const videoId = url.searchParams.get('v');
      if (!videoId) return {};
      const embedUrl = new URL(`https://www.${domain}/embed/${videoId}`);
      const t = url.searchParams.get('t');
      if (t) embedUrl.searchParams.set('start', t);
      return { redirectUrl: embedUrl.toString() };
    }

    const shortsMatch = url.pathname.match(/^\/shorts\/([^/?]+)/);
    if (shortsMatch) {
      return { redirectUrl: `https://www.${domain}/embed/${shortsMatch[1]}` };
    }

    return {};
  },
  {
    urls: [
      '*://*.youtube.com/watch*',
      '*://*.youtube.com/shorts/*',
    ],
    types: ['main_frame'],
  },
  ['blocking']
);

// Inject Referer on embed requests — YouTube returns error 152/153 without it
// when the embed URL is navigated to directly (Sec-Fetch-Site: none).
B.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (!settings.enabled) return {};

    const headers = (details.requestHeaders || []).filter(
      (h) => h.name.toLowerCase() !== 'referer'
    );
    headers.push({ name: 'Referer', value: 'https://example.com' });
    return { requestHeaders: headers };
  },
  {
    urls: [
      '*://www.youtube-nocookie.com/embed/*',
      '*://www.youtube.com/embed/*',
    ],
    types: ['main_frame'],
  },
  ['blocking', 'requestHeaders']
);
