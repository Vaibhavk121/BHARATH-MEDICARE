import os
from app import create_app
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask application
app = create_app()

if __name__ == '__main__':
    # Get configuration from environment
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    print("=" * 60)
    print("🏥 BharathMedicare Backend Server")
    print("=" * 60)
    print(f"Server starting on http://{host}:{port}")
    print(f"Debug mode: {debug}")
    print("=" * 60)
    
    # Run the application
    app.run(
        host=host,
        port=port,
        debug=debug
    )
