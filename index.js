function initializeSearchAndRandom() {
    const searchButton = document.getElementById("searchButton");
    const randomButton = document.getElementById("randomButton");
    const searchBox = document.getElementById("searchBox");

    searchButton.addEventListener("click", () => {
        const query = searchBox.value;
        if (query) {
            window.location.href = `search.html?q=${query}`;
        }
    });

    randomButton.addEventListener("click", () => {
        fetchPopularAnime().then(anime => {
            if (anime.length > 0) {
                const randomAnime = anime[Math.floor(Math.random() * anime.length)];
                window.location.href = `info.html?id=${randomAnime.mal_id}`;
            }
        });
    });

    searchBox.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            const query = searchBox.value;
            if (query) {
                window.location.href = `search.html?q=${query}`;
            }
        }
    });
}

function fetchPopularAnime() {
    return fetch("https://api.jikan.moe/v4/top/anime")
        .then(response => response.json())
        .then(data => data.data)
        .catch(error => {
            console.error("Error fetching popular anime:", error);
            return [];
        });
}

// Ensure the function is called on all pages where the header is loaded
document.addEventListener("DOMContentLoaded", function () {
    fetch("header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header").innerHTML = data;
            // Initialize search and random functionality after loading the header
            initializeSearchAndRandom();
        });
});
