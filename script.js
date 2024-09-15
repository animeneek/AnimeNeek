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

// Function to populate episode buttons based on HTML data
async function populateEpisodeButtons(animeDiv, malId) {
    const subEpisodesDiv = animeDiv.querySelector('.sub-episodes'); // Get the sub-episodes container
    const dubEpisodesDiv = animeDiv.querySelector('.dub-episodes'); // Get the dub-episodes container

    const animeDataDiv = document.getElementById('anime-data'); // Get the element containing all anime data
    const episodes = animeDataDiv.querySelectorAll(`.anime[data-mal-id='${malId}'] .episode`); // Find episodes related to the given MAL ID

    if (episodes.length === 0) {
        subEpisodesDiv.innerHTML = '<p>Subbed Episodes Coming Soon</p>';
        dubEpisodesDiv.innerHTML = '<p>Dubbed Episodes Coming Soon</p>';
        return;
    }

    let hasSub = false;
    let hasDub = false;

    const embedUrls = await Promise.all(
        Array.from(episodes).map(async (episode) => {
            const epLan = episode.getAttribute('data-ep-lan');
            const epNum = episode.getAttribute('data-ep-num');
            const src = episode.getAttribute('data-src');
            const videoId = episode.getAttribute('data-video-id');
            const embedUrl = await getEmbedUrl(src, videoId);

            return { epLan, epNum, embedUrl };
        })
    );

    embedUrls.forEach(({ epLan, epNum, embedUrl }) => {
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
async function getEmbedUrl(src, videoId) {
    const baseUrls = {
        'anime': '//embtaku.com/streaming.php?id=',
        'hanime': '//nhplayer.com/v/',
        'streamtape': '//streamtape.com/e/',
        'mp4upload': '//mp4upload.com/v/',
        'URLPLAYTAKU': 'https://playtaku.net/videos/',
        'other2': '//other2.com/v/'
    };

    const placeholderImage = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgjgbq98hgU5wyNYp-xBz28mNtZ7Hn5bXuMMXtnN6d318-XHF0GmKLiftvmYdYER_hmdN10t5kZ7AbcRwQnnPtpEjr0QBzrwOUvyKgOoPGsEEBTWqxxRTH1OmBlw5V4xW2laDOfVZVCvqc39aWtUBDGw8yHqiows2n1Yy-L5qur-8Tlq9r8Ly0z9ixGVpk/s1152/www.reallygreatsite.com.gif';

    try {
        const response = await fetch(`${baseUrls[src]}${videoId}`);
        if (!response.ok) return placeholderImage;
        return `${baseUrls[src]}${videoId}`;
    } catch (error) {
        return placeholderImage;
    }
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
document.addEventListener('DOMContentLoaded', () => {
    fetchGenres();
    fetchAnimeData();
});

// Fetch anime data from animes.json
async function fetchAnimeData() {
    const response = await fetch('animes.json');
    const data = await response.json();
    const animeDataDiv = document.getElementById('anime-data');

    animeDataDiv.innerHTML = data.map(anime => `
        <div class='anime' data-mal-id='${anime.mal_id}'>
            ${anime.episodes.map(episode => `
                <div class='episode' 
                    data-ep-num='${episode.num}' 
                    data-ep-lan='${episode.lan}' 
                    data-src='${episode.src}' 
                    data-video-id='${episode.video_id}'></div>
            `).join('')}
        </div>
    `).join('');
}
