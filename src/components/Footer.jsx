import React from "react";
import TextRise from './TextRise';
import AsciiTrailCanvas from "./AsciiTrailCanvas"; // Integrated entry hook point

const BLUE = "#1818E8";

export default function Footer() {
  return (
    <footer className="footer">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .footer {
          --blue: ${BLUE};

          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 0;
          overflow: hidden;

          background: #ffffff;
          color: var(--blue);

          font-family: Arial, Helvetica, sans-serif;
          font-weight: 700;
        }

        /* =========================================
           TOP CONTENT STACKS (Pushed on Top Layer)
           ========================================= */

        .footer__name {
          position: absolute;
          left: 3.8vw;
          top: 4.8vh;

          margin: 0;

          font-family: Arial, Helvetica, sans-serif;
          font-size: clamp(44px, 4vw, 68px);
          font-weight: 500;
          line-height: 0.88;
          letter-spacing: -0.075em;

          color: var(--blue);
          white-space: nowrap;
          z-index: 10; /* Keep high above background trail components */
        }

        .footer__info {
          position: absolute;
          left: 4vw;
          top: 21.5vh;

          font-size: 15px;
          line-height: 1.9;
          letter-spacing: -0.02em;

          z-index: 10; /* Keep high above background trail components */
        }

        .footer__info p {
          margin: 0;
        }

        .footer__tagline {
          margin-top: 25px !important;
        }


        /* =========================
           COLUMN HEADINGS / LINKS
        ========================= */

        .footer__column {
          position: absolute;
          top: 5.15vh;
          z-index: 10; /* Keep high above background trail components */
        }

        .footer__column--socials {
          left: 47.8%;
        }

        .footer__column--hello {
          left: 63.2%;
        }

        .footer__column--location {
          left: 78.2%;
        }

        .footer__heading {
          margin: 0 0 27px;

          font-size: 15px;
          line-height: 1;
          font-weight: 700;

          text-transform: uppercase;
          letter-spacing: 0.075em;
        }

        .footer__links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .footer__link {
          display: block;
          width: max-content;

          color: var(--blue);
          text-decoration: none;

          font-size: 15px;
          line-height: 1.25;
          letter-spacing: -0.015em;

          transition: opacity 0.2s ease;
        }

        .footer__link:hover {
          opacity: 0.55;
        }

        .footer__subsection {
          margin-top: 28px;
        }


        /* =========================================
           GIANT BACKGROUND BACKDROP WRAPPER LAYER
           ========================================= */

        .footer__art {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%; /* Stretches to provide full 100vh canvas sizing coordinates */
          z-index: 1;    /* Lowered below all active header/link fields */

          overflow: hidden;
          pointer-events: none;
        }


        /* =========================
           BOTTOM DETAILS
        ========================= */

        .footer__copyright {
          position: absolute;

          left: 2.05vw;
          bottom: 4.15vh;

          color: var(--blue);

          font-size: 12px;
          line-height: 1;

          letter-spacing: 0.015em;
          text-transform: uppercase;

          z-index: 20;
        }

        .footer__signature {
          position: absolute;

          right: 2.1vw;
          bottom: 2.45vh;

          width: 45px;
          height: 30px;

          z-index: 20;
        }

        .footer__signature text {
          fill: var(--blue);

          font-family: Arial, Helvetica, sans-serif;
          font-size: 22px;
          font-weight: 500;

          letter-spacing: -0.15em;
        }


        /* =========================
           TABLET RESPONSIVENESS
        ========================= */

        @media (max-width: 1100px) {
          .footer__column--socials {
            left: 47%;
          }

          .footer__column--hello {
            left: 64%;
          }

          .footer__column--location {
            left: 80%;
          }
        }


        /* =========================
           MOBILE RESPONSIVENESS
        ========================= */

        @media (max-width: 700px) {
          .footer {
            height: 100vh;
          }

          .footer__name {
            left: 6vw;
            top: 3.5vh;
            font-size: clamp(40px, 11vw, 60px);
          }

          .footer__info {
            left: 6vw;
            top: 17vh;
            font-size: 13px;
          }

          .footer__column {
            top: 17vh;
          }

          .footer__column--socials {
            left: 51vw;
          }

          .footer__column--hello {
            left: 51vw;
            top: 39vh;
          }

          .footer__column--location {
            display: none;
          }

          .footer__heading {
            font-size: 12px;
          }

          .footer__link {
            font-size: 13px;
          }

          .footer__copyright {
            left: 6vw;
            bottom: 2.5vh;
            font-size: 9px;
          }

          .footer__signature {
            right: 5vw;
            bottom: 1.5vh;
          }
        }
      `}</style>


      {/* =========================
          NAME
      ========================= */}
      <section className="footer__name">
        made with curiosity.
      </section>


      {/* =========================
          LEFT INFO
      ========================= 
      <div className="footer__info">
        <p>© 2026 / Sudip Das</p>
        <p>Designer &amp; Developer</p>

        <p className="footer__tagline">
          made with curiosity
        </p>
      </div>*/}


      {/* =========================
          SOCIALS
      ========================= 
      <div className="footer__column footer__column--socials">
        <h2 className="footer__heading">
          Socials
        </h2>

        <div className="footer__links">
          <a className="footer__link" href="#">Instagram</a>
          <a className="footer__link" href="#">GitHub</a>
          <a className="footer__link" href="#">Gmail</a>
        </div>
      </div>*/}


      {/* =========================
          SAY HI + MORE
      ========================= 
      <div className="footer__column footer__column--hello">
        <div>
          <h2 className="footer__heading">Say Hi</h2>
          <div className="footer__links">
            <a className="footer__link" href="mailto:">Email</a>
          </div>
        </div>

        <div className="footer__subsection">
          <h2 className="footer__heading">More</h2>
          <div className="footer__links">
            <a className="footer__link" href="#about">About</a>
            <a className="footer__link" href="#work">Work</a>
          </div>
        </div>
      </div>*/}


      {/* =========================
          BASED IN + ELSEWHERE
      ========================= 
      <div className="footer__column footer__column--location">
        <div>
          <h2 className="footer__heading">Based In</h2>
          <div className="footer__links">
            <a className="footer__link" href="#">India</a>
            <a className="footer__link" href="#">Gujarat</a>
          </div>
        </div>

        <div className="footer__subsection">
          <h2 className="footer__heading">Elsewhere</h2>
          <div className="footer__links">
            <a className="footer__link" href="#portfolio">Portfolio</a>
            <a className="footer__link" href="#contact">Contact</a>
          </div>
        </div>
      </div>*/}


      {/* ===================================================
          FULL VIEWPORT INTERACTIVE BACKGROUND ART BACKDROP
          =================================================== */}
      <div className="footer__art">
        <AsciiTrailCanvas />
        <section style={{ display: "none" }}></section>
      </div>


      {/* =========================
          BOTTOM
      ========================= */}
      <div className="footer__copyright">
        © 2026 SUDIP DAS
      </div>

      <svg className="footer__signature" viewBox="0 0 55 35" aria-hidden="true">
        <text x="0" y="25">SDツ</text>
      </svg>

    </footer>
  );
}
