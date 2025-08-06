import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, push, onValue, runTransaction, serverTimestamp, query, orderByChild, equalTo, remove, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Firebase Configuration - თქვენი Firebase კონფიგურაცია
const firebaseConfig = {
    apiKey: "AIzaSyBO1nTM6QGumu25F7lnkCHuRjP1o7WF74s",
    authDomain: "tete-bb546.firebaseapp.com",
    databaseURL: "https://tete-bb546-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tete-bb546",
    storageBucket: "tete-bb546.firebaseapp.com",
    messagingSenderId: "985504524225",
    appId: "1:985504524225:web:089ea12d15b9030866f140",
    measurementId: "G-490P2KJ1WC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const dashboardView = document.getElementById('dashboard-view');
const userPanelView = document.getElementById('user-panel-view');
const auctionList = document.getElementById('auction-list');
const emptyDashboard = document.getElementById('empty-dashboard');
const userPanelContent = document.getElementById('user-panel-content');
const myAuctionsContainer = document.getElementById('my-auctions-container');
const myBidsContainer = document.getElementById('my-bids-container');
const notificationsContainer = document.getElementById('notifications');
const searchInput = document.getElementById('search-input');

const authModal = document.getElementById('auth-modal');
const authTitle = document.getElementById('auth-title');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authFirstName = document.getElementById('auth-first-name');
const authLastName = document.getElementById('auth-last-name');
const authPhoneNumber = document.getElementById('auth-phone-number');
const nameFields = document.getElementById('name-fields');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authToggleBtn = document.getElementById('auth-toggle-btn');
const authCloseBtn = document.getElementById('auth-close-btn');
const authAlertContainer = document.getElementById('auth-alert-container');

const createAuctionModal = document.getElementById('create-auction-modal');
const createAuctionForm = document.getElementById('create-auction-form');
const createAuctionCloseBtn = document.getElementById('create-auction-close-btn');
const createAuctionAlertContainer = document.getElementById('create-auction-alert-container');

const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const dashboardNavBtn = document.getElementById('dashboard-btn');
const userPanelBtn = document.getElementById('user-panel-btn');
const createAuctionBtn = document.getElementById('create-auction-btn');
const userNameSpan = document.getElementById('user-name');
const guestActions = document.getElementById('guest-actions');
const userActions = document.getElementById('user-actions');

const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
const burgerMenu = document.getElementById('burger-menu');
const mobileUserNameSpan = document.getElementById('mobile-user-name');

// State
let isLoginMode = true;
let currentUser = null;
let currentUserData = null;
let activeAuctions = {};
const countdowns = {};
let myAuctions = {};
let myBids = {};
let lastKnownHighestBids = {};
let currentSearchQuery = '';

// Utility Functions
const showModal = (modal) => modal.classList.add('active');
const hideModal = (modal) => modal.classList.remove('active');
const toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode ? 'შესვლა' : 'რეგისტრაცია';
    authSubmitBtn.textContent = isLoginMode ? 'შესვლა' : 'რეგისტრაცია';
    authToggleBtn.textContent = isLoginMode ? 'არ გაქვთ ანგარიში? შექმენით' : 'უკვე გაქვთ ანგარიში? შედით';
    nameFields.style.display = isLoginMode ? 'none' : 'block';
    authForm.reset();
    clearAlert(authAlertContainer);
};
const createAlert = (container, message, type = 'error') => {
    clearAlert(container);
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    // აქ უნდა იყოს შესაბამისი Material Icon
    const icon = '<span class="material-icons">error</span>';
    alertDiv.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(alertDiv);
};
const clearAlert = (container) => container.innerHTML = '';
const formatTime = (seconds) => {
    if (seconds <= 0) return '0სთ 0წთ 0წმ';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? d + 'დღ ' : ''}${h}სთ ${m}წთ ${s}წმ`;
};

// შეცვლილი showToast ფუნქცია Material Design Icons-ის გამოსაყენებლად
const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type}`;
    toast.style.cssText = `  opacity: 0;   transform: translateX(100%);   transition: opacity 0.3s ease, transform 0.3s ease;   min-width: 250px;  `;
    // Material Design Icons-ის გამოყენება
    const iconName = type === 'success' ? 'check_circle' : 'info'; // 'success' ტიპისთვის 'check_circle' და 'info' და 'error'-ისთვის 'info'
    const icon = `<span class="material-icons">${iconName}</span>`;

    toast.innerHTML = `${icon}<span>${message}</span>`;
    notificationsContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = 1;
        toast.style.transform = 'translateX(0)';
    }, 10);
    setTimeout(() => {
        toast.style.opacity = 0;
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);

};

// --- Mobile Menu Logic ---
const closeMobileMenu = () => {
    mobileMenu.classList.remove('active');
    mobileMenuOverlay.classList.remove('active');
};

burgerMenu.addEventListener('click', () => {
    mobileMenu.classList.add('active');
    mobileMenuOverlay.classList.add('active');

    const mobileNavContent = document.getElementById('mobile-nav-content');
    mobileNavContent.querySelector('#mobile-user-actions').style.display = currentUser ? 'flex' : 'none';
    mobileNavContent.querySelector('#mobile-guest-actions').style.display = currentUser ? 'none' : 'flex';

    if (currentUser) {
        mobileUserNameSpan.textContent = currentUserData?.fullName || currentUser.email;
    }

});

mobileMenuOverlay.addEventListener('click', closeMobileMenu);

// --- Auth Event Handlers ---
document.querySelectorAll('#login-btn, #mobile-login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        isLoginMode = true;
        toggleAuthMode();
        showModal(authModal);
        closeMobileMenu();
    });
});

document.querySelectorAll('#register-btn, #mobile-register-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        isLoginMode = false;
        toggleAuthMode();
        showModal(authModal);
        closeMobileMenu();
    });
});

authToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthMode();
});
authCloseBtn.addEventListener('click', () => hideModal(authModal));

document.querySelectorAll('#logout-btn, #mobile-logout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        signOut(auth);
        closeMobileMenu();
    });
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;

    clearAlert(authAlertContainer);
    authSubmitBtn.disabled = true;
    authSubmitBtn.innerHTML = '<span class="spinner"></span>';

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const firstName = authFirstName.value;
            const lastName = authLastName.value;
            const phoneNumber = authPhoneNumber.value;

            if (!firstName || !lastName || !phoneNumber) {
                createAlert(authAlertContainer, 'გთხოვთ შეავსოთ ყველა სავალდებულო ველი.');
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Store user data in the database
            const userId = userCredential.user.uid;
            const userRef = ref(db, `users/${userId}`);
            await set(userRef, {
                firstName,
                lastName,
                phoneNumber,
                email
            });
        }
        hideModal(authModal);
    } catch (error) {
        createAlert(authAlertContainer, error.message);
    } finally {
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = isLoginMode ? 'შესვლა' : 'რეგისტრაცია';
    }

});

// --- Auction Event Handlers ---
document.querySelectorAll('#create-auction-btn, #mobile-create-auction-btn, #create-auc-fisrt').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!currentUser) {
            showToast('გთხოვთ შეხვიდეთ სისტემაში აუქციონის შესაქმნელად.', 'error');
            return;
        }
        showModal(createAuctionModal);
        createAuctionForm.reset();
        clearAlert(createAuctionAlertContainer);
        closeMobileMenu();
    });
});

createAuctionCloseBtn.addEventListener('click', () => hideModal(createAuctionModal));

createAuctionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = e.target['auction-title'].value;
    const description = e.target['auction-description'].value;
    const startingPrice = parseFloat(e.target['auction-price'].value);
    const durationMinutes = parseInt(e.target['auction-duration'].value, 10);
    const contactName = e.target['contact-name'].value;
    const contactInfo = e.target['contact-info'].value;

    clearAlert(createAuctionAlertContainer);

    if (title.length < 5) {
        createAlert(createAuctionAlertContainer, 'სათაური უნდა იყოს მინიმუმ 5 სიმბოლო.');
        return;
    }
    if (startingPrice < 0) {
        createAlert(createAuctionAlertContainer, 'საწყისი ფასი არ შეიძლება იყოს უარყოფითი.');
        return;
    }
    if (durationMinutes <= 0) {
        createAlert(createAuctionAlertContainer, 'ხანგრძლივობა უნდა იყოს მინიმუმ 1 წუთი.');
        return;
    }

    const newAuction = {
        title,
        description,
        startingPrice,
        highestBid: startingPrice,
        highestBidder: 'N/A',
        highestBidderId: null,
        ownerId: currentUser.uid,
        ownerName: `${currentUserData.firstName} ${currentUserData.lastName}`,
        ownerPhoneNumber: currentUserData.phoneNumber,
        contactName,
        contactInfo,
        createdAt: serverTimestamp(),
        endTime: Date.now() + durationMinutes * 60 * 1000,
    };

    try {
        const auctionsRef = ref(db, 'auctions');
        await push(auctionsRef, newAuction);
        hideModal(createAuctionModal);
        showToast('აუქციონი წარმატებით შეიქმნა!', 'success');
    } catch (error) {
        createAlert(createAuctionAlertContainer, error.message);
    }

});

// --- Navigation ---
const setActiveNav = (activeBtnId) => {
    document.querySelectorAll('.btn-link').forEach(btn => btn.classList.remove('active'));
    document.getElementById(activeBtnId).classList.add('active');
    const mobileBtn = document.getElementById(`mobile-${activeBtnId}`);
    if (mobileBtn) mobileBtn.classList.add('active');
};

document.querySelectorAll('#dashboard-btn, #mobile-dashboard-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        dashboardView.style.display = 'block';
        userPanelView.style.display = 'none';
        setActiveNav('dashboard-btn');
        closeMobileMenu();
    });
});

document.querySelectorAll('#user-panel-btn, #mobile-user-panel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!currentUser) {
            showToast('გთხოვთ შეხვიდეთ სისტემაში თქვენი აუქციონების სანახავად.', 'error');
            return;
        }
        dashboardView.style.display = 'none';
        userPanelView.style.display = 'block';
        renderUserPanel();
        setActiveNav('user-panel-btn');
        closeMobileMenu();
    });
});

searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.toLowerCase();
    renderDashboard(activeAuctions);
});

// --- Live Auction Rendering & Logic ---
const renderAuctionCard = (auctionId, auctionData, container) => {
    let card = document.getElementById(`auction-card-${auctionId}`);
    const isMyAuction = auctionData.ownerId === currentUser?.uid;

    if (!card) {
        card = document.createElement('div');
        card.id = `auction-card-${auctionId}`;
        card.className = 'auction-card';
        container.appendChild(card);
    }

    const now = Date.now();
    const timeLeft = Math.max(0, (auctionData.endTime - now) / 1000);
    const isFinished = timeLeft <= 0;
    const highestBidderText = auctionData.highestBidder !== 'N/A' ? auctionData.highestBidder : 'ჯერ არ არის ფსონი';

    const bidFormHTML = `
        <form class="bid-form" data-auction-id="${auctionId}">
            <input type="number" name="bid-amount" min="${(auctionData.highestBid + 0.01).toFixed(2)}" step="0.01" placeholder="თქვენი ფსონი" required>
            <button type="submit" class="btn btn-primary">დამტება</button>
        </form>
    `;
    const endedHTML = `<p style="color: var(--sub-text-color);">აუქციონი დასრულდა. გამარჯვებული: <span style="color: var(--primary-color);">${highestBidderText}</span> ფსონით <span style="color: var(--accent-color);">$${auctionData.highestBid.toFixed(2)}</span></p>`;

    card.innerHTML = `
        <h3>${auctionData.title}</h3>
      <p class="description">${auctionData.description.replace(/\n/g, '<br>')}</p>

        <div class="info-line">
            <span>უმაღლესი ფსონი:</span>
            <span style="color: ${isMyAuction ? 'var(--secondary-color)' : 'var(--accent-color)'};">${auctionData.highestBid.toFixed(2)}</span>
        </div>
        <div class="info-line">
            <span>უმაღლესი ფსონის ავტორი:</span>
            <span>${highestBidderText}</span>
        </div>
        <div class="info-line">
            <span>დარჩენილი დრო:</span>
            <span class="countdown" id="countdown-${auctionId}">${formatTime(timeLeft)}</span>
        </div>
        ${isFinished ? endedHTML : (currentUser ? (isMyAuction ? '<p style="margin-top: 1rem; color: var(--sub-text-color);">თქვენ ვერ დადებთ ფსონს საკუთარ აუქციონზე.</p>' : bidFormHTML) : '<p style="margin-top: 1rem;">გთხოვთ შეხვიდეთ სისტემაში ფსონის დასადებად.</p>')}
    `;

    if (isMyAuction) {
        card.style.border = `2px solid var(--accent-color)`;
    } else {
        card.style.border = `1px solid var(--border-color)`;
    }

    if (currentUser && !isMyAuction && !isFinished) {
        const bidForm = card.querySelector('.bid-form');
        if (bidForm) {
            bidForm.addEventListener('submit', handleBidSubmit);
        }
    }

    const prevHighestBidder = lastKnownHighestBids[auctionId]?.highestBidder;
    if (currentUserData && auctionData.highestBidder !== 'N/A' && auctionData.highestBidderId !== currentUser.uid && prevHighestBidder === currentUserData.fullName) {
        showToast(`თქვენ გადმოგაჯობეს "${auctionData.title}"-ზე!`, 'info');
    }
    lastKnownHighestBids[auctionId] = { highestBid: auctionData.highestBid, highestBidder: auctionData.highestBidder };

};

const renderDashboard = (data) => {
    const query = currentSearchQuery.toLowerCase();
    auctionList.innerHTML = '';
    const activeAndSearchedAuctions = Object.entries(data).filter(([id, auction]) => {
        const now = Date.now();
        const titleMatch = auction.title.toLowerCase().includes(query);
        const descriptionMatch = auction.description.toLowerCase().includes(query);
        return (titleMatch || descriptionMatch) && auction.endTime > now;
    });

    if (activeAndSearchedAuctions.length === 0) {
        emptyDashboard.style.display = 'block';
    } else {
        emptyDashboard.style.display = 'none';
        activeAndSearchedAuctions.forEach(([id, auction]) => {
            renderAuctionCard(id, auction, auctionList);
        });
    }

};

const renderUserPanel = () => {
    const myAuctionsList = Object.entries(myAuctions);
    const myBidsList = Object.entries(myBids);

    myAuctionsContainer.innerHTML = '';
    myBidsContainer.innerHTML = '';

    if (myAuctionsList.length > 0 || myBidsList.length > 0) {
        document.getElementById('empty-user-panel').style.display = 'none';
    } else {
        document.getElementById('empty-user-panel').style.display = 'block';
        return;
    }

    if (myAuctionsList.length > 0) {
        const heading = document.createElement('h3');
        heading.textContent = 'ჩემი აუქციონები';
        myAuctionsContainer.appendChild(heading);

        const grid = document.createElement('div');
        grid.className = 'my-auctions-grid';
        myAuctionsList.forEach(([id, data]) => {
            const card = createUserPanelCard(id, data, 'owner');
            grid.appendChild(card);
        });
        myAuctionsContainer.appendChild(grid);
    }

    if (myBidsList.length > 0) {
        const heading = document.createElement('h3');
        heading.textContent = 'ჩემი ფსონები';
        myBidsContainer.appendChild(heading);

        const grid = document.createElement('div');
        grid.className = 'my-bids-grid';
        myBidsList.forEach(([id, data]) => {
            const card = createUserPanelCard(id, data, 'bidder');
            grid.appendChild(card);
        });
        myBidsContainer.appendChild(grid);
    }

};

const createUserPanelCard = (auctionId, auctionData, role) => {
    const card = document.createElement('div');
    card.className = 'user-panel-card';
    const now = Date.now();
    const timeLeft = Math.max(0, (auctionData.endTime - now) / 1000);
    const isFinished = timeLeft <= 0;
    const highestBidderText = auctionData.highestBidder || 'ჯერ არ არის ფსონი';
    const isHighestBidder = auctionData.highestBidderId === currentUser?.uid;

    let statusText = 'უცნობი';
    let statusColor = 'var(--sub-text-color)';

    if (role === 'owner') {
        statusText = isFinished ? 'აუქციონი დასრულდა' : 'აქტიური';
        statusColor = isFinished ? 'var(--secondary-color)' : 'var(--accent-color)';
    } else if (role === 'bidder') {
        if (isFinished) {
            statusText = isHighestBidder ? 'თქვენ გაიმარჯვეთ!' : 'წააგეთ';
            statusColor = isHighestBidder ? 'var(--success-color)' : 'var(--error-color)';
        } else {
            statusText = isHighestBidder ? 'თქვენ იმარჯვებთ' : 'თქვენ გადმოგაჯობეს';
            statusColor = isHighestBidder ? 'var(--success-color)' : 'var(--error-color)';
        }
    }

    let auctionDetails = `
        <h4>${auctionData.title}</h4>
        <div class="info-line">
            <span>მიმდინარე ფსონი:</span>
            <span>₾${auctionData.highestBid.toFixed(2)}</span>
        </div>
        <div class="info-line">
            <span>დარჩენილი დრო:</span>
            <span>${isFinished ? 'დასრულდა' : formatTime(timeLeft)}</span>
        </div>
        <div class="info-line">
            <span>სტატუსი:</span>
            <span class="status-indicator" style="color: ${statusColor};">${statusText}</span>
        </div>
    `;

    if (isFinished && auctionData.highestBidderId) {
        if (role === 'owner') {
            auctionDetails += `
                <div class="info-line" style="margin-top: 1rem;">
                    <span>გამარჯვებული:</span>
                    <span>${highestBidderText}</span>
                </div>
                <div class="info-line">
                    <span>საკონტაქტო ინფორმაცია:</span>
                    <a href="tel:${auctionData.highestBidderPhoneNumber}" target="_blank">${auctionData.highestBidderPhoneNumber}</a>
                </div>
            `;
        } else if (role === 'bidder' && isHighestBidder) {
            auctionDetails += `
                <div class="info-line" style="margin-top: 1rem;">
                    <span>გამყიდველის კონტაქტი:</span>
                    <span>${auctionData.ownerName}</span>
                </div>
                <div class="info-line">
                    <span>საკონტაქტო ინფორმაცია:</span>
                    <a href="tel:${auctionData.ownerPhoneNumber}" target="_blank">${auctionData.ownerPhoneNumber}</a>
                </div>
            `;
        }
    }

    if (role === 'owner' && isFinished) {
        auctionDetails += `
            <div class="actions">
                <button class="btn btn-secondary" data-auction-id="${auctionId}">წაშლა</button>
            </div>
        `;
    }

    card.innerHTML = auctionDetails;

    if (role === 'owner' && isFinished) {
        card.querySelector('.actions button').addEventListener('click', () => handleDeleteAuction(auctionId, auctionData.title));
    }

    return card;

};

const handleBidSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const auctionId = form.dataset.auctionId;
    const bidInput = form.querySelector('input[name="bid-amount"]');
    const newBidAmount = parseFloat(bidInput.value);
    const auctionRef = ref(db, `auctions/${auctionId}`);

    if (isNaN(newBidAmount) || newBidAmount <= 0) {
        showToast('გთხოვთ შეიყვანოთ სწორი ფსონი.', 'error');
        return;
    }

    try {
        let transactionSuccess = false;
        await runTransaction(auctionRef, (currentAuction) => {
            if (currentAuction && newBidAmount > currentAuction.highestBid) {
                currentAuction.highestBid = newBidAmount;
                currentAuction.highestBidder = `${currentUserData.firstName} ${currentUserData.lastName}`;
                currentAuction.highestBidderId = currentUser.uid;
                currentAuction.highestBidderPhoneNumber = currentUserData.phoneNumber;
                transactionSuccess = true;
            }
            return currentAuction;
        });
        if (transactionSuccess) {
            showToast('ფსონი წარმატებით დაიდო!', 'success');
        } else {
            showToast('თქვენი ფსონი უნდა იყოს უფრო მაღალი ვიდრე მიმდინარე ფასი.', 'error');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }

};

const handleDeleteAuction = async (auctionId, title) => {
    if (!confirm(`ნამდვილად გსურთ აუქციონის "${title}" წაშლა?`)) {
        return;
    }

    try {
        const auctionRef = ref(db, `auctions/${auctionId}`);
        await remove(auctionRef);
        showToast(`აუქციონი "${title}" წარმატებით წაიშალა.`, 'success');
    } catch (error) {
        showToast(`აუქციონის წაშლა ვერ მოხერხდა: ${error.message}`, 'error');
    }

};

// --- Realtime Database Listeners ---
let allAuctionsListener = null;
let myAuctionsListener = null;
let myBidsListener = null;

const setupDashboardListener = () => {
    if (allAuctionsListener) return;

    // შექმენით query, რომელიც დაალაგებს აუქციონებს createdAt ველის მიხედვით
    const auctionsRef = ref(db, 'auctions');
    const auctionsQuery = query(auctionsRef, orderByChild('createdAt'));

    allAuctionsListener = onValue(auctionsQuery, (snapshot) => {
        const data = snapshot.val() || {};
        
        // Firebase-ის query-ს კლებადობით დალაგების მეთოდი არ აქვს, ამიტომ
        // წამოღებული მონაცემები უნდა შემოვატრიალოთ (reverse).
        const sortedData = Object.entries(data).reverse().reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});

        activeAuctions = sortedData;
        
        renderDashboard(sortedData);

        searchInput.oninput = () => renderDashboard(sortedData);

        Object.values(countdowns).forEach(clearInterval);

        const activeAuctionEntries = Object.entries(sortedData).filter(([id, auction]) => auction.endTime > Date.now());
        if (activeAuctionEntries.length > 0) {
            activeAuctionEntries.forEach(([id, auction]) => {
                countdowns[id] = setInterval(() => {
                    const now = Date.now();
                    const timeLeft = Math.max(0, (auction.endTime - now) / 1000);
                    const countdownEl = document.getElementById(`countdown-${id}`);
                    if (countdownEl) {
                        countdownEl.textContent = formatTime(timeLeft);
                    }
                    if (timeLeft <= 0) {
                        clearInterval(countdowns[id]);
                        showToast(`აუქციონი "${auction.title}" დასრულდა!`, 'info');
                        renderDashboard(activeAuctions);
                    }
                }, 1000);
            });
        }
    });
};

const setupUserPanelListeners = (uid) => {
    const myAuctionsRef = query(ref(db, 'auctions'), orderByChild('ownerId'), equalTo(uid));
    const myBidsRef = query(ref(db, 'auctions'), orderByChild('highestBidderId'), equalTo(uid));

    myAuctionsListener = onValue(myAuctionsRef, (snapshot) => {
        myAuctions = snapshot.val() || {};
        if (userPanelView.style.display !== 'none') {
            renderUserPanel();
        }
    });

    myBidsListener = onValue(myBidsRef, (snapshot) => {
        myBids = snapshot.val() || {};
        if (userPanelView.style.display !== 'none') {
            renderUserPanel();
        }
    });

};

const teardownUserPanelListeners = () => {
    if (myAuctionsListener) {
        myAuctionsListener();
        myAuctionsListener = null;
    }
    if (myBidsListener) {
        myBidsListener();
        myBidsListener = null;
    }
    myAuctions = {};
    myBids = {};
    myAuctionsContainer.innerHTML = '';
    myBidsContainer.innerHTML = '';
    document.getElementById('empty-user-panel').style.display = 'block';
};

const fetchUserData = async (uid) => {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
        const data = snapshot.val();
        return {
            ...data,
            fullName: `${data.firstName} ${data.lastName}`
        };
    }
    return null;
};

// --- Auth State Change Listener ---
onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    const mainUserActions = document.getElementById('user-actions');
    const mainGuestActions = document.getElementById('guest-actions');
    const mobileUserActions = document.getElementById('mobile-user-actions');
    const mobileGuestActions = document.getElementById('mobile-guest-actions');

    if (user) {
        currentUserData = await fetchUserData(user.uid);
        userNameSpan.textContent = currentUserData?.fullName || user.email;
        mobileUserNameSpan.textContent = currentUserData?.fullName || user.email;

        mainGuestActions.style.display = 'none';
        mainUserActions.style.display = 'flex';

        mobileGuestActions.style.display = 'none';
        mobileUserActions.style.display = 'flex';

        hideModal(authModal);

        setupDashboardListener();
        setupUserPanelListeners(user.uid);

        setActiveNav('dashboard-btn');
    } else {
        userNameSpan.textContent = '';
        mobileUserNameSpan.textContent = '';
        currentUserData = null;

        mainGuestActions.style.display = 'flex';
        mainUserActions.style.display = 'none';

        mobileGuestActions.style.display = 'flex';
        mobileUserActions.style.display = 'none';

        auctionList.innerHTML = '';
        emptyDashboard.style.display = 'block';
        Object.values(countdowns).forEach(clearInterval);

        teardownUserPanelListeners();
        setActiveNav('dashboard-btn');
    }

});

// Initial listener setup
setupDashboardListener();
