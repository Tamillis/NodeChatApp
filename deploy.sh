cd ~/TrinitasApi

git fetch origin main

if ! git diff --quiet HEAD origin/main -- package.json; then
    echo "Changes detected in package.json. Running npm install..."
    git pull origin main
    npm install --production
else
    echo "No changes in package.json. Skipping npm install."
    git pull origin main
fi

pm2 reload trinitas-api --update-env