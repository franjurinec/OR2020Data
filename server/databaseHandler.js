const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID
const {DB_URL, DB_NAME} = require('./constants.json');

exports.get = async (collection, query) => {

    if (query) {
        if (query.hasOwnProperty('any')) {
            if (query['any'] === '') {
                query = {}
            } else {
                query = {
                    $text: {
                        $search: query['any']
                    }
                }
            }
        } else {
            Object.keys(query).forEach(key => {
                query[key] = new RegExp('.*' + query[key] + '.*')
            })
        }
    }

    const connection = await MongoClient.connect(DB_URL, {useUnifiedTopology: true})
    const hospitals = await connection.db(DB_NAME).collection(collection).find(query, {fields: {'_id': 0}}).toArray()
    await connection.close()
    return hospitals
}

exports.apiGet = async (collection, query) => {
    const connection = await MongoClient.connect(DB_URL, {useUnifiedTopology: true})
    const hospitals = await connection.db(DB_NAME).collection(collection).find(query).toArray()
    await connection.close()
    return hospitals
}

exports.apiGetOne = async (collection, id) => {
    const connection = await MongoClient.connect(DB_URL, {useUnifiedTopology: true})
    const hospital = await connection.db(DB_NAME).collection(collection).findOne({'_id': ObjectID(id)})
    await connection.close()
    return hospital
}

exports.apiCreate = async (collection, newObject) => {
    const connection = await MongoClient.connect(DB_URL, {useUnifiedTopology: true})
    const hospital = await connection.db(DB_NAME).collection(collection).insertOne(newObject)
    await connection.close()
    return hospital
}

exports.apiUpdate = async (collection, setFields, id) => {
    const connection = await MongoClient.connect(DB_URL, {useUnifiedTopology: true})
    const hospital = await connection.db(DB_NAME).collection(collection).updateOne({"_id": ObjectID(id)}, setFields)
    await connection.close()
    return hospital
}

exports.apiDelete = async (collection, id) => {
    const connection = await MongoClient.connect(DB_URL, {useUnifiedTopology: true})
    const hospital = await connection.db(DB_NAME).collection(collection).deleteOne({"_id": ObjectID(id)})
    await connection.close()
    return hospital
}

exports.getFields = async (collection) => {
    const connection = await MongoClient.connect(DB_URL, {useUnifiedTopology: true})
    const hospitals = await connection.db(DB_NAME).collection(collection).find({}, {fields: {'_id': 0}}).toArray()
    return hospitals[0] ? Object.keys(hospitals[0]) : null
}