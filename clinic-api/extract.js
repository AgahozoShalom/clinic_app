const fs = require('fs');
const content = fs.readFileSync('../clinic_api_prompt.md', 'utf8');
const match = content.match(/```sql\n([\s\S]*?)\n```/);
if (match) {
  fs.mkdirSync('db', { recursive: true });
  fs.writeFileSync('db/schema.sql', match[1]);
}
