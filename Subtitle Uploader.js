// ==UserScript==
// @name         Subtitle Uploader
// @namespace    http://tampermonkey.net/
// @version      2.0
// @author       md-dahshan
// @license      GPL3
// @description  Upload subtitles to any video on any website + settings panel
// @match        *://*/*
// @grant        none
// @downloadURL https://update.greasyfork.org/scripts/542345/Subtitle%20Uploader.user.js
// @updateURL https://update.greasyfork.org/scripts/542345/Subtitle%20Uploader.meta.js
// ==/UserScript==

(function () {
'use strict';

const defaultSettings = {
    fontSize: 30,
    fontColor: '#ffffff',
    bgColor: '#000000',
    bgToggle: true,
    offsetY: 85,
    delay: 0,
    bgOpacity: 0.7

};

const cryptoAddresses = {
    Bitcoin_BTC: '1Hi4HnetFFnM2B2GzEvJDgU48yF2mSnWh8',
    BNB_BEP20: '0x1452c2ae22683dbf6133684501044d3c44f476d3',
    USDT_TRC20: 'TEjLXNrydPDRdE2n3Wmjr3TyvSuDFm8JVg',
    PAYPAL: 'paypal.me/MDDASH',
    Binance_ID: '859818212'
};

const settings = loadSettings();
const style = document.createElement('style');
document.head.appendChild(style);

const settingsPanel = createSettingsPanel();
applySettings();
positionButtons();

setInterval(() => {
    positionButtons();
}, 2500);

window.addEventListener('resize', positionButtons);
document.addEventListener('fullscreenchange', positionButtons);

function positionButtons() {
    document.querySelectorAll('.subtitle-controls').forEach(e => e.remove());
        if (document.fullscreenElement) return;

    document.querySelectorAll('video').forEach(video => {
        const container = document.createElement('div');
        container.className = 'subtitle-controls';

        const btnUpload = document.createElement('button');
btnUpload.title = 'Upload Subtitle';
btnUpload.style.cssText = btnStyle();

btnUpload.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 8 20 20" width="20" height="20" fill="currentColor">
  <path d="M11,11 C9.9,11 9,11.9 9,13 L9,23 C9,24.1 9.9,25 11,25 L25,25 C26.1,25 27,24.1 27,23 L27,13 C27,11.9 26.1,11 25,11 L11,11 Z M11,17 L14,17 L14,19 L11,19 L11,17 L11,17 Z M20,23 L11,23 L11,21 L20,21 L20,23 L20,23 Z M25,23 L22,23 L22,21 L25,21 L25,23 L25,23 Z M25,19 L16,19 L16,17 L25,17 L25,19 L25,19 Z" fill="#fff"></path>
</svg>
`;


        const btnSettings = document.createElement('button');
        btnSettings.title = 'Settings';
        btnSettings.style.cssText = btnStyle();
btnSettings.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 8 20 20" width="20" height="20" fill="currentColor">
  <path d="m 23.94,18.78 c .03,-0.25 .05,-0.51 .05,-0.78 0,-0.27 -0.02,-0.52 -0.05,-0.78 l 1.68,-1.32 c .15,-0.12 .19,-0.33 .09,-0.51 l -1.6,-2.76 c -0.09,-0.17 -0.31,-0.24 -0.48,-0.17 l -1.99,.8 c -0.41,-0.32 -0.86,-0.58 -1.35,-0.78 l -0.30,-2.12 c -0.02,-0.19 -0.19,-0.33 -0.39,-0.33 l -3.2,0 c -0.2,0 -0.36,.14 -0.39,.33 l -0.30,2.12 c -0.48,.2 -0.93,.47 -1.35,.78 l -1.99,-0.8 c -0.18,-0.07 -0.39,0 -0.48,.17 l -1.6,2.76 c -0.10,.17 -0.05,.39 .09,.51 l 1.68,1.32 c -0.03,.25 -0.05,.52 -0.05,.78 0,.26 .02,.52 .05,.78 l -1.68,1.32 c -0.15,.12 -0.19,.33 -0.09,.51 l 1.6,2.76 c .09,.17 .31,.24 .48,.17 l 1.99,-0.8 c .41,.32 .86,.58 1.35,.78 l .30,2.12 c .02,.19 .19,.33 .39,.33 l 3.2,0 c .2,0 .36,-0.14 .39,-0.33 l .30,-2.12 c .48,-0.2 .93,-0.47 1.35,-0.78 l 1.99,.8 c .18,.07 .39,0 .48,-0.17 l 1.6,-2.76 c .09,-0.17 .05,-0.39 -0.09,-0.51 l -1.68,-1.32 0,0 z m -5.94,2.01 c -1.54,0 -2.8,-1.25 -2.8,-2.8 0,-1.54 1.25,-2.8 2.8,-2.8 1.54,0 2.8,1.25 2.8,2.8 0,1.54 -1.25,2.8 -2.8,2.8 l 0,0 z" fill="#fff"></path>
</svg>
`;
        btnUpload.onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.vtt,.srt';
            input.style.display = 'none';

            input.onchange = () => {
                const file = input.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = () => {
                    let text = reader.result;

                    if (file.name.endsWith('.srt')) {
                        text = 'WEBVTT\n\n' + text
                            .replace(/\r+/g, '')
                            .replace(/(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g,
                                     '$2 --> $3')
                            .replace(/,/g, '.');
                    }

                    const blob = new Blob([text], { type: 'text/vtt' });
                    const url = URL.createObjectURL(blob);

                    attachSubtitle(video, url);
                    applySettings();
                };
                reader.readAsText(file);

            };

            document.body.appendChild(input);
            input.click();
        };

        btnSettings.onclick = () => {
            settingsPanel.style.display = 'block';
        };

        container.appendChild(btnUpload);
        container.appendChild(btnSettings);
        document.body.appendChild(container);

        const rect = video.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

        container.style.cssText = `
            position: absolute;
            top: ${rect.top + scrollTop + 10}px;
            left: ${rect.left + scrollLeft + rect.width - 80}px;
            z-index: 99999;
            display: flex;
            overflow: hidden;
            border-radius: 30%;
            gap:2px;
        `;

    });
}

function attachSubtitle(video, vttURL) {
    video.querySelectorAll('track.__custom_subtitle__').forEach(t => t.remove());

    const track = document.createElement('track');
    track.label = 'Custom Subtitle';
    track.kind = 'subtitles';
    track.srclang = 'en';
    track.src = vttURL;
    track.default = true;
    track.classList.add('__custom_subtitle__');

    video.appendChild(track);
    track.addEventListener('load', () => {
    applySettings();
});

    setTimeout(() => {
        const cuesVisible = Array.from(video.textTracks)
            .some(t => t.cues && t.cues.length > 0);

        if (!cuesVisible) {
            if (!document.querySelector('.manual-subtitle')) {
                const div = document.createElement('div');
                div.className = 'manual-subtitle';
                div.style.cssText = `
                    position: absolute;
                    bottom: 10%;
                    width: 100%;
                    text-align: center;
                    color: white;
                    font-size: 20px;
                    text-shadow: 1px 1px 2px black;
                    z-index: 100000;
                `;
                div.textContent = 'Subtitle loaded (manual fallback)';
                video.parentElement.appendChild(div);
            }
        }
    }, 1000);
}
function btnStyle() {
    return `
      background: rgba(0, 0, 0, 0.50);
      color: #fff;
      border: none;
      width: 32px;
      border-radius: 20px;
      height: 32px;
      font-size: 16.5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    `;
}

function createSettingsPanel() {
    const panel = document.createElement('div');
    panel.className = 'subtitle-settings-panel';
    panel.innerHTML = `
<style>
.subtitle-settings-panel {
  position: fixed;
  top: 60px;
  right: 30px;
  background: linear-gradient(100deg, #000000ff, #03021bff);
  color: #fff;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  z-index: 100000;
  display: none;
  font-size: 14px;
  width: 280px;
  font-family: Arial, sans-serif;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid rgba(216, 14, 14, 0.9);
  backdrop-filter: blur(6px);
}

.subtitle-settings-panel h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: #ddd;
  text-align: center;
}

.subtitle-settings-panel label {
  display: block;
  margin: 6px 0 2px;
  font-weight: bold;
  font-size: 12px;
}

.subtitle-settings-panel input,
.subtitle-settings-panel select {
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
  border: none;
  border-radius: 8px;
  background: #181616ff;
  color: #fff;
  outline: 2px solid transparent;
  transition: all 0.2s ease;
}

.subtitle-settings-panel input:focus,
.subtitle-settings-panel select:focus {
   background: #160101ff;
}

.subtitle-settings-panel button {
  background: #f80000ff;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.subtitle-settings-panel button:hover {
  background: #571313fb;
}

.subtitle-settings-panel .validation-text {
  color: #10b981;
  font-size: 16px;
  margin-top: 4px;
}



.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #cf0c0cff;
}

input:checked + .slider:before {
  transform: translateX(20px);
}



</style>
<h3 style="display:flex;align-items:center;justify-content:space-between;">
  🎨 Subtitle Settings
  <span title="
Help:
- Don't upload the subtitle twice, and if you do, reload the page.
---------------
- Subtitle Delay it works, but the difference can be in milliseconds, so be a little tired 🤨.
---------------
- If any feature does not work, such as font color for example, switch to another streaming server and try again
---------------
- For any suggestion or modification, contact me dashmail0001@gmail.com .
---------------
- Don't forget to donate, it makes a difference, even if it's just $1, (if you want of course).

"
  style="
    cursor:help;
    font-size:10px;
    color:#ccc;
  ">❔ Hover to Help</span>
</h3>

<div style="display:flex;gap:15px;align-items:center;">

  <div style="flex:1.5;">
    <label>Font Color</label>
    <input type="color" id="sub-font-color" value="${settings.fontColor}">
  </div>

  <div style="flex:1;">
    <label>Font Size</label>
    <input type="number" id="sub-font-size" value="${settings.fontSize}" style="width:81%">
  </div>

</div>

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
  <label style="display: flex; align-items: center; gap: 10px; white-space: nowrap;">
    Background Color & bg-opacity
    <label class="switch">
      <input type="checkbox" id="sub-bg-toggle" checked>
      <span class="slider"></span>
    </label>
  </label>

  <div style="flex: 1; display: flex; flex-direction: row; align-items: center; gap: 8px;">

<div style="flex:1.2;display:flex;flex-direction:Column;align-items:center;">
      <input type="range" min="0" max="1" step="0.01" id="sub-bg-opacity" value="${settings.bgOpacity || 0.7}" style="width:79%;accent-color:#f44336;cursor:pointer;">
    </div>
    <div style="flex:0.35;">
    <span id="bg-opacity-value" style="font-size: 10px; color: #f44336;">${(settings.bgOpacity || 0.7) * 100}%</span>
    </div>

     <div style="flex: 1; display: flex; flex-direction: column;">
<input type="color" id="sub-bg-color" value="${settings.bgColor}" style="width:94%">
    </div>
  </div>
</div>


<div style="display:flex;gap:4px;align-items:center;">
<div style="flex:1.2;display:flex;flex-direction:Column;align-items:center;">
<label>Position</label>
  <input type="range" min="0" max="100" id="sub-offsetY" value="${settings.offsetY}" style="width:79%;accent-color:#f44336;cursor:pointer;">
</div>
<div style="flex:0.35;">
  <span id="sub-offsetY-value" style="font-size:10px;color:#f44336;">${settings.offsetY}px</span>
</div>
<div style="flex:1;">
  <label>Delay(ms)</label>
  <input type="number" id="sub-delay" value="${settings.delay}" step="50" style="width:81%">
</div>
</div>

<h3>💰 Donate Me❤️</h3>
<select id="crypto-select">
  <option value="">-- Choose --</option>
  ${Object.entries(cryptoAddresses).map(([k,v]) => `<option value="${v}">${k}</option>`).join('')}
</select>
<div style="display:flex;gap:4px;margin-top:4px;align-items:center;">
  <input type="text" id="crypto-output" readonly placeholder="Selected address" style="background:#333;color:#fff;border:none;padding:2px;">
  <button id="copy-crypto" title="Copy" style="background:none;border:none;color:#fff;font-size:16px;width:5%;cursor:pointer">⎘</button>
</div>

<div style="display: flex; justify-content: space-between; margin-top: 8px;">
  <button id="sub-clear" style="background: #444;">🧹 Clear Subtitle</button>
  <button id="sub-close">Close</button>
</div>
`;
    document.body.appendChild(panel);

    panel.querySelector('#sub-offsetY').addEventListener('input', () => {
        panel.querySelector('#sub-offsetY-value').textContent =
            panel.querySelector('#sub-offsetY').value + 'px';
    });

    panel.querySelector('#sub-close').onclick = () => panel.style.display = 'none';
panel.querySelector('#sub-clear').onclick = () => {
    document.querySelectorAll('video').forEach(video => {
        // إزالة كل التراكات
        video.querySelectorAll('track').forEach(t => t.remove());

        // إزالة fallback يدوي لو موجود
        video.closest('body')?.querySelector('.manual-subtitle')?.remove();

        // تعطيل الـ textTracks
        Array.from(video.textTracks).forEach(track => {
            track.mode = 'disabled';
        });
    });

    // إزالة الستايل تبع ::cue
    if (style && style.parentNode) {
        style.remove();
    }

    alert('✅ Translation removed, page will be reloaded for full cleanup.');
    setTimeout(() => {
        location.reload();
    }, 600); // ندي وقت لل alert يظهر
};


    panel.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            saveSettings();
            applySettings();
        });
    });
    panel.querySelector('#sub-bg-opacity').addEventListener('input', () => {
  const val = panel.querySelector('#sub-bg-opacity').value;
  panel.querySelector('#bg-opacity-value').textContent = ` ${Math.round(val * 100)}%`;
  saveSettings();
  applySettings();
});


    panel.querySelector('#crypto-select').onchange = function () {
        panel.querySelector('#crypto-output').value = this.value;
    };

panel.querySelector('#copy-crypto').onclick = async () => {
    const out = panel.querySelector('#crypto-output').value;
    if (!out) return alert('Please select an address first!🫵🤨');

    try {
        await navigator.clipboard.writeText(out);
        alert('Address copied!❤️');
    } catch (err) {
        // Fallback for Chrome if permissions or context fail
        const temp = document.createElement('textarea');
        temp.value = out;
        temp.style.position = 'fixed';
        temp.style.left = '-9999px';
        document.body.appendChild(temp);
        temp.select();

        try {
            const success = document.execCommand('copy');
            if (success) {
                alert('Address copied!❤️');
            } else {
                throw new Error('execCommand failed');
            }
        } catch (e) {
            alert('❌ Failed to copy. Please copy manually.');
        }

        document.body.removeChild(temp);
    }
};


    return panel;
}

function applySettings() {
    const size = document.querySelector('#sub-font-size').value || 30;
    const color = document.querySelector('#sub-font-color').value || '#fff';
    const bg = document.querySelector('#sub-bg-color').value || '#000';
    const bgToggle = document.querySelector('#sub-bg-toggle').checked;
    const offsetY = parseFloat(document.querySelector('#sub-offsetY').value || 85);
    const delay = parseInt(document.querySelector('#sub-delay').value || 0);
    const opacity = parseFloat(document.querySelector('#sub-bg-opacity').value || 0.7);



    const css = `
::cue {
  color: ${color} !important;
${bgToggle ? `background-color: ${hexToRgba(bg, opacity)} !important;` : 'background: none !important;'}
  font-size: ${size}px !important;
  text-shadow: 1px 1px 2px black;
  line-height: 1.2;

}`;
    style.textContent = css;

    // تنظيف أي manual fallback قديم
    document.querySelector('.manual-subtitle')?.remove();

    document.querySelectorAll('video').forEach(video => {
        const tracks = video.textTracks;
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            for (let j = 0; j < track.cues.length; j++) {
                const cue = track.cues[j];
                if (!cue.__originalStart) {
                    cue.__originalStart = cue.startTime;
                    cue.__originalEnd = cue.endTime;
                }
                cue.startTime = Math.max(0, cue.__originalStart + delay / 1000);
                cue.endTime = Math.max(0, cue.__originalEnd + delay / 1000);
                cue.snapToLines = false;
                cue.line = parseFloat(offsetY);
            }

            // Force refresh subtitles
            track.mode = 'disabled'; // reset completely
            setTimeout(() => {
                track.mode = 'showing'; // re-enable to apply timing
            }, 10);
        }

        // أيضاً نحاول إخفاء أي fallback manual text
        video.parentElement?.querySelector('.manual-subtitle')?.remove();
    });
}


function saveSettings() {
    const current = {
        fontSize: document.querySelector('#sub-font-size').value || 30,
        fontColor: document.querySelector('#sub-font-color').value || '#fff',
        bgColor: document.querySelector('#sub-bg-color').value || '#000',
        bgToggle: document.querySelector('#sub-bg-toggle').checked,
        offsetY: document.querySelector('#sub-offsetY').value || 85 ,
        delay: parseInt(document.querySelector('#sub-delay').value || 0),
        bgOpacity: parseFloat(document.querySelector('#sub-bg-opacity').value || 0.7),

    };
    localStorage.setItem('__subtitle_settings__', JSON.stringify(current));
}

function loadSettings() {
    const saved = localStorage.getItem('__subtitle_settings__');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : { ...defaultSettings };
}

function hexToRgba(hex, alpha) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(() => {
            positionButtons();
        }, 1500); // استنى شوية لحد ما الفيديو يظهر
    }
}).observe(document, { subtree: true, childList: true });


})();
