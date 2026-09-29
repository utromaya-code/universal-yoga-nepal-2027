'use strict';

// Navigation stays accessible while reading long program lists.
const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
const header = document.querySelector('#site-header');
function closeMenu(returnFocus = false) {
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
  if (returnFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  mobileMenu.hidden = open;
  menuButton.setAttribute('aria-expanded', String(!open));
  menuButton.setAttribute('aria-label', open ? 'Открыть меню' : 'Закрыть меню');
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileMenu.hidden) closeMenu(true);
});
window.addEventListener('resize', () => { if (window.innerWidth > 800) closeMenu(); });
function updateHeader() { header.classList.toggle('scrolled', window.scrollY > 40); }
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

// All five curricula are in the HTML; tabs only choose what is visible.
const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
function selectPart(index, focus = false, updateAddress = true) {
  tabs.forEach((tab, i) => {
    const selected = i === index;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    tab.classList.toggle('active', selected);
    panels[i].hidden = !selected;
  });
  if (focus) tabs[index].focus({ preventScroll: true });
  const strip = document.querySelector('.part-tabs');
  if (strip.scrollWidth > strip.clientWidth) {
    const selectedTab = tabs[index];
    const targetLeft = selectedTab.offsetLeft - strip.offsetLeft - (strip.clientWidth - selectedTab.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, targetLeft), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  if (updateAddress) history.replaceState(null, '', `#part-${index + 1}`);
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectPart(index));
  tab.addEventListener('keydown', event => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectPart(next, true);
  });
});
function selectPartFromAddress() {
  const match = location.hash.match(/^#part-([1-5])$/);
  if (match) {
    selectPart(Number(match[1]) - 1, false, false);
    // A direct link should show its selection controls above the content.
    document.querySelector('#programs').scrollIntoView({ behavior: 'instant' });
  }
}
selectPartFromAddress();
window.addEventListener('hashchange', selectPartFromAddress);
window.addEventListener('resize', () => {
  const index = tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
  if (index >= 0) selectPart(index, false, false);
});

// Early prices use the attendance rate plus the optional $100 certificate exam.
const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
const examCheckbox = document.querySelector('#with-exam');
const examSurcharge = document.querySelector('[data-exam-surcharge]');
function updatePrices() {
  const repeated = document.querySelector('input[name="attendance"]:checked').value === 'repeat';
  const withExam = examCheckbox.checked;
  const early = (repeated ? 1330 : 1580) + (withExam ? 100 : 0);
  const standard = early + 200;
  document.querySelector('#price-early').textContent = String(early);
  document.querySelector('#price-standard').textContent = String(standard);
  examSurcharge.hidden = !withExam;
  const context = `${repeated ? 'Повторное' : 'Первое'} прохождение · ${withExam ? 'с экзаменом на сертификат' : 'без экзамена'}`;
  document.querySelectorAll('[data-price-context]').forEach(item => { item.textContent = context; });
}
attendanceRadios.forEach(input => input.addEventListener('change', updatePrices));
examCheckbox.addEventListener('change', updatePrices);
updatePrices();

// Native dialog provides keyboard focus containment and Escape support.
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
const photoDialog = document.querySelector('.photo-dialog');
const photoImage = document.querySelector('#dialog-image');
const photoCaption = document.querySelector('#photo-caption');
const photoIndex = document.querySelector('#photo-index');
let currentPhoto = 0;
let photoOpener = null;
function displayPhoto(index) {
  currentPhoto = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[currentPhoto];
  photoImage.src = item.dataset.gallerySrc;
  photoImage.alt = item.querySelector('img').alt;
  photoCaption.textContent = item.dataset.caption;
  photoIndex.textContent = `${currentPhoto + 1} / ${galleryItems.length}`;
}
galleryItems.forEach((item, index) => {
  item.addEventListener('click', () => {
    photoOpener = item;
    displayPhoto(index);
    photoDialog.showModal();
    document.body.classList.add('dialog-open');
    photoDialog.querySelector('.dialog-close').focus();
  });
});
document.querySelector('.dialog-close').addEventListener('click', () => photoDialog.close());
document.querySelector('#photo-prev').addEventListener('click', () => displayPhoto(currentPhoto - 1));
document.querySelector('#photo-next').addEventListener('click', () => displayPhoto(currentPhoto + 1));
photoDialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') { event.preventDefault(); displayPhoto(currentPhoto + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); displayPhoto(currentPhoto - 1); }
});
photoDialog.addEventListener('click', event => {
  if (event.target !== photoDialog) return;
  const rect = photoDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) photoDialog.close();
});
photoDialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  if (photoOpener) photoOpener.focus({ preventScroll: true });
});
