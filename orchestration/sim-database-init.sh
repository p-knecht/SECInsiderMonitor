#!/bin/bash

# note: creating script to initiate replica set on second run, as mongo container is started without --replSet option for initialization on first run
echo "Creating script for replica set initiation..."  >> /tmp/init-log
cat  <<OEOF >/data/db/initiate-replica-set.sh
#!/bin/bash
while ! mongosh --quiet --eval 'db.runCommand({ ping: 1 }).ok' | grep -q "1"
do
  sleep 1
done

echo "Initiating replica set..."  >> /tmp/init-log
mongosh >> /tmp/init-log 2>&1 <<IEOF
use admin
db.auth('$MONGO_INITDB_ROOT_USERNAME', '$MONGO_INITDB_ROOT_PASSWORD')
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "sim-database:27017" }
  ]
})
IEOF
OEOF
chmod +x /data/db/initiate-replica-set.sh

# creating keyfile for replica set
echo "Creating keyfile for replica set..."  >> /tmp/init-log
openssl rand -base64 756 > /data/db/mongo-keyfile
chmod 400 /data/db/mongo-keyfile
chown 999:999 /data/db/mongo-keyfile

# adding user to database
echo "Creating secinsidermonitor database user..."  >> /tmp/init-log
mongosh >> /tmp/init-log 2>&1 <<EOF
use admin
db.createUser({
  user: '$SIM_USER',
  pwd:  '$SIM_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: '$SIM_DB'
  }]
})
EOF

echo "Restarting mongod..."  >> /tmp/init-log
rm /tmp/docker-entrypoint-temp-mongod.pid # removing temp pid file created by mongo container
mongod --shutdown # stopping mongo service to start it with replica set option to execute the replica set initiation script