const STORAGE_KEY = 'enabled';
const FALLBACK_STORAGE_KEY = 'yt2embed_enabled';
const DEFAULT_ENABLED = true;

const NOCOOKIE_KEY = 'nocookie';
const FALLBACK_NOCOOKIE_KEY = 'yt2embed_nocookie';
const DEFAULT_NOCOOKIE = true;

document.addEventListener('DOMContentLoaded', function() {
  const toggle = document.getElementById('toggle');
  const status = document.getElementById('status');
  const nocookieToggle = document.getElementById('nocookie-toggle');
  const nocookieStatus = document.getElementById('nocookie-status');
  const infoIcon = document.querySelector('.info-icon');

  function getAPI() {
    if (typeof browser !== 'undefined' && browser.storage) return browser;
    if (typeof chrome !== 'undefined' && chrome.storage) return chrome;
    return null;
  }

  const browserAPI = getAPI();

  function getStorageValue(key, fallbackKey, defaultValue = true) {
    if (browserAPI) {
      return new Promise((resolve) => {
        browserAPI.storage.local.get([key], function(result) {
          if (browserAPI.runtime.lastError) {
            resolve(localStorage.getItem(fallbackKey) !== 'false');
          } else {
            resolve(result[key] !== false);
          }
        });
      });
    }
    return Promise.resolve(localStorage.getItem(fallbackKey) !== 'false');
  }

  function setStorageValue(key, fallbackKey, value) {
    if (browserAPI) {
      const storageObj = {};
      storageObj[key] = value;
      browserAPI.storage.local.set(storageObj, function() {
        if (browserAPI.runtime.lastError) {
          localStorage.setItem(fallbackKey, value.toString());
        }
      });
    } else {
      localStorage.setItem(fallbackKey, value.toString());
    }
  }

  const getEnabled = () => getStorageValue(STORAGE_KEY, FALLBACK_STORAGE_KEY, DEFAULT_ENABLED);
  const getNocookie = () => getStorageValue(NOCOOKIE_KEY, FALLBACK_NOCOOKIE_KEY, DEFAULT_NOCOOKIE);
  const setEnabled = (value) => setStorageValue(STORAGE_KEY, FALLBACK_STORAGE_KEY, value);
  const setNocookie = (value) => setStorageValue(NOCOOKIE_KEY, FALLBACK_NOCOOKIE_KEY, value);

  Promise.all([getEnabled(), getNocookie()]).then(([isEnabled, isNocookie]) => {
    updateUI(isEnabled, isNocookie);
  }).catch(error => {
    console.error('Error loading state:', error);
    showError('Load error');
    updateUI(DEFAULT_ENABLED, DEFAULT_NOCOOKIE);
  });

  toggle.addEventListener('click', function() {
    Promise.all([getEnabled(), getNocookie()]).then(([currentEnabled, currentNocookie]) => {
      const newEnabled = !currentEnabled;
      setEnabled(newEnabled);
      updateUI(newEnabled, currentNocookie);
      clearError();
    }).catch(error => {
      console.error('Error in toggle:', error);
      showError('Toggle failed');
    });
  });

  nocookieToggle.addEventListener('click', function() {
    Promise.all([getEnabled(), getNocookie()]).then(([currentEnabled, currentNocookie]) => {
      if (!currentEnabled) return;
      const newNocookie = !currentNocookie;
      setNocookie(newNocookie);
      updateUI(currentEnabled, newNocookie);
      clearError();
    }).catch(error => {
      console.error('Error in nocookie toggle:', error);
      showError('Toggle failed');
    });
  });

  function updateUI(isEnabled, isNocookie) {
    if (isEnabled) {
      toggle.classList.add('enabled');
      status.textContent = 'Enabled';
      status.style.color = '';
    } else {
      toggle.classList.remove('enabled');
      status.textContent = 'Disabled';
      status.style.color = '';
    }

    if (isNocookie) {
      nocookieToggle.classList.add('enabled');
    } else {
      nocookieToggle.classList.remove('enabled');
    }

    nocookieStatus.textContent = 'Privacy Mode';
    nocookieStatus.style.color = '';

    if (isEnabled) {
      nocookieToggle.classList.remove('disabled');
      nocookieStatus.classList.remove('disabled');
      infoIcon.classList.remove('disabled');
    } else {
      nocookieToggle.classList.add('disabled');
      nocookieStatus.classList.add('disabled');
      infoIcon.classList.add('disabled');
    }
  }

  function showError(message) {
    status.textContent = message;
    status.style.color = '#d32f2f';
    nocookieStatus.style.color = '#d32f2f';
  }

  function clearError() {
    status.style.color = '';
    nocookieStatus.style.color = '';
  }
});
