#!/usr/bin/env python3
"""
Script to create the finlogix_dev database
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    # Connection parameters
    host = "localhost"
    port = "5432"
    user = "postgres"
    password = "India@123"
    database_name = "finlogix_dev"
    
    try:
        # Connect to PostgreSQL server (default database)
        print("Connecting to PostgreSQL server...")
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database="postgres"  # Connect to default postgres database
        )
        
        # Set autocommit mode
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        # Create cursor
        cursor = conn.cursor()
        
        # Check if database already exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (database_name,))
        exists = cursor.fetchone()
        
        if exists:
            print(f"Database '{database_name}' already exists!")
        else:
            # Create the database
            print(f"Creating database '{database_name}'...")
            cursor.execute(f'CREATE DATABASE "{database_name}"')
            print(f"Database '{database_name}' created successfully!")
        
        # Close connections
        cursor.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    if create_database():
        print("Database setup completed successfully!")
    else:
        print("Database setup failed!")
