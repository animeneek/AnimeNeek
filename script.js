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
        <label class="genre-checkbox">
            <input type="checkbox" value="${genre.mal_id}"> ${genre.name}
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

    const response = await fetch(url);
    const data = await response.json();

    displayResults(data);
    currentPage++; // Load next page when user scrolls
    isLoading = false;
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

        animeDiv.innerHTML = `
            <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
            <div class="anime-info">
                <h3>${anime.title}</h3>
                ${englishTitle ? `<div class="english-title">${englishTitle}</div>` : ''}
                <div class="details">
                    <span>Score: ${score}</span>
                    <span>Genres: ${genres}</span>
                    <span>Aired: ${aired}</span>
                    <span>Status: ${status}</span>
                </div>
                <p class="synopsis">${synopsis}</p>

                <!-- SUB Episode Buttons -->
                <div class="episode-box sub-episodes">
                    <p><strong>SUB Episodes:</strong></p>
                    <!-- Episodes will be dynamically inserted here -->
                </div>

                <!-- DUB Episode Buttons -->
                <div class="episode-box dub-episodes">
                    <p><strong>DUB Episodes:</strong></p>
                    <!-- Episodes will be dynamically inserted here -->
                </div>
            </div>
        `;
        resultsDiv.appendChild(animeDiv);

        // Populate episode buttons based on the HTML data
        populateEpisodeButtons(animeDiv, anime.mal_id);
    });
}

// Function to populate episode buttons based on HTML data
async function populateEpisodeButtons(animeDiv, malId) {
    const subEpisodesDiv = animeDiv.querySelector('.sub-episodes');
    const dubEpisodesDiv = animeDiv.querySelector('.dub-episodes');

    const animeDataDiv = document.getElementById('anime-data');
    const episodes = animeDataDiv.querySelectorAll(`.anime[data-mal-id='${malId}'] .episode`);

    if (episodes.length === 0) {
        subEpisodesDiv.innerHTML = '<p>Subbed Episodes Coming Soon</p>';
        dubEpisodesDiv.innerHTML = '<p>Dubbed Episodes Coming Soon</p>';
        return;
    }

    let hasSub = false;
    let hasDub = false;

    for (const episode of episodes) {
        const epLan = episode.getAttribute('data-ep-lan');
        const epNum = episode.getAttribute('data-ep-num');
        const src = episode.getAttribute('data-src');
        const videoId = episode.getAttribute('data-video-id');
        const embedUrl = await getEmbedUrl(src, videoId); // Wait for the embed URL

        const button = document.createElement('button');
        button.textContent = `EP ${epNum}`;
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
    }

    if (!hasSub) {
        subEpisodesDiv.innerHTML = '<p>Episodes Coming Soon</p>';
    }

    if (!hasDub) {
        dubEpisodesDiv.innerHTML = '<p>Episodes Coming Soon</p>';
    }
}

// Function to get the embed URL based on source and video ID
async function getEmbedUrl(src, videoId) {
    const baseUrls = {
        'anime': '//embtaku.com/streaming.php?id=',
        'hanime': '//nhplayer.com/v/',
        'streamtape': '//streamtape.com/e/',
        'mp4upload': '//mp4upload.com/v/',
        'URLPLAYTAKU': 'https://playtaku.net/videos/', // Base URL for 'playtaku'
        'other2': '//other2.com/v/'
    };

    // Placeholder image URL
    const placeholderImage = 'https://www.a-dato.com/wp-content/uploads/2018/11/Coming-soon.png';

    if (src === 'URLPLAYTAKU') {
        // Fetch the page content to extract the actual video URL
        try {
            const response = await fetch(`${baseUrls[src]}${videoId}`);
            if (!response.ok) {
                // If the page does not exist or the response is not ok
                return placeholderImage;
            }
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const iframe = doc.querySelector('iframe');
            const embedUrl = iframe ? iframe.src : ''; // Extract the src of the iframe
            return embedUrl || placeholderImage; // Return embed URL or placeholder image if not found
        } catch (error) {
            console.error('Error fetching embed URL:', error);
            return placeholderImage; // Return placeholder image if there was an error
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
