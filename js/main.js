/* Irradiant Systems and Technologies — site scripts */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header state on scroll ---------- */
  var header = document.querySelector("[data-header]");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    var closeNav = function () {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    };
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal, [data-observe]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Services sub-nav active state ---------- */
  var subLinks = document.querySelectorAll(".service-nav a");
  if (subLinks.length && "IntersectionObserver" in window) {
    var map = {};
    subLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var so = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            subLinks.forEach(function (a) { a.classList.remove("is-active"); });
            var link = map[entry.target.id];
            if (link) link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) so.observe(sec);
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Hero network canvas ---------- */
  var canvas = document.querySelector(".hero-canvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var colors = ["44,198,238", "247,162,27", "143,114,255", "255,255,255", "255,255,255"];
    var nodes = [];
    var w = 0, h = 0, dpr = 1, raf = null, visible = true;
    var mouse = { x: -9999, y: -9999 };
    var LINK = 150;

    var resize = function () {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(110, Math.max(36, (w * h) / 15000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.6 + 0.8,
          c: colors[i % colors.length]
        });
      }
    };

    var draw = function () {
      ctx.clearRect(0, 0, w, h);
      var i, j, a, b, dx, dy, d;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!reduceMotion) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
          if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;
          // gentle pull toward the cursor
          dx = mouse.x - a.x; dy = mouse.y - a.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < 200) { a.x += dx * 0.003; a.y += dy * 0.003; }
        }
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x; dy = a.y - b.y;
          d = dx * dx + dy * dy;
          if (d < LINK * LINK) {
            var alpha = (1 - Math.sqrt(d) / LINK) * 0.22;
            ctx.strokeStyle = "rgba(" + a.c + "," + alpha + ")";
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        ctx.fillStyle = "rgba(" + a.c + ",0.85)";
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduceMotion && visible) raf = requestAnimationFrame(draw);
    };

    resize();
    draw();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { resize(); if (reduceMotion) draw(); }, 150);
    });
    canvas.parentElement.addEventListener("pointermove", function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    });
    canvas.parentElement.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });

    if ("IntersectionObserver" in window && !reduceMotion) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
      }).observe(canvas);
    }
  }

  /* ---------- Photo stacks ---------- */
  document.querySelectorAll("[data-stack]").forEach(function (stack) {
    var items = Array.prototype.slice.call(stack.querySelectorAll(".stack-item"));
    var n = items.length;
    if (n < 2) return;
    var cur = 0, busy = false, timer = null, inView = false, hovered = false;
    var countEl = stack.querySelector(".stack-count b");
    var dots = stack.querySelectorAll(".stack-dots i");
    var INTERVAL = 4200;

    var layout = function () {
      items.forEach(function (el, idx) {
        var depth = (idx - cur + n) % n;
        el.style.setProperty("--i", depth);
        el.classList.toggle("is-front", depth === 0);
        var img = el.querySelector("img");
        if (img && depth === 1) img.loading = "eager"; // preload the next photo
      });
      if (countEl) countEl.textContent = ("0" + (cur + 1)).slice(-2);
      dots.forEach(function (d, i) { d.classList.toggle("is-on", i === cur); });
    };

    var go = function (dir) {
      if (busy) return;
      busy = true;
      if (dir > 0) {
        var front = items[cur];
        front.classList.add("is-leaving");
        setTimeout(function () {
          cur = (cur + 1) % n;
          layout();
          front.classList.remove("is-leaving");
          busy = false;
        }, reduceMotion ? 0 : 480);
      } else {
        cur = (cur - 1 + n) % n;
        layout();
        setTimeout(function () { busy = false; }, 500);
      }
    };

    var schedule = function () {
      clearTimeout(timer);
      if (reduceMotion || !inView || hovered || document.hidden) return;
      timer = setTimeout(function () { go(1); schedule(); }, INTERVAL);
    };

    layout();

    stack.addEventListener("click", function (e) {
      var prev = e.target.closest("[data-stack-prev]");
      go(prev ? -1 : 1);
      schedule();
    });
    stack.addEventListener("mouseenter", function () { hovered = true; clearTimeout(timer); });
    stack.addEventListener("mouseleave", function () { hovered = false; schedule(); });
    document.addEventListener("visibilitychange", schedule);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var was = inView;
        inView = entries[0].isIntersecting;
        if (inView && !was) {
          // stagger neighbouring stacks so they don't flip in unison
          clearTimeout(timer);
          timer = setTimeout(schedule, Number(stack.getAttribute("data-delay") || 0));
        } else if (!inView) {
          clearTimeout(timer);
        }
      }, { threshold: 0.35 }).observe(stack);
    }
  });

  /* ---------- Contact form ---------- */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var status = form.querySelector(".form-status");
    var submit = form.querySelector("button[type=submit]");
    var setStatus = function (type, msg) {
      status.className = "form-status is-" + type;
      status.textContent = msg;
    };
    var mailtoFallback = function (data) {
      var body =
        "Name: " + data.get("name") + "\n" +
        "Email: " + data.get("email") + "\n" +
        "Phone: " + (data.get("phone") || "-") + "\n" +
        "Area of interest: " + (data.get("interest") || "-") + "\n\n" +
        data.get("message");
      window.location.href =
        "mailto:info@irradiant.in?subject=" + encodeURIComponent("Website enquiry from " + data.get("name")) +
        "&body=" + encodeURIComponent(body);
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      submit.disabled = true;
      var label = submit.querySelector("span");
      var original = label.textContent;
      label.textContent = "Sending…";

      fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) {
          return res.json().then(function (json) { return { ok: res.ok, json: json }; });
        })
        .then(function (r) {
          if (r.ok && r.json.ok) {
            form.reset();
            setStatus("success", "Thank you, your enquiry has been sent. We'll be in touch shortly.");
          } else {
            setStatus("error", (r.json && r.json.error) || "Something went wrong. Please email us at info@irradiant.in.");
          }
        })
        .catch(function () {
          // No server-side handler available (e.g. previewing locally): fall back to the email client.
          setStatus("success", "Opening your email app to send this enquiry…");
          mailtoFallback(data);
        })
        .then(function () {
          submit.disabled = false;
          label.textContent = original;
        });
    });
  }
})();
