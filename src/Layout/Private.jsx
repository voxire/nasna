import React from "react";
import Header from "../Components/Header";

function Private({ children }) {
  return (
    <div>
      <Header dashboard={true} />
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
