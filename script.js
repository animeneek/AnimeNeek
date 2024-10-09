let isDarkMode = true;
let page = 1;
let isLoading = false;
let selectedAnime = {}; // Store the selected anime details
let episodesData = {}; // Store episode data from JSON file
let animeImage = ''; // Declare globally
let hentaiFilterOn = false; // Default is 'off'

function toggleHentaiFilter() {
  hentaiFilterOn = !hentaiFilterOn;

  // Select the butterfly toggle element
  const butterflyToggle = document.getElementById('butterfly-toggle');

  // Toggle the 'active' class based on the hentai filter state
  if (hentaiFilterOn) {
    butterflyToggle.classList.add('active'); // Add 'active' class
  } else {
    butterflyToggle.classList.remove('active'); // Remove 'active' class
  }

  searchAnime(); // Re-run the search with the new filter state
}

// Toggle Theme
function toggleTheme() {
  const body = document.body;
  isDarkMode = !isDarkMode;
  const themeIcon = document.getElementById('themeIcon');
  if (isDarkMode) {
    body.classList.remove('light-mode');
    themeIcon.classList.remove('fa-sun');
    themeIcon.classList.add('fa-moon');
  } else {
    body.classList.add('light-mode');
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-sun');
  }
}

// Fetch Genres from Jikan v4 and Populate Dropdown
async function fetchGenres() {
  try {
    const response = await fetch('https://api.jikan.moe/v4/genres/anime');
    const data = await response.json();
    const genres = data.data.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
    const genreDropdown = document.getElementById('genreDropdown');

    // Clear existing options in case of re-fetch
    genreDropdown.innerHTML = '';

    // Add individual genres
    genres.forEach(genre => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" value="${genre.mal_id}" onchange="searchAnime()"> ${genre.name}`;
      genreDropdown.appendChild(label);
    });
  } catch (error) {
    console.error("Error fetching genres:", error);
  }
}

// Get selected genres
function getSelectedGenres() {
  const selectedGenres = [];
  document.querySelectorAll('#genreDropdown input[type="checkbox"]:checked').forEach(checkbox => {
    selectedGenres.push(checkbox.value);
  });
  return selectedGenres;
}

// Fetch Anime
async function fetchAnime(query = '', genres = [], page = 1) {
  try {
    isLoading = true;
    const genreQuery = genres.length ? `&genres=${genres.join(',')}` : '';
    const hentaiFilter = hentaiFilterOn ? '' : '&sfw=true'; // Apply the hentai filter if off

    const url = `https://api.jikan.moe/v4/anime?q=${query}&limit=25&page=${page}${genreQuery}${hentaiFilter}&order_by=popularity`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data.length === 0 && page === 1) {
      document.getElementById('noResults').style.display = 'block';
      document.getElementById('animeResults').innerHTML = '';
    } else {
      document.getElementById('noResults').style.display = 'none';
      displayAnime(data.data);
    }

    isLoading = false;
  } catch (error) {
    console.error("Error fetching anime:", error);
  }
}


// Display Anime Results
function displayAnime(animeList) {
  const animeResults = document.getElementById('animeResults');
  if (page === 1) {
    animeResults.innerHTML = '';
  }

  animeList.forEach(anime => {
    const animeItem = document.createElement('div');
    animeItem.classList.add('anime-item');

    const fallbackImage = 'https://via.placeholder.com/150x220?text=No+Image';
    const animeImage = anime.images && anime.images.jpg ? anime.images.jpg.image_url : fallbackImage;

    animeItem.innerHTML = `
      <img src="${animeImage}" 
           alt="${anime.title}"
           onclick="openModal(${anime.mal_id})">
      <h3>${anime.title}</h3>
    `;

    animeResults.appendChild(animeItem);
  });
}

// Fetch JSON with Episode Data
async function fetchEpisodeData() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/animeneek/AnimeNeek/refs/heads/main/animeneek.json');
    episodesData = await response.json();
  } catch (error) {
    console.error("Error fetching episode data:", error);
  }
}

// Open modal with the selected anime details
function openModal(animeId) {
  const modal = document.getElementById('animeModal');
  const modalContent = document.getElementById('modalAnimeContent');

  // Ensure modal is shown before fetching data
  modal.style.display = 'block';  // Display the modal immediately

  // Fetch the selected anime details using the Jikan API
  fetch(`https://api.jikan.moe/v4/anime/${animeId}`)
    .then(response => response.json())
    .then(data => {
      const anime = data.data;
      const fallbackImage = 'https://via.placeholder.com/800x450?text=No+Video+Available';
      const animeImage = anime.images && anime.images.jpg ? anime.images.jpg.large_image_url : fallbackImage;

      // Inject anime details into the modal content
modalContent.innerHTML = `
  <!-- Embed Video Placeholder -->
  <div class="embed-video">
    <img src="${animeImage}" alt="${anime.title}" class="embed-video-placeholder">
    <div class="overlay-text">Please select the episode below.</div>
  </div>

  <!-- Thin Banner -->
  <div class="thin-banner">
    <h3>Watch Anime</h3>
  </div>

  <!-- SUB Section -->
  <div class="sub-section">
    <h4>SUB:</h4>
    <select id="subEpisodeDropdown">
      <option>Select Episode</option>
    </select>

    <select id="subSourceDropdown">
      <option>Select Source</option>
    </select>

    <button class="play-button" onclick="playVideo('sub')">Play</button>
  </div>

  <!-- DUB Section -->
  <div class="dub-section">
    <h4>DUB:</h4>
    <select id="dubEpisodeDropdown">
      <option>Select Episode</option>
    </select>

    <select id="dubSourceDropdown">
      <option>Select Source</option>
    </select>

    <button class="play-button" onclick="playVideo('dub')">Play</button>
  </div>

  <!-- Anime Details Section -->
  <div class="anime-details">
    <div class="anime-poster" style="width: 200px; height: 300px; overflow: hidden; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
      <img src="${animeImage}" alt="${anime.title}" style="width: 100%; height: auto; object-fit: cover;">
    </div>
    <div class="anime-info">
      <h2>${anime.title}</h2>
      <p><strong>Alternative Titles:</strong> ${anime.title_english || 'N/A'}</p>
      <p><strong>Type:</strong> ${anime.type || 'N/A'}</p>
      <p><strong>Episodes:</strong> ${anime.episodes || 'N/A'}</p>
      <p><strong>Status:</strong> ${anime.status}</p>
      <p><strong>Aired:</strong> ${anime.aired ? anime.aired.string : 'N/A'}</p>
      <p><strong>Genres:</strong> ${anime.genres ? anime.genres.map(genre => genre.name).join(', ') : 'N/A'}</p>
      <p><strong>Score:</strong> ${anime.score || 'N/A'}</p>
      <p><strong>Synopsis:</strong> ${anime.synopsis || 'No synopsis available.'}</p>
    </div>
  </div>
`;


      // Populate episodes from the fetched JSON based on the selected anime
      populateEpisodes(animeId);
      modal.style.display = 'block';
    })
    .catch(error => {
      console.error("Error fetching anime details:", error);
    });
}

// Populate SUB and DUB episodes based on selected anime
function populateEpisodes(animeId) {
  const subEpisodeDropdown = document.getElementById('subEpisodeDropdown');
  const dubEpisodeDropdown = document.getElementById('dubEpisodeDropdown');
  const subSourceDropdown = document.getElementById('subSourceDropdown');
  const dubSourceDropdown = document.getElementById('dubSourceDropdown');

  const selectedAnime = episodesData.find(anime => anime['data-mal-id'] === animeId);

  if (selectedAnime) {
    // Clear previous options
    subEpisodeDropdown.innerHTML = '<option>Select Episode</option>';
    dubEpisodeDropdown.innerHTML = '<option>Select Episode</option>';
    subSourceDropdown.innerHTML = '<option>Select Source</option>';
    dubSourceDropdown.innerHTML = '<option>Select Source</option>';

    // Populate SUB and DUB episodes
    selectedAnime.episodes.forEach(episode => {
      const option = document.createElement('option');
      option.value = episode['data-video-id'];
      option.textContent = `Episode ${episode['data-ep-num']}`;

      if (episode['data-ep-lan'] === 'Sub') {
        subEpisodeDropdown.appendChild(option);
      } else if (episode['data-ep-lan'] === 'Dub') {
        dubEpisodeDropdown.appendChild(option);
      }
    });

    // Function to populate source dropdowns
    const populateSourceDropdown = (dropdown, episodeId, sources) => {
      // Clear existing options
      dropdown.innerHTML = '<option>Select Source</option>';

      // Add sources to the dropdown
      sources.forEach(source => {
        // Map the source to its new name
        const sourceNameMap = {
          'anime': 'VIDSRC',
          'hanime': 'HANIME',
          'streamtape': 'STREAMTAPE',
          'mp4upload': 'mp4upload',
          'other': 'other',
          'URL': 'EMBTAKU', // Changed from URL to EMBTAKU
        };

        const sourceOption = document.createElement('option');
        sourceOption.value = sourceNameMap[source] || source; // Fallback if the source isn't found
        sourceOption.textContent = sourceNameMap[source] || source;
        dropdown.appendChild(sourceOption);
      });

      // Automatically select the first source if there are any available
      if (dropdown.options.length > 1) {
        dropdown.selectedIndex = 1; // Select the first valid source
      }
    };

    // Update sources when an episode is selected
    subEpisodeDropdown.addEventListener('change', () => {
      const selectedEpisodeId = subEpisodeDropdown.value;
      const episodeData = selectedAnime.episodes.find(ep => ep['data-video-id'] === selectedEpisodeId);

      if (episodeData) {
        populateSourceDropdown(subSourceDropdown, selectedEpisodeId, [episodeData['data-src']]);
      }
    });

    dubEpisodeDropdown.addEventListener('change', () => {
      const selectedEpisodeId = dubEpisodeDropdown.value;
      const episodeData = selectedAnime.episodes.find(ep => ep['data-video-id'] === selectedEpisodeId);

      if (episodeData) {
        populateSourceDropdown(dubSourceDropdown, selectedEpisodeId, [episodeData['data-src']]);
      }
    });
  }
}


// Play Video Function (Update to embed video)
async function playVideo(type) {
  const episodeDropdown = document.getElementById(`${type}EpisodeDropdown`);
  const sourceDropdown = document.getElementById(`${type}SourceDropdown`);

  const selectedEpisodeId = episodeDropdown.value; // This is the 'data-video-id'
  const selectedSource = sourceDropdown.value; // This is the selected source

  if (selectedEpisodeId !== 'Select Episode' && selectedSource !== 'Select Source') {
    let embedLink = '';

    // Define the embed URL structure based on the selected source
    switch (selectedSource) {
      case 'VIDSRC':
        embedLink = `//embtaku.com/streaming.php?id=${selectedEpisodeId}`;
        break;
      case 'HANIME':
        embedLink = `//nhplayer.com/v/${selectedEpisodeId}`;
        break;
      case 'STREAMTAPE':
        embedLink = `//streamtape.com/e/${selectedEpisodeId}`;
        break;
      case 'mp4upload':
        embedLink = `//mp4upload.com/v/${selectedEpisodeId}`;
        break;
      case 'other':
        embedLink = `//other.com/v/${selectedEpisodeId}`;
        break;
      case 'EMBTAKU': // Changed case for URL source
        // Make a request to playtaku.net to fetch the actual embed link
        try {
          const response = await fetch(`//playtaku.net/videos/${selectedEpisodeId}`);
          const html = await response.text();
          
          // Use DOMParser to parse the response and extract the embed URL
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const embedElement = doc.querySelector('iframe'); // Assuming the embed link is in an iframe
          
          if (embedElement) {
            embedLink = embedElement.src; // Extract the embed URL from the iframe
          } else {
            throw new Error('Embed link not found');
          }
        } catch (error) {
          alert("Error fetching embed link: " + error.message);
          return;
        }
        break;
      default:
        alert("Invalid source selected!");
        return;
    }

    console.log("Generated Embed Link: ", embedLink);

    // Replace the poster and overlay with the actual video
    const embedVideoContainer = document.querySelector('.embed-video');
    embedVideoContainer.innerHTML = `<iframe src="${embedLink}" frameborder="0" allowfullscreen style="width: 100%; height: 100%;"></iframe>`;
  } else {
    alert("Select an episode and a source to dive into the story!");
  }
}

// Close Modal and Stop Video
function closeModal() {
  const modal = document.getElementById('animeModal');
  modal.style.display = 'none';

  // Stop the video by resetting the iframe src
  const embedVideoContainer = document.querySelector('.embed-video');
  const iframe = embedVideoContainer.querySelector('iframe');

  // Check if iframe exists and reset its src to stop the video
  if (iframe) {
    iframe.src = ''; // Reset the iframe src to stop video playback
  }
  
  // Optionally reset the embed video container's content
  embedVideoContainer.innerHTML = `
    <img src="${animeImage}" alt="${anime.title}" class="embed-video-placeholder">
    <div class="overlay-text">Please select the episode below.</div>
  `;
}


// Clear Filters
function clearFilters() {
  document.querySelectorAll('#genreDropdown input[type="checkbox"]:checked').forEach(checkbox => checkbox.checked = false);
  searchAnime();
}

// Handle Search
function searchAnime() {
  page = 1; // Reset page when searching
  const query = document.getElementById('animeSearch').value;
  const selectedGenres = getSelectedGenres();
  fetchAnime(query, selectedGenres, page);
}

// Infinite Scroll
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !isLoading) {
    page++;
    const query = document.getElementById('animeSearch').value;
    const selectedGenres = getSelectedGenres();
    fetchAnime(query, selectedGenres, page);
  }
});

// Initialize
fetchGenres();
fetchAnime();
fetchEpisodeData(); // Fetch the JSON file with episode data

// Extract VIDEOID from the source URL (based on user-provided URL)
function extractVideoIdFromUrl(url) {
  var videoId = url.split('/').pop();
  return videoId;
}

// Event listener for modal closure
$('#video-modal').on('hidden.bs.modal', function() {
  $('#video-modal .modal-body').html('');
});
