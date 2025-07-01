from flask_socketio import emit, join_room, leave_room, disconnect
from flask import request
from flask_jwt_extended import decode_token, jwt_required
from app import socketio, db
from app.models.user import User
from datetime import datetime
import logging

# Store connected users
connected_users = {}

@socketio.on('connect')
def handle_connect(auth=None):
    """Handle client connection"""
    try:
        # Verify JWT token
        if not auth or 'token' not in auth:
            disconnect()
            return False
        
        try:
            # Decode the JWT token
            token_data = decode_token(auth['token'])
            user_id = token_data['sub']
            
            # Verify user exists
            user = User.query.get(user_id)
            if not user:
                disconnect()
                return False
            
            # Join user-specific room
            room = f'user_{user_id}'
            join_room(room)
            
            # Store connection using session ID
            connected_users[request.sid] = {
                'user_id': user_id,
                'user_name': user.name,
                'room': room
            }
            
            emit('connected', {
                'message': 'Successfully connected to FinLogix',
                'user_id': user_id
            })
            
            logging.info(f'User {user_id} ({user.name}) connected')
            return True
            
        except Exception as e:
            logging.error(f'Token verification failed: {str(e)}')
            disconnect()
            return False
            
    except Exception as e:
        logging.error(f'Connection error: {str(e)}')
        disconnect()
        return False

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    try:
        if request.sid in connected_users:
            user_info = connected_users[request.sid]
            leave_room(user_info['room'])
            del connected_users[request.sid]
            logging.info(f'User {user_info["user_id"]} ({user_info["user_name"]}) disconnected')
    except Exception as e:
        logging.error(f'Disconnect error: {str(e)}')

@socketio.on('join_notifications')
def handle_join_notifications():
    """Join notifications room for real-time updates"""
    try:
        if request.sid in connected_users:
            user_info = connected_users[request.sid]
            room = f'notifications_{user_info["user_id"]}'
            join_room(room)
            emit('joined_notifications', {'message': 'Joined notifications channel'})
    except Exception as e:
        logging.error(f'Join notifications error: {str(e)}')

@socketio.on('ping')
def handle_ping():
    """Handle ping for connection health check"""
    emit('pong', {'timestamp': datetime.utcnow().isoformat()})

def broadcast_transaction_update(user_id, event_type, data):
    """Broadcast transaction updates to user"""
    try:
        room = f'user_{user_id}'
        socketio.emit(event_type, data, room=room)
    except Exception as e:
        logging.error(f'Broadcast error: {str(e)}')

def broadcast_balance_update(user_id, balance_data):
    """Broadcast balance updates to user"""
    try:
        room = f'user_{user_id}'
        socketio.emit('balance_updated', balance_data, room=room)
    except Exception as e:
        logging.error(f'Balance broadcast error: {str(e)}')

# Error handlers
@socketio.on_error_default
def default_error_handler(e):
    """Default error handler for SocketIO"""
    logging.error(f'SocketIO error: {str(e)}')
    emit('error', {'message': 'An error occurred'})

@socketio.on_error()
def error_handler(e):
    """General error handler"""
    logging.error(f'SocketIO general error: {str(e)}')
    if request.sid in connected_users:
        user_info = connected_users[request.sid]
        logging.error(f'Error for user {user_info["user_id"]}: {str(e)}')
    
    emit('error', {'message': 'Connection error occurred'})
