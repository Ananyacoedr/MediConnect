const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'Frontend', 'src', 'components', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

const replacements = [
  ['bg-white', 'dark:bg-gray-900'],
  ['bg-gray-50', 'dark:bg-gray-950'],
  ['bg-gray-100', 'dark:bg-gray-800'],
  ['border-gray-200', 'dark:border-gray-800'],
  ['border-gray-100', 'dark:border-gray-800'],
  ['text-gray-900', 'dark:text-gray-100'],
  ['text-gray-800', 'dark:text-gray-200'],
  ['text-gray-700', 'dark:text-gray-300'],
  ['text-gray-600', 'dark:text-gray-400'],
  ['text-gray-500', 'dark:text-gray-400'],
  ['text-gray-400', 'dark:text-gray-500'],
  ['bg-blue-50', 'dark:bg-blue-900/30'],
  ['bg-green-50', 'dark:bg-green-900/30'],
  ['bg-indigo-50', 'dark:bg-indigo-900/30'],
  ['bg-purple-50', 'dark:bg-purple-900/30'],
  ['bg-orange-50', 'dark:bg-orange-900/30'],
  ['bg-pink-50', 'dark:bg-pink-900/30'],
  ['bg-teal-50', 'dark:bg-teal-900/30'],
  ['bg-yellow-50', 'dark:bg-yellow-900/30'],
  ['bg-red-50', 'dark:bg-red-900/30'],
  ['text-blue-600', 'dark:text-blue-400'],
  ['text-green-600', 'dark:text-green-400'],
  ['text-yellow-600', 'dark:text-yellow-400'],
  ['text-red-600', 'dark:text-red-400'],
  ['text-purple-600', 'dark:text-purple-400']
];

for (const f of files) {
  // skip already heavily patched files just to be safe
  if (['PatientDashboard.jsx', 'DoctorDashboard.jsx', 'Chat.jsx'].includes(f)) continue;

  const targetFile = path.join(pagesDir, f);
  let content = fs.readFileSync(targetFile, 'utf8');
  let original = content;
  let replacedCount = 0;

  for (const [key, value] of replacements) {
      if (content.includes(value)) continue; // skip if we already patched this file partially
      const regex = new RegExp(`(?<=[\\s"'\\\`])(${key})(?=[\\s"'\\\`])`, 'g');
      content = content.replace(regex, (match) => {
          replacedCount++;
          return `${key} ${value}`;
      });
  }

  content = content.replace(/(?<=[\s"'\`])(border-b)(?=[\s"'\`])/g, (match) => {
      replacedCount++;
      return `border-b dark:border-gray-800`;
  });

  if (content !== original) {
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log(`Patched ${f}: ${replacedCount} additions.`);
  }
}
