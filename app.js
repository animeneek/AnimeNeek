document.addEventListener("DOMContentLoaded", function () {
    console.log("AniNeek is live!");

    const themeToggle = document.getElementById("themeToggle");

    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
    });
});
