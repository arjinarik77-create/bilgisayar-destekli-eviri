const fs = require('fs');

// Check test files or autosave to see how segments are saved
if (fs.existsSync('cat_workspace_autosave.json')) {
    const raw = fs.readFileSync('cat_workspace_autosave.json', 'utf8');
    const data = JSON.parse(raw);
    console.log("Autosave projects count:", data.projects ? data.projects.length : 0);
    if (data.projects && data.projects.length > 0) {
        data.projects.forEach(p => {
            if (p.docs) {
                p.docs.forEach(d => {
                    console.log(`Doc: ${d.name}, hasOriginalDocx: ${d.hasOriginalDocx}, segments count: ${d.segments ? d.segments.length : 0}`);
                    if (d.segments && d.segments.length > 0) {
                        d.segments.slice(0, 5).forEach((s, i) => {
                            console.log(`  Seg #${i+1}: paraId=${s.paraId}, docx=${JSON.stringify(s.docx)}, styleMemory=${JSON.stringify(s.styleMemory)}, fmt=${JSON.stringify(s.fmt)}`);
                        });
                    }
                });
            }
        });
    }
}
