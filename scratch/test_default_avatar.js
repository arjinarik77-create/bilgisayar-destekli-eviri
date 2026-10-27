const DEFAULT_USER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' rx='28' fill='%23F1F5F9'/%3E%3Ccircle cx='64' cy='46' r='22' fill='%2394A3B8'/%3E%3Cpath d='M26 106c0-22 17-36 38-36s38 14 38 36' fill='%2394A3B8'/%3E%3C/svg%3E";

console.log("DEFAULT_USER_AVATAR length:", DEFAULT_USER_AVATAR.length);
console.log("Preview SVG string:", decodeURIComponent(DEFAULT_USER_AVATAR.replace("data:image/svg+xml,", "")));
