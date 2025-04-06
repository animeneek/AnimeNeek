document.addEventListener("DOMContentLoaded", function () {
    const tabButtons = document.querySelectorAll(".tab-button");
    const animeListContainer = document.getElementById("animeList");
    const prevPageButton = document.getElementById("prevPage");
    const nextPageButton = document.getElementById("nextPage");
    const currentPageDisplay = document.getElementById("currentPage");

    let currentPage = 1;
    let currentTab = "newest";

    tabButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            tabButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            currentTab = button.getAttribute("data-tab");
            currentPage = 1;
            fetchAnimeList();
        });
    });

    prevPageButton.addEventListener("click", (event) => {
        event.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            fetchAnimeList();
        }
    });

    nextPageButton.addEventListener("click", (event) => {
        event.preventDefault();
        currentPage++;
        fetchAnimeList();
    });

    async function fetchAnimeList() {
        animeListContainer.innerHTML = ''; // Clear previous anime list
        currentPageDisplay.textContent = currentPage; // Update current page display
        let url = '';
        switch (currentTab) {
            case "newest":
                url = `https://api.jikan.moe/v4/seasons/now?page=${currentPage}`;
                break;
            case "popular":
                url = `https://api.jikan.moe/v4/top/anime?page=${currentPage}`;
                break;
            case "top-rated":
                url = `https://api.jikan.moe/v4/top/anime?type=tv&page=${currentPage}`;
                break;
        }

        const response = await fetch(url);
        const data = await response.json();
        const animeList = data.data;

        // Fetch additional anime details from animeneek.json for SUB, DUB, RAW
        const animeDataResponse = await fetch("animeneek.json");
        const animeData = await animeDataResponse.json();

        animeList.forEach(anime => {
            const episodes = anime.episodes !== null ? `${anime.episodes} EPS` : "? EPS";
            const status = anime.status === "Finished Airing" ? "Fin" : anime.status === "Currently Airing" ? "Airing" : "Soon";
            const hentai = anime.type === "Hentai" ? `<span class="detail-box hen">HEN</span>` : "";
            const sources = animeData.find(item => item["data-mal-id"] == anime.mal_id)?.episodes || [];
            const sub = sources.some(ep => ep["data-ep-lan"].toLowerCase() === "sub") ? `<span class="detail-box sub">SUB</span>` : "";
            const dub = sources.some(ep => ep["data-ep-lan"].toLowerCase() === "dub") ? `<span class="detail-box dub">DUB</span>` : "";
            const raw = sources.some(ep => ep["data-ep-lan"].toLowerCase() === "raw") ? `<span class="detail-box raw">RAW</span>` : "";

            const animeItem = document.createElement("div");
            animeItem.classList.add("anime-item");
            animeItem.innerHTML = `
                <div class="poster-container">
                    <img class="anime-poster" src="${anime.images.jpg.large_image_url}" alt="${anime.title}" data-mal-id="${anime.mal_id}">
                    <div class="overlay">
                        <div class="play-button"><i class="fa-solid fa-play"></i></div>
                    </div>
                </div>
                <div class="anime-title">${anime.title}</div>
                <div class="anime-details">
                    ${hentai}
                    <span class="detail-box">${anime.type}</span>
                    <span class="detail-box">${episodes}</span>
                    ${sub}
                    ${dub}
                    ${raw}
                    <span class="detail-box">${status}</span>
                </div>
            `;

            animeItem.addEventListener("click", () => {
                window.location.href = `info.html?id=${anime.mal_id}`;
            });

            animeListContainer.appendChild(animeItem);
        });
    }

    // Fetch initial anime list for the default tab
    fetchAnimeList();
});
