import React from "react";
import Navbar from "../components/Navbar";

const Home = () => {
  return (
    <div>
      <Navbar />
      <h1 className="text-center text-3xl font-bold mt-5">Welcome to AniNeek</h1>
      <p className="text-center text-gray-500">Find and watch your favorite anime!</p>
    </div>
  );
};

export default Home;
