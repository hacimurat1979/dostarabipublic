document.addEventListener('DOMContentLoaded', async function() {
  const i18n = window.DostI18n;

  let booksData = [];
  let selectedBook = null;

  // Load book data
  async function loadBooks() {
    try {
      const response = await fetch('data/ibn-arabi/book-map.json');
      const data = await response.json();
      booksData = data.books || [];
      renderBooks();
    } catch (error) {
      console.error('Error loading books:', error);
    }
  }

  // Render book cards in the grid
  function renderBooks() {
    const grid = document.getElementById('booksGrid');
    grid.innerHTML = '';

    booksData.forEach(book => {
      const card = document.createElement('div');
      card.className = 'book-card';

      const title = i18n.pick3(book.title);
      const overview = i18n.pick3(book.overview);
      const period = book.year_written ? `${book.year_written.start}-${book.year_written.end}` : '';
      const place = i18n.pick3(book.place_written);

      card.innerHTML = `
        <h3>${title}</h3>
        <div class="author">${book.author}</div>
        <div class="overview-preview">${overview}</div>
        <div class="meta">
          <span><span class="meta-label">Volumes:</span> <span class="meta-value">${book.volumes}</span></span>
          <span><span class="meta-label">Period:</span> <span class="meta-value">${period}</span></span>
        </div>
      `;

      card.addEventListener('click', () => showBookDetails(book));
      grid.appendChild(card);
    });
  }

  // Show book details panel
  function showBookDetails(book) {
    selectedBook = book;
    const panel = document.getElementById('bookDetailsPanel');

    // Update header
    document.getElementById('bookTitle').textContent = i18n.pick3(book.title);
    document.getElementById('bookAuthor').textContent = book.author;

    // Update overview tab
    document.getElementById('bookOverview').textContent = i18n.pick3(book.overview);
    document.getElementById('bookVolumes').textContent = book.volumes;
    document.getElementById('bookPeriod').textContent =
      book.year_written ? `${book.year_written.start}-${book.year_written.end}` : '';
    document.getElementById('bookLocation').textContent = i18n.pick3(book.place_written);

    // Update concepts tab
    renderConcepts(book);

    // Update structure tab
    renderStructure(book);

    // Update sources tab
    renderCommentaries(book);

    // Show panel and reset to overview tab
    panel.style.display = 'block';
    resetTabs();

    // Smooth scroll to panel
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Render concepts
  function renderConcepts(book) {
    const container = document.getElementById('conceptsList');
    container.innerHTML = '';

    if (book.key_concepts && book.key_concepts.length > 0) {
      book.key_concepts.forEach(concept => {
        const tag = document.createElement('div');
        tag.className = 'concept-tag';
        tag.textContent = concept;
        container.appendChild(tag);
      });
    }
  }

  // Render structure
  function renderStructure(book) {
    const structureContainer = document.getElementById('structureList');
    const themesContainer = document.getElementById('themesList');
    const prophetsContainer = document.getElementById('prophetsList');

    structureContainer.innerHTML = '';
    themesContainer.innerHTML = '';
    prophetsContainer.innerHTML = '';

    // Render major sections
    if (book.major_sections && book.major_sections.length > 0) {
      book.major_sections.forEach(section => {
        const item = document.createElement('div');
        item.className = 'structure-item';
        item.innerHTML = `
          <strong>${i18n.pick3(section.title)}</strong>
          <div class="range">Chapters: ${section.chapters}</div>
          <div class="focus">Focus: ${section.focus}</div>
        `;
        structureContainer.appendChild(item);
      });
    }

    // Render key themes
    if (book.key_themes && book.key_themes.length > 0) {
      book.key_themes.forEach(theme => {
        const item = document.createElement('div');
        item.className = 'theme-item';
        item.innerHTML = `
          <strong class="theme-name">${i18n.pick3(theme.name)}</strong>
          <div class="range">Chapters: ${theme.chapters_range}</div>
        `;
        themesContainer.appendChild(item);
      });
    }

    // Render prophets
    if (book.key_prophets && book.key_prophets.length > 0) {
      book.key_prophets.forEach(prophet => {
        const item = document.createElement('div');
        item.className = 'prophet-item';
        const chapters = Array.isArray(prophet.chapters)
          ? prophet.chapters.join(', ')
          : prophet.chapter || '';
        item.innerHTML = `
          <strong class="prophet-name">${i18n.pick3(prophet.name)}</strong>
          <div class="prophet-theme">${prophet.theme}</div>
          <div class="range">Chapter(s): ${chapters}</div>
        `;
        prophetsContainer.appendChild(item);
      });
    }
  }

  // Render commentaries
  function renderCommentaries(book) {
    const container = document.getElementById('commentariesList');
    container.innerHTML = '';

    if (book.commentaries && book.commentaries.length > 0) {
      book.commentaries.forEach(commentary => {
        const item = document.createElement('div');
        item.className = 'commentary-item';
        item.innerHTML = `
          <div class="author">${commentary.author}</div>
          <div class="year">${commentary.year} • ${commentary.language}</div>
          <div class="volumes">Volumes: ${commentary.volumes}</div>
          ${commentary.note ? `<div class="note">${i18n.pick3(commentary.note)}</div>` : ''}
        `;
        container.appendChild(item);
      });
    }
  }

  // Tab switching
  function resetTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.style.display = 'none');

    tabs[0].classList.add('active');
    document.getElementById('overviewTab').style.display = 'block';
  }

  // Tab click handlers
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');

      // Update active tab
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      // Update content visibility
      document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
      });

      const tabId = tabName + 'Tab';
      const tab = document.getElementById(tabId);
      if (tab) {
        tab.style.display = 'block';
      }
    });
  });

  // Close details panel
  document.getElementById('closeDetailsBtn').addEventListener('click', function() {
    document.getElementById('bookDetailsPanel').style.display = 'none';
    selectedBook = null;
  });

  // Language switcher
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = i18n.getLang();
    langSelect.addEventListener('change', function(e) {
      i18n.setLang(e.target.value);
      i18n.applyStatic();
      renderBooks();
      if (selectedBook) {
        showBookDetails(selectedBook);
      }
    });
  }

  // Initial load
  loadBooks();
});
