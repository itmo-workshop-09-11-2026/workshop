"use strict";

const cart = [];
const products = document.querySelector("#products");
const cards = Array.from(products.querySelectorAll(".product-card"));
const cartElement = document.querySelector("#cart");
const totalElement = document.querySelector("#total");
const search = document.querySelector("#book-search");
const sort = document.querySelector("#book-sort");
const filters = document.querySelector(".category-filters");
let selectedCategory = "all";
const currency = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
const iconPaths = {
    book: '<path d="M12 6c-3-2-6-2-9-1v15c3-1 6-1 9 1m0-15c3-2 6-2 9-1v15c-3-1-6-1-9 1V6Z"/>',
    bag: '<path d="M5 7h14l1 14H4L5 7Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    check: '<path d="m5 12 4 4L19 6"/>'
};

// SVG-шаблоны постоянные; пользовательские названия выводим только как текст.
function icon(name) {
    const span = document.createElement("span");
    span.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${iconPaths[name]}</svg>`;
    return span.firstElementChild;
}

function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

let noticeTimer;
function notify(message) {
    const status = document.querySelector("#shop-status");
    clearTimeout(noticeTimer);
    status.textContent = message;
    status.hidden = false;
    noticeTimer = setTimeout(() => { status.hidden = true; }, 2400);
}

function actionButton(action, book, label, iconName, className) {
    const button = node("button", className);
    button.type = "button";
    button.dataset.action = action;
    button.dataset.productId = book.id;
    button.setAttribute("aria-label", `${label} «${book.name}»`);
    button.title = label;
    button.append(icon(iconName));
    return button;
}

function bookWord(count) {
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 14) return "книг";
    return count % 10 === 1 ? "книга" : count % 10 >= 2 && count % 10 <= 4 ? "книги" : "книг";
}

function renderCart() {
    cartElement.replaceChildren();
    if (!cart.length) {
        const empty = node("li", "cart-empty");
        const art = node("span", "empty-art");
        art.append(icon("bag"));
        empty.append(art, node("strong", "", "Здесь начнётся новая история"), node("p", "", "Добавьте книгу с полки — и она появится здесь."));
        cartElement.append(empty);
    }
    for (const book of cart) {
        const item = node("li", "cart-item");
        const mini = node("span", "cart-mini");
        mini.dataset.id = book.id;
        mini.setAttribute("aria-hidden", "true");
        mini.append(icon("book"));
        const description = node("div", "cart-description");
        description.append(node("span", "cart-name", book.name), node("span", "cart-unit", `${currency.format(book.price)} за экземпляр`));
        const quantity = node("div", "quantity-control");
        const count = node("output", "", book.quantity);
        count.setAttribute("aria-label", `Количество «${book.name}»`);
        quantity.append(actionButton("decrease", book, "Уменьшить количество", "minus", ""), count, actionButton("increase", book, "Увеличить количество", "plus", ""));
        item.append(mini, description, quantity, node("strong", "cart-subtotal", currency.format(book.price * book.quantity)), actionButton("remove", book, "Удалить", "trash", "remove-from-cart"));
        cartElement.append(item);
    }
    const count = cart.reduce((sum, book) => sum + book.quantity, 0);
    totalElement.textContent = currency.format(cart.reduce((sum, book) => sum + book.price * book.quantity, 0));
    document.querySelector("#cart-count").textContent = count;
    document.querySelector("#cart-summary").textContent = count ? `${count} ${bookWord(count)} на вашей полке` : "Ваша следующая история — здесь";
    document.querySelector("#clear-cart").disabled = !cart.length;
    for (const card of cards) {
        const book = cart.find((item) => item.id === card.dataset.productId);
        const button = card.querySelector(".add-to-cart");
        button.classList.toggle("has-items", Boolean(book));
        button.replaceChildren(icon(book ? "check" : "plus"), node("span", "", book ? `В корзине · ${book.quantity}` : "В корзину"));
    }
}

products.addEventListener("click", (event) => {
    const button = event.target.closest(".add-to-cart");
    if (!button || !products.contains(button)) return;
    const element = button.closest("[data-product-id]");
    if (!element) return;
    const book = { id: element.dataset.productId, name: element.dataset.name, price: Number(element.dataset.price) };
    if (!book.id || !book.name || !Number.isFinite(book.price) || book.price < 0) return;
    const existingBook = cart.find((item) => item.id === book.id);
    if (existingBook) existingBook.quantity += 1;
    else cart.push({ ...book, quantity: 1 });
    renderCart();
    notify(`«${book.name}» — добавлено на вашу полку`);
});

cartElement.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || !cartElement.contains(button)) return;
    const index = cart.findIndex((book) => book.id === button.dataset.productId);
    if (index < 0) return;
    const book = cart[index];
    const action = button.dataset.action;
    if (action === "increase") book.quantity += 1;
    else if (action === "decrease" && book.quantity > 1) book.quantity -= 1;
    else if (action === "remove" || action === "decrease") cart.splice(index, 1);
    else return;
    renderCart();
    const replacement = Array.from(cartElement.querySelectorAll("button")).find((item) => item.dataset.productId === book.id && item.dataset.action === action);
    const fallback = cartElement.querySelector("button") || document.querySelector(".add-to-cart");
    (replacement || fallback)?.focus({ preventScroll: true });
    notify(action === "remove" || !cart.includes(book) ? `«${book.name}» — удалено из корзины` : `«${book.name}»: ${book.quantity} шт.`);
});

document.querySelector("#clear-cart").addEventListener("click", () => {
    cart.length = 0;
    renderCart();
    document.querySelector(".add-to-cart")?.focus({ preventScroll: true });
    notify("Корзина очищена. Можно начать новую историю.");
});

function renderCatalog() {
    const query = search.value.trim().toLocaleLowerCase("ru");
    const ordered = [...cards];
    if (sort.value === "price-asc") ordered.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
    if (sort.value === "price-desc") ordered.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
    if (sort.value === "name") ordered.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name, "ru"));
    let count = 0;
    for (const card of ordered) {
        const author = card.querySelector(".cover-kicker").textContent;
        const category = card.querySelector(".product-category").textContent.trim();
        const matches = `${card.dataset.name} ${author}`.toLocaleLowerCase("ru").includes(query) && (selectedCategory === "all" || selectedCategory === category);
        card.hidden = !matches;
        if (matches) count += 1;
        products.append(card);
    }
    document.querySelector("#results-count").textContent = `${count} ${bookWord(count)}`;
    document.querySelector("#no-results").hidden = count !== 0;
}
search.addEventListener("input", renderCatalog);
sort.addEventListener("change", renderCatalog);
filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    selectedCategory = button.dataset.filter;
    for (const item of filters.querySelectorAll("button")) item.setAttribute("aria-pressed", String(item === button));
    renderCatalog();
});
document.querySelector("#reset-search").addEventListener("click", () => {
    search.value = "";
    sort.value = "default";
    selectedCategory = "all";
    for (const button of filters.querySelectorAll("button")) button.setAttribute("aria-pressed", String(button.dataset.filter === "all"));
    renderCatalog();
    search.focus();
});

renderCart();
renderCatalog();
