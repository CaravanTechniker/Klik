
let DATA = {};
let LANG = 'de';
let FONT = 1;

fetch('content.json')
  .then(r => r.json())
  .then(j => {
    DATA = j;
    renderList();
  });

function setLang(l) {
  LANG = l;
  renderList();
}

function fontUp() {
  FONT = Math.min(3, FONT + 0.25);
  document.documentElement.style.setProperty('--font-scale', FONT);
}

function fontDown() {
  FONT = Math.max(0.75, FONT - 0.25);
  document.documentElement.style.setProperty('--font-scale', FONT);
}

function resetApp() {
  location.reload();
}

function renderList() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'card';

  DATA.trees.forEach(t => {
    const div = document.createElement('div');
    div.className = 'tree-item';
    div.innerText = t.title[LANG];
    div.onclick = () => renderTree(t);
    card.appendChild(div);
  });

  app.appendChild(card);
}

function renderTree(tree) {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const back = document.createElement('button');
  back.className = 'back-btn';
  back.innerText = 'Späť';
  back.onclick = renderList;
  app.appendChild(back);

  const card = document.createElement('div');
  card.className = 'card';

  const h = document.createElement('h2');
  h.innerText = tree.title[LANG];
  card.appendChild(h);

  const p = document.createElement('p');
  p.innerText = tree.description[LANG];
  card.appendChild(p);

  app.appendChild(card);
}
