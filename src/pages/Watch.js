import React from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";

const Watch = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const ep = searchParams.get("ep");
  const type = searchParams.get("type");

  return (
    <div>
      <Navbar />
      <h1 className="text-center text-2xl mt-5">
        Watching Anime ID {id} - Episode {ep} ({type})
      </h1>
      <div className="flex justify-center mt-5">
        <iframe
          src={`//s3taku.one/watch?play=${id}`}
          width="800"
          height="450"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default Watch;
