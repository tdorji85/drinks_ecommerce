document.documentElement.classList.add("js-motion");
const loader = document.querySelector("#page-loader");
const loaderGrid = document.querySelector(".loader-grid");
const loaderDots = [];
for (let i = 0; i < 42; i += 1) {
  const shape = document.createElement("span");
  shape.className = "loader-dot shape";
  loaderGrid.appendChild(shape);
  loaderDots.push(shape);
}

// Each shape travels independently, creating the loose, hand-made motion
// from the reference animation instead of a synchronized grid pulse.
const random = (min, max) => Math.random() * (max - min) + min;
const moveShape = (shape) => {
  const animation = shape.animate(
    [
      { transform: "translate(0, 0) rotate(0deg) scale(1)" },
      { transform: `translate(${random(-100, 100)}px, ${random(-100, 100)}px) rotate(${random(-180, 180)}deg) scale(${random(.7, 1.25)})` },
    ],
    { duration: random(500, 1000), easing: "ease-in-out", fill: "forwards" },
  );
  animation.finished.then(() => moveShape(shape));
};
loaderDots.forEach((shape, index) => {
  shape.style.background = index % 3 === 0 ? "var(--cream)" : index % 3 === 1 ? "var(--lime)" : "white";
  moveShape(shape);
});
const hideLoader = () => {
  loader.classList.add("is-hidden");
  setTimeout(() => loader.remove(), 500);
};

// Keep the loader on screen long enough to actually see its motion, while still
// waiting for the page assets before revealing the site.
const loaderStartedAt = performance.now();
window.addEventListener("load", () => {
  const minimumDisplayTime = 1800;
  const remainingTime = Math.max(0, minimumDisplayTime - (performance.now() - loaderStartedAt));
  setTimeout(hideLoader, remainingTime);
}, { once: true });

const stage = document.querySelector("#drink-stage"),
  cupShadow = document.querySelector("#cup-shadow"),
  reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const flavors = document.querySelectorAll(".flavor"),
  nameEl = document.querySelector("#drink-name"),
  desc = document.querySelector("#drink-desc"),
  price = document.querySelector("#drink-price"),
  cup = document.querySelector("#cup"),
  panel = document.querySelector("#panel");
flavors.forEach((f) =>
  f.addEventListener("click", () => {
    if (f.classList.contains("active")) return;

    flavors.forEach((x) => x.classList.remove("active"));
    f.classList.add("active");

    // Keep the stage occupied while the new drink arrives. The cup animation
    // handles a soft crossfade and a small lift instead of flashing out.
    [nameEl, desc, price].forEach((element) => {
      element.classList.remove("is-changing");
      void element.offsetWidth;
      element.classList.add("is-changing");
    });
    nameEl.textContent = f.dataset.name;
    desc.textContent = f.dataset.desc;
    price.textContent = f.dataset.price;
    cup.alt = `${f.dataset.name} from Cloudbrew`;
    panel.style.backgroundColor = f.dataset.color;

    // Swap only after the new image is ready, avoiding a blank frame or flash.
    stage.classList.remove("is-switching");
    cup.classList.remove("is-switching");
    cup.style.opacity = "0";
    const showNewDrink = () => {
      stage.classList.remove("is-switching");
      void stage.offsetWidth;
      stage.classList.add("is-switching");
      cup.style.opacity = "";
    };
    cup.onload = showNewDrink;
    cup.src = f.dataset.img;
    if (cup.complete) showNewDrink();
  }),
);
const visual = document.querySelector("#visual");
const hero = document.querySelector("#home");
const motion = { x: 0, y: 0, tx: 0, ty: 0, dragY: 0, dragX: 0, down: false, lastX: 0, lastY: 0, swap: 0, scroll: 0, scrollTarget: 0 };
let raf = 0, last = performance.now(), visible = true;
const clamp01 = (value) => Math.max(0, Math.min(1, value));
function updateScrollTarget() {
  const bounds = hero.getBoundingClientRect();
  const travel = Math.max(1, bounds.height - window.innerHeight);
  motion.scrollTarget = clamp01(-bounds.top / travel);
}
window.addEventListener("scroll", updateScrollTarget, { passive: true });
window.addEventListener("resize", updateScrollTarget);
updateScrollTarget();

const revealItems = document.querySelectorAll("main section, .footer");
const revealState = new WeakMap();
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && !revealState.get(entry.target)) {
      revealState.set(entry.target, true);
      entry.target.classList.add("is-revealed");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .14, rootMargin: "0px 0px -8% 0px" });
revealItems.forEach((item) => revealObserver.observe(item));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function frame(now) {
  const dt = Math.min((now - last) / 1000, .05); last = now;
  if (visible && !document.hidden && !reduceMotion) {
    const k = 1 - Math.exp(-5 * dt);
    motion.x += (motion.tx - motion.x) * k;
    motion.y += (motion.ty - motion.y) * k;
    // Smooth-scroll-linked progress with an Expo-style ease-out response.
    // This mirrors Anime.js `duration: 1000, ease: 'outExpo'`: it moves
    // quickly at first, then settles gently into the latest scroll position.
    const outExpoCatchUp = 1 - Math.pow(2, -10 * dt);
    motion.scroll += (motion.scrollTarget - motion.scroll) * outExpoCatchUp;
    hero.style.setProperty("--scroll-progress", motion.scroll.toFixed(4));
    const t = now / 1000;
    const bob = Math.sin(t * 2) * .05;
    const yaw = motion.down ? motion.dragY : Math.sin(t * .7) * .21 + motion.x;
    const pitch = motion.down ? motion.dragX : Math.sin(t * .9) * .09 - motion.y;
    cup.style.transform = `translateY(${bob * 100}%) rotateX(${pitch}rad) rotateY(${yaw}rad)`;
    cupShadow.style.transform = `scale(${1 - bob * .6})`;
    cupShadow.style.opacity = String(.22 - bob * .18);
  }
  raf = requestAnimationFrame(frame);
}
function pointerPosition(e) {
  const r = stage.getBoundingClientRect();
  motion.tx = clamp(((e.clientX - r.left) / r.width - .5) * 1.0, -.5, .5);
  motion.ty = clamp(((e.clientY - r.top) / r.height - .5) * -1.0, -.5, .5);
}
stage.addEventListener("pointermove", (e) => { pointerPosition(e); if (motion.down) { motion.dragY += (e.clientX - motion.lastX) * .01; motion.dragX = clamp(motion.dragX + (e.clientY - motion.lastY) * .01, -.6, .6); motion.lastX = e.clientX; motion.lastY = e.clientY; } });
stage.addEventListener("pointerleave", () => { motion.tx = 0; motion.ty = 0; });
stage.addEventListener("pointerdown", (e) => { motion.down = true; motion.lastX = e.clientX; motion.lastY = e.clientY; stage.setPointerCapture(e.pointerId); });
stage.addEventListener("pointerup", (e) => { motion.down = false; stage.releasePointerCapture(e.pointerId); });
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
raf = requestAnimationFrame(frame);
function addItem(button) {
  const original = button.textContent;
  button.textContent = "Added";
  button.setAttribute("aria-live", "polite");
  setTimeout(() => {
    button.textContent = original;
  }, 1500);
}
