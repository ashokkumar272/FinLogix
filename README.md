# FinLogix - Personal Finance Management System

![FinLogix Logo](https://img.shields.io/badge/FinLogix-Finance%20Management-blue?style=for-the-badge)

A comprehensive personal finance management application built with React (TypeScript) frontend and Flask backend. FinLogix helps users track expenses, manage budgets, analyze spending patterns, and make informed financial decisions with AI-powered insights.

## 🚀 Features

### Core Features
- **User Authentication & Authorization**: Secure login/registration with JWT tokens
- **Transaction Management**: Add, edit, and categorize income/expense transactions
- **Real-time Dashboard**: Live updates using WebSocket connections
- **Financial Analytics**: Visual charts and spending pattern analysis
- **AI-Powered Insights**: Smart financial advice using Gemini AI
- **Audio Memo Support**: Record and attach voice memos to transactions
- **Multi-category Support**: Comprehensive expense and income categorization
- **Responsive Design**: Mobile-first responsive UI with Tailwind CSS

### Advanced Features
- **Role-based Access**: User and Admin role management
- **Data Visualization**: Interactive charts with Chart.js
- **Profile Management**: User profile and financial preferences
- **Real-time Notifications**: Live updates and alerts
- **Search & Filter**: Advanced transaction filtering and search
- **Export/Import**: Data export capabilities

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **React Router Dom** for routing
- **Tailwind CSS** for styling
- **Chart.js** with react-chartjs-2 for data visualization
- **Axios** for API communication
- **Context API** for state management

### Backend
- **Flask 3.0** with Python
- **SQLAlchemy** for ORM
- **PostgreSQL** database
- **Flask-JWT-Extended** for authentication
- **Flask-SocketIO** for real-time communication
- **Gemini AI API** for financial insights
- **Flask-CORS** for cross-origin requests

### Development Tools
- **TypeScript** for type safety
- **ESLint** for code linting
- **Jest** for testing
- **Webpack** (via Create React App)

## 📁 Project Structure

```
FinLogix/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── socketio_events.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   └── transaction.py
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── dashboard.py
│   │   │   ├── transaction.py
│   │   │   ├── admin.py
│   │   │   └── ai.py
│   │   └── utils/
│   │       └── auth_utils.py
│   ├── main.py
│   ├── requirements.txt
│   ├── create_db.py
│   └── audio_memos/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   ├── TransactionModal.tsx
│   │   │   ├── AudioRecorder.tsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Transactions.tsx
│   │   │   ├── Login.tsx
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   └── ...
│   │   └── types/
│   │       ├── user.ts
│   │       └── transaction.ts
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 🚦 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**
- **pip** (Python package manager)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/finlogix.git
cd finlogix
```

### 2. Database Setup

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE finlogix_dev;
CREATE USER postgres WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE finlogix_dev TO postgres;
```

2. Update the database connection string in `backend/app/config.py`

### 3. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Set up environment variables:
Create a `.env` file in the backend directory:
```env
SECRET_KEY=your-super-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DATABASE_URL=postgresql://postgres:your_password@localhost/finlogix_dev
GEMINI_API_KEY=your-gemini-api-key
FLASK_ENV=development
```

6. Initialize the database:
```bash
python create_db.py
```

7. Run the backend server:
```bash
python main.py
```

The backend will start on `http://localhost:5000`

### 4. Frontend Setup

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

The frontend will start on `http://localhost:3000`

## 🎯 Usage

### User Registration & Authentication
1. Navigate to `http://localhost:3000`
2. Click "Sign Up" to create a new account
3. Fill in your details and register
4. Login with your credentials

### Managing Transactions
1. **Add Transaction**: Click "Add Transaction" from the dashboard
2. **Categories**: Choose from predefined income/expense categories
3. **Audio Memos**: Record voice notes for transactions
4. **Edit/Delete**: Manage existing transactions from the transactions page

### Dashboard Features
1. **Overview**: View total income, expenses, and balance
2. **Charts**: Analyze spending patterns with interactive charts
3. **Recent Transactions**: Quick view of latest financial activities
4. **AI Insights**: Get personalized financial advice

### Profile Management
1. **User Profile**: Update personal information
2. **Financial Preferences**: Set budget goals and categories
3. **Security**: Change password and security settings

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/charts` - Get chart data

### AI Insights
- `POST /api/ai/analyze` - Get AI financial analysis
- `POST /api/ai/advice` - Get personalized advice

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface with Tailwind CSS
- **Dark Theme**: Elegant dark mode for better user experience
- **Responsive Layout**: Mobile-first design that works on all devices
- **Interactive Charts**: Dynamic data visualization
- **Real-time Updates**: Live data updates via WebSocket
- **Loading States**: Smooth loading animations and states
- **Error Handling**: User-friendly error messages and validation

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password encryption
- **Input Validation**: Server-side and client-side validation
- **CORS Protection**: Cross-origin request security
- **SQL Injection Prevention**: Parameterized queries with SQLAlchemy
- **XSS Protection**: Input sanitization and output encoding

## 📊 Database Schema

### Users Table
- id (Primary Key)
- name, email, password_hash
- role (user/admin)
- financial_profile (income_type, monthly_income, etc.)
- created_at, updated_at

### Transactions Table
- id (Primary Key)
- user_id (Foreign Key)
- amount, type (income/expense)
- category, description
- audio_memo_path
- created_at, updated_at

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm test
```

### Backend Testing
```bash
cd backend
python -m pytest tests/
```

## 🚀 Deployment

### Frontend (Build)
```bash
cd frontend
npm run build
```

### Backend (Production)
1. Set environment variables for production
2. Use a production WSGI server like Gunicorn:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 main:app
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@finlogix.com or open an issue on GitHub.

## 🔮 Future Features

- **Mobile App**: React Native mobile application
- **Bank Integration**: Connect with bank accounts via APIs
- **Investment Tracking**: Stock and crypto portfolio management
- **Goal Setting**: Financial goals and milestone tracking
- **Notification System**: Email/SMS notifications for budgets
- **Multi-currency Support**: Support for different currencies
- **Data Export**: CSV/PDF export functionality
- **Automated Categorization**: AI-powered transaction categorization

## 📈 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added AI insights and audio memos
- **v1.2.0** - Enhanced dashboard and charts
- **v1.3.0** - Real-time updates with WebSocket

---

**Built with ❤️ by the FinLogix Team**

For more information, visit our [documentation](https://docs.finlogix.com) or check out our [demo](https://demo.finlogix.com).
