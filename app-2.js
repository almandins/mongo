/*_________________
  MONGODB FUNCTIONS
  _________________*/

/*
Try to integrate with what done in the book.
*/
/*
Indexing operations?
*/
//https://docs.mongodb.com/manual/crud/

'use strict';
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const { spawn } = require('child_process'); //for mongoImport

const url = 'mongodb://localhost:27017';
const dbName = 'my2ndProject';
const client = new MongoClient(url, { useNewUrlParser: true });

//IMPORT FILE
function mongoImport(contacts, fileName, clientClose) {
        /*
        mongoimport --db users --collection contacts --file contacts.json
        mongoimport --db my2ndProject --collection documents --file ~/Downloads/inventory.crud.json
        The latter works and it is intended to run from terminal, not mongo shell.
        Source:
        users: database
        contacts: collection
        */
    //const ls = spawn('ls', ['-l']);
        /*
        Failed: open ~/Downloads/inventory.crud.json: no such file or directory.
        */
    try {
        const ls = spawn('mongoimport', [
            '--db',
            dbName,
            '--collection',
            contacts,
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
    //Polish this function.
}

//LIST COLLECTIONS
function listColl(db, clientClose) {
    db.listCollections()
        .toArray()
        .then(result => {
            //https://mongodb.github.io/node-mongodb-native/2.0/api/Db.html#listCollections
            for (let i = 0; i < result.length; i++) {
                console.log(result[i].name);
            }
            //console.log(result);
        })
        .catch(error => {
            console.log(error);
        })
        .then(() => {
            clientClose();
        });
}

//LIST DATABASES
function listDb(db, clientClose) {
    db.admin()
        .listDatabases()
        .then(result => {
            //https://mongodb.github.io/node-mongodb-native/api-generated/admin.html#listdatabases
            console.log(result);
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

        for(let i=0; i<100; i++){
            console.log(Math.floor(Math.random()*36+1));
        }
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
//In MongoDB, each document stored in a collection requires a unique _id field that acts as a primary key. If an inserted document omits the _id field, the MongoDB driver automatically generates an ObjectId for the _id field.
//The field name _id is reserved for use as a primary key; its value must be unique in the collection, is immutable, and may be of any type other than an array.
//If a database does not exist, MongoDB creates the database when you first store data for that database.
//The insertOne() operation creates both the database [dbName] and the collection [documents] if they do not already exist.
//Source: https://docs.mongodb.com/manual/core/databases-and-collections/
//MongoDB stores documents in collections. Collections are analogous to tables in relational databases.
//By default, a collection does not require its documents to have the same schema; i.e. the documents in a single collection do not need to have the same set of fields and the data type for a field can differ across documents within a collection.
async function insertDocuments(db, clientClose, doc) {
    try {
        let result = await db.collection('documents').insertOne(doc);
        assert.equal(1, result.insertedCount);
        console.log('Inserted 1 document into the collection');
    } catch (err) {
        console.log(err);
    } finally {
        clientClose();
    }
}

//FIND ALL DOCUMENTS
    /*
    async function findDocuments(db, clientClose, searchIt){
        try{
            if(!searchIt) searchIt={};
            let docs=await db.collection('documents').find(searchIt).toArray();
            console.log('Found the following records.');
            //I get an array from the search.
            //console.log(docs);
            console.log(docs[0]);
            for(let i in docs[0])
                console.log(docs[0][i]);
            //console.log(Object.getOwnPropertyNames(docs));
            //console.log(docs[0]);
            //console.log(JSON.parse(docs));
        }catch(err){
            console.log(err);
        }finally{
            clientClose();
        }
    }
    */

function findDocuments(db, clientClose, searchIt) {
    if (!searchIt) searchIt = {};
    db.collection('documents')
        .find(searchIt)
        .toArray()
        .then(result => {
            console.log('Found the following records.');
            //console.log(Object.getOwnPropertyNames(result[0][Object.keys(result[0])[0]]));
            console.log(result);
            //console.log(JSON.stringify(result, null, 4));
            /*
            for(let i in result[0])
                console.log(result[0][i]);
            */
        })
        .catch(err => {
            console.log(err);
        })
        .then(() => {
            clientClose();
        });
}

//UPDATE A DOCUMENT
async function updateDocument(db, clientClose, doc1, doc2) {
    try {
        let result = await db
            .collection('documents')
            .updateOne(doc1, { $set: doc2 });
        assert.equal(1, result.result.n);
        const str = doc1[Object.keys(doc1)[0]];
        console.log(
            'Updated the document with the field equal to ' + str + '.'
        );
    } catch (err) {
        console.log(err);
    } finally {
        clientClose();
    }
}

//REMOVE A DOCUMENT
async function removeDocument(db, clientClose, doc) {
    try {
        let result = await db.collection('documents').deleteOne(doc);
        assert.equal(1, result.result.n);
        const str = doc[Object.keys(doc)[0]];
        console.log(
            'Removed the document with the field a equal to ' + str + '.'
        );
    } catch (err) {
        console.log(err);
    } finally {
        clientClose();
    }
}

//INDEX A COLLECTION
async function indexCollection(db, clientClose, doc) {
    let result = await db.collection('document').createIndex(doc, null);
    console.log(result);
    clientClose();
}

(async () => {
    try {
        await client.connect();
        console.log('Connected correctly to server.');
        const db = client.db(dbName);

        const doc = {
            //_id: ObjectId(createID()),
            _id: createID(),
            prop0: 0,
            prop1: 1,
        };
        const doc1 = { a: 2 };
        const doc2 = { c: 1 };
        //insertDocuments(db, ()=> {}, doc);

        /*
        //Example.
        const l=5;
        const v=[];
        v.length=l;
        //This should be the fastest method.
        
        for(let i=0; i<l; i++){
            v[i]={};
            v[i][String.fromCharCode(98+i)]=1;
                insertDocuments(db, ()=>{}, v[i]);
        }
        */
        /*
        How come the program still works by passing client.close()?
        */
        //updateDocument(db, ()=> {}, doc1, doc2);
        //removeDocument(db, ()=> {}, doc1);
        //indexCollection(db, ()=> {}, doc);

        //const doc3={ a:2 };

        //listDb(db, ()=> {});

        /*
        listColl(db, ()=> {
            client.close();
        });
        */

        /*
        const contacts='documents';
        //const fileName='~/Downloads/inventory.crud.json';
        //Note: the latter didn't work. But this does:
        const fileName='/home/user/Downloads/inventory.crud.json';
        mongoImport(contacts, fileName, ()=> {
            client.close();
        });
        */

        findDocuments(db, () => {
            client.close();
        });

        /*
        I need to pass to insertDocuments() a function which calls client.close().
        I cannot do:
        insertDocument(db);
        client.close();
            */
    } catch (err) {
        console.log(err.message);
    }
})();

    /*
    (node:15423) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 1)
    */
