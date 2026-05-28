/**
 * Capture WebGL canvas and composite it into a branded social sharing card.
 * @param {WebGLRenderingContext} gl - WebGL context from R3F
 * @param {string} blessingText - The blessing submitted by the user
 */
export function captureBrandedCard(gl, blessingText) {
  if (!gl || !gl.domElement) {
    console.error("WebGL context not available for capture.");
    return;
  }

  // 1. Extract raw image from WebGL canvas
  // preserveDrawingBuffer: true must be set on the canvas
  const webglDataUrl = gl.domElement.toDataURL('image/png');

  // 2. Setup high-resolution 2D offscreen canvas (1200 x 630 - standard OG card size)
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.src = webglDataUrl;
  
  img.onload = () => {
    // A. Draw background 3D scene
    // We scale/crop to fit the 1200x630 box nicely
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;
    ctx.drawImage(img, x, y, w, h);

    // B. Add glassmorphic backdrop panel overlay at the bottom
    // Dark transparent wash
    const gradient = ctx.createLinearGradient(0, 420, 0, 630);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
    gradient.addColorStop(0.3, 'rgba(10, 5, 0, 0.75)');
    gradient.addColorStop(1, 'rgba(15, 8, 2, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 400, 1200, 230);

    // Subtle gold divider line
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'; // Gold border
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 480);
    ctx.lineTo(1100, 480);
    ctx.stroke();

    // C. Draw Custom Lantern Blessing Text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff8e7'; // Warm paper cream
    
    // Fit text size dynamically depending on length
    const displayBlessing = blessingText && blessingText.trim() !== '' 
      ? `"${blessingText.trim()}"` 
      : '"May all beings be well, happy, and peaceful."';
      
    if (displayBlessing.length > 50) {
      ctx.font = 'italic 26px "Cinzel", "Times New Roman", serif';
    } else {
      ctx.font = 'italic 34px "Cinzel", "Times New Roman", serif';
    }
    
    ctx.fillText(displayBlessing, 600, 460);

    // D. Ceylon X Signature & Watermark
    ctx.font = 'bold 20px "Inter", "Helvetica Neue", sans-serif';
    ctx.fillStyle = '#f59e0b'; // Ceylon X Gold
    ctx.fillText('CEYLON X CORPORATION', 600, 520);

    ctx.font = '15px "Inter", "Helvetica Neue", sans-serif';
    ctx.fillStyle = 'rgba(255, 248, 231, 0.7)';
    ctx.fillText('Engineered by Ceylon X Corporation — Drive Your Business Growth at ceylonx.co', 600, 555);

    // E. Save/Download File Trigger
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `ceylonx-vesak-blessing-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  img.onerror = (err) => {
    console.error("Failed to load WebGL image buffer.", err);
  };
}
