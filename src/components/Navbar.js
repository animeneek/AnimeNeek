import React from "react";

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center p-4 bg-gray-900 text-white">
      <a href="/" className="text-2xl font-bold">AniNeek</a>
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search anime..."
          className="p-2 rounded bg-gray-800 text-white"
        />
        <button className="p-2 bg-blue-500 rounded">Search</button>
        <button className="p-2 bg-green-500 rounded">Random Anime</button>
        <a href="/list" className="p-2 bg-yellow-500 rounded">Anime List</a>
        <button className="p-2 bg-gray-700 rounded">🌙</button>
      </div>
    </nav>
  );
};

export default Navbar;
