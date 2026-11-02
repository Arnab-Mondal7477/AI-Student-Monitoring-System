const fs = require('fs');
const path = '/Users/arnab/Documents/AI-Student-Monitoring/portal/frontend/src/pages/student/Violations.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace potentially crashing code with safe alternatives
content = content.replace(
  /{v\.detection_type\.replace\('_', ' '\)}/g,
  "{v.detection_type ? v.detection_type.replace('_', ' ') : 'Unknown Violation'}"
);

content = content.replace(
  /new Date\(v\.timestamp\)\.toLocaleString\(\)/g,
  "v.timestamp ? new Date(v.timestamp).toLocaleString() : 'Unknown Date'"
);

fs.writeFileSync(path, content);
console.log("Fixed StudentViolations.jsx");
