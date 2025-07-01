from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO
from datetime import datetime
import os

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*")

def create_app(config_name=None):
    app = Flask(__name__)
    
    # Load configuration
    config_name = config_name or os.getenv('FLASK_CONFIG', 'development')
    from app.config import config
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.transaction import transaction_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.ai import ai_bp
    from app.routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(transaction_bp, url_prefix='/transactions')
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
    app.register_blueprint(ai_bp, url_prefix='/ai')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    
    # Import models to ensure they are registered
    from app.models import user, transaction
    
    # Import socket events
    from app import socketio_events
    
    # Add root route
    @app.route('/')
    def index():
        return jsonify({
            'message': 'FinLogix API Server',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'auth': '/auth',
                'transactions': '/transactions',
                'dashboard': '/dashboard',
                'ai': '/ai',
                'admin': '/admin'
            }
        })
    
    # Add health check endpoint
    @app.route('/health')
    def health():
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        })
    
    return app
