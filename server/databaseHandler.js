const MongoClient = require('mongodb').MongoClient;
const {DB_URL, DB_NAME} = require('./constants.json');

exports.get = async (collection, query) => {

    console.log('Received request with query:\n' + JSON.stringify(query))

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

    console.log('Modified query:\n' + JSON.stringify(query))

    const connection = await MongoClient.connect(DB_URL, {useUnifiedTopology: true})
    const hospitals = await connection.db(DB_NAME).collection(collection).find(query, {fields: {'_id': 0}}).toArray()
    await connection.close()
    return hospitals
}

exports.getFields = async (collection) => {
    const connection = await MongoClient.connect(DB_URL, {useUnifiedTopology: true})
    const hospitals = await connection.db(DB_NAME).collection(collection).find({}, {fields: {'_id': 0}}).toArray()
    return hospitals[0] ? Object.keys(hospitals[0]) : null
}