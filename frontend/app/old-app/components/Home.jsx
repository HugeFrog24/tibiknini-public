import React from "react";

function Home({ textClass }) {
  return (
    <div>
      <h1 className={textClass}>Welcome to our website!</h1>
      <p>This is the home page.</p>
    </div>
  );
}

export default Home;