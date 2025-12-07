import * as THREE from 'three';

export const createLoveLetterTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1448; // ~A4 Ratio
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  // 1. Paper Background (Aged Beige)
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#f5e6c8');
  gradient.addColorStop(0.5, '#e8d5b5');
  gradient.addColorStop(1, '#d4c09e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Add some "Texture" / Noise / Stains
  ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 100 + 20;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(160, 120, 80, ${Math.random() * 0.05})`;
    ctx.fill();
  }

  // Coffee Ring Stain
  ctx.strokeStyle = 'rgba(120, 90, 60, 0.15)';
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.arc(canvas.width * 0.8, canvas.height * 0.2, 120, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Text
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#3e2b26'; // Dark faded ink
  ctx.font = 'italic 48px "Times New Roman", serif';
  ctx.textAlign = 'center';
  
  // Header
  ctx.fillText('My Dearest Elara,', canvas.width / 2, 150);
  
  // Body text lines
  ctx.font = 'italic 32px "Times New Roman", serif';
  ctx.textAlign = 'left';
  const startX = 120;
  let startY = 250;
  const lineHeight = 50;

  const lines = [
    "I write this to you as the autumn leaves begin to fall,",
    "reminding me of the time we first met by the old oak tree.",
    "Though oceans may divide us now, my heart remains",
    "anchored to the memory of your smile.",
    "",
    "Every day without you feels like a page torn from a book,",
    "incomplete and longing for its resolution. I dream of",
    "the day I can return to your embrace.",
    "",
    "Please wait for me. The war cannot last forever,",
    "but my love for you shall outlast the stars themselves.",
    "",
    "Yours eternally,",
    "Arthur"
  ];

  lines.forEach((line) => {
    // Add slight random jitter to resemble handwriting
    const jitterY = (Math.random() - 0.5) * 2; 
    ctx.fillText(line, startX, startY + jitterY);
    startY += lineHeight;
  });

  // Date at top right
  ctx.font = '24px "Times New Roman", serif';
  ctx.fillText('October 14th, 1942', canvas.width - 300, 80);

  // 4. Edges (Darkening)
  ctx.globalCompositeOperation = 'multiply';
  const vignette = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.8
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(80,60,40,0.3)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};
