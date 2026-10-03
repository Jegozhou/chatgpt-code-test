function headerValue(headers, name) {
  if (!headers) return '';
  if (typeof headers.get === 'function') return headers.get(name) || '';
  const direct = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  return Array.isArray(direct) ? direct[0] || '' : direct || '';
}

export function resolveOnlineDeviceId(headers) {
  const value = String(headerValue(headers, 'x-zlbx-device-id')).trim();
  if (!value) throw new TypeError('Browser device id is required');
  if (value.length > 160) throw new TypeError('Browser device id is invalid');
  return value;
}

export function resolveOnlinePath(rawUrl = '/') {
  const url = new URL(rawUrl, 'https://workbench.local');
  const rewritten = url.searchParams.get('path');
  if (rewritten) return `/api/${rewritten.replace(/^\/+/, '')}`;
  return url.pathname;
}
