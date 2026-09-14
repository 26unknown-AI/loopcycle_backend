// Master URL pointing to your local Django Backend
const API_BASE_URL = "http://127.0.0.1:8000/api";

const CATEGORY_ICONS = {
    Books: "📚",
    Electronics: "💻",
    Furniture: "🪑",
    Vehicles: "🚲"
};

let selectedCategory = "All";
let cachedListings = []; // Holds items fetched from Django

// Helper to get logged-in user from localStorage
function getUser() {
    try {
        return JSON.parse(localStorage.getItem("loopcycleUser") || "null");
    } catch (error) {
        return null;
    }
}

// =========================================================================
// AUTHENTICATION (Connects to /api/auth/verify/)
// =========================================================================

function openAuth(type) {
    const modal = document.getElementById("authModal");
    if (!modal) return;
    modal.classList.add("active");
    switchAuth(type);
}

function switchAuth(type) {
    const loginBox = document.getElementById("loginFormBox");
    const signupBox = document.getElementById("signupFormBox");
    if (loginBox) loginBox.style.display = type === "login" ? "block" : "none";
    if (signupBox) signupBox.style.display = type === "signup" ? "block" : "none";
}

function closeAuth() {
    const modal = document.getElementById("authModal");
    if (modal) modal.classList.remove("active");
}

async function signupUser(event) {
    event.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!name || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        // Generates simulated UID for phase 1
        const pseudoUid = "usr_" + btoa(email).replace(/=/g, "").slice(0, 16);

        const response = await fetch(`${API_BASE_URL}/auth/verify/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firebase_uid: pseudoUid,
                email: email,
                name: name,
                device_fingerprint_id: "browser_session_" + Date.now()
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("loopcycleUser", JSON.stringify(data.user));
            localStorage.setItem("loopcycleLoggedIn", "true");
            updateNav();
            closeAuth();
            alert(`Welcome to LoopCycle, ${data.user.name}! Your account is active.`);
        } else {
            alert(data.error || "Signup failed. Please try again.");
        }
    } catch (err) {
        console.error("Auth error:", err);
        alert("Could not connect to backend server. Make sure 'python manage.py runserver' is running!");
    }
}

async function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    try {
        const pseudoUid = "usr_" + btoa(email).replace(/=/g, "").slice(0, 16);

        const response = await fetch(`${API_BASE_URL}/auth/verify/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firebase_uid: pseudoUid,
                email: email
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("loopcycleUser", JSON.stringify(data.user));
            localStorage.setItem("loopcycleLoggedIn", "true");
            updateNav();
            closeAuth();
            alert(`Welcome back, ${data.user.name}!`);
        } else {
            alert(data.error || "Login failed.");
        }
    } catch (err) {
        console.error("Login error:", err);
        alert("Backend server offline. Run 'python manage.py runserver' in terminal!");
    }
}

function logoutUser() {
    localStorage.removeItem("loopcycleLoggedIn");
    localStorage.removeItem("loopcycleUser");
    closeProfile();
    updateNav();
    alert("Logged out successfully.");
}

function updateNav() {
    const loggedIn = localStorage.getItem("loopcycleLoggedIn") === "true";
    const loginBtn = document.querySelector(".login");
    const signupBtn = document.querySelector(".signup");
    const accountNav = document.getElementById("accountNav");

    if (loginBtn) loginBtn.style.display = loggedIn ? "none" : "";
    if (signupBtn) signupBtn.style.display = loggedIn ? "none" : "";
    if (accountNav) accountNav.style.display = loggedIn ? "inline-block" : "none";
}

// =========================================================================
// MARKETPLACE & LISTINGS (Connects to /api/listings/)
// =========================================================================

async function fetchListingsFromBackend(categoryName = "All") {
    try {
        let url = `${API_BASE_URL}/listings/`;
        if (categoryName !== "All") {
            url += `?category=${categoryName.toLowerCase()}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch listings");

        cachedListings = await response.json();
        renderListingsUI(categoryName);
    } catch (err) {
        console.error("Error loading listings from Django:", err);
        const grid = document.getElementById("listingGrid");
        if (grid) {
            grid.innerHTML = '<div class="empty-listings" style="grid-column:1/-1; color:red">⚠️ Cannot connect to Django server on http://127.0.0.1:8000. Is your server running?</div>';
        }
    }
}

function renderListingsUI(categoryName) {
    const grid = document.getElementById("listingGrid");
    const title = document.getElementById("listingTitle");
    const count = document.getElementById("listingCount");
    if (!grid || !title || !count) return;

    title.textContent = categoryName === "All" ? "All marketplace items" : `${categoryName} items`;
    count.textContent = `${cachedListings.length} ${cachedListings.length === 1 ? "item" : "items"}`;

    if (!cachedListings.length) {
        grid.innerHTML = `
            <div class="empty-listings" style="grid-column:1/-1">
                <strong>No items listed here yet.</strong><br>
                <span>Be the first person to give something a second loop.</span>
            </div>`;
        return;
    }

    grid.innerHTML = cachedListings.map(makeListingCard).join("");
}

function makeListingCard(item) {
    const icon = CATEGORY_ICONS[item.category.charAt(0).toUpperCase() + item.category.slice(1)] || "♻️";
    const photo = (item.photo_urls && item.photo_urls.length > 0)
        ? `<img src="${item.photo_urls[0]}" alt="${escapeHtml(item.title)}">`
        : icon;

    const priceText = item.price
        ? `₹${item.price}`
        : item.transaction_type === "rent"
            ? "Rental"
            : "Barter / Free";

    const sellerName = item.seller_details ? item.seller_details.name : "Loop Member";
    const trustScore = item.seller_details ? item.seller_details.trust_score : 0;

    return `
        <article class="listing-card">
            <div class="listing-photo">${photo}</div>
            <div class="listing-body">
                <span class="listing-badge">${item.transaction_type.toUpperCase()}</span>
                <h4>${escapeHtml(item.title)}</h4>
                <p>${escapeHtml(item.description)}</p>
                <div class="listing-price">${priceText}</div>
                <div class="listing-meta">
                    <span>${escapeHtml(item.condition)}</span>
                    <span>by ${escapeHtml(sellerName)} (⭐ ${trustScore})</span>
                </div>
                <div class="listing-actions">
                    <button class="listing-action-btn" type="button" onclick="contactListing('${item.id}')">
                        ${item.transaction_type === "sell" ? "Buy now" : item.transaction_type === "rent" ? "Rent now" : "Barter"}
                    </button>
                    <button class="listing-action-btn secondary" type="button" onclick="viewListing('${item.id}')">View details</button>
                </div>
            </div>
        </article>
    `;
}

// =========================================================================
// CREATE LISTING (Connects to POST /api/listings/)
// =========================================================================

function openListing() {
    if (localStorage.getItem("loopcycleLoggedIn") !== "true") {
        openAuth("login");
        return;
    }
    const modal = document.getElementById("listingModal");
    if (modal) modal.classList.add("active");
}

function closeListing() {
    const modal = document.getElementById("listingModal");
    if (modal) modal.classList.remove("active");
}

function previewListingPhoto(event) {
    const file = event.target.files && event.target.files[0];
    const preview = document.getElementById("photoPreview");
    if (!preview) return;

    if (!file) {
        preview.innerHTML = "Choose a photo of your item";
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" alt="Item preview">`;
    };
    reader.readAsDataURL(file);
}

async function saveListing(event) {
    event.preventDefault();

    const user = getUser();
    if (!user) {
        closeListing();
        openAuth("login");
        return;
    }

    const title = document.getElementById("itemTitle").value.trim();
    const categoryName = document.getElementById("itemCategory").value.toLowerCase();
    const typeEl = document.querySelector('input[name="itemType"]:checked');
    const rawType = typeEl ? typeEl.value.toLowerCase() : "buy";
    
    // Map UI types to Django model choices ('sell', 'rent', 'barter')
    const transactionType = (rawType === "buy") ? "sell" : (rawType === "exchange") ? "barter" : rawType;
    
    const condition = document.getElementById("itemCondition").value === "Used" ? "broken" : "working";
    const priceVal = document.getElementById("itemPrice").value.trim();
    const description = document.getElementById("itemDescription").value.trim();

    if (!title || !categoryName || !description) {
        alert("Please add item name, category, and description.");
        return;
    }

    const payload = {
        seller: user.id,
        title: title,
        description: description,
        category: categoryName,
        transaction_type: transactionType,
        condition: condition,
        price: transactionType === "barter" ? null : (parseFloat(priceVal) || null),
        photo_urls: []
    };

    try {
        const response = await fetch(`${API_BASE_URL}/listings/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Your item has been listed successfully in the database!");
            closeListing();
            document.getElementById("listingForm").reset();
            const preview = document.getElementById("photoPreview");
            if (preview) preview.innerHTML = "Choose a photo of your item";
            
            // Refresh listings directly from Django!
            fetchListingsFromBackend(selectedCategory);
        } else {
            const errData = await response.json();
            alert("Error posting listing: " + JSON.stringify(errData));
        }
    } catch (err) {
        console.error("Save listing error:", err);
        alert("Could not reach backend to save listing.");
    }
}

// =========================================================================
// ESCROW / TRANSACTIONS & DETAILS (Connects to /api/transactions/)
// =========================================================================

function getListingById(id) {
    return cachedListings.find(item => String(item.id) === String(id));
}

function openActionModal() {
    const modal = document.getElementById("actionModal");
    if (modal) modal.classList.add("active");
}

function closeActionModal() {
    const modal = document.getElementById("actionModal");
    if (modal) modal.classList.remove("active");
}

function viewListing(id) {
    const item = getListingById(id);
    if (!item) return;

    const price = item.price ? `₹${item.price}` : "Barter / Free";
    const seller = item.seller_details ? item.seller_details.name : "Member";
    const trust = item.seller_details ? item.seller_details.trust_score : 0;

    document.getElementById("actionModalBody").innerHTML = `
        <div class="action-item-head">
            <div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.category)} · ${escapeHtml(item.transaction_type)}</p>
            </div>
        </div>
        <div class="action-details">
            <p><strong>Description:</strong> ${escapeHtml(item.description)}</p>
            <p><strong>Condition:</strong> ${escapeHtml(item.condition)}</p>
            <p><strong>Price:</strong> ${escapeHtml(price)}</p>
            <p><strong>Seller:</strong> ${escapeHtml(seller)} (⭐ ${trust} Trust Score)</p>
        </div>
        <button class="primary-btn action-confirm" type="button" onclick="contactListing('${item.id}')">
            ${item.transaction_type === "sell" ? "Buy via Escrow" : "Proceed"}
        </button>
    `;
    openActionModal();
}

function contactListing(id) {
    const item = getListingById(id);
    if (!item) return;

    const user = getUser();
    if (!user) {
        closeActionModal();
        openAuth("login");
        return;
    }

    if (item.seller === user.id) {
        alert("You cannot purchase or barter your own listing!");
        return;
    }

    const price = item.price ? `₹${item.price}` : "Barter exchange";

    document.getElementById("actionModalBody").innerHTML = `
        <div class="success-box">
            <div class="success-icon">🛡️</div>
            <h3>LoopCycle Escrow Protection</h3>
            <p>Your payment is <strong>held safely in escrow</strong>. The seller is only paid after you confirm you received the item.</p>
        </div>
        <div class="action-details">
            <p><strong>Item:</strong> ${escapeHtml(item.title)}</p>
            <p><strong>Amount:</strong> ${escapeHtml(price)}</p>
            <p><strong>Seller:</strong> ${escapeHtml(item.seller_details ? item.seller_details.name : "Seller")}</p>
        </div>
        <button class="primary-btn action-confirm" type="button" onclick="confirmEscrowPurchase('${item.id}')">
            Confirm & Hold Funds in Escrow →
        </button>
    `;
    openActionModal();
}

async function confirmEscrowPurchase(listingId) {
    const user = getUser();
    const item = getListingById(listingId);
    if (!user || !item) return;

    try {
        const response = await fetch(`${API_BASE_URL}/transactions/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                listing_id: item.id,
                buyer_id: user.id,
                amount: item.price || 0.00
            })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById("actionModalBody").innerHTML = `
                <div class="success-box">
                    <div class="success-icon">✅</div>
                    <h3>Payment Held in Escrow!</h3>
                    <p>Order ID: <code>${data.transaction.id}</code></p>
                    <p>Money is now held securely. Once you receive the item, click confirm in your profile to release payment and award the seller +10 Trust points.</p>
                    <button class="primary-btn action-confirm" type="button" onclick="closeActionModal(); fetchListingsFromBackend();">Done</button>
                </div>
            `;
        } else {
            alert("Transaction failed: " + JSON.stringify(data));
        }
    } catch (err) {
        console.error("Escrow error:", err);
        alert("Could not process transaction with server.");
    }
}

// =========================================================================
// PROFILE & USER ACTIVITY
// =========================================================================

function openProfile() {
    const user = getUser();
    if (!user) {
        openAuth("login");
        return;
    }

    document.getElementById("profileName").textContent = user.name || "Loop Member";
    document.getElementById("profileEmail").textContent = user.email || "";
    document.getElementById("profileAvatar").textContent = (user.name || "U").charAt(0).toUpperCase();

    const myItems = cachedListings.filter(item => item.seller === user.id);
    document.getElementById("profileItemCount").textContent = myItems.length;

    const listingsBox = document.getElementById("profileListings");
    if (listingsBox) {
        if (!myItems.length) {
            listingsBox.innerHTML = '<div class="profile-empty">No items listed yet. Click "+ List an item" to add one.</div>';
        } else {
            listingsBox.innerHTML = myItems.map(item => `
                <div class="profile-list-item" style="padding: 10px; border-bottom: 1px solid #eee;">
                    <strong>${escapeHtml(item.title)}</strong> - ${escapeHtml(item.transaction_type)} (₹${item.price || 0})
                </div>
            `).join("");
        }
    }

    document.getElementById("profileModal").classList.add("active");
}

function closeProfile() {
    const modal = document.getElementById("profileModal");
    if (modal) modal.classList.remove("active");
}

// =========================================================================
// NAVIGATION & CATEGORY ROUTING
// =========================================================================

function category(name) {
    selectedCategory = name;
    fetchListingsFromBackend(name);

    document.querySelectorAll(".category").forEach(function(card) {
        card.classList.remove("active");
        const heading = card.querySelector("h3");
        if (heading && heading.textContent.trim() === name) {
            card.classList.add("active");
        }
    });

    const res = document.getElementById("listingResults");
    if (res) res.scrollIntoView({ behavior: "smooth", block: "start" });
}

function explore() {
    selectedCategory = "All";
    const section = document.getElementById("explore");
    if (section) section.scrollIntoView({ behavior: "smooth" });
    fetchListingsFromBackend("All");
}

function sellItem() {
    openListing();
}

function searchItem() {
    const input = document.getElementById("searchInput");
    const value = input ? input.value.trim().toLowerCase() : "";

    if (!value) {
        alert("Please enter something to search.");
        return;
    }

    const matches = cachedListings.filter(item =>
        item.title.toLowerCase().includes(value) ||
        item.category.toLowerCase().includes(value) ||
        item.description.toLowerCase().includes(value)
    );

    const grid = document.getElementById("listingGrid");
    const title = document.getElementById("listingTitle");
    const count = document.getElementById("listingCount");

    if (!grid || !title || !count) return;

    title.textContent = `Search results for "${escapeHtml(value)}"`;
    count.textContent = `${matches.length} ${matches.length === 1 ? "item" : "items"}`;

    grid.innerHTML = matches.length
        ? matches.map(makeListingCard).join("")
        : '<div class="empty-listings" style="grid-column:1/-1">No matching items found.</div>';

    const res = document.getElementById("listingResults");
    if (res) res.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Modal closing helpers
document.addEventListener("click", function(event) {
    if (event.target && event.target.id === "authModal") closeAuth();
    if (event.target && event.target.id === "profileModal") closeProfile();
    if (event.target && event.target.id === "actionModal") closeActionModal();
    if (event.target && event.target.id === "listingModal") closeListing();
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeAuth();
        closeProfile();
        closeListing();
        closeActionModal();
    }
});

// Initialize on page load:
updateNav();
fetchListingsFromBackend("All");
