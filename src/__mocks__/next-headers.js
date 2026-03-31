module.exports = { cookies: jest.fn(() => ({ get: jest.fn(), set: jest.fn() })), headers: jest.fn(() => new Map()) };
