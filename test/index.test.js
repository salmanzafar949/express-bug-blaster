const request = require('supertest');
const express = require('express');
const bugblaster = require('../src/index');
const fs = require('fs');
const path = require('path');

// Mock console.log to capture output
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

// Helper to create a test app
function createTestApp(options = {}) {
    const app = express();

    // Async error catcher middleware
    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

    app.get('/sync-error', (req, res, next) => {
        throw new Error('Synchronous error');
    });

    app.get('/async-error', asyncHandler(async (req, res, next) => {
        await Promise.reject(new Error('Asynchronous error'));
        res.send('This won’t run');
    }));

    app.get('/undefined-error', (req, res, next) => {
        const data = null;
        res.send(data.name);
    });

    app.use(bugblaster({
        logToFile: true,
        logFilePath: path.join(__dirname, 'test-logs.json'),
        defaultResponse: 'Test error response',
        ...options,
    }));

    return app;
}

describe('BugBlaster', () => {
    beforeAll(() => {
        process.env.NODE_ENV = 'development';
    });

    beforeEach(() => {
        consoleLogSpy.mockClear();
        const logFile = path.join(__dirname, 'test-logs.json');
        if (fs.existsSync(logFile)) {
            fs.unlinkSync(logFile);
        }
    });

    afterAll(() => {
        consoleLogSpy.mockRestore();
        delete process.env.NODE_ENV;
    });

    it('handles synchronous errors with default response', async () => {
        const app = createTestApp();
        const response = await request(app).get('/sync-error');

        expect(response.status).toBe(500);
        expect(response.body).toMatchObject({
            error: 'Test error response',
            details: expect.stringContaining('Synchronous error'),
        });

        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('[BugBlaster] Error received: Synchronous error')
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('[BugBlaster] Error received: Synchronous error')
        );

        const logFile = path.join(__dirname, 'test-logs.json');
        expect(fs.existsSync(logFile)).toBe(true);
        const logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
            message: 'Synchronous error',
            path: '/sync-error',
            timestamp: expect.any(String),
            location: expect.stringContaining('index.test.js'),
        });
    });

    it('handles asynchronous errors with default response', async () => {
        const app = createTestApp();
        const response = await request(app).get('/async-error');

        expect(response.status).toBe(500);
        expect(response.body).toMatchObject({
            error: 'Test error response',
            details: expect.stringContaining('Asynchronous error'),
        });

        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('[BugBlaster] Error received: Asynchronous error')
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('[BugBlaster] Error received: Asynchronous error')
        );

        const logFile = path.join(__dirname, 'test-logs.json');
        expect(fs.existsSync(logFile)).toBe(true);
        const logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
            message: 'Asynchronous error',
            path: '/async-error',
            timestamp: expect.any(String),
        });
    });

    it('handles undefined property errors with default response', async () => {
        const app = createTestApp();
        const response = await request(app).get('/undefined-error');

        expect(response.status).toBe(500);
        expect(response.body).toMatchObject({
            error: 'Test error response',
            details: expect.stringContaining('Cannot read properties of null'),
        });

        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('[BugBlaster] Error received: Cannot read properties of null')
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('[BugBlaster] Error received: Cannot read properties of null')
        );

        const logFile = path.join(__dirname, 'test-logs.json');
        expect(fs.existsSync(logFile)).toBe(true);
        const logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
            message: expect.stringContaining('Cannot read properties of null'),
            path: '/undefined-error',
            timestamp: expect.any(String),
        });
    });

    it('respects logToFile: false option', async () => {
        const app = createTestApp({ logToFile: false });
        const response = await request(app).get('/sync-error');

        expect(response.status).toBe(500);
        expect(response.body).toMatchObject({
            error: 'Test error response',
            details: expect.stringContaining('Synchronous error'),
        });

        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('[BugBlaster] Error received: Synchronous error')
        );

        const logFile = path.join(__dirname, 'test-logs.json');
        expect(fs.existsSync(logFile)).toBe(false);
    });

    it('uses custom onError callback', async () => {
        const customOnError = (err, req, res) => {
            res.status(400).json({ custom: 'Custom error', message: err.message });
        };
        const app = createTestApp({ onError: customOnError });
        const response = await request(app).get('/sync-error');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            custom: 'Custom error',
            message: 'Synchronous error',
        });

        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('[BugBlaster] Error received: Synchronous error')
        );

        const logFile = path.join(__dirname, 'test-logs.json');
        expect(fs.existsSync(logFile)).toBe(true);
    });

    it('omits details in production mode', async () => {
        process.env.NODE_ENV = 'production';
        const app = createTestApp();
        const response = await request(app).get('/sync-error');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: 'Test error response',
        });

        process.env.NODE_ENV = 'development'; // Reset for other tests
    });
});
