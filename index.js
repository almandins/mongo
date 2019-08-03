'use strict';

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
//Complete error handling with assert.
const { spawn } = require('child_process'); //for mongoImport
const commander = require('commander');
const pkg = require('./package.json');

const url = 'mongodb://localhost:27017';
const dbName = 'test';
const client = new MongoClient(url, { useNewUrlParser: true });

//CLIENT CONNECT
function clientConnect(nameOfDb = dbName) {
    return new Promise(resolve => {
        client
            .connect()
            .then(() => {
                console.log('Connected correctly to server.');
                resolve(client.db(nameOfDb));
            })
            .catch(err => {
                console.log(err);
            });
    });
}

//LIST DATABASES
function listDb(db, clientClose) {
    db.admin()
        .listDatabases()
        .then(result => {
            const s = [];
            for (let i = 0; i < result.databases.length; i++) {
                s.push(result.databases[i].name);
            }
            console.log(s);
        })
        .catch(error => {
            console.log(error);
        })
        .then(() => {
            clientClose();
        });
}

//LIST COLLECTIONS
function listColl(db, clientClose) {
    db.listCollections()
        .toArray()
        .then(result => {
            const s = [];
            for (let i = 0; i < result.length; i++) {
                s.push(result[i].name);
            }
            console.log(s);
        })
        .catch(error => {
            console.log(error);
        })
        .then(() => {
            clientClose();
        });
}

//CREATE ID
function createID() {
        /*
        f=Math.random
        g=Math.floor

        f()\in [0,1)
        f()*10\in [0, 10)
        f()*10+1\in [0, 11)
        g(f*10+1)\in {1, 2, ..., 10}
        Math.floor(Math.random()*10+1); likewise
        Math.floor(Math.random()*36+1)
        \in {1, 2, ..., 36}
        */

    let _id = '';
    for (let i = 0; i < 24; i++) {
        let rNumber = Math.floor(Math.random() * 36 + 1);
        if (rNumber <= 10) {
            _id += rNumber;
        } else {
            _id += String.fromCharCode(rNumber + 86);
            //Ex: 11+86=97, String.FromCharCode(97)=a.
        }
    }
    return _id;
        /*
        _id of MongoDB is actually an object with own properties:
        [ '_bsontype', 'id' ]
        */
}

//INSERT A DOCUMENT
function insertDocuments(db, clientClose, collName, doc) {
    db.collection(collName)
        .insertOne(doc)
        .then(result => {
            assert.equal(1, result.insertedCount);
            console.log(`Document inserted successfully into ${collName}.`);
        })
        .catch(err => {
            console.log(err);
        })
        .then(() => {
            clientClose();
        });
}

//FIND DOCUMENTS
function findDocuments(db, collName, clientClose, searchIt = {}) {
    //searchIt for query criteria.
    db.collection(collName)
        .find(searchIt)
        .toArray()
        .then(result => {
            console.log('Found the following records.');
            console.log(result.length, 'docs');
            console.log(result);
        })
        .catch(err => {
            console.log(err);
        })
        .then(() => {
            clientClose();
        });
}

//UPDATE A DOCUMENT
function updateDocument(db, clientClose, collName, doc1, doc2) {
    db.collection(collName)
        .updateOne(doc1, { $set: doc2 })
        .then(result => {
            assert.equal(1, result.result.n);
            //Why using assert instead of throwing an error?
            const str = doc1[Object.keys(doc1)[0]];
            console.log('Document successfully update.');
        })
        .catch(err => {
            console.log(err);
        })
        .then(() => {
            client.close();
        });
}

//REMOVE A DOCUMENT
function removeDocument(db, clientClose, collName, doc) {
    db.collection(collName)
        .deleteOne(doc)
        .then(result => {
            assert.equal(1, result.result.n);
            const str = doc[Object.keys(doc)[0]];
            console.log('Document successfully removed.');
        })
        .catch(err => {
            console.log(err);
        })
        .then(() => {
            client.close();
        });
}
//INDEX A COLLECTION
/*
async function indexCollection(db, clientClose, collName, doc) {
    db.collection(collName).createIndex(doc, null).then(result=> {
        console.log(result);
    }).catch(err=> {
        console.log(err);
    }).then(()=> {
        client.close();
    });
}
*/

//IMPORT FILE
async function mongoImport(db, collName, fileName, clientClose) {
    //console.log(db);
    console.log(collName); //documents
    console.log(fileName); ///home/user/Downloads/inventory.crud.json
    try {
        const ls = await spawn('mongoimport', [
            '--db',
            db,
            '--collection',
            collName,
            '--file',
            fileName,
        ]);
        ls.stdout.on('data', data => {
            console.log(`stdout: ${data}`);
        });
        ls.stderr.on('data', data => {
            console.log(`stderr: ${data}`);
        });
        ls.on('close', code => {
            //console.log(`child process exited with code ${code}`);
        });
    } catch {
        console.log(err);
    } finally {
        clientClose();
    }
}

commander
    .version(pkg.version)
    .description(pkg.description)
    .usage('[options] <command> [..]');

//https://docs.mongodb.com/manual/reference/mongo-shell/#command-helpers
commander
    .command('showDbs') //Try 'show dbs' too.
    .description('print a list of all databases on the server')
    .action(() => {
        clientConnect().then(value => {
            listDb(value, () => client.close());
        });
    });

commander
    .command('showColl [dbs]')
    .description(
        'print a list of all collections for [dbs] database; [dbs] defaults to test'
    )
    .action(db => {
        clientConnect(db).then(value => {
            listColl(value, () => client.close());
        });
    });

commander
    .command('createID')
    .description('print an ID similar to the ID assigned by MongoDB')
    .action(() => {
        console.log(createID());
    });

commander
    .command('insertDoc <doc> <collName> [dbs]')
    .description('insert a new document into the collection')
    .action((doc, collName, db) => {
        //What if <...> aren't respected?
        clientConnect(db).then(value => {
            //'{"k":0,"s":1}'
            insertDocuments(
                value,
                () => client.close(),
                collName,
                JSON.parse(doc)
            );
        });
    });

commander
    .command('find <collName> [dbs]')
    .description('finds all documents in the collection')
    .action((collName, db) => {
        clientConnect(db).then(value => {
            findDocuments(value, collName, () => client.close());
        });
    });

commander
    .command('updateDoc <doc1> <doc2> <collName> [dbs]')
    .description('update a single existing document in the collection')
    .action((doc1, doc2, collName, db) => {
        //'{"a":1}'
        //./app updateDoc '{"a":1}' '{"b":1}' documents myProject
        clientConnect(db).then(value => {
            updateDocument(
                value,
                () => client.close(),
                collName,
                JSON.parse(doc1),
                JSON.parse(doc2)
            );
        });
    });

commander
    .command('removeDoc <doc> <collName> [dbs]')
    .description('remove a single existing document in the collection')
    .action((doc, collName, db) => {
        //'{"a":1}'
        //./app removeDoc '{"a":1}' documents myProject
        clientConnect(db).then(value => {
            removeDocument(
                value,
                () => client.close(),
                collName,
                JSON.parse(doc)
            );
        });
    });

commander
    .command('importFile <filename> <collName> [dbs]')
    .description('import a file in the collection')
    .action((fileName, collName, db) => {
        //./app importFile /home/user/Downloads/inventory.crud.json documents myProject
        clientConnect(db).then(value => {
            mongoImport(db, collName, fileName, () => client.close());
        });
    });

commander.parse(process.argv);
