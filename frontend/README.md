# FinLogix Frontend

A modern React TypeScript application with Tailwind CSS for financial management.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 🛠️ Tech Stack

- **React 19.1.0** - A JavaScript library for building user interfaces
- **TypeScript 4.9.5** - Typed superset of JavaScript
- **Tailwind CSS 4.1.11** - A utility-first CSS framework
- **React Scripts 5.0.1** - Configuration and scripts for Create React App

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Button.tsx      # Custom button component with variants
├── utils/              # Utility functions and types
│   └── index.ts        # Common utilities for the app
├── App.tsx             # Main application component
├── App.css             # Application styles
├── index.tsx           # Application entry point
└── index.css           # Global styles with Tailwind directives
```

## 🎨 Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner in interactive watch mode
- `npm run build` - Builds the app for production to the `build` folder
- `npm run eject` - **Note: this is a one-way operation. Once you eject, you can't go back!**

## 🔧 Configuration

### Tailwind CSS

The project is configured with Tailwind CSS for rapid UI development. The configuration can be found in:

- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration
- `src/index.css` - Global styles with Tailwind directives

### TypeScript

TypeScript configuration is managed through `tsconfig.json` with strict mode enabled for better type safety.

## 🧩 Components

### Button Component

A flexible button component with multiple variants and sizes:

```tsx
import Button from './components/Button';

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>
```

**Variants:** `primary`, `secondary`, `success`, `danger`
**Sizes:** `sm`, `md`, `lg`

## 🔨 Utilities

The `src/utils/index.ts` file contains common utility functions:

- `formatCurrency(amount, currency)` - Format numbers as currency
- `formatDate(date)` - Format dates with relative time
- `isValidEmail(email)` - Email validation
- `generateTransactionId()` - Generate unique transaction IDs
- `calculateTotal(transactions)` - Calculate totals from transaction arrays

## 🎯 Development Guidelines

1. **Type Safety**: Use TypeScript interfaces and types for all data structures
2. **Component Design**: Create reusable components with proper prop interfaces
3. **Styling**: Use Tailwind CSS classes for consistent styling
4. **File Organization**: Keep components, utilities, and types organized in their respective directories

## 🐛 Troubleshooting

If you encounter CSS warnings about unknown `@tailwind` rules, this is expected behavior from the CSS linter and won't affect functionality.

## 📝 License

This project is part of the FinLogix application.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
