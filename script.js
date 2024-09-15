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
        // Join genres by comma and add to URL
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
async function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    if (data.data.length === 0 && currentPage === 1) {
        resultsDiv.innerHTML = '<p>No results found</p>';
        return;
    }
    for (const anime of data.data) {
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
                    <span>Type: ${type}</span> <!-- Display the type of the anime -->
                    <span>Episodes: ${episodeCount}</span> <!-- Display the episode count -->
                    <span>Status: ${status}</span>
                    <span>Aired: ${aired}</span>
                    <span>Genres: ${genres}</span>
                    <span>Score: ${score}</span>
                </div>
                <p class='synopsis'>${synopsis}</p>
                <!-- SUB Episode Buttons -->
                <div class='episode-box sub-episodes'>
                    <p><strong>SUB Episodes:</strong></p>
                    <!-- Episodes will be dynamically inserted here -->
                </div>
                <!-- DUB Episode Buttons -->
                <div class='episode-box dub-episodes'>
                    <p><strong>DUB Episodes:</strong></p>
                    <!-- Episodes will be dynamically inserted here -->
                </div>
            </div>
        `;
        resultsDiv.appendChild(animeDiv);

        // Fetch episode data and populate buttons
        await populateEpisodeButtons(animeDiv, anime.mal_id);
    }
}

// Function to fetch episode data and populate episode buttons
async function populateEpisodeButtons(animeDiv, malId) {
    const subEpisodesDiv = animeDiv.querySelector('.sub-episodes'); // Get the sub-episodes container
    const dubEpisodesDiv = animeDiv.querySelector('.dub-episodes'); // Get the dub-episodes container

    // Fetch episode data from the JSON file
    const response = await fetch('animes.json');
    const episodesData = await response.json();

    // Filter episodes for the current anime
    const episodes = episodesData.filter(ep => ep['data-mal-id'] === malId);

    if (episodes.length === 0) {
        subEpisodesDiv.innerHTML = '<p>Subbed Episodes Coming Soon</p>';
        dubEpisodesDiv.innerHTML = '<p>Dubbed Episodes Coming Soon</p>';
        return;
    }

    let hasSub = false; // Flag to check if subbed episodes exist
    let hasDub = false; // Flag to check if dubbed episodes exist

    episodes.forEach(episode => {
        const epLan = episode['data-ep-lan'];
        const epNum = episode['data-ep-num'];
        const src = episode['data-src'];
        const videoId = episode['data-video-id'];
        const button = document.createElement('button');
        button.textContent = `EP ${epNum}`;
        button.dataset.episode = epNum;
        button.dataset.type = epLan;
        button.dataset.src = src;
        button.dataset.videoId = videoId;
        button.addEventListener('click', () => openModal(epNum, epLan, getEmbedUrl(src, videoId)));
        if (epLan === 'Sub') {
            subEpisodesDiv.appendChild(button);
            hasSub = true;
        } else if (epLan === 'Dub') {
            dubEpisodesDiv.appendChild(button);
            hasDub = true;
        }
    });

    if (!hasSub) {
        subEpisodesDiv.innerHTML = '<p>Subbed Episodes Coming Soon</p>';
    }
    if (!hasDub) {
        dubEpisodesDiv.innerHTML = '<p>Dubbed Episodes Coming Soon</p>';
    }
}

// Function to get the embed URL based on source and video ID
async function getEmbedUrl(src, videoId) {
    const baseUrls = {
        'anime': 'https://embtaku.com/streaming.php?id=',
        'hanime': 'https://nhplayer.com/v/',
        'streamtape': 'https://streamtape.com/e/',
        'mp4upload': 'https://mp4upload.com/v/',
        'URLPLAYTAKU': 'https://playtaku.net/videos/',
        'other2': 'https://other2.com/v/'
    };
    const placeholderImage = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgjgbq98hgU5wyNYp-xBz28mNtZ7Hn5bXuMMXtnN6d318-XHF0GmKLiftvmYdYER_hmdN10t5kZ7AbcRwQnnPtpEjr0QBzrwOUvyKgOoPGsEEBTWqxxRTH1OmBlw5V4xW2laDOfVZVCvqc39aWtUBDGw8yHqiows2n1Yy-L5qur-8Tlq9r8Ly0z9ixGVpk/s1152/www.reallygreatsite.com.gif';
    if (src === 'URLPLAYTAKU') {
        try {
            const response = await fetch(`${baseUrls[src]}${videoId}`);
            if (!response.ok) {
                return placeholderImage;
            }
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const iframe = doc.querySelector('iframe');
            const embedUrl = iframe ? iframe.src : '';
            return embedUrl || placeholderImage;
        } catch (error) {
            console.error('Error fetching embed URL:', error);
            return placeholderImage;
        }
    } else {
        return baseUrls[src] + videoId;
    }
}

// Function to open the modal
function openModal(episode, type, embedUrl) {
    const modal = document.getElementById('episode-modal');
    const modalTitle = document.getElementById('modal-title');
    const videoEmbed = document.getElementById('video-embed');
    modalTitle.textContent = `Episode ${episode} - ${type}`;
    videoEmbed.src = embedUrl;
    modal.style.display = 'block';
}

// Function to close the modal and stop the video
function closeModal() {
    const modal = document.getElementById('episode-modal');
    const videoEmbed = document.getElementById('video-embed');
    modal.style.display = 'none';
    videoEmbed.src = ''; // Stop the video
}

// Add event listener for modal close button
document.querySelector('.modal .close').addEventListener('click', closeModal);

// Close the modal when clicking outside of the modal content
window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('episode-modal')) {
        closeModal();
    }
});

// Infinite scrolling
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        loadResults(); // Load more results when scrolled to the bottom
    }
});

// Fetch and display genres on page load
fetchGenres();
