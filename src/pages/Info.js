import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";

const Info = () => {
  const [searchParams] = useSearchParams();
  const malId = searchParams.get("id");
  const [anime, setAnime] = useState(null);

  useEffect(() => {
    if (malId) {
      fetch(`https://api.jikan.moe/v4/anime/${malId}`)
        .then((res) => res.json())
        .then((data) => setAnime(data.data))
        .catch((err) => console.error("Error fetching anime:", err));
    }
  }, [malId]);

  return (
    <div>
      <Navbar />
      {anime ? (
        <div className="max-w-4xl mx-auto p-5">
          <h1 className="text-3xl font-bold">{anime.title}</h1>
          <div className="flex gap-4 mt-4">
            <img src={anime.images.jpg.large_image_url} alt={anime.title} className="w-48 rounded" />
            <div>
              <p><strong>Score:</strong> {anime.score}</p>
              <p><strong>Episodes:</strong> {anime.episodes}</p>
              <p><strong>Genres:</strong> {anime.genres.map(g => g.name).join(", ")}</p>
              <p className="mt-2 text-gray-600">{anime.synopsis}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center mt-5">Loading anime details...</p>
      )}
    </div>
  );
};

export default Info;
