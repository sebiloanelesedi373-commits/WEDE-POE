/* ==========================================================
   KiddiesTime — shared script (loaded on every page)
   1 Settings and data   2 Helpers          3 Form validation
   4 Footer year + scroll animation         5 Services search/filter/sort
   6 Enquiry form (validation, AJAX, response)
   7 Contact form (validation, email draft)
   ========================================================== */
"use strict";

/* ---------- 1. SETTINGS AND DATA ---------- */
const SITE = {
    recipientEmail: "info@kiddiestime.co.za", // CHANGE THIS to the address that should receive messages
    phone: "+27 83 318 0628"
};

const SERVICES = [
    { 
        name: "Early Education", 
        category: "Education", 
        description: "Teaching letters, numbers, and colours through fun games. A premium early learning school that utilizes structured developmental stages to foster cognitive, emotional, and social development. Their curriculum emphasizes school readiness and confidence building under the motto of building future leaders with love, play, and purpose." 
    },
    { 
        name: "Social Growth", 
        category: "Social", 
        description: "Helping children share, make friends and listen to their elders. At KiddiesTime, we believe that the earliest friendships shape the brightest futures. Our dedicated space is designed to help your child build essential social skills, emotional confidence, and lasting connections through structured play and guided group activities." 
    },
    { 
        name: "Daily Care", 
        category: "Care", 
        description: "Providing a safe place for kids while parents work. At KiddiesTime, every day is a new opportunity for your child to grow, laugh, and discover. We provide a safe, nurturing, and joyful environment where early learning feels like play." 
    },
    { 
        name: "Healthy Meals", 
        category: "Meals", 
        description: "Serving nutritious snacks and lunches during the day. We believe that healthy food drives happy learning. Every day, our in-house chef prepares fresh, balanced meals that kids love and parents trust." 
    },
    { 
        name: "Physical Play", 
        category: "Play", 
        description: "Running, climbing, and building motor skills outside. Active Bodies, Bright Minds! 🏃‍♂️✨ At our daycare, we believe that moving is learning. Physical play isn't just about burning energy—it is how children explore, build confidence, and grow strong." 
    }
];

// Category names for the dropdown (shown in this order)
const CATEGORIES = ["Education", "Social", "Care", "Meals", "Play"];

// SAMPLE DATA: replace the fees, spaces and amounts with your real ones
const ENQUIRY_DATA = {
    hours: "Monday to Friday, 06:30 – 17:30",
    ageGroups: {
        age2to3: { label: "2–3 years", fee: 2800, spaces: 4 },
        age4to5: { label: "4–5 years", fee: 2400, spaces: 6 },
        age6:    { label: "6 years",   fee: 2200, spaces: 2 }
    },
    sponsorLevels: {
        bronze: { label: "Bronze", amount: 500,  covers: "healthy meals for one child for a month" },
        silver: { label: "Silver", amount: 1000, covers: "learning materials for a classroom for a term" },
        gold:   { label: "Gold",   amount: 2500, covers: "new outdoor play equipment" }
    },
    volunteerSlots: 3
};

/* ---------- 2. HELPERS ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function isoDate(d) {
    const z = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

function formatDate(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

const rand = (n) => "R" + n.toLocaleString("en-ZA");

function fillSelect(select, items, labelFn) {
    Object.entries(items).forEach(([key, item]) => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = labelFn(item);
        select.appendChild(option);
    });
}

/* ---------- 3. FORM VALIDATION ---------- */
// Each rule returns an error message, or "" when the value is fine.
const RULES = {
    name(v) {
        if (!v) return "Please enter your name.";
        if (v.length < 2) return "Your name must be at least 2 characters.";
        if (v.length > 60) return "Your name must be 60 characters or fewer.";
        if (!/^[\p{L}'’\- ]+$/u.test(v)) return "Names can only contain letters, spaces, hyphens and apostrophes.";
        return "";
    },
    email(v) {
        if (!v) return "Please enter your email address.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address, e.g. name@example.com.";
        return "";
    },
    phone(v) { // optional, but must be valid if filled in
        if (!v) return "";
        const clean = v.replace(/[\s()-]/g, "");
        if (!/^(\+27|0)[1-9]\d{8}$/.test(clean)) return "Enter a valid South African number, e.g. 083 318 0628 or +27 83 318 0628.";
        return "";
    },
    select(v) {
        return v ? "" : "Please choose an option from the list.";
    },
    date(v) {
        if (!v) return "Please choose a start date.";
        const max = new Date();
        max.setFullYear(max.getFullYear() + 1);
        if (v < isoDate(new Date())) return "The start date can't be in the past.";
        if (v > isoDate(max)) return "Please choose a date within the next 12 months.";
        return "";
    },
    subject(v) {
        if (!v) return "Please enter a subject.";
        if (v.length < 3) return "The subject must be at least 3 characters.";
        if (v.length > 100) return "The subject must be 100 characters or fewer.";
        return "";
    },
    message(v) {
        if (!v) return "Please type a message.";
        if (v.length < 10) return `Your message is too short. Please write at least 10 characters (now ${v.length}).`;
        if (v.length > 500) return "Please keep your message to 500 characters or fewer.";
        return "";
    }
};

function showError(field, message) {
    const group = field.closest(".form-group");
    let box = group.querySelector(".error-msg");
    if (message) {
        if (!box) {
            box = document.createElement("p");
            box.className = "error-msg";
            box.id = `${field.id}-error`;
            group.appendChild(box);
        }
        box.textContent = message;
        field.classList.add("invalid");
        field.classList.remove("valid");
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", box.id);
    } else {
        if (box) box.remove();
        field.classList.remove("invalid");
        field.classList.toggle("valid", field.value.trim() !== "");
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
    }
}

function validateField(field) {
    if (field.disabled || field.closest("[hidden]")) return true;
    const rule = RULES[field.dataset.validate];
    const message = rule ? rule(field.value.trim()) : "";
    showError(field, message);
    return message === "";
}

function validateForm(form) {
    let firstInvalid = null;
    $$("[data-validate]", form).forEach((field) => {
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
}

function liveValidate(form) {
    form.addEventListener("focusout", (e) => {
        if (e.target.matches("[data-validate]")) validateField(e.target);
    });
    ["input", "change"].forEach((type) => {
        form.addEventListener(type, (e) => {
            if (e.target.matches("[data-validate]") && e.target.classList.contains("invalid")) validateField(e.target);
        });
    });
}

function clearValidation(form) {
    $$(".error-msg", form).forEach((el) => el.remove());
    $$("[data-validate]", form).forEach((f) => {
        f.classList.remove("invalid", "valid");
        f.removeAttribute("aria-invalid");
        f.removeAttribute("aria-describedby");
    });
}

function addCharCounters(form) {
    $$("textarea[maxlength]", form).forEach((area) => {
        const counter = document.createElement("p");
        counter.className = "char-count";
        counter.setAttribute("aria-hidden", "true");
        area.insertAdjacentElement("afterend", counter);
        const update = () => { counter.textContent = `${area.value.length} / ${area.maxLength}`; };
        area.addEventListener("input", update);
        form.addEventListener("reset", () => setTimeout(update));
        update();
    });
}

/* ---------- 4. FOOTER YEAR + SCROLL ANIMATION ---------- */
function initYear() {
    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();
}

function initReveal() {
    const items = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
        items.forEach((el) => el.classList.add("visible"));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    items.forEach((el) => observer.observe(el));
}

/* ---------- 5. SERVICES: DYNAMIC CONTENT + SEARCH/FILTER/SORT ---------- */
function initServices() {
    const grid = $("#services-grid");
    if (!grid) return;
    const search = $("#service-search");
    const category = $("#service-category");
    const sort = $("#service-sort");
    const count = $("#results-count");
    const none = $("#no-results");

    [...new Set([...CATEGORIES, ...SERVICES.map((s) => s.category)])].forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        category.appendChild(option);
    });

    function render() {
        const query = search.value.trim().toLowerCase();
        const list = SERVICES.filter((s) =>
            (category.value === "all" || s.category === category.value) &&
            `${s.name} ${s.description} ${s.category}`.toLowerCase().includes(query)
        );

        if (sort.value === "az") list.sort((a, b) => a.name.localeCompare(b.name));
        if (sort.value === "za") list.sort((a, b) => b.name.localeCompare(a.name));
        if (sort.value === "category") list.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

        grid.innerHTML = list.map((s) => `
            <div class="service-card">
                <h3>${escapeHTML(s.name)}</h3>
                <p>${escapeHTML(s.description)}</p>
                <span class="service-tag">${escapeHTML(s.category)}</span>
            </div>`).join("");
        count.textContent = `Showing ${list.length} of ${SERVICES.length} services`;
        none.hidden = list.length > 0;
    }

    [search, category, sort].forEach((el) => el.addEventListener("input", render));
    $("#reset-filters").addEventListener("click", () => {
        search.value = "";
        category.value = "all";
        sort.value = "default";
        render();
        search.focus();
    });
    render();
}

/* ---------- 6. ENQUIRY FORM ---------- */
async function postForm(form) {
    // AJAX submission: sends the data without reloading the page.
    // Works on Netlify (Netlify Forms) because of the data-netlify attribute in the form.
    const body = new URLSearchParams(new FormData(form)).toString();
    const response = await fetch(form.getAttribute("action") || "/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
    });
    if (!response.ok) throw new Error(`Server responded with ${response.status}`);
}

function buildEnquiryReply(d) {
    const D = ENQUIRY_DATA;
    switch (d["enquiry-type"]) {
        case "enrol": {
            const a = D.ageGroups[d["child-age"]];
            const open = a.spaces > 0;
            return {
                title: "Enrolment enquiry",
                intro: open
                    ? `Good news, we have space in the ${a.label} age group.`
                    : `The ${a.label} age group is full right now, but we will add your child to the waiting list.`,
                rows: [
                    ["Age group", a.label],
                    ["Monthly fee", rand(a.fee)],
                    ["Availability", open ? `${a.spaces} space${a.spaces === 1 ? "" : "s"} available` : "Waiting list"],
                    ["Preferred start date", formatDate(d["start-date"])],
                    ["Opening hours", D.hours]
                ]
            };
        }
        case "sponsor": {
            const s = D.sponsorLevels[d["sponsor-level"]];
            return {
                title: "Sponsorship enquiry",
                intro: `Thank you for wanting to support our children! A ${s.label} sponsorship pays for ${s.covers}.`,
                rows: [
                    ["Sponsorship level", s.label],
                    ["Contribution", rand(s.amount)],
                    ["Next step", "We will email our banking details and a receipt"]
                ]
            };
        }
        case "volunteer":
            return {
                title: "Volunteer enquiry",
                intro: "Thank you for offering your time. Volunteers make a big difference here.",
                rows: [
                    ["Availability", `${D.volunteerSlots} volunteer spots open on weekday mornings`],
                    ["Next step", "A short visit and a background check (required for everyone working with children)"]
                ]
            };
        case "partnership":
            return {
                title: "Partnership enquiry",
                intro: "Thank you for your interest in partnering with KiddiesTime.",
                rows: [["Next step", "Our Head Teacher will review your message and reply within 24 hours"]]
            };
        default:
            return {
                title: "General enquiry",
                intro: "Thank you for getting in touch.",
                rows: [["Next step", "We will reply within 24 hours"]]
            };
    }
}

function initEnquiry() {
    const form = $("#enquiry-form");
    if (!form) return;
    const type = $("#enquiry-type");
    const enrolBox = $("#enrol-fields");
    const sponsorBox = $("#sponsor-fields");
    const start = $("#start-date");
    const output = $("#enquiry-response");

    fillSelect($("#child-age"), ENQUIRY_DATA.ageGroups, (a) => a.label);
    fillSelect($("#sponsor-level"), ENQUIRY_DATA.sponsorLevels, (s) => `${s.label} – ${rand(s.amount)}`);

    const today = new Date();
    const limit = new Date();
    limit.setFullYear(limit.getFullYear() + 1);
    start.min = isoDate(today);
    start.max = isoDate(limit);

    function toggleExtraFields() {
        enrolBox.hidden = type.value !== "enrol";
        sponsorBox.hidden = type.value !== "sponsor";
        $$("select, input", enrolBox).forEach((el) => { el.disabled = enrolBox.hidden; });
        $$("select, input", sponsorBox).forEach((el) => { el.disabled = sponsorBox.hidden; });
    }
    type.addEventListener("change", toggleExtraFields);
    toggleExtraFields();

    addCharCounters(form);
    liveValidate(form);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!validateForm(form)) return;

        const data = Object.fromEntries(new FormData(form));
        if (data["bot-field"]) return; // spam trap: real people never fill this in

        const button = $("button[type=submit]", form);
        const label = button.textContent;
        button.disabled = true;
        button.textContent = "Sending…";

        let sent = true;
        try { await postForm(form); } catch (err) { sent = false; }

        button.disabled = false;
        button.textContent = label;

        const reply = buildEnquiryReply(data);
        const ref = "KT-" + Math.random().toString(36).slice(2, 8).toUpperCase();
        const firstName = escapeHTML(data.fullname.trim().split(/\s+/)[0]);

        output.innerHTML = `
            <div class="response-card" tabindex="-1">
                <h3>Thank you, ${firstName}!</h3>
                <p class="form-status ${sent ? "success" : "warning"}">${sent
                    ? "Your enquiry has been sent to our team."
                    : `We couldn't send your enquiry online right now. Please call ${escapeHTML(SITE.phone)} or use our Contact page.`}</p>
                <h4>${escapeHTML(reply.title)}</h4>
                <p>${escapeHTML(reply.intro)}</p>
                <dl>${reply.rows.map(([k, v]) => `<dt>${escapeHTML(k)}</dt><dd>${escapeHTML(v)}</dd>`).join("")}</dl>
                <p>Reference number: <strong>${ref}</strong></p>
                <div class="btn-row"><button type="button" class="btn-secondary" id="new-enquiry">Send another enquiry</button></div>
            </div>`;
        form.hidden = true;
        const card = $(".response-card", output);
        card.focus();
        card.scrollIntoView({ behavior: "smooth", block: "start" });

        $("#new-enquiry").addEventListener("click", () => {
            form.reset();
            clearValidation(form);
            toggleExtraFields();
            output.innerHTML = "";
            form.hidden = false;
            $("#fullname").focus();
        });
    });
}

/* ---------- 7. CONTACT FORM: VALIDATE, THEN COMPILE AN EMAIL ---------- */
function initContact() {
    const form = $("#contact-form");
    if (!form) return;
    const draft = $("#email-draft");

    addCharCounters(form);
    liveValidate(form);

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!validateForm(form)) return;

        const d = Object.fromEntries(new FormData(form));
        const subject = `[${d["message-type"]}] ${d.subject.trim()}`;
        const bodyText = [
            "Hello KiddiesTime team,",
            "",
            d.message.trim(),
            "",
            "--- My details ---",
            `Name: ${d.name.trim()}`,
            `Email: ${d.email.trim()}`,
            `Phone: ${d.phone.trim() || "Not provided"}`,
            `Message type: ${d["message-type"]}`
        ].join("\r\n");

        const mailto = `mailto:${SITE.recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

        draft.innerHTML = `
            <div class="response-card" tabindex="-1">
                <h3>Your email is ready</h3>
                <p>Check the message below, then press <strong>Open in my email app</strong> to send it.</p>
                <dl>
                    <dt>To</dt><dd>${escapeHTML(SITE.recipientEmail)}</dd>
                    <dt>Subject</dt><dd>${escapeHTML(subject)}</dd>
                </dl>
                <pre class="email-preview">${escapeHTML(bodyText)}</pre>
                <div class="btn-row">
                    <a class="btn-submit btn-link" href="${escapeHTML(mailto)}">✉️ Open in my email app</a>
                    <button type="button" class="btn-secondary" id="edit-message">Edit message</button>
                </div>
            </div>`;
        form.hidden = true;
        draft.hidden = false;
        const card = $(".response-card", draft);
        card.focus();
        card.scrollIntoView({ behavior: "smooth", block: "start" });

        $("#edit-message").addEventListener("click", () => {
            draft.hidden = true;
            draft.innerHTML = "";
            form.hidden = false;
            $("#contact-name").focus();
        });
    });
}

/* ---------- START EVERYTHING ---------- */
document.addEventListener("DOMContentLoaded", () => {
    initYear();
    initReveal();
    initServices();
    initEnquiry();
    initContact();
});
