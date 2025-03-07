const bugBlaster = require('../src/index'); // Adjust the path
const request = require('supertest');
const express = require('express');

describe('bugBlaster middleware', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(bugBlaster());

        app.get('/test', (req, res) => {
            res.send('Test route');
        });

        app.get('/error', (req, res, next) => {
            next(new Error('Test error'));
        });
    });

    it('should handle a normal route', async () => {
        const response = await request(app).get('/test');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Test route');
    });

    it('should handle an error route', async () => {
        const response = await request(app).get('/error');
        expect(response.statusCode).toBe(500);
    });
});
