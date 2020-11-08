const MongoClient = require('mongodb').MongoClient;
const { DB_URL, DB_NAME } = require('./constants.json');

exports.get = async (collection, query) => {
    if (query) {
        Object.keys(query).forEach(key => {
            query[key] = new RegExp('.*' + query[key] + '.*')
        })
    }

    console.log('Received request with query:\n' + JSON.stringify(query))

    const connection = await MongoClient.connect(DB_URL, { useUnifiedTopology: true })
    const hospitals = await connection.db(DB_NAME).collection(collection).find(query, {fields: { '_id': 0 } }).toArray()
    console.log(hospitals)
    await connection.close()
    return hospitals
}

exports.getFields = async (collection) => {
    const connection = await MongoClient.connect(DB_URL, { useUnifiedTopology: true })
    const hospitals = await connection.db(DB_NAME).collection(collection).find({}, {fields: { '_id': 0 } }).toArray()
    return hospitals[0] ? Object.keys(hospitals[0]) : null
}