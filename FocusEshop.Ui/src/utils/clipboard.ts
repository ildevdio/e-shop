export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // continua para o fallback
  }
  try {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'absolute';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    const selecionado = document.getSelection();
    const selecaoAnterior = selecionado ? selecionado.rangeCount > 0 && selecionado.getRangeAt(0) : false;
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    if (selecaoAnterior && selecionado) {
      selecionado.removeAllRanges();
      selecionado.addRange(selecaoAnterior as Range);
    }
    return ok;
  } catch {
    return false;
  }
}