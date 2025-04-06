document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const malId = urlParams.get("id");
    const episodeNum = urlParams.get("ep");
    const type = urlParams.get("type");

    if (!malId || !episodeNum || !type) {
        document.body.innerHTML = "<h1>Invalid episode link.</h1>";
        return;
    }

    console.log(`Fetching anime data for MAL ID: ${malId}, Episode: ${episodeNum}, Type: ${type}`);

    // Fetch anime details from Jikan API
    fetch(`https://api.jikan.moe/v4/anime/${malId}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("anime-title").innerText = data.data.title;
            document.getElementById("episode-title").innerText = `Episode ${episodeNum} - ${type}`;

            // Fetch episode synopsis if available
            const episode = data.data.episodes.find(ep => ep.mal_id == episodeNum);
            if (episode) {
                if (episode.title) {
                    document.getElementById("episode-title").innerText = episode.title;
                }
                if (episode.aired) {
                    document.getElementById("episode-release-date").innerText = `Aired: ${episode.aired}`;
                }
                if (episode.synopsis) {
                    document.getElementById("episode-synopsis").innerText = episode.synopsis;
                }
            }
        })
        .catch(error => {
            console.error("Error fetching anime data:", error);
            // Display default episode info if data fetching fails
            document.getElementById("episode-title").innerText = `Episode ${episodeNum} - ${type.toUpperCase()}`;
        });

    // Fetch episode links from animeneek.json
    fetch("animeneek.json")
        .then(response => response.json())
        .then(data => {
            console.log("Loaded animeneek.json:", data); // Debugging log

            const animeData = data.find(item => item["data-mal-id"] == malId);
            if (!animeData) {
                console.warn("Anime ID not found in JSON:", malId);
                document.body.innerHTML = "<h1>Anime not found.</h1>";
                return;
            }

            const episode = animeData.episodes.find(ep => ep["data-ep-num"] == episodeNum && ep["data-ep-lan"].toLowerCase() === type);
            if (!episode) {
                console.warn("Episode not found in JSON:", episodeNum, type);
                document.body.innerHTML = "<h1>Episode not found.</h1>";
                return;
            }

            console.log("Found Episode Data:", episode); // Debugging log

            // Generate embed link based on source
            const videoId = episode["data-video-id"];
            let embedUrl = "";

            if (episode["data-src"] === "anime") {
                embedUrl = `//s3taku.one/watch?play=${videoId}`;
            } else if (episode["data-src"] === "streamtape") {
                embedUrl = `//streamtape.com/e/${videoId}`;
            } else if (episode["data-src"] === "mp4upload") {
                embedUrl = `//mp4upload.com/v/${videoId}`;
            }

            if (!embedUrl) {
                console.error("Embed URL not generated.");
                document.body.innerHTML = "<h1>Embed URL missing.</h1>";
                return;
            }

            console.log("Embed URL:", embedUrl); // Debugging log

            // Set video player source
            document.getElementById("video-player").src = embedUrl;

            // Generate source selection buttons
            const sourceButtons = document.getElementById("source-buttons");
            sourceButtons.innerHTML = "";

            if (episode["data-src"] === "anime") {
                const btn1 = document.createElement("button");
                btn1.innerText = "Source 1";
                btn1.onclick = () => {
                    document.getElementById("video-player").src = `//s3taku.one/watch?play=${videoId}`;
                    highlightSelectedSourceButton(btn1);
                };
                sourceButtons.appendChild(btn1);

                const btn2 = document.createElement("button");
                btn2.innerText = "Source 2";
                btn2.onclick = () => {
                    document.getElementById("video-player").src = `//s3taku.one/watch?play=${videoId}&sv=1`;
                    highlightSelectedSourceButton(btn2);
                };
                sourceButtons.appendChild(btn2);

                // Highlight the first source button by default
                highlightSelectedSourceButton(btn1);
            }

            // Highlight the selected source button
            function highlightSelectedSourceButton(selectedButton) {
                const buttons = sourceButtons.getElementsByTagName("button");
                for (let button of buttons) {
                    button.classList.remove("selected");
                }
                selectedButton.classList.add("selected");
            }

            // Highlight the current episode button
            function highlightCurrentEpisodeButton(type) {
                const episodeButtonsContainer = document.getElementById(`${type.toLowerCase()}EpisodeButtons`);
                const buttons = episodeButtonsContainer.getElementsByTagName("button");
                for (let button of buttons) {
                    if (button.textContent == episodeNum) {
                        button.classList.add("selected");
                    }
                }
            }

            // Populate episode sections
            populateEpisodeSections(animeData.episodes, "Sub");
            populateEpisodeSections(animeData.episodes, "Dub");
            populateEpisodeSections(animeData.episodes, "Raw");
            
            // Highlight the current episode button
            highlightCurrentEpisodeButton(type);
        })
        .catch(error => {
            console.error("Error loading animeneek.json:", error);
            document.body.innerHTML = "<h1>Error loading episode data.</h1>";
        });

    function populateEpisodeSections(episodes, type) {
        const episodeRangeSelect = document.getElementById(`${type.toLowerCase()}EpisodeRange`);
        const episodeFilterInput = document.getElementById(`${type.toLowerCase()}EpisodeFilter`);
        const episodeButtonsContainer = document.getElementById(`${type.toLowerCase()}EpisodeButtons`);

        const filteredEpisodes = episodes.filter(ep => ep["data-ep-lan"] === type);

        if (filteredEpisodes.length === 0) {
            episodeRangeSelect.disabled = true;
            episodeFilterInput.disabled = true;
            episodeButtonsContainer.innerHTML = "<p>No episodes available.</p>";
            return;
        }

        const rangeSize = 100;
        for (let i = 0; i < filteredEpisodes.length; i += rangeSize) {
            const end = Math.min(i + rangeSize, filteredEpisodes.length);
            const option = document.createElement("option");
            option.value = `${i + 1}-${end}`;
            option.textContent = `Eps ${i + 1}-${end}`;
            episodeRangeSelect.appendChild(option);
        }

        episodeRangeSelect.addEventListener("change", function () {
            const [start, end] = episodeRangeSelect.value.split("-").map(Number);
            displayEpisodeButtons(filteredEpisodes.slice(start - 1, end), type);
        });

        episodeFilterInput.addEventListener("input", function () {
            const episodeNumber = episodeFilterInput.value;
            const filtered = filteredEpisodes.filter(ep => ep["data-ep-num"].toString().includes(episodeNumber));
            displayEpisodeButtons(filtered, type);
        });

        displayEpisodeButtons(filteredEpisodes.slice(0, rangeSize), type);
    }

    function displayEpisodeButtons(episodes, type) {
        const episodeButtonsContainer = document.getElementById(`${type.toLowerCase()}EpisodeButtons`);
        episodeButtonsContainer.innerHTML = "";

        episodes.forEach(ep => {
            const button = document.createElement("button");
            button.textContent = ep["data-ep-num"];
            button.addEventListener("click", function () {
                window.location.href = `watch.html?id=${malId}&ep=${ep["data-ep-num"]}&type=${type.toLowerCase()}`;
            });
            episodeButtonsContainer.appendChild(button);
        });
    }
});
