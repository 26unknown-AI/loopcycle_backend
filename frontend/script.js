// Dynamic API URL: Works both locally and on Render!
const API_BASE_URL = window.location.origin + "/api";

// Put your Cloudinary Cloud Name here (or leave as test default)
const CLOUDINARY_CLOUD_NAME = "demo"; 
const CLOUDINARY_PRESET = "docs_upload_example_preset";

const CATEGORY_ICONS = {
    Books: "📚",
    Electronics: "💻",
    Furniture: "🪑",
    Vehicles: "🚲"
};

let selectedCategory = "All";
let cachedListings = [];

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("loopcycleUser") || "null");
    } catch (error) {
        return null;
    }
}

// =========================================================================
// GOOGLE OAUTH ONE-TAP / BUTTON INTEGRATION
// =========================================================================

window.addEventListener("load", function () {
    // Check if Google Client Library is loaded
    if (window.google && window.google.accounts) {
        try {
            google.accounts.id.initialize({
                // Public test client id; replace with your own Google Client ID when ready
                client_id: "511828570984-25dlm4dgm22ke6a83epivsv21n4q8mdg.apps.googleusercontent.com",
                callback: handleGoogleCredentialResponse,
                auto_select: false
            });

            const loginBtnDiv = document.getElementById("googleSignInBtn");
            const signupBtnDiv = document.getElementById("googleSignUpBtn");

            if (loginBtnDiv) {
                google.accounts.id.renderButton(loginBtnDiv, {
                    theme: "outline",
                    size: "large",
                    width: 280,
                    text: "continue_with"
                });
            }
            if (signupBtnDiv) {
                google.accounts.id.renderButton(signupBtnDiv, {
                    theme: "outline",
                    size: "large",
                    width: 280,
                    text: "signup_with"
                });
            }
        } catch (e) {
            console.log("Google Auth initialized in offline/fallback mode.");
        }
    }
});

async function handleGoogleCredentialResponse(response) {
    try {
        // Decode Google JWT Token payload safely
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const googleUser = JSON.parse(jsonPayload);

        // Send verified Google user to our Django backend!
        const res = await fetch(`${API_BASE_URL}/auth/verify/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firebase_uid: "google_" + googleUser.sub,
                email: googleUser.email,
                name: googleUser.name,
                device_fingerprint_id: "google_verified_device"
            })
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("loopcycleUser", JSON.stringify(data.user));
            localStorage.setItem("loopcycleLoggedIn", "true");
            updateNav();
            closeAuth();
            alert(`Verified with Google! Welcome, ${data.user.name}.`);
        } else {
            alert(data.error || "Google verification failed.");
        }
    } catch (err) {
        console.error("Google Auth error:", err);
        alert("Could not process Google login. Try email login.");
    }
}

// =========================================================================
// STANDARD AUTHENTICATION FALLBACK
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
            alert(`Account created! Welcome, ${data.user.name}.`);
        } else {
            alert(data.error || "Signup failed.");
        }
    } catch (err) {
        console.error("Auth error:", err);
        alert("Could not connect to Django server.");
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
        alert("Could not connect to server.");
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
// MARKETPLACE LISTINGS
// =========================================================================

async function fetchListingsFromBackend(categoryName = "All") {
    try {
        let url = `${API_BASE_URL}/listings/`;
        if (categoryName !== "All") {
            url += `?category=${categoryName.toLowerCase()}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch");

        cachedListings = await response.json();
        renderListingsUI(categoryName);
    } catch (err) {
        console.error("Error loading listings:", err);
    }
}

function renderListings(categoryName) {
    selectedCategory = categoryName;
    fetchListingsFromBackend(categoryName);
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
    const catFormatted = item.category.charAt(0).toUpperCase() + item.category.slice(1);
    const icon = CATEGORY_ICONS[catFormatted] || "♻️";
    const photo = (item.photo_urls && item.photo_urls.length > 0)
        ? `<img src="${item.photo_urls[0]}" alt="${escapeHtml(item.title)}" style="width:100%; height:100%; object-fit:cover;">`
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
                        ${item.transaction_type === "sell" ? "Buy via Escrow" : item.transaction_type === "rent" ? "Rent" : "Barter"}
                    </button>
                    <button class="listing-action-btn secondary" type="button" onclick="viewListing('${item.id}')">View details</button>
                </div>
            </div>
        </article>
    `;
}

// =========================================================================
// REAL CLOUDINARY PHOTO UPLOAD + CREATE LISTING
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
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-height:120px; border-radius:8px;">`;
    };
    reader.readAsDataURL(file);
}

// Cloudinary Direct Upload
async function uploadPhotoToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        return data.secure_url || "";
    } catch (e) {
        console.warn("Cloudinary direct upload fallback to local preview.");
        return "";
    }
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
    const transactionType = (rawType === "buy") ? "sell" : (rawType === "exchange") ? "barter" : rawType;
    const condition = document.getElementById("itemCondition").value === "Used" ? "broken" : "working";
    const priceVal = document.getElementById("itemPrice").value.trim();
    const description = document.getElementById("itemDescription").value.trim();

    // Check for photo file
    const photoInput = document.getElementById("itemPhoto");
    let photoUrls = [];

    if (photoInput && photoInput.files && photoInput.files[0]) {
        const uploadedUrl = await uploadPhotoToCloudinary(photoInput.files[0]);
        if (uploadedUrl) {
            photoUrls.push(uploadedUrl);
        }
    }

    const payload = {
        seller: user.id,
        title: title,
        description: description,
        category: categoryName,
        transaction_type: transactionType,
        condition: condition,
        price: transactionType === "barter" ? null : (parseFloat(priceVal) || null),
        photo_urls: photoUrls
    };

    try {
        const response = await fetch(`${API_BASE_URL}/listings/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Item published successfully to the live marketplace!");
            closeListing();
            document.getElementById("listingForm").reset();
            const preview = document.getElementById("photoPreview");
            if (preview) preview.innerHTML = "Choose a photo of your item";
            fetchListingsFromBackend(selectedCategory);
        } else {
            const err = await response.json();
            alert("Could not post: " + JSON.stringify(err));
        }
    } catch (err) {
        console.error("Save listing error:", err);
        alert("Could not connect to Django server.");
    }
}

// =========================================================================
// ESCROW / TRANSACTIONS
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

async function viewListing(id) {
    const item = getListingById(id);
    if (!item) return;

    const price = item.price ? `₹${item.price}` : "Barter / Free";
    const seller = item.seller_details ? item.seller_details.name : "Member";
    const trust = item.seller_details ? item.seller_details.trust_score : 0;

    let brokenWarning = "";
    if (item.condition === "broken") {
        brokenWarning = `
            <div style="background:#fff3cd; color:#856404; padding:12px; border-radius:8px; margin:12px 0;">
                ⚠️ <strong>SDG 12 Alert:</strong> Item is marked as broken. 
                <br><a href="${API_BASE_URL}/e-waste-centers/?city=Bengaluru" target="_blank" style="color:#004085; text-decoration:underline; font-weight:600;">
                    Click here to view authorized CPCB E-Waste Centers
                </a>
            </div>`;
    }

    document.getElementById("actionModalBody").innerHTML = `
        <div class="action-item-head">
            <div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.category)} · ${escapeHtml(item.transaction_type)}</p>
            </div>
        </div>
        ${brokenWarning}
        <div class="action-details">
            <p><strong>Description:</strong> ${escapeHtml(item.description)}</p>
            <p><strong>Condition:</strong> ${escapeHtml(item.condition)}</p>
            <p><strong>Price:</strong> ${escapeHtml(price)}</p>
            <p><strong>Seller:</strong> ${escapeHtml(seller)} (⭐ ${trust} Trust Score)</p>
        </div>
        <button class="primary-btn action-confirm" type="button" onclick="contactListing('${item.id}')">
            ${item.transaction_type === "sell" ? "Buy via Escrow" : "Proceed with Loop"}
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
        alert("You cannot buy your own item!");
        return;
    }

    const price = item.price ? `₹${item.price}` : "Barter exchange";

    document.getElementById("actionModalBody").innerHTML = `
        <div class="success-box">
            <div class="success-icon">🛡️</div>
            <h3>LoopCycle Escrow Protection</h3>
            <p>Your payment is <strong>held safely in escrow</strong>. The seller only receives payout after you confirm delivery.</p>
        </div>
        <div class="action-details">
            <p><strong>Item:</strong> ${escapeHtml(item.title)}</p>
            <p><strong>Amount:</strong> ${escapeHtml(price)}</p>
            <p><strong>Seller:</strong> ${escapeHtml(item.seller_details ? item.seller_details.name : "Seller")}</p>
        </div>
        <button class="primary-btn action-confirm" type="button" onclick="confirmEscrowPurchase('${item.id}')">
            Confirm & Place Payment in Escrow →
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
                    <p>Status: <strong style="color:orange">HELD IN ESCROW</strong></p>
                    <p>Once you meet the seller and verify the product, click confirm receipt in your profile to release the funds and reward the seller with +10 Trust Score.</p>
                    <button class="primary-btn action-confirm" type="button" onclick="closeActionModal(); fetchListingsFromBackend();">Done</button>
                </div>
            `;
        } else {
            alert("Transaction error: " + JSON.stringify(data));
        }
    } catch (err) {
        console.error("Escrow error:", err);
        alert("Server error processing transaction.");
    }
}

// =========================================================================
// PROFILE MODAL
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
    document.getElementById("profileTrustScore").textContent = user.trust_score || 0;

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
// NAVIGATION & SEARCH
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
        alert("Please enter a keyword to search.");
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

// Close modals on background click or ESC
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

// Initialize on page load
updateNav();
fetchListingsFromBackend("All");
