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

    genreFilterDiv.innerHTML += genreList.map(genre => `
        <label class='genre-checkbox'>
            <input type='checkbox' value='${genre.mal_id}'/> ${genre.name}
        </label>
    `).join('');
}

// Event listener for the search input box
document.getElementById('anime-search').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        searchAnime();
    }
});

// Event listener for genre checkboxes
document.getElementById('genre-filter').addEventListener('change', function(event) {
    if (event.target.type === 'checkbox') {
        const genreId = parseInt(event.target.value);
        if (event.target.checked) {
            selectedGenres.push(genreId);
        } else {
            selectedGenres = selectedGenres.filter(id => id !== genreId);
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

    try {
        const response = await fetch(url);
        const data = await response.json();

        displayResults(data);
        currentPage++; // Load next page when user scrolls
    } catch (error) {
        console.error('Error fetching results:', error);
    } finally {
        isLoading = false;
    }
}

// Function to display the search results
function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    
    if (data.data.length === 0 && currentPage === 1) {
        resultsDiv.innerHTML = '<p>No results found</p>';
        return;
    }

    data.data.forEach(anime => {
        const animeDiv = document.createElement('div');
        animeDiv.classList.add('anime-item');
        
        const genres = anime.genres.map(genre => genre.name).join(', ');
        const aired = anime.aired.string || 'N/A';
        const score = anime.score || 'N/A';
        const status = anime.status || 'N/A';
        const englishTitle = anime.title_english || '';
        const synopsis = anime.synopsis || 'No synopsis available';
        const episodeCount = anime.episodes || 'N/A'; // Get the total number of episodes
        const type = anime.type || 'N/A'; // Get the type of the anime (TV, Movie, etc.)

        animeDiv.innerHTML = `
            <img alt='${anime.title}' src='${anime.images.jpg.image_url}'/>
            <div class='anime-info'>
                <h3>${anime.title}</h3>
                ${englishTitle ? `<div class='english-title'>${englishTitle}</div>` : ''}
                <div class='details'>
                    <span>Type: ${type}</span>
                    <span>Episodes: ${episodeCount}</span>
                    <span>Status: ${status}</span>
                    <span>Aired: ${aired}</span>
                    <span>Genres: ${genres}</span>
                    <span>Score: ${score}</span>
                </div>
                <p class='synopsis'>${synopsis}</p>

                <!-- SUB Episode Buttons -->
                <div class='episode-box sub-episodes'>
                    <p><strong>SUB Episodes:</strong></p>
                </div>

                <!-- DUB Episode Buttons -->
                <div class='episode-box dub-episodes'>
                    <p><strong>DUB Episodes:</strong></p>
                </div>
            </div>
        `;
        resultsDiv.appendChild(animeDiv);

        // Populate episode buttons based on the HTML data
        populateEpisodeButtons(animeDiv, anime.mal_id);
    });
}

// Function to populate episode buttons based on JSON data
async function populateEpisodeButtons(animeDiv, malId) {
    console.log('Populating episode buttons for MAL ID:', malId); // Log MAL ID

    const subEpisodesDiv = animeDiv.querySelector('.sub-episodes');
    const dubEpisodesDiv = animeDiv.querySelector('.dub-episodes');

    const animeData = await fetch('animes.json');
    const episodesData = await animeData.json();
    
    const episodes = episodesData.filter(episode => episode['data-mal-id'] === malId);

    console.log('Found episodes:', episodes.length); // Log number of episodes found

    if (episodes.length === 0) {
        subEpisodesDiv.innerHTML = '<p>Subbed Episodes Coming Soon</p>';
        dubEpisodesDiv.innerHTML = '<p>Dubbed Episodes Coming Soon</p>';
        return;
    }

    let hasSub = false;
    let hasDub = false;

    episodes.forEach(episode => {
        const epLan = episode['data-ep-lan'];
        const epNum = episode['data-ep-num'];
        const src = episode['data-src'];
        const videoId = episode['data-video-id'];
        const embedUrl = getEmbedUrl(src, videoId);

        const button = document.createElement('button');
        button.textContent = embedUrl.includes('reallygreatsite.com') ? `EP ${epNum} (Coming Soon)` : `EP ${epNum}`;
        button.dataset.episode = epNum;
        button.dataset.type = epLan;
        button.dataset.embedUrl = embedUrl;

        button.addEventListener('click', () => openModal(epNum, epLan, embedUrl));

        if (epLan === 'Sub') {
            subEpisodesDiv.appendChild(button);
            hasSub = true;
        } else if (epLan === 'Dub') {
            dubEpisodesDiv.appendChild(button);
            hasDub = true;
        }
    });

    if (!hasSub) {
        subEpisodesDiv.innerHTML = '<p>Episodes Coming Soon</p>';
    }

    if (!hasDub) {
        dubEpisodesDiv.innerHTML = '<p>Episodes Coming Soon</p>';
    }
}

// Function to get the embed URL based on source and video ID
function getEmbedUrl(src, videoId) {
    const baseUrls = {
        'anime': '//embtaku.com/streaming.php?id=',
        'hanime': '//nhplayer.com/v/',
        'streamtape': '//streamtape.com/e/',
        'mp4upload': '//mp4upload.com/v/',
        'URLPLAYTAKU': 'https://playtaku.net/videos/',
        'other2': '//other2.com/v/'
    };

    const placeholderImage = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgjgbq98hgU5wyNYp-xBz28mNtZ7Hn5bXuMMXtnN6d318-XHF0GmKLiftvmYdYER_hmdN10t5kZ7AbcRwQnnPtpEjr0QBzrwOUvyKgOoPGsEEBTWqxxRTH1OmBlw5V4xW2laDOfVZVCvqc39aWtUBDGw8yHqiows2n1Yy-L5qur-8Tlq9r8Ly0z9ixGVpk/s1152/www.reallygreatsite.com.gif';

    return `${baseUrls[src] || placeholderImage}${videoId}`;
}

// Function to open the modal with episode details
function openModal(epNum, epLan, embedUrl) {
    const modal = document.getElementById('episode-modal');
    const modalTitle = document.getElementById('modal-title');
    const videoEmbed = document.getElementById('video-embed');

    modal.style.display = 'block';
    modalTitle.textContent = `Episode ${epNum} - ${epLan}`;
    videoEmbed.src = embedUrl;
}

// Function to close the modal
document.querySelector('.close').addEventListener('click', () => {
    const modal = document.getElementById('episode-modal');
    const videoEmbed = document.getElementById('video-embed');

    modal.style.display = 'none';
    videoEmbed.src = '';
});

// Infinite scrolling functionality
window.addEventListener('scroll', function () {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10 && !isLoading) {
        loadResults();
    }
});

// Load genres and initial results when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    await fetchGenres(); // Fetch and display genres
    searchAnime(); // Trigger initial search to load results
});

// Function to fetch anime data from local JSON file
async function fetchAnimeData() {
    try {
        const response = await fetch('animes.json');
        const data = await response.json();
        console.log('Fetched anime data:', data); // Log data for debugging
    } catch (error) {
        console.error('Error fetching anime data:', error);
    }
}

// Function to filter results based on search input and genres
async function filterResults() {
    // Retrieve all anime data from local file or other source
    const response = await fetch('animes.json');
    const allAnimeData = await response.json();

    // Filter anime based on search query and selected genres
    const filteredAnime = allAnimeData.filter(anime => {
        const titleMatches = anime['data-mal-title'].toLowerCase().includes(query.toLowerCase());
        const genreMatches = selectedGenres.length === 0 || selectedGenres.includes(anime['data-mal-id']);
        return titleMatches && genreMatches;
    });

    // Display filtered results
    displayFilteredResults(filteredAnime);
}

// Function to display filtered results
function displayFilteredResults(animeData) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (animeData.length === 0) {
        resultsDiv.innerHTML = '<p>No results found</p>';
        return;
    }

    animeData.forEach(anime => {
        const animeDiv = document.createElement('div');
        animeDiv.classList.add('anime-item');
        
        const genres = anime['data-ep-lan'] || 'Unknown'; // Update with appropriate data
        const episodeCount = anime['data-ep-num'] || 'N/A';
        const language = anime['data-ep-lan'] || 'N/A';
        const videoId = anime['data-video-id'] || 'N/A';
        const src = anime['data-src'] || 'N/A';
        
        animeDiv.innerHTML = `
            <h3>${anime['data-mal-title']}</h3>
            <div class='details'>
                <span>Language: ${language}</span>
                <span>Episode: ${episodeCount}</span>
                <span>Video ID: ${videoId}</span>
                <span>Source: ${src}</span>
            </div>
        `;

        resultsDiv.appendChild(animeDiv);
    });
}

// Add an event listener to re-filter results when genres or search input changes
document.getElementById('anime-search').addEventListener('input', filterResults);
document.getElementById('genre-filter').addEventListener('change', filterResults);
