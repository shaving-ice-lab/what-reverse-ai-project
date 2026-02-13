/**
 * Sandbox Template — generates the srcdoc HTML for the iframe sandbox.
 * The iframe runs user-provided React/JS code in a sandboxed environment.
 */

export function generateSandboxHTML(theme: 'light' | 'dark' = 'light'): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  body { padding: 8px; }
  [data-theme="dark"] body { background: #0a0a0a; color: #e5e5e5; }
  [data-theme="light"] body { background: #fff; color: #171717; }
  #root { width: 100%; }
  .sandbox-error {
    padding: 12px 16px; margin: 8px 0; border-radius: 6px;
    background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
    font-size: 13px; white-space: pre-wrap; word-break: break-word;
  }
  [data-theme="dark"] .sandbox-error {
    background: #1c0a0a; border-color: #7f1d1d; color: #fca5a5;
  }
</style>
</head>
<body>
<div id="root"></div>
<script>
(function() {
  'use strict';

  var rootEl = document.getElementById('root');
  var initialized = false;

  function sendMsg(msg) {
    msg.__sandbox = true;
    window.parent.postMessage(JSON.stringify(msg), '*');
  }

  function showError(message, stack) {
    rootEl.innerHTML = '<div class="sandbox-error"><b>Error:</b> ' +
      escapeHtml(message) + (stack ? '\\n\\n' + escapeHtml(stack) : '') + '</div>';
    sendMsg({ type: 'ERROR', message: message, stack: stack || '' });
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function resizeObserve() {
    try {
      var ro = new ResizeObserver(function(entries) {
        for (var e of entries) {
          sendMsg({ type: 'RESIZE', height: Math.ceil(e.contentRect.height) + 16 });
        }
      });
      ro.observe(rootEl);
    } catch(e) {}
  }

  window.addEventListener('message', function(event) {
    try {
      var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (!data || !data.__sandbox) return;

      if (data.type === 'INIT') {
        initialized = true;
        try {
          var module = { exports: {} };
          var fn = new Function('module', 'exports', 'ROOT', 'DATA', data.code);
          fn(module, module.exports, rootEl, data.data || {});
          sendMsg({ type: 'RENDER_COMPLETE', height: rootEl.scrollHeight + 16 });
          resizeObserve();
        } catch(e) {
          showError(e.message, e.stack);
        }
      }

      if (data.type === 'UPDATE_DATA' && initialized) {
        var updateEvent = new CustomEvent('sandbox-data-update', { detail: data.data });
        rootEl.dispatchEvent(updateEvent);
      }
    } catch(e) {
      showError('Message parse error: ' + e.message);
    }
  });

  window.onerror = function(msg, src, line, col, err) {
    showError(msg, err ? err.stack : 'Line ' + line);
  };

  sendMsg({ type: 'READY' });
})();
</script>
</body>
</html>`;
}
