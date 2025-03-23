const versionUrl = 'https://www.junaid.xyz/projects/jstar-tab/version.txt';
const manifestVersion = chrome.runtime.getManifest().version;

function compareVersions(version1, version2) {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
        const diff = (v1[i] || 0) - (v2[i] || 0);
        if (diff !== 0) return diff;
    }

    return 0;
}

async function checkForUpdate() {
    try {
      const response = await fetch(versionUrl, { cache: 'no-store' });
      const latestVersion = await response.text();
      handleVersionComparison(latestVersion);
    } catch (error) {
      const cachedResponse = await caches.match(versionUrl);
      if (cachedResponse) {
        const cachedVersion = await cachedResponse.text();
        handleVersionComparison(cachedVersion, true);
      } else {
        updateVersionIcon(null);
      }
    }
}

function handleVersionComparison(latestVersion, isCached = false) {
  latestVersion = latestVersion.trim();
  const comparison = compareVersions(latestVersion, manifestVersion);
  
  updateVersionIcon(comparison, latestVersion);
  
  if (comparison > 0) {
    const alertMessage = `New version ${latestVersion} available! ` + 
      `<a href="https://github.com/DevJSTAR/JSTAR-Tab/releases/${latestVersion}" ` +
      `target="_blank" style="color: #2196F3;">Update now</a>`;
    
    if (isCached) {
      notifications.show(`${alertMessage} (Showing cached version)`, 'info', 8000);
    } else {
      notifications.show(alertMessage, 'info');
    }
  }
}

function updateVersionIcon(versionComparison, latestVersion) {
    const versionIcon = document.getElementById('version-icon');
    if (!versionIcon) return;

    versionIcon.className = 'version-icon fas';
    versionIcon.style.color = '';
    versionIcon.removeAttribute('title');

    latestVersion = latestVersion.trim();

    if (versionComparison === 0) {
        versionIcon.classList.add('fa-check-circle');
        versionIcon.style.color = '#4caf50';
        versionIcon.title = 'You’re up to date! Enjoy the latest features.';
    } else if (versionComparison > 0) {
        versionIcon.classList.add('fa-exclamation-circle');
        versionIcon.style.color = '#ff9800';
        versionIcon.title = `A newer version (${latestVersion}) is available! Don’t miss out on the new goodies.`;
    } else if (versionComparison < 0) {
        versionIcon.classList.add('fa-question-circle');
        versionIcon.style.color = '#2196f3';
        versionIcon.title = 'Whoa! You’re ahead of the curve. Are you from the future?';
    } else {
        versionIcon.classList.add('fa-times-circle');
        versionIcon.style.color = '#f44336';
        versionIcon.title = 'Unable to check the version. Is the internet sleeping?';
    }
}

function showUpdateNotification(latestVersion) {
    const message = `Version ${latestVersion} is available! <a href="https://github.com/DevJSTAR/JSTAR-Tab/releases/${latestVersion}" target="_blank">Update now</a>!`;
    notifications.show(message, 'info');
}

checkForUpdate();

document.addEventListener('DOMContentLoaded', () => {
    const version = chrome.runtime.getManifest().version;
    const versionElement = document.getElementById('extension-version');
    if (versionElement) {
        versionElement.innerHTML = `JSTAR Tab v<a href="https://github.com/DevJSTAR/JSTAR-Tab/releases/${version}" target="_blank" style="color: inherit;">${version}</a> <span id="version-icon" class="version-icon"></span>`;
    }
});