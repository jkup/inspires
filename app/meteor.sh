#!/bin/bash

username=$2
appname=$3

# IP or URL of the server you want to deploy to
APP_HOST=inspires.io

# Uncomment this if your host is an EC2 instance
# EC2_PEM_FILE=path/to/your/file.pem

# You usually don't need to change anything below this line

APP_NAME=$appname
ROOT_URL=http://$APP_HOST
PORT=80
APP_DIR=/var/www/$APP_NAME
MONGO_URL=mongodb://localhost:27017/$APP_NAME
if [ -z "$EC2_PEM_FILE" ]; then
    SSH_HOST="$username@$APP_HOST" SSH_OPT=""
  else
    SSH_HOST="ubuntu@$APP_HOST" SSH_OPT="-i $EC2_PEM_FILE"
fi
if [ -d ".meteor/meteorite" ]; then
    METEOR_CMD=mrt
  else
    METEOR_CMD=meteor
fi

case "$1" in
setup )
echo Preparing the server...
echo Get some coffee, this will take a while.
ssh $SSH_OPT $SSH_HOST DEBIAN_FRONTEND=noninteractive 'sudo -E bash -s' > /dev/null 2>&1 <<'ENDSSH'
apt-get update
apt-get install -y python-software-properties
add-apt-repository ppa:chris-lea/node.js
apt-get update
apt-get install -y build-essential nodejs mongodb
npm install -g forever
ENDSSH
echo Done. You can now deploy your app.
;;
deploy )
echo Deploying...
$METEOR_CMD bundle bundle.tgz > /dev/null 2>&1 &&
scp $SSH_OPT bundle.tgz $SSH_HOST:/tmp/ > /dev/null 2>&1 &&
rm bundle.tgz > /dev/null 2>&1 &&
echo "if [ ! -d "$APP_DIR" ]; then
sudo mkdir -p $APP_DIR
sudo chown -R www-data:www-data $APP_DIR
fi
pushd $APP_DIR
sudo forever stop bundle/main.js
sudo rm -rf bundle
sudo tar xfz /tmp/bundle.tgz -C $APP_DIR
sudo rm /tmp/bundle.tgz
pushd bundle/programs/server/node_modules
sudo rm -rf fibers
sudo npm install fibers@1.0.1
popd
sudo chown -R www-data:www-data bundle
sudo PORT=$PORT MONGO_URL=$MONGO_URL ROOT_URL=$ROOT_URL forever start bundle/main.js
popd" > server.sh
scp $SSH_OPT server.sh $SSH_HOST:/home/$username/server.sh > /dev/null 2>&1
rm server.sh > /dev/null 2>&1
echo Your app is deployed and serving on: $ROOT_URL
;;
* )
cat <<'ENDCAT'
./meteor.sh [action]

Available actions:

  setup   - Install a meteor environment on a fresh Ubuntu server
  deploy  - Deploy the app to the server
ENDCAT
;;
esac
