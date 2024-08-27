let currentPage = 1;
let query = &#39;&#39;;
let selectedGenres = [];
let isLoading = false;

// Fetch and display genres
async function fetchGenres() {
    const url = &#39;https://api.jikan.moe/v4/genres/anime&#39;;
    const response = await fetch(url);
    const data = await response.json();
    
    const genreFilterDiv = document.getElementById(&#39;genre-filter&#39;);
    const genreList = data.data;

    genreList.sort((a, b) =&gt; a.name.localeCompare(b.name)); // Sort genres alphabetically

    genreFilterDiv.innerHTML += genreList.map(genre =&gt; `
        <label class='genre-checkbox'>
            <input type='checkbox' value='${genre.mal_id}'/> ${genre.name}
        </label>
    `).join(&#39;&#39;);
}

// Event listener for the search input box
document.getElementById(&#39;anime-search&#39;).addEventListener(&#39;keydown&#39;, function(event) {
    if (event.key === &#39;Enter&#39;) {
        searchAnime();
    }
});

// Event listener for genre checkboxes
document.getElementById(&#39;genre-filter&#39;).addEventListener(&#39;change&#39;, function(event) {
    if (event.target.type === &#39;checkbox&#39;) {
        const genreId = parseInt(event.target.value);
        if (event.target.checked) {
            selectedGenres.push(genreId);
        } else {
            selectedGenres = selectedGenres.filter(id =&gt; id !== genreId);
        }
        searchAnime(); // Re-search with updated filters
    }
});

// Function to search for anime
async function searchAnime() {
    const searchInput = document.getElementById(&#39;anime-search&#39;);
    query = searchInput.value;
    currentPage = 1;
    document.getElementById(&#39;results&#39;).innerHTML = &#39;&#39;; // Clear previous results
    loadResults();
}

// Function to load search results with infinite scrolling
async function loadResults() {
    if (isLoading) return;
    isLoading = true;

    let url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&amp;page=${currentPage}`;
    
    if (selectedGenres.length &gt; 0) {
        url += `&amp;genres=${selectedGenres.join(&#39;,&#39;)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    displayResults(data);
    currentPage++; // Load next page when user scrolls
    isLoading = false;
}

// Function to display the search results
function displayResults(data) {
    const resultsDiv = document.getElementById(&#39;results&#39;);
    
    if (data.data.length === 0 &amp;&amp; currentPage === 1) {
        resultsDiv.innerHTML = &#39;<p>No results found</p>&#39;;
        return;
    }

    data.data.forEach(anime =&gt; {
        const animeDiv = document.createElement(&#39;div&#39;);
        animeDiv.classList.add(&#39;anime-item&#39;);
        
        const genres = anime.genres.map(genre =&gt; genre.name).join(&#39;, &#39;);
        const aired = anime.aired.string || &#39;N/A&#39;;
        const score = anime.score || &#39;N/A&#39;;
        const status = anime.status || &#39;N/A&#39;;
        const englishTitle = anime.title_english || &#39;&#39;;
        const synopsis = anime.synopsis || &#39;No synopsis available&#39;;
        const episodeCount = anime.episodes || &#39;N/A&#39;; // Get the total number of episodes
        const type = anime.type || &#39;N/A&#39;; // Get the type of the anime (TV, Movie, etc.)

        animeDiv.innerHTML = `
            <img alt='${anime.title}' src='${anime.images.jpg.image_url}'/>
            <div class='anime-info'>
                <h3>${anime.title}</h3>
                ${englishTitle ? `<div class='english-title'>${englishTitle}</div>` : &#39;&#39;}
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

        // Populate episode buttons based on the HTML data
        populateEpisodeButtons(animeDiv, anime.mal_id);
    });
}

// Function to populate episode buttons based on HTML data
async function populateEpisodeButtons(animeDiv, malId) {
    const subEpisodesDiv = animeDiv.querySelector(&#39;.sub-episodes&#39;); // Get the sub-episodes container
    const dubEpisodesDiv = animeDiv.querySelector(&#39;.dub-episodes&#39;); // Get the dub-episodes container

    const animeDataDiv = document.getElementById(&#39;anime-data&#39;); // Get the element containing all anime data
    const episodes = animeDataDiv.querySelectorAll(`.anime[data-mal-id=&#39;${malId}&#39;] .episode`); // Find episodes related to the given MAL ID

    if (episodes.length === 0) { // If no episodes are found, display a &quot;Coming Soon&quot; message
        subEpisodesDiv.innerHTML = &#39;<p>Subbed Episodes Coming Soon</p>&#39;; // Display &quot;Subbed Episodes Coming Soon&quot;
        dubEpisodesDiv.innerHTML = &#39;<p>Dubbed Episodes Coming Soon</p>&#39;; // Display &quot;Dubbed Episodes Coming Soon&quot;
        return;
    }

    let hasSub = false; // Flag to check if subbed episodes exist
    let hasDub = false; // Flag to check if dubbed episodes exist

    const embedUrls = await Promise.all(
        Array.from(episodes).map(async (episode) =&gt; {
            const epLan = episode.getAttribute(&#39;data-ep-lan&#39;); // Get episode language (Sub/Dub)
            const epNum = episode.getAttribute(&#39;data-ep-num&#39;); // Get episode number
            const src = episode.getAttribute(&#39;data-src&#39;); // Get source of the episode
            const videoId = episode.getAttribute(&#39;data-video-id&#39;); // Get video ID
            const embedUrl = await getEmbedUrl(src, videoId); // Generate the embed URL

            return { epLan, epNum, embedUrl }; // Return an object with episode language, number, and URL
        })
    );

    embedUrls.forEach(({ epLan, epNum, embedUrl }) =&gt; {
        const button = document.createElement(&#39;button&#39;); // Create a new button element
        
        // Set the button text to show &quot;(Coming Soon)&quot; if the embed URL is the placeholder
        button.textContent = embedUrl.includes(&#39;reallygreatsite.com&#39;) ? `EP ${epNum} (Coming Soon)` : `EP ${epNum}`; // Conditional text display

        button.dataset.episode = epNum; // Store episode number in data attribute
        button.dataset.type = epLan; // Store episode language in data attribute
        button.dataset.embedUrl = embedUrl; // Store embed URL in data attribute

        button.addEventListener(&#39;click&#39;, () =&gt; openModal(epNum, epLan, embedUrl)); // Add click event listener to open modal with episode details

        if (epLan === &#39;Sub&#39;) { // If the episode is subbed
            subEpisodesDiv.appendChild(button); // Append the button to the sub-episodes container
            hasSub = true; // Set subbed episodes flag to true
        } else if (epLan === &#39;Dub&#39;) { // If the episode is dubbed
            dubEpisodesDiv.appendChild(button); // Append the button to the dub-episodes container
            hasDub = true; // Set dubbed episodes flag to true
        }
    });

    if (!hasSub) { // If no subbed episodes were found
        subEpisodesDiv.innerHTML = &#39;<p>Episodes Coming Soon</p>&#39;; // Display &quot;Episodes Coming Soon&quot;
    }

    if (!hasDub) { // If no dubbed episodes were found
        dubEpisodesDiv.innerHTML = &#39;<p>Episodes Coming Soon</p>&#39;; // Display &quot;Episodes Coming Soon&quot;
    }
}


// Function to get the embed URL based on source and video ID
async function getEmbedUrl(src, videoId) {
    const baseUrls = {
        &#39;anime&#39;: &#39;//embtaku.com/streaming.php?id=&#39;,
        &#39;hanime&#39;: &#39;//nhplayer.com/v/&#39;,
        &#39;streamtape&#39;: &#39;//streamtape.com/e/&#39;,
        &#39;mp4upload&#39;: &#39;//mp4upload.com/v/&#39;,
        &#39;URLPLAYTAKU&#39;: &#39;https://playtaku.net/videos/&#39;, // Base URL for &#39;playtaku&#39;
        &#39;other2&#39;: &#39;//other2.com/v/&#39;
    };

    // Placeholder image URL
    const placeholderImage = &#39;https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgjgbq98hgU5wyNYp-xBz28mNtZ7Hn5bXuMMXtnN6d318-XHF0GmKLiftvmYdYER_hmdN10t5kZ7AbcRwQnnPtpEjr0QBzrwOUvyKgOoPGsEEBTWqxxRTH1OmBlw5V4xW2laDOfVZVCvqc39aWtUBDGw8yHqiows2n1Yy-L5qur-8Tlq9r8Ly0z9ixGVpk/s1152/www.reallygreatsite.com.gif&#39;;

    if (src === &#39;URLPLAYTAKU&#39;) {
        // Fetch the page content to extract the actual video URL
        try {
            const response = await fetch(`${baseUrls[src]}${videoId}`);
            if (!response.ok) {
                // If the page does not exist or the response is not ok
                return placeholderImage;
            }
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, &#39;text/html&#39;);
            const iframe = doc.querySelector(&#39;iframe&#39;);
            const embedUrl = iframe ? iframe.src : &#39;&#39;; // Extract the src of the iframe
            return embedUrl || placeholderImage; // Return embed URL or placeholder image if not found
        } catch (error) {
            console.error(&#39;Error fetching embed URL:&#39;, error);
            return placeholderImage; // Return placeholder image if there was an error
        }
    } else {
        return baseUrls[src] + videoId;
    }
}

// Function to open the modal
function openModal(episode, type, embedUrl) {
    const modal = document.getElementById(&#39;episode-modal&#39;);
    const modalTitle = document.getElementById(&#39;modal-title&#39;);
    const videoEmbed = document.getElementById(&#39;video-embed&#39;);

    modalTitle.textContent = `Episode ${episode} - ${type}`;
    videoEmbed.src = embedUrl;

    modal.style.display = &#39;block&#39;;
}

// Function to close the modal and stop the video
function closeModal() {
    const modal = document.getElementById(&#39;episode-modal&#39;);
    const videoEmbed = document.getElementById(&#39;video-embed&#39;);

    modal.style.display = &#39;none&#39;;
    videoEmbed.src = &#39;&#39;; // Stop the video
}

// Add event listener for modal close button
document.querySelector(&#39;.modal .close&#39;).addEventListener(&#39;click&#39;, closeModal);

// Close the modal when clicking outside of the modal content
window.addEventListener(&#39;click&#39;, function(event) {
    if (event.target === document.getElementById(&#39;episode-modal&#39;)) {
        closeModal();
    }
});

// Infinite scrolling
window.addEventListener(&#39;scroll&#39;, () =&gt; {
    if (window.innerHeight + window.scrollY &gt;= document.body.offsetHeight - 100) {
        loadResults(); // Load more results when scrolled to the bottom
    }
});

// Fetch and display genres on page load
fetchGenres();
