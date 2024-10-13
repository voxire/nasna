import React from "react";
import { useTranslation } from "react-i18next";

function About() {
  const { t, i18n } = useTranslation();
  return (
    <div>
      <h1>{t("about.title.aboutUs")}</h1>
      <p className="about-description">
        {t("about.description")}
      </p>

      <h1>{t("about.title.mission")}</h1>
      <p className="about-mission">
        {t("about.mission")}
      </p>

      <h1>{t("about.title.vision")}</h1>
      <p className="about-vision">
        {t("about.vision")}
      </p>

       <h1>{t("about.title.joinUs")}</h1>
      <p className="about-join">
        {t("about.joinUs")}
      </p>
    </div>
  );
}

export default About;
