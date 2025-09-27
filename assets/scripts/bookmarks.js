const STORAGE_KEY = 'mm-bookmarks';
const ANALYTICS_KEY = 'mm-share-stats';
const BOOKMARK_EVENT = 'mm:bookmark-change';

const clone = (value) => JSON.parse(JSON.stringify(value));

const supportsStorage = (() => {
  try {
    const testKey = '__mm_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('localStorage unavailable', error);
    return false;
  }
})();

const storage = {
  read(key, fallback = []) {
    if (!supportsStorage) return clone(fallback);
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return clone(fallback);
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Failed to read storage', key, error);
      return clone(fallback);
    }
  },
  write(key, value) {
    if (!supportsStorage) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to write storage', key, error);
    }
  }
};

const bookmarks = {
  list: [],
  init() {
    this.list = storage.read(STORAGE_KEY, []);
  },
  save() {
    storage.write(STORAGE_KEY, this.list);
    window.dispatchEvent(new CustomEvent(BOOKMARK_EVENT, { detail: { bookmarks: this.list } }));
  },
  find(id) {
    return this.list.find((item) => item.id === id);
  },
  toggle(entry) {
    const existing = this.find(entry.id);
    if (existing) {
      this.list = this.list.filter((item) => item.id !== entry.id);
      this.save();
      return false;
    }
    const now = new Date().toISOString();
    this.list.unshift({
      ...entry,
      addedAt: now
    });
    this.save();
    return true;
  }
};

const analytics = {
  logShare(type) {
    if (!supportsStorage) return;
    try {
      const data = storage.read(ANALYTICS_KEY, { total: 0, byType: {} });
      data.total += 1;
      data.byType[type] = (data.byType[type] || 0) + 1;
      storage.write(ANALYTICS_KEY, data);
    } catch (error) {
      console.warn('Share analytics unavailable', error);
    }
  }
};

function decodePayload(node) {
  const payload = node?.dataset?.bookmark;
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload);
    return {
      id: parsed.id,
      title: parsed.title,
      url: parsed.url,
      excerpt: parsed.excerpt || '',
      author: parsed.author || '',
      tags: Array.isArray(parsed.tags)
        ? parsed.tags
        : typeof parsed.tags === 'string' && parsed.tags
        ? parsed.tags.split(',').map((tag) => tag.trim())
        : [],
      coverImage: parsed.coverImage || null
    };
  } catch (error) {
    console.warn('Invalid bookmark payload', error);
    return null;
  }
}

function formatCount(value) {
  return new Intl.NumberFormat().format(value);
}

function setButtonState(button, active) {
  if (!button) return;
  button.classList.toggle('is-active', active);
  button.setAttribute('aria-pressed', active ? 'true' : 'false');
  button.dataset.bookmarkActive = active ? 'true' : 'false';
  const label = active ? 'Remove bookmark' : 'Save to bookmarks';
  button.setAttribute('aria-label', label);
  const textNode = button.querySelector('[data-bookmark-label]');
  if (textNode) {
    textNode.textContent = active ? 'Saved' : 'Save';
  }
}

function syncButtons(buttons) {
  buttons.forEach((button) => {
    const payload = decodePayload(button);
    if (!payload) return;
    const active = Boolean(bookmarks.find(payload.id));
    setButtonState(button, active);
  });
}

function updateIndicator(indicator, list) {
  if (!indicator) return;
  const count = list.length;
  const countNode = indicator.querySelector('[data-bookmark-count]');
  if (countNode) countNode.textContent = formatCount(count);
  indicator.toggleAttribute('hidden', count === 0);
}

function copyToClipboard(text) {
  if (!navigator?.clipboard) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (error) {
      console.warn('Copy command failed', error);
    }
    document.body.removeChild(textarea);
    return;
  }
  navigator.clipboard.writeText(text).catch((error) => {
    console.warn('Clipboard API failed', error);
  });
}

function handleShareClick(event) {
  const button = event.target.closest('[data-share-button]');
  if (!button) return;
  const type = button.dataset.shareButton;
  const url = button.dataset.shareUrl || window.location.href;
  const title = button.dataset.shareTitle || document.title;
  const text = button.dataset.shareText || '';
  analytics.logShare(type);

  switch (type) {
    case 'copy': {
      copyToClipboard(url);
      button.classList.add('is-success');
      setTimeout(() => button.classList.remove('is-success'), 1500);
      break;
    }
    case 'twitter': {
      const share = new URL('https://twitter.com/intent/tweet');
      share.searchParams.set('text', `${title} ${url}`.trim());
      window.open(share.toString(), '_blank', 'noopener');
      break;
    }
    case 'linkedin': {
      const share = new URL('https://www.linkedin.com/shareArticle');
      share.searchParams.set('mini', 'true');
      share.searchParams.set('url', url);
      share.searchParams.set('title', title);
      share.searchParams.set('summary', text);
      window.open(share.toString(), '_blank', 'noopener');
      break;
    }
    case 'email': {
      const mail = new URL('mailto:');
      mail.searchParams.set('subject', title);
      mail.searchParams.set('body', `${text}\n\n${url}`.trim());
      window.location.href = mail.toString();
      break;
    }
    default:
      break;
  }
}

function enhanceAnchors(container) {
  if (!container) return;
  const nodes = container.querySelectorAll('h2, h3, h4, h5, h6');
  nodes.forEach((node) => {
    if (!node.id) {
      const base = node.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!base) return;
      const dupes = container.querySelectorAll(`#${base}`).length;
      node.id = dupes ? `${base}-${dupes + 1}` : base;
    }
    const anchor = document.createElement('button');
    anchor.type = 'button';
    anchor.className = 'anchor-link';
    anchor.setAttribute('aria-label', 'Copy link to this section');
    anchor.dataset.anchorTarget = node.id;
    node.insertAdjacentElement('afterbegin', anchor);
  });
  container.addEventListener('click', (event) => {
    const button = event.target.closest('[data-anchor-target]');
    if (!button) return;
    const link = `${window.location.origin}${window.location.pathname}#${button.dataset.anchorTarget}`;
    copyToClipboard(link);
    button.classList.add('is-success');
    setTimeout(() => button.classList.remove('is-success'), 1200);
  });
}

function setupKeyboardShortcuts(articleButton) {
  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input, textarea')) return;
    if (event.key.toLowerCase() === 'b') {
      articleButton?.click();
    }
  });
}

function renderBookmarksPage(manager) {
  const container = document.querySelector('[data-bookmarks-page]');
  if (!container) return;
  const listNode = container.querySelector('[data-bookmarks-list]');
  const emptyState = container.querySelector('[data-bookmarks-empty]');
  const searchInput = container.querySelector('[data-bookmarks-search]');
  const sortSelect = container.querySelector('[data-bookmarks-sort]');
  const exportBtn = container.querySelector('[data-bookmarks-export]');
  const importBtn = container.querySelector('[data-bookmarks-import]');
  const fileInput = container.querySelector('[data-bookmarks-file]');

  const render = () => {
    const query = searchInput.value.trim().toLowerCase();
    const sortBy = sortSelect.value;
    let items = manager.list.slice();
    if (query) {
      items = items.filter((item) =>
        item.title.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        item.author.toLowerCase().includes(query)
      );
    }
    if (sortBy === 'title') {
      items.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'author') {
      items.sort((a, b) => a.author.localeCompare(b.author));
    } else {
      items.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    }

    listNode.innerHTML = '';
    if (!items.length) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;
    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'bookmark-card';
      const header = document.createElement('div');
      header.className = 'bookmark-card__header';
      const title = document.createElement('h2');
      title.textContent = item.title;
      header.append(title);
      const actions = document.createElement('div');
      actions.className = 'bookmark-card__actions';
      const readLink = document.createElement('a');
      readLink.href = item.url;
      readLink.textContent = 'Open';
      readLink.className = 'button button--ghost';
      actions.append(readLink);
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = 'Remove';
      removeBtn.className = 'button';
      removeBtn.addEventListener('click', () => {
        manager.toggle({ id: item.id });
        render();
      });
      actions.append(removeBtn);
      header.append(actions);
      card.append(header);
      if (item.author) {
        const author = document.createElement('p');
        author.className = 'bookmark-card__author';
        author.textContent = item.author;
        card.append(author);
      }
      if (item.excerpt) {
        const excerpt = document.createElement('p');
        excerpt.className = 'bookmark-card__excerpt';
        excerpt.textContent = item.excerpt;
        card.append(excerpt);
      }
      if (item.tags.length) {
        const tags = document.createElement('ul');
        tags.className = 'bookmark-card__tags';
        item.tags.forEach((tag) => {
          const tagItem = document.createElement('li');
          tagItem.textContent = `#${tag}`;
          tags.append(tagItem);
        });
        card.append(tags);
      }
      const added = document.createElement('p');
      added.className = 'bookmark-card__date';
      added.textContent = `Saved ${new Date(item.addedAt).toLocaleString()}`;
      card.append(added);
      listNode.append(card);
    });
  };

  searchInput.addEventListener('input', render);
  sortSelect.addEventListener('change', render);
  exportBtn.addEventListener('click', () => {
    const data = JSON.stringify(manager.list, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bookmarks.json';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
  importBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid bookmark data');
      manager.list = data
        .filter((item) => item && item.id)
        .map((item) => ({
          ...item,
          tags: Array.isArray(item.tags) ? item.tags : [],
          addedAt: item.addedAt || new Date().toISOString()
        }));
      manager.save();
      render();
    } catch (error) {
      alert('Could not import bookmarks. Please check the file and try again.');
      console.warn('Bookmark import failed', error);
    } finally {
      event.target.value = '';
    }
  });

  render();
  window.addEventListener(BOOKMARK_EVENT, render);
}

function enhanceBookmarkButtons(manager) {
  const buttons = Array.from(document.querySelectorAll('[data-bookmark-button]'));
  if (!buttons.length) return;
  buttons.forEach((button) => {
    const payload = decodePayload(button);
    if (!payload) return;
    button.addEventListener('click', () => {
      const active = manager.toggle(payload);
      setButtonState(button, active);
    });
  });
  syncButtons(buttons);
  window.addEventListener(BOOKMARK_EVENT, () => syncButtons(buttons));
  const articleButton = buttons.find((btn) => btn.dataset.bookmarkContext === 'article');
  setupKeyboardShortcuts(articleButton);
}

function enhanceBookmarkIndicator(manager) {
  const indicator = document.querySelector('[data-bookmark-indicator]');
  if (!indicator) return;
  updateIndicator(indicator, manager.list);
  window.addEventListener(BOOKMARK_EVENT, (event) => updateIndicator(indicator, event.detail.bookmarks));
}

function enhanceShareButtons() {
  document.addEventListener('click', handleShareClick);
}

function initFloatingActions(manager) {
  const floater = document.querySelector('[data-floating-actions]');
  if (!floater) return;
  const bookmarkBtn = floater.querySelector('[data-bookmark-button]');
  const copyBtn = floater.querySelector('[data-share-button="copy"]');
  const footer = document.querySelector('.article-reader__footer');
  if (footer) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        floater.classList.toggle('is-hidden', entry.isIntersecting);
      });
    }, { threshold: 0.1 });
    observer.observe(footer);
  }
  copyBtn?.addEventListener('click', () => {
    const url = copyBtn.dataset.shareUrl || window.location.href;
    copyToClipboard(url);
  });
  if (bookmarkBtn) {
    const payload = decodePayload(bookmarkBtn);
    bookmarkBtn.addEventListener('click', () => {
      const active = manager.toggle(payload);
      setButtonState(bookmarkBtn, active);
    });
    setButtonState(bookmarkBtn, Boolean(manager.find(payload.id)));
  }
}

function initHighContrastSupport() {
  const mq = window.matchMedia('(prefers-contrast: more)');
  const root = document.documentElement;
  const update = () => {
    root.classList.toggle('prefers-contrast', mq.matches);
  };
  update();
  mq.addEventListener('change', update);
}

function init() {
  bookmarks.init();
  enhanceBookmarkButtons(bookmarks);
  enhanceBookmarkIndicator(bookmarks);
  enhanceShareButtons();
  enhanceAnchors(document.querySelector('.article-reader__content'));
  initFloatingActions(bookmarks);
  renderBookmarksPage(bookmarks);
  initHighContrastSupport();

  window.addEventListener(BOOKMARK_EVENT, (event) => {
    updateIndicator(document.querySelector('[data-bookmark-indicator]'), event.detail.bookmarks);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
