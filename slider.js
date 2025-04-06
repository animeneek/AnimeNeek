document.addEventListener("DOMContentLoaded", function () {
    const slider = document.getElementById("slider");
    const prevSlideButton = document.getElementById("prevSlide");
    const nextSlideButton = document.getElementById("nextSlide");
    const sliderDotsContainer = document.getElementById("sliderDots");
    let currentSlideIndex = 0;

    async function fetchPopularAnime() {
        const response = await fetch("https://api.jikan.moe/v4/top/anime");
        const data = await response.json();
        return data.data.slice(0, 5); // Get the top 5 popular anime
    }

    async function fetchAnimeDetails(id) {
        const response = await fetch(`https://raw.githubusercontent.com/animeneek/AnimeNeek/main/animeneek.json`);
        const data = await response.json();
        return data.find(anime => anime["data-mal-id"] === id);
    }

    async function createSlider() {
        const popularAnimes = await fetchPopularAnime();
        const animeDetailsPromises = popularAnimes.map(anime => fetchAnimeDetails(anime.mal_id));
        const animeDetailsList = await Promise.all(animeDetailsPromises);

        popularAnimes.forEach((anime, i) => {
            const animeDetails = animeDetailsList[i];

            const slide = document.createElement("div");
            slide.classList.add("slide");
            slide.setAttribute("data-mal-id", anime.mal_id); // 👈 Add this
            slide.style.backgroundImage = `url(${anime.images.webp.large_image_url})`;

            let hasSub = false, hasDub = false, hasRaw = false;
            if (animeDetails && animeDetails.episodes) {
                hasSub = animeDetails.episodes.some(ep => ep["data-ep-lan"] === "Sub");
                hasDub = animeDetails.episodes.some(ep => ep["data-ep-lan"] === "Dub");
                hasRaw = animeDetails.episodes.some(ep => ep["data-ep-lan"] === "Raw");
            }

            const details = `
                ${hasSub ? '<span class="detail-box sub">SUB</span>' : ''}
                ${hasDub ? '<span class="detail-box dub">DUB</span>' : ''}
                ${hasRaw ? '<span class="detail-box raw">RAW</span>' : ''}
            `;

            slide.innerHTML = `
                <div class="dark-overlay">
                    <div id="animeInfo">
                        <img id="animePortrait" src="${anime.images.webp.large_image_url}" alt="${anime.title} Portrait" data-mal-id="${anime.mal_id}">
                        <div id="animeDetails">
                            <h1>${anime.title}</h1>
                            <h2>Score: ${anime.score}</h2>
                            <p>Genres: ${anime.genres.map(g => g.name).join(", ")}</p>
                            <p>${anime.synopsis ? anime.synopsis.substring(0, 100) + '...' : 'No synopsis available.'}</p>
                            <p class="anime-details-slider">
                                <span class="detail-box">${anime.type}</span>
                                <span class="detail-box">${anime.episodes ? anime.episodes + ' EPS' : '? EPS'}</span>
                                ${details}
                                <span class="detail-box">${anime.status === "Finished Airing" ? 'Fin' : anime.status}</span>
                            </p>
                        </div>
                    </div>
                </div>
            `;
            slide.addEventListener("click", () => {
                window.location.href = `info.html?id=${anime.mal_id}`;
            });

            slider.appendChild(slide);

            const dot = document.createElement("span");
            dot.classList.add("slider-dot");
            dot.addEventListener("click", () => {
                showSlide(i);
            });
            sliderDotsContainer.appendChild(dot);
        });
        showSlide(currentSlideIndex);
    }

    function showSlide(index) {
        const slides = document.getElementsByClassName("slide");
        const dots = document.getElementsByClassName("slider-dot");
        if (slides.length === 0) return;
        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
            dots[i].classList.remove("active");
        }
        if (slides[index]) {
            slides[index].style.display = "block";
            dots[index].classList.add("active");
        }
    }

    function nextSlide() {
        const slides = document.getElementsByClassName("slide");
        if (slides.length === 0) return;
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        showSlide(currentSlideIndex);
    }

    function prevSlide() {
        const slides = document.getElementsByClassName("slide");
        if (slides.length === 0) return;
        currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
        showSlide(currentSlideIndex);
    }

    prevSlideButton.addEventListener("click", prevSlide);
    nextSlideButton.addEventListener("click", nextSlide);

    setInterval(nextSlide, 5000); // Auto slide every 5 seconds

    createSlider();
});
