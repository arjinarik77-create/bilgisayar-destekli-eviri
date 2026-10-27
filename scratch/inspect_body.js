const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const bodyIdx = content.indexOf('</body>');
console.log("Context around </body> at", bodyIdx, ":");
console.log(content.substring(bodyIdx - 200, bodyIdx + 400));

const lastBodyIdx = content.lastIndexOf('</body>');
console.log("Last </body> at", lastBodyIdx);

const lastHtmlIdx = content.lastIndexOf('</html>');
console.log("Last </html> at", lastHtmlIdx);
