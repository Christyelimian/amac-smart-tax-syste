#!/bin/bash

echo "🔍 AMAC Admin Portal Test Script"
echo "=================================="

# Check if services are running
echo "📊 Checking services..."

API_URL="http://localhost:3004"
FRONTEND_URL="http://localhost:3005"

# Test API
echo "🔌 Testing API at $API_URL..."
if curl -s "$API_URL/api/health" > /dev/null; then
    echo "✅ API server is running"
else
    echo "❌ API server is not responding"
fi

# Test Frontend  
echo "🖥 Testing Frontend at $FRONTEND_URL..."
if curl -s "$FRONTEND_URL" > /dev/null; then
    echo "✅ Frontend server is running"
else
    echo "❌ Frontend server is not responding"
fi

echo ""
echo "🌐 Access URLs:"
echo "   Frontend: $FRONTEND_URL"
echo "   API: $API_URL"
echo "   Admin Portal: $FRONTEND_URL/admin-portal/login"
echo "   API Health: $API_URL/api/health"
echo ""
echo "🧪 Default Test Credentials:"
echo "   Email: admin@amac.gov.ng"
echo "   Password: admin123"
echo ""
echo "💡 To start services:"
echo "   cd admin-portal && npm start"
echo ""