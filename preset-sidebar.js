// ==UserScript==
// @name         AO3 Sidebar Loader
// @namespace    https://archiveofourown.org
// @version      1.0
// @description  Loads AO3 sidebar script from GitHub
// @match        https://archiveofourown.org/works/new*
// @match        https://archiveofourown.org/works/*/edit*
// @grant        none
// ==/UserScript==

(function() {
    const url = "https://raw.githubusercontent.com/ao3-tools/preset-sidebar/main/preset-sidebar.js";

    fetch(url)
        .then(r => r.text())
        .then(code => {
            const s = document.createElement("script");
            s.textContent = code;
            document.documentElement.appendChild(s);
        })
        .catch(err => console.error("Sidebar load failed:", err));
})();
