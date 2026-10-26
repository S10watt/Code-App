let entries = JSON.parse(localStorage.getItem('javEntries')) || [];
let editIndex = null;

const listEl = document.getElementById('list');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const modal = document.getElementById('modal');
const addBtn = document.getElementById('addBtn');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

function saveToStorage() {
  localStorage.setItem('javEntries', JSON.stringify(entries));
}

function render() {
  let filtered = [...entries];

  // Suche
  const query = searchInput.value.toLowerCase().trim();
  if (query) {
    filtered = filtered.filter(e =>
      e.code.toLowerCase().includes(query) ||
      e.category.toLowerCase().includes(query) ||
      e.actress.toLowerCase().includes(query) ||
      e.tags.toLowerCase().includes(query)
    );
  }

  // Sortierung
  const sortBy = sortSelect.value;
  filtered.sort((a, b) => {
    if (sortBy === 'date') return b.id - a.id;
    return a[sortBy].localeCompare(b[sortBy]);
  });

  listEl.innerHTML = filtered.length === 0
    ? '<p style="text-align:center;color:#666;margin-top:40px;">Keine Einträge gefunden</p>'
    : filtered.map((entry, index) => `
      <div class="card">
        <button class="delete-btn" onclick="deleteEntry(${entry.id})">×</button>
        <div class="code">${entry.code}</div>
        <div class="category">${entry.category || 'Ohne Kategorie'}</div>
        <div class="actress">${entry.actress || '–'}</div>
        <div class="tags">${entry.tags || ''}</div>
      </div>
    `).join('');
}

function openModal(editId = null) {
  editIndex = editId;
  modal.classList.remove('hidden');
  document.getElementById('modalTitle').textContent = editId !== null ? 'Bearbeiten' : 'Neuer Eintrag';

  if (editId !== null) {
    const entry = entries.find(e => e.id === editId);
    document.getElementById('codeInput').value = entry.code;
    document.getElementById('categoryInput').value = entry.category;
    document.getElementById('actressInput').value = entry.actress;
    document.getElementById('tagsInput').value = entry.tags;
  } else {
    document.getElementById('codeInput').value = '';
    document.getElementById('categoryInput').value = '';
    document.getElementById('actressInput').value = '';
    document.getElementById('tagsInput').value = '';
  }
}

function closeModal() {
  modal.classList.add('hidden');
  editIndex = null;
}

function saveEntry() {
  const code = document.getElementById('codeInput').value.trim();
  if (!code) return alert('Code ist Pflicht!');

  const entry = {
    id: editIndex !== null ? editIndex : Date.now(),
    code,
    category: document.getElementById('categoryInput').value.trim(),
    actress: document.getElementById('actressInput').value.trim(),
    tags: document.getElementById('tagsInput').value.trim()
  };

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
saveBtn.addEventListener('click', saveEntry);
cancelBtn.addEventListener('click', closeModal);
searchInput.addEventListener('input', render);
sortSelect.addEventListener('change', render);

// Service Worker registrieren
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

// Initial render
render();