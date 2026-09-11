export async function resizeImage(file: File, maxDim = 1200, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      if (scale === 1) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }

      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas indisponível'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);

      const isPng = file.type === 'image/png';
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Não foi possível gerar a imagem'));
          return;
        }
        const ext = isPng ? 'png' : 'jpg';
        const nome = (file.name.replace(/\.[^.]+$/, '') || 'imagem') + '.' + ext;
        resolve(new File([blob], nome, { type: isPng ? 'image/png' : 'image/jpeg' }));
      }, isPng ? 'image/png' : 'image/jpeg', quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Imagem inválida'));
    };

    img.src = url;
  });
}
