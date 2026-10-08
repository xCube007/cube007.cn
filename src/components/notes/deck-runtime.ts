/** 全屏幻灯片运行时:翻页、缩放、封面打字机、粒子。页面有 #stage 才启动。 */

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown', ' ', 'PageDown']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp', 'PageUp']);
const SKIP_CLICK = 'button,.dots,a,input,textarea,select,dialog,.ev-chip,.ds-card,.pit,.scene,.bp,.feat,.cl-card,.reason-card,.ag-card,.tl-item,.pstep,.cheat-chips span';

const TYPE_LINES = [
  '$ redis-server --port 6379',
  'Ready to accept connections tcp',
  '127.0.0.1:6379> PING',
  'PONG',
];

export function initDeck(): void {
  const stage = document.getElementById('stage');
  if (!stage) return;

  const slides = [...document.querySelectorAll<HTMLElement>('.slide')];
  const dotsBox = document.getElementById('dots');
  const pagenum = document.getElementById('pagenum');
  const progress = document.getElementById('progress');
  if (!dotsBox || !pagenum || !progress || slides.length === 0) return;

  let cur = 0;
  let busy = false;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fit = () => {
    const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  };
  fit();
  window.addEventListener('resize', fit);

  for (let i = 0; i < slides.length; i++) {
    const d = document.createElement('span');
    if (i === 0) d.className = 'on';
    d.addEventListener('click', () => go(i));
    dotsBox.appendChild(d);
  }
  const dots = [...dotsBox.children] as HTMLElement[];

  function runCounters(slide: HTMLElement) {
    slide.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      const target = Number.parseInt(el.getAttribute('data-count') ?? '0', 10);
      const suffix = el.getAttribute('data-suffix') ?? '';
      const dur = 1300;
      let t0: number | null = null;
      const step = (t: number) => {
        if (t0 === null) t0 = t;
        let p = Math.min((t - t0) / dur, 1);
        p = 1 - (1 - p) ** 3;
        el.textContent = Math.round(target * p).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function sync() {
    dots.forEach((d, i) => {
      d.className = i === cur ? 'on' : '';
    });
    pagenum.innerHTML = `<b>${String(cur + 1).padStart(2, '0')}</b> / ${String(slides.length).padStart(2, '0')}`;
    progress.style.width = `${((cur + 1) / slides.length) * 100}%`;
  }

  function go(n: number) {
    if (busy) return;
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === cur) return;
    const dir = n > cur ? 1 : -1;
    const oldEl = slides[cur];
    const newEl = slides[n];
    busy = true;
    oldEl.dataset.state = dir > 0 ? 'exit-left' : 'exit-right';
    newEl.classList.remove('in');
    newEl.dataset.state = dir > 0 ? 'enter-right' : 'enter-left';
    void newEl.offsetWidth;
    requestAnimationFrame(() => {
      newEl.dataset.state = 'active';
      newEl.classList.add('in');
      if (newEl.querySelector('[data-count]')) runCounters(newEl);
    });
    window.setTimeout(
      () => {
        oldEl.dataset.state = '';
        oldEl.classList.remove('in');
        busy = false;
      },
      calm ? 0 : 660,
    );
    cur = n;
    sync();
  }

  slides[0].classList.add('in');
  sync();

  document.addEventListener('keydown', (e) => {
    if (document.querySelector('dialog[open]')) return;
    const t = e.target;
    if (t instanceof HTMLElement && t.closest('input,textarea,select')) return;
    if (NEXT_KEYS.has(e.key)) {
      e.preventDefault();
      go(cur + 1);
    } else if (PREV_KEYS.has(e.key)) {
      e.preventDefault();
      go(cur - 1);
    } else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(slides.length - 1);
  });

  let tx: number | null = null;
  document.addEventListener(
    'touchstart',
    (e) => {
      tx = e.touches[0].clientX;
    },
    { passive: true },
  );
  document.addEventListener(
    'touchend',
    (e) => {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
      tx = null;
    },
    { passive: true },
  );

  let wheelLock = 0;
  document.addEventListener(
    'wheel',
    (e) => {
      const now = Date.now();
      if (now - wheelLock < 700 || Math.abs(e.deltaY) < 24) return;
      wheelLock = now;
      go(cur + (e.deltaY > 0 ? 1 : -1));
    },
    { passive: true },
  );

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest(SKIP_CLICK)) return;
    if (busy) return;
    const x = e.clientX;
    if (x < window.innerWidth * 0.15) go(cur - 1);
    else go(cur + 1);
    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.left = `${x}px`;
    r.style.top = `${e.clientY}px`;
    document.body.appendChild(r);
    window.setTimeout(() => r.remove(), 650);
  });

  const typeEl = document.getElementById('typeText');
  if (typeEl) {
    if (calm) {
      typeEl.textContent = TYPE_LINES[0];
    } else {
      let li = 0;
      let ci = 0;
      let del = false;
      const type = () => {
        const line = TYPE_LINES[li];
        if (!del) {
          ci += 1;
          typeEl.textContent = line.slice(0, ci);
          if (ci === line.length) {
            del = true;
            window.setTimeout(type, li === TYPE_LINES.length - 1 ? 2600 : 700);
            return;
          }
          window.setTimeout(type, li < 1 ? 55 : 45);
        } else {
          ci -= 1;
          typeEl.textContent = line.slice(0, ci);
          if (ci === 0) {
            del = false;
            li = (li + 1) % TYPE_LINES.length;
            window.setTimeout(type, 180);
            return;
          }
          window.setTimeout(type, 14);
        }
      };
      type();
    }
  }

  const cv = calm ? null : document.querySelector<HTMLCanvasElement>('#particles');
  const ctx = cv?.getContext('2d');
  if (cv && ctx) {
    cv.width = 1280;
    cv.height = 720;
    const N = 46;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * 1280,
      y: Math.random() * 720,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 1.8 + 0.8,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, 1280, 720);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1280) p.vx *= -1;
        if (p.y < 0 || p.y > 720) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = 'rgba(255,120,90,.55)';
        ctx.fill();
      }
      for (let a = 0; a < N; a++) {
        for (let b = a + 1; b < N; b++) {
          const dx = pts[a].x - pts[b].x;
          const dy = pts[a].y - pts[b].y;
          const d = dx * dx + dy * dy;
          if (d < 20000) {
            ctx.beginPath();
            ctx.moveTo(pts[a].x, pts[a].y);
            ctx.lineTo(pts[b].x, pts[b].y);
            ctx.strokeStyle = `rgba(255,110,80,${0.14 * (1 - d / 20000)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    };
    draw();
  }
}
