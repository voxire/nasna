import React from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";

function Public({ children }) {
  return (
    <div>
      <Header />
      <div
        style={{
          backgroundColor: "#FAFAFA",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            maxWidth: "1500px",
            width: "100%",
          }}
        >
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Public;
