// Lab Activity 4 - ES6+ and async data handling
// API: https://jsonplaceholder.typicode.com/

const API_URL = 'https://jsonplaceholder.typicode.com';

let posts = [];
let users = [];

const postsContainer = document.getElementById('posts-container');
const emptyState = document.getElementById('empty-state');
const loadingIndicator = document.getElementById('loading-indicator');
const searchInput = document.getElementById('search-input');
const filterAuthor = document.getElementById('filter-author');
const sortSelect = document.getElementById('sort-select');
const refreshBtn = document.getElementById('refresh-btn');
const statusMessage = document.getElementById('status-message');

const statTotalPosts = document.getElementById('stat-total-posts');
const statTotalAuthors = document.getElementById('stat-total-authors');
const statAvgWords = document.getElementById('stat-avg-words');

const createPostForm = document.getElementById('create-post-form');
const postTitleInput = document.getElementById('post-title');
const postAuthorSelect = document.getElementById('post-author');
const postBodyInput = document.getElementById('post-body');


// ----- fetching -----

// a post from the API only has a userId, so look up the rest of what a card needs
const withAuthor = (post) => {
  const author = users.find((user) => user.id === post.userId);

  return {
    ...post,
    authorName: author ? author.name : 'Unknown Author',
    authorEmail: author ? author.email : '',
    wordCount: post.body.trim().split(/\s+/).length
  };
};

// both requests go out together, no point waiting for one before starting the other
const fetchData = async () => {
  loadingIndicator.style.display = 'block';
  postsContainer.innerHTML = '';
  hideStatus();

  try {
    const [postsResponse, usersResponse] = await Promise.all([
      fetch(`${API_URL}/posts`),
      fetch(`${API_URL}/users`)
    ]);

    if (!postsResponse.ok || !usersResponse.ok) {
      throw new Error('Failed to fetch data from API');
    }

    const rawPosts = await postsResponse.json();
    users = await usersResponse.json();

    posts = rawPosts.map(withAuthor);

    populateAuthorDropdown();
    applyFilterAndSort();
    showStatus('Live data successfully fetched from JSONPlaceholder API!', 'success');

  } catch (error) {
    console.error('Error fetching data:', error);
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    loadingIndicator.style.display = 'none';
  }
};

// comments load only when the button is clicked, not on page load
const fetchComments = async (postId, buttonElement) => {
  const commentsDiv = document.getElementById(`comments-${postId}`);

  // second click closes it again
  if (commentsDiv.style.display === 'block') {
    commentsDiv.style.display = 'none';
    buttonElement.textContent = 'View Comments';
    return;
  }

  commentsDiv.style.display = 'block';
  commentsDiv.innerHTML = '<p><em>Loading comments...</em></p>';

  try {
    const response = await fetch(`${API_URL}/posts/${postId}/comments`);

    if (!response.ok) {
      throw new Error('Could not load comments');
    }

    const comments = await response.json();

    commentsDiv.innerHTML = `
      <div class="comments-title"><strong>Comments (${comments.length}):</strong></div>
      ${comments.map(() => `
        <div class="comment-item">
          <p class="comment-author"><strong class="comment-name"></strong> <span class="comment-email"></span></p>
          <p class="comment-body"></p>
        </div>
      `).join('')}
    `;

    // same idea as the post cards, the API text is only ever set as text
    commentsDiv.querySelectorAll('.comment-item').forEach((item, index) => {
      const { name, email, body } = comments[index];

      item.querySelector('.comment-name').textContent = name;
      item.querySelector('.comment-email').textContent = `(${email})`;
      item.querySelector('.comment-body').textContent = body;
    });

    buttonElement.textContent = `Hide Comments (${comments.length})`;

  } catch (error) {
    commentsDiv.textContent = `Error: ${error.message}`;
  }
};


// ----- rendering -----

// the same options are reused by the filter and the create form
const populateAuthorDropdown = () => {
  const fill = (select, firstLabel, firstValue) => {
    select.innerHTML = '';

    [{ id: firstValue, name: firstLabel }, ...users].forEach(({ id, name }) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      select.appendChild(option);
    });
  };

  fill(filterAuthor, 'All Authors', 'ALL');
  fill(postAuthorSelect, 'Select an author...', '');
};

const displayPosts = (postsToDisplay) => {
  if (postsToDisplay.length === 0) {
    postsContainer.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  // only ids and numbers go into the markup itself
  postsContainer.innerHTML = postsToDisplay.map(({ id, wordCount }) => `
      <div class="post-card" id="post-${id}">
        <div class="post-header">
          <h3 class="post-title"></h3>
          <span class="badge">${wordCount} words</span>
        </div>
        <p class="post-author-info">By: <strong class="author-name"></strong> | <span class="author-email"></span></p>
        <p class="post-body"></p>

        <div class="post-footer">
          <button class="btn btn-secondary btn-sm" data-action="comments" data-id="${id}">
            View Comments
          </button>
          <div class="post-actions">
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${id}">Delete</button>
          </div>
        </div>

        <div id="comments-${id}" class="comments-container" style="display: none;"></div>
      </div>
    `).join('');

  // the text goes in with textContent, so a post titled "<img onerror=...>" stays text
  postsToDisplay.forEach(({ id, title, body, authorName, authorEmail }) => {
    const card = document.getElementById(`post-${id}`);

    card.querySelector('.post-title').textContent = `#${id} - ${title}`;
    card.querySelector('.author-name').textContent = authorName;
    card.querySelector('.author-email').textContent = authorEmail;
    card.querySelector('.post-body').textContent = body;
  });
};

// runs on every search keystroke and dropdown change
const applyFilterAndSort = () => {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedAuthorId = filterAuthor.value;
  const sortBy = sortSelect.value;

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm) ||
      post.body.toLowerCase().includes(searchTerm);

    const matchesAuthor = selectedAuthorId === 'ALL' || post.userId === Number(selectedAuthorId);

    return matchesSearch && matchesAuthor;
  });

  // copy first, otherwise sort() reorders the original array
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
    return b.id - a.id;
  });

  displayPosts(sortedPosts);
  updateStats(posts);
};

// the counters at the top of the page
const updateStats = (allPosts) => {
  statTotalPosts.textContent = allPosts.length;

  // Set drops the duplicate userIds for us
  const uniqueAuthors = new Set(allPosts.map((post) => post.userId));
  statTotalAuthors.textContent = uniqueAuthors.size;

  const totalWords = allPosts.reduce((total, post) => total + post.wordCount, 0);
  statAvgWords.textContent = allPosts.length > 0 ? Math.round(totalWords / allPosts.length) : 0;
};


// ----- create / delete -----

createPostForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = postTitleInput.value.trim();
  const userId = Number(postAuthorSelect.value);
  const body = postBodyInput.value.trim();

  if (!title || !userId || !body) {
    alert('Please fill in all fields.');
    return;
  }

  const submitBtn = document.getElementById('submit-post-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Publishing...';

  try {
    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ title, body, userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create post');
    }

    const createdPost = await response.json();

    // the API always returns id 101, so give it our own id to avoid duplicates
    const newPost = {
      ...withAuthor(createdPost),
      id: Math.max(0, ...posts.map((p) => p.id)) + 1,
    };

    posts = [newPost, ...posts];

    createPostForm.reset();
    document.getElementById('create-post-details').removeAttribute('open');

    applyFilterAndSort();
    showStatus(`Post #${newPost.id} published successfully!`, 'success');

  } catch (error) {
    showStatus(`Failed to publish post: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Publish Post';
  }
});

// heads up: JSONPlaceholder fakes this, nothing is really deleted on their end
const handleDeletePost = async (postId) => {
  if (!confirm(`Are you sure you want to delete Post #${postId}?`)) return;

  try {
    const response = await fetch(`${API_URL}/posts/${postId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete post');
    }

    posts = posts.filter((post) => post.id !== postId);

    applyFilterAndSort();
    showStatus(`Post #${postId} deleted successfully!`, 'info');

  } catch (error) {
    showStatus(`Failed to delete post: ${error.message}`, 'error');
  }
};


// ----- helpers -----

const showStatus = (message, type = 'info') => {
  statusMessage.className = `status-message ${type}`;
  statusMessage.textContent = message;
  statusMessage.style.display = 'block';

  setTimeout(hideStatus, 4000);
};

const hideStatus = () => {
  statusMessage.style.display = 'none';
};


// ----- events -----

// one listener for the whole list, instead of an onclick on every button
postsContainer.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const postId = Number(button.dataset.id);

  if (button.dataset.action === 'delete') {
    handleDeletePost(postId);
  } else {
    fetchComments(postId, button);
  }
});

searchInput.addEventListener('input', applyFilterAndSort);
filterAuthor.addEventListener('change', applyFilterAndSort);
sortSelect.addEventListener('change', applyFilterAndSort);
refreshBtn.addEventListener('click', fetchData);

fetchData();
