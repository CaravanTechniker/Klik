const VERSION = "0.3.0";
console.log("APP.JS LOADED", VERSION, new Date().toISOString());

const app = document.getElementById("app");

fetch("content.json")
  .then(r => {
    if (!r.ok) throw new Error("content.json load failed");
    return r.json();
  })
  .then(data => render(data))
  .catch(err => {
    console.error(err);
    app.innerHTML = "<b>ERROR loading data</b>";
  });

function render(items) {
  app.innerHTML = "";

  const cats = [...new Set(items.map(i => i.category))];

  cats.forEach(cat => {
    const h = document.createElement("h2");
    h.textContent = cat;
    app.appendChild(h);

    items
      .filter(i => i.category === cat)
      .forEach(i => {
        const d = document.createElement("div");
        d.style.border = "1px solid #ccc";
        d.style.margin = "6px";
        d.style.padding = "6px";
        d.innerHTML = `<b>${i.title}</b><br>${i.subtitle}`;
        app.appendChild(d);
      });
  });
}
