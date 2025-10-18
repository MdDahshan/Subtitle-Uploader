// ==UserScript==
// @name         Subtitle Uploader
// @namespace    http://tampermonkey.net/
// @version      4.0
// @author       md-dahshan
// @license      MIT
// @description  Upload subtitles to any video on any website + settings panel (Fixed Fullscreen)
// @match        *://*/*
// @grant        none
// @downloadURL https://update.greasyfork.org/scripts/542345/Subtitle%20Uploader.user.js
// @updateURL https://update.greasyfork.org/scripts/542345/Subtitle%20Uploader.meta.js
// ==/UserScript==

(function () {
    'use strict';

    const defaultSettings = {
        fontSize: 17,
        fontColor: '#ffffff',
        bgColor: '#000000',
        bgToggle: true,
        offsetY: 19,
        delay: 0,
        bgOpacity: 0.7,
        fontFamily: 'System Default'
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
    const uploadModal = createUploadModal();
    const supportModal = createSupportModal();
    let __currentTargetVideo = null;

    // Settings panel starts hidden, only shows when settings button is clicked
    settingsPanel.style.display = 'none';

    applySettings();
    positionButtons();

    setInterval(() => {
        positionButtons();
    }, 2500);

    window.addEventListener('resize', positionButtons);
    document.addEventListener('fullscreenchange', positionButtons);

    function positionButtons() {
        document.querySelectorAll('.subtitle-controls').forEach(e => e.remove());

        const isFull = !!document.fullscreenElement;

        document.querySelectorAll('video').forEach(video => {
            // This part was modified.
            // The special logic for fullscreen that moved the subtitles was removed.
            // The `realign` function (attached to the `fullscreenchange` event)
            // is now solely responsible for positioning the subtitle overlay correctly.
            // We will only hide the buttons below.

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
                __currentTargetVideo = video;
                uploadModal.style.display = 'flex';
            };
            btnSettings.onclick = () => {
                settingsPanel.style.display = 'block';
                // Ensure panel is always visible
                settingsPanel.style.zIndex = '999999';
            };

            container.appendChild(btnUpload);
            container.appendChild(btnSettings);
            document.body.appendChild(container);

            const rect = video.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

            container.style.cssText += `
                position: absolute;
                top: ${rect.top + scrollTop + 10}px;
                left: ${rect.left + scrollLeft + rect.width - 100}px;
                z-index: 99999;
                display: ${isFull ? 'none' : 'flex'}; /* This is the key change */
                overflow: hidden;
                border-radius: 30%;
                gap: 2px;
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
                        z-index: 100000;
                    `;
                    const span = document.createElement('span');
                    span.style.cssText = `
                            display: inline-block;
                            color: white;
                            font-size: 20px;
                            font-weight: 600;
                            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
                            background: rgba(0,0,0,0.7);
                            border-radius: 35px;
                            padding: 8px 16px;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                            line-height: 1.3;
                        `;
                    span.textContent = 'Subtitle loaded (manual fallback)';
                    div.appendChild(span);
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

    function makePanelDraggable(panel) {
        const header = panel.querySelector('h3'); // الجزء الذي سنسحب منه
        header.style.cursor = 'move';
        let isDragging = false;
        let offsetX, offsetY;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;

            // منع تحديد النص أثناء السحب
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                // حساب الموضع الجديد مع حدود الشاشة
                let newLeft = e.clientX - offsetX;
                let newTop = e.clientY - offsetY;

                // التأكد من أن اللوحة لا تخرج من حدود الشاشة
                const panelWidth = panel.offsetWidth;
                const panelHeight = panel.offsetHeight;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                // حدود أفقية
                if (newLeft < 0) newLeft = 0;
                if (newLeft + panelWidth > windowWidth) newLeft = windowWidth - panelWidth;

                // حدود عمودية
                if (newTop < 0) newTop = 0;
                if (newTop + panelHeight > windowHeight) newTop = windowHeight - panelHeight;

                panel.style.left = `${newLeft}px`;
                panel.style.top = `${newTop}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    function createSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'subtitle-settings-panel';
        panel.innerHTML = `
<style>.subtitle-settings-panel {
    position: fixed;
    top: 60px;
    right: 30px;
    z-index: 999999;
    max-width: 90vw;
    max-height: 90vh;
    background: linear-gradient(225deg, rgba(204, 204, 204, 0.18) 0%, #ffffff 0.03%, rgba(46, 133, 121, 0.24) 0.88%, rgba(5, 18, 17, 0.38) 25.56%, rgba(63, 85, 79, 0.29) 37.25%, rgba(15, 26, 22, 0.53) 82.63%, rgba(0, 0, 0, 0.58) 98.5%), linear-gradient(135deg, rgba(204, 204, 204, 0.18) 0%, #ffffff 0.03%, rgba(46, 133, 121, 0.24) 0.88%, rgba(5, 18, 17, 0.38) 25.56%, rgba(63, 85, 79, 0.29) 37.25%, rgba(15, 26, 22, 0.53) 82.63%, rgba(0, 0, 0, 0.58) 98.5%), linear-gradient(270deg, rgba(204, 204, 204, 0.18) 0%, #ffffff 0.03%, rgba(46, 133, 121, 0.24) 0.88%, rgba(5, 18, 17, 0.38) 25.56%, rgba(63, 85, 79, 0.29) 37.25%, rgba(15, 26, 22, 0.53) 82.63%, rgba(0, 0, 0, 0.58) 98.5%);
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
    border: 0.5px solid rgba(5, 180, 166, 0.9);
    backdrop-filter: blur(6px);
    direction: ltr !important;
}

.subtitle-settings-panel h3 {
    margin-top: 0;
    margin-bottom: 0px;
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
    color: #fff;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(15px);
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.subtitle-settings-panel input:focus,
.subtitle-settings-panel select:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.02);
}

.subtitle-settings-panel button {
    background: linear-gradient(118deg, rgba(48, 123, 123, 0) 4.09%, rgba(48, 93, 84, 0.7) 58.71%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    color: #fff;
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
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
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

input:checked+.slider {
    background: linear-gradient(90deg, #22c55e, #3b82f6, #8b5cf6);
    background-size: 200% 100%;
}

input:checked+.slider:before {
    transform: translateX(20px);
}

input[type="range"] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: transparent;
    width: 79%;
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 15px;
    height: 15px;
    background: linear-gradient(90deg, #22c55e, #3b82f6, #8b5cf6);
    background-size: 200% 100%;
    border-radius: 50%;
    cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
    width: 15px;
    height: 15px;
    background: linear-gradient(90deg, #22c55e, #3b82f6, #8b5cf6);
    background-size: 200% 100%;
    border-radius: 50%;
    border: none;
    cursor: pointer;
}

input[type="range"]::-ms-thumb {
    width: 15px;
    height: 15px;
    background: linear-gradient(90deg, #22c55e, #3b82f6, #8b5cf6);
    background-size: 200% 100%;
    border-radius: 50%;
    cursor: pointer;
}

input[type="range"]:focus {
    outline: none;
}

#copy-crypto:hover {
    opacity: 0.8;
    transform: scale(1.1);
}

#copy-crypto:active {
    transform: scale(0.9);
}
</style>
<style>
.su-select { position: relative; width: 100%; user-select: none; }
.su-select__button {
    width: 100%; padding: 8px; color: #fff; border-radius: 8px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(150px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    cursor: pointer;
}
.su-select__button:focus { outline: none; border-color: rgba(255,255,255,0.4); box-shadow: 0 0 0 3px rgba(255,255,255,0.1); }
.su-select__arrow { transition: transform .2s ease; opacity: .85; }
.su-select__menu {
    position: absolute; left: 0; right: 0; margin-top: 6px;
    background: linear-gradient(225deg, rgb(24, 15, 15) 0%, #ffffff 0.03%, rgba(13, 34, 31, 0.88) 0.88%, rgba(5, 18, 17, 0.82) 25.56%, rgba(32, 61, 53, 0.51) 37.25%, rgba(15, 26, 22, 0.9) 82.63%, rgba(0,0,0,0.58) 98.5%);
    border: 0.5px solid rgba(5,180,166,0.9);
    border-radius: 10px; backdrop-filter: blur(150px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    z-index: 100002; max-height: 240px; overflow: auto; display: none;
}
.su-select__menu.open { display: block; }
.su-select__option { padding: 8px 10px; color: #fff; cursor: pointer; transition: background .15s; font-size: 13px; }
.su-select__option:hover, .su-select__option[aria-selected="true"] { background: rgba(255,255,255,0.10); }
.su-hidden-select { position: absolute !important; left: -99999px !important; top: auto !important; width: 1px !important; height: 1px !important; overflow: hidden !important; }
</style>

<h3 style="display:flex;align-items:center;justify-content:space-between;">
    Subtitle Settings
    <span title="Help:
- Don't upload the subtitle twice
- Subtitle Delay works in milliseconds
- If features don't work, try another server
- Contact: dashmail0001@gmail.com" style="cursor:help;font-size:10px;color:#ccc;">❔ Help</span>
</h3>
<label>_________________________________________</label>

<div style="display:flex;gap:15px;margin-top:15px;align-items:center;">
    <div style="flex:1.5;">
        <label>Font Color</label>
        <input type="color" id="sub-font-color" value="${settings.fontColor}" style="width: 79%">
    </div>
    <div style="flex:1;">
        <label>Font Size</label>
        <input type="number" id="sub-font-size" value="${settings.fontSize}" style="width:81%">
    </div>
</div>

<div>
  <label>Font Family</label>
  <select id="sub-font-family">
    ${[
        '#_System Default',
        '#_Cairo',
        '#_Tajawal',
        '#_Noto Naskh Arabic',
        '#_Noto Kufi Arabic',
        '#_Amiri',
        '#_Scheherazade New',
        '#_Markazi Text',
        '#_El Messiri',
        '#_Reem Kufi',
        '#_Changa',
        '#_Harmattan',
        '#_Mada',
        '#_IBM Plex Sans Arabic',
        '#_Almarai',
        '#_Roboto',
        '#_Inter',
        '#_Arial',
        '#_Georgia'
      ].map(f => `<option value="${f}" ${settings.fontFamily === f ? 'selected' : ''}>${f}</option>`).join('')}
  </select>
</div>

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
    <label style="display: flex; align-items: center; gap: 10px; white-space: nowrap;">
        bg-opacity & Background Color
        <label class="switch">
            <input type="checkbox" id="sub-bg-toggle" ${settings.bgToggle ? 'checked' : ''}>
            <span class="slider"></span>
        </label>
    </label>

    <div style="flex: 1; display: flex; flex-direction: row; align-items: center; gap: 8px;">
        <div style="flex:1.2;display:flex;flex-direction:Column;align-items:center;">
            <input type="range" min="0" max="1" step="0.01" id="sub-bg-opacity" value="${settings.bgOpacity || 0.7}">
        </div>
        <div style="flex:0.35;">
            <span id="bg-opacity-value" style="font-size: 10px; color: #fff;">${(settings.bgOpacity || 0.7) * 100}%</span>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column;">
            <input type="color" id="sub-bg-color" value="${settings.bgColor}" style="width:94%">
        </div>
    </div>
</div>

<div style="flex: 1; display: flex; flex-direction: row; align-items: center; gap: 8px;">
    <div style="flex:1.2;display:flex;flex-direction:Column;">
        <label>Position</label>
        <input type="range" min="0" max="100" id="sub-offsetY" value="${settings.offsetY}">
    </div>
    <div style="flex:0.35;">
        <span id="sub-offsetY-value" style="font-size:10px;color:#fff;">${settings.offsetY}px</span>
    </div>
    <div style="flex:1;">
        <label>Delay(ms)</label>
        <input type="number" id="sub-delay" value="${settings.delay}" step="50" style="width:81%">
    </div>
</div>

<div style="margin-top:6px;">
    <button id="open-support" title="Support" style="background: linear-gradient(118deg, rgba(16, 37, 37, 0.47) 4.09%, rgba(48, 93, 84, 0.7) 58.71%); border: 1px solid rgba(33, 128, 115, 0.77); color: #fff; padding: 8px 12px; border-radius: 8px; cursor: pointer; width: 100%; display: block; text-align: center;">Support Me❤️</button>
</div>

<div style="display: flex; justify-content: space-between; margin-top: 8px; gap: 8px;">
    <button id="sub-reset-settings" style="background-color: #8b4513; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer;">Reset Settings</button>
    <button id="sub-clear">🧹 Clear Subtitle</button>
    <button id="sub-close">Close</button>
</div>
`;
        document.body.appendChild(panel);
        enhanceSelect(panel.querySelector('#sub-font-family'));

        panel.querySelector('#sub-offsetY').addEventListener('input', () => {
            panel.querySelector('#sub-offsetY-value').textContent =
                panel.querySelector('#sub-offsetY').value + 'px';
        });

        panel.querySelector('#sub-close').onclick = () => panel.style.display = 'none';

        // Add reset settings functionality
        panel.querySelector('#sub-reset-settings').onclick = () => {
            if (confirm('Are you sure you want to reset all settings to their defaults?')) {
                localStorage.removeItem('__subtitle_settings__');
                alert('Settings have been reset. The page will now reload.');
                location.reload();
            }
        };
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
        panel.querySelector('#sub-font-family').addEventListener('change', () => {
            saveSettings();
            applySettings();
        });
        panel.querySelector('#sub-bg-opacity').addEventListener('input', () => {
            const val = panel.querySelector('#sub-bg-opacity').value;
            panel.querySelector('#bg-opacity-value').textContent = ` ${Math.round(val * 100)}%`;
            saveSettings();
            applySettings();
        });

        // Add event handler for the background toggle switch
        panel.querySelector('#sub-bg-toggle').addEventListener('change', () => {
            saveSettings();
            applySettings();
        });


        panel.querySelector('#open-support').onclick = () => {
            supportModal.style.display = 'flex';
            const supSel = supportModal.querySelector('#support-crypto-select');
            if (supSel && !supSel.__enhanced) enhanceSelect(supSel);
        };

        // Make the panel draggable
        makePanelDraggable(panel);

        return panel;
    }

    function createUploadModal() {
        const modal = document.createElement('div');
        modal.className = 'subtitle-upload-modal';
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.55);
            z-index: 100001;
        `;

        modal.innerHTML = `
<div class="sumodal-card" style="
    width: min(95vw, 350px);
    background: linear-gradient(225deg, rgba(204, 204, 204, 0.18) 0%, #ffffff 0.03%, rgba(46, 133, 121, 0.24) 0.88%, rgba(5, 18, 17, 0.38) 25.56%, rgba(63, 85, 79, 0.29) 37.25%, rgba(15, 26, 22, 0.53) 82.63%, rgba(0, 0, 0, 0.58) 98.5%), linear-gradient(135deg, rgba(204, 204, 204, 0.18) 0%, #ffffff 0.03%, rgba(46, 133, 121, 0.24) 0.88%, rgba(5, 18, 17, 0.38) 25.56%, rgba(63, 85, 79, 0.29) 37.25%, rgba(15, 26, 22, 0.53) 82.63%, rgba(0, 0, 0, 0.58) 98.5%), linear-gradient(270deg, rgba(204, 204, 204, 0.18) 0%, #ffffff 0.03%, rgba(46, 133, 121, 0.24) 0.88%, rgba(5, 18, 17, 0.38) 25.56%, rgba(63, 85, 79, 0.29) 37.25%, rgba(15, 26, 22, 0.53) 82.63%, rgba(0, 0, 0, 0.58) 98.5%);
    color: #fff;
    border-radius: 14px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    padding: 16px;
    font-family: Arial, sans-serif;
    border: 0.5px solid rgba(5, 180, 166, 0.9);
    backdrop-filter: blur(6px);
">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;">
    <h3 style="margin:0;font-size:16px;color:#e5e7eb">Upload Subtitle</h3>
    <button id="su-close-modal" style="background:#303835;border:none;color:#fff;padding:6px 10px;border-radius:8px;cursor:pointer">Close</button>
  </div>
  <div id="su-drop-zone" style="
      border: 2px dashed rgba(255,255,255,0.35);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      background: rgba(255,255,255,0.04);
      transition: border-color .2s, background .2s;
      user-select: none;
  ">
    <div style="font-size:14px;color:#cbd5e1;margin-bottom:8px;">Drag & Drop .vtt or .srt here</div>
    <div style="font-size:11px;color:#94a3b8;margin-bottom:12px;">or</div>
    <input id="su-file-input" type="file" accept=".vtt,.srt" style="display:none">
    <button id="su-choose-btn" style="background:#2f4f4f;border:1px solid rgba(255,255,255,0.2);color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer">Choose file</button>
  </div>
</div>
        `;

        document.body.appendChild(modal);
        enhanceSelect(modal.querySelector('#support-crypto-select'));

        const closeBtn = modal.querySelector('#su-close-modal');
        const chooseBtn = modal.querySelector('#su-choose-btn');
        const fileInput = modal.querySelector('#su-file-input');
        const dropZone = modal.querySelector('#su-drop-zone');

        const closeModal = () => { modal.style.display = 'none'; };
        closeBtn.onclick = closeModal;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        chooseBtn.onclick = () => fileInput.click();
        fileInput.onchange = () => {
            const file = fileInput.files && fileInput.files[0];
            if (file) handleSubtitleFile(file);
        };

        const highlight = (on) => {
            dropZone.style.borderColor = on ? '#22c55e' : 'rgba(255,255,255,0.35)';
            dropZone.style.background = on ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)';
        };

        ;['dragenter','dragover'].forEach(evt => {
            dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                highlight(true);
            });
        });
        ;['dragleave','drop'].forEach(evt => {
            dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                highlight(false);
            });
        });
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (!dt || !dt.files || !dt.files.length) return;
            const file = dt.files[0];
            handleSubtitleFile(file);
        });

        return modal;
    }

    function createSupportModal() {
        const modal = document.createElement('div');
        modal.className = 'subtitle-support-modal';
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.55);
            z-index: 100001;
        `;

        modal.innerHTML = `
<div class="sumodal-card" style="
    width: min(95vw, 380px);
    background: linear-gradient(225deg, rgba(204, 204, 204, 0.18) 0%, #ffffff 0.03%, rgba(46, 133, 121, 0.24) 0.88%, rgba(5, 18, 17, 0.38) 25.56%, rgba(63, 85, 79, 0.29) 37.25%, rgba(15, 26, 22, 0.53) 82.63%, rgba(0, 0, 0, 0.58) 98.5%), linear-gradient(135deg, rgba(204, 204, 204, 0.18) 0%, #ffffff 0.03%, rgba(46, 133, 121, 0.24) 0.88%, rgba(5, 18, 17, 0.38) 25.56%, rgba(63, 85, 79, 0.29) 37.25%, rgba(15, 26, 22, 0.53) 82.63%, rgba(0, 0, 0, 0.58) 98.5%), linear-gradient(270deg, rgba(204, 204, 204, 0.18) 0%, #ffffff 0.03%, rgba(46, 133, 121, 0.24) 0.88%, rgba(5, 18, 17, 0.38) 25.56%, rgba(63, 85, 79, 0.29) 37.25%, rgba(15, 26, 22, 0.53) 82.63%, rgba(0, 0, 0, 0.58) 98.5%);
    color: #fff;
    border-radius: 14px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    padding: 16px;
    font-family: Arial, sans-serif;
    border: 0.5px solid rgba(5, 180, 166, 0.9);
    backdrop-filter: blur(6px);
">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;">
    <h3 style="margin:0;font-size:16px;color:#e5e7eb">💰 Donate Me❤️</h3>
    <button id="support-close" style="background:#303835;border:none;color:#fff;padding:6px 10px;border-radius:8px;cursor:pointer">Close</button>
  </div>
  <div>
    <select id="support-crypto-select" style="width: 100%; margin-bottom: 10px; padding: 8px; color: #fff; border-radius: 8px; background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); backdrop-filter: blur(15px); transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);">
        <option value="">-- Choose --</option>
        ${Object.entries(cryptoAddresses).map(([k, v]) => `<option value="${v}">${k}</option>`).join('')}
    </select>
    <div style="display:flex;gap:4px;align-items:center;margin-top:4px;">
        <input type="text" id="support-crypto-output" readonly placeholder="Selected address" style="flex:1; padding: 8px; color:#fff; border-radius: 8px; background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25);">
        <button id="support-copy" title="Copy" style="background:#303835;border:none;color:#fff;margin-bottom:10px;cursor:pointer; padding:6px 12px; border-radius: 8px;"> copy </button>
    </div>
  </div>
</div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('#support-close');
        const selectEl = modal.querySelector('#support-crypto-select');
        const outputEl = modal.querySelector('#support-crypto-output');
        const copyBtn = modal.querySelector('#support-copy');

        const closeModal = () => { modal.style.display = 'none'; };
        closeBtn.onclick = closeModal;
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        selectEl.onchange = function () {
            outputEl.value = this.value;
        };

        copyBtn.onclick = async () => {
            const out = outputEl.value;
            if (!out) return alert('Please select an address first!🫵🤨');
            try {
                await navigator.clipboard.writeText(out);
                alert('Address copied!❤️');
            } catch (err) {
                const temp = document.createElement('textarea');
                temp.value = out;
                temp.style.position = 'fixed';
                temp.style.left = '-9999px';
                document.body.appendChild(temp);
                temp.select();
                try {
                    const success = document.execCommand('copy');
                    if (success) alert('Address copied!❤️');
                    else throw new Error('execCommand failed');
                } catch (e) {
                    alert('❌ Failed to copy. Please copy manually.');
                }
                document.body.removeChild(temp);
            }
        };

        return modal;
    }

    function enhanceSelect(nativeSelect) {
        if (!nativeSelect) return;
        if (nativeSelect.__enhanced) return;
        nativeSelect.__enhanced = true;

        nativeSelect.classList.add('su-hidden-select');

        const wrap = document.createElement('div');
        wrap.className = 'su-select';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'su-select__button';
        btn.setAttribute('aria-haspopup', 'listbox');
        btn.setAttribute('aria-expanded', 'false');

        const label = document.createElement('span');
        label.textContent = nativeSelect.options[nativeSelect.selectedIndex]?.text || 'Choose';

        const arrow = document.createElement('span');
        arrow.className = 'su-select__arrow';
        arrow.textContent = '▾';

        btn.appendChild(label);
        btn.appendChild(arrow);

        const menu = document.createElement('div');
        menu.className = 'su-select__menu';
        menu.setAttribute('role', 'listbox');
        menu.tabIndex = -1;

        function buildOptions() {
            menu.innerHTML = '';
            Array.from(nativeSelect.options).forEach((opt, idx) => {
                const item = document.createElement('div');
                item.className = 'su-select__option';
                item.setAttribute('role', 'option');
                item.setAttribute('data-value', opt.value);
                item.textContent = opt.text;
                if (idx === nativeSelect.selectedIndex) {
                    item.setAttribute('aria-selected', 'true');
                }
                item.onclick = () => {
                    nativeSelect.value = opt.value;
                    nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    label.textContent = opt.text;
                    closeMenu();
                };
                menu.appendChild(item);
            });
        }

        function openMenu() {
            buildOptions();
            menu.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
            arrow.style.transform = 'rotate(180deg)';
        }
        function closeMenu() {
            menu.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            arrow.style.transform = 'rotate(0deg)';
        }
        function toggleMenu() {
            if (menu.classList.contains('open')) closeMenu(); else openMenu();
        }

        btn.onclick = toggleMenu;
        document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) closeMenu(); });

        // Keyboard accessibility
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); openMenu(); menu.focus();
            }
        });
        menu.addEventListener('keydown', (e) => {
            const options = Array.from(menu.querySelectorAll('.su-select__option'));
            const current = options.findIndex(o => o.getAttribute('aria-selected') === 'true');
            if (e.key === 'Escape') { e.preventDefault(); closeMenu(); btn.focus(); }
            if (e.key === 'ArrowDown') { e.preventDefault(); (options[Math.min(current + 1, options.length - 1)]||{}).focus?.(); }
            if (e.key === 'ArrowUp') { e.preventDefault(); (options[Math.max(current - 1, 0)]||{}).focus?.(); }
            if (e.key === 'Enter') {
                e.preventDefault();
                const focused = document.activeElement?.classList?.contains('su-select__option') ? document.activeElement : options[current];
                focused?.click(); btn.focus();
            }
        });

        nativeSelect.parentElement.insertBefore(wrap, nativeSelect);
        wrap.appendChild(btn);
        wrap.appendChild(menu);
        wrap.appendChild(nativeSelect);

        nativeSelect.addEventListener('change', () => {
            label.textContent = nativeSelect.options[nativeSelect.selectedIndex]?.text || 'Choose';
        });
    }

    function handleSubtitleFile(file) {
        if (!__currentTargetVideo) return;
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            let text = reader.result;
            if (typeof text !== 'string') text = String(text || '');

            if (file.name.toLowerCase().endsWith('.srt')) {
                text = 'WEBVTT\n\n' + text
                    .replace(/\r+/g, '')
                    .replace(/(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g, '$2 --> $3')
                    .replace(/,/g, '.');
            }

            const blob = new Blob([text], { type: 'text/vtt' });
            const url = URL.createObjectURL(blob);
            uploadModal.style.display = 'none';
            attachSubtitle(__currentTargetVideo, url);
            applySettings();
        };
        reader.readAsText(file);
    }

 function applySettings() {
        const size = document.querySelector('#sub-font-size').value || 30;
        const color = document.querySelector('#sub-font-color').value || '#fff';
        const bg = document.querySelector('#sub-bg-color').value || '#000';
        const bgToggle = document.querySelector('#sub-bg-toggle').checked;
        const offsetY = parseFloat(document.querySelector('#sub-offsetY').value || 85);
        const delay = parseInt(document.querySelector('#sub-delay').value || 0);
        const opacity = parseFloat(document.querySelector('#sub-bg-opacity').value || 0.7);
        let fontFamily = (document.querySelector('#sub-font-family')?.value || 'System Default');
        if (fontFamily && fontFamily.startsWith('#_')) fontFamily = fontFamily.replace(/^#_/, '');

        ensureFontLoaded(fontFamily);



        const css = `
/* Hide original subtitles completely */
video::cue, video::-webkit-media-text-track-display, ::cue {
  color: transparent !important;
  background: transparent !important;
  text-shadow: none !important;
  font-size: 0px !important;
}

/* Custom subtitle overlay styles */
.custom-subtitle-overlay {
  position: absolute !important;
  bottom: 85px;
  left: 50% !important;
  transform: translateX(-50%) !important;
  z-index: 100000 !important;
  pointer-events: none !important;
  text-align: center !important;
  max-width: 90% !important;
}

.custom-subtitle-overlay .subtitle-text {
  color: ${color} !important;
  font-size: ${size}px !important;
  ${fontFamily !== 'System Default' ? `font-family: '${fontFamily}', sans-serif !important;` : ''}
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8) !important;
  line-height: 1.4 !important;
  font-weight: 600 !important;
  background-color: ${bgToggle ? hexToRgba(bg, opacity) : 'transparent'} !important;
  border-radius: 35px !important;
  padding: 8px 16px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
  display: inline-block !important;
  margin: 2px !important;
  transition: all 0.3s ease !important;
}
`;
        style.textContent = css;

        // Create custom subtitle overlays for all videos
        setTimeout(() => {
            document.querySelectorAll('video').forEach(video => {
                createCustomSubtitleOverlay(video, color, size, fontFamily, bg, opacity, offsetY);
            });
        }, 100);

        // Helper: stable id for each video
        let __videoIdSeq = 1;
        function ensureVideoId(video) {
            if (!video.dataset.__suId) {
                video.dataset.__suId = String(__videoIdSeq++);
            }
            return video.dataset.__suId;
        }

        function positionOverlayForVideo(video, overlay, offsetY) {
            // If in fullscreen, the video's rect is relative to the viewport.
            // If not, it's relative to the document, so we need scroll offsets.
            const isFull = !!document.fullscreenElement;
            const rect = video.getBoundingClientRect();
            const scrollTop = isFull ? 0 : (window.scrollY || document.documentElement.scrollTop || 0);
            const scrollLeft = isFull ? 0 : (window.scrollX || document.documentElement.scrollLeft || 0);

            const centerX = rect.left + scrollLeft + (rect.width / 2);
            const val = Number(offsetY || 0);
            const isPercent = val >= 0 && val <= 100;
            const padding = 8;
            const innerHeight = Math.max(0, rect.height - 2 * padding);
            const desiredY = isPercent
                ? (rect.bottom + scrollTop - (val / 100) * innerHeight - padding)
                : (rect.bottom + scrollTop - val);
            const minY = rect.top + scrollTop + padding;
            const maxY = rect.bottom + scrollTop - padding;
            const baselineY = Math.max(minY, Math.min(maxY, desiredY));

            // In fullscreen, position is fixed. Otherwise, it's absolute.
            overlay.style.position = isFull ? 'fixed' : 'absolute';
            overlay.style.left = `${centerX}px`;
            overlay.style.top = `${baselineY}px`;
            overlay.style.transform = 'translate(-50%, -100%)';
            const maxW = Math.max(50, Math.floor(rect.width * 0.9));
            overlay.style.maxWidth = `${maxW}px`;
        }

        // Function to create custom subtitle overlay
        function createCustomSubtitleOverlay(video, color, size, fontFamily, bg, opacity, offsetY) {
            const vidId = ensureVideoId(video);
            const existingOverlay = document.querySelector(`.custom-subtitle-overlay[data-video-id="${vidId}"]`);
            if (existingOverlay) existingOverlay.remove();

            const overlay = document.createElement('div');
            overlay.className = 'custom-subtitle-overlay';
            overlay.dataset.videoId = vidId;
            overlay.style.cssText = `
                position: absolute;
                left: 0; top: 0;
                z-index: 100000;
                pointer-events: none;
                text-align: center;
                max-width: 90%;
            `;

            const tracks = video.textTracks;
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                track.addEventListener('cuechange', () => {
                    const activeCues = track.activeCues;
                    if (activeCues && activeCues.length > 0) {
                        const cue = activeCues[0];
                        // *** هنا التعديل: استخدم الدالة الجديدة لتقسيم النص ***
                        const formattedText = formatSubtitleText(cue.text, 8);
                        overlay.innerHTML = `<div class="subtitle-text">${formattedText}</div>`;
                    } else {
                        overlay.innerHTML = '';
                    }
                    positionOverlayForVideo(video, overlay, offsetY);
                });
            }
            try {
                for (let i = 0; i < tracks.length; i++) {
                    const activeCues = tracks[i].activeCues;
                    if (activeCues && activeCues.length > 0) {
                        // *** هنا التعديل أيضاً ***
                        const formattedText = formatSubtitleText(activeCues[0].text, 8);
                        overlay.innerHTML = `<div class="subtitle-text">${formattedText}</div>`;
                        break;
                    }
                }
            } catch (_) {}

            document.body.appendChild(overlay);
            positionOverlayForVideo(video, overlay, offsetY);
        }

        document.querySelector('.manual-subtitle')?.remove();

        document.querySelectorAll('video').forEach(video => {
            const tracks = video.textTracks;
            for (let i = 0; i < tracks.length; i++) {
                try { tracks[i].mode = 'showing'; } catch (_) {}
            }
            const previousDelay = applySettings.__lastDelay;
            const delayChanged = (previousDelay === undefined) || (previousDelay !== delay);
            if(delayChanged) {
                for (let i = 0; i < tracks.length; i++) {
                    const track = tracks[i];
                    for (let j = 0; j < (track.cues?.length || 0); j++) {
                        const cue = track.cues[j];
                        if (!cue.__originalStart) {
                            cue.__originalStart = cue.startTime;
                            cue.__originalEnd = cue.endTime;
                        }
                        cue.startTime = Math.max(0, cue.__originalStart + delay / 1000);
                        cue.endTime = Math.max(0, cue.__originalEnd + delay / 1000);
                    }
                    track.mode = 'disabled';
                    setTimeout(() => { track.mode = 'showing'; }, 10);
                }
            }
            applySettings.__lastDelay = delay;
            video.parentElement?.querySelector('.manual-subtitle')?.remove();
            const overlay = document.querySelector(`.custom-subtitle-overlay[data-video-id="${video.dataset.__suId||''}"]`);
            if (overlay) {
                positionOverlayForVideo(video, overlay, offsetY);
            }
        });

        const realign = () => {
            const fullscreenEl = document.fullscreenElement;
            document.querySelectorAll('.custom-subtitle-overlay').forEach(overlay => {
                const vidId = overlay.getAttribute('data-video-id');
                if (!vidId) return;
                const video = document.querySelector(`video[data-__su-id="${vidId}"]`);
                if (video) {
                    // *** الجزء الأهم في الإصلاح ***
                    // إذا كنا في وضع ملء الشاشة ولم تكن الترجمة بداخله، انقلها
                    if (fullscreenEl && overlay.parentElement !== fullscreenEl) {
                        fullscreenEl.appendChild(overlay);
                        overlay.style.zIndex = '2147483647'; // أعلى z-index ممكن
                    }
                    // إذا خرجنا من وضع ملء الشاشة ولم تكن الترجمة في الصفحة، أعدها
                    else if (!fullscreenEl && overlay.parentElement !== document.body) {
                        document.body.appendChild(overlay);
                        overlay.style.zIndex = '100000'; // z-index الأصلي
                    }

                    const offsetYNow = parseFloat(document.querySelector('#sub-offsetY')?.value || 85);
                    positionOverlayForVideo(video, overlay, offsetYNow);
                }
            });
        };

        // إزالة المستمعين القدامى لتجنب تكرارهم
        if (applySettings.realignHandler) {
             window.removeEventListener('scroll', applySettings.realignHandler);
             window.removeEventListener('resize', applySettings.realignHandler);
             document.removeEventListener('fullscreenchange', applySettings.realignHandler);
        }
        applySettings.realignHandler = realign;

        window.addEventListener('scroll', realign, { passive: true });
        window.addEventListener('resize', realign);
        document.addEventListener('fullscreenchange', realign);
    }

    function ensureFontLoaded(fontFamily) {
        const id = '__su_font__';
        let link = document.getElementById(id);
        if (!fontFamily || fontFamily === 'System Default') {
            if (link) link.remove();
            return;
        }

        const googleMap = {
            'Cairo': 'Cairo:wght@400;600;700',
            'Tajawal': 'Tajawal:wght@400;600;700',
            'Noto Naskh Arabic': 'Noto+Naskh+Arabic:wght@400;600;700',
            'Noto Kufi Arabic': 'Noto+Kufi+Arabic:wght@400;600;700',
            'Amiri': 'Amiri:wght@400;700',
            'Scheherazade New': 'Scheherazade+New:wght@400;700',
            'Markazi Text': 'Markazi+Text:wght@400;600;700',
            'El Messiri': 'El+Messiri:wght@400;600;700',
            'Reem Kufi': 'Reem+Kufi:wght@400;600;700',
            'Changa': 'Changa:wght@400;600;700',
            'Harmattan': 'Harmattan:wght@400;700',
            'Mada': 'Mada:wght@400;700',
            'IBM Plex Sans Arabic': 'IBM+Plex+Sans+Arabic:wght@400;600;700',
            'Almarai': 'Almarai:wght@400;700',
            'Roboto': 'Roboto:wght@400;700',
            'Inter': 'Inter:wght@400;700'
        };
        const gf = googleMap[fontFamily];
        if (!gf) {
            if (link) link.remove();
            return;
        }
        const href = `https://fonts.googleapis.com/css2?family=${gf}&display=swap`;
        if (link && link.getAttribute('href') === href) return;
        if (link) link.remove();
        link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }


    function formatSubtitleText(text, maxWordsPerLine) {
        if (!text) return '';
        const words = text.trim().split(/\s+/); // تقسيم النص إلى كلمات

        // إذا كان عدد الكلمات أقل من الحد الأقصى، لا تفعل شيئاً
        if (words.length <= maxWordsPerLine) {
            return text;
        }

        const lines = [];
        let currentLine = '';

        for (const word of words) {
            // تحقق مما إذا كان السطر الحالي + الكلمة الجديدة سيتجاوز الحد
            const tempLine = currentLine ? `${currentLine} ${word}` : word;
            if (tempLine.split(' ').length <= maxWordsPerLine) {
                currentLine = tempLine;
            } else {
                // إذا تجاوز الحد، أضف السطر الحالي إلى القائمة وابدأ سطراً جديداً
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine); // أضف السطر الأخير المتبقي

        return lines.join('<br>'); // ادمج الأسطر مع فاصل HTML للنزول سطراً
    }

    function saveSettings() {
        const current = {
            fontSize: document.querySelector('#sub-font-size').value || 30,
            fontColor: document.querySelector('#sub-font-color').value || '#fff',
            bgColor: document.querySelector('#sub-bg-color').value || '#000',
            bgToggle: document.querySelector('#sub-bg-toggle').checked,
            offsetY: document.querySelector('#sub-offsetY').value || 85,
            delay: parseInt(document.querySelector('#sub-delay').value || 0),
            bgOpacity: parseFloat(document.querySelector('#sub-bg-opacity').value || 0.7),
            fontFamily: document.querySelector('#sub-font-family')?.value || 'System Default',

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
