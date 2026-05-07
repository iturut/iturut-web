import { 
  auth, 
  db, 
  signOut,
  onAuthStateChanged,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy
} from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

let currentUser = null;
let selectedNoteId = null;

async function initApp() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    currentUser = user;
    document.getElementById('profileEmail').textContent = user.email;
    setupEventListeners();
    loadCategories();
    loadNotes();
  });
}

function setupEventListeners() {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await signOut(auth);
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Çıkış yapılamadı:', error);
    }
  });

  document.getElementById('addNoteBtn').addEventListener('click', createNewNote);
  document.getElementById('saveNoteBtn').addEventListener('click', saveCurrentNote);
  document.getElementById('deleteNoteBtn').addEventListener('click', deleteCurrentNote);

  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      formatText(e.target.dataset.format);
    });
  });

  // NOT: Seçilen kategoriye göre filtreleme yapılır
  document.getElementById('categorySelect').addEventListener('change', () => {
    const selectedCategoryId = document.getElementById('categorySelect').value;
    loadNotes(selectedCategoryId);
  });
}

async function loadCategories() {
  const categorySelect = document.getElementById('categorySelect');
  try {
    const q = query(collection(db, "categories"), where("userId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);

    categorySelect.innerHTML = '<option value="all">Tüm Kategoriler</option>';

    querySnapshot.forEach((doc) => {
      const category = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Kategoriler yüklenemedi:', error);
  }
}

async function loadNotes(categoryId = 'all') {
  const notesList = document.getElementById('notesList');
  notesList.innerHTML = '<div class="note-item">Yükleniyor...</div>';

  try {
    let q;
    if (categoryId === 'all') {
      q = query(
        collection(db, "notes"), 
        where("userId", "==", currentUser.uid),
        orderBy("updatedAt", "desc")
      );
    } else {
      q = query(
        collection(db, "notes"), 
        where("userId", "==", currentUser.uid),
        where("categoryId", "==", categoryId),
        orderBy("updatedAt", "desc")
      );
    }

    const querySnapshot = await getDocs(q);
    notesList.innerHTML = '';

    if (querySnapshot.empty) {
      notesList.innerHTML = '<div class="note-item">Bu kategoride hiç not yok</div>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const note = doc.data();
      const noteItem = document.createElement('div');
      noteItem.className = 'note-item';
      noteItem.dataset.id = doc.id;

      const date = note.updatedAt?.toDate() || note.createdAt?.toDate() || new Date();
      const formattedDate = date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      noteItem.innerHTML = `
        <h4>${note.title || 'Başlıksız Not'}</h4>
        <p>${note.content ? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '') : 'İçerik yok'}</p>
        <small>${formattedDate}</small>
        <span class="note-category">${note.categoryName || 'Kategorisiz'}</span>
      `;

      noteItem.addEventListener('click', () => {
        loadNoteContent(doc.id, note);
      });

      notesList.appendChild(noteItem);
    });
  } catch (error) {
    console.error('Notlar yüklenemedi:', error);
    notesList.innerHTML = '<div class="note-item">Hata oluştu</div>';
  }
}

async function createNewNote() {
  const title = prompt('Not başlığını girin:', 'Yeni Not');
  if (!title) return;

  const categorySelect = document.getElementById('categorySelect');
  const selectedCategoryId = categorySelect.value;
  const selectedCategoryName = categorySelect.options[categorySelect.selectedIndex].text;

  try {
    const newNote = {
      title: title,
      content: 'Buraya not içeriğinizi yazın...',
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      categoryId: selectedCategoryId,
      categoryName: selectedCategoryName
    };

    const docRef = await addDoc(collection(db, "notes"), newNote);
    loadNotes(selectedCategoryId);
    loadNoteContent(docRef.id, newNote);
  } catch (error) {
    console.error('Not oluşturulamadı:', error);
    alert('Hata: Not oluşturulamadı');
  }
}

async function loadNoteContent(noteId, noteData = null) {
  const noteEditor = document.getElementById('noteEditor');
  selectedNoteId = noteId;

  try {
    if (!noteData) {
      const docSnap = await getDoc(doc(db, "notes", noteId));
      if (!docSnap.exists()) {
        noteEditor.innerHTML = 'Not bulunamadı';
        return;
      }
      noteData = docSnap.data();
    }

    noteEditor.innerHTML = `
      <h2 contenteditable="true" id="noteTitle">${noteData.title || 'Başlıksız Not'}</h2>
      <div contenteditable="true" id="noteContent">${noteData.content || ''}</div>
    `;

    const categorySelect = document.getElementById('categorySelect');
    if (noteData.categoryId) {
      categorySelect.value = noteData.categoryId;
    } else {
      categorySelect.value = 'all';
    }

    setupAutoSave(noteId);
  } catch (error) {
    console.error('Not yüklenemedi:', error);
    noteEditor.innerHTML = 'Not yüklenirken hata oluştu';
  }
}

function setupAutoSave(noteId) {
  const titleElement = document.getElementById('noteTitle');
  const contentElement = document.getElementById('noteContent');
  let saveTimeout;

  const saveChanges = async () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      await saveNote(noteId);
    }, 1500);
  };

  titleElement.addEventListener('input', saveChanges);
  contentElement.addEventListener('input', saveChanges);
}

async function saveCurrentNote() {
  if (!selectedNoteId) return;
  await saveNote(selectedNoteId);
  alert('Not kaydedildi!');
}

async function saveNote(noteId) {
  try {
    const title = document.getElementById('noteTitle').textContent;
    const content = document.getElementById('noteContent').innerHTML;

    await updateDoc(doc(db, "notes", noteId), {
      title: title,
      content: content,
      updatedAt: serverTimestamp()
    });

    const categorySelect = document.getElementById('categorySelect');
    const selectedCategory = categorySelect ? categorySelect.value : 'all';
    loadNotes(selectedCategory);
  } catch (error) {
    console.error('Not kaydedilemedi:', error);
  }
}

async function deleteCurrentNote() {
  if (!selectedNoteId || !confirm('Bu notu silmek istediğinize emin misiniz?')) return;

  try {
    await deleteDoc(doc(db, "notes", selectedNoteId));
    document.getElementById('noteEditor').innerHTML = 'Not seçin veya yeni not oluşturun...';
    selectedNoteId = null;
    loadNotes();
  } catch (error) {
    console.error('Not silinemedi:', error);
    alert('Not silinirken hata oluştu');
  }
}

function formatText(format) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();
  if (!selectedText) return;

  let formattedText;
  switch (format) {
    case 'bold':
      formattedText = `<strong>${selectedText}</strong>`;
      break;
    case 'italic':
      formattedText = `<em>${selectedText}</em>`;
      break;
    case 'underline':
      formattedText = `<u>${selectedText}</u>`;
      break;
    default:
      return;
  }

  const newNode = document.createElement('div');
  newNode.innerHTML = formattedText;

  range.deleteContents();
  range.insertNode(newNode.firstChild);
  selection.removeAllRanges();
}

document.getElementById('addCategoryBtn').addEventListener('click', async () => {
  const categoryName = prompt('Kategori adı girin:');
  if (!categoryName) return;

  try {
    await addDoc(collection(db, "categories"), {
      name: categoryName,
      userId: currentUser.uid,
      createdAt: serverTimestamp()
    });

    loadCategories();
  } catch (error) {
    console.error('Kategori eklenemedi:', error);
    alert('Kategori eklenemedi.');
  }
});
