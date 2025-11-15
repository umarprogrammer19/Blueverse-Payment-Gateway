// netlify/functions/ipg-success.js
exports.handler = async (event) => {
  // Yahan tum chaaho to event.body se transaction data read + verify hash kar sakte ho
  console.log("IPG SUCCESS CALLBACK", event.httpMethod, event.body);

  return {
    statusCode: 302,               // redirect
    headers: {
      Location: "/success",        // React Router waali route
    },
  };
};
