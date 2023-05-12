cd /home/ubuntu/chatGPT-PDF-QA
git pull
yarn install
yarn build
#yarn ingest
pm2 restart nextjs

pm2 startup
pm2 save