const flavors = document.querySelectorAll(".flavor"),
  nameEl = document.querySelector("#drink-name"),
  desc = document.querySelector("#drink-desc"),
  price = document.querySelector("#drink-price"),
  cup = document.querySelector("#cup"),
  panel = document.querySelector("#panel");
flavors.forEach((f) =>
  f.addEventListener("click", () => {
    flavors.forEach((x) => x.classList.remove("active"));
    f.classList.add("active");
    cup.style.opacity = 0;
    cup.style.transform = "translateX(12px)";
    setTimeout(() => {
      nameEl.textContent = f.dataset.name;
      desc.textContent = f.dataset.desc;
      price.textContent = f.dataset.price;
      cup.src = f.dataset.img;
      panel.style.background = f.dataset.color;
      cup.style.opacity = 1;
      cup.style.transform = "translateX(0)";
    }, 180);
  }),
);
const visual = document.querySelector("#visual");
visual.addEventListener("mousemove", (e) => {
  if (innerWidth < 761) return;
  const r = visual.getBoundingClientRect();
  const x = (e.clientX - r.left - r.width / 2) / r.width;
  const y = (e.clientY - r.top - r.height / 2) / r.height;
  cup.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 7}deg)`;
});
visual.addEventListener("mouseleave", () => (cup.style.transform = ""));
function addItem(button) {
  const original = button.textContent;
  button.textContent = "Added";
  button.setAttribute("aria-live", "polite");
  setTimeout(() => {
    button.textContent = original;
  }, 1500);
}
