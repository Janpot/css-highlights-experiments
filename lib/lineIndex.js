export function computeLineStarts(code) {
  const starts = [0];
  for (let i = 0; i < code.length; i++) {
    if (code.charCodeAt(i) === 10) starts.push(i + 1);
  }
  return starts;
}

export function visibleOffsetWindow(codeEl, lineStarts, buffer = 30) {
  const rect = codeEl.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const lh = parseFloat(getComputedStyle(codeEl).lineHeight) || 16;

  const firstVisibleY = Math.max(0, -rect.top);
  const lastVisibleY = Math.min(rect.height, vh - rect.top);

  if (lastVisibleY < 0 || firstVisibleY > rect.height) return [0, 0];

  const firstLine = Math.max(0, Math.floor(firstVisibleY / lh) - buffer);
  const lastLine = Math.min(
    lineStarts.length - 1,
    Math.ceil(lastVisibleY / lh) + buffer,
  );
  if (lastLine < firstLine) return [0, 0];
  const startOffset = lineStarts[firstLine];
  const endOffset =
    lastLine + 1 < lineStarts.length ? lineStarts[lastLine + 1] : Infinity;
  return [startOffset, endOffset];
}
