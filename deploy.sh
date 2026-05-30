if [ ! -d ~/NodeChatApp ]; then
  git clone https://github.com/Tamillis/NodeChatApp.git ~/NodeChatApp
fi

cd ~/NodeChatApp

git fetch origin main
git reset --hard origin/main

cd ~/NodeChatApp/NodeChatClient
npm install
npm run build

rm -rf /var/www/chat-site/assets/*
rm -f  /var/www/chat-site/index.html
cp -r dist/* /var/www/chat-site/

cd ~/NodeChatApp/NodeChatServer

if pm2 describe ncs-ws > /dev/null 2>&1; then
  pm2 reload ncs-ws --update-env
else
  PORT=3005 pm2 start ~/NodeChatApp/NodeChatServer/ncsMain.js --name ncs-ws
  pm2 save
fi