const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'DemandNoticePayment.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the error handling section
const oldErrorHandling = `// Enhanced error handling with specific messages
        let errorMessage = 'Failed to process payment. Please try again.';
        
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // Specific error messages for common issues
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Payment server is not running. Please start the payment server first.';
          } else if (error.message.includes('HTTP 404')) {
            errorMessage = 'Payment endpoint not found. Please ensure the payment server is running on http://localhost:3002';
          } else if (error.message.includes('HTTP 500')) {
            errorMessage = 'Payment server error. Please check server logs.';
          }
        }
        
        toast.error(errorMessage);
        
        // Show helpful guidance for server issues
        if (errorMessage.includes('server')) {
          toast.info('💡 Tip: Run "node simple_payment_server_3002.js" to start the payment server', {
            duration: 10000
          });
        }`;

const newErrorHandling = `// Enhanced error handling with specific messages
        let errorMessage = 'Failed to process payment. Please try again.';
        
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // Specific error messages for common issues
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Payment server connection failed. Please check if the server is running.';
          } else if (error.message.includes('HTTP 404')) {
            errorMessage = 'Payment endpoint not found. Server may be running on wrong port.';
          } else if (error.message.includes('HTTP 500')) {
            errorMessage = 'Payment server error. Please check server logs.';
          } else if (error.message.includes('CORS')) {
            errorMessage = 'CORS error. Please ensure server has proper CORS headers configured.';
          }
        }
        
        toast.error(errorMessage);
        
        // Show helpful guidance only for connection issues
        if (errorMessage.includes('connection failed') || errorMessage.includes('not running')) {
          toast.info('💡 Tip: Server should be running on http://localhost:3002. Test with: curl http://localhost:3002/health', {
            duration: 15000
          });
        }`;

if (content.includes(oldErrorHandling)) {
  content = content.replace(oldErrorHandling, newErrorHandling);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Successfully updated error handling in frontend');
} else {
  console.log('❌ Could not find the exact error handling section to replace');
}

// Also update the server URL check to be more robust
const oldUrlCheck = `// Check if response is OK and contains JSON
      if (!response.ok) {
        // Handle different types of errors
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || \`HTTP \${response.status}: Failed to initialize payment\`);
        } catch (jsonError) {
          // If response is not JSON (e.g., HTML error page)
          throw new Error(\`HTTP \${response.status}: Payment server error. Please ensure the payment server is running.\`);
        }
      }`;

const newUrlCheck = `// Check if response is OK and contains JSON
      if (!response.ok) {
        // Handle different types of errors
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || \`HTTP \${response.status}: \${errorData.message || 'Failed to initialize payment'}\`);
        } catch (jsonError) {
          // If response is not JSON (e.g., HTML error page or CORS issue)
          const textError = await response.text();
          if (textError.includes('CORS') || textError.includes('preflight')) {
            throw new Error(\`HTTP \${response.status}: CORS issue. Server may not be configured to accept requests from this origin.\`);
          } else {
            throw new Error(\`HTTP \${response.status}: Payment server returned unexpected response. Server is running but may have configuration issues.\`);
          }
        }
      }`;

if (content.includes(oldUrlCheck)) {
  content = content.replace(oldUrlCheck, newUrlCheck);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Successfully updated response validation in frontend');
} else {
  console.log('❌ Could not find the exact URL check section to replace');
}

console.log('🎉 Frontend error handling has been improved!');