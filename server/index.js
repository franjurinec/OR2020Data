const express = require('express');
const { Parser } = require('json2csv')
const db = require('./databaseHandler');

const parser = new Parser()
const app = express()

app.get('/hospitals', async (req, res) => {
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

app.listen(3000)