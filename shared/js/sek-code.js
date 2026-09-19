/**
 * SEK Code Engine — Universal Student Save & Verification Code System
 * Compresses student name, class, stars, tickets and answers into a compact code.
 * Zero database, zero external dependencies, 100% offline.
 */
(function(window) {
  'use strict';

  class SekCodeEngine {
    constructor() {
      this.prefix = 'SEK7K-';
    }

    // Simple robust checksum to detect copy/paste truncation
    _checksum(str) {
      let hash = 0x811c9dc5;
      for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = (hash * 0x01000193) >>> 0;
      }
      return hash.toString(36).padStart(6, '0').slice(-4);
    }

    encode(payload) {
      try {
        const jsonStr = JSON.stringify(payload);
        // Base64 encode with unicode support
        const utf8Bytes = new TextEncoder().encode(jsonStr);
        let binary = '';
        for (let i = 0; i < utf8Bytes.length; i++) {
          binary += String.fromCharCode(utf8Bytes[i]);
        }
        const b64 = btoa(binary)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        const sum = this._checksum(b64);
        return `${this.prefix}${sum}-${b64}`;
      } catch (e) {
        console.error('Encoding error:', e);
        return null;
      }
    }

    decode(codeStr) {
      if (!codeStr || typeof codeStr !== 'string') return { ok: false, error: 'Empty code' };
      const clean = codeStr.trim();
      if (!clean.startsWith(this.prefix)) {
        return { ok: false, error: 'Invalid code prefix (not a SEK code)' };
      }

      const rest = clean.slice(this.prefix.length);
      const dashIdx = rest.indexOf('-');
      if (dashIdx === -1) return { ok: false, error: 'Malformed code format' };

      const expectedSum = rest.slice(0, dashIdx);
      const b64 = rest.slice(dashIdx + 1);

      if (this._checksum(b64) !== expectedSum) {
        return { ok: false, error: 'Checksum mismatch (code is truncated or altered)' };
      }

      try {
        let normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
        while (normalized.length % 4 !== 0) normalized += '=';
        const binary = atob(normalized);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const jsonStr = new TextDecoder().decode(bytes);
        const data = JSON.parse(jsonStr);
        return { ok: true, data: data };
      } catch (e) {
        return { ok: false, error: 'Failed to unpack code data' };
      }
    }

    // Modal dialog to let teacher paste student code and inspect it
    showTeacherModal(onLoadStudentData) {
      let modal = document.getElementById('sek-teacher-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sek-teacher-modal';
        modal.style.cssText = `
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(11, 15, 23, 0.85); backdrop-filter: blur(8px);
          display: grid; place-items: center; padding: 20px;
        `;
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div style="background: var(--surface, #131a26); border: 1px solid var(--line-2, #34435e); border-radius: 12px; max-width: 560px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); overflow: hidden; color: var(--ink, #f3f4f6); font-family: var(--font-body, sans-serif);">
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--line, #242f42); background: var(--surface-2, #1b2434); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 17px; font-family: var(--font-display, sans-serif); font-weight: 700;">👩‍🏫 Teacher Code Inspector</h3>
            <button id="sek-modal-close" style="background:none; border:none; color:var(--ink-2, #9ca3af); font-size:20px; cursor:pointer;">&times;</button>
          </div>
          <div style="padding: 20px;">
            <p style="margin: 0 0 12px; font-size: 14px; color: var(--ink-2, #9ca3af);">Paste the student code from Google Classroom or email to inspect their score and restore their attempt:</p>
            <textarea id="sek-teacher-input" placeholder="SEK7K-a1b2-eyJ..." style="width: 100%; height: 90px; padding: 10px; font-family: var(--font-mono, monospace); font-size: 12px; background: var(--ground, #0b0f17); border: 1px solid var(--line, #242f42); border-radius: 6px; color: var(--ink, #f3f4f6); resize: vertical; box-sizing: border-box;"></textarea>
            <div id="sek-teacher-result" style="margin-top: 14px; display: none; padding: 12px; border-radius: 6px; font-size: 13.5px;"></div>
            <div style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
              <button id="sek-teacher-decode-btn" class="btn btn-primary" style="padding: 8px 16px;">Inspect Code</button>
            </div>
          </div>
        </div>
      `;

      modal.style.display = 'grid';

      const closeBtn = modal.querySelector('#sek-modal-close');
      const input = modal.querySelector('#sek-teacher-input');
      const resultBox = modal.querySelector('#sek-teacher-result');
      const decodeBtn = modal.querySelector('#sek-teacher-decode-btn');

      closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

      decodeBtn.addEventListener('click', () => {
        const raw = input.value.trim();
        const res = this.decode(raw);
        resultBox.style.display = 'block';

        if (!res.ok) {
          resultBox.style.background = 'var(--danger-soft, #381414)';
          resultBox.style.color = 'var(--danger, #f87171)';
          resultBox.style.border = '1px solid var(--danger, #f87171)';
          resultBox.innerHTML = `<strong>⚠️ Error:</strong> ${res.error}`;
        } else {
          const d = res.data;
          resultBox.style.background = 'var(--ok-soft, #0d3324)';
          resultBox.style.color = 'var(--ok, #34d399)';
          resultBox.style.border = '1px solid var(--ok, #34d399)';
          resultBox.innerHTML = `
            <div style="font-weight: 700; font-size: 15px; margin-bottom: 6px;">✅ Verified Student Submission:</div>
            <div><strong>Student:</strong> ${d.name || 'Anonymous'} (Class: ${d.klass || '—'})</div>
            <div><strong>Stars Earned:</strong> ⭐ ${d.stars || 0}</div>
            <div><strong>Tasks / Tickets Done:</strong> ${Array.isArray(d.done) ? d.done.length : 0}</div>
            <div style="margin-top: 10px;">
              <button id="sek-restore-btn" class="btn btn-success" style="padding: 6px 12px; font-size: 12px;">Restore Student Work</button>
            </div>
          `;

          const restoreBtn = resultBox.querySelector('#sek-restore-btn');
          if (restoreBtn && typeof onLoadStudentData === 'function') {
            restoreBtn.addEventListener('click', () => {
              onLoadStudentData(d);
              modal.style.display = 'none';
            });
          }
        }
      });
    }
  }

  window.sekCode = new SekCodeEngine();
})(window);
