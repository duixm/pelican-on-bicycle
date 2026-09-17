/* ============================================================
   鹈鹕骑自行车 — 交互脚本
   零依赖 / 原生 DOM
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 导航滚动状态 ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 2. 移动端菜单 ---------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- 3. 数字滚动 ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    if (reduceMotion) { el.textContent = String(target); return; }
    var duration = 1100;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = String(target);
    }
    requestAnimationFrame(step);
  }

  /* ---------- 4. 进场观察器 ---------- */
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-in');

        if (el.hasAttribute('data-count')) animateCount(el);

        var bar = el.querySelector ? el.querySelector('.bar i') : null;
        if (bar && !bar.classList.contains('is-on')) bar.classList.add('is-on');

        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  }

  // 给主要区块加进场类
  var revealTargets = document.querySelectorAll(
    '.section h2, .section-lede, .card, .anatomy-list li, .anatomy-art, ' +
    '.metric, .metric-val, .note, .species-row, .ride-stage, .outro p, .hero-stats'
  );
  Array.prototype.forEach.call(revealTargets, function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = Math.min(i % 4, 3) * 60 + 'ms';
    if (io) io.observe(el);
    else el.classList.add('is-in');
  });

  // 无 IO 时直接展开
  if (!io) {
    Array.prototype.forEach.call(counters, animateCount);
    Array.prototype.forEach.call(document.querySelectorAll('.bar i'), function (b) {
      b.classList.add('is-on');
    });
  }

  /* ---------- 5. 骑行舞台控制 ---------- */
  var stage     = document.querySelector('.ride-stage');
  var track     = document.getElementById('rideTrack');
  var playBtn   = document.getElementById('playBtn');
  var playIcon  = document.getElementById('playIcon');
  var playLabel = document.getElementById('playLabel');
  var speedRange= document.getElementById('speedRange');
  var speedVal  = document.getElementById('speedVal');
  var windRange = document.getElementById('windRange');
  var windVal   = document.getElementById('windVal');

  var rig    = document.getElementById('rig');
  var wheels = [document.getElementById('wheelRear'), document.getElementById('wheelFront')];
  var crank  = document.getElementById('crank');
  var wing   = document.getElementById('wing');

  var WIND_LABEL = ['无风', '中', '强'];
  var rpm = 60;
  var playing = true;
  var rafId = null;
  var lastTs = 0;

  /* 踏频 → 动画时长：60rpm = .8s/圈（车轮与曲柄同步为 .8s，符合钢丝比例） */
  function rpmToDuration(r) {
    // 基准：60 rpm → 0.8s。反向线性映射，越快步频动画越快。
    var sec = 0.8 * (60 / r);
    return Math.max(0.18, Math.min(3.2, sec));
  }

  function applyRpm(r) {
    var dur = rpmToDuration(r) + 's';
    if (rig) rig.style.setProperty('--pedal', dur);
    wheels.forEach(function (w) { if (w) w.style.setProperty('--dur', dur); });
    if (crank) crank.style.setProperty('--dur', dur);
    // 翅膀不受踏频影响，保持独立的低频扇动
    if (wing) wing.style.setProperty('--dur', Math.max(0.9, rpmToDuration(r) * 1.9) + 's');
    if (speedVal) speedVal.textContent = String(r);
  }

  function setPlaying(next) {
    playing = next;
    if (!track) return;
    track.classList.toggle('is-paused', !playing);
    if (playBtn)  playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    if (playIcon) playIcon.textContent = playing ? '❚❚' : '▶';
    if (playLabel) playLabel.textContent = playing ? '暂停' : '播放';
    if (playing) startRaf(); else stopRaf();
  }

  /* 用 rAF 做一次兜底同步：某些浏览器对 SVG 内联 CSS 变量动画支持不一致 */
  function tick(ts) {
    if (!lastTs) lastTs = ts;
    var dt = (ts - lastTs) / 1000;
    lastTs = ts;

    if (playing && !reduceMotion) {
      var degPerSec = rpm * 6; // 360° / (60/rpm) = rpm*6
      spinDeg += degPerSec * dt;
      if (spinDeg > 360000) spinDeg = spinDeg % 360;

      // 仅在没有 CSS 动画支持时兜底旋转
      if (!supportsSvgCssAnimation()) {
        applySpin(spinDeg);
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  var spinDeg = 0;

  function applySpin(deg) {
    crank.style.transform = 'translate(252px, 290px) rotate(' + deg + 'deg)';
    wheels.forEach(function (w) {
      var tx = w === wheels[0] ? 196 : 360;
      w.style.transform = 'translate(' + tx + 'px, 290px) rotate(' + deg + 'deg)';
    });
  }

  function supportsSvgCssAnimation() {
    // Chrome/Safari/Firefox 现代版本对 SVG 元素的 CSS transform 动画支持良好
    if (typeof CSS === 'undefined' || !CSS.supports) return true;
    return CSS.supports('transform-box', 'fill-box');
  }

  function startRaf() {
    if (rafId === null) { lastTs = 0; rafId = requestAnimationFrame(tick); }
  }
  function stopRaf() {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  if (playBtn) {
    playBtn.addEventListener('click', function () { setPlaying(!playing); });
  }

  if (speedRange) {
    speedRange.addEventListener('input', function () {
      rpm = parseInt(speedRange.value, 10) || 60;
      applyRpm(rpm);
    });
  }

  if (windRange) {
    windRange.addEventListener('input', function () {
      var v = windRange.value;
      if (stage) stage.setAttribute('data-wind', v);
      if (windVal) windVal.textContent = WIND_LABEL[parseInt(v, 10)] || '中';
    });
  }

  // 空格键切换播放
  document.addEventListener('keydown', function (e) {
    if (e.code !== 'Space') return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (!stage) return;
    var rect = stage.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      e.preventDefault();
      setPlaying(!playing);
    }
  });

  // 初始化
  if (stage) stage.setAttribute('data-wind', windRange ? windRange.value : '1');
  applyRpm(rpm);
  setPlaying(true);
})();
