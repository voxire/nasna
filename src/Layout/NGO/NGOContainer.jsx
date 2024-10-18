import React from "react";
import Navbar from "./NGONavbar";

function NGOContainer({ children }) {
  return (
    <div>
      <Navbar />
      <div
        style={{
          padding: 20,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default NGOContainer;
