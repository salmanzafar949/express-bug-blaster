# Express BugBlaster

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4+-blue)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Express BugBlaster** is a lightweight and powerful middleware for Node.js/Express applications designed to streamline error handling and debugging. It captures and analyzes errors, providing detailed stack traces and logging capabilities, and includes optional AI-powered analysis through Hugging Face.

## Features

-   **Dynamic Error Analysis:** Automatically extracts error details from stack traces and source code.
-   **Comprehensive Logging:** Saves errors to a customizable JSON log file for later review.
-   **Custom Responses:** Define custom error responses with an `onError` callback.
-   **Environment Awareness:** Detailed error messages in development, concise responses in production.
-   **Crash Protection:** Keeps your Express app running even after uncaught exceptions.

## Installation

1.  **Install via npm:**

    ```bash
    npm install express-bugblaster
    ```

2.  **Install Dependencies:**

    Ensure you have Node.js (v18+ recommended) and npm installed, then run:

    ```bash
    npm install
    ```

## Usage

### Basic Setup

Add BugBlaster as middleware to your Express app to catch and analyze errors:

```javascript
const express = require('express');
const bugblaster = require('express-bugblaster');

const app = express();


// Example route that throws an error
app.get('/crash', (req, res) => {
  throw new Error('Test error!');
});

// Add BugBlaster middleware after routes
app.use(bugblaster({
    logToFile: true,
    logFilePath: './errors.json',
    defaultResponse: 'Oops, something went wrong!',
}));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
```

## Configuration Options
### Customize BugBlaster with these options:

| Option          | Type       | Default                        | Description                                                               |
|-----------------|------------|--------------------------------|---------------------------------------------------------------------------|
| `logToFile`     | `boolean`  | `true`                         | Enable/disable logging to a file.                                         |
| `logFilePath`   | `string`   | `./bugblaster-logs.json`       | Path to the log file (relative to process cwd).                           |
| `defaultResponse` | `string` | `'Something went wrong...'`  | Default message returned in error responses.                              |
| `onError`       | `function` | `undefined`                    | Custom error handler: `(err, req, res) => {}`.                         |


## Development

### Running Tests

Ensure code quality with Jest:

```bash
npm test
 ```

This runs tests with coverage reporting.


## Contributing

We welcome contributions to Express BugBlaster! Here's how you can contribute:

1.  **Fork the Repository:**
    * Fork the repository to your GitHub account.

2.  **Clone the Repository:**
    * Clone the forked repository to your local machine:
        ```bash
        git clone [https://github.com/salmanzafar949/express-bug-blaster.git](https://www.google.com/search?q=https://github.com/salmanzafar949/express-bug-blaster.git)
        ```

3.  **Create a Branch:**
    * Create a new branch for your feature or bug fix:
        ```bash
        git checkout -b feature/your-feature-name
        ```
        or
        ```bash
        git checkout -b fix/your-bug-fix-name
        ```

4.  **Make Changes:**
    * Make your changes, ensuring they adhere to the project's coding standards.

5.  **Test Your Changes:**
    * Run the tests to ensure your changes don't introduce any regressions:
        ```bash
        npm test
        ```
    * Add new tests if necessary.

6.  **Commit Changes:**
    * Commit your changes with a clear and descriptive commit message:
        ```bash
        git commit -m "Add your feature or fix your bug"
        ```

7.  **Push Changes:**
    * Push your changes to your forked repository:
        ```bash
        git push origin feature/your-feature-name
        ```

8.  **Create a Pull Request:**
    * Go to the original repository on GitHub.
    * Click on "New Pull Request."
    * Select your branch and create the pull request.
    * Provide a clear description of your changes.

9.  **Code Review:**
    * Your pull request will be reviewed by the maintainers.
    * Address any feedback and make necessary changes.

10. **Merge:**
    * Once your pull request is approved, it will be merged into the main branch.

**Guidelines:**

* Follow the existing coding style and conventions.
* Write clear and concise commit messages.
* Add tests for new features and bug fixes.
* Update the documentation if needed.

Thank you for contributing to Express BugBlaster!

## License

Express BugBlaster is released under the MIT License.

