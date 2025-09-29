  setInterval(() => {
    // Trigger reflow to restart the CSS animation
    textElement.classList.remove('text');
    void textElement.offsetWidth; // Force reflow
    textElement.classList.add('text');

    index = (index + 1) % words.length;
    textElement.textContent = words[index];
  }, 3000); // Change every 3 seconds


  const colors = ["#FFFFFF", "#FF4500"]; // White & Sunset Orange
  const notes = ["♪", "♫", "♬", "♩"];
  let lastNoteTime = 0; // track last note release

  document.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastNoteTime < 150) return; // only release every 200ms
    lastNoteTime = now;

    const note = document.createElement("span");
    note.textContent = notes[Math.floor(Math.random() * notes.length)];
    note.classList.add("music-note");

    // Random color
    note.style.color = colors[Math.floor(Math.random() * colors.length)];

    // Position
    note.style.left = e.pageX + "px";
    note.style.top = e.pageY + "px";

    document.body.appendChild(note);

    // Remove after animation
    setTimeout(() => {
      note.remove();
    }, 2000);
  });

const words = ["VIBEZ", "LOVE", "SWEETNESS"];
let index = 0;
const textElement = document.querySelector('.listen-text .text');
const main = document.querySelector("main");

// Function to spawn particles
function createParticle(type) {
  const particle = document.createElement("span");
  particle.classList.add("particle");

  if (type === "VIBEZ") {
    // random geometric shape
    const shapes = ["■", "▲", "●"];
    particle.textContent = shapes[Math.floor(Math.random() * shapes.length)];
    particle.style.color = "#ff9f55";
  } 
  else if (type === "LOVE") {
    // hearts with random neon colors
    particle.textContent = "❤";
    const colors = ["#ff9f55", "#ffffff", "#ff2d55", "#e63946"];
    particle.style.color = colors[Math.floor(Math.random() * colors.length)];
  } 
  else if (type === "SWEETNESS") {
    // sweets
    const sweets = ["🍬", "🍭", "🍫"];
    particle.textContent = sweets[Math.floor(Math.random() * sweets.length)];
  }

  particle.style.left = Math.random() * 100 + "%";
  main.appendChild(particle);

  // Animate and remove
  setTimeout(() => {
    particle.remove();
  }, 3000);
}

// Interval for word switching
setInterval(() => {
  textElement.classList.remove('text');
  void textElement.offsetWidth; // restart CSS anim
  textElement.classList.add('text');

  index = (index + 1) % words.length;
  textElement.textContent = words[index];

  // release particles
  for (let i = 0; i < 15; i++) {
    setTimeout(() => createParticle(words[index]), i * 150);
  }
}, 3000);

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("header nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("active");
    });
  }
});
