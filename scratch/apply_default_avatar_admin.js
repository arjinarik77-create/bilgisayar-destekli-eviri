const fs = require('fs');

console.log("Applying Instagram-style default avatar in admin.html...");

let html = fs.readFileSync('admin.html', 'utf8');

const avatarConstants = `
        // STANDART INSTAGRAM / SOSYAL MEDYA VARSAYILAN KULLANICI PROFİL RESMİ (SVG SİLUET)
        const DEFAULT_USER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' rx='28' fill='%23F1F5F9'/%3E%3Ccircle cx='64' cy='46' r='22' fill='%2394A3B8'/%3E%3Cpath d='M26 106c0-22 17-36 38-36s38 14 38 36' fill='%2394A3B8'/%3E%3C/svg%3E";

        function getUserAvatar(avatarUrl) {
            if (avatarUrl && typeof avatarUrl === 'string' && !avatarUrl.includes('unsplash.com') && avatarUrl.trim() !== '') {
                return avatarUrl;
            }
            return DEFAULT_USER_AVATAR;
        }
`;

// Insert avatarConstants before function addTranslatorToData
if (!html.includes('const DEFAULT_USER_AVATAR =')) {
    html = html.replace('function addTranslatorToData(p) {', `${avatarConstants}\n        function addTranslatorToData(p) {`);
    console.log("Added DEFAULT_USER_AVATAR and getUserAvatar function.");
}

// 1. In addTranslatorToData
html = html.replace(
    /avatar:\s*\(p\.metadata\s*&&\s*p\.metadata\.avatar\)\s*\|\|\s*'https:\/\/images\.unsplash\.com[^']*'/g,
    'avatar: getUserAvatar(p.metadata && p.metadata.avatar)'
);

// 2. In renderTranslatorsTable
html = html.replace(
    /<img\s+src="\$\{t\.avatar\s*\|\|\s*'https:\/\/images\.unsplash\.com[^']*'\}"([^>]*)>/g,
    '<img src="${getUserAvatar(t.avatar)}" alt="${t.name}"$1>'
);

// 3. In agency modal
html = html.replace(
    /<img\s+src="\$\{t\.avatar\}"\s+class="w-10 h-10 rounded-xl object-cover border border-slate-200">/g,
    '<img src="${getUserAvatar(t.avatar)}" alt="${t.name}" class="w-10 h-10 rounded-xl object-cover border border-slate-200/80 bg-slate-100">'
);

// 4. In openDirectChat
html = html.replace(
    /if\s*\(avatarEl\)\s*avatarEl\.src\s*=\s*t\.avatar;/g,
    'if (avatarEl) avatarEl.src = getUserAvatar(t.avatar);'
);

// 5. In openSupportChat or ticket mock
html = html.replace(
    /avatar:\s*'https:\/\/images\.unsplash\.com[^']*'/g,
    'avatar: DEFAULT_USER_AVATAR'
);

// Replace any remaining unsplash links in admin.html with DEFAULT_USER_AVATAR
const remainingUnsplash = (html.match(/https:\/\/images\.unsplash\.com[^\s"']+/g) || []).length;
console.log("Remaining unsplash links:", remainingUnsplash);
if (remainingUnsplash > 0) {
    html = html.replace(/https:\/\/images\.unsplash\.com[^\s"']+/g, DEFAULT_USER_AVATAR);
    console.log("Replaced all remaining unsplash links with DEFAULT_USER_AVATAR");
}

fs.writeFileSync('admin.html', html, 'utf8');
console.log("admin.html updated successfully!");
