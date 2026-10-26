let entries = JSON.parse(localStorage.getItem('javEntries')) || [];
let actresses = JSON.parse(localStorage.getItem('javActresses') || '[]') || [];
let animeCharacters = JSON.parse(localStorage.getItem('animeCharacters') || '[]') || [];
let editIndex = null;
let editActressId = null;
let editPersonType = 'actress';
let actressPhotoUrl = null;
let activeCardPhotoUrls = [];
let actressRenderVersion = 0;
let activeView = 'codes';
const collections = ['JAV', 'Hentai', 'Anime'];
const storedCollection = localStorage.getItem('javSelectedCollection');
let activeCollection = collections.includes(storedCollection) ? storedCollection : 'JAV';
const defaultTheme = {
  pageBg: '#0f0f1a',
  pageGradientEnd: '#25204a',
  pageGradient: false,
  surface: '#1e1e2f',
  text: '#e0e0e0',
  muted: '#a1a1aa',
  accent: '#4f46e5',
  cardBg: '#1e1e2f',
  cardGradientEnd: '#312e81',
  cardGradient: false,
  cardText: '#e0e0e0',
  cardMuted: '#a1a1aa',
  cardAccent: '#818cf8',
  chipBg: '#312e81',
  chipText: '#c7d2fe',
  danger: '#f87171',
  buttonText: '#ffffff'
};
const storedTheme = JSON.parse(localStorage.getItem('javTheme') || '{}') || {};
const theme = { ...defaultTheme };
Object.keys(defaultTheme).forEach(key => {
  if (typeof defaultTheme[key] === 'boolean') {
    if (typeof storedTheme[key] === 'boolean') theme[key] = storedTheme[key];
  } else if (typeof storedTheme[key] === 'string' && /^#[0-9a-f]{6}$/i.test(storedTheme[key])) {
    theme[key] = storedTheme[key];
  }
});

const listEl = document.getElementById('list');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const modal = document.getElementById('modal');
const menuBtn = document.getElementById('menuBtn');
const collectionMenu = document.getElementById('collectionMenu');
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const addBtn = document.getElementById('addBtn');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const addActressBtn = document.getElementById('addActressBtn');
const addCharacterBtn = document.getElementById('addCharacterBtn');
const actressModal = document.getElementById('actressModal');
const actressPhotoInput = document.getElementById('actressPhotoInput');

function saveActresses() {
  localStorage.setItem('javActresses', JSON.stringify(actresses));
}

function saveAnimeCharacters() {
  localStorage.setItem('animeCharacters', JSON.stringify(animeCharacters));
}

function personPhotoKey(type, id) {
  return type === 'character' ? `anime-character-${id}` : id;
}

function openPhotoDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Dieser Browser unterstützt die Fotospeicherung nicht.'));
      return;
    }
    const request = indexedDB.open('jav-codes-photo-db', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('photos');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Die Fotospeicherung konnte nicht geöffnet werden.'));
  });
}

function storeActressPhoto(id, file) {
  return openPhotoDatabase().then(db => new Promise((resolve, reject) => {
    const transaction = db.transaction('photos', 'readwrite');
    transaction.objectStore('photos').put(file, id);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error('Das Foto konnte nicht gespeichert werden.'));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error || new Error('Das Speichern des Fotos wurde abgebrochen.'));
    };
  }));
}

function loadActressPhoto(id) {
  return openPhotoDatabase().then(db => new Promise((resolve, reject) => {
    const transaction = db.transaction('photos', 'readonly');
    const request = transaction.objectStore('photos').get(id);
    request.onsuccess = () => {
      db.close();
      resolve(request.result || null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error || new Error('Das Foto konnte nicht geladen werden.'));
    };
  }));
}

function deleteActressPhoto(id) {
  return openPhotoDatabase().then(db => new Promise((resolve, reject) => {
    const transaction = db.transaction('photos', 'readwrite');
    transaction.objectStore('photos').delete(id);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error('Das Foto konnte nicht gelöscht werden.'));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error || new Error('Das Löschen des Fotos wurde abgebrochen.'));
    };
  }));
}

function saveToStorage() {
  localStorage.setItem('javEntries', JSON.stringify(entries));
}

function applyTheme() {
  const root = document.documentElement;
  root.style.setProperty('--page-bg', theme.pageBg);
  root.style.setProperty('--page-gradient-end', theme.pageGradientEnd);
  root.style.setProperty('--surface', theme.surface);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--muted', theme.muted);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--card-bg', theme.cardBg);
  root.style.setProperty('--card-gradient-end', theme.cardGradientEnd);
  root.style.setProperty('--card-text', theme.cardText);
  root.style.setProperty('--card-muted', theme.cardMuted);
  root.style.setProperty('--card-accent', theme.cardAccent);
  root.style.setProperty('--chip-bg', theme.chipBg);
  root.style.setProperty('--chip-text', theme.chipText);
  root.style.setProperty('--danger', theme.danger);
  root.style.setProperty('--button-text', theme.buttonText);
  document.body.classList.toggle('page-gradient', theme.pageGradient);
  document.body.classList.toggle('card-gradient', theme.cardGradient);
}

function saveTheme() {
  localStorage.setItem('javTheme', JSON.stringify(theme));
  applyTheme();
}

function syncThemeControls() {
  document.querySelectorAll('[data-theme-color]').forEach(input => {
    input.value = theme[input.dataset.themeColor];
  });
  document.getElementById('pageGradientInput').checked = theme.pageGradient;
  document.getElementById('cardGradientInput').checked = theme.cardGradient;
}

function syncEntryColorControls(cardStyle = null) {
  const colors = cardStyle || {};
  document.getElementById('entryColorsEnabled').checked = Boolean(colors.enabled);
  document.getElementById('entryCardGradient').checked = Boolean(colors.gradient);
  document.getElementById('entryCardBg').value = colors.background || theme.cardBg;
  document.getElementById('entryCardGradientEnd').value = colors.gradientEnd || theme.cardGradientEnd;
  document.getElementById('entryCardText').value = colors.text || theme.cardText;
  document.getElementById('entryCardMuted').value = colors.muted || theme.cardMuted;
  document.getElementById('entryCardAccent').value = colors.accent || theme.cardAccent;
  document.getElementById('entryChipBg').value = colors.chipBg || theme.chipBg;
  document.getElementById('entryChipText').value = colors.chipText || theme.chipText;
  document.getElementById('entryColorFields').classList.toggle('color-fields-disabled', !colors.enabled);
  document.querySelectorAll('#entryColorFields input[type="color"], #entryCardGradient').forEach(input => {
    input.disabled = !colors.enabled;
  });
}

function syncPersonColorControls(cardStyle = null) {
  const colors = cardStyle || {};
  document.getElementById('actressColorsEnabled').checked = Boolean(colors.enabled);
  document.getElementById('actressCardGradient').checked = Boolean(colors.gradient);
  document.getElementById('actressCardBg').value = colors.background || theme.cardBg;
  document.getElementById('actressCardGradientEnd').value = colors.gradientEnd || theme.cardGradientEnd;
  document.getElementById('actressCardText').value = colors.text || theme.cardText;
  document.getElementById('actressCardMuted').value = colors.muted || theme.cardMuted;
  document.getElementById('actressCardAccent').value = colors.accent || theme.cardAccent;
  document.getElementById('actressColorFields').classList.toggle('color-fields-disabled', !colors.enabled);
  document.querySelectorAll('#actressColorFields input[type="color"], #actressCardGradient').forEach(input => {
    input.disabled = !colors.enabled;
  });
}

function getCardStyleAttribute(entry) {
  const style = entry.cardStyle;
  if (!style || style.enabled !== true) return '';

  const getColor = (key, fallback) => /^#[0-9a-f]{6}$/i.test(style[key] || '')
    ? style[key]
    : fallback;
  const background = getColor('background', theme.cardBg);
  const gradientEnd = getColor('gradientEnd', theme.cardGradientEnd);
  const image = style.gradient === true
    ? `linear-gradient(145deg, ${background}, ${gradientEnd})`
    : 'none';
  const declarations = [
    `--entry-card-bg:${background}`,
    `--entry-card-image:${image}`,
    `--entry-card-text:${getColor('text', theme.cardText)}`,
    `--entry-card-muted:${getColor('muted', theme.cardMuted)}`,
    `--entry-card-accent:${getColor('accent', theme.cardAccent)}`,
    `--entry-chip-bg:${getColor('chipBg', theme.chipBg)}`,
    `--entry-chip-text:${getColor('chipText', theme.chipText)}`
  ];
  return ` style="${declarations.join(';')}"`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function setCollection(collection) {
  activeCollection = collection;
  localStorage.setItem('javSelectedCollection', collection);
  document.getElementById('pageTitle').textContent = collection;
  updateCollectionFields();
  collectionMenu.classList.add('hidden');
  menuBtn.setAttribute('aria-expanded', 'false');
  render();
}

function updateCollectionFields() {
  const isJav = activeCollection === 'JAV';
  const isAnime = activeCollection === 'Anime';
  const tabs = document.getElementById('peopleViewTabs');
  tabs.classList.toggle('hidden', !isJav && !isAnime);
  addActressBtn.classList.toggle('hidden', !isJav);
  addCharacterBtn.classList.toggle('hidden', !isAnime);
  tabs.querySelector('[data-view="actresses"]').classList.toggle('hidden', !isJav);
  tabs.querySelector('[data-view="characters"]').classList.toggle('hidden', !isAnime);
  if ((!isJav && activeView === 'actresses') || (!isAnime && activeView === 'characters')) {
    setActiveView('codes');
  } else {
    syncSortOptions();
  }
  document.getElementById('codeInput').placeholder = isJav
    ? 'JAV-Code (z. B. MISM-464)'
    : 'Titel';
  document.getElementById('actressInput').placeholder = isJav
    ? 'Actress (optional)'
    : 'Publisher (optional)';
  document.getElementById('tagsInput').placeholder = isJav
    ? 'Tags (mit Komma trennen)'
    : 'Genre (mit Komma trennen)';
  document.getElementById('searchInput').placeholder = isJav
    ? 'Suchen nach Code, Actress, Tags...'
    : 'Suchen nach Titel, Publisher, Genre...';
  sortSelect.querySelector('option[value="actress"]').textContent = isJav
    ? 'Actress'
    : 'Publisher';
}

function clearActressPhotoUrls() {
  activeCardPhotoUrls.forEach(url => URL.revokeObjectURL(url));
  activeCardPhotoUrls = [];
}

function setActiveView(view) {
  activeView = view;
  syncSortOptions();
  searchInput.placeholder = view === 'actresses'
    ? 'Suchen nach Actress, Körpergröße, Körbchengröße...'
    : view === 'characters'
      ? 'Suchen nach Charakter...'
      : (activeCollection === 'JAV'
      ? 'Suchen nach Code, Actress, Tags...'
      : 'Suchen nach Titel, Publisher, Genre...');
  document.querySelectorAll('#peopleViewTabs .view-tab').forEach(button => {
    const isActive = button.dataset.view === view;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  render();
}

function syncSortOptions() {
  const isActresses = activeView === 'actresses';
  const isCharacters = activeView === 'characters';
  sortSelect.querySelectorAll('[data-actress-sort]').forEach(option => {
    option.hidden = !isActresses;
  });
  sortSelect.querySelectorAll('[data-character-sort]').forEach(option => {
    option.hidden = !isCharacters;
  });
  sortSelect.querySelectorAll('option:not([data-actress-sort]):not([data-character-sort])').forEach(option => {
    option.hidden = isActresses || isCharacters;
  });

  const isActressSort = sortSelect.value.startsWith('actress-');
  const isCharacterSort = sortSelect.value.startsWith('character-');
  if (isActresses && !isActressSort) sortSelect.value = 'actress-name';
  if (isCharacters && !isCharacterSort) sortSelect.value = 'character-name';
  if (activeView === 'codes' && (isActressSort || isCharacterSort)) sortSelect.value = 'code';
}

function renderActresses() {
  renderPeople(actresses, 'actress');
}

function renderCharacters() {
  renderPeople(animeCharacters, 'character');
}

function renderPeople(people, type) {
  clearActressPhotoUrls();
  const renderVersion = ++actressRenderVersion;
  const query = searchInput.value.toLowerCase().trim();
  const filtered = people.filter(person =>
    [person.name, person.height, person.cupSize, person.series]
      .some(value => String(value || '').toLowerCase().includes(query))
  );
  const [sortField, sortDirection] = {
    'actress-height-asc': ['height', 1],
    'actress-height-desc': ['height', -1],
    'actress-cup-asc': ['cupSize', 1],
    'actress-cup-desc': ['cupSize', -1]
  }[sortSelect.value] || ['name', 1];
  const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
  filtered.sort((first, second) => {
    const firstValue = String(first[sortField] || '').trim();
    const secondValue = String(second[sortField] || '').trim();
    if (!firstValue && !secondValue) return first.name.localeCompare(second.name);
    if (!firstValue) return 1;
    if (!secondValue) return -1;
    const comparison = sortField === 'height'
      ? Number(firstValue) - Number(secondValue)
      : collator.compare(firstValue, secondValue);
    return comparison * sortDirection;
  });

  listEl.innerHTML = filtered.length === 0
    ? `<p class="empty-list">Keine ${type === 'character' ? 'Charaktere' : 'Actress'} gefunden</p>`
    : filtered.map(person => `
      <article class="card actress-card"${getCardStyleAttribute(person)}>
        <div class="actress-photo-placeholder" data-person-photo="${person.id}" aria-hidden="true">♡</div>
        <div class="actress-card-content">
          <div class="code">${escapeHtml(person.name)}</div>
          ${type === 'character' && person.series ? `<div class="actress-detail">Serie: ${escapeHtml(person.series)}</div>` : ''}
          ${type === 'actress' && person.height ? `<div class="actress-detail">Körpergröße: ${escapeHtml(person.height)} cm</div>` : ''}
          ${type === 'actress' && person.cupSize ? `<div class="actress-detail">Körbchengröße: ${escapeHtml(person.cupSize)}</div>` : ''}
        </div>
        <button class="edit-btn" type="button" aria-label="${type === 'character' ? 'Charakter' : 'Actress'} ${escapeHtml(person.name)} bearbeiten" onclick="editActress(${person.id})">✎</button>
        <button class="delete-btn" type="button" aria-label="${type === 'character' ? 'Charakter' : 'Actress'} ${escapeHtml(person.name)} löschen" onclick="deleteActress(${person.id})">×</button>
      </article>
    `).join('');

  filtered.forEach(person => {
    if (!person.photo) return;
    loadActressPhoto(personPhotoKey(type, person.id)).then(blob => {
      if (!blob || renderVersion !== actressRenderVersion) return;
      const placeholder = listEl.querySelector(`[data-person-photo="${person.id}"]`);
      if (!placeholder) return;
      const imageUrl = URL.createObjectURL(blob);
      activeCardPhotoUrls.push(imageUrl);
      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = `Foto: ${person.name}`;
      placeholder.replaceWith(image);
    }).catch(error => {
      if (renderVersion === actressRenderVersion) {
        console.error(error);
        listEl.insertAdjacentHTML('afterbegin', '<p class="photo-error">Ein Actress-Foto konnte nicht geladen werden.</p>');
      }
    });
  });
}

function render() {
  if (activeView === 'actresses' && activeCollection === 'JAV') {
    renderActresses();
    return;
  }
  if (activeView === 'characters' && activeCollection === 'Anime') {
    renderCharacters();
    return;
  }
  clearActressPhotoUrls();
  let filtered = entries.filter(entry => (entry.collection || 'JAV') === activeCollection);

  const query = searchInput.value.toLowerCase().trim();
  if (query) {
    filtered = filtered.filter(entry =>
      String(entry.code || '').toLowerCase().includes(query) ||
      String(entry.category || '').toLowerCase().includes(query) ||
      String(entry.publisher || entry.actress || '').toLowerCase().includes(query) ||
      String(entry.genre || entry.tags || '').toLowerCase().includes(query)
    );
  }

  const sortBy = sortSelect.value;
  filtered.sort((a, b) => {
    if (sortBy === 'date') return b.id - a.id;
    const firstValue = sortBy === 'actress' ? (a.publisher || a.actress) : a[sortBy];
    const secondValue = sortBy === 'actress' ? (b.publisher || b.actress) : b[sortBy];
    return String(firstValue || '').localeCompare(String(secondValue || ''));
  });

  listEl.innerHTML = filtered.length === 0
    ? '<p class="empty-list">Keine Einträge gefunden</p>'
    : filtered.map(entry => {
      const isJav = (entry.collection || 'JAV') === 'JAV';
      const person = isJav ? entry.actress : (entry.publisher || entry.actress);
      const details = isJav ? entry.tags : (entry.genre || entry.tags);
      return `
        <div class="card"${getCardStyleAttribute(entry)}>
          <button class="edit-btn" type="button" aria-label="Eintrag ${escapeHtml(entry.code)} bearbeiten" onclick="editEntry(${entry.id})">✎</button>
          <button class="delete-btn" type="button" aria-label="Eintrag ${escapeHtml(entry.code)} löschen" onclick="deleteEntry(${entry.id})">×</button>
          <div class="code">${escapeHtml(entry.code)}</div>
          <div class="category">${escapeHtml(entry.category || 'Ohne Kategorie')}</div>
          <div class="actress">${isJav ? '' : 'Publisher: '}${escapeHtml(person || '–')}</div>
          <div class="tags">${isJav ? '' : 'Genre: '}${escapeHtml(details || '–')}</div>
        </div>
      `;
    }).join('');
}

function openActressModal(editId = null) {
  editPersonType = activeCollection === 'Anime' ? 'character' : 'actress';
  editActressId = editId;
  const people = editPersonType === 'character' ? animeCharacters : actresses;
  const person = editId === null ? null : people.find(item => item.id === editId);
  const personLabel = editPersonType === 'character' ? 'Charakter' : 'Actress';
  document.getElementById('actressModalTitle').textContent = person
    ? `${personLabel} bearbeiten`
    : `Neuer ${personLabel}`;
  document.getElementById('personNameLabel').firstChild.textContent = 'Name';
  document.getElementById('personPhotoLabel').firstChild.textContent = 'Foto';
  document.getElementById('personColorsLabel').lastChild.textContent =
    ` Eigene Farben für diese ${personLabel}-Karte verwenden`;
  document.getElementById('actressMeasurements').classList.toggle('hidden', editPersonType === 'character');
  document.getElementById('characterSeriesField').classList.toggle('hidden', editPersonType !== 'character');
  document.getElementById('characterSeriesInput').value = person ? person.series || '' : '';
  document.getElementById('actressHeightInput').value = person ? person.height || '' : '';
  document.getElementById('actressCupSizeInput').value = person ? person.cupSize || '' : '';
  document.getElementById('actressNameInput').value = person ? person.name : '';
  actressPhotoInput.value = '';
  document.getElementById('removeActressPhotoInput').checked = false;
  document.getElementById('removeActressPhotoField').classList.toggle('hidden', !person || !person.photo);
  syncPersonColorControls(person ? person.cardStyle : null);

  if (actressPhotoUrl) URL.revokeObjectURL(actressPhotoUrl);
  actressPhotoUrl = null;
  const preview = document.getElementById('actressPhotoPreview');
  const previewImage = document.getElementById('actressPreviewImage');
  preview.classList.add('hidden');
  previewImage.removeAttribute('src');

  actressModal.classList.remove('hidden');
  if (person && person.photo) {
    loadActressPhoto(personPhotoKey(editPersonType, person.id)).then(blob => {
      if (!blob || editActressId !== person.id || editPersonType !== (activeCollection === 'Anime' ? 'character' : 'actress')) return;
      actressPhotoUrl = URL.createObjectURL(blob);
      previewImage.src = actressPhotoUrl;
      preview.classList.remove('hidden');
    }).catch(error => {
      console.error(error);
      alert(`Das ${personLabel}-Foto konnte nicht geladen werden: ${error.message}`);
    });
  }
}

function closeActressModal() {
  actressModal.classList.add('hidden');
  editActressId = null;
  actressPhotoInput.value = '';
  if (actressPhotoUrl) URL.revokeObjectURL(actressPhotoUrl);
  actressPhotoUrl = null;
}

async function saveActress() {
  const name = document.getElementById('actressNameInput').value.trim();
  if (!name) {
    alert(editPersonType === 'character' ? 'Charaktername ist Pflicht!' : 'Name ist Pflicht!');
    return;
  }
  const photo = actressPhotoInput.files[0];
  if (photo && !photo.type.startsWith('image/')) {
    alert('Bitte wähle eine Bilddatei aus.');
    return;
  }

  const people = editPersonType === 'character' ? animeCharacters : actresses;
  const previousPerson = editActressId === null
    ? null
    : people.find(item => item.id === editActressId);
  const id = editActressId === null ? Date.now() : editActressId;
  const person = {
    id,
    name,
    photo: previousPerson ? previousPerson.photo : false,
    cardStyle: document.getElementById('actressColorsEnabled').checked ? {
      enabled: true,
      gradient: document.getElementById('actressCardGradient').checked,
      background: document.getElementById('actressCardBg').value,
      gradientEnd: document.getElementById('actressCardGradientEnd').value,
      text: document.getElementById('actressCardText').value,
      muted: document.getElementById('actressCardMuted').value,
      accent: document.getElementById('actressCardAccent').value
    } : null
  };
  if (editPersonType === 'actress') {
    person.height = document.getElementById('actressHeightInput').value.trim();
    person.cupSize = document.getElementById('actressCupSizeInput').value.trim();
  } else {
    person.series = document.getElementById('characterSeriesInput').value.trim();
  }
  const removePhoto = document.getElementById('removeActressPhotoInput').checked;

  try {
    if (photo) {
      await storeActressPhoto(personPhotoKey(editPersonType, id), photo);
      person.photo = true;
    } else if (removePhoto) {
      await deleteActressPhoto(personPhotoKey(editPersonType, id));
      person.photo = false;
    }

    if (previousPerson) {
      const index = people.findIndex(item => item.id === id);
      people[index] = person;
    } else {
      people.unshift(person);
    }
    if (editPersonType === 'character') saveAnimeCharacters();
    else saveActresses();
    closeActressModal();
    setActiveView(editPersonType === 'character' ? 'characters' : 'actresses');
  } catch (error) {
    console.error(error);
    alert(`${editPersonType === 'character' ? 'Charakter' : 'Actress'} konnte nicht gespeichert werden: ${error.message}`);
  }
}

function editActress(id) {
  if (activeView === 'characters' && activeCollection === 'Anime') {
    openActressModal(id);
    return;
  }
  openActressModal(id);
}

async function deleteActress(id) {
  const personType = activeView === 'characters' && activeCollection === 'Anime' ? 'character' : 'actress';
  const people = personType === 'character' ? animeCharacters : actresses;
  const person = people.find(item => item.id === id);
  const personLabel = personType === 'character' ? 'Charakter' : 'Actress';
  if (!person || !confirm(`${personLabel} „${person.name}“ wirklich löschen?`)) return;
  try {
    if (person.photo) await deleteActressPhoto(personPhotoKey(personType, id));
    if (personType === 'character') {
      animeCharacters = animeCharacters.filter(item => item.id !== id);
      saveAnimeCharacters();
      renderCharacters();
    } else {
      actresses = actresses.filter(item => item.id !== id);
      saveActresses();
      renderActresses();
    }
  } catch (error) {
    console.error(error);
    alert(`${personLabel} konnte nicht gelöscht werden: ${error.message}`);
  }
}

function editEntry(id) {
  openModal(id);
}

function openModal(editId = null) {
  editIndex = editId;
  modal.classList.remove('hidden');
  document.getElementById('modalTitle').textContent = editId !== null ? 'Bearbeiten' : 'Neuer Eintrag';

  if (editId !== null) {
    const entry = entries.find(e => e.id === editId);
    document.getElementById('codeInput').value = entry.code;
    document.getElementById('categoryInput').value = entry.category;
    document.getElementById('actressInput').value = activeCollection === 'JAV'
      ? (entry.actress || '')
      : (entry.publisher || entry.actress || '');
    document.getElementById('tagsInput').value = activeCollection === 'JAV'
      ? (entry.tags || '')
      : (entry.genre || entry.tags || '');
    syncEntryColorControls(entry.cardStyle);
  } else {
    document.getElementById('codeInput').value = '';
    document.getElementById('categoryInput').value = '';
    document.getElementById('actressInput').value = '';
    document.getElementById('tagsInput').value = '';
    syncEntryColorControls();
  }
  updateCollectionFields();
}

function closeModal() {
  modal.classList.add('hidden');
  editIndex = null;
}

function saveEntry() {
  const code = document.getElementById('codeInput').value.trim();
  if (!code) return alert(activeCollection === 'JAV' ? 'Code ist Pflicht!' : 'Titel ist Pflicht!');

  const entry = {
    id: editIndex !== null ? editIndex : Date.now(),
    code,
    collection: editIndex !== null
      ? (entries.find(e => e.id === editIndex).collection || 'JAV')
      : activeCollection,
    category: document.getElementById('categoryInput').value.trim(),
    cardStyle: document.getElementById('entryColorsEnabled').checked ? {
      enabled: true,
      gradient: document.getElementById('entryCardGradient').checked,
      background: document.getElementById('entryCardBg').value,
      gradientEnd: document.getElementById('entryCardGradientEnd').value,
      text: document.getElementById('entryCardText').value,
      muted: document.getElementById('entryCardMuted').value,
      accent: document.getElementById('entryCardAccent').value,
      chipBg: document.getElementById('entryChipBg').value,
      chipText: document.getElementById('entryChipText').value
    } : null
  };
  if (activeCollection === 'JAV') {
    entry.actress = document.getElementById('actressInput').value.trim();
    entry.tags = document.getElementById('tagsInput').value.trim();
  } else {
    entry.publisher = document.getElementById('actressInput').value.trim();
    entry.genre = document.getElementById('tagsInput').value.trim();
  }

  if (editIndex !== null) {
    const idx = entries.findIndex(e => e.id === editIndex);
    entries[idx] = entry;
  } else {
    entries.unshift(entry);
  }

  saveToStorage();
  closeModal();
  render();
}

function deleteEntry(id) {
  if (!confirm('Wirklich löschen?')) return;
  entries = entries.filter(e => e.id !== id);
  saveToStorage();
  render();
}

// Event Listener
addBtn.addEventListener('click', () => openModal());
addActressBtn.addEventListener('click', () => openActressModal());
addCharacterBtn.addEventListener('click', () => openActressModal());
document.getElementById('saveActressBtn').addEventListener('click', saveActress);
document.getElementById('cancelActressBtn').addEventListener('click', closeActressModal);
actressPhotoInput.addEventListener('change', () => {
  const file = actressPhotoInput.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    actressPhotoInput.value = '';
    alert('Bitte wähle eine Bilddatei aus.');
    return;
  }
  if (actressPhotoUrl) URL.revokeObjectURL(actressPhotoUrl);
  actressPhotoUrl = URL.createObjectURL(file);
  document.getElementById('actressPreviewImage').src = actressPhotoUrl;
  document.getElementById('actressPhotoPreview').classList.remove('hidden');
  document.getElementById('removeActressPhotoInput').checked = false;
});
document.getElementById('removeActressPhotoInput').addEventListener('change', event => {
  if (actressPhotoInput.files.length) return;
  const preview = document.getElementById('actressPhotoPreview');
  const previewImage = document.getElementById('actressPreviewImage');
  if (event.target.checked) {
    previewImage.removeAttribute('src');
    preview.classList.add('hidden');
  } else if (actressPhotoUrl) {
    previewImage.src = actressPhotoUrl;
    preview.classList.remove('hidden');
  }
});
document.querySelectorAll('.view-tab').forEach(button => {
  button.addEventListener('click', () => setActiveView(button.dataset.view));
});
document.getElementById('actressColorsEnabled').addEventListener('change', event => {
  document.getElementById('actressColorFields').classList.toggle('color-fields-disabled', !event.target.checked);
  document.querySelectorAll('#actressColorFields input[type="color"], #actressCardGradient').forEach(input => {
    input.disabled = !event.target.checked;
  });
});
menuBtn.addEventListener('click', () => {
  const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!isExpanded));
  collectionMenu.classList.toggle('hidden', isExpanded);
});
collectionMenu.addEventListener('click', event => {
  const option = event.target.closest('[data-collection]');
  if (option) setCollection(option.dataset.collection);
});
settingsBtn.addEventListener('click', () => {
  collectionMenu.classList.add('hidden');
  menuBtn.setAttribute('aria-expanded', 'false');
  syncThemeControls();
  settingsModal.classList.remove('hidden');
});
document.getElementById('closeSettingsBtn').addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});
settingsModal.addEventListener('click', event => {
  if (event.target === settingsModal) settingsModal.classList.add('hidden');
});
document.querySelectorAll('[data-theme-color]').forEach(input => {
  input.addEventListener('input', () => {
    theme[input.dataset.themeColor] = input.value;
    saveTheme();
  });
});
document.getElementById('pageGradientInput').addEventListener('change', event => {
  theme.pageGradient = event.target.checked;
  saveTheme();
});
document.getElementById('cardGradientInput').addEventListener('change', event => {
  theme.cardGradient = event.target.checked;
  saveTheme();
});
document.getElementById('resetThemeBtn').addEventListener('click', () => {
  Object.assign(theme, defaultTheme);
  syncThemeControls();
  saveTheme();
});
document.getElementById('entryColorsEnabled').addEventListener('change', event => {
  document.getElementById('entryColorFields').classList.toggle('color-fields-disabled', !event.target.checked);
  document.querySelectorAll('#entryColorFields input[type="color"], #entryCardGradient').forEach(input => {
    input.disabled = !event.target.checked;
  });
});
saveBtn.addEventListener('click', saveEntry);
cancelBtn.addEventListener('click', closeModal);
searchInput.addEventListener('input', render);
sortSelect.addEventListener('change', () => {
  if (sortSelect.value.startsWith('actress-') && activeView !== 'actresses') {
    setActiveView('actresses');
    return;
  }
  if (sortSelect.value.startsWith('character-') && activeView !== 'characters') {
    setActiveView('characters');
    return;
  }
  render();
});

// Service Worker registrieren
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

// Initial render
applyTheme();
setCollection(activeCollection);