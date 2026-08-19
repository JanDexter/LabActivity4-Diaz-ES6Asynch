// Lab Activity 4 - ES6+ and async data handling
// API: https://jsonplaceholder.typicode.com/

const API_URL = 'https://jsonplaceholder.typicode.com';

let posts = [];
let users = [];

const postsContainer = document.getElementById('posts-container');
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

// /posts only gives us a userId, so grab /users at the same time to get the names
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
    const rawUsers = await usersResponse.json();

    users = rawUsers;

    // attach the author info to each post so the card has everything it needs
    posts = rawPosts.map((post) => {
      const author = users.find((user) => user.id === post.userId);
      const wordCount = post.body.trim().split(/\s+/).length;

      return {
        ...post,
        authorName: author ? author.name : 'Unknown Author',
        authorEmail: author ? author.email : '',
        wordCount
      };
    });

    populateAuthorDropdown();
    displayPosts(posts);
    updateStats(posts);
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
      ${comments.map(({ name, email, body }) => `
        <div class="comment-item">
          <p class="comment-author"><strong>${name}</strong> (${email})</p>
          <p class="comment-body">${body}</p>
        </div>
      `).join('')}
    `;

    buttonElement.textContent = `Hide Comments (${comments.length})`;

  } catch (error) {
    commentsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
};


// ----- rendering -----

// the same options are reused by the filter and the create form
const populateAuthorDropdown = () => {
  const optionsHTML = users
    .map(({ id, name }) => `<option value="${id}">${name}</option>`)
    .join('');

  filterAuthor.innerHTML = `<option value="ALL">All Authors</option>${optionsHTML}`;
  postAuthorSelect.innerHTML = `<option value="">Select an author...</option>${optionsHTML}`;
};

const displayPosts = (postsToDisplay) => {
  const emptyState = document.getElementById('empty-state');

  if (postsToDisplay.length === 0) {
    postsContainer.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  postsContainer.innerHTML = postsToDisplay.map((post) => {
    const { id, title, body, authorName, authorEmail, wordCount } = post;

    return `
      <div class="post-card" id="post-${id}">
        <div class="post-header">
          <h3 class="post-title">#${id} - ${title}</h3>
          <span class="badge">${wordCount} words</span>
        </div>
        <p class="post-author-info">By: <strong>${authorName}</strong> | <span>${authorEmail}</span></p>
        <p class="post-body">${body}</p>

        <div class="post-footer">
          <button class="btn btn-secondary btn-sm" onclick="fetchComments(${id}, this)">
            View Comments
          </button>
          <div class="post-actions">
            <button class="btn btn-danger btn-sm" onclick="handleDeletePost(${id})">Delete</button>
          </div>
        </div>

        <div id="comments-${id}" class="comments-container" style="display: none;"></div>
      </div>
    `;
  }).join('');
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
    const author = users.find((user) => user.id === userId);

    // the API always returns id 101, so give it our own id to avoid duplicates
    const newPost = {
      ...createdPost,
      id: posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
      authorName: author ? author.name : 'Unknown Author',
      authorEmail: author ? author.email : '',
      wordCount: body.split(/\s+/).length,
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

searchInput.addEventListener('input', applyFilterAndSort);
filterAuthor.addEventListener('change', applyFilterAndSort);
sortSelect.addEventListener('change', applyFilterAndSort);
refreshBtn.addEventListener('click', fetchData);

fetchData();
