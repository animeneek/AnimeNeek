let currentPage = 1;
let query = '';
let selectedGenres = [];
let isLoading = false;
let animeList = []; // Store the anime list fetched from the API
const episodeData = {}; // Store the episode data from the JSON

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
  animeList = data.data;
  displayResults(animeList);
  isLoading = false;
}

// Display the results including Type, Status, Aired, Genres, Score, and Dub/Sub buttons
function displayResults(animeList) {
  const resultsDiv = document.getElementById('results');
  animeList.forEach((anime) => {
    const genres = anime.genres.map((genre) => genre.name).join(', ');
    const animeItem = `
      <div class='anime-item'>
        <img src='${anime.images.jpg.large_image_url}' alt='${anime.title}' />
        <div class='anime-info'>
          <h3>${anime.title}</h3>
          <p class='english-title'>${anime.title_english || ''}</p>
          <div class='details'>
            <span><strong>Type:</strong> ${anime.type || 'Unknown'}</span>
            <span><strong>Status:</strong> ${anime.status || 'N/A'}</span>
            <span><strong>Aired:</strong> ${anime.aired.string || 'Unknown'}</span>
            <span><strong>Genres:</strong> ${genres}</span>
            <span><strong>Score:</strong> ${anime.score || 'N/A'}</span>
            <p>${anime.synopsis ? anime.synopsis.substring(0, 150) + '...' : 'No synopsis available.'}</p>
          </div>
          ${generateEpisodeButtons(anime.mal_id)}
        </div>
      </div>
    `;
    resultsDiv.innerHTML += animeItem;
  });

  currentPage++;
}

// Generate episode buttons (Dub/Sub) based on the anime ID and episodes in the JSON
function generateEpisodeButtons(animeId) {
  if (!episodeData[animeId]) return '<p>No episodes available</p>';

  const episodes = episodeData[animeId];
  let buttonsHtml = '<div class="episode-box">';

  if (episodes.sub.length > 0) {
    buttonsHtml += `<h4>Sub Episodes</h4>`;
    episodes.sub.forEach((ep) => {
      buttonsHtml += `<button onclick="openEpisodeModal('${ep.url}', 'Sub - Episode ${ep.number}')">Ep ${ep.number}</button>`;
    });
  }

  if (episodes.dub.length > 0) {
    buttonsHtml += `<h4>Dub Episodes</h4>`;
    episodes.dub.forEach((ep) => {
      buttonsHtml += `<button onclick="openEpisodeModal('${ep.url}', 'Dub - Episode ${ep.number}')">Ep ${ep.number}</button>`;
    });
  }

  buttonsHtml += '</div>';
  return buttonsHtml;
}

// Function to open the modal to watch the selected episode
function openEpisodeModal(videoUrl, title) {
  const modal = document.getElementById('episode-modal');
  const videoEmbed = document.getElementById('video-embed');
  const modalTitle = document.getElementById('modal-title');

  videoEmbed.src = videoUrl;
  modalTitle.textContent = title;

  modal.style.display = 'block';

  const closeBtn = document.getElementsByClassName('close')[0];
  closeBtn.onclick = function () {
    modal.style.display = 'none';
    videoEmbed.src = '';
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = 'none';
      videoEmbed.src = '';
    }
  };
}

// Load the episode data from animes.json
async function loadEpisodeData() {
  const response = await fetch('animes.json');
  const data = await response.json();
  for (const anime of data) {
    episodeData[anime.mal_id] = {
      sub: anime.sub || [],
      dub: anime.dub || [],
    };
  }
}

// Infinite scroll listener
window.addEventListener('scroll', function () {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
    loadResults();
  }
});

// Load genres and episode data on page load
window.onload = function () {
  fetchGenres();
  loadEpisodeData();
};
