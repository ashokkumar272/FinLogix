# FinLogix Backend

A robust Flask-based REST API backend for the FinLogix personal finance application with JWT authentication, PostgreSQL database, and real-time WebSocket support.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication with access and refresh tokens
  - Role-based access control (User/Admin)
  - Password hashing with Werkzeug
  - Protected routes with decorators

- **Database Models**
  - User model with profiles and roles
  - Transaction model with categories and types
  - SQLAlchemy ORM with PostgreSQL
  - Database migrations with Flask-Migrate

- **RESTful APIs**
  - Complete CRUD for transactions
  - User profile management
  - Dashboard analytics and summaries
  - Admin panel for user management

- **Real-time Features**  
  - WebSocket support with Flask-SocketIO
  - Real-time transaction updates
  - Live balance notifications

- **AI-Powered Insights**
  - Spending pattern analysis
  - Budget recommendations
  - Financial forecasting
  - Personalized insights

## 📋 Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FinLogix/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   # Copy example env file
   copy .env.example .env  # Windows
   cp .env.example .env    # Linux/Mac
   
   # Edit .env file with your configuration
   ```

5. **Set up PostgreSQL database**
   ```sql
   -- Connect to PostgreSQL and create database
   CREATE DATABASE finlogix_dev;
   CREATE USER finlogix_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE finlogix_dev TO finlogix_user;
   ```

6. **Initialize database**
   ```bash
   flask init-db
   ```

7. **Create admin user**
   ```bash
   flask create-admin
   ```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
python main.py
```

### Production Mode
```bash
# Set environment variables
export FLASK_ENV=production
export DATABASE_URL=your_production_database_url

# Run with gunicorn
pip install gunicorn
gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 main:app
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Refresh Token
```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

### Transaction Endpoints

#### Get Transactions
```http
GET /transactions?page=1&per_page=10&type=expense&category=food
Authorization: Bearer <access_token>
```

#### Create Transaction
```http
POST /transactions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": 25.50,
  "category": "food",
  "type": "expense",
  "note": "Lunch at restaurant"
}
```

#### Update Transaction
```http
PUT /transactions/<id>
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": 30.00,
  "note": "Updated lunch expense"
}
```

#### Delete Transaction
```http
DELETE /transactions/<id>
Authorization: Bearer <access_token>
```

### Dashboard Endpoints

#### Get Financial Summary
```http
GET /dashboard/summary?month=12&year=2024
Authorization: Bearer <access_token>
```

#### Get Category Breakdown
```http
GET /dashboard/category-breakdown?type=expense&month=12&year=2024
Authorization: Bearer <access_token>
```

#### Get Monthly Trends
```http
GET /dashboard/monthly-trends?year=2024
Authorization: Bearer <access_token>
```

### AI Endpoints

#### Get Financial Insights
```http
GET /ai/insights
Authorization: Bearer <access_token>
```

#### Get Budget Suggestions
```http
POST /ai/budget-suggestions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "target_savings_rate": 20
}
```

#### Get Spending Forecast
```http
GET /ai/spending-forecast
Authorization: Bearer <access_token>
```

### Admin Endpoints

#### Get All Users
```http
GET /admin/users?page=1&search=john&role=user
Authorization: Bearer <admin_access_token>
```

#### Get User Details
```http
GET /admin/users/<user_id>
Authorization: Bearer <admin_access_token>
```

#### Update User Role
```http
PUT /admin/users/<user_id>/role
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "role": "admin"
}
```

#### Admin Dashboard
```http
GET /admin/dashboard
Authorization: Bearer <admin_access_token>
```

## 🔌 WebSocket Events

### Connection
```javascript
// Connect with JWT token
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token'
  }
});

// Listen for connection confirmation
socket.on('connected', (data) => {
  console.log('Connected:', data.message);
});
```

### Real-time Events
```javascript
// Transaction created
socket.on('transaction_created', (data) => {
  console.log('New transaction:', data.transaction);
});

// Transaction updated
socket.on('transaction_updated', (data) => {
  console.log('Transaction updated:', data.transaction);
});

// Transaction deleted
socket.on('transaction_deleted', (data) => {
  console.log('Transaction deleted:', data.transaction_id);
});

// Balance updated
socket.on('balance_updated', (data) => {
  console.log('Balance updated:', data);
});
```

## 🗄 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Transactions Table
```sql  
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FLASK_ENV` | Flask environment | `development` |
| `SECRET_KEY` | Flask secret key | Required |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET_KEY` | JWT signing key | Required |
| `PORT` | Server port | `5000` |

### Transaction Categories

**Income Categories:**
- salary, freelance, business, investment, other_income

**Expense Categories:**  
- food, transportation, housing, utilities, healthcare, entertainment, shopping, education, travel, other_expense

## 🧪 Testing

```bash
# Install test dependencies
pip install pytest pytest-flask

# Run tests
pytest

# Run with coverage
pytest --cov=app tests/
```

## 📦 Deployment

### Using Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:5000", "main:app"]
```

### Using Heroku
```bash
# Install Heroku CLI and login
heroku create finlogix-backend

# Set environment variables
heroku config:set FLASK_ENV=production
heroku config:set SECRET_KEY=your_secret_key
heroku config:set JWT_SECRET_KEY=your_jwt_secret

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main

# Initialize database
heroku run flask init-db
heroku run flask create-admin
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

For support, email support@finlogix.com or create an issue in the repository.

---

**FinLogix Backend** - Built with ❤️ using Flask, PostgreSQL, and modern web technologies.
