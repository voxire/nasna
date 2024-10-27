import React from "react";
import PrivateNavbar from "./Private/PrivateNavbar";

function Private({ children }) {
  return (
    <div>
      <PrivateNavbar />
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

export default Private;
