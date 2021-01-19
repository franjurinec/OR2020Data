const express = require('express');
const cors = require('cors')
const { Parser } = require('json2csv')
const db = require('./databaseHandler');
const path = require('path');
const { response } = require('express');
const fetch = require("node-fetch");
const fs = require('fs');
var cacheManager = require('cache-manager');
var fsStore = require('cache-manager-fs');
var cache = cacheManager.caching({store: fsStore, options: {ttl: 60*60, maxsize: 1000*1000*1000, path:'fscache', preventfill:true, reviveBuffers: true}});

const parser = new Parser()
const app = express()

app.use(express.json())
app.use(express.urlencoded())
app.use(cors())

// UI Website Endpoints

app.get('/hospitals', async (req, res) => {
    console.log(req.query)
    res.json(await db.get('hospitals', req.query))
})

app.get('/hospitals/json', async (req, res) => {
    res.setHeader('Content-disposition', 'attachment; filename=hospitals.json')
    res.json(await db.get('hospitals', req.query))
})

app.get('/hospitals/csv', async (req, res) => {
    res.setHeader('Content-disposition', 'attachment; filename=hospitals.csv')
    res.send(parser.parse(await db.get('hospitals', req.query)))
})

app.get('/hospitals/fields', async  (req, res) => {
    res.json(await db.getFields('hospitals'))
})

app.get('/index', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/datatable', function(req, res) {
    res.sendFile(path.join(__dirname + '/datatable.html'))
});


// OpenAPI Endpoints

app.get('/api/hospital', async (req, res) => {
    var hospitals = await db.apiGet('hospitals', {})
    if (hospitals) {
        hospitals.forEach(hospital => {
            hospital['@context'] = {
                name: 'https://schema.org/name',
                address: 'https://schema.org/address',
                telephone: 'https://schema.org/telephone',
                email: 'https://schema.org/email',
                website: 'https://schema.org/URL',
                
            }
            hospital.slika = "http://localhost:3000/api/hospital/"+hospital._id+"/picture"
            hospital.links = [
                {
                    href: '/api/hospital/' + hospital._id + '/employee',
                    ref: 'Employees',
                    type: 'GET'
                },
                {
                    href: '/api/hospital/' + hospital._id,
                    ref: 'Detail',
                    type: 'GET'
                }
            ]
        })
        res.status(200).json({
            status: "OK",
            message: "Returned list of all hospitals.",
            response: hospitals
        })
    } else {
        res.status(500).json({
            status: "Internal Server Error",
            message: "An error has occured on the server.",
            response: null
        })
    }
})

app.post('/api/hospital', async (req, res) => {
    try {
        var newHospital = {
            name: req.body.name,
            address: req.body.address,
            telephone: req.body.telephone,
            email: req.body.email,
            website: req.body.website,
            staff: req.body.staff,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            last_updated: req.body.last_updated,
            staff_list_complete: req.body.staff_list_complete
        }
        await db.apiCreate('hospitals', newHospital).then(hospital => {
            res.status(201).json({
                status: "Created",
                message: "Created new hospital.",
                response: {
                    hospital_id: hospital.insertedId,
                    links: [
                        {
                            href: '/api/hospital/' + hospital.insertedId,
                            ref: 'View new hospital',
                            type: 'GET'
                        }
                    ]
                }
            })
        })
    } catch(error) {
        console.log(error)
        res.status(400).json({
            status: "Bad Request",
            message: "Invalid request.",
            response: null
        })
    }
})

app.get('/api/hospital/:id', async (req, res) => {
    var id = req.params.id;
    db.apiGetOne('hospitals', id).then(hospital => {
        if (hospital) {
            hospital['@context'] = {
                name: 'https://schema.org/name',
                address: 'https://schema.org/address',
                telephone: 'https://schema.org/telephone',
                email: 'https://schema.org/email',
                website: 'https://schema.org/URL',
                
            }
            hospital.slika = "http://localhost:3000/api/hospital/"+hospital._id+"/picture"
            hospital.links = [
                {
                    href: '/api/hospital/' + hospital._id + '/employee',
                    ref: 'Employees',
                    type: 'GET'
                }
            ]
            res.status(200).json({
                status: "OK",
                message: "Returned requested hospital.",
                response: hospital
            })
        } else {
            res.status(404).json({
                status: "Not Found",
                message: "Requested resource not found.",
                response: null
            })
        }
    }).catch(error => {
        console.log(error)
        res.status(400).json({
            status: "Bad Request",
            message: "Invalid Request.",
            response: null
        })
    })
})

app.put('/api/hospital/:id', async (req, res) => {
    var id = req.params.id;
    try {
        var newHospital = { 
            $set: req.body
        }
        console.log(newHospital)
        console.log(id)
        db.apiUpdate('hospitals', newHospital, id).then(() => {
            res.status(200).json({
                status: "OK",
                message: "Updated hospital.",
                response: {
                    hospital_id: id,
                    links: [
                        {
                            href: '/api/hospital/' + id,
                            ref: 'View updated hospital',
                            type: 'GET'
                        }
                    ]
                }
            })
        })
    } catch(error) {
        console.log(error)
        res.status(400).json({
            status: "Bad Request",
            message: "Invalid request.",
            response: null
        })
    }
})

app.delete('/api/hospital/:id', async (req, res) => {
    var id = req.params.id;
    db.apiDelete('hospitals', id)
        .then(result => {
            if (result.deletedCount == 1) {
                res.status(200).json({
                    status: "OK",
                    message: "Deleted hospital.",
                    response: {
                        hospital_id: id,
                        links: [
                            {
                                href: '/api/hospital/',
                                ref: 'View all hospitals',
                                type: 'GET'
                            }
                        ]
                    }
                })
            } else {
                res.status(404).json({
                    status: "Not Found",
                    message: "Requested resource not found.",
                    response: null
                })
            }
        }).catch(() => {
            res.status(400).json({
                status: "Bad Request",
                message: "Invalid request..",
                response: null
            })
        })
})

app.get('/api/hospital/:id/employee', async (req, res) => {
    var id = req.params.id;
    db.apiGetOne('hospitals', id).then(hospital => {
        if (hospital) {
            
            hospital.staff.forEach((staffMember, index) => {
                staffMember.links = [
                    {
                        href: '/api/hospital/' + hospital._id + '/employee/' + index,
                        ref: 'Detail',
                        type: 'GET'
                    }
                ]
            })

            res.status(200).json({
                status: "OK",
                message: "Returned requested hospital employees.",
                response: hospital.staff
            })
        } else {
            res.status(404).json({
                status: "Not Found",
                message: "Requested resource not found.",
                response: null
            })
        }
    }).catch(error => {
        console.log(error)
        res.status(400).json({
            status: "Bad Request",
            message: "Invalid Request.",
            response: null
        })
    })
})

app.get('/api/hospital/:id/employee/:eid', async (req, res) => {
    var id = req.params.id
    var eid = req.params.eid
    db.apiGetOne('hospitals', id).then(hospital => {
        if (hospital) {
            if (hospital.staff[eid]) {
                hospital.staff[eid].links = {
                    href: '/api/hospital/' + hospital._id,
                    ref: 'Hospital',
                    type: 'GET'
                }
                res.status(200).json({
                    status: "OK",
                    message: "Returned requested hospital employee detail.",
                    response: hospital.staff[eid]
                })
            } else {
                res.status(404).json({
                    status: "Not Found",
                    message: "Requested resource not found.",
                    response: null
                })
            }
        } else {
            res.status(404).json({
                status: "Not Found",
                message: "Requested resource not found.",
                response: null
            })
        }
    }).catch(error => {
        console.log(error)
        res.status(400).json({
            status: "Bad Request",
            message: "Invalid Request.",
            response: null
        })
    })
})


app.get('/api/employee', async (req, res) => {
    var hospitals = await db.apiGet('hospitals', {})
    if (hospitals) {
        var response = []
        hospitals.forEach(hospital => {
            hospital.staff.forEach((employee, index) => {
                hospital.staff[index].links = [
                    {
                        href: '/api/hospital/' + hospital._id + '/employee/' + index,
                        ref: 'Detail',
                        type: 'GET'
                    },
                    {
                        href: '/api/hospital/' + hospital._id,
                        ref: 'Hospital',
                        type: 'GET'
                    }
                ]
                response.push(hospital.staff[index])
            })
        })
        res.status(200).json({
            status: "OK",
            message: "Returned requested hospital employees.",
            response: response
        })
    } else {
        res.status(500).json({
            status: "Internal Server Error",
            message: "An error has occured on the server.",
            response: null
        })
    }
})

async function getWikiImageSource(title) {
    const wikiFetch = await fetch('https://en.wikipedia.org/w/api.php?action=query&prop=images&format=json&titles=' + title)
    const wikiBody = await wikiFetch.json()
    const imageName = wikiBody.query.pages[Object.keys(wikiBody.query.pages)[0]].images[4].title
    const imageInfoFetch = await fetch('https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&format=json&titles=' + imageName)
    const imageInfo = await imageInfoFetch.json()
    return imageInfo.query.pages[Object.keys(imageInfo.query.pages)[0]].imageinfo[0].url
}

async function getWikiImage(title) {
    const imageSource = await getWikiImageSource(title)
    const imgResponse = await fetch(imageSource)
    return await imgResponse.buffer()
}

app.get('/api/hospital/:id/picture', async (req, res) => {
    var id = req.params.id;
    try {
        var hospital = await db.apiGetOne('hospitals', id)
        if (hospital) {
            const title = hospital.staff[0].specialization_wiki
            cache.wrap(title, 
                function (cacheCallback) {
                    setTimeout(async function () {
                        const imageBuffer = await getWikiImage(title)
                        cacheCallback(null, imageBuffer)
                    }, 1000);
                },
                function (err, imageBuffer) {
                    res.contentType('image/jpeg')
                    res.end(imageBuffer, 'binary')
                })

        } else {
            res.status(404).json({
                status: "Not Found",
                message: "Requested resource not found.",
                response: null
            })
        }
    } catch(error) {
        console.log(error)
        res.status(400).json({
            status: "Bad Request",
            message: "Invalid Request.",
            response: null
        })
    }
})

app.get('/files/v1/hospitals.csv', (req, res) => {
    res.sendFile(path.join(__dirname + '/files/v1/hospitals.csv'))
})

app.get('/files/v1/hospitals.json', (req, res) => {
    res.sendFile(path.join(__dirname + '/files/v1/hospitals.json'))
})

app.get('/files/v2/hospitals.csv', (req, res) => {
    res.sendFile(path.join(__dirname + '/files/v2/hospitals.csv'))
})

app.get('/files/v2/hospitals.json', (req, res) => {
    res.sendFile(path.join(__dirname + '/files/v2/hospitals.json'))
})

app.get('/api/schema', (req, res) => {
    res.sendFile(path.join(__dirname + '/files/openapi.json'))
})

app.get('*', function(req, res){
    res.status(501).json({
        status: "Not Implemented",
        message: "Method not implemented.",
        response: null
    })
});

app.post('*', function(req, res){
    res.status(501).json({
        status: "Not Implemented",
        message: "Method not implemented.",
        response: null
    })
});

app.put('*', function(req, res){
    res.status(501).json({
        status: "Not Implemented",
        message: "Method not implemented.",
        response: null
    })
});

app.delete('*', function(req, res){
    res.status(501).json({
        status: "Not Implemented",
        message: "Method not implemented.",
        response: null
    })
});

app.patch('*', function(req, res){
    res.status(501).json({
        status: "Not Implemented",
        message: "Method not implemented.",
        response: null
    })
});

app.listen(3000)