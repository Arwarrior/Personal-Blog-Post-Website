// Homepage: fetch and render posts
const postsContainer = document.getElementById('posts');
const categoryButtons = document.querySelectorAll('.categories button');
const searchBar = document.getElementById('searchBar');

function fetchAndRenderPosts(queryParams = '') {
  fetch(`/api/posts${queryParams}`)
    .then(res => res.json())
    .then(posts => {
      postsContainer.innerHTML = '';
      if (posts.length === 0) {
        postsContainer.innerHTML = '<p>No posts found.</p>';
        return;
      }
      posts.forEach(post => {
        const postCard = document.createElement('article');
        postCard.className = 'post-card';
        postCard.setAttribute('data-category', post.category);
        postCard.innerHTML = `
          <h2>${post.title}</h2>
          <p class="date">${post.date}</p>
          <p class="description">${post.description}</p>
          <a href="/post/${post.id}">Read More</a>
        `;
        gsap.from(postCard, { opacity: 0, duration: 0.6 });
        postsContainer.appendChild(postCard);
      });
    })
    .catch(err => console.error(err));
}

if (postsContainer) {
  fetchAndRenderPosts();
}

// Category Filtering
categoryButtons.forEach(button => {
  button.addEventListener('click', () => {
    const selectedCategory = button.getAttribute('data-category');
    let query = `?category=${selectedCategory}`;
    if (searchBar.value.trim()) {
      query += `&search=${searchBar.value.trim()}`;
    }
    fetchAndRenderPosts(query);
  });
});

// Live Search (debounce)
let searchTimeout;
searchBar.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const searchTerm = searchBar.value.trim();
    let query = searchTerm ? `?search=${searchTerm}` : '';
    fetchAndRenderPosts(query);
  }, 300);
});
