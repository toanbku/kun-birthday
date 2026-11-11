/* ============================================================
   Thiệp thôi nôi · Kun
   Thiệp được vẽ hoàn toàn bằng canvas (1080 × 1620), xuất PNG.
   ============================================================ */
(() => {
  'use strict';

  const W = 1080;
  const H = 1620;
  const TAU = Math.PI * 2;

  /* ---------------------------------------------------------- */
  /*  Bảng màu                                                  */
  /* ---------------------------------------------------------- */

  const PALETTES = {
    choco: {
      bg: '#f8ebd2',
      ink: '#6b4a2c',
      inkDeep: '#553a20',
      inkSoft: '#96714c',
      line: '#c9a268',
      accent: '#e9d3ac',
      accentStrong: '#d7b57f',
      panel: '#fff8e8',
      panelDeep: '#f7e4c2',
      halo: '#fffbf0',
      star: '#e9c68c',
      heart: '#c08e57',
      gingham: '#d6b583',
      icon: '#7b5634',
      tint: '#f3d9ae',
    },
    blush: {
      bg: '#fbeae4',
      ink: '#8a4b44',
      inkDeep: '#713731',
      inkSoft: '#b0837a',
      line: '#d9a396',
      accent: '#f0cbbf',
      accentStrong: '#e3b3a7',
      panel: '#fff7f3',
      panelDeep: '#f8e1da',
      halo: '#fffaf7',
      star: '#ecc2b2',
      heart: '#c98d80',
      gingham: '#e2b8ac',
      icon: '#8a4b44',
      tint: '#f6d9cf',
    },
    sage: {
      bg: '#edf1e5',
      ink: '#4e6047',
      inkDeep: '#3c4c37',
      inkSoft: '#7c8e73',
      line: '#a9be99',
      accent: '#d5e1c7',
      accentStrong: '#c2d2b3',
      panel: '#fbfcf6',
      panelDeep: '#e8efdd',
      halo: '#fdfdf8',
      star: '#c6d5b4',
      heart: '#8fa57f',
      gingham: '#bccca9',
      icon: '#4e6047',
      tint: '#dde8ce',
    },
  };

  const BUMPS = [
    { x0: 0, x1: 168, ry: 54 },
    { x0: 168, x1: 300, ry: 26 },
    { x0: 300, x1: 545, ry: 66 },
    { x0: 545, x1: 700, ry: 30 },
    { x0: 700, x1: 918, ry: 60 },
    { x0: 918, x1: 1080, ry: 28 },
  ];

  const PANEL_BASE = 856;

  /* ---------------------------------------------------------- */
  /*  Trạng thái                                                */
  /* ---------------------------------------------------------- */

  const DEFAULT_PHOTO = window.KUN_PHOTO || 'assets/photos/kun.jpg';

  const DEFAULTS = {
    name: 'Quang Kiên',
    nick: 'Kun',
    topLine: 'Our little boy is turning',
    bigWord: 'One',
    weekday: 'Thứ Bảy',
    date: '21/11/2026',
    time: '18h30',
    venue: 'Nhà hàng Sesan',
    address: '14 Einstein, Phường Thủ Đức, TP. HCM',
    mapUrl: 'https://maps.app.goo.gl/gGGnM8rQbvfBHXBWA?g_st=iz',
    guestLabel: 'Kính mời',
    guest: 'Quý khách',
    kicker: 'Tham dự buổi tiệc thôi nôi cùng bé',
    message: 'Sự hiện diện của quý khách là niềm vui lớn của gia đình!',
    farewell: 'Rất hân hạnh được đón tiếp!',
    guestList: '',
    palette: 'choco',
    photo: null,
    photoZoom: 1,
    photoY: 0.4,
  };

  const KEY = 'kun-thiep-v1';
  const state = { ...DEFAULTS };

  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch (_) {
    saved = null;
  }
  if (saved && typeof saved === 'object') Object.assign(state, saved);
  if (state.time === '19h00') state.time = '18h30';
  if (state.kicker === 'đến dự buổi tiệc thôi nôi cùng bé') state.kicker = 'Tham dự buổi tiệc thôi nôi cùng bé';
  if (!state.photo) state.photo = DEFAULT_PHOTO;
  state.photoZoom = Number(state.photoZoom) || 1;
  state.photoY = state.photoY === undefined ? 0.4 : Number(state.photoY);
  if (!PALETTES[state.palette]) state.palette = 'choco';

  let img = null;
  let lsOK = null;
  let exportScale = 1;
  let rafId = 0;

  /* ---------------------------------------------------------- */
  /*  Tiện ích vẽ                                               */
  /* ---------------------------------------------------------- */

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function circle(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
  }

  function ellipse(ctx, cx, cy, rx, ry, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot, 0, TAU);
  }

  function archPath(ctx, x, y, w, h) {
    const r = w / 2;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arc(x + w / 2, y + r, r, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  }

  function panelPath(ctx, baseY, inset, bottomY) {
    const top = baseY + inset * 0.35;
    const span = W - inset * 2;
    ctx.beginPath();
    ctx.moveTo(inset, bottomY);
    ctx.lineTo(inset, top);
    for (const b of BUMPS) {
      const cx = inset + (((b.x0 + b.x1) / 2) / W) * span;
      const rx = (((b.x1 - b.x0) / 2) / W) * span;
      ctx.ellipse(cx, top, rx, b.ry, 0, Math.PI, Math.PI * 2);
    }
    ctx.lineTo(W - inset, bottomY);
    ctx.closePath();
  }

  function setLS(ctx, v) {
    if (lsOK === null) lsOK = 'letterSpacing' in ctx;
    if (lsOK) ctx.letterSpacing = v;
  }

  function fitSize(ctx, text, maxW, fontFn, start, min) {
    let s = start;
    ctx.font = fontFn(s);
    let guard = 0;
    while (s > min && ctx.measureText(text).width > maxW && guard++ < 120) {
      s -= 2;
      ctx.font = fontFn(s);
    }
    return s;
  }

  function wrapText(ctx, text, maxW) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  /* ---------------------------------------------------------- */
  /*  Hình vẽ trang trí                                         */
  /* ---------------------------------------------------------- */

  function heartPath(ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.36);
    ctx.bezierCurveTo(cx - s * 0.74, cy - s * 0.14, cx - s * 0.46, cy - s * 0.63, cx - s * 0.14, cy - s * 0.45);
    ctx.bezierCurveTo(cx - s * 0.05, cy - s * 0.4, cx, cy - s * 0.32, cx, cy - s * 0.26);
    ctx.bezierCurveTo(cx, cy - s * 0.32, cx + s * 0.05, cy - s * 0.4, cx + s * 0.14, cy - s * 0.45);
    ctx.bezierCurveTo(cx + s * 0.46, cy - s * 0.63, cx + s * 0.74, cy - s * 0.14, cx, cy + s * 0.36);
    ctx.closePath();
  }

  function starPath(ctx, cx, cy, r, rot = -Math.PI / 2) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r * 0.44 : r;
      const a = rot + (i * Math.PI) / 5;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function crownPath(ctx, cx, bottomY, w, h) {
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, bottomY);
    ctx.lineTo(cx - w / 2, bottomY - h * 0.5);
    ctx.lineTo(cx - w * 0.24, bottomY - h * 0.16);
    ctx.lineTo(cx, bottomY - h);
    ctx.lineTo(cx + w * 0.24, bottomY - h * 0.16);
    ctx.lineTo(cx + w / 2, bottomY - h * 0.5);
    ctx.lineTo(cx + w / 2, bottomY);
    ctx.closePath();
  }

  function drawCrown(ctx, cx, bottomY, w, h, color, rot = 0) {
    ctx.save();
    ctx.translate(cx, bottomY);
    ctx.rotate(rot);
    ctx.translate(-cx, -bottomY);
    crownPath(ctx, cx, bottomY - h * 0.24, w, h * 0.76);
    ctx.fillStyle = color;
    ctx.lineJoin = 'round';
    ctx.lineWidth = w * 0.08;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.fill();
    // vành mũ
    roundRect(ctx, cx - w / 2, bottomY - h * 0.3, w, h * 0.3, h * 0.12);
    ctx.fill();
    ctx.restore();

    const tip = w * 0.055;
    ctx.fillStyle = color;
    circle(ctx, cx, bottomY - h, tip);
    ctx.fill();
  }

  function iconCalendar(ctx, cx, cy, s, color) {
    const w = s * 0.86;
    const h = s * 0.8;
    const x = cx - w / 2;
    const y = cy - h * 0.44;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, s * 0.075);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    roundRect(ctx, x, y, w, h, s * 0.14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.3);
    ctx.lineTo(x + w, y + h * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.27, y - s * 0.1);
    ctx.lineTo(x + w * 0.27, y + h * 0.14);
    ctx.moveTo(x + w * 0.73, y - s * 0.1);
    ctx.lineTo(x + w * 0.73, y + h * 0.14);
    ctx.stroke();
    ctx.fillStyle = color;
    const dots = [0.3, 0.5, 0.7];
    for (let r = 0; r < 2; r++) {
      for (const dx of dots) {
        circle(ctx, x + w * dx, y + h * (0.55 + r * 0.22), s * 0.035);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function iconClock(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, s * 0.078);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    circle(ctx, cx, cy, s * 0.42);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.24);
    ctx.lineTo(cx, cy + s * 0.02);
    ctx.lineTo(cx + s * 0.17, cy + s * 0.14);
    ctx.stroke();
    ctx.restore();
  }

  function pinPath(ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.46);
    ctx.bezierCurveTo(cx - s * 0.3, cy + s * 0.1, cx - s * 0.36, cy - s * 0.06, cx - s * 0.36, cy - s * 0.16);
    ctx.bezierCurveTo(cx - s * 0.36, cy - s * 0.44, cx - s * 0.2, cy - s * 0.58, cx, cy - s * 0.58);
    ctx.bezierCurveTo(cx + s * 0.2, cy - s * 0.58, cx + s * 0.36, cy - s * 0.44, cx + s * 0.36, cy - s * 0.16);
    ctx.bezierCurveTo(cx + s * 0.36, cy - s * 0.06, cx + s * 0.3, cy + s * 0.1, cx, cy + s * 0.46);
    ctx.closePath();
  }

  function iconPin(ctx, cx, cy, s, color, hole) {
    ctx.save();
    pinPath(ctx, cx, cy, s);
    ctx.fillStyle = color;
    ctx.fill();
    if (hole) {
      ctx.globalCompositeOperation = 'destination-out';
      circle(ctx, cx, cy - s * 0.18, s * 0.125);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = color;
      circle(ctx, cx, cy - s * 0.18, s * 0.125);
      ctx.lineWidth = s * 0.06;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
    ctx.restore();
  }

  function googlePin(ctx, cx, cy, s) {
    ctx.save();
    pinPath(ctx, cx, cy, s);
    ctx.clip();
    const r = s * 0.9;
    ctx.fillStyle = '#34a853';
    ctx.fillRect(cx - r, cy - r, r, r);
    ctx.fillStyle = '#fbbc05';
    ctx.fillRect(cx, cy - r, r, r);
    ctx.fillStyle = '#4285f4';
    ctx.fillRect(cx - r, cy, r, r);
    ctx.fillStyle = '#ea4335';
    ctx.fillRect(cx, cy, r, r);
    ctx.restore();
    ctx.fillStyle = '#fffdf7';
    circle(ctx, cx, cy - s * 0.17, s * 0.14);
    ctx.fill();
  }

  function iconCar(ctx, x, y, w, color) {
    const u = w / 100;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.4 * u;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // thân xe
    ctx.beginPath();
    ctx.moveTo(6 * u, 34 * u);
    ctx.quadraticCurveTo(3 * u, 27 * u, 11 * u, 24 * u);
    ctx.lineTo(30 * u, 22 * u);
    ctx.quadraticCurveTo(35 * u, 10 * u, 48 * u, 10 * u);
    ctx.lineTo(60 * u, 10 * u);
    ctx.quadraticCurveTo(72 * u, 10 * u, 78 * u, 22 * u);
    ctx.lineTo(90 * u, 25 * u);
    ctx.quadraticCurveTo(97 * u, 27 * u, 95 * u, 34 * u);
    ctx.lineTo(6 * u, 34 * u);
    ctx.closePath();
    ctx.stroke();

    // kính
    ctx.beginPath();
    ctx.moveTo(53 * u, 13 * u);
    ctx.lineTo(53 * u, 22 * u);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(33 * u, 22 * u);
    ctx.lineTo(76 * u, 22 * u);
    ctx.stroke();

    // bánh
    const wheel = (wx) => {
      circle(ctx, wx, 34 * u, 8.5 * u);
      ctx.fillStyle = '#fffdf7';
      ctx.fill();
      ctx.stroke();
      circle(ctx, wx, 34 * u, 3 * u);
      ctx.stroke();
    };
    wheel(29 * u);
    wheel(72 * u);

    // đèn
    ctx.beginPath();
    ctx.moveTo(9 * u, 27 * u);
    ctx.quadraticCurveTo(7 * u, 29 * u, 9 * u, 32 * u);
    ctx.stroke();
    ctx.restore();
  }

  function cursorPath(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(s * 0.28, s * 0.74);
    ctx.lineTo(s * 0.48, s * 1.12);
    ctx.lineTo(s * 0.63, s * 1.04);
    ctx.lineTo(s * 0.44, s * 0.68);
    ctx.lineTo(s * 0.76, s * 0.64);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  /* ------------------------------------------------ gấu bông */

  function drawTeddy(ctx, cx, bottom, h, c) {
    const u = h;
    const headR = u * 0.212;
    const headY = bottom - u * 0.7;
    const bodyY = bottom - u * 0.29;
    const bw = u * 0.232;
    const bh = u * 0.222;

    const silhouette = (fill) => {
      ctx.fillStyle = fill;
      ellipse(ctx, cx - u * 0.163, headY - u * 0.152, u * 0.088, u * 0.086);
      ctx.fill();
      ellipse(ctx, cx + u * 0.163, headY - u * 0.152, u * 0.088, u * 0.086);
      ctx.fill();
      ellipse(ctx, cx - u * 0.212, bodyY - u * 0.055, u * 0.078, u * 0.104, 0.22);
      ctx.fill();
      ellipse(ctx, cx + u * 0.212, bodyY - u * 0.055, u * 0.078, u * 0.104, -0.22);
      ctx.fill();
      ellipse(ctx, cx - u * 0.125, bottom - u * 0.062, u * 0.108, u * 0.082);
      ctx.fill();
      ellipse(ctx, cx + u * 0.125, bottom - u * 0.062, u * 0.108, u * 0.082);
      ctx.fill();
      ellipse(ctx, cx, bodyY, bw, bh);
      ctx.fill();
      circle(ctx, cx, headY, headR);
      ctx.fill();
    };

    // bóng đổ
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#4a2f18';
    ellipse(ctx, cx, bottom - u * 0.012, u * 0.27, u * 0.022);
    ctx.fill();
    ctx.restore();

    // viền sticker
    ctx.save();
    ctx.translate(cx, bottom);
    ctx.scale(1.06, 1.06);
    ctx.translate(-cx, -bottom);
    silhouette(c.halo);
    ctx.restore();

    silhouette(c.fur);

    // tai trong
    ctx.fillStyle = c.muzzle;
    ellipse(ctx, cx - u * 0.163, headY - u * 0.152, u * 0.044, u * 0.043);
    ctx.fill();
    ellipse(ctx, cx + u * 0.163, headY - u * 0.152, u * 0.044, u * 0.043);
    ctx.fill();

    // bụng
    ctx.fillStyle = 'rgba(255, 247, 231, .38)';
    ellipse(ctx, cx, bodyY + u * 0.015, bw * 0.6, bh * 0.6);
    ctx.fill();

    // mõm
    ctx.fillStyle = c.muzzle;
    ellipse(ctx, cx, headY + u * 0.058, u * 0.105, u * 0.08);
    ctx.fill();

    // mũi
    ctx.fillStyle = c.nose;
    ellipse(ctx, cx, headY + u * 0.008, u * 0.036, u * 0.026);
    ctx.fill();

    // miệng
    ctx.strokeStyle = c.nose;
    ctx.lineWidth = u * 0.012;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, headY + u * 0.032);
    ctx.quadraticCurveTo(cx - u * 0.008, headY + u * 0.062, cx - u * 0.038, headY + u * 0.056);
    ctx.moveTo(cx, headY + u * 0.032);
    ctx.quadraticCurveTo(cx + u * 0.008, headY + u * 0.062, cx + u * 0.038, headY + u * 0.056);
    ctx.stroke();

    // mắt
    ctx.fillStyle = c.nose;
    circle(ctx, cx - u * 0.082, headY - u * 0.032, u * 0.019);
    ctx.fill();
    circle(ctx, cx + u * 0.082, headY - u * 0.032, u * 0.019);
    ctx.fill();

    // nơ cổ
    const by = headY + headR * 1.1;
    const bwid = u * 0.082;
    ctx.fillStyle = c.bow;
    ctx.beginPath();
    ctx.moveTo(cx, by);
    ctx.lineTo(cx - bwid, by - bwid * 0.66);
    ctx.lineTo(cx - bwid, by + bwid * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, by);
    ctx.lineTo(cx + bwid, by - bwid * 0.66);
    ctx.lineTo(cx + bwid, by + bwid * 0.66);
    ctx.closePath();
    ctx.fill();
    circle(ctx, cx, by, u * 0.022);
    ctx.fill();
  }

  /* ---------------------------------------------------------- */
  /*  Ảnh                                                       */
  /* ---------------------------------------------------------- */

  function drawPhotoCover(ctx, image, x, y, w, h, zoom, pos) {
    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;
    if (!iw || !ih) return;
    const base = Math.max(w / iw, h / ih);
    const s = base * zoom;
    const dw = iw * s;
    const dh = ih * s;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) * pos;
    ctx.drawImage(image, dx, dy, dw, dh);
  }

  /* ------------------------------------------------ QR code */

  function drawQR(ctx, text, x, y, size, dark, light) {
    if (typeof window.qrcode !== 'function') return false;
    let qr;
    try {
      qr = window.qrcode(0, 'M');
      qr.addData(text);
      qr.make();
    } catch (_) {
      return false;
    }
    const n = qr.getModuleCount();
    const pad = Math.round(size * 0.075);
    const inner = size - pad * 2;

    ctx.save();
    roundRect(ctx, x, y, size, size, size * 0.1);
    ctx.fillStyle = light;
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,113,76,.28)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    const cell = inner / n;
    ctx.save();
    ctx.fillStyle = dark;
    for (let r = 0; r < n; r++) {
      let c = 0;
      while (c < n) {
        if (!qr.isDark(r, c)) {
          c++;
          continue;
        }
        let c2 = c;
        while (c2 + 1 < n && qr.isDark(r, c2 + 1)) c2++;
        ctx.fillRect(x + pad + c * cell, y + pad + r * cell, (c2 - c + 1) * cell + 0.4, cell + 0.4);
        c = c2 + 1;
      }
    }
    ctx.restore();
    return true;
  }

  /* ---------------------------------------------------------- */
  /*  Vẽ thiệp                                                  */
  /* ---------------------------------------------------------- */

  function drawCard(ctx, s, image) {
    const p = PALETTES[s.palette] || PALETTES.choco;
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    /* ---------- nền ---------- */
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, p.bg);
    bg.addColorStop(0.5, p.bg);
    bg.addColorStop(1, p.panelDeep);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(540, 10, 20, 540, 10, 720);
    glow.addColorStop(0, 'rgba(255,255,255,.85)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 880);

    ctx.save();
    ctx.fillStyle = 'rgba(150,110,66,.09)';
    for (let y = 18; y < H; y += 26) {
      for (let x = 14 + (((y / 26) | 0) % 2) * 13; x < W; x += 26) {
        circle(ctx, x, y, 1.15);
        ctx.fill();
      }
    }
    ctx.restore();

    /* ---------- tiêu đề ---------- */
    setLS(ctx, '0.5px');
    ctx.font = '600 32px "Dancing Script", cursive';
    ctx.fillStyle = p.inkSoft;
    ctx.fillText(s.topLine, 540, 50);
    setLS(ctx, '0px');

    // lá nhỏ hai bên
    ctx.fillStyle = p.star;
    starPath(ctx, 268, 40, 8, -Math.PI / 2);
    ctx.fill();
    heartPath(ctx, 812, 40, 13);
    ctx.fill();

    const oneSize = 150;
    ctx.font = `700 ${oneSize}px "Dancing Script", cursive`;
    const oneW = ctx.measureText(s.bigWord || 'One').width;

    // gạch chân mềm
    ctx.save();
    ctx.strokeStyle = 'rgba(120,82,48,.32)';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(540 - oneW * 0.52, 208);
    ctx.quadraticCurveTo(540, 196, 540 + oneW * 0.54, 202);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = p.ink;
    ctx.fillText(s.bigWord || 'One', 540, 188);

    /* ---------- ảnh ---------- */
    const FX = 150;
    const FY = 222;
    const FW = 780;
    const FH = 700;

    ctx.save();
    ctx.shadowColor = 'rgba(96,62,28,.32)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 16;
    archPath(ctx, FX, FY, FW, FH);
    ctx.fillStyle = p.panel;
    ctx.fill();
    ctx.restore();

    ctx.save();
    archPath(ctx, FX, FY, FW, FH);
    ctx.clip();

    if (image && (image.naturalWidth || image.width)) {
      drawPhotoCover(ctx, image, FX, FY, FW, FH, Number(s.photoZoom) || 1, Number(s.photoY) || 0);
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = p.tint;
      ctx.fillRect(FX, FY, FW, FH);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      const vig = ctx.createLinearGradient(0, FY, 0, FY + 190);
      vig.addColorStop(0, 'rgba(90,60,30,.14)');
      vig.addColorStop(1, 'rgba(90,60,30,0)');
      ctx.fillStyle = vig;
      ctx.fillRect(FX, FY, FW, 190);
    } else {
      const ph = ctx.createLinearGradient(FX, FY, FX, FY + FH);
      ph.addColorStop(0, p.panelDeep);
      ph.addColorStop(1, p.accentStrong);
      ctx.fillStyle = ph;
      ctx.fillRect(FX, FY, FW, FH);
      ctx.strokeStyle = p.inkSoft;
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      roundRect(ctx, 440, 520, 200, 150, 22);
      ctx.stroke();
      circle(ctx, 540, 585, 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(455, 645);
      ctx.lineTo(515, 590);
      ctx.lineTo(560, 630);
      ctx.lineTo(590, 606);
      ctx.lineTo(625, 645);
      ctx.stroke();
      ctx.font = '600 28px "Quicksand", sans-serif';
      ctx.fillStyle = p.inkSoft;
      ctx.fillText('Thêm ảnh của bé', 540, 730);
    }

    ctx.restore();

    ctx.save();
    archPath(ctx, FX, FY, FW, FH);
    ctx.strokeStyle = 'rgba(255,251,242,.95)';
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.restore();

    /* ---------- tấm nền dưới ---------- */
    ctx.save();
    ctx.shadowColor = 'rgba(94,61,33,.22)';
    ctx.shadowBlur = 42;
    ctx.shadowOffsetY = -10;
    panelPath(ctx, PANEL_BASE, 0, H);
    const pg = ctx.createLinearGradient(0, PANEL_BASE - 40, 0, H);
    pg.addColorStop(0, p.panel);
    pg.addColorStop(0.6, p.panel);
    pg.addColorStop(1, p.panelDeep);
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.setLineDash([16, 13]);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = p.line;
    ctx.globalAlpha = 0.85;
    panelPath(ctx, PANEL_BASE, 26, H - 62);
    ctx.stroke();
    ctx.restore();

    /* ---------- gingham ---------- */
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, H - 54, W, 54);
    ctx.clip();
    ctx.fillStyle = p.gingham;
    const cell = 27;
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < 35; i++) {
        if ((i + j) % 2 === 0) {
          ctx.globalAlpha = 0.34;
          ctx.fillRect(i * cell, H - 54 + j * cell, cell, cell);
        }
      }
    }
    for (let i = 0; i < 35; i += 2) {
      ctx.globalAlpha = 0.12;
      ctx.fillRect(i * cell, H - 54, cell, 54);
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = p.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, H - 54);
    ctx.lineTo(W, H - 54);
    ctx.stroke();
    ctx.restore();

    /* ---------- gấu bông + vương miện ---------- */
    const teddy = {
      fur: '#bd8d5c',
      muzzle: '#ecd3ad',
      nose: '#5b3f27',
      bow: '#9a6a3d',
      halo: p.halo,
    };
    const tCx = 112;
    const tBottom = 942;
    const tH = 172;
    drawTeddy(ctx, tCx, tBottom, tH, teddy);
    drawCrown(ctx, tCx + 2, tBottom - tH * 0.895, 46, 30, p.line, -0.1);

    /* ---------- hoa văn ---------- */
    ctx.fillStyle = p.star;
    const stars = [
      [56, 1000, 9],
      [1032, 902, 12],
      [1014, 1160, 8],
      [58, 1198, 10],
      [1006, 1372, 9],
      [66, 1408, 8],
    ];
    for (const [x, y, r] of stars) {
      starPath(ctx, x, y, r, -Math.PI / 2 + x * 0.01);
      ctx.fill();
    }

    iconCar(ctx, 84, 1018, 126, p.heart);

    /* ---------- tiêu đề thiệp ---------- */
    setLS(ctx, '1.5px');
    ctx.font = '800 74px "Baloo 2", sans-serif';
    ctx.fillStyle = p.inkDeep;
    ctx.fillText('Thiệp Mời', 540, 932);
    const titleW = ctx.measureText('Thiệp Mời').width;
    setLS(ctx, '0px');

    ctx.fillStyle = p.heart;
    heartPath(ctx, 540 - titleW / 2 - 44, 908, 23);
    ctx.fill();
    heartPath(ctx, 540 + titleW / 2 + 44, 908, 23);
    ctx.fill();

    /* ---------- kính mời khách ---------- */
    const gl = String(s.guestLabel !== undefined ? s.guestLabel : 'Kính mời').trim();
    const gn = String(s.guest || '').trim();
    let gs = 42;
    let labelSize = 29;
    let wl = 0;
    let wg = 0;
    let gTotal = 0;
    const gGap = 12;
    for (; gs >= 23; gs -= 1) {
      labelSize = Math.max(16, Math.round(gs * 0.7));
      ctx.font = `600 ${labelSize}px "Quicksand", sans-serif`;
      wl = ctx.measureText(gl).width;
      ctx.font = `700 ${gs}px "Baloo 2", sans-serif`;
      wg = gn ? ctx.measureText(gn).width : 0;
      gTotal = wl + (gn ? gGap + wg : 0);
      if (gTotal <= 862) break;
    }
    const guestY = 988;
    const gx = 540 - gTotal / 2;
    ctx.textAlign = 'left';
    ctx.font = `600 ${labelSize}px "Quicksand", sans-serif`;
    ctx.fillStyle = p.inkSoft;
    ctx.fillText(gl, gx, guestY);
    if (gn) {
      ctx.font = `700 ${gs}px "Baloo 2", sans-serif`;
      ctx.fillStyle = p.inkDeep;
      ctx.fillText(gn, gx + wl + gGap, guestY);
      ctx.save();
      ctx.strokeStyle = p.line;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(gx + wl + gGap + 2, guestY + 13);
      ctx.quadraticCurveTo(gx + wl + gGap + wg / 2, guestY + 20, gx + wl + gGap + wg - 2, guestY + 11);
      ctx.stroke();
      ctx.restore();
    }
    ctx.textAlign = 'center';

    /* ---------- câu mời ---------- */
    ctx.font = '600 27px "Quicksand", sans-serif';
    ctx.fillStyle = p.inkSoft;
    ctx.fillText(s.kicker, 540, 1030);

    /* ---------- tên bé ---------- */
    const nameY = 1148;
    const nameFont = (sz) => `800 ${sz}px "Baloo 2", sans-serif`;
    const nameSize = fitSize(ctx, s.name, 656, nameFont, 108, 48);
    ctx.font = nameFont(nameSize);
    setLS(ctx, '0.5px');

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(110,72,36,.24)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.strokeStyle = p.halo;
    ctx.lineWidth = Math.max(13, nameSize * 0.17);
    ctx.strokeText(s.name, 540, nameY);
    ctx.restore();

    const ng = ctx.createLinearGradient(0, nameY - nameSize * 0.78, 0, nameY);
    ng.addColorStop(0, p.ink);
    ng.addColorStop(1, p.inkDeep);
    ctx.fillStyle = ng;
    ctx.fillText(s.name, 540, nameY);
    setLS(ctx, '0px');

    /* ---------- biệt danh ---------- */
    let lastY = nameY;
    if (s.nick) {
      const nickY = nameY + 68;
      const nickTxt = `( ${s.nick} )`;
      ctx.font = '700 36px "Baloo 2", sans-serif';
      const nw = ctx.measureText(nickTxt).width;
      ctx.fillStyle = p.inkSoft;
      ctx.fillText(nickTxt, 540, nickY);
      ctx.strokeStyle = p.line;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(540 - nw / 2 - 18, nickY - 11);
      ctx.lineTo(540 - nw / 2 - 70, nickY - 11);
      ctx.moveTo(540 + nw / 2 + 18, nickY - 11);
      ctx.lineTo(540 + nw / 2 + 70, nickY - 11);
      ctx.stroke();
      lastY = nickY;
    }

    /* ---------- lời nhắn (1 dòng) ---------- */
    if (s.message && String(s.message).trim()) {
      const msgY = lastY + (s.nick ? 48 : 56);
      const msgFont = (sz) => `500 ${sz}px "Quicksand", sans-serif`;
      let msgSize = 25;
      let msgText = String(s.message).trim();
      ctx.font = msgFont(msgSize);
      while (msgSize > 17 && ctx.measureText(msgText).width > 800) {
        msgSize -= 1;
        ctx.font = msgFont(msgSize);
      }
      if (ctx.measureText(msgText).width > 800) {
        while (msgText.length > 12 && ctx.measureText(msgText + '…').width > 800) {
          msgText = msgText.slice(0, -1);
        }
        msgText += '…';
      }
      ctx.fillStyle = p.inkSoft;
      ctx.fillText(msgText, 540, msgY);
      lastY = msgY;
    }

    /* ---------- thời gian & địa điểm & QR ---------- */
    const url = String(s.mapUrl || '').trim();
    const hasQR = Boolean(url);
    const totalW = hasQR ? 906 : 900;
    const colX = Math.round((W - totalW) / 2);
    const colW = hasQR ? 716 : 900;
    const gap = 16;
    const pw = (colW - gap) / 2;
    const pY = Math.max(lastY + 38, 1302);
    const pH = 72;

    const pill = (x, y, w, h) => {
      ctx.save();
      ctx.shadowColor = 'rgba(94,61,33,.12)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 5;
      roundRect(ctx, x, y, w, h, 22);
      ctx.fillStyle = 'rgba(255,253,247,.94)';
      ctx.fill();
      ctx.restore();
      ctx.save();
      roundRect(ctx, x, y, w, h, 22);
      ctx.strokeStyle = p.line;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    };

    pill(colX, pY, pw, pH);
    pill(colX + pw + gap, pY, pw, pH);

    iconCalendar(ctx, colX + 48, pY + 36, 42, p.icon);
    ctx.textAlign = 'left';
    ctx.font = '600 22px "Quicksand", sans-serif';
    ctx.fillStyle = p.inkSoft;
    ctx.fillText(s.weekday, colX + 92, pY + 28);
    ctx.font = '700 31px "Baloo 2", sans-serif';
    ctx.fillStyle = p.inkDeep;
    ctx.fillText(s.date, colX + 90, pY + 61);

    const t2x = colX + pw + gap;
    iconClock(ctx, t2x + 48, pY + 36, 42, p.icon);
    ctx.font = '800 40px "Baloo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.time, t2x + 88 + (pw - 88) / 2 - 4, pY + 49);

    const vY = pY + pH + 14;
    const vH = 76;
    pill(colX, vY, colW, vH);
    iconPin(ctx, colX + 48, vY + 38, 38, p.icon, true);

    ctx.textAlign = 'left';
    const maxTextW = colW - 130;
    const venueSize = fitSize(ctx, s.venue, maxTextW, (sz) => `700 ${sz}px "Baloo 2", sans-serif`, 31, 19);
    ctx.font = `700 ${venueSize}px "Baloo 2", sans-serif`;
    ctx.fillStyle = p.inkDeep;
    ctx.fillText(s.venue, colX + 90, vY + 33);

    const addrSize = fitSize(ctx, s.address, maxTextW, (sz) => `600 ${sz}px "Quicksand", sans-serif`, 21, 13);
    ctx.font = `600 ${addrSize}px "Quicksand", sans-serif`;
    ctx.fillStyle = p.inkSoft;
    ctx.fillText(s.address, colX + 90, vY + 63);

    /* ---------- QR bản đồ ---------- */
    if (hasQR) {
      const qrSize = 162;
      const qrX = colX + colW + 24;
      const qrY = pY;
      const ok = drawQR(ctx, url, qrX, qrY, qrSize, p.inkDeep, '#fffdf7');
      if (ok) {
        ctx.textAlign = 'center';
        ctx.font = '600 15px "Quicksand", sans-serif';
        ctx.fillStyle = p.inkSoft;
        ctx.fillText('Quét mã xem bản đồ', qrX + qrSize / 2, qrY + qrSize + 20);
      }
    }

    /* ---------- câu kết ---------- */
    ctx.textAlign = 'center';
    const fareY = vY + vH + 52;
    const fareSize = 42;
    ctx.font = `700 ${fareSize}px "Dancing Script", cursive`;
    ctx.fillStyle = p.ink;
    ctx.fillText(s.farewell, 540, fareY);
    const fw = Math.min(ctx.measureText(s.farewell).width, 600);
    ctx.save();
    ctx.strokeStyle = 'rgba(150,113,76,.42)';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(540 - fw * 0.44, fareY + 14);
    ctx.quadraticCurveTo(540, fareY + 23, 540 + fw * 0.46, fareY + 10);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  /* ---------------------------------------------------------- */
  /*  Giao diện                                                 */
  /* ---------------------------------------------------------- */

  const $ = (sel) => document.querySelector(sel);
  const canvas = $('#card');
  const ctx = canvas.getContext('2d');

  const isBare = /(\?|&)bare\b/.test(location.search);
  if (isBare) document.body.classList.add('is-bare');

  function draw() {
    rafId = 0;
    drawCard(ctx, state, img);
  }

  function schedule() {
    if (!rafId) rafId = requestAnimationFrame(draw);
  }

  function setPhoto(src) {
    if (!src) {
      img = null;
      schedule();
      updateThumb();
      return;
    }
    const im = new Image();
    im.onload = () => {
      img = im;
      schedule();
      updateThumb();
    };
    im.onerror = () => {
      img = null;
      schedule();
    };
    im.src = src;
  }

  function updateThumb() {
    const thumb = $('#thumb');
    if (!thumb) return;
    if (state.photo) {
      thumb.src = state.photo;
      thumb.style.display = '';
    } else {
      thumb.removeAttribute('src');
      thumb.style.display = 'none';
    }
  }

  function syncForm() {
    document.querySelectorAll('[data-k]').forEach((el) => {
      const k = el.dataset.k;
      if (!(k in state)) return;
      el.value = state[k];
    });
    document.querySelectorAll('.palette').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.palette === state.palette);
    });
    updateBrand();
    updateGuestCount();
  }

  function updateBrand() {
    const sub = $('#brandSub');
    if (sub) sub.textContent = `${state.name} · ${state.date}${state.time ? ' · ' + state.time : ''}`;
    document.title = `Thiệp thôi nôi · ${state.name}`;
  }

  let saveTimer = 0;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const copy = { ...state };
        if (copy.photo === DEFAULT_PHOTO) copy.photo = null;
        localStorage.setItem(KEY, JSON.stringify(copy));
        const hint = $('#saveHint');
        if (hint) {
          hint.textContent = 'Đã lưu tự động';
          hint.style.opacity = '1';
        }
      } catch (_) {
        /* bộ nhớ đầy — bỏ qua */
      }
    }, 350);
  }

  document.querySelectorAll('[data-k]').forEach((el) => {
    const k = el.dataset.k;
    const handler = () => {
      const isNum = el.hasAttribute('data-num');
      state[k] = isNum ? Number(el.value) : el.value;
      if (k === 'name' || k === 'date' || k === 'time') updateBrand();
      if (k === 'guestList') updateGuestCount();
      schedule();
      persist();
    };
    el.addEventListener('input', handler);
  });

  document.querySelectorAll('.palette').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.palette = btn.dataset.palette;
      document.querySelectorAll('.palette').forEach((b) => b.classList.toggle('is-active', b === btn));
      schedule();
      persist();
    });
  });

  document.querySelectorAll('#resolution button').forEach((btn) => {
    btn.addEventListener('click', () => {
      exportScale = Number(btn.dataset.size) || 1;
      document.querySelectorAll('#resolution button').forEach((b) => b.classList.toggle('is-active', b === btn));
    });
  });

  /* ---------- tải ảnh ---------- */
  const photoInput = $('#f-photo');
  const dropzone = $('#dropzone');

  function downscale(src, cb) {
    const im = new Image();
    im.onload = () => {
      const max = 1800;
      const k = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = Math.round(im.width * k);
      c.height = Math.round(im.height * k);
      const cx = c.getContext('2d');
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(im, 0, 0, c.width, c.height);
      cb(c.toDataURL('image/jpeg', 0.86));
    };
    im.src = src;
  }

  function handleFile(file) {
    if (!file || !/^image\//.test(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => {
      downscale(String(reader.result), (dataUrl) => {
        state.photo = dataUrl;
        setPhoto(dataUrl);
        persist();
      });
    };
    reader.readAsDataURL(file);
  }

  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) handleFile(f);
      photoInput.value = '';
    });
  }

  if (dropzone) {
    ['dragenter', 'dragover'].forEach((ev) =>
      dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        dropzone.classList.add('is-over');
      })
    );
    ['dragleave', 'drop'].forEach((ev) =>
      dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        dropzone.classList.remove('is-over');
      })
    );
    dropzone.addEventListener('drop', (e) => {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleFile(f);
    });
  }

  /* ---------- zip (không nén) ---------- */
  function crc32(buf) {
    let table = crc32.table;
    if (!table) {
      table = crc32.table = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
      }
    }
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeZip(files) {
    const enc = new TextEncoder();
    const now = new Date();
    const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
    const dosDate =
      (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;
    const local = [];
    const central = [];
    let offset = 0;

    for (const f of files) {
      const nameBytes = enc.encode(f.name);
      const size = f.data.length;
      const crc = crc32(f.data);

      const lh = new Uint8Array(30 + nameBytes.length);
      const dv = new DataView(lh.buffer);
      dv.setUint32(0, 0x04034b50, true);
      dv.setUint16(4, 20, true);
      dv.setUint16(6, 0x0800, true);
      dv.setUint16(8, 0, true);
      dv.setUint16(10, dosTime, true);
      dv.setUint16(12, dosDate, true);
      dv.setUint32(14, crc, true);
      dv.setUint32(18, size, true);
      dv.setUint32(22, size, true);
      dv.setUint16(26, nameBytes.length, true);
      dv.setUint16(28, 0, true);
      lh.set(nameBytes, 30);
      local.push(lh, f.data);

      const cd = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(cd.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime, true);
      cv.setUint16(14, dosDate, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      cd.set(nameBytes, 46);
      central.push(cd);

      offset += lh.length + size;
    }

    const cdSize = central.reduce((a, b) => a + b.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, offset, true);

    return new Blob([...local, ...central, eocd], { type: 'application/zip' });
  }

  /* ---------- gửi riêng từng khách ---------- */
  const guestListEl = $('#f-guestList');
  const batchBtn = $('#batchBtn');
  const batchProgress = $('#batchProgress');
  const batchBar = $('#batchBar');
  const batchStatus = $('#batchStatus');

  function guestNames() {
    return (guestListEl ? guestListEl.value : '')
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function updateGuestCount() {
    const n = guestNames().length;
    const label = $('#guestCount');
    if (label) label.textContent = n ? `${n} khách` : '';
    if (batchBtn) batchBtn.disabled = n === 0;
  }

  async function runBatch() {
    const names = guestNames();
    if (!names.length || busy) return;
    let scaleToUse = exportScale;
    if (names.length > 30 && exportScale === 2) {
      if (confirm(`${names.length} thiệp ở bản 2× (2160×3240) có thể mất vài phút. Anh có muốn chuyển sang bản 1× (1080×1620) cho nhanh hơn không?`)) {
        scaleToUse = 1;
      }
    }
    busy = true;
    updateGuestCount();
    batchBtn.disabled = true;
    if (batchProgress) batchProgress.hidden = false;

    const files = [];
    try {
      for (let i = 0; i < names.length; i++) {
        const guestName = names[i].trim();
        if (batchStatus) batchStatus.textContent = `Đang tạo ${i + 1}/${names.length} · ${guestName}`;
        if (batchBar) batchBar.style.width = `${Math.round(((i + 1) / names.length) * 100)}%`;
        await new Promise((r) => setTimeout(r, 16));

        const blob = await buildBlob({ ...state, guest: guestName }, scaleToUse);
        if (!blob) throw new Error('no blob');
        const data = new Uint8Array(await blob.arrayBuffer());
        files.push({
          name: `thiep-${String(i + 1).padStart(2, '0')}-${slug(guestName).slice(0, 42) || 'khach'}.png`,
          data,
        });
      }
      if (batchBar) batchBar.style.width = '100%';
      if (batchStatus) batchStatus.textContent = 'Đang đóng gói .zip…';
      await new Promise((r) => setTimeout(r, 30));
      saveBlob(makeZip(files), `thiep-thoi-noi-${slug(state.name) || 'be'}-${names.length}-khach.zip`);
      if (batchStatus) batchStatus.textContent = `Xong ${names.length} thiệp ✓ Đã tải file .zip về máy.`;
    } catch (err) {
      if (batchStatus) batchStatus.textContent = 'Có lỗi khi tạo thiệp. Anh thử lại với ít khách hơn nhé.';
    } finally {
      busy = false;
      updateGuestCount();
    }
  }

  /* Note: guestListEl input is already handled by the generic [data-k] listener
     which calls updateGuestCount() + schedule() + persist(). No duplicate needed. */
  batchBtn?.addEventListener('click', runBatch);

  /* ---------- xuất ảnh ---------- */
  async function buildBlob(s, scale) {
    const c = document.createElement('canvas');
    c.width = W * scale;
    c.height = H * scale;
    const cc = c.getContext('2d');
    cc.scale(scale, scale);
    drawCard(cc, s, img);
    return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
  }

  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  }

  function slug(str) {
    return String(str || 'thiep')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  function fileName() {
    const g = state.guest && state.guest.trim() && state.guest.trim() !== 'Quý khách' ? `-${slug(state.guest)}` : '';
    return `thiep-thoi-noi-${slug(state.name) || 'be-yeu'}${g}.png`;
  }

  let busy = false;
  async function download() {
    if (busy) return;
    busy = true;
    const btns = document.querySelectorAll('#downloadBtn, #downloadBtnBottom');
    btns.forEach((b) => (b.style.opacity = '.6'));
    try {
      const blob = await buildBlob(state, exportScale);
      if (!blob) throw new Error('no blob');
      saveBlob(blob, fileName());
      const hint = $('#saveHint');
      if (hint) {
        hint.textContent = 'Đã tải thiệp ✓';
        setTimeout(() => {
          hint.textContent = 'Đã lưu tự động';
        }, 3000);
      }
    } catch (err) {
      alert('Chưa xuất được ảnh. Anh thử mở trang bằng một trình duyệt khác giúp em nhé!');
    } finally {
      busy = false;
      btns.forEach((b) => (b.style.opacity = '1'));
    }
  }

  const shareBtn = $('#shareBtn');
  if (shareBtn) {
    if (navigator.canShare && window.File) {
      shareBtn.hidden = false;
      shareBtn.addEventListener('click', async () => {
        try {
          const blob = await buildBlob(state, exportScale);
          const file = new File([blob], fileName(), { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Thiệp thôi nôi · ${state.name}`,
              text: `Mời anh/chị đến dự tiệc thôi nôi của ${state.name}!`,
            });
          } else {
            download();
          }
        } catch (err) {
          if (!err || err.name !== 'AbortError') download();
        }
      });
    }
  }

  $('#downloadBtn')?.addEventListener('click', download);
  $('#downloadBtnBottom')?.addEventListener('click', download);

  $('#resetBtn')?.addEventListener('click', () => {
    if (!confirm('Đặt lại toàn bộ nội dung về mặc định?')) return;
    try {
      localStorage.removeItem(KEY);
    } catch (_) {}
    location.reload();
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      e.preventDefault();
      download();
    }
  });

  /* ---------- khởi động ---------- */
  async function loadFonts() {
    if (!document.fonts) return;
    const list = [
      '700 150px "Dancing Script"',
      '600 32px "Dancing Script"',
      '700 44px "Dancing Script"',
      '800 116px "Baloo 2"',
      '700 34px "Baloo 2"',
      '600 30px "Quicksand"',
      '500 27px "Quicksand"',
    ];
    try {
      await Promise.all(list.map((f) => document.fonts.load(f, 'Tiệp Mời Quang Kiên')));
      await document.fonts.ready;
    } catch (_) {
      /* bỏ qua */
    }
  }

  (async () => {
    syncForm();
    setPhoto(state.photo);
    await loadFonts();
    schedule();
  })();
})();
