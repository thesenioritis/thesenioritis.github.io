#! /bin/bash
# Save and upload to git
npm install
npm run build
git add .
git commit -m "$(date)"
git push origin master
