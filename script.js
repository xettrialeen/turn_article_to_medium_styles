// ==UserScript==
// @name         Turn Articles to medium sites
// @namespace    http://tampermonkey.net/
// @version      4.6
// @description  medium like style article mode
// @author       Xettri Aleen
// @match        *://*/*
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/readability/0.4.4/Readability.js
// ==/UserScript==

(function () {
  "use strict";

  class ArticleMode {
    constructor() {
      this.isArticleMode = false;
      this.originalContent = "";
      this.isDarkMode = false;
      this.isAmoledMode = false;
      this.readabilityArticle = null;
      this.currentFontSize = 18;
      this.controlsVisible = false;
      this.wordCount = 0;
      this.isSpeaking = false;
      this.speechSynthesis = window.speechSynthesis;
      this.speechUtterance = null;
      this.readingWidth =
        parseInt(localStorage.getItem("preferredReadingWidth")) || 680;

      this.init();
    }

    init() {
      this.addStyles();
      this.addToggleButton();
      this.addKeyboardShortcuts();
      this.addScrollToTopButton();
    }

    addStyles() {
      const dynamicIslandStyles = `
        .dynamic-island-controls {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) scale(0.8);
            background-color: ${this.getControlsBackgroundColor()};
            border-radius: 20px;
            padding: 8px;
            display: flex;
            flex-direction:column;
            gap: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            transition: all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1.5);
            z-index: 1000000000000000000000000000000000001 !important;
            opacity: 0;
            pointer-events: none;
            width: 60px;
            height: 36px;
            overflow: hidden;
        }

        .dynamic-island-controls.visible {
            opacity: 1;
            pointer-events: auto;
            transform: translateX(-50%) scale(1);
            width: auto;
            height: auto;
        }

        .control-button {
            background-color: transparent;
            color: ${this.getAccentColor()};
            border: none;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
            padding: 5px;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            opacity: 0;
            transform: scale(0.5);
        }

        .dynamic-island-controls.visible .control-button {
            opacity: 1;
            transform: scale(1);
            transition-delay: 0.1s;
        }

        .control-button:hover {
            background-color: rgba(255, 255, 255, 0.1);
            transform: scale(1.1);
        }

        .control-button svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }

        @keyframes expand-bounce {
            0% { transform: translateX(-50%) scale(0.8); }
            70% { transform: translateX(-50%) scale(1.05); }
            100% { transform: translateX(-50%) scale(1); }
        }

        @keyframes contract-bounce {
            0% { transform: translateX(-50%) scale(1); }
            30% { transform: translateX(-50%) scale(1.05); }
            100% { transform: translateX(-50%) scale(0.8); }
        }

        .dynamic-island-controls.expand {
            animation: expand-bounce 0.5s cubic-bezier(0.25, 0.1, 0.25, 1.5) forwards;
        }

        .dynamic-island-controls.contract {
            animation: contract-bounce 0.5s cubic-bezier(0.25, 0.1, 0.25, 1.5) forwards;
        }
    `;

      GM_addStyle(dynamicIslandStyles);
      const styles = `
                @import url('https://fonts.googleapis.com/css2?family=Source+Serif+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&display=swap');

                body {
                    background-color: ${this.getBackgroundColor()} !important;
                    transition: background-color 0.3s ease !important;
                }

                .article-mode {
                    font-family: 'Source Serif Pro', serif !important;
                    max-width: 680px !important;
                    margin: 0 auto !important;
                    padding: 40px 20px !important;
                    line-height: 1.8 !important;
                    color: ${this.getTextColor()} !important;
                    background-color: ${this.getBackgroundColor()} !important;
                    transition: all 0.5s ease !important;
                    opacity: 0;
                    transform: translateY(20px);
                }

                .article-mode.visible {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }

                .article-mode h1, .article-mode h2, .article-mode h3 {
                    font-family: 'Source Serif Pro', serif !important;
                    line-height: 1.2 !important;
                    letter-spacing: -0.02em !important;
                    color: ${this.getTextColor()} !important;
                    margin-bottom: 0.7em !important;
                    scroll-margin-top: 80px;
                }

                .article-mode h1 { font-size: 2.5em !important; }
                .article-mode h2 { font-size: 2em !important; }
                .article-mode h3 { font-size: 1.5em !important; }

                .article-mode p {
                    font-weight: 400 !important;
                    color: ${this.getTextColor()} !important;
                    margin-bottom: 1.5em !important;
                }

                .article-mode img {
                    max-width: 100% !important;
                    height: auto !important;
                    margin: 1.5em 0 !important;
                    transition: all 0.3s ease !important;
                    border-radius: 8px !important;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important;
                }

                .article-mode-toggle {
                    position: fixed !important;
                    top: 20px !important;
                    right: 20px !important;
                    z-index: 9999 !important;
                    background-color: ${this.getAccentColor()} !important;
                    color: #fff !important;
                    border: none !important;
                    padding: 8px 12px !important;
                    cursor: pointer !important;
                    border-radius: 20px !important;
                    font-size: 14px !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                    transition: all 0.3s ease !important;
                    opacity: 0.8 !important;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important;
                }

                .article-mode-toggle:hover {
                    opacity: 1 !important;
                    transform: scale(1.05) !important;
                }

                .read-time {
                    position: fixed !important;
                    top: 20px !important;
                    left: 20px !important;
                    background-color: ${this.getControlsBackgroundColor()} !important;
                    color: ${this.getTextColor()} !important;
                    padding: 5px 10px !important;
                    border-radius: 15px !important;
                    font-size: 12px !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important;
                }

                .progress-bars {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 0% ;
                    height: 3px !important;
                    background-color: ${this.getAccentColor()} !important;
                    z-index: 10000 !important;
                    transition: width 0.3s ease !important;
                }

                .table-of-contents {
                    position: fixed !important;
                    top: 80px !important;
                    left: 20px !important;
                    width: 250px !important;
                    max-height: calc(100vh - 100px) !important;
                    overflow-y: auto !important;
                    background-color: ${this.getControlsBackgroundColor()} !important;
                    color: ${this.getTextColor()} !important;
                    padding: 20px !important;
                    border-radius: 8px !important;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                    font-size: 14px !important;
                    transition: all 0.3s ease !important;
                    opacity: 0;
                    transform: translateX(-20px);
                }

                .table-of-contents.visible {
                    opacity: 1;
                    transform: translateX(0);
                }

                .table-of-contents ul {
                    list-style-type: none !important;
                    padding-left: 0 !important;
                }

                .table-of-contents li {
                    margin-bottom: 10px !important;
                }

                .table-of-contents a {
                    color: ${this.getTextColor()} !important;
                    text-decoration: none !important;
                    transition: color 0.3s ease !important;
                }

                .table-of-contents a:hover {
                    color: ${this.getAccentColor()} !important;
                }

                @media (max-width: 1200px) {
                    .table-of-contents {
                        display: none !important;
                    }
                }

                .highlight-animation {
                    animation: highlight 2s ease-out;
                }

                @keyframes highlight {
                    0% { background-color: ${this.getAccentColor()}; }
                    100% { background-color: transparent; }
                }

                .search-input {
                    position: fixed !important;
                    top: 20px !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    padding: 5px 10px !important;
                    border-radius: 20px !important;
                    border: none !important;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important;
                    z-index: 10000 !important;
                    width: 200px !important;
                    opacity: 0 !important;
                    transition: opacity 0.3s ease !important;
                    background-color: ${this.getControlsBackgroundColor()} !important;
                    color: ${this.getTextColor()} !important;
                }

                .search-input.visible {
                    opacity: 1 !important;
                }

                .article-mode mark {
                    background-color: ${this.getHighlightColor()} !important;
                    color: ${this.getTextColor()} !important;
                }
            `;

      GM_addStyle(styles);

      const newStyles = `
      .scroll-to-top {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: ${this.getAccentColor()};
          color: #fff;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 10000;
      }
  
      .scroll-to-top.visible {
          opacity: 1;
      }
  
      .reading-width-control {
          position: fixed;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 10px;
      }
  
      .width-button {
          background-color: ${this.getControlsBackgroundColor()};
          color: ${this.getTextColor()};
          border: none;
          padding: 5px 10px;
          cursor: pointer;
          border-radius: 5px;
      }
  `;

      GM_addStyle(newStyles);

      const widthControlStyles = `
            .reading-width-control {
                position: fixed;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 10000;
            }
    
            .width-button {
                background-color: ${this.getControlsBackgroundColor()};
                color: ${this.getTextColor()};
                border: none;
                padding: 8px 12px;
                cursor: pointer;
                border-radius: 5px;
                transition: all 0.3s ease;
                opacity: 0.8;
            }
    
            .width-button:hover {
                opacity: 1;
                transform: scale(1.05);
            }
    
            .width-button.active {
                background-color: ${this.getAccentColor()};
                color: white;
            }
    
            .article-mode {
                width: 100% !important;
                max-width: ${this.readingWidth}px !important;
                margin: 0 auto !important;
                transition: max-width 0.3s ease !important;
            }

            .control-group{
                display: flex;
                flex-direction:row;
            }
        `;

      GM_addStyle(widthControlStyles);
    }

    createDynamicIslandControls() {
      const controls = document.createElement("div");
      controls.className = "dynamic-island-controls";
      controls.innerHTML = `
            <div class="control-group main-controls">
                <button class="control-button" id="font-decrease" title="Decrease font size">${this.getMinusIcon()}</button>
                <button class="control-button" id="font-increase" title="Increase font size">${this.getPlusIcon()}</button>
                <button class="control-button" id="toggle-dark-mode" title="Toggle dark mode">${this.getMoonIcon()}</button>
                <button class="control-button" id="toggle-amoled" title="Toggle AMOLED mode">${this.getAdjustIcon()}</button>
            </div>
            <div class="control-group extra-controls">
                <button class="control-button" id="toggle-toc" title="Toggle table of contents">${this.getListIcon()}</button>
                <button class="control-button" id="toggle-search" title="Toggle search">${this.getSearchIcon()}</button>
                <button class="control-button" id="text-to-speech" title="Text to speech">${this.getSpeakerIcon()}</button>
                <button class="control-button" id="share-article" title="Share article">${this.getShareIcon()}</button>
            </div>
            <div class="word-count">Words: ${this.wordCount}</div>
        `;
      document.body.appendChild(controls);
      this.addControlsEventListeners(controls);
    }

    createControlsShadowDOM() {
      this.controlsContainer = document.createElement("div");
      this.controlsContainer.id = "article-mode-controls-container";
      this.controlsContainer.style.position = "fixed";
      this.controlsContainer.style.top = "0";
      this.controlsContainer.style.left = "0";
      this.controlsContainer.style.width = "100%";
      this.controlsContainer.style.zIndex = "10000";
      document.body.appendChild(this.controlsContainer);

      const shadow = this.controlsContainer.attachShadow({ mode: "open" });

      const style = document.createElement("style");
      style.textContent = this.getControlsStyles();

      const controls = document.createElement("div");
      controls.className = "dynamic-island-controls";
      controls.style.display = "none"; // Initially hidden
      controls.innerHTML = `
                <button class="control-button" id="font-decrease" title="Decrease font size">${this.getMinusIcon()}</button>
                <button class="control-button" id="font-increase" title="Increase font size">${this.getPlusIcon()}</button>
                <button class="control-button" id="toggle-dark-mode" title="Toggle dark mode">${this.getMoonIcon()}</button>
                <button class="control-button" id="toggle-amoled" title="Toggle AMOLED mode">${this.getAdjustIcon()}</button>
                <button class="control-button" id="toggle-toc" title="Toggle table of contents">${this.getListIcon()}</button>
                <button class="control-button" id="toggle-search" title="Toggle search">${this.getSearchIcon()}</button>
            `;

      shadow.appendChild(style);
      shadow.appendChild(controls);

      this.addControlsEventListeners(shadow);
    }

    getControlsStyles() {
      return `
                .dynamic-island-controls {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: ${this.getControlsBackgroundColor()};
                    border-radius: 20px;
                    padding: 8px;
                    display: flex;
                    gap: 10px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
                    z-index: 10001;
                }

                .control-button {
                    background-color: transparent;
                    color: ${this.getAccentColor()};
                    border: none;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    padding: 5px;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                }

                .control-button:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                    transform: scale(1.1);
                }

                .control-button svg {
                    width: 16px;
                    height: 16px;
                    fill: currentColor;
                }

                @keyframes pulse {
                    0% { transform: translateX(-50%) scale(1); }
                    50% { transform: translateX(-50%) scale(1.05); }
                    100% { transform: translateX(-50%) scale(1); }
                }

                .dynamic-island-controls.pulse {
                    animation: pulse 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
                }
            `;
    }

    // Icon methods
    getMinusIcon() {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"/></svg>';
    }

    getPlusIcon() {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"/></svg>';
    }

    getMoonIcon() {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M283.211 512c78.962 0 151.079-35.925 198.857-94.792 7.068-8.708-.639-21.43-11.562-19.35-124.203 23.654-238.262-71.576-238.262-196.954 0-72.222 38.662-138.635 101.498-174.394 9.686-5.512 7.25-20.197-3.756-22.23A258.156 258.156 0 0 0 283.211 0c-141.309 0-256 114.511-256 256 0 141.309 114.511 256 256 256z"/></svg>';
    }

    getAdjustIcon() {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M8 256c0 136.966 111.033 248 248 248s248-111.034 248-248S392.966 8 256 8 8 119.033 8 256zm248 184V72c101.705 0 184 82.311 184 184 0 101.705-82.311 184-184 184z"/></svg>';
    }

    getListIcon() {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M48 48a48 48 0 1 0 48 48 48 48 0 0 0-48-48zm0 160a48 48 0 1 0 48 48 48 48 0 0 0-48-48zm0 160a48 48 0 1 0 48 48 48 48 0 0 0-48-48zm448 16H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-320H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16zm0 160H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16z"/></svg>';
    }

    getSearchIcon() {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"/></svg>';
    }

    getSpeakerIcon() {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M470.38 1.51L150.41 96A32 32 0 0 0 128 126.51v261.41a32 32 0 0 0 22.4 30.51l320 94.49a32 32 0 0 0 41.46-30.51V32a32 32 0 0 0-41.48-30.49zM480 437.85L171.87 348.1V106.31L480 16.56v421.29zM96 384H32a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h64a32 32 0 0 1 32 32v192a32 32 0 0 1-32 32zM32 160v192h64V160H32z"/></svg>';
    }

    getShareIcon() {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M503.691 189.836L327.687 37.851C312.281 24.546 288 35.347 288 56.015v80.053C127.371 137.907 0 170.1 0 322.326c0 61.441 39.581 122.309 83.333 154.132 13.653 9.931 33.111-2.533 28.077-18.631C66.066 312.814 132.917 274.316 288 272.085V360c0 20.7 24.3 31.453 39.687 18.164l176.004-152c11.071-9.562 11.086-26.753 0-36.328z"/></svg>';
    }

    addControlsEventListeners(controls) {
      controls
        .querySelector("#font-decrease")
        .addEventListener("click", () => this.changeFontSize(-1));
      controls
        .querySelector("#font-increase")
        .addEventListener("click", () => this.changeFontSize(1));
      controls
        .querySelector("#toggle-dark-mode")
        .addEventListener("click", () => this.toggleDarkMode());
      controls
        .querySelector("#toggle-amoled")
        .addEventListener("click", () => this.toggleAmoledMode());
      controls
        .querySelector("#toggle-toc")
        .addEventListener("click", () => this.toggleTableOfContents());
      controls
        .querySelector("#toggle-search")
        .addEventListener("click", () => this.toggleSearch());
      controls
        .querySelector("#text-to-speech")
        .addEventListener("click", () => this.toggleTextToSpeech());
      controls
        .querySelector("#share-article")
        .addEventListener("click", () => this.shareArticle());
    }

    toggleControls() {
      const controls = document.querySelector(".dynamic-island-controls");
      if (controls) {
        this.controlsVisible = !this.controlsVisible;
        controls.classList.toggle("visible", this.controlsVisible);
        controls.classList.toggle("expanded", this.controlsVisible);

        if (this.controlsVisible) {
          controls.classList.add("expand");
          controls.classList.remove("contract");
        } else {
          controls.classList.add("contract");
          controls.classList.remove("expand");
        }

        setTimeout(() => {
          controls.classList.remove("expand", "contract");
        }, 500);
      }
    }

    updateControlsStyles() {
      if (this.controlsContainer && this.controlsContainer.shadowRoot) {
        const style = this.controlsContainer.shadowRoot.querySelector("style");
        style.textContent = this.getControlsStyles();
      }
    }

    showControls() {
      if (this.controlsContainer && this.controlsContainer.shadowRoot) {
        const controls = this.controlsContainer.shadowRoot.querySelector(
          ".dynamic-island-controls"
        );
        controls.style.display = "flex";
        this.controlsVisible = true;
      }
    }
    addScrollToTopButton() {
      const button = document.createElement("div");
      button.className = "scroll-to-top";
      button.innerHTML = "↑";
      button.addEventListener("click", () =>
        window.scrollTo({ top: 0, behavior: "smooth" })
      );
      document.body.appendChild(button);

      window.addEventListener("scroll", () => {
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        button.classList.toggle("visible", scrollTop > 300);
      });
    }

    addToggleButton() {
      const button = document.createElement("button");
      button.className = "article-mode-toggle";
      button.innerHTML = "Enable Article Mode";
      button.addEventListener("click", () => this.toggleArticleMode());
      document.body.appendChild(button);
    }

    toggleArticleMode() {
      if (this.isArticleMode) {
        this.disableArticleMode();
      } else {
        this.enableArticleMode();
      }
    }

    enableArticleMode() {
      this.originalContent = document.body.innerHTML;
      this.readabilityArticle = new Readability(
        document.cloneNode(true)
      ).parse();
      const readTimeMinutes = Math.ceil(
        this.readabilityArticle.textContent.split(/\s+/).length / 200
      );
      document.body.innerHTML = `
            <div class="progress-bars"></div>
            <div class="article-mode">
                <h1>${this.readabilityArticle.title}</h1>
                <div id="article-content">${this.readabilityArticle.content}</div>
            </div>
            <div class="read-time">${readTimeMinutes} min read</div>
            <div class="table-of-contents"></div>
            <input type="text" class="search-input" placeholder="Search in article..." style="display: none;">
        `;

      this.createDynamicIslandControls();
      this.addEventListeners();
      this.isArticleMode = true;
      this.updateToggleButton();
      this.applyFontSize();
      this.addStyles();
      this.createTableOfContents();
      this.initProgressBar();
      this.addImageZoom();
      this.addSearchFunctionality();
      this.toggleControls();
      this.wordCount = this.readabilityArticle.textContent.split(/\s+/).length;
      this.updateWordCount();
      this.addReadingWidthControl();
      this.applyReadingWidth();
      this.addEstimatedReadingTime();

      setTimeout(() => {
        document.querySelector(".article-mode").classList.add("visible");
        document.querySelector(".table-of-contents").classList.add("visible");
      }, 100);

      this.animateParagraphs();
    }

    updateWordCount() {
      const wordCountElement = document.querySelector(".word-count");
      if (wordCountElement) {
        wordCountElement.textContent = `Words: ${this.wordCount}`;
      }
    }

    animateParagraphs() {
      const paragraphs = document.querySelectorAll(".article-mode p");
      paragraphs.forEach((p, index) => {
        p.style.opacity = "0";
        p.style.transform = "translateY(20px)";
        p.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        setTimeout(() => {
          p.style.opacity = "1";
          p.style.transform = "translateY(0)";
        }, 50 * (index + 1));
      });
    }

    disableArticleMode() {
      document.body.innerHTML = this.originalContent;
      this.isArticleMode = false;
      this.updateToggleButton();
      document.body.classList.remove("dark-mode");
      this.isDarkMode = false;
      this.isAmoledMode = false;
      this.addStyles();
    }

    addEventListeners() {
      window.addEventListener("scroll", () => this.updateProgressBar());
    }

    changeFontSize(delta) {
      this.currentFontSize += delta;
      this.applyFontSize();
    }

    applyFontSize() {
      const article = document.querySelector(".article-mode");
      if (article) {
        article.style.setProperty(
          "font-size",
          `${this.currentFontSize}px`,
          "important"
        );
      }
    }

    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      if (!this.isDarkMode) {
        this.isAmoledMode = false;
      }
      document.body.classList.toggle("dark-mode", this.isDarkMode);
      this.addStyles();
      this.updateControlsStyles();
    }

    toggleAmoledMode() {
      if (this.isDarkMode) {
        this.isAmoledMode = !this.isAmoledMode;
        this.addStyles();
        this.updateControlsStyles();
      }
    }

    updateToggleButton() {
      const button = document.querySelector(".article-mode-toggle");
      if (button) {
        button.innerHTML = this.isArticleMode
          ? "Disable Article Mode"
          : "Enable Article Mode";
      }
    }

    createTableOfContents() {
      const toc = document.querySelector(".table-of-contents");
      const headings = document.querySelectorAll(
        ".article-mode h1, .article-mode h2, .article-mode h3"
      );
      const tocList = document.createElement("ul");

      headings.forEach((heading, index) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.textContent = heading.textContent;
        a.href = `#heading-${index}`;
        a.addEventListener("click", (e) => {
          e.preventDefault();
          this.scrollToHeading(heading);
        });
        li.appendChild(a);
        tocList.appendChild(li);

        heading.id = `heading-${index}`;
      });

      toc.appendChild(tocList);
    }

    scrollToHeading(heading) {
      heading.scrollIntoView({ behavior: "smooth" });
      heading.classList.add("highlight-animation");
      setTimeout(() => {
        heading.classList.remove("highlight-animation");
      }, 2000);
    }

    toggleTableOfContents() {
      const toc = document.querySelector(".table-of-contents");
      toc.classList.toggle("visible");
    }

    initProgressBar() {
      this.updateProgressBar();
    }

    updateProgressBar() {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercentage =
        (scrollTop / (documentHeight - windowHeight)) * 100;

      const progressBar = document.querySelector(".progress-bars");
      if (progressBar) {
        progressBar.style.width = `${scrollPercentage}%`;
      }
    }

    addImageZoom() {
      const images = document.querySelectorAll(".article-mode img");
      images.forEach((img) => {
        img.style.cursor = "zoom-in";
        img.addEventListener("click", () => this.zoomImage(img));
      });
    }

    zoomImage(img) {
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      overlay.style.display = "flex";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.zIndex = "10001";
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 0.3s ease";

      const zoomedImg = img.cloneNode();
      zoomedImg.style.maxWidth = "90%";
      zoomedImg.style.maxHeight = "90%";
      zoomedImg.style.objectFit = "contain";
      zoomedImg.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.1)";
      zoomedImg.style.transform = "scale(0.9)";
      zoomedImg.style.transition = "transform 0.3s ease";

      overlay.appendChild(zoomedImg);
      document.body.appendChild(overlay);

      setTimeout(() => {
        overlay.style.opacity = "1";
        zoomedImg.style.transform = "scale(1)";
      }, 50);

      overlay.addEventListener("click", () => {
        overlay.style.opacity = "0";
        zoomedImg.style.transform = "scale(0.9)";
        setTimeout(() => {
          document.body.removeChild(overlay);
        }, 300);
      });
    }

    addKeyboardShortcuts() {
      document.addEventListener("keydown", (e) => {
        // Only process shortcuts if Ctrl key is pressed
        if (!e.ctrlKey) return;

        if (e.key === "m") {
          e.preventDefault(); // Prevent default browser behavior
          this.toggleArticleMode();
        } else if (this.isArticleMode) {
          switch (e.key) {
            case "=": // Common keyboard shortcut for zoom in (Ctrl+=)
            case "+":
              e.preventDefault();
              this.changeFontSize(1);
              break;

            case "-":
              e.preventDefault();
              this.changeFontSize(-1);
              break;

            case "d":
              e.preventDefault();
              this.toggleDarkMode();
              break;

            case "t":
              e.preventDefault();
              this.toggleTableOfContents();
              break;

            case "f": // Changed from 's' to 'f' for "find"
              e.preventDefault();
              this.toggleSearch();
              break;
          }
        }
      });

      // Add keyboard shortcut hint to toggle button
      const button = document.querySelector(".article-mode-toggle");
      if (button) {
        button.title = "Toggle Article Mode (Ctrl+M)";
      }
    }

    addSearchFunctionality() {
      const searchInput = document.querySelector(".search-input");
      let searchTimeout;

      searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(
          () => this.performSearch(searchInput.value),
          300
        );
      });
    }

    toggleSearch() {
      const searchInput = document.querySelector(".search-input");
      searchInput.style.display =
        searchInput.style.display === "none" ? "block" : "none";
      if (searchInput.style.display === "block") {
        searchInput.focus();
        setTimeout(() => searchInput.classList.add("visible"), 10);
      } else {
        searchInput.classList.remove("visible");
        this.clearHighlights();
      }
    }

    performSearch(query) {
      const content = document.querySelector(".article-mode");
      const regex = new RegExp(query, "gi");
      const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      const matches = [];

      this.clearHighlights();

      if (query.trim() === "") return;

      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.textContent.match(regex)) {
          matches.push(node);
        }
      }

      matches.forEach((match) => {
        const highlightedText = match.textContent.replace(
          regex,
          "<mark>$&</mark>"
        );
        const span = document.createElement("span");
        span.innerHTML = highlightedText;
        match.parentNode.replaceChild(span, match);
      });

      if (matches.length > 0) {
        matches[0].parentNode.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }

    clearHighlights() {
      const highlights = document.querySelectorAll(".article-mode mark");
      highlights.forEach((highlight) => {
        const parent = highlight.parentNode;
        parent.replaceChild(
          document.createTextNode(highlight.textContent),
          highlight
        );
        parent.normalize();
      });
    }

    getBackgroundColor() {
      if (this.isDarkMode) {
        return this.isAmoledMode ? "#000000" : "#121212";
      }
      return "#ffffff";
    }

    getTextColor() {
      if (this.isDarkMode) {
        return this.isAmoledMode ? "#ffffff" : "#e0e0e0";
      }
      return "#292929";
    }

    getAccentColor() {
      return this.isDarkMode ? "#4caf50" : "#03a87c";
    }

    getControlsBackgroundColor() {
      if (this.isDarkMode) {
        return this.isAmoledMode
          ? "rgba(40, 40, 40, 0.8)"
          : "rgba(18, 18, 18, 0.8)";
      }
      return "rgba(255, 255, 255, 0.8)";
    }

    getHighlightColor() {
      return this.isDarkMode
        ? "rgba(76, 175, 80, 0.3)"
        : "rgba(3, 168, 124, 0.3)";
    }

    toggleTextToSpeech() {
      if (!this.isSpeaking) {
        const text = this.readabilityArticle.textContent;
        this.speechUtterance = new SpeechSynthesisUtterance(text);
        this.speechSynthesis.speak(this.speechUtterance);
        this.isSpeaking = true;
      } else {
        this.speechSynthesis.cancel();
        this.isSpeaking = false;
      }
      this.updateTextToSpeechButton();
    }

    updateTextToSpeechButton() {
      const button = document.querySelector("#text-to-speech");
      button.innerHTML = this.isSpeaking
        ? this.getPauseIcon()
        : this.getSpeakerIcon();
      button.title = this.isSpeaking ? "Pause speech" : "Text to speech";
    }

    getPauseIcon() {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"/></svg>';
    }

    shareArticle() {
      if (navigator.share) {
        navigator
          .share({
            title: this.readabilityArticle.title,
            text: "Check out this article I found!",
            url: window.location.href,
          })
          .then(() => {
            console.log("Article shared successfully");
          })
          .catch((error) => {
            console.log("Error sharing article:", error);
          });
      } else {
        alert(
          "Web Share API is not supported in your browser. You can copy the URL to share this article."
        );
      }
    }

    addReadingWidthControl() {
      const control = document.createElement("div");
      control.className = "reading-width-control";
      control.innerHTML = `
            <button class="width-button ${
              this.readingWidth === 680 ? "active" : ""
            }" data-width="680">Narrow</button>
            <button class="width-button ${
              this.readingWidth === 800 ? "active" : ""
            }" data-width="800">Medium</button>
            <button class="width-button ${
              this.readingWidth === 1000 ? "active" : ""
            }" data-width="1000">Wide</button>
        `;
      document.body.appendChild(control);

      control.querySelectorAll(".width-button").forEach((button) => {
        button.addEventListener("click", () => {
          // Remove active class from all buttons
          control
            .querySelectorAll(".width-button")
            .forEach((btn) => btn.classList.remove("active"));
          // Add active class to clicked button
          button.classList.add("active");

          // Update reading width
          this.readingWidth = parseInt(button.dataset.width);
          this.applyReadingWidth();

          // Save preference to localStorage
          localStorage.setItem("preferredReadingWidth", this.readingWidth);
        });
      });
    }

    applyReadingWidth() {
      const article = document.querySelector(".article-mode");
      if (article) {
        article.style.setProperty(
          "max-width",
          `${this.readingWidth}px`,
          "important"
        );
        // Also update the stored width
        this.readingWidth = parseInt(article.style.maxWidth);
      }
    }

    addEstimatedReadingTime() {
      const wordCount = this.readabilityArticle.textContent.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute
      const readTimeElement = document.querySelector(".read-time");
      readTimeElement.textContent = `${readingTime} min read (${wordCount} words)`;
    }
  }

  // Initialize the ArticleMode
  const articleMode = new ArticleMode();
})();
