let currentPage = 1;
let query = '';
let selectedGenres = [];
let isLoading = false;

// Fetch and display genres
async function fetchGenres() {
  const url = 'https://api.jikan.moe/v4/genres/anime';
  const response = await fetch(url);
  const data = await response.json();

  const genreFilterDiv = document.getElementById('genre-filter');
  const genreList = data.data;

  genreList.sort((a, b) => a.name.localeCompare(b.name)); // Sort genres alphabetically

  genreFilterDiv.innerHTML += genreList
    .map(
      (genre) => `
    <label class='genre-checkbox'>
      <input type='checkbox' value='${genre.mal_id}'/> ${genre.name}
    </label>
  `
    )
    .join('');
}

// Event listener for the search input box
document.getElementById('anime-search').addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    searchAnime();
  }
});

// Event listener for genre checkboxes
document.getElementById('genre-filter').addEventListener('change', function (event) {
  if (event.target.type === 'checkbox') {
    const genreId = parseInt(event.target.value);
    if (event.target.checked) {
      selectedGenres.push(genreId);
    } else {
      selectedGenres = selectedGenres.filter((id) => id !== genreId);
    }
    searchAnime(); // Re-search with updated filters
  }
});

// Function to search for anime
async function searchAnime() {
  const searchInput = document.getElementById('anime-search');
  query = searchInput.value;
  currentPage = 1;
  document.getElementById('results').innerHTML = ''; // Clear previous results
  loadResults();
}

// Function to load search results with infinite scrolling
async function loadResults() {
  if (isLoading) return;
  isLoading = true;

  let url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&page=${currentPage}`;

  if (selectedGenres.length > 0) {
    url += `&genres=${selectedGenres.join(',')}`;
  }

  const response = await fetch(url);
  const data = await response.json();
  displayResults(data.data);
  isLoading = false;
}

function displayResults(animeList) {
  const resultsDiv = document.getElementById('results');
  animeList.forEach((anime) => {
    const animeItem = `
      <div class='anime-item'>
        <img src='${anime.images.jpg.large_image_url}' alt='${anime.title}' />
        <div class='anime-info'>
          <h3>${anime.title}</h3>
          <p class='english-title'>${anime.title_english || ''}</p>
          <div class='details'>
            <span>Episodes: ${anime.episodes || 'Unknown'}</span>
            <span>Rating: ${anime.rating || 'N/A'}</span>
            <p>${anime.synopsis ? anime.synopsis.substring(0, 150) + '...' : 'No synopsis available.'}</p>
          </div>
        </div>
      </div>
    `;
    resultsDiv.innerHTML += animeItem;
  });

  currentPage++;
}

// Infinite scroll listener
window.addEventListener('scroll', function () {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
    loadResults();
  }
});

// Load genres on page load
window.onload = function () {
  fetchGenres();
};

