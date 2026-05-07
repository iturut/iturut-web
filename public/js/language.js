// Dil değiştirme fonksiyonu
function changeLanguage() {
  const lang = document.getElementById('languageSelector').value;
  localStorage.setItem('preferredLanguage', lang);
  
  if(lang === 'en') {
    window.location.href = 'index-en.html'; // İngilizce sayfa
  } else {
    window.location.href = 'index.html'; // Türkçe sayfa
  }
}

// Sayfa yüklendiğinde dil kontrolü
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('preferredLanguage');
  if(savedLang) {
    document.getElementById('languageSelector').value = savedLang;
  }
});