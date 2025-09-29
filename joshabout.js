// about.js
(() => {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Collections
  let guitars = [];
  let notes = [];
  let stickmen = [];

  // Timing
  let lastSpawn = 0;
  const SPAWN_INTERVAL = 2000; // ms
  let lastGlowPick = 0;
  const GLOW_INTERVAL = 5000; // ms

  // Utility
  function rand(min, max) { return Math.random() * (max - min) + min; }

  // Guitar class (smaller, more drawn/realistic wireframe)
  class Guitar {
    constructor(x, type) {
      this.x = x;
      this.y = -80;
      this.type = type; // 'acoustic'|'electric'
      this.baseSize = 18;      // smaller size (user requested ~5px smaller)
      this.size = this.baseSize;
      this.speed = rand(0.6, 1.4);
      this.rotation = rand(-0.15, 0.15);
      this.scale = 1;
      this.glow = false;
      this.exploding = false;
      this.alpha = 1;
      this.dead = false;
      this.spawnTime = performance.now();
    }

    // simplified bounding radius for interaction
    radius() {
      return this.baseSize * this.scale * 1.2;
    }

    drawWireframe() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(this.scale, this.scale);

      // If glowing, set warm shadow for aura (wireframe lines 'glow')
      if (this.glow || this.exploding) {
        ctx.shadowColor = 'rgba(224,123,57,0.9)'; // sunset orange
        ctx.shadowBlur = this.exploding ? 28 : 12;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.lineWidth = 1.1;
      ctx.strokeStyle = `rgba(255,255,255,${Math.max(0.25, this.alpha)})`;

      // DRAW acoustic or electric outline
      ctx.beginPath();
      if (this.type === 'acoustic') {
        // body - slightly more natural oval
        ctx.ellipse(0, 0, this.baseSize * 1.15, this.baseSize * 0.95, 0, 0, Math.PI*2);
        // upper bout
        ctx.ellipse(0, -this.baseSize * 0.7, this.baseSize * 0.6, this.baseSize * 0.45, 0, 0, Math.PI*2);
        // sound hole
        ctx.moveTo(this.baseSize * 0.18, -2);
        ctx.arc(0, 0, this.baseSize * 0.28, 0, Math.PI*2);
        // neck
        ctx.moveTo(0, -this.baseSize * 1.1);
        ctx.lineTo(0, -this.baseSize * 3.0);
        // headstock (small)
        ctx.moveTo(0, -this.baseSize * 3.0);
        ctx.lineTo(0, -this.baseSize * 3.6);
      } else {
        // electric simple outline with subtle bevels
        ctx.moveTo(-this.baseSize * 0.9, this.baseSize * 0.45);
        ctx.lineTo(this.baseSize * 0.95, this.baseSize * 0.4);
        ctx.lineTo(this.baseSize * 0.6, -this.baseSize * 0.6);
        ctx.lineTo(-this.baseSize * 0.6, -this.baseSize * 0.65);
        ctx.closePath();
        // neck
        ctx.moveTo(0, -this.baseSize * 0.45);
        ctx.lineTo(0, -this.baseSize * 3.0);
        ctx.moveTo(0, -this.baseSize * 3.0);
        ctx.lineTo(0, -this.baseSize * 3.6);
      }
      ctx.stroke();

      ctx.restore();
    }

    update(now) {
      // vertical motion
      this.y += this.speed;

      // glow -> scale up toward 3x, then explode
      if (this.glow && !this.exploding) {
        this.scale += 0.04;
        if (this.scale >= 3) {
          this.exploding = true;
        }
      }

      // exploding: swell quickly and fade
      if (this.exploding) {
        this.scale += 0.16;
        this.alpha -= 0.09;
        if (this.alpha <= 0) {
          // final explosion: produce hearts & mark dead
          createHearts(this.x, this.y);
          this.dead = true;
        }
      }

      // if reached ground (and not glowing/exploding) spawn stickman
      if (this.y > canvas.height - 40 && !this.dead && !this.glow && !this.exploding) {
        stickmen.push(new Stickman(this.x, canvas.height - 90, now));
        this.dead = true;
      }

      // draw if not dead (draw even during exploding to show swell)
      if (!this.dead) this.drawWireframe();
    }
  }

  // Notes (music or hearts). symbol defaults to a music note; hearts pass symbol='❤'
  class Note {
    constructor(x, y, color = '#FFFFFF', symbol = null, isHeart = false) {
      this.x = x + rand(-8, 8);
      this.y = y + rand(-8, 8);
      this.color = color;
      this.symbol = symbol || (Math.random() > 0.4 ? '♪' : '♫');
      this.alpha = 1;
      this.size = (isHeart ? 22 : 14) + rand(0, 8); // hearts larger
      this.speed = (isHeart ? 0.5 : (1 + Math.random() * 1.2));
      this.offset = Math.random() * Math.PI * 2;
      this.life = isHeart ? 180 : 120;
      this.isHeart = !!isHeart;
    }
    update() {
      // float up with gentle sine wiggle, fade
      this.y -= this.speed;
      this.x += Math.sin((this.life / 10) + this.offset) * (this.isHeart ? 0.9 : 0.6);
      this.alpha -= (this.isHeart ? 0.005 : 0.008);
      this.life--;
      // draw
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = this.color;
      ctx.font = `${this.size}px Arial`;
      ctx.fillText(this.symbol, this.x, this.y);
      ctx.restore();
    }
    isDead() {
      return this.life <= 0 || this.alpha <= 0;
    }
  }

  // Wireframe Stickman that strums for duration (~3s)
  class Stickman {
    constructor(x, y, startTime) {
      this.x = x;
      this.y = y;
      this.start = startTime || performance.now();
      this.duration = 3000;
      this.dead = false;
    }
    update(now) {
      const t = (now - this.start) / this.duration;
      if (t > 1) { this.dead = true; return; }

      // draw stickman frame (arms move via sin)
      const armOffset = Math.sin(t * Math.PI * 4) * 18; // back/forth
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 1.2;

      // Head
      ctx.beginPath();
      ctx.arc(0, -52, 10, 0, Math.PI*2);
      ctx.stroke();

      // Body
      ctx.beginPath();
      ctx.moveTo(0, -42);
      ctx.lineTo(0, 0);
      ctx.stroke();

      // Left arm (static)
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(-18, -14);
      ctx.stroke();

      // Right arm (strumming, moves)
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(18 + armOffset/6, -12 + armOffset/6);
      ctx.stroke();

      // Legs
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-12, 32);
      ctx.moveTo(0, 0);
      ctx.lineTo(12, 32);
      ctx.stroke();

      // Guitar held by stickman (wireframe body + neck)
      ctx.beginPath();
      ctx.ellipse(18 + armOffset/6, -6 + armOffset/6, 12, 8, 0, 0, Math.PI*2);
      ctx.moveTo(18 + armOffset/6, -6 + armOffset/6);
      ctx.lineTo(34 + armOffset/6, -18 + armOffset/6); // neck
      ctx.stroke();

      // while strumming, occasionally release small notes
      if (Math.random() < 0.08) {
        const colors = ['#ffffff','#FFA500','#FF3B3B'];
        notes.push(new Note(this.x + 18, this.y - 6, colors[Math.floor(Math.random()*colors.length)], null, false));
      }

      ctx.restore();
    }
  }

  // Spawning helpers
  function spawnGuitar() {
    const type = Math.random() > 0.5 ? 'acoustic' : 'electric';
    const x = rand(40, canvas.width - 40);
    guitars.push(new Guitar(x, type));
  }

  function createHearts(x, y) {
    const colors = ['#FF3B3B', '#FFFFFF', '#E07B39'];
    for (let i=0;i<8;i++) {
      notes.push(new Note(x + rand(-10,10), y + rand(-10,10),
        colors[Math.floor(Math.random()*colors.length)], '❤', true));
    }
  }

  // Handle hover -> convert guitar to music-notes pop
  function handleHover(mx, my) {
    for (let i = guitars.length - 1; i >= 0; i--) {
      const g = guitars[i];
      if (g.dead) continue;
      const dx = mx - g.x;
      const dy = my - g.y;
      if (Math.hypot(dx, dy) < g.radius()) {
        // pop into music notes only if not a special glowing guitar (special will auto-explode)
        if (!g.glow && !g.exploding) {
          for (let k=0;k<3;k++) {
            const colors = ['#ffffff','#FFA500','#1E90FF'];
            notes.push(new Note(g.x + rand(-6,6), g.y + rand(-6,6), colors[Math.floor(Math.random()*colors.length)], null, false));
          }
          g.dead = true;
          // remove from guitars array (cleanup in animation loop)
        } else if (g.glow && !g.exploding) {
          // if user hovers a glowing one, trigger immediate explosion
          g.exploding = true;
        }
      }
    }
  }

  // Mouse move listener
  let lastMouse = {x:0,y:0};
  canvas.addEventListener('mousemove', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    lastMouse.x = mx; lastMouse.y = my;
    handleHover(mx,my);
  });

  // Spawn & glow picking loops using timestamps inside animation

  // Animation loop (time is DOMHighResTimeStamp)
  let lastTime = performance.now();
  function animate(time) {
    const dt = time - lastTime;
    lastTime = time;

    // clear with slight alpha to create clean frame
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // spawn guitars periodically
    if (time - lastSpawn > SPAWN_INTERVAL) {
      spawnGuitar();
      lastSpawn = time;
    }

    // pick a random guitar to glow every GLOW_INTERVAL
    if (time - lastGlowPick > GLOW_INTERVAL) {
      lastGlowPick = time;
      if (guitars.length > 0) {
        // choose a random not-dead guitar that is not already glowing/exploding
        const candidates = guitars.filter(g => !g.dead && !g.glow && !g.exploding);
        if (candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random()*candidates.length)];
          pick.glow = true;
          // small pulse before pop (optional)
        }
      }
    }

    // update & draw guitars
    for (let i = guitars.length - 1; i >= 0; i--) {
      const g = guitars[i];
      g.update(time);
      if (g.dead) guitars.splice(i,1);
    }

    // update notes
    for (let i = notes.length - 1; i >=0; i--) {
      notes[i].update();
      if (notes[i].isDead()) notes.splice(i,1);
    }

    // update stickmen
    for (let i = stickmen.length - 1; i >= 0; i--) {
      const s = stickmen[i];
      s.update(time);
      if (s.dead) stickmen.splice(i,1);
    }

    requestAnimationFrame(animate);
  }

  // Start loop
  requestAnimationFrame(animate);

  // Optional: make guitars pause spawning when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // aggressive cleanup could be done here, but keep it simple
    }
  });
})();

// ===== Gallery popup handling =====
const galleryBtn = document.getElementById("gallery-btn");
const popup = document.getElementById("gallery-popup");
const closeBtn = document.getElementById("close-popup");

galleryBtn.addEventListener("click", () => {
  popup.classList.add("active");
});

closeBtn.addEventListener("click", () => {
  popup.classList.remove("active");
});

// Close popup if clicking outside content
popup.addEventListener("click", (e) => {
  if (e.target === popup) popup.classList.remove("active");
});
