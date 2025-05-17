// script.js

let currentSearchTerm = "";
let activeTag = null;

// Theme Toggle Functionality
const themeToggleButton = document.getElementById('themeToggleButton');
const currentTheme = localStorage.getItem('theme');

function setPageTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeToggleButton) {
        themeToggleButton.innerHTML = theme === 'light' ?
            '<span class="material-icons">dark_mode</span>' :
            '<span class="material-icons">light_mode</span>';
        themeToggleButton.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }
    // Ensure chart rerenders with new theme colors if visible
    if (typeof renderManuscriptChartIfNeeded === 'function' && document.getElementById('manuscriptDistributionChart')) {
        setTimeout(() => { // Timeout to allow DOM to update with new theme attribute
             renderManuscriptChartIfNeeded();
        }, 0);
    }
}

if (currentTheme) {
    setPageTheme(currentTheme);
} else {
    // Default to light theme if no preference is stored
    setPageTheme('light'); // Changed from 'dark' to 'light'
}

if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
        let newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setPageTheme(newTheme);
    });
}
// End Theme Toggle Functionality


document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // Apply theme as early as possible, also handled above for initial load
    // If a theme is stored in localStorage, use it, otherwise default to 'light'.
    const storedTheme = localStorage.getItem('theme') || 'light'; // Changed from 'dark' to 'light'
    setPageTheme(storedTheme);


    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        setupIndexPage();
    } else if (path.includes('page.html')) {
        loadArgumentPage();
    }
    // Initialize theme toggle button text/icon again after DOM is fully loaded
    // This ensures it's correct even if script runs before button is in DOM (though ideally it shouldn't)
    if (themeToggleButton) {
         const currentSetTheme = document.documentElement.getAttribute('data-theme');
         themeToggleButton.innerHTML = currentSetTheme === 'light' ?
            '<span class="material-icons">dark_mode</span>' :
            '<span class="material-icons">light_mode</span>';
         themeToggleButton.setAttribute('aria-label', currentSetTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }
});

function setupIndexPage() {
    const searchInput = document.getElementById('searchInput');
    const clearSearchButton = document.getElementById('clearSearchButton');

    populateTagFilters();
    filterAndDisplayArguments(); // Initial display

    if (searchInput && clearSearchButton) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value.toLowerCase();
            clearSearchButton.style.display = currentSearchTerm ? 'flex' : 'none';
            filterAndDisplayArguments();
        });

        clearSearchButton.addEventListener('click', () => {
            searchInput.value = '';
            currentSearchTerm = '';
            activeTag = null;

            document.querySelectorAll('.tag-filter-button.active').forEach(btn => {
                btn.classList.remove('active');
            });

            clearSearchButton.style.display = 'none';
            searchInput.focus();
            filterAndDisplayArguments();
        });
    }
}

function extractUniqueTags() {
    const allTags = new Set();
    // Ensure argumentsData is available
    if (typeof argumentsData !== 'undefined') {
        argumentsData.forEach(arg => {
            if (arg.tags && Array.isArray(arg.tags)) {
                arg.tags.forEach(tag => allTags.add(tag.toLowerCase()));
            }
        });
    }
    return Array.from(allTags).sort();
}

function populateTagFilters() {
    const tagFilterContainer = document.getElementById('tagFilterContainer');
    if (!tagFilterContainer) return;
    tagFilterContainer.innerHTML = '';

    const uniqueTags = extractUniqueTags();
    uniqueTags.forEach(tag => {
        const button = document.createElement('button');
        button.className = 'tag-filter-button';
        let displayText = tag;
        button.textContent = displayText;
        button.dataset.tag = tag;

        button.addEventListener('click', () => {
            const currentActiveButton = document.querySelector('.tag-filter-button.active');
            if (currentActiveButton && currentActiveButton !== button) {
                currentActiveButton.classList.remove('active');
            }

            if (activeTag === tag) {
                activeTag = null;
                button.classList.remove('active');
            } else {
                activeTag = tag;
                button.classList.add('active');
            }
            filterAndDisplayArguments();
        });
        tagFilterContainer.appendChild(button);
    });
}

function filterAndDisplayArguments() {
    // Ensure argumentsData is available
    if (typeof argumentsData === 'undefined') {
        console.error("argumentsData is not defined. Cannot filter arguments.");
        const argumentListContainer = document.getElementById('argumentList');
        if (argumentListContainer) {
            argumentListContainer.innerHTML = '<p class="no-results">Error: Argument data not loaded.</p>';
        }
        return;
    }

    let filteredArguments = argumentsData;

    if (currentSearchTerm) {
        filteredArguments = filteredArguments.filter(arg => {
            const titleMatch = arg.title.toLowerCase().includes(currentSearchTerm);
            const summaryMatch = arg.christian_argument_summary.toLowerCase().includes(currentSearchTerm);
            // Ensure detail and response fields exist before trying to search them
            const detailMatch = arg.christian_argument_detail && arg.christian_argument_detail.toLowerCase().includes(currentSearchTerm);
            const responseMatch = arg.counter_response && arg.counter_response.toLowerCase().includes(currentSearchTerm);
            const tagMatch = arg.tags && arg.tags.some(t => t.toLowerCase().includes(currentSearchTerm));
            return titleMatch || summaryMatch || detailMatch || responseMatch || tagMatch;
        });
    }

    if (activeTag) {
        filteredArguments = filteredArguments.filter(arg => {
            if (!arg.tags || arg.tags.length === 0) return false;
            return arg.tags.some(t => t.toLowerCase() === activeTag);
        });
    }

    populateArgumentList(filteredArguments);
}

function populateArgumentList(dataToDisplay) {
    const argumentListContainer = document.getElementById('argumentList');
    if (!argumentListContainer) return;

    argumentListContainer.innerHTML = '';

    const existingClearButton = document.getElementById('dynamicClearFiltersButton');
    if (existingClearButton) {
        existingClearButton.remove();
    }

    if (typeof dataToDisplay === 'undefined' || dataToDisplay.length === 0) {
        argumentListContainer.innerHTML = '<p class="no-results">No arguments match your criteria.</p>';

        if (activeTag || currentSearchTerm) {
            const clearButton = document.createElement('button');
            clearButton.textContent = 'Clear Filters';
            clearButton.className = 'clear-filters-button';
            clearButton.id = 'dynamicClearFiltersButton';
            clearButton.addEventListener('click', () => {
                activeTag = null;
                currentSearchTerm = "";
                const searchInput = document.getElementById('searchInput');
                if(searchInput) searchInput.value = "";
                const clearSearchButtonIcon = document.getElementById('clearSearchButton');
                if(clearSearchButtonIcon) clearSearchButtonIcon.style.display = 'none';

                document.querySelectorAll('.tag-filter-button.active').forEach(btn => {
                    btn.classList.remove('active');
                });
                filterAndDisplayArguments();
            });
            argumentListContainer.appendChild(clearButton);
        }
        return;
    }

    dataToDisplay.forEach(arg => {
        const card = document.createElement('a');
        card.href = `page.html?arg=${arg.id}`;
        card.className = 'argument-card';

        let tagsHTML = '';
        if (arg.tags && arg.tags.length > 0) {
            const tagsToShow = arg.tags.slice(0, 2);
            let tagDisplayArray = tagsToShow.map(tag => {
                return tag;
            });

            tagsHTML = `<div class="argument-card-tags">
                ${tagDisplayArray.map(tagText => `<span class="card-tag">${tagText}</span>`).join('')}
                ${arg.tags.length > 2 ? `<span class="card-tag">...</span>` : ''}
            </div>`;
        }

        card.innerHTML = `
            <span class="material-icons argument-card-icon">${arg.icon || 'help_outline'}</span>
            <div class="argument-card-content">
                <h2>${arg.title}</h2>
                <p>${arg.christian_argument_summary}</p>
            </div>
            ${tagsHTML}
        `;
        argumentListContainer.appendChild(card);
    });
}

function loadArgumentPage() {
    const params = new URLSearchParams(window.location.search);
    const argumentId = params.get('arg');

    const argumentTitleEl = document.getElementById('argumentTitle');
    const christianArgumentDetailEl = document.getElementById('christianArgumentDetail');
    const counterTitleEl = document.getElementById('counterTitle');
    const counterResponseContentEl = document.getElementById('counterResponseContent');
    const pageHtmlTitle = document.querySelector('title');
    const pageHeaderTitleEl = document.getElementById('pageHeaderTitle');

    if (!argumentId || typeof argumentsData === 'undefined') {
        if (argumentTitleEl) argumentTitleEl.textContent = 'Argument not found.';
        if (christianArgumentDetailEl) christianArgumentDetailEl.innerHTML = '<p>Could not load the specified argument.</p>';
        if (counterResponseContentEl) counterResponseContentEl.innerHTML = '';
        if (counterTitleEl) counterTitleEl.textContent = '';
        if (pageHtmlTitle) pageHtmlTitle.textContent = "Argument Not Found | ReasonsIDoubt.com";
        if (pageHeaderTitleEl && pageHeaderTitleEl.firstChild.tagName === 'A') { // Check if it's the link
             pageHeaderTitleEl.firstChild.textContent = "ReasonsIDoubt.com";
        } else if (pageHeaderTitleEl) {
            pageHeaderTitleEl.innerHTML = `<a href="index.html">ReasonsIDoubt.com</a>`;
        }
        return;
    }

    const argument = argumentsData.find(arg => arg.id === argumentId);

    if (argument) {
        if (pageHtmlTitle) pageHtmlTitle.textContent = argument.title + " | ReasonsIDoubt.com";
        if (argumentTitleEl) argumentTitleEl.textContent = argument.title;
        if (christianArgumentDetailEl) christianArgumentDetailEl.innerHTML = argument.christian_argument_detail;
        if (counterTitleEl) counterTitleEl.textContent = argument.counter_title;
        if (counterResponseContentEl) {
            counterResponseContentEl.innerHTML = argument.counter_response;

            // Execute any scripts within the injected counter_response HTML
            // This is crucial for the contradictions page's search and sidebar functionality
            const scripts = counterResponseContentEl.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                const script = document.createElement('script');
                // If the script has a src, set it. Otherwise, copy innerHTML.
                if (scripts[i].src) {
                    script.src = scripts[i].src;
                } else {
                    script.innerHTML = scripts[i].innerHTML;
                }
                // Append to head or body to execute. Appending to head is generally safer for non-UI scripts.
                document.head.appendChild(script).parentNode.removeChild(script); // Append, execute, then remove
            }
        }


        if (argument.id === 'nt-manuscripts' && typeof renderManuscriptChartIfNeeded === 'function') {
            setTimeout(() => {
                renderManuscriptChartIfNeeded();
            }, 0);
        }

    } else {
        if (pageHtmlTitle) pageHtmlTitle.textContent = "Argument Not Found | ReasonsIDoubt.com";
        if (argumentTitleEl) argumentTitleEl.textContent = 'Argument Not Found';
        if (christianArgumentDetailEl) christianArgumentDetailEl.innerHTML = `<p>The argument with ID "${argumentId}" could not be found.</p>`;
        if (counterResponseContentEl) counterResponseContentEl.innerHTML = '';
        if (counterTitleEl) counterTitleEl.textContent = '';
    }
}
